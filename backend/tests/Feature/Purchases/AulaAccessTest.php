<?php

namespace Tests\Feature\Purchases;

use App\Models\Course;
use App\Models\Purchase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AulaAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_aula_access_requires_authenticated_user(): void
    {
        $response = $this->getJson('/api/v1/aula/access');

        $response->assertUnauthorized();
    }

    public function test_student_without_validated_purchase_is_forbidden(): void
    {
        $student = User::factory()->create([
            'role' => 'student',
        ]);

        Sanctum::actingAs($student);

        $response = $this->getJson('/api/v1/aula/access');

        $response
            ->assertForbidden()
            ->assertJsonPath('message', 'Validated purchase required');
    }

    public function test_student_with_validated_purchase_can_access_aula(): void
    {
        $student = User::factory()->create([
            'role' => 'student',
        ]);

        Purchase::query()->create([
            'user_id' => $student->id,
            'course_code' => 'EDUWANKA-MVP',
            'amount' => 12000,
            'currency' => 'PEN',
            'payment_method' => 'proof',
            'payment_provider' => null,
            'status' => 'validated',
            'receipt_path' => 'purchases/receipts/voucher.jpg',
            'idempotency_key' => 'aula-access-validated',
        ]);

        Sanctum::actingAs($student);

        $response = $this->getJson('/api/v1/aula/access');

        $response
            ->assertOk()
            ->assertJsonPath('data.allowed', true)
            ->assertJsonPath('data.reason', 'validated_purchase');
    }

    public function test_student_with_validated_purchase_can_access_aula_even_if_course_is_unpublished(): void
    {
        $student = User::factory()->create([
            'role' => 'student',
        ]);
        $course = Course::create([
            'title' => 'Curso oculto con matricula activa',
            'code' => 'HID-001',
            'description' => 'Curso oculto del catalogo publico',
            'price' => 120,
            'duration_weeks' => 4,
            'is_published' => false,
        ]);

        Purchase::query()->create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'course_code' => $course->code,
            'amount' => 120,
            'currency' => 'PEN',
            'payment_method' => 'admin_enrollment',
            'payment_provider' => null,
            'status' => 'validated',
            'receipt_path' => null,
            'idempotency_key' => 'aula-access-hidden-course',
        ]);

        Sanctum::actingAs($student);

        $response = $this->getJson('/api/v1/aula/access');

        $response
            ->assertOk()
            ->assertJsonPath('data.allowed', true)
            ->assertJsonPath('data.reason', 'validated_purchase');
    }

    public function test_professor_role_can_access_without_purchase(): void
    {
        $prof = User::factory()->create([
            'role' => 'prof',
        ]);

        Sanctum::actingAs($prof);

        $response = $this->getJson('/api/v1/aula/access');

        $response
            ->assertOk()
            ->assertJsonPath('data.allowed', true)
            ->assertJsonPath('data.reason', 'role_access');
    }
}
