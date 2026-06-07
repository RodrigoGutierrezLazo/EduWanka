<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Specialty;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicSpecialtiesController extends Controller
{
    /**
     * List all specialties ordered by their custom order.
     */
    public function index(): JsonResponse
    {
        $specialties = Specialty::query()
            ->orderByRaw("CASE WHEN type = 'formacion' THEN 0 ELSE 1 END asc")
            ->orderBy('order', 'asc')
            ->get();

        return response()->json(['data' => $specialties]);
    }

    /**
     * Show detail of a single specialty.
     * Eager loads published courses if type is 'derecho'.
     */
    public function show(string $idOrSlug): JsonResponse
    {
        $specialty = Specialty::query()
            ->where('id', $idOrSlug)
            ->orWhere('slug', $idOrSlug)
            ->firstOrFail();

        // If it's a derecho specialty, eager-load the related courses for category catalog
        if ($specialty->type === 'derecho') {
            $courses = $specialty->publishedCourses()
                ->with(['mainTeacher:id,name,title,specialty,photo_url', 'teachers:id,name,title,photo_url'])
                ->latest()
                ->get()
                ->map(function ($course) {
                    $mainTeacher = $course->mainTeacher ? [
                        'id'        => $course->mainTeacher->id,
                        'name'      => $course->mainTeacher->name,
                        'title'     => $course->mainTeacher->title,
                        'specialty' => $course->mainTeacher->specialty,
                        'photo_url' => $this->resolveImageUrl($course->mainTeacher->photo_url),
                    ] : null;

                    return [
                        'id'             => $course->id,
                        'slug'           => $course->slug,
                        'title'          => $course->title,
                        'code'           => $course->code,
                        'type'           => $course->type ?? 'Curso',
                        'description'    => $course->description,
                        'price'          => (float) $course->price,
                        'price_label'    => 'S/ '.number_format((float) $course->price, 2),
                        'duration_weeks' => $course->duration_weeks,
                        'start_date'     => $course->start_date?->format('Y-m-d'),
                        'hours'          => $course->hours,
                        'level'          => $course->level,
                        'image_url'      => $this->resolveImageUrl($course->image_url),
                        'teacher_name'   => $course->teacher_name ?? ($mainTeacher['name'] ?? null),
                        'main_teacher'   => $mainTeacher,
                    ];
                });

            // Append courses to response
            $specialtyData = $specialty->toArray();
            $specialtyData['courses'] = $courses;
            return response()->json(['data' => $specialtyData]);
        }

        return response()->json(['data' => $specialty]);
    }

    private function resolveImageUrl(?string $imageUrl): ?string
    {
        if (! $imageUrl) {
            return null;
        }

        if (preg_match('#^https?://#i', $imageUrl)) {
            return $imageUrl;
        }

        return '/storage/' . ltrim($imageUrl, '/');
    }
}
