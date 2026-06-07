<?php

namespace App\Http\Controllers\Api\V1\Aula;

use App\Http\Controllers\Controller;
use App\Models\ContentItem;
use App\Models\ContentProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContentProgressController extends Controller
{
    /**
     * Mark a content item (like a video) as completed for the authenticated user.
     */
    public function complete(Request $request, int $itemId): JsonResponse
    {
        $user = $request->user();

        $item = ContentItem::findOrFail($itemId);

        // Optional: Ensure the user actually owns the course via a purchase or enrollment check
        // Assuming access is checked at a higher middleware or standard policy.

        $progress = ContentProgress::firstOrCreate(
            [
                'user_id' => $user->id,
                'content_item_id' => $item->id,
            ],
            [
                'completed_at' => now(),
            ]
        );

        return response()->json([
            'message' => 'Contenido marcado como completado.',
            'data' => $progress,
        ]);
    }
}
