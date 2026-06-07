<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicTeachersController extends Controller
{
    /**
     * Docentes destacados para la sección del home.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Teacher::query()
            ->where('is_featured', true)
            ->orderBy('display_order')
            ->orderBy('name');

        $teachers = $query->get()->map(fn (Teacher $t) => $this->payload($t));

        return response()->json(['data' => $teachers]);
    }

    /**
     * Perfil público de un docente.
     */
    public function show(Teacher $teacher): JsonResponse
    {
        return response()->json(['data' => $this->payload($teacher)]);
    }

    private function payload(Teacher $teacher): array
    {
        return [
            'id'          => $teacher->id,
            'name'        => $teacher->name,
            'title'       => $teacher->title,
            'specialty'   => $teacher->specialty,
            'bio'         => $teacher->bio,
            'credentials' => $teacher->credentials,
            'photo_url'   => $this->resolvePhotoUrl($teacher->photo_url),
            'email'       => $teacher->email,
        ];
    }

    private function resolvePhotoUrl(?string $photoUrl): ?string
    {
        if (! $photoUrl) {
            return null;
        }

        if (preg_match('#^https?://#i', $photoUrl)) {
            return $photoUrl;
        }

        return '/storage/' . ltrim($photoUrl, '/');
    }
}
