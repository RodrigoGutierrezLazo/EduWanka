<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\PlanLimits;
use App\Services\TenantManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;

class RegisterController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $tenantManager = app(TenantManager::class);

        if (!$tenantManager->hasTenant()) {
            return response()->json([
                'message' => 'El contexto de la institución es requerido.'
            ], 400);
        }

        // Límite de estudiantes del plan SaaS (auditoría 2026-06-10): el plan
        // starter admite hasta 30 estudiantes; el trial vencido bloquea altas.
        $reason = app(PlanLimits::class)->studentRegistrationBlockedReason($tenantManager->getTenant());
        if ($reason !== null) {
            return response()->json([
                'message' => $reason,
                'code' => 'plan_limit_reached',
            ], 402);
        }

        // La unicidad de email/dni ahora es POR TENANT (hallazgo 2.1): dos
        // instituciones distintas pueden tener un usuario con el mismo correo o
        // DNI sin colisionar. Acotamos la regla `unique` al tenant en contexto.
        $tenantId = $tenantManager->getTenantId();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->where(fn ($q) => $q->where('tenant_id', $tenantId))],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'dni' => ['required', 'string', 'max:20', Rule::unique('users', 'dni')->where(fn ($q) => $q->where('tenant_id', $tenantId))],
            'phone' => ['required', 'string', 'max:20'],
            'city' => ['nullable', 'string', 'max:255'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'last_name' => $data['last_name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => 'student',
            'dni' => $data['dni'],
            'phone' => $data['phone'],
            'city' => $data['city'] ?? null,
            'tenant_id' => $tenantManager->getTenantId(),
        ]);

        Auth::guard('web')->login($user);

        // Ver nota en LoginController: solo regeneramos la sesión si Sanctum
        // realmente inició una para esta petición (request reconocida como del
        // SPA). De lo contrario `$request->session()` lanzaría
        // `RuntimeException: Session store not set on request.`
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ], 201);
    }
}
