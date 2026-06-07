<?php

namespace App\Http\Controllers\Api\V1\Purchases;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Purchase;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;

/**
 * Endpoint público de inscripción / checkout.
 *
 * Soporta dos casos de uso:
 *  1. **Tests legacy / API simple**: name + email + password + course_code + amount + currency + payment_method=proof|culqi
 *  2. **Formulario EduWanka (FORMULARIOS INFO.md)**: campos extendidos del estudiante,
 *     elección de modalidad de pago (Yape/depósito vs Culqi), datos del depósito,
 *     entrega del certificado, etc.
 *
 * Las compras con `payment_method=proof` quedan en estado `pending_validation`
 * para que admin las revise. Las de `culqi` quedan en `pending_payment`.
 */
class RegisterPurchaseController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            // Datos del estudiante
            'name'             => ['required', 'string', 'max:255'],
            'last_name'        => ['nullable', 'string', 'max:255'],
            'email'            => ['required', 'email', 'max:255'],
            'password'         => ['required', 'string', 'min:8'],
            'dni'              => ['nullable', 'string', 'max:30'],
            'phone'            => ['nullable', 'string', 'max:50'],
            'city'             => ['nullable', 'string', 'max:120'],
            'academic_condition'        => ['nullable', Rule::in(['Abogado', 'Bachiller', 'Estudiante', 'Otro'])],
            'certification_institution' => ['nullable', Rule::in(['EduWanka', 'CAJ-Junin', 'CAJ-Ayacucho', 'CAJ-Huancavelica'])],

            // Curso e identificadores
            'course_code'      => ['required', 'string', 'max:120'],
            'amount'           => ['required', 'integer', 'min:1'],
            'currency'         => ['required', 'string', 'size:3'],
            'idempotency_key'  => ['required', 'string', 'max:120'],

            // Pago
            'payment_method'   => ['required', Rule::in(['proof', 'culqi'])],
            'payment_modality' => ['nullable', Rule::in(['single', 'installments'])],
            'bank_entity'      => ['nullable', 'string', 'max:50', 'regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.\-()\/]+$/u'],
            'operation_number' => ['nullable', 'string', 'max:80', 'regex:/^[a-zA-Z0-9\-\s]+$/'],
            'declared_amount'  => ['nullable', 'numeric', 'min:0'],
            'receipt'          => ['required_if:payment_method,proof', 'nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],

            // Logística del certificado
            'certificate_delivery' => ['nullable', Rule::in(['digital', 'pickup', 'delivery'])],
            'delivery_company'     => ['nullable', 'string', 'max:30'],
            'delivery_address'     => ['nullable', 'string', 'max:500'],
            'next_course_interest' => ['nullable', 'string', 'max:255'],

            // Declaración jurada
            'accepted_terms'   => ['nullable', 'boolean'],
        ]);

        // Idempotencia: si ya existe la misma key, devolverla sin duplicar
        $existing = Purchase::query()
            ->with('user')
            ->where('idempotency_key', $validated['idempotency_key'])
            ->first();

        if ($existing) {
            return response()->json([
                'data' => $this->toPayload($existing),
            ]);
        }

        if ($validated['payment_method'] === 'culqi' && ! $this->canAcceptCulqi()) {
            return response()->json([
                'message' => 'This payment method is not currently available.',
            ], 422);
        }

        // Crear o actualizar usuario con todos los campos del perfil
        $user = User::query()->firstOrCreate(
            ['email' => $validated['email']],
            [
                'name'                       => $validated['name'],
                'last_name'                  => $validated['last_name'] ?? null,
                'password'                   => Hash::make($validated['password']),
                'role'                       => 'student',
                'dni'                        => $validated['dni'] ?? null,
                'phone'                      => $validated['phone'] ?? null,
                'city'                       => $validated['city'] ?? null,
                'academic_condition'         => $validated['academic_condition'] ?? null,
            ],
        );

        if (! $user->wasRecentlyCreated && ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials for existing account',
            ], 401);
        }

        // Si el usuario ya existía y ahora aporta nuevos datos del perfil, actualizarlos sin sobreescribir lo existente
        if (! $user->wasRecentlyCreated) {
            $profileUpdates = array_filter([
                'last_name'                 => $validated['last_name'] ?? null,
                'dni'                       => $validated['dni'] ?? null,
                'phone'                     => $validated['phone'] ?? null,
                'city'                      => $validated['city'] ?? null,
                'academic_condition'        => $validated['academic_condition'] ?? null,
            ], fn ($v) => $v !== null && $v !== '');

            if (! empty($profileUpdates)) {
                $user->fill(array_merge($profileUpdates, $user->only(array_keys(array_filter($user->only(array_keys($profileUpdates)))))));
                // Sólo escribir los que están vacíos en BD para no pisar manualmente
                foreach ($profileUpdates as $field => $value) {
                    if (empty($user->{$field})) {
                        $user->{$field} = $value;
                    }
                }
                $user->save();
            }
        }

        // Resolver course_id desde el course_code si existe
        $courseId = Course::query()->where('code', strtoupper($validated['course_code']))->value('id');

        // Estado inicial según método
        if ($validated['payment_method'] === 'proof') {
            $receiptPath = $request->file('receipt')?->store('purchases/receipts', 'public');
            $status = 'pending_validation';
            $paymentProvider = null;
        } else {
            $receiptPath = null;
            $status = 'pending_payment';
            $paymentProvider = 'culqi';
        }

        $purchase = Purchase::query()->create([
            'user_id'              => $user->id,
            'course_id'            => $courseId,
            'course_code'          => strtoupper($validated['course_code']),
            'amount'               => $validated['amount'],
            'currency'             => strtoupper($validated['currency']),
            'payment_method'       => $validated['payment_method'],
            'payment_provider'     => $paymentProvider,
            'status'               => $status,
            'receipt_path'         => $receiptPath,
            'idempotency_key'      => $validated['idempotency_key'],
            'payment_modality'     => $validated['payment_modality'] ?? null,
            'bank_entity'          => $validated['bank_entity'] ?? null,
            'operation_number'     => $validated['operation_number'] ?? null,
            'declared_amount'      => $validated['declared_amount'] ?? null,
            'certificate_delivery' => $validated['certificate_delivery'] ?? null,
            'delivery_company'     => $validated['delivery_company'] ?? null,
            'delivery_address'     => $validated['delivery_address'] ?? null,
            'next_course_interest' => $validated['next_course_interest'] ?? null,
            'accepted_terms_at'    => ! empty($validated['accepted_terms']) ? now() : null,
            'certification_institution' => $validated['certification_institution'] ?? null,
        ]);

        $purchase->load('user');

        return response()->json([
            'data' => $this->toPayload($purchase),
        ], 201);
    }

    public function storeForAuthenticatedUser(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user && in_array($user->role, ['admin', 'superadmin', 'prof'])) {
            return response()->json([
                'message' => 'Las cuentas de staff (admin, superadmin, profesor) no pueden realizar compras.',
            ], 403);
        }

        $validated = $request->validate([
            'course_id'        => [
                'required',
                'integer',
                Rule::exists('courses', 'id')->where('is_published', true),
            ],
            'amount'           => ['required', 'integer', 'min:1'],
            'currency'         => ['required', 'string', 'size:3'],
            'idempotency_key'  => ['required', 'string', 'max:120'],

            'payment_method'   => ['required', Rule::in(['proof', 'culqi'])],
            'payment_modality' => ['nullable', Rule::in(['single', 'installments'])],
            'bank_entity'      => ['nullable', 'string', 'max:50', 'regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.\-()\/]+$/u'],
            'operation_number' => ['nullable', 'string', 'max:80', 'regex:/^[a-zA-Z0-9\-\s]+$/'],
            'declared_amount'  => ['nullable', 'numeric', 'min:0'],
            'receipt'          => ['required_if:payment_method,proof', 'nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],

            'certification_institution' => ['nullable', Rule::in(['EduWanka', 'CAJ-Junin', 'CAJ-Ayacucho', 'CAJ-Huancavelica'])],
            'certificate_delivery'      => ['nullable', Rule::in(['digital', 'pickup', 'delivery'])],
            'delivery_company'          => ['nullable', 'string', 'max:30'],
            'delivery_address'          => ['nullable', 'string', 'max:500'],
            'next_course_interest'      => ['nullable', 'string', 'max:255'],
            'accepted_terms'            => ['nullable', 'boolean'],
        ]);

        $existing = Purchase::query()
            ->with('user')
            ->where('idempotency_key', $validated['idempotency_key'])
            ->first();

        if ($existing) {
            return response()->json([
                'data' => $this->toPayload($existing),
            ]);
        }

        /** @var User $user */
        $user = $request->user();
        $course = Course::query()->findOrFail($validated['course_id']);
        $courseCode = $course->code ?: 'COURSE-'.$course->id;

        $activeDuplicate = Purchase::query()
            ->where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->whereIn('status', [
                Purchase::STATUS_PENDING_VALIDATION,
                Purchase::STATUS_PENDING_PAYMENT,
                Purchase::STATUS_VALIDATED,
                Purchase::STATUS_PAID,
            ])
            ->first();

        if ($activeDuplicate) {
            throw ValidationException::withMessages([
                'course_id' => ['Ya tienes una inscripcion o compra activa para este curso.'],
            ]);
        }

        if ($validated['payment_method'] === 'culqi' && ! $this->canAcceptCulqi()) {
            return response()->json([
                'message' => 'This payment method is not currently available.',
            ], 422);
        }

        if ($validated['payment_method'] === 'proof') {
            $receiptPath = $request->file('receipt')?->store('purchases/receipts', 'public');
            $status = Purchase::STATUS_PENDING_VALIDATION;
            $paymentProvider = null;
        } else {
            $receiptPath = null;
            $status = Purchase::STATUS_PENDING_PAYMENT;
            $paymentProvider = 'culqi';
        }

        $purchase = Purchase::query()->create([
            'user_id'              => $user->id,
            'course_id'            => $course->id,
            'course_code'          => strtoupper($courseCode),
            'amount'               => $validated['amount'],
            'currency'             => strtoupper($validated['currency']),
            'payment_method'       => $validated['payment_method'],
            'payment_provider'     => $paymentProvider,
            'status'               => $status,
            'receipt_path'         => $receiptPath,
            'idempotency_key'      => $validated['idempotency_key'],
            'payment_modality'     => $validated['payment_modality'] ?? null,
            'bank_entity'          => $validated['bank_entity'] ?? null,
            'operation_number'     => $validated['operation_number'] ?? null,
            'declared_amount'      => $validated['declared_amount'] ?? null,
            'certificate_delivery' => $validated['certificate_delivery'] ?? null,
            'delivery_company'     => $validated['delivery_company'] ?? null,
            'delivery_address'     => $validated['delivery_address'] ?? null,
            'next_course_interest' => $validated['next_course_interest'] ?? null,
            'accepted_terms_at'    => ! empty($validated['accepted_terms']) ? now() : null,
            'certification_institution' => $validated['certification_institution'] ?? null,
        ]);

        $purchase->load(['user', 'course']);

        return response()->json([
            'data' => $this->toPayload($purchase),
        ], 201);
    }

    private function toPayload(Purchase $purchase): array
    {
        return [
            'id'               => $purchase->id,
            'course_id'        => $purchase->course_id,
            'user'             => [
                'id'    => $purchase->user->id,
                'name'  => $purchase->user->name,
                'email' => $purchase->user->email,
                'role'  => $purchase->user->role,
            ],
            'course_code'      => $purchase->course_code,
            'amount'           => $purchase->amount,
            'currency'         => $purchase->currency,
            'payment_method'   => $purchase->payment_method,
            'payment_provider' => $purchase->payment_provider,
            'status'           => $purchase->status,
            'receipt_path'     => $purchase->receipt_path,
            'idempotency_key'  => $purchase->idempotency_key,
        ];
    }

    private function canAcceptCulqi(): bool
    {
        $enabled = (bool) config('services.culqi.enabled');
        $publicKey = (string) config('services.culqi.public_key', '');
        $secretKey = (string) config('services.culqi.secret_key', '');

        return $enabled
            && str_starts_with($publicKey, 'pk_')
            && str_starts_with($secretKey, 'sk_');
    }
}
