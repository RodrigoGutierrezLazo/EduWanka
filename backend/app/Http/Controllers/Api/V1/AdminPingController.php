<?php

namespace App\Http\Controllers\Api\V1;

use Illuminate\Http\JsonResponse;

class AdminPingController
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'message' => 'ok',
        ]);
    }
}
