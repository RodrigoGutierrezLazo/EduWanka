<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\PlanLimits;
use App\Services\TenantManager;
use Illuminate\Http\JsonResponse;

/**
 * Vista "Mi suscripción" del admin del aula (auditoría 2026-06-10,
 * hallazgo 2.4): plan contratado, consumo vs. límites y estado del trial.
 */
class AdminSubscriptionController extends Controller
{
    public function show(TenantManager $tenantManager, PlanLimits $planLimits): JsonResponse
    {
        $tenant = $tenantManager->getTenant();

        if (!$tenant) {
            return response()->json(['message' => 'El contexto de la institución es requerido.'], 400);
        }

        $limits = $planLimits->forPlan($tenant->plan);
        $usage = $planLimits->usage($tenant);

        return response()->json([
            'data' => [
                'plan' => $tenant->plan,
                'status' => $tenant->status,
                'on_trial' => $tenant->onTrial(),
                'trial_expired' => $tenant->trialExpired(),
                'trial_ends_at' => $tenant->trial_ends_at?->toIso8601String(),
                'trial_days_left' => $tenant->onTrial()
                    ? (int) ceil(now()->floatDiffInDays($tenant->trial_ends_at, false))
                    : null,
                'limits' => $limits,
                'usage' => $usage,
            ],
        ]);
    }
}
