<?php

namespace Tests\Feature\Modules;

use App\Models\Assignment;
use App\Models\Course;
use App\Models\Purchase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AssignmentControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_of_course_a_does_not_see_assignments_from_course_b(): void
    {
        $courseA = Course::factory()->create(['code' => 'COURSE-A']);
        $courseB = Course::factory()->create(['code' => 'COURSE-B']);

        $assignmentA = Assignment::create([
            'course_id'    => $courseA->id,
            'title'        => 'Tarea de Curso A',
            'instructions' => 'Resolver el caso del curso A.',
        ]);

        Assignment::create([
            'course_id'    => $courseB->id,
            'title'        => 'Tarea de Curso B',
            'instructions' => 'Resolver el caso del curso B.',
        ]);

        $student = User::factory()->create(['role' => 'student']);
        Purchase::factory()->create([
            'user_id'     => $student->id,
            'course_id'   => $courseA->id,
            'course_code' => $courseA->code,
            'status'      => Purchase::STATUS_VALIDATED,
        ]);

        Sanctum::actingAs($student);

        $response = $this->getJson('/api/v1/aula/assignments');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $assignmentA->id);
    }

    public function test_prof_only_sees_assignments_from_their_assigned_courses(): void
    {
        $prof = User::factory()->create(['role' => 'prof']);
        $otherProf = User::factory()->create(['role' => 'prof']);

        $ownCourse = Course::factory()->create(['assigned_prof_id' => $prof->id]);
        $foreignCourse = Course::factory()->create(['assigned_prof_id' => $otherProf->id]);

        $ownAssignment = Assignment::create([
            'course_id'    => $ownCourse->id,
            'title'        => 'Tarea propia',
            'instructions' => 'Instrucciones del curso propio.',
        ]);

        Assignment::create([
            'course_id'    => $foreignCourse->id,
            'title'        => 'Tarea ajena',
            'instructions' => 'Instrucciones del curso ajeno.',
        ]);

        Sanctum::actingAs($prof);

        $response = $this->getJson('/api/v1/aula/assignments');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $ownAssignment->id);
    }

    public function test_admin_sees_all_assignments(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $courseA = Course::factory()->create();
        $courseB = Course::factory()->create();

        Assignment::create([
            'course_id'    => $courseA->id,
            'title'        => 'Tarea A',
            'instructions' => 'Instrucciones A.',
        ]);
        Assignment::create([
            'course_id'    => $courseB->id,
            'title'        => 'Tarea B',
            'instructions' => 'Instrucciones B.',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/aula/assignments');

        $response->assertOk()->assertJsonCount(2, 'data');
    }
}
