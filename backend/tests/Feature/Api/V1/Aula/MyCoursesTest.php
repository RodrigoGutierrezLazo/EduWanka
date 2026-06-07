<?php

namespace Tests\Feature\Api\V1\Aula;

use App\Models\Course;
use App\Models\Purchase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MyCoursesTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_see_only_their_validated_courses(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $otherStudent = User::factory()->create(['role' => 'student']);

        $course1 = Course::factory()->create(['title' => 'Course 1']);
        $course2 = Course::factory()->create(['title' => 'Course 2']);
        $course3 = Course::factory()->create(['title' => 'Course 3']);

        // Compra validada del estudiante
        Purchase::factory()->create([
            'user_id' => $student->id,
            'course_id' => $course1->id,
            'course_code' => $course1->code,
            'status' => Purchase::STATUS_VALIDATED,
        ]);

        // Compra pendiente del estudiante (no debe aparecer como acceso activo)
        Purchase::factory()->create([
            'user_id' => $student->id,
            'course_id' => $course2->id,
            'course_code' => $course2->code,
            'status' => Purchase::STATUS_PENDING_VALIDATION,
        ]);

        // Compra validada de otro estudiante (no debe aparecer)
        Purchase::factory()->create([
            'user_id' => $otherStudent->id,
            'course_id' => $course3->id,
            'course_code' => $course3->code,
            'status' => Purchase::STATUS_VALIDATED,
        ]);

        $response = $this->actingAs($student)
            ->getJson(route('api.v1.aula.my-courses'));

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.code', $course1->code);
    }

    public function test_student_can_access_course_detail_if_paid(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $course = Course::factory()->create();

        Purchase::factory()->create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'course_code' => $course->code,
            'status' => Purchase::STATUS_PAID,
        ]);

        $response = $this->actingAs($student)
            ->getJson(route('api.v1.aula.courses.show', $course->id));

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $course->id);
    }

    public function test_student_cannot_access_course_detail_if_not_purchased(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $course = Course::factory()->create();

        $response = $this->actingAs($student)
            ->getJson(route('api.v1.aula.courses.show', $course->id));

        $response->assertStatus(403);
    }
}
