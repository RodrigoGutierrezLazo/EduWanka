<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Tenant;
use App\Models\User;

/**
 * Límites de cada plan SaaS. Es la contraparte en backend de lo que la
 * landing vende en /: antes de esto los planes eran decorativos y un tenant
 * "starter" podía crear cursos y alumnos sin tope (auditoría 2026-06-10).
 *
 * NULL = ilimitado.
 */
class PlanLimits
{
    public const LIMITS = [
        'starter' => [
            'courses' => 1,
            'students' => 30,
        ],
        'professional' => [
            'courses' => null,
            'students' => null,
        ],
        // Alias usados por tenants existentes sembrados con otros nombres
        'pro' => [
            'courses' => null,
            'students' => null,
        ],
        'enterprise' => [
            'courses' => null,
            'students' => null,
        ],
    ];

    /** @return array{courses: int|null, students: int|null} */
    public function forPlan(?string $plan): array
    {
        return self::LIMITS[$plan] ?? self::LIMITS['professional'];
    }

    /** @return array{courses: int, students: int} */
    public function usage(Tenant $tenant): array
    {
        return [
            'courses' => Course::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->count(),
            'students' => User::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->where('role', 'student')
                ->count(),
        ];
    }

    /**
     * Devuelve el motivo de bloqueo para crear un curso, o null si puede.
     */
    public function courseCreationBlockedReason(Tenant $tenant): ?string
    {
        if ($tenant->trialExpired()) {
            return 'Tu periodo de prueba terminó. Elige un plan para seguir creando cursos.';
        }

        $limit = $this->forPlan($tenant->plan)['courses'];
        if ($limit !== null && $this->usage($tenant)['courses'] >= $limit) {
            return "Tu plan {$tenant->plan} permite hasta {$limit} curso(s). Mejora tu plan para crear más.";
        }

        return null;
    }

    /**
     * Devuelve el motivo de bloqueo para registrar un estudiante, o null si puede.
     */
    public function studentRegistrationBlockedReason(Tenant $tenant): ?string
    {
        if ($tenant->trialExpired()) {
            return 'El periodo de prueba de esta institución terminó. Contacta al administrador del aula.';
        }

        $limit = $this->forPlan($tenant->plan)['students'];
        if ($limit !== null && $this->usage($tenant)['students'] >= $limit) {
            return "Esta institución alcanzó su límite de {$limit} estudiantes. El administrador puede ampliar su plan.";
        }

        return null;
    }
}
