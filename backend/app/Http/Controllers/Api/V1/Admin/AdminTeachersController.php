<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AdminTeachersController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Teacher::query()->orderBy('display_order')->latest();

        if ($search = trim((string) $request->query('search', ''))) {
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('specialty', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->boolean('featured')) {
            $query->where('is_featured', true);
        }

        return response()->json($query->paginate(min((int) $request->query('per_page', 50), 200)));
    }

    /**
     * Búsqueda ligera para typeahead en formulario de cursos.
     */
    public function search(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));

        if (mb_strlen($q) < 2) {
            return response()->json(['data' => []]);
        }

        $teachers = Teacher::query()
            ->where(function ($query) use ($q): void {
                $query->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")
                    ->orWhere('specialty', 'like', "%{$q}%");
            })
            ->orderBy('name')
            ->limit(20)
            ->get(['id', 'name', 'title', 'specialty', 'photo_url', 'email']);

        return response()->json(['data' => $teachers]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $teacher = Teacher::create($data);

        return response()->json($teacher, 201);
    }

    public function show(Teacher $teacher): JsonResponse
    {
        return response()->json($teacher->loadCount('courses'));
    }

    public function update(Request $request, Teacher $teacher): JsonResponse
    {
        $data = $this->validated($request, true);
        $teacher->update($data);

        return response()->json($teacher->fresh());
    }

    public function destroy(Teacher $teacher): JsonResponse
    {
        $teacher->delete();

        return response()->json(['message' => 'Docente eliminado']);
    }

    /**
     * Subir o reemplazar la foto de un docente.
     */
    public function uploadPhoto(Request $request, Teacher $teacher): JsonResponse
    {
        $request->validate([
            'photo' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp,avif', 'max:5120'],
        ]);

        // Eliminar foto anterior si era local
        if ($teacher->photo_url && ! preg_match('#^https?://#i', $teacher->photo_url)) {
            Storage::disk('public')->delete(ltrim($teacher->photo_url, '/'));
        }

        $file = $request->file('photo');
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension());
        $base = Str::slug($teacher->name) ?: 'docente-'.$teacher->id;
        $filename = $base.'-'.now()->format('YmdHis').'.'.$extension;

        // Asegurar que el directorio existe
        Storage::disk('public')->makeDirectory('teachers/photos');

        $path = $file->storeAs('teachers/photos', $filename, 'public');

        $teacher->update(['photo_url' => $path]);

        return response()->json([
            'message'   => 'Foto actualizada',
            'photo_url' => '/storage/' . ltrim($path, '/'),
            'path'      => $path,
            'teacher'   => $teacher->fresh(),
        ]);
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name'          => [$required, 'string', 'max:255', 'regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.\-,]+$/u'],
            'title'         => ['nullable', 'string', 'max:50'],
            'specialty'     => ['nullable', 'string', 'max:255', 'regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,\-:;()\/]+$/u'],
            'bio'           => ['nullable', 'string', 'max:2000'],
            'credentials'   => ['nullable', 'string', 'max:500', 'regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,\-:;()\/]+$/u'],
            'photo_url'     => ['nullable', 'string', 'max:2048'],
            'email'         => ['nullable', 'email:rfc,dns', 'max:255'],
            'phone'         => ['nullable', 'string', 'max:30', 'regex:/^[0-9+\s\-()]+$/'],
            'is_featured'   => ['sometimes', 'boolean'],
            'display_order' => ['sometimes', 'integer', 'min:0'],
            'user_id'       => ['nullable', 'integer', 'exists:users,id'],
        ], [
            'name.regex'        => 'El nombre solo puede contener letras, espacios, puntos y guiones.',
            'specialty.regex'   => 'La especialidad solo puede contener letras, números y signos de puntuación básicos.',
            'credentials.regex' => 'Las credenciales solo pueden contener letras, números y signos de puntuación básicos.',
            'email.email'       => 'Ingrese un correo electrónico válido.',
            'phone.regex'       => 'El teléfono solo puede contener números, +, espacios, guiones y paréntesis.',
        ]);
    }
}
