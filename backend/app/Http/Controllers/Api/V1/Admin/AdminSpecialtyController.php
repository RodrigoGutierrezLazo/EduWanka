<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Specialty;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AdminSpecialtyController extends Controller
{
    /**
     * List all specialties for administrative view.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Specialty::query()
            ->orderBy('order', 'asc');

        if ($search = trim((string) $request->query('search', ''))) {
            $query->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
        }

        return response()->json(['data' => $query->get()]);
    }

    /**
     * Store a new specialty.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'             => ['required', 'string', 'max:255'],
            'description'       => ['nullable', 'string'],
            'image_url'         => ['nullable', 'string', 'max:2048'],
            'brochure_pdf_path' => ['nullable', 'string', 'max:2048'],
            'type'              => ['required', 'string', 'in:formacion,derecho'],
            'order'             => ['sometimes', 'integer'],
            'custom_sections'   => ['nullable', 'array'],
        ]);

        $data['slug'] = Str::slug($data['title']);

        // Check unique slug
        $count = Specialty::where('slug', $data['slug'])->count();
        if ($count > 0) {
            $data['slug'] .= '-' . time();
        }

        if (!isset($data['order'])) {
            $maxOrder = Specialty::max('order') ?? 0;
            $data['order'] = $maxOrder + 1;
        }

        $specialty = Specialty::create($data);

        return response()->json(['data' => $specialty], 201);
    }

    /**
     * Show detail of a single specialty.
     */
    public function show(Specialty $specialty): JsonResponse
    {
        return response()->json(['data' => $specialty]);
    }

    /**
     * Update an existing specialty.
     */
    public function update(Request $request, Specialty $specialty): JsonResponse
    {
        $data = $request->validate([
            'title'             => ['sometimes', 'required', 'string', 'max:255'],
            'description'       => ['nullable', 'string'],
            'image_url'         => ['nullable', 'string', 'max:2048'],
            'brochure_pdf_path' => ['nullable', 'string', 'max:2048'],
            'type'              => ['sometimes', 'required', 'string', 'in:formacion,derecho'],
            'order'             => ['sometimes', 'integer'],
            'custom_sections'   => ['nullable', 'array'],
        ]);

        if (isset($data['title'])) {
            $data['slug'] = Str::slug($data['title']);
            
            // Check unique slug (excluding itself)
            $count = Specialty::where('slug', $data['slug'])->where('id', '!=', $specialty->id)->count();
            if ($count > 0) {
                $data['slug'] .= '-' . time();
            }
        }

        $specialty->update($data);

        // Also sync Course specialty string for backwards compatibility
        if (isset($data['title'])) {
            $specialty->courses()->update(['specialty' => $data['title']]);
        }

        return response()->json(['data' => $specialty]);
    }

    /**
     * Delete a specialty.
     */
    public function destroy(Specialty $specialty): JsonResponse
    {
        // Nullify specialty_id in associated courses before deleting
        $specialty->courses()->update(['specialty_id' => null]);
        
        // Delete image if local
        if ($specialty->image_url && !preg_match('#^https?://#i', $specialty->image_url)) {
            Storage::disk('public')->delete(ltrim($specialty->image_url, '/'));
        }

        $specialty->delete();

        return response()->json(['message' => 'Especialidad eliminada correctamente.']);
    }

    /**
     * Subir o reemplazar la imagen de una especialidad.
     */
    public function uploadImage(Request $request, Specialty $specialty): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp,avif', 'max:5120'],
        ]);

        // Delete old image if local
        if ($specialty->image_url && !preg_match('#^https?://#i', $specialty->image_url)) {
            Storage::disk('public')->delete(ltrim($specialty->image_url, '/'));
        }

        $file = $request->file('image');
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension());
        $filename = $specialty->slug . '-' . now()->format('YmdHis') . '.' . $extension;
        $path = $file->storeAs('specialties', $filename, 'public');

        $specialty->update(['image_url' => $path]);

        return response()->json([
            'message'   => 'Imagen de especialidad cargada correctamente.',
            'image_url' => '/storage/' . ltrim($path, '/'),
            'path'      => $path,
            'specialty' => $specialty->fresh(),
        ]);
    }

    /**
     * Subir o reemplazar el Brochure en PDF de una especialidad.
     */
    public function uploadBrochurePdf(Request $request, Specialty $specialty): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:pdf', 'max:20480'], // max 20MB
        ]);

        // Delete old brochure if local
        if ($specialty->brochure_pdf_path && !preg_match('#^https?://#i', $specialty->brochure_pdf_path)) {
            Storage::disk('public')->delete(ltrim($specialty->brochure_pdf_path, '/'));
        }

        // Nunca usar el nombre de archivo del cliente como nombre físico
        // (hallazgo 2.5): puede contener path traversal, caracteres de control
        // o colisionar/sobrescribir otros archivos. Generamos un nombre opaco
        // con UUID y conservamos solo la extensión validada (pdf).
        $file = $request->file('file');
        $fileName = Str::uuid()->toString() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('brochures', $fileName, 'public');

        $specialty->update(['brochure_pdf_path' => $path]);

        return response()->json([
            'message'           => 'Brochure PDF cargado correctamente.',
            'brochure_pdf_path' => $path,
            'brochure_pdf_url'  => '/storage/' . ltrim($path, '/'),
            'specialty'         => $specialty->fresh(),
        ]);
    }

    /**
     * Reorder specialties in a batch.
     */
    public function reorder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids'   => ['required', 'array'],
            'ids.*' => ['integer', 'exists:specialties,id'],
        ]);

        foreach ($data['ids'] as $idx => $id) {
            Specialty::where('id', $id)->update(['order' => $idx + 1]);
        }

        return response()->json(['message' => 'Orden de especialidades actualizado correctamente.']);
    }
}
