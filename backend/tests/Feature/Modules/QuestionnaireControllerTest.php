<?php

namespace Tests\Feature\Modules;

use App\Models\Course;
use App\Models\Purchase;
use App\Models\Questionnaire;
use App\Models\QuestionnaireQuestion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class QuestionnaireControllerTest extends TestCase
{
    use RefreshDatabase;

    private function createQuestionnaireWithOptions(Course $course): Questionnaire
    {
        $questionnaire = Questionnaire::create([
            'course_id' => $course->id,
            'title'     => 'Cuestionario de ' . $course->code,
        ]);

        $question = QuestionnaireQuestion::create([
            'questionnaire_id' => $questionnaire->id,
            'question_text'    => '¿Cuál es la respuesta correcta?',
            'type'             => 'single',
        ]);

        $question->options()->create(['option_text' => 'Opción correcta', 'is_correct' => true, 'feedback' => 'Bien hecho']);
        $question->options()->create(['option_text' => 'Opción incorrecta', 'is_correct' => false, 'feedback' => 'Inténtalo de nuevo']);

        return $questionnaire->load('questions.options');
    }

    public function test_student_of_course_a_cannot_view_questionnaire_from_course_b(): void
    {
        $courseA = Course::factory()->create(['code' => 'COURSE-A']);
        $courseB = Course::factory()->create(['code' => 'COURSE-B']);

        $questionnaireB = $this->createQuestionnaireWithOptions($courseB);

        $student = User::factory()->create(['role' => 'student']);
        Purchase::factory()->create([
            'user_id'     => $student->id,
            'course_id'   => $courseA->id,
            'course_code' => $courseA->code,
            'status'      => Purchase::STATUS_VALIDATED,
        ]);

        Sanctum::actingAs($student);

        $response = $this->getJson("/api/v1/aula/questionnaires/{$questionnaireB->id}");

        $response->assertForbidden();
    }

    public function test_student_does_not_receive_is_correct_in_questionnaire_payload(): void
    {
        $course = Course::factory()->create(['code' => 'COURSE-C']);
        $questionnaire = $this->createQuestionnaireWithOptions($course);

        $student = User::factory()->create(['role' => 'student']);
        Purchase::factory()->create([
            'user_id'     => $student->id,
            'course_id'   => $course->id,
            'course_code' => $course->code,
            'status'      => Purchase::STATUS_VALIDATED,
        ]);

        Sanctum::actingAs($student);

        $response = $this->getJson("/api/v1/aula/questionnaires/{$questionnaire->id}");

        $response->assertOk();

        $options = $response->json('data.questions.0.options');
        $this->assertNotEmpty($options);
        foreach ($options as $option) {
            $this->assertArrayNotHasKey('is_correct', $option);
        }
    }

    public function test_prof_assigned_to_course_still_receives_is_correct_in_questionnaire_payload(): void
    {
        $prof = User::factory()->create(['role' => 'prof']);
        $course = Course::factory()->create(['assigned_prof_id' => $prof->id]);
        $questionnaire = $this->createQuestionnaireWithOptions($course);

        Sanctum::actingAs($prof);

        $response = $this->getJson("/api/v1/aula/questionnaires/{$questionnaire->id}");

        $response->assertOk();

        $options = $response->json('data.questions.0.options');
        $this->assertNotEmpty($options);
        $this->assertArrayHasKey('is_correct', $options[0]);
    }
}
