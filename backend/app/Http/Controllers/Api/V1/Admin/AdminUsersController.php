<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\TenantManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminUsersController extends Controller
{
    /**
     * Jerarquía de roles (mayor número = mayor rango):
     *   student(0) < prof(1) < admin(2) < superadmin(3)
     *
     * Reglas:
     *  - Nadie puede eliminarse a sí mismo.
     *  - Un usuario solo puede crear/editar/eliminar usuarios de rango INFERIOR.
     *  - Un admin NO puede crear ni editar superadmins.
     *  - Un superadmin puede gestionar a todos excepto a sí mismo (eliminación).
     */
    private const ROLE_RANK = [
        'student'    => 0,
        'prof'       => 1,
        'admin'      => 2,
        'superadmin' => 3,
    ];

    private function rankOf(?string $role): int
    {
        return self::ROLE_RANK[$role ?? 'student'] ?? 0;
    }

    /** Roles que el usuario autenticado puede asignar (solo inferiores a él). */
    private function allowedRolesFor(Request $request): array
    {
        $myRank = $this->rankOf($request->user()?->role);
        return array_keys(array_filter(self::ROLE_RANK, fn(int $r) => $r < $myRank));
    }

    public function index(Request $request): JsonResponse
    {
        $query = User::query()->latest();

        if ($search = trim((string) $request->query('search', ''))) {
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('dni', 'like', "%{$search}%");
            });
        }

        if ($role = $request->query('role')) {
            $query->where('role', $role);
        }

        return response()->json($query->paginate(min((int) $request->query('per_page', 50), 200)));
    }

    public function store(Request $request): JsonResponse
    {
        $allowed = $this->allowedRolesFor($request);

        // Unicidad de email por tenant (hallazgo 2.1): el correo solo debe ser
        // único dentro de la institución en contexto, no globalmente.
        $tenantId = app(TenantManager::class)->getTenantId();

        // Límite de estudiantes del plan SaaS (auditoría 2026-06-10)
        $tenant = app(TenantManager::class)->getTenant();
        if ($request->input('role') === 'student' && $tenant
            && ($reason = app(\App\Services\PlanLimits::class)->studentRegistrationBlockedReason($tenant))) {
            return response()->json([
                'message' => $reason,
                'code' => 'plan_limit_reached',
            ], 402);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.\-,]+$/u'],
            'last_name' => ['nullable', 'string', 'max:255', 'regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.\-,]+$/u'],
            'email' => ['required', 'email:rfc,dns', 'max:255', Rule::unique('users', 'email')->where(fn ($q) => $q->where('tenant_id', $tenantId))],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in($allowed)],
            'dni' => ['nullable', 'string', 'max:30', 'regex:/^[a-zA-Z0-9]+$/'],
            'phone' => ['nullable', 'string', 'max:50', 'regex:/^[0-9+\s\-()]+$/'],
            'city' => ['nullable', 'string', 'max:255', 'regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,\-]+$/u'],
            'academic_condition' => ['nullable', 'string', 'max:255'],
            'avatar_url' => ['nullable', 'string', 'max:2048'],
        ], [
            'name.regex'      => 'El nombre solo puede contener letras, espacios, puntos y guiones.',
            'last_name.regex' => 'Los apellidos solo pueden contener letras, espacios, puntos y guiones.',
            'email.email'     => 'Ingrese un correo electrónico válido.',
            'dni.regex'       => 'El DNI solo puede contener letras y números.',
            'phone.regex'     => 'El teléfono solo puede contener números, +, espacios, guiones y paréntesis.',
            'city.regex'      => 'La ciudad solo puede contener letras, números, espacios y signos básicos.',
        ]);

        $data['password'] = Hash::make($data['password']);

        return response()->json(User::create($data), 201);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json($user);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        // Un admin no puede editar a alguien de rango igual o superior (salvo a sí mismo para datos básicos)
        if (! $request->user()->is($user) && $this->rankOf($user->role) >= $this->rankOf($request->user()->role)) {
            return response()->json(['message' => 'No tienes permisos para editar a un usuario de rango igual o superior.'], 403);
        }

        $allowed = $this->allowedRolesFor($request);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255', 'regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.\-,]+$/u'],
            'last_name' => ['nullable', 'string', 'max:255', 'regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.\-,]+$/u'],
            'email' => ['sometimes', 'required', 'email:rfc,dns', 'max:255', Rule::unique('users', 'email')->ignore($user->id)->where(fn ($q) => $q->where('tenant_id', $user->tenant_id))],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['sometimes', 'required', Rule::in($allowed)],
            'dni' => ['nullable', 'string', 'max:30', 'regex:/^[a-zA-Z0-9]+$/'],
            'phone' => ['nullable', 'string', 'max:50', 'regex:/^[0-9+\s\-()]+$/'],
            'city' => ['nullable', 'string', 'max:255', 'regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,\-]+$/u'],
            'academic_condition' => ['nullable', 'string', 'max:255'],
            'avatar_url' => ['nullable', 'string', 'max:2048'],
        ], [
            'name.regex'      => 'El nombre solo puede contener letras, espacios, puntos y guiones.',
            'last_name.regex' => 'Los apellidos solo pueden contener letras, espacios, puntos y guiones.',
            'email.email'     => 'Ingrese un correo electrónico válido.',
            'dni.regex'       => 'El DNI solo puede contener letras y números.',
            'phone.regex'     => 'El teléfono solo puede contener números, +, espacios, guiones y paréntesis.',
            'city.regex'      => 'La ciudad solo puede contener letras, números, espacios y signos básicos.',
        ]);

        if (empty($data['password'])) {
            unset($data['password']);
        } else {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);

        return response()->json($user->fresh());
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($request->user()->is($user)) {
            return response()->json(['message' => 'No puedes eliminar tu propio usuario.'], 422);
        }

        // No se puede eliminar a alguien de rango igual o superior
        if ($this->rankOf($user->role) >= $this->rankOf($request->user()->role)) {
            return response()->json(['message' => 'No tienes permisos para eliminar a un usuario de rango igual o superior.'], 403);
        }

        // Desvincular pagos para preservar historial financiero
        $user->purchases()->update(['user_id' => null]);

        $user->delete();

        return response()->json(['message' => 'Usuario eliminado']);
    }

    public function resetPassword(Request $request, User $user): JsonResponse
    {
        // No se puede resetear contraseña de alguien de rango igual o superior (salvo a uno mismo)
        if (! $request->user()->is($user) && $this->rankOf($user->role) >= $this->rankOf($request->user()->role)) {
            return response()->json(['message' => 'No tienes permisos para resetear la contraseña de un usuario de rango igual o superior.'], 403);
        }

        $password = Str::password(12);
        $user->forceFill(['password' => Hash::make($password)])->save();

        return response()->json([
            'message' => 'Contraseña actualizada',
            'password' => $password,
        ]);
    }

    public function resetByEmail(string $email): JsonResponse
    {
        $user = User::where('email', $email)->firstOrFail();

        return $this->resetPassword($user);
    }
    /** Devuelve los roles que el usuario autenticado puede asignar. */
    public function availableRoles(Request $request): JsonResponse
    {
        return response()->json(['roles' => $this->allowedRolesFor($request)]);
    }

    public function updateRole(Request $request, User $user): JsonResponse
    {
        $allowed = $this->allowedRolesFor($request);

        $data = $request->validate([
            'role' => ['required', Rule::in($allowed)],
        ]);

        // No se puede cambiar el rol a alguien de rango igual o superior
        if ($this->rankOf($user->role) >= $this->rankOf($request->user()->role)) {
            return response()->json(['message' => 'No tienes permisos para cambiar el rol de un usuario de rango igual o superior.'], 403);
        }

        if ($request->user()->is($user)) {
            return response()->json(['message' => 'No puedes cambiar tu propio rol.'], 422);
        }

        $user->update(['role' => $data['role']]);

        return response()->json(['message' => 'Rol actualizado', 'user' => $user->fresh()]);
    }
}
