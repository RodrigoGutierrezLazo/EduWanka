<?php

namespace Tests\Feature\Modules;

use App\Models\Course;
use App\Models\Purchase;
use App\Models\Questionnaire;
use App\Models\QuestionnaireAttempt;
use App\Models\SubstituteExam;
use App\Models\SubstituteExamQuestion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SubstituteExamControllerTest extends TestCase
{
    use RefreshDatabase;

    private function createSubstituteExamWithOptions(Course $course): SubstituteExam
    {
        $questionnaire = Questionnaire::create([
            'course_id' => $course->id,
            'title'     => 'Cuestionario original de ' . $course->code,
        ]);

        $substituteExam = SubstituteExam::create([
            'original_questionnaire_id' => $questionnaire->id,
            'title'                     => 'Sustitutorio de ' . $course->code,
            'min_failed_score'          => 11,
        ]);

        $question = SubstituteExamQuestion::create([
            'substitute_exam_id' => $substituteExam->id,
            'question_text'      => '¿Cuál es la respuesta correcta?',
        ]);

        $question->options()->create(['option_text' => 'Opción correcta', 'is_correct' => true]);
        $question->options()->create(['option_text' => 'Opción incorrecta', 'is_correct' => false]);

        return $substituteExam->load('questions.options', 'originalQuestionnaire.course');
    }

    public function test_student_of_course_a_cannot_view_substitute_exam_from_course_b(): void
    {
        $courseA = Course::factory()->create(['code' => 'COURSE-A']);
        $courseB = Course::factory()->create(['code' => 'COURSE-B']);

        $substituteExamB = $this->createSubstituteExamWithOptions($courseB);

        $student = User::factory()->create(['role' => 'student']);
        Purchase::factory()->create([
            'user_id'     => $student->id,
            'course_id'   => $courseA->id,
            'course_code' => $courseA->code,
            'status'      => Purchase::STATUS_VALIDATED,
        ]);

        Sanctum::actingAs($student);

        $response = $this->getJson("/api/v1/aula/substitute-exams/{$substituteExamB->id}");

        $response->assertForbidden();
    }

    public function test_student_does_not_receive_is_correct_in_substitute_exam_payload(): void
    {
        $course = Course::factory()->create(['code' => 'COURSE-C']);
        $substituteExam = $this->createSubstituteExamWithOptions($course);

        $student = User::factory()->create(['role' => 'student']);
        Purchase::factory()->create([
            'user_id'     => $student->id,
            'course_id'   => $course->id,
            'course_code' => $course->code,
            'status'      => Purchase::STATUS_VALIDATED,
        ]);

        Sanctum::actingAs($student);

        $response = $this->getJson("/api/v1/aula/substitute-exams/{$substituteExam->id}");

        $response->assertOk();

        $options = $response->json('data.questions.0.options');
        $this->assertNotEmpty($options);
        foreach ($options as $option) {
            $this->assertArrayNotHasKey('is_correct', $option);
        }
    }

    public function test_eligible_student_does_not_receive_is_correct_in_eligibility_payload(): void
    {
        $course = Course::factory()->create(['code' => 'COURSE-D']);
        $substituteExam = $this->createSubstituteExamWithOptions($course);

        $student = User::factory()->create(['role' => 'student']);
        Purchase::factory()->create([
            'user_id'     => $student->id,
            'course_id'   => $course->id,
            'course_code' => $course->code,
            'status'      => Purchase::STATUS_VALIDATED,
        ]);

        // Reprobó el cuestionario original (score muy bajo según la regla de elegibilidad)
        QuestionnaireAttempt::create([
            'user_id'          => $student->id,
            'questionnaire_id' => $substituteExam->original_questionnaire_id,
            'score'            => 0,
            'answers'          => [],
            'completed_at'     => now(),
        ]);

        Sanctum::actingAs($student);

        $response = $this->getJson("/api/v1/aula/substitute-exams/{$substituteExam->id}/eligibility");

        $response->assertOk()->assertJsonPath('eligible', true);

        $options = $response->json('substitute.questions.0.options');
        $this->assertNotEmpty($options);
        foreach ($options as $option) {
            $this->assertArrayNotHasKey('is_correct', $option);
        }
    }
}
