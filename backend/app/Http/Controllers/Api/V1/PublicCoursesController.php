<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicCoursesController extends Controller
{
    /**
     * Catálogo público de cursos publicados.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Course::query()
            ->where('is_published', true)
            ->with(['mainTeacher:id,name,title,specialty,photo_url', 'teachers:id,name,title,photo_url'])
            ->latest();

        if ($search = trim((string) $request->query('search', ''))) {
            $query->where(function ($q) use ($search): void {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('teacher_name', 'like', "%{$search}%");
            });
        }

        $courses = $query->get()->map(fn (Course $c) => $this->payload($c));

        return response()->json(['data' => $courses]);
    }

    /**
     * Detalle público de un curso (por id o slug).
     */
    public function show(string $idOrSlug): JsonResponse
    {
        $course = Course::query()
            ->where('is_published', true)
            ->with(['mainTeacher:id,name,title,specialty,bio,credentials,photo_url', 'teachers:id,name,title,specialty,bio,credentials,photo_url'])
            ->where(function ($q) use ($idOrSlug): void {
                $q->where('id', $idOrSlug)->orWhere('slug', $idOrSlug);
            })
            ->firstOrFail();

        return response()->json(['data' => $this->payload($course)]);
    }

    private function payload(Course $course): array
    {
        // Resolver docentes del pivot como mini perfiles
        $teachers = $course->teachers->map(fn ($t) => [
            'id'        => $t->id,
            'name'      => $t->name,
            'title'     => $t->title,
            'specialty' => $t->specialty,
            'bio'       => $t->bio ?? null,
            'credentials' => $t->credentials ?? null,
            'photo_url' => $this->resolveImageUrl($t->photo_url),
        ])->values()->toArray();

        // Docente principal
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
            'specialty'      => $course->specialty,
            'description'    => $course->description,
            'syllabus'       => $course->syllabus ?? [],
            'requirements'   => $course->requirements ?? [],
            'price'          => (float) $course->price,
            'price_label'    => 'S/ '.number_format((float) $course->price, 2),
            'duration_weeks' => $course->duration_weeks,
            'start_date'     => $course->start_date?->format('Y-m-d'),
            'end_date'       => $course->end_date?->format('Y-m-d'),
            'hours'          => $course->hours,
            'level'          => $course->level,
            'category'       => ucfirst((string) ($course->level ?? 'general')),
            'image_url'      => $this->resolveImageUrl($course->image_url),
            'teacher_name'   => $course->teacher_name ?? ($mainTeacher['name'] ?? null),
            'main_teacher'   => $mainTeacher,
            'teachers'       => $teachers,
            'is_published'   => (bool) $course->is_published,
            'created_at'     => $course->created_at,
        ];
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
