<?php

namespace App\Http\Controllers\Api\V1\Modules;

use App\Http\Controllers\Controller;
use App\Models\QuestionnaireAttempt;
use App\Models\SubstituteExam;
use App\Models\SubstituteExamAttempt;
use App\Models\Questionnaire;
use App\Http\Controllers\Api\V1\Modules\AuthorizesModuleAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubstituteExamController extends Controller
{
    use AuthorizesModuleAccess;
    public function index(): JsonResponse
    {
        return response()->json(['data' => SubstituteExam::with('questions.options')->get()]);
    }

    public function show(Request $request, SubstituteExam $substituteExam): JsonResponse
    {
        $this->authorizedCourse($request, $substituteExam->originalQuestionnaire->course);
        $substituteExam->load('questions.options', 'originalExam');
        return response()->json(['data' => $substituteExam]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'original_questionnaire_id' => ['required', 'integer', 'exists:questionnaires,id'],
            'title'            => ['required', 'string', 'max:255'],
            'opens_at'         => ['nullable', 'date'],
            'closes_at'        => ['nullable', 'date', 'after_or_equal:opens_at'],
            'due_date'         => ['nullable', 'date'],
            'min_failed_score' => ['sometimes', 'integer', 'min:0', 'max:20'],
            'questions'        => ['sometimes', 'array'],
        ]);

        $questionnaire = Questionnaire::findOrFail($validated['original_questionnaire_id']);
        $this->authorizedCourse($request, $questionnaire->course);

        $subExam = SubstituteExam::create($validated);

        if (!empty($validated['questions'])) {
            $this->syncQuestions($subExam, $validated['questions']);
        }

        $subExam->load('questions.options');
        return response()->json(['data' => $subExam], 201);
    }

    public function update(Request $request, SubstituteExam $substituteExam): JsonResponse
    {
        $this->authorizedCourse($request, $substituteExam->originalQuestionnaire->course);
        $validated = $request->validate([
            'title'            => ['sometimes', 'string', 'max:255'],
            'opens_at'         => ['nullable', 'date'],
            'closes_at'        => ['nullable', 'date'],
            'due_date'         => ['nullable', 'date'],
            'min_failed_score' => ['sometimes', 'integer', 'min:0', 'max:20'],
            'questions'        => ['sometimes', 'array'],
        ]);

        $substituteExam->update($validated);

        if (isset($validated['questions'])) {
            $substituteExam->questions()->delete();
            $this->syncQuestions($substituteExam, $validated['questions']);
        }

        $substituteExam->load('questions.options');
        return response()->json(['data' => $substituteExam]);
    }

    public function destroy(Request $request, SubstituteExam $substituteExam): JsonResponse
    {
        $this->authorizedCourse($request, $substituteExam->originalQuestionnaire->course);
        $substituteExam->delete();
        return response()->json(['message' => 'Examen sustitutorio eliminado.']);
    }

    /**
     * Check if user is eligible (failed original exam) and show substitute exam.
     */
    public function eligibility(Request $request, SubstituteExam $substituteExam): JsonResponse
    {
        $this->authorizedCourse($request, $substituteExam->originalQuestionnaire->course);
        $user = $request->user();
        $eligible = $this->isEligible($user->id, $substituteExam);

        return response()->json([
            'eligible'   => $eligible,
            'substitute' => $eligible ? $substituteExam->load('questions.options') : null,
        ]);
    }

    /**
     * Submit a substitute exam attempt (only if eligible).
     */
    public function submitAttempt(Request $request, SubstituteExam $substituteExam): JsonResponse
    {
        $this->authorizedCourse($request, $substituteExam->originalQuestionnaire->course);
        $user = $request->user();

        if (!$this->isEligible($user->id, $substituteExam)) {
            return response()->json(['message' => 'No eres elegible para este examen sustitutorio.'], 403);
        }

        // Only one attempt allowed
        $existing = SubstituteExamAttempt::where('user_id', $user->id)
            ->where('substitute_exam_id', $substituteExam->id)
            ->exists();

        if ($existing) {
            return response()->json(['message' => 'Ya has rendido este examen sustitutorio.'], 422);
        }

        $request->validate(['answers' => ['required', 'array']]);

        $answers = $request->answers;
        $questions = $substituteExam->questions()->with('options')->get();
        $totalPoints = $questions->sum('points');
        $earned = 0;

        foreach ($questions as $q) {
            $selected = (array)($answers[$q->id] ?? []);
            $correctIds = $q->options->where('is_correct', true)->pluck('id')->toArray();
            if (empty(array_diff($correctIds, $selected)) && empty(array_diff($selected, $correctIds))) {
                $earned += $q->points;
            }
        }

        $score = $totalPoints > 0 ? round(($earned / $totalPoints) * 20) : 0; // Scale to 20
        $passed = $score >= $substituteExam->min_failed_score;

        $attempt = SubstituteExamAttempt::create([
            'user_id'            => $user->id,
            'substitute_exam_id' => $substituteExam->id,
            'score'              => $score,
            'passed'             => $passed,
            'answers'            => $answers,
            'completed_at'       => now(),
        ]);

        return response()->json(['data' => $attempt, 'score' => $score, 'passed' => $passed]);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private function isEligible(int $userId, SubstituteExam $substituteExam): bool
    {
        // User must have a failed attempt on the original questionnaire
        return QuestionnaireAttempt::where('user_id', $userId)
            ->where('questionnaire_id', $substituteExam->original_questionnaire_id)
            ->where('score', '<', $substituteExam->min_failed_score * 5) // Note: scale logic
            ->exists();
    }

    private function syncQuestions(SubstituteExam $subExam, array $questions): void
    {
        foreach ($questions as $i => $qData) {
            $question = $subExam->questions()->create([
                'question_text' => $qData['question_text'] ?? '',
                'points'        => $qData['points'] ?? 1,
                'order'         => $qData['order'] ?? ($i + 1),
            ]);
            foreach ($qData['options'] ?? [] as $optData) {
                $question->options()->create([
                    'option_text' => $optData['option_text'] ?? '',
                    'is_correct'  => $optData['is_correct'] ?? false,
                ]);
            }
        }
    }
}
