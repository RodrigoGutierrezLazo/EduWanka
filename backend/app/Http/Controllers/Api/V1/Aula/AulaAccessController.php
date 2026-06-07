<?php

namespace App\Http\Controllers\Api\V1\Aula;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AulaAccessController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        if (in_array($user->role, ['prof', 'admin', 'superadmin'], true)) {
            return response()->json([
                'data' => [
                    'allowed' => true,
                    'reason' => 'role_access',
                ],
            ]);
        }

        // El acceso depende de la matricula validada, no de si el curso sigue publicado en el catalogo.
        $hasValidatedPurchase = Purchase::query()
            ->where('user_id', $user->id)
            ->where('status', 'validated')
            ->exists();

        if (! $hasValidatedPurchase) {
            return response()->json([
                'message' => 'Validated purchase required',
            ], 403);
        }

        return response()->json([
            'data' => [
                'allowed' => true,
                'reason' => 'validated_purchase',
            ],
        ]);
    }
}
