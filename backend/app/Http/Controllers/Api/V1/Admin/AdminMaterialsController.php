<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseUnit;
use App\Models\Material;
use App\Models\UnitSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class AdminMaterialsController extends Controller
{
    public function units(Course $course): JsonResponse
    {
        return response()->json(
            $course->units()->orderBy('order')->orderBy('id')->get()
        );
    }

    public function storeUnit(Request $request, Course $course): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'order' => ['nullable', 'integer', 'min:0'],
        ]);

        $data['order'] = $data['order'] ?? ($course->units()->max('order') + 1);

        return response()->json($course->units()->create($data), 201);
    }

    public function destroyUnit(CourseUnit $unit): JsonResponse
    {
        $unit->delete();

        return response()->json(['message' => 'Unidad eliminada']);
    }

    public function sessions(CourseUnit $unit): JsonResponse
    {
        return response()->json(
            $unit->sessions()->orderBy('order')->orderBy('id')->get()
        );
    }

    public function storeSession(Request $request, CourseUnit $unit): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'order' => ['nullable', 'integer', 'min:0'],
        ]);

        $data['order'] = $data['order'] ?? ($unit->sessions()->max('order') + 1);

        return response()->json($unit->sessions()->create($data), 201);
    }

    public function destroySession(UnitSession $session): JsonResponse
    {
        $session->delete();

        return response()->json(['message' => 'Sesion eliminada']);
    }

    public function materials(UnitSession $session): JsonResponse
    {
        return response()->json(
            $session->materials()->latest()->get()->map(fn (Material $material) => $this->materialPayload($material))
        );
    }

    public function storeMaterial(Request $request, UnitSession $session): JsonResponse
    {
        $allowedExtensions = implode(',', config('uploads.material_extensions'));

        $data = $request->validate([
            'type' => ['required', Rule::in(['file', 'video'])],
            'title' => ['required', 'string', 'max:255'],
            'file' => ['required_if:type,file', 'file', 'max:20480', "mimes:{$allowedExtensions}"],
            'url' => ['required_if:type,video', 'nullable', 'url', 'max:2048'],
        ]);

        if ($data['type'] === 'file') {
            $data['path'] = $request->file('file')->store('materials', 'public');
            unset($data['file'], $data['url']);
        }

        $material = $session->materials()->create($data);

        return response()->json($this->materialPayload($material), 201);
    }

    public function destroyMaterial(Material $material): JsonResponse
    {
        if ($material->path) {
            Storage::disk('public')->delete($material->path);
        }

        $material->delete();

        return response()->json(['message' => 'Material eliminado']);
    }

    private function materialPayload(Material $material): array
    {
        return [
            'id' => $material->id,
            'type' => $material->type,
            'title' => $material->title,
            'path' => $material->path,
            'url' => $material->url,
            'file_url' => $material->path ? '/storage/' . ltrim($material->path, '/') : null,
            'created_at' => $material->created_at,
        ];
    }
}
