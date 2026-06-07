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
    /** Tolerancia de redondeo (en soles) al comparar el monto reportado por Mercado Pago contra purchase->amount */
    private const AMOUNT_TOLERANCE = 1.0;

    public function __invoke(Request $request, PaymentGatewayService $gateway)
    {
        Log::info('Mercado Pago Webhook payload: ', $request->all());

        if (! $this->hasValidSignature($request)) {
            Log::warning('Mercado Pago Webhook: firma invalida o ausente.', [
                'ip' => $request->ip(),
                'x-request-id' => $request->header('x-request-id'),
            ]);

            return response()->json(['message' => 'Invalid signature'], 401);
        }

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
                    if (! $this->amountMatches($payment, $purchase)) {
                        Log::warning("Mercado Pago Webhook: el monto reportado para la compra {$purchaseId} no coincide con el registrado. La compra permanece pendiente.", [
                            'purchase_id' => $purchase->id,
                            'purchase_amount' => $purchase->amount,
                            'transaction_amount' => $payment['transaction_amount'] ?? null,
                        ]);

                        return response()->json(['message' => 'Amount mismatch'], 422);
                    }

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

    /**
     * Verifica la cabecera `x-signature` (esquema HMAC-SHA256 de Mercado Pago) usando
     * MERCADOPAGO_WEBHOOK_SECRET. Sin secreto configurado, o sin firma/cabeceras
     * presentes, se rechaza el webhook (fail closed) para evitar que cualquiera pueda
     * marcar compras como pagadas simplemente llamando al endpoint.
     *
     * Manifiesto esperado: "id:{data.id};request-id:{x-request-id};ts:{ts};"
     * @see https://www.mercadopago.com.pe/developers/es/docs/your-integrations/notifications/webhooks
     */
    private function hasValidSignature(Request $request): bool
    {
        $secret = config('services.mercadopago.webhook_secret');

        if (empty($secret)) {
            Log::warning('Mercado Pago Webhook: MERCADOPAGO_WEBHOOK_SECRET no esta configurado; se rechaza la notificacion.');
            return false;
        }

        $signatureHeader = (string) $request->header('x-signature');
        $requestId = (string) $request->header('x-request-id');
        $dataId = (string) ($request->query('data.id') ?? $request->query('data_id') ?? $request->input('data.id') ?? '');

        if ($signatureHeader === '' || $requestId === '' || $dataId === '') {
            return false;
        }

        $parts = [];
        foreach (explode(',', $signatureHeader) as $piece) {
            [$key, $value] = array_pad(explode('=', trim($piece), 2), 2, null);
            if ($key !== null && $value !== null) {
                $parts[trim($key)] = trim($value);
            }
        }

        $timestamp = $parts['ts'] ?? null;
        $expectedHash = $parts['v1'] ?? null;

        if (! $timestamp || ! $expectedHash) {
            return false;
        }

        $manifest = "id:" . strtolower($dataId) . ";request-id:{$requestId};ts:{$timestamp};";
        $computedHash = hash_hmac('sha256', $manifest, $secret);

        return hash_equals($computedHash, $expectedHash);
    }

    /**
     * Compara el monto reportado por Mercado Pago contra el monto registrado en la
     * compra (calculado en servidor desde Course::price), con una tolerancia de
     * redondeo, para evitar marcar como pagada una compra cuyo importe fue alterado.
     */
    private function amountMatches(array $payment, Purchase $purchase): bool
    {
        $reportedAmount = $payment['transaction_amount'] ?? null;

        if ($reportedAmount === null) {
            return false;
        }

        return abs((float) $reportedAmount - (float) $purchase->amount) <= self::AMOUNT_TOLERANCE;
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
