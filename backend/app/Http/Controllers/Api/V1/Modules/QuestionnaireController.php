<?php

namespace App\Http\Controllers\Api\V1\Modules;

use App\Http\Controllers\Controller;
use App\Models\Questionnaire;
use App\Models\QuestionnaireAttempt;
use App\Models\QuestionnaireQuestion;
use App\Models\Course;
use App\Http\Controllers\Api\V1\Modules\AuthorizesModuleAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuestionnaireController extends Controller
{
    use AuthorizesModuleAccess;
    public function index(Request $request): JsonResponse
    {
        $questionnaires = Questionnaire::query()
            ->with('questions.options')
            ->whereIn('course_id', $this->authorizedCourseIds($request))
            ->get();

        $this->hideAnswerKeyFromStudents($request, $questionnaires);

        return response()->json(['data' => $questionnaires]);
    }

    public function show(Request $request, Questionnaire $questionnaire): JsonResponse
    {
        $this->authorizedCourse($request, $questionnaire->course);
        $questionnaire->load('questions.options');
        $this->hideAnswerKeyFromStudents($request, $questionnaire);
        return response()->json(['data' => $questionnaire]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_id'          => ['required', 'integer', 'exists:courses,id'],
            'title'              => ['required', 'string', 'max:255'],
            'description'        => ['nullable', 'string'],
            'passing_score'      => ['nullable', 'integer', 'min:0', 'max:100'],
            'max_attempts'       => ['nullable', 'integer', 'min:1'],
            'immediate_feedback' => ['sometimes', 'boolean'],
            'due_date'           => ['nullable', 'date'],
            'questions'          => ['sometimes', 'array'],
        ]);

        $course = Course::findOrFail($validated['course_id']);
        $this->authorizedCourse($request, $course);

        $questionnaire = Questionnaire::create($validated);

        if (!empty($validated['questions'])) {
            $this->syncQuestions($questionnaire, $validated['questions']);
        }

        $questionnaire->load('questions.options');
        return response()->json(['data' => $questionnaire], 201);
    }

    public function update(Request $request, Questionnaire $questionnaire): JsonResponse
    {
        $this->authorizedCourse($request, $questionnaire->course);
        $validated = $request->validate([
            'title'              => ['sometimes', 'string', 'max:255'],
            'description'        => ['nullable', 'string'],
            'passing_score'      => ['nullable', 'integer', 'min:0', 'max:100'],
            'max_attempts'       => ['nullable', 'integer', 'min:1'],
            'immediate_feedback' => ['sometimes', 'boolean'],
            'due_date'           => ['nullable', 'date'],
            'questions'          => ['sometimes', 'array'],
        ]);

        $questionnaire->update($validated);

        if (isset($validated['questions'])) {
            $questionnaire->questions()->delete();
            $this->syncQuestions($questionnaire, $validated['questions']);
        }

        $questionnaire->load('questions.options');
        return response()->json(['data' => $questionnaire]);
    }

    public function destroy(Request $request, Questionnaire $questionnaire): JsonResponse
    {
        $this->authorizedCourse($request, $questionnaire->course);
        $questionnaire->delete();
        return response()->json(['message' => 'Cuestionario eliminado.']);
    }

    public function submitAttempt(Request $request, Questionnaire $questionnaire): JsonResponse
    {
        $this->authorizedCourse($request, $questionnaire->course);
        $user = $request->user();

        // Check max_attempts
        if ($questionnaire->max_attempts !== null) {
            $attemptCount = QuestionnaireAttempt::where('user_id', $user->id)
                ->where('questionnaire_id', $questionnaire->id)
                ->count();
            if ($attemptCount >= $questionnaire->max_attempts) {
                return response()->json(['message' => 'Has alcanzado el máximo de intentos permitidos.'], 422);
            }
        }

        $request->validate([
            'answers' => ['required', 'array'],
        ]);

        $answers = $request->answers; // { question_id => [option_ids] }
        $questions = $questionnaire->questions()->with('options')->get();

        $totalPoints = 0;
        $earnedPoints = 0;
        $feedback = [];

        foreach ($questions as $question) {
            $totalPoints += $question->points;
            $selected = $answers[$question->id] ?? [];
            if (!is_array($selected)) $selected = [$selected];

            $correctOptionIds = $question->options->where('is_correct', true)->pluck('id')->toArray();
            $isCorrect = empty(array_diff($correctOptionIds, $selected)) && empty(array_diff($selected, $correctOptionIds));

            if ($isCorrect) {
                $earnedPoints += $question->points;
            }

            if ($questionnaire->immediate_feedback) {
                $feedback[$question->id] = [
                    'is_correct'    => $isCorrect,
                    'explanation'   => $question->explanation,
                    'correct_ids'   => $correctOptionIds,
                ];
            }
        }

        $score = $totalPoints > 0 ? round(($earnedPoints / $totalPoints) * 100) : 0;

        $attempt = QuestionnaireAttempt::create([
            'user_id'          => $user->id,
            'questionnaire_id' => $questionnaire->id,
            'score'            => $score,
            'answers'          => $answers,
            'completed_at'     => now(),
        ]);

        return response()->json([
            'data'     => $attempt,
            'score'    => $score,
            'passed'   => $questionnaire->passing_score ? $score >= $questionnaire->passing_score : null,
            'feedback' => $feedback,
        ]);
    }

    public function myAttempts(Request $request, Questionnaire $questionnaire): JsonResponse
    {
        $this->authorizedCourse($request, $questionnaire->course);
        $attempts = QuestionnaireAttempt::where('user_id', $request->user()->id)
            ->where('questionnaire_id', $questionnaire->id)
            ->latest()
            ->get();
        return response()->json(['data' => $attempts]);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private function syncQuestions(Questionnaire $questionnaire, array $questions): void
    {
        foreach ($questions as $i => $qData) {
            $question = $questionnaire->questions()->create([
                'question_text' => $qData['question_text'] ?? '',
                'type'          => $qData['type'] ?? 'single',
                'points'        => $qData['points'] ?? 1,
                'order'         => $qData['order'] ?? ($i + 1),
                'explanation'   => $qData['explanation'] ?? null,
            ]);

            if (!empty($qData['options'])) {
                foreach ($qData['options'] as $optData) {
                    $question->options()->create([
                        'option_text' => $optData['option_text'] ?? '',
                        'is_correct'  => $optData['is_correct'] ?? false,
                        'feedback'    => $optData['feedback'] ?? null,
                    ]);
                }
            }
        }
    }
}
