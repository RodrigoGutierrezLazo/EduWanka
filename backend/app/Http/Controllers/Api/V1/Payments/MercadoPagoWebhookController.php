<?php

namespace App\Http\Controllers\Api\V1\Payments;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use App\Models\PurchaseStatusAudit;
use App\Services\PaymentGatewayService;
use App\Services\TenantManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class MercadoPagoWebhookController extends Controller
{
    public function __invoke(Request $request, PaymentGatewayService $gateway)
    {
        Log::info('Mercado Pago Webhook payload: ', $request->all());

        // El webhook puede enviar la info de diferentes maneras
        $type = $request->input('type') ?? $request->input('topic');
        $paymentId = $request->input('data.id') ?? $request->input('id');

        if ($type === 'payment' && $paymentId) {
            $payment = $gateway->getPaymentDetails($paymentId);

            if ($payment && isset($payment['external_reference'])) {
                $purchaseId = $payment['external_reference'];
                $status = $payment['status']; // approved, rejected, in_process, etc.
                
                // Buscar compra omitiendo scopes de tenant (ya que viene sin dominio ni slug)
                $purchase = Purchase::withoutGlobalScopes()
                    ->with('user')
                    ->find($purchaseId);

                if (!$purchase) {
                    Log::warning("Mercado Pago Webhook: Compra {$purchaseId} no encontrada.");
                    return response()->json(['message' => 'Purchase not found'], 404);
                }

                // Si ya está pagada o validada, no hacemos nada
                if (in_array($purchase->status, ['paid', 'validated'])) {
                    return response()->json(['message' => 'Already processed']);
                }

                // Resolver temporalmente el tenant de la compra
                if ($purchase->tenant_id) {
                    $tenant = \App\Models\Tenant::find($purchase->tenant_id);
                    if ($tenant) {
                        app(TenantManager::class)->setTenant($tenant);
                    }
                }

                $oldStatus = $purchase->status;

                if ($status === 'approved') {
                    $newStatus = 'paid';
                    
                    $purchase->update([
                        'status' => $newStatus,
                        'paid_at' => now(),
                    ]);

                    // Registrar auditoría
                    PurchaseStatusAudit::create([
                        'purchase_id' => $purchase->id,
                        'from_status' => $oldStatus,
                        'to_status' => $newStatus,
                        'reason' => 'Pago aprobado por Mercado Pago (IPN)',
                        'changed_by_user_id' => $purchase->user_id,
                    ]);

                    // Enviar email de acceso (si aplica)
                    $this->sendAccessEmail($purchase);

                    Log::info("Mercado Pago Webhook: Compra {$purchaseId} marcada como pagada.");
                } elseif ($status === 'rejected') {
                    $newStatus = 'rejected';

                    $purchase->update(['status' => $newStatus]);

                    PurchaseStatusAudit::create([
                        'purchase_id' => $purchase->id,
                        'from_status' => $oldStatus,
                        'to_status' => $newStatus,
                        'reason' => 'Pago rechazado por Mercado Pago (IPN)',
                        'changed_by_user_id' => $purchase->user_id,
                    ]);

                    Log::info("Mercado Pago Webhook: Compra {$purchaseId} rechazada.");
                }
            }
        }

        return response()->json(['message' => 'OK']);
    }

    private function sendAccessEmail(Purchase $purchase): void
    {
        $user = $purchase->user;

        if (! $user?->email) {
            return;
        }

        $courseTitle = $purchase->course?->title ?? $purchase->course_code ?? 'tu curso';
        $loginUrl = rtrim((string) config('app.url'), '/') . '/login';

        try {
            Mail::raw(
                implode("\n", [
                    "Hola {$user->name},",
                    '',
                    "Tu pago fue aprobado y ya tienes acceso al aula virtual de EduWanka para: {$courseTitle}.",
                    '',
                    "Correo de acceso: {$user->email}",
                    'Contraseña: la que registraste en el formulario de inscripción.',
                    '',
                    "Ingresa aquí: {$loginUrl}",
                    '',
                    'Si no recuerdas tu contraseña, solicita el restablecimiento desde el aula o comunícate con soporte académico.',
                ]),
                function ($message) use ($user): void {
                    $message->to($user->email, $user->name)
                        ->subject('Acceso habilitado al aula virtual EduWanka');
                },
            );
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
