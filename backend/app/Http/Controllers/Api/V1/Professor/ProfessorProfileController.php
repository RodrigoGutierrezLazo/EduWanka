<?php

namespace App\Http\Controllers\Api\V1\Professor;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProfessorProfileController extends Controller
{
    /**
     * Obtener el perfil público del docente autenticado.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $teacher = Teacher::where('user_id', $user->id)->first();

        if (!$teacher) {
            return response()->json([
                'message' => 'No tienes un perfil público asignado. Contacta al administrador.',
                'data' => null
            ], 404);
        }

        return response()->json(['data' => $teacher]);
    }

    /**
     * Actualizar el perfil público del docente autenticado.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $teacher = Teacher::where('user_id', $user->id)->firstOrFail();

        $data = $request->validate([
            'title'       => ['nullable', 'string', 'max:50'],
            'specialty'   => ['nullable', 'string', 'max:255'],
            'bio'         => ['nullable', 'string', 'max:2000'],
            'credentials' => ['nullable', 'string', 'max:500'],
            'phone'       => ['nullable', 'string', 'max:30'],
        ]);

        // No permitimos cambiar 'name', 'email' o 'user_id' desde aquí para evitar inconsistencias
        $teacher->update($data);

        return response()->json([
            'message' => 'Perfil actualizado correctamente',
            'data' => $teacher->fresh()
        ]);
    }

    /**
     * Actualizar la foto del docente autenticado.
     */
    public function uploadPhoto(Request $request): JsonResponse
    {
        $user = $request->user();
        $teacher = Teacher::where('user_id', $user->id)->firstOrFail();

        $request->validate([
            'photo' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        if ($teacher->photo_url && !preg_match('#^https?://#i', $teacher->photo_url)) {
            Storage::disk('public')->delete(ltrim($teacher->photo_url, '/'));
        }

        $file = $request->file('photo');
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension());
        $filename = 'prof-' . $user->id . '-' . now()->format('YmdHis') . '.' . $extension;

        Storage::disk('public')->makeDirectory('teachers/photos');
        $path = $file->storeAs('teachers/photos', $filename, 'public');

        $teacher->update(['photo_url' => $path]);

        return response()->json([
            'message'   => 'Foto actualizada',
            'photo_url' => '/storage/' . ltrim($path, '/'),
            'path'      => $path,
            'data'      => $teacher->fresh(),
        ]);
    }
}
