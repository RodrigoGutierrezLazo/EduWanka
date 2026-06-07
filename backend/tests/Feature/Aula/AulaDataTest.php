<?php

namespace Tests\Feature\Aula;

use App\Models\Course;
use App\Models\Purchase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AulaDataTest extends TestCase
{
    use RefreshDatabase;

    // ─── student-data ─────────────────────────────────────────────────────────

    public function test_student_data_requires_authentication(): void
    {
        $this->getJson('/api/v1/aula/student-data')->assertUnauthorized();
    }

    public function test_student_can_fetch_own_data(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        Sanctum::actingAs($student);

        $response = $this->getJson('/api/v1/aula/student-data');

        $response->assertOk()
            ->assertJsonStructure(['user', 'purchases', 'certificates']);
    }

    // ─── admin-data ───────────────────────────────────────────────────────────

    public function test_student_keeps_access_to_enrolled_course_after_it_is_unpublished(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $course = Course::create([
            'title' => 'Curso interno para matriculados',
            'code' => 'INT-001',
            'description' => 'Curso oculto del catalogo publico',
            'price' => 220,
            'duration_weeks' => 8,
            'is_published' => false,
            'slug' => 'curso-interno-para-matriculados',
        ]);

        Purchase::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'course_code' => $course->code,
            'amount' => 220,
            'currency' => 'PEN',
            'payment_method' => 'admin_enrollment',
            'status' => Purchase::STATUS_VALIDATED,
            'idempotency_key' => 'student-keeps-hidden-course-access',
        ]);

        Sanctum::actingAs($student);

        $this->getJson('/api/v1/aula/student-data')
            ->assertOk()
            ->assertJsonPath('purchases.0.course.id', $course->id)
            ->assertJsonPath('purchases.0.course.is_published', false)
            ->assertJsonPath('purchases.0.course.title', 'Curso interno para matriculados');
    }

    public function test_admin_data_requires_authentication(): void
    {
        $this->getJson('/api/v1/aula/admin-data')->assertUnauthorized();
    }

    public function test_student_cannot_access_admin_data(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'student']));

        $this->getJson('/api/v1/aula/admin-data')->assertForbidden();
    }

    public function test_admin_can_fetch_admin_data(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $response = $this->getJson('/api/v1/aula/admin-data');

        $response->assertOk()
            ->assertJsonStructure([
                'pending_payments',
                'pending_payments_count',
                'total_users',
                'total_courses',
                'revenue',
            ]);
    }

    public function test_superadmin_can_fetch_admin_data(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'superadmin']));

        $this->getJson('/api/v1/aula/admin-data')->assertOk();
    }

    // ─── professor-data ───────────────────────────────────────────────────────

    public function test_professor_data_requires_authentication(): void
    {
        $this->getJson('/api/v1/aula/professor-data')->assertUnauthorized();
    }

    public function test_student_cannot_access_professor_data(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'student']));

        $this->getJson('/api/v1/aula/professor-data')->assertForbidden();
    }

    public function test_admin_cannot_access_professor_data(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->getJson('/api/v1/aula/professor-data')->assertForbidden();
    }

    public function test_professor_can_fetch_professor_data(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'prof']));

        $response = $this->getJson('/api/v1/aula/professor-data');

        $response->assertOk()
            ->assertJsonStructure(['user', 'courses', 'stats']);
    }

    public function test_superadmin_can_fetch_professor_data(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'superadmin']));

        $this->getJson('/api/v1/aula/professor-data')->assertOk();
    }

    // ─── superadmin-data ──────────────────────────────────────────────────────

    public function test_superadmin_data_requires_authentication(): void
    {
        $this->getJson('/api/v1/aula/superadmin-data')->assertUnauthorized();
    }

    public function test_admin_cannot_access_superadmin_data(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->getJson('/api/v1/aula/superadmin-data')->assertForbidden();
    }

    public function test_professor_cannot_access_superadmin_data(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'prof']));

        $this->getJson('/api/v1/aula/superadmin-data')->assertForbidden();
    }

    public function test_superadmin_can_fetch_superadmin_data(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'superadmin']));

        $response = $this->getJson('/api/v1/aula/superadmin-data');

        $response->assertOk()
            ->assertJsonStructure(['summary', 'recent_users', 'recent_purchases', 'purchases_by_status']);
    }
}
