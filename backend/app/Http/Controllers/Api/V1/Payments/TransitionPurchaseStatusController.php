<?php

namespace App\Http\Controllers\Api\V1\Payments;

use App\Models\Purchase;
use App\Models\PurchaseStatusAudit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Throwable;

class TransitionPurchaseStatusController
{
    public function __invoke(Request $request, Purchase $purchase): JsonResponse
    {
        // Validar autorización
        if (!auth()->check() || !in_array(auth()->user()->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Validar entrada
        $validated = $request->validate([
            'new_status' => 'required|in:pending_validation,validated,rejected,pending_payment,paid',
            'reason' => 'nullable|string|max:500',
        ]);

        $oldStatus = $purchase->status;
        $newStatus = $validated['new_status'];

        // Validar transición permitida
        if (!$this->isValidTransition($oldStatus, $newStatus)) {
            return response()->json([
                'message' => "Transición inválida: $oldStatus -> $newStatus",
                'allowed_transitions' => $this->getAllowedTransitions($oldStatus),
            ], 422);
        }

        // Actualizar compra — registrar fecha de pago al validar
        $updateData = ['status' => $newStatus];
        if (in_array($newStatus, ['validated', 'paid']) && ! $purchase->paid_at) {
            $updateData['paid_at'] = now();
        }
        $purchase->update($updateData);
        $purchase->loadMissing(['user', 'course']);

        // Registrar auditoría
        PurchaseStatusAudit::create([
            'purchase_id' => $purchase->id,
            'from_status' => $oldStatus,
            'to_status' => $newStatus,
            'reason' => $validated['reason'] ?? null,
            'changed_by_user_id' => auth()->id(),
        ]);

        if ($this->shouldSendAccessEmail($oldStatus, $newStatus)) {
            $this->sendAccessEmail($purchase);
        }

        return response()->json([
            'message' => 'Estado actualizado',
            'purchase' => $purchase->load(['user', 'course']),
        ]);
    }

    private function isValidTransition(string $from, string $to): bool
    {
        $validTransitions = [
            'pending_validation' => ['validated', 'rejected'],
            'validated' => ['paid'],
            'rejected' => ['pending_validation'],
            'pending_payment' => ['paid', 'rejected'],
            'paid' => [],
        ];

        return in_array($to, $validTransitions[$from] ?? []);
    }

    private function shouldSendAccessEmail(string $from, string $to): bool
    {
        return ! in_array($from, ['validated', 'paid'], true)
            && in_array($to, ['validated', 'paid'], true);
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
                    "Tu pago fue validado y ya tienes acceso al aula virtual de EduWanka para: {$courseTitle}.",
                    '',
                    "Correo de acceso: {$user->email}",
                    'Contrasena: la que registraste en el formulario de inscripcion.',
                    '',
                    "Ingresa aqui: {$loginUrl}",
                    '',
                    'Si no recuerdas tu contrasena, solicita el restablecimiento desde el aula o comunicate con soporte academico.',
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

    private function getAllowedTransitions(string $status): array
    {
        return [
            'pending_validation' => ['validated', 'rejected'],
            'validated' => ['paid'],
            'rejected' => ['pending_validation'],
            'pending_payment' => ['paid', 'rejected'],
            'paid' => [],
        ][$status] ?? [];
    }
}
