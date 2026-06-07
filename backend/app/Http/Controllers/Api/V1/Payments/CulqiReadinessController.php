<?php

namespace App\Http\Controllers\Api\V1\Payments;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class CulqiReadinessController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $enabled = (bool) config('services.culqi.enabled');
        $publicKey = (string) config('services.culqi.public_key', '');
        $secretKey = (string) config('services.culqi.secret_key', '');
        $keysConfigured = str_starts_with($publicKey, 'pk_')
            && str_starts_with($secretKey, 'sk_');

        return response()->json([
            'data' => [
                'provider' => 'culqi',
                'enabled' => $enabled,
                'keys_configured' => $keysConfigured,
                'can_accept_culqi' => $enabled && $keysConfigured,
                'rollback_ready' => true,
                'rollback_mode' => !$enabled,
            ],
        ]);
    }
}
