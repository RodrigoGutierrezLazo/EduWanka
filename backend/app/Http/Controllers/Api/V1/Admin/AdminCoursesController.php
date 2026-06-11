<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Services\PlanLimits;
use App\Services\TenantManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminCoursesController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Course::query()
            ->with(['mainTeacher:id,name,title,specialty,photo_url', 'teachers:id,name,title,photo_url', 'assignedProf:id,name,email', 'certificateTemplate:id,name'])
            ->withCount([
                'purchases as participants_count' => fn ($q) => $q->whereIn('status', ['validated', 'paid']),
            ])
            ->latest();

        if ($search = trim((string) $request->query('search', ''))) {
            $query->where(function ($q) use ($search): void {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('teacher_name', 'like', "%{$search}%");
            });
        }

        if ($request->boolean('published')) {
            $query->where('is_published', true);
        }

        return response()->json($query->paginate(min((int) $request->query('per_page', 50), 200)));
    }

    public function store(Request $request): JsonResponse
    {
        // Límites del plan SaaS: el plan starter solo permite 1 curso y el
        // trial vencido bloquea la creación (auditoría 2026-06-10).
        $tenant = app(TenantManager::class)->getTenant();
        if ($tenant && ($reason = app(PlanLimits::class)->courseCreationBlockedReason($tenant))) {
            return response()->json([
                'message' => $reason,
                'code' => 'plan_limit_reached',
            ], 402);
        }

        $data = $this->validatedCourse($request);
        $data['slug'] = $data['slug'] ?? Str::slug($data['title']);

        // Extraer teacher_ids antes de crear
        $teacherIds = $request->input('teacher_ids', []);

        $course = Course::create($data);

        // Sincronizar docentes del pivot
        if (is_array($teacherIds) && count($teacherIds) > 0) {
            $course->teachers()->sync($teacherIds);
        }

        return response()->json($course->load(['mainTeacher', 'teachers']), 201);
    }

    public function show(Course $course): JsonResponse
    {
        $course->load(['mainTeacher', 'teachers', 'assignedProf:id,name,email'])->loadCount([
            'purchases as participants_count' => fn ($q) => $q->whereIn('status', ['validated', 'paid']),
        ]);

        return response()->json($course);
    }

    public function update(Request $request, Course $course): JsonResponse
    {
        $data = $this->validatedCourse($request, true);
        if (array_key_exists('title', $data) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['title']);
        }

        $course->update($data);

        // Sincronizar docentes del pivot si se envían
        if ($request->has('teacher_ids')) {
            $teacherIds = $request->input('teacher_ids', []);
            $course->teachers()->sync(is_array($teacherIds) ? $teacherIds : []);
        }

        $course = $course->fresh();
        $course->load(['mainTeacher', 'teachers'])->loadCount(['purchases as participants_count' => function ($q) {
            $q->whereIn('status', ['validated', 'paid']);
        }]);

        return response()->json($course);
    }

    public function destroy(Course $course): JsonResponse
    {
        $course->purchases()->update(['course_id' => null]);
        $course->delete();

        return response()->json(['message' => 'Curso eliminado']);
    }

    /**
     * Subir o reemplazar la imagen de portada de un curso.
     * Guarda en storage/app/public/courses/images/ con nombre slugificado.
     */
    public function uploadImage(Request $request, Course $course): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp,avif', 'max:5120'],
        ]);

        $storageService = app(\App\Services\TenantStorageService::class);

        // Eliminar imagen anterior si existía y era local
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

    public function participants(Course $course): JsonResponse
    {
        $participants = $course->purchases()
            ->with('user')
            ->whereIn('status', ['validated', 'paid'])
            ->latest()
            ->get()
            ->map(fn ($purchase) => [
                'purchase_id' => $purchase->id,
                'status' => $purchase->status,
                'amount' => $purchase->amount,
                'created_at' => $purchase->created_at,
                'user' => $purchase->user,
            ]);

        return response()->json(['data' => $participants]);
    }

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
            'title'          => [$required, 'string', 'max:255', 'regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,\-:;()\/]+$/u'],
            'code'           => ['nullable', 'string', 'max:50', 'regex:/^[a-zA-Z0-9\-\/]+$/'],
            'type'           => ['nullable', Rule::in(['Curso', 'Diplomado', 'Especialidad', 'Programa'])],
            'specialty'      => ['nullable', 'string', 'max:255', 'regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,\-:;()\/]+$/u'],
            'description'    => ['nullable', 'string'],
            'syllabus'       => ['nullable', 'array'],
            'syllabus.*'     => ['string', 'max:500'],
            'requirements'   => ['nullable', 'array'],
            'requirements.*' => ['string', 'max:500'],
            'price'          => [$required, 'numeric', 'min:0', 'max:999999.99'],
            'duration_weeks' => [$required, 'integer', 'min:1', 'max:260'],
            'start_date'     => ['nullable', 'date'],
            'end_date'       => ['nullable', 'date', 'after_or_equal:start_date'],
            'hours'          => ['nullable', 'integer', 'min:1', 'max:9999'],
            'level'          => ['nullable', Rule::in(['basico', 'básico', 'intermedio', 'avanzado'])],
            'image_url'      => ['nullable', 'string', 'max:2048'],
            'teacher_name'           => ['nullable', 'string', 'max:255'],
            'teacher_id'             => ['nullable', 'integer', 'exists:teachers,id'],
            'assigned_prof_id'       => ['nullable', 'integer', 'exists:users,id'],
            'certificate_template_id' => ['nullable', 'integer', 'exists:certificate_templates,id'],
            'is_published'           => ['sometimes', 'boolean'],
            'slug'                   => ['nullable', 'string', 'max:255'],
        ], [
            'title.regex'     => 'El título solo puede contener letras, números, espacios y signos de puntuación básicos.',
            'code.regex'      => 'El código solo puede contener letras, números y guiones.',
            'specialty.regex' => 'La especialidad solo puede contener letras, números y signos de puntuación básicos.',
            'price.max'       => 'El precio no puede ser mayor a S/ 999,999.99.',
            'end_date.after_or_equal' => 'La fecha de fin debe ser igual o posterior a la fecha de inicio.',
        ]);
    }
}
