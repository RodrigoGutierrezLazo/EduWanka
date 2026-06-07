<?php

namespace App\Http\Controllers\Api\V1\Professor;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Purchase;
use App\Models\Certificate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

/**
 * Sprint 9/12 — Controlador de cursos para el docente responsable.
 *
 * Solo devuelve cursos donde assigned_prof_id = usuario autenticado.
 * Sprint 12: Agrega capacidades de creación y edición de cursos
 * para que el profesor gestione sus propios cursos.
 */
class ProfessorCourseController extends Controller
{
    /** Cursos asignados al profesor autenticado. */
    public function index(Request $request): JsonResponse
    {
        $prof = $request->user();

        $courses = Course::where('assigned_prof_id', $prof->id)
            ->with(['mainTeacher', 'assignedProf'])
            ->withCount([
                'purchases as enrolled_count' => fn($q) => $q->whereIn('status', [Purchase::STATUS_VALIDATED, Purchase::STATUS_PAID]),
                'certificates as certificates_count',
            ])
            ->latest()
            ->get();

        return response()->json(['data' => $courses]);
    }

    /** Detalle de un curso asignado al profesor (valida propiedad). */
    public function show(Request $request, int $courseId): JsonResponse
    {
        $prof = $request->user();

        $course = Course::where('id', $courseId)
            ->where('assigned_prof_id', $prof->id)
            ->with(['units.sessions.materials', 'mainTeacher', 'teachers'])
            ->firstOrFail();

        return response()->json(['data' => $course]);
    }

    /** Lista de estudiantes matriculados en un curso del profesor. */
    public function students(Request $request, int $courseId): JsonResponse
    {
        $prof = $request->user();

        // Verifica que el curso pertenece a este profesor
        $course = Course::where('id', $courseId)
            ->where('assigned_prof_id', $prof->id)
            ->firstOrFail();

        $purchases = Purchase::where('course_id', $courseId)
            ->whereIn('status', [Purchase::STATUS_VALIDATED, Purchase::STATUS_PAID])
            ->with('user')
            ->get();

        $students = $purchases->map(function ($purchase) use ($courseId) {
            $user = $purchase->user;

            // Certificado emitido (si existe)
            $certificate = Certificate::where('user_id', $user->id)
                ->where('course_id', $courseId)
                ->first();

            return [
                'user_id'          => $user->id,
                'name'             => $user->name,
                'last_name'        => $user->last_name,
                'email'            => $user->email,
                'enrolled_at'      => $purchase->created_at,
                'best_score'       => null,
                'passed'           => false,
                'has_certificate'  => !is_null($certificate),
                'certificate_code' => $certificate?->certificate_code,
            ];
        });

        return response()->json(['data' => $students]);
    }

    /**
     * Sprint 12 — Crear un nuevo curso auto-asignado al profesor.
     */
    public function store(Request $request): JsonResponse
    {
        $prof = $request->user();
        $data = $this->validatedCourse($request);

        // Auto-asignar al profesor actual
        $data['assigned_prof_id'] = $prof->id;
        $data['slug'] = $data['slug'] ?? Str::slug($data['title']);

        $teacherIds = $request->input('teacher_ids', []);
        $course = Course::create($data);

        if (is_array($teacherIds) && count($teacherIds) > 0) {
            $course->teachers()->sync($teacherIds);
        }

        return response()->json(
            $course->load(['mainTeacher', 'teachers', 'assignedProf']),
            201
        );
    }

    /**
     * Sprint 12 — Editar un curso que pertenece al profesor.
     */
    public function update(Request $request, int $courseId): JsonResponse
    {
        $prof = $request->user();

        $course = Course::where('id', $courseId)
            ->where('assigned_prof_id', $prof->id)
            ->firstOrFail();

        $data = $this->validatedCourse($request, true);
        if (array_key_exists('title', $data) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['title']);
        }

        $course->update($data);

        if ($request->has('teacher_ids')) {
            $teacherIds = $request->input('teacher_ids', []);
            $course->teachers()->sync(is_array($teacherIds) ? $teacherIds : []);
        }

        $course = $course->fresh();
        $course->load(['mainTeacher', 'teachers'])->loadCount([
            'purchases as enrolled_count' => fn($q) => $q->whereIn('status', ['validated', 'paid']),
        ]);

        return response()->json(['data' => $course]);
    }

    /**
     * Sprint 12 — Subir/reemplazar imagen de portada del curso del profesor.
     */
    public function uploadImage(Request $request, int $courseId): JsonResponse
    {
        $prof = $request->user();

        $course = Course::where('id', $courseId)
            ->where('assigned_prof_id', $prof->id)
            ->firstOrFail();

        $request->validate([
            'image' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp,avif', 'max:5120'],
        ]);

        $storageService = app(\App\Services\TenantStorageService::class);

        // Eliminar imagen anterior si era local
        if ($course->image_url && ! preg_match('#^https?://#i', $course->image_url)) {
            $oldPath = str_replace('/storage/tenants/', '', $course->image_url);
            $storageService->delete($oldPath);
        }

        $file = $request->file('image');
        $base = Str::slug($course->code ?: $course->title) ?: 'curso-'.$course->id;
        $filename = $base.'-'.now()->format('YmdHis');
        
        $path = $storageService->store($file, 'courses/images', $filename);
        $imageUrl = '/storage/tenants/' . ltrim($path, '/');

        $course->update(['image_url' => $imageUrl]);

        return response()->json([
            'message'   => 'Imagen actualizada',
            'image_url' => $imageUrl,
            'path'      => $path,
            'course'    => $course->fresh(),
        ]);
    }

    /**
     * Validación compartida para store/update.
     */
    private function validatedCourse(Request $request, bool $partial = false): array
    {
        if ($request->has('is_published')) {
            $published = filter_var($request->input('is_published'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($published !== null) {
                $request->merge(['is_published' => $published]);
            }
        }

        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'title'          => [$required, 'string', 'max:255'],
            'code'           => ['nullable', 'string', 'max:50'],
            'type'           => ['nullable', Rule::in(['Curso', 'Diplomado', 'Especialidad', 'Programa'])],
            'specialty'      => ['nullable', 'string', 'max:255'],
            'description'    => ['nullable', 'string'],
            'syllabus'       => ['nullable', 'array'],
            'syllabus.*'     => ['string', 'max:500'],
            'requirements'   => ['nullable', 'array'],
            'requirements.*' => ['string', 'max:500'],
            'price'          => [$required, 'numeric', 'min:0'],
            'duration_weeks' => [$required, 'integer', 'min:1', 'max:260'],
            'start_date'     => ['nullable', 'date'],
            'end_date'       => ['nullable', 'date', 'after_or_equal:start_date'],
            'hours'          => ['nullable', 'integer', 'min:1', 'max:9999'],
            'level'          => ['nullable', Rule::in(['basico', 'básico', 'intermedio', 'avanzado'])],
            'image_url'      => ['nullable', 'string', 'max:2048'],
            'teacher_name'   => ['nullable', 'string', 'max:255'],
            'teacher_id'     => ['nullable', 'integer', 'exists:teachers,id'],
            'is_published'   => ['sometimes', 'boolean'],
            'slug'           => ['nullable', 'string', 'max:255'],
        ]);
    }
}
