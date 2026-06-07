<?php

namespace App\Http\Controllers\Api\V1\Modules;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssignmentController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Assignment::all()]);
    }

    public function show(Assignment $assignment): JsonResponse
    {
        $assignment->load('submissions.user');
        return response()->json(['data' => $assignment]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_id'    => ['required', 'integer', 'exists:courses,id'],
            'title'        => ['required', 'string', 'max:255'],
            'instructions' => ['required', 'string'],
            'due_at'       => ['nullable', 'date'],
            'max_score'    => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $assignment = Assignment::create($validated);
        return response()->json(['data' => $assignment], 201);
    }

    public function update(Request $request, Assignment $assignment): JsonResponse
    {
        $validated = $request->validate([
            'title'        => ['sometimes', 'string', 'max:255'],
            'instructions' => ['sometimes', 'string'],
            'due_at'       => ['nullable', 'date'],
            'max_score'    => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $assignment->update($validated);
        return response()->json(['data' => $assignment]);
    }

    public function destroy(Assignment $assignment): JsonResponse
    {
        $assignment->delete();
        return response()->json(['message' => 'Tarea eliminada.']);
    }

    /**
     * Student submits their work for an assignment.
     */
    public function submit(Request $request, Assignment $assignment): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'file'    => ['sometimes', 'file', 'max:20480'], // 20MB
            'comment' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $filePath = null;
        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store("assignments/{$assignment->id}", 'public');
        }

        $submission = AssignmentSubmission::updateOrCreate(
            ['assignment_id' => $assignment->id, 'user_id' => $user->id],
            [
                'file_path'    => $filePath ?? null,
                'comment'      => $request->comment,
                'submitted_at' => now(),
                'score'        => null,
                'feedback'     => null,
                'graded_at'    => null,
            ]
        );

        return response()->json(['data' => $submission], 201);
    }

    /**
     * Professor or admin grades a submission.
     */
    public function grade(Request $request, Assignment $assignment, AssignmentSubmission $submission): JsonResponse
    {
        // Only prof/admin (ensured via route middleware)
        $request->validate([
            'score'    => ['required', 'integer', 'min:0', 'max:' . $assignment->max_score],
            'feedback' => ['nullable', 'string', 'max:2000'],
        ]);

        $submission->update([
            'score'     => $request->score,
            'feedback'  => $request->feedback,
            'graded_at' => now(),
        ]);

        return response()->json(['data' => $submission]);
    }

    /**
     * Student gets their own submission for an assignment.
     */
    public function mySubmission(Request $request, Assignment $assignment): JsonResponse
    {
        $submission = AssignmentSubmission::where('assignment_id', $assignment->id)
            ->where('user_id', $request->user()->id)
            ->first();

        return response()->json(['data' => $submission]);
    }
}
