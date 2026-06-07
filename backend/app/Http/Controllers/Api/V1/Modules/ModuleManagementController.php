<?php

namespace App\Http\Controllers\Api\V1\Modules;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\ModuleSection;
use App\Models\ContentItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ModuleManagementController extends Controller
{
    use AuthorizesModuleAccess;

    // ─── MODULES ────────────────────────────────────────────────────────────

    public function modules(Request $request, Course $course): JsonResponse
    {
        $this->authorizedCourse($request, $course);
        $modules = $course->modules()->with('sections.items')->get();
        return response()->json(['data' => $modules]);
    }

    public function storeModule(Request $request, Course $course): JsonResponse
    {
        $this->authorizedCourse($request, $course);
        $validated = $request->validate([
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'order'       => ['nullable', 'integer'],
        ]);
        $module = $course->modules()->create($validated);
        return response()->json(['data' => $module], 201);
    }

    public function updateModule(Request $request, CourseModule $module): JsonResponse
    {
        $this->authorizedModule($request, $module);
        $validated = $request->validate([
            'title'       => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'order'       => ['nullable', 'integer'],
        ]);
        $module->update($validated);
        return response()->json(['data' => $module]);
    }

    public function destroyModule(Request $request, CourseModule $module): JsonResponse
    {
        $this->authorizedModule($request, $module);
        $module->delete();
        return response()->json(['message' => 'Módulo eliminado.']);
    }

    public function reorderModules(Request $request, Course $course): JsonResponse
    {
        $this->authorizedCourse($request, $course);
        $request->validate(['order' => ['required', 'array'], 'order.*' => ['integer']]);
        foreach ($request->order as $position => $moduleId) {
            CourseModule::where('id', $moduleId)->where('course_id', $course->id)
                ->update(['order' => $position + 1]);
        }
        return response()->json(['message' => 'Orden actualizado.']);
    }

    // ─── SECTIONS ───────────────────────────────────────────────────────────

    public function sections(Request $request, CourseModule $module): JsonResponse
    {
        $this->authorizedModule($request, $module);
        return response()->json(['data' => $module->sections()->with('items')->get()]);
    }

    public function storeSection(Request $request, CourseModule $module): JsonResponse
    {
        $this->authorizedModule($request, $module);
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'order' => ['nullable', 'integer'],
        ]);
        $section = $module->sections()->create($validated);
        return response()->json(['data' => $section], 201);
    }

    public function updateSection(Request $request, ModuleSection $section): JsonResponse
    {
        $this->authorizedSection($request, $section);
        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'order' => ['nullable', 'integer'],
        ]);
        $section->update($validated);
        return response()->json(['data' => $section]);
    }

    public function destroySection(Request $request, ModuleSection $section): JsonResponse
    {
        $this->authorizedSection($request, $section);
        $section->delete();
        return response()->json(['message' => 'Sección eliminada.']);
    }

    public function reorderSections(Request $request, CourseModule $module): JsonResponse
    {
        $this->authorizedModule($request, $module);
        $request->validate(['order' => ['required', 'array'], 'order.*' => ['integer']]);
        foreach ($request->order as $position => $sectionId) {
            ModuleSection::where('id', $sectionId)->where('course_module_id', $module->id)
                ->update(['order' => $position + 1]);
        }
        return response()->json(['message' => 'Orden actualizado.']);
    }

    // ─── ITEMS ──────────────────────────────────────────────────────────────

    public function items(Request $request, ModuleSection $section): JsonResponse
    {
        $this->authorizedSection($request, $section);
        return response()->json(['data' => $section->items]);
    }

    public function storeItem(Request $request, ModuleSection $section): JsonResponse
    {
        $this->authorizedSection($request, $section);

        $rules = [
            'type'  => ['required', Rule::in(['video','file','meet','questionnaire','substitute_exam','text','url','assignment'])],
            'title' => ['required', 'string', 'max:255'],
            'order' => ['nullable', 'integer'],
        ];

        match ($request->type) {
            'video', 'meet', 'url' => $rules['url'] = ['required', 'url', 'max:2048'],
            'file' => $rules['file'] = ['required', 'file', 'max:51200'],
            'text' => $rules['body_html'] = ['required', 'string'],
            'questionnaire'  => $rules['referenced_id'] = ['required', 'integer', 'exists:questionnaires,id'],
            'substitute_exam'=> $rules['referenced_id'] = ['required', 'integer', 'exists:substitute_exams,id'],
            'assignment'     => $rules['referenced_id'] = ['required', 'integer', 'exists:assignments,id'],
            default          => null,
        };

        $validated = $request->validate($rules);

        // Handle file upload
        $path = null;
        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('content-items', 'public');
            $validated['path'] = $path;
            unset($validated['file']);
        }

        $item = $section->items()->create($validated);
        return response()->json(['data' => $item], 201);
    }

    public function updateItem(Request $request, ContentItem $item): JsonResponse
    {
        $section = $item->section;
        $this->authorizedSection($request, $section);

        $validated = $request->validate([
            'title'         => ['sometimes', 'string', 'max:255'],
            'url'           => ['sometimes', 'nullable', 'url', 'max:2048'],
            'body_html'     => ['sometimes', 'nullable', 'string'],
            'referenced_id' => ['sometimes', 'nullable', 'integer'],
            'meta'          => ['sometimes', 'nullable', 'array'],
            'order'         => ['sometimes', 'integer'],
            'published'     => ['sometimes', 'boolean'],
        ]);

        $item->update($validated);
        return response()->json(['data' => $item]);
    }

    public function destroyItem(Request $request, ContentItem $item): JsonResponse
    {
        $this->authorizedSection($request, $item->section);
        $item->delete();
        return response()->json(['message' => 'Ítem eliminado.']);
    }

    public function reorderItems(Request $request, ModuleSection $section): JsonResponse
    {
        $this->authorizedSection($request, $section);
        $request->validate(['order' => ['required', 'array'], 'order.*' => ['integer']]);
        foreach ($request->order as $position => $itemId) {
            ContentItem::where('id', $itemId)->where('module_section_id', $section->id)
                ->update(['order' => $position + 1]);
        }
        return response()->json(['message' => 'Orden actualizado.']);
    }
}
