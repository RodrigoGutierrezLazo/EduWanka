<?php

namespace App\Http\Controllers\Api\V1\Learning;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LatestCertificateController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $certificate = Certificate::query()
            ->where('user_id', $request->user()->id)
            ->latest('id')
            ->first();

        if (! $certificate) {
            return response()->json(['message' => 'Certificate not found'], 404);
        }

        return response()->json([
            'data' => [
                'id' => $certificate->id,
                'user_id' => $certificate->user_id,
                'course_code' => $certificate->course_code,
                'score' => $certificate->score,
                'certificate_code' => $certificate->certificate_code,
            ],
        ]);
    }
}
