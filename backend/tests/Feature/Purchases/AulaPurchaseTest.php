<?php

namespace Tests\Feature\Purchases;

use App\Models\Course;
use App\Models\Purchase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AulaPurchaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_student_can_add_course_without_reentering_profile_or_password(): void
    {
        Storage::fake('public');

        $student = User::factory()->create([
            'role' => 'student',
            'email' => 'student.add-course@example.test',
        ]);
        $course = Course::factory()->create([
            'code' => 'ADD-101',
            'price' => 180,
            'is_published' => true,
        ]);

        Sanctum::actingAs($student);

        $response = $this->postJson('/api/v1/aula/purchases', [
            'course_id' => $course->id,
            'amount' => 180,
            'currency' => 'PEN',
            'payment_method' => 'proof',
            'payment_modality' => 'single',
            'bank_entity' => 'Yape',
            'operation_number' => 'OP-123456',
            'declared_amount' => 180,
            'receipt' => UploadedFile::fake()->create('voucher.jpg', 100, 'image/jpeg'),
            'certification_institution' => 'EduWanka',
            'certificate_delivery' => 'digital',
            'next_course_interest' => 'Derecho tributario',
            'accepted_terms' => true,
            'idempotency_key' => 'aula-add-course-001',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.course_id', $course->id)
            ->assertJsonPath('data.user.email', 'student.add-course@example.test')
            ->assertJsonPath('data.status', Purchase::STATUS_PENDING_VALIDATION);

        $purchase = Purchase::query()
            ->where('idempotency_key', 'aula-add-course-001')
            ->first();

        $this->assertNotNull($purchase);
        $this->assertSame($student->id, $purchase->user_id);
        $this->assertSame($course->id, $purchase->course_id);
        $this->assertNotNull($purchase->receipt_path);
        Storage::disk('public')->assertExists($purchase->receipt_path);

        $this->assertSame('EduWanka', $purchase->certification_institution);
    }

    public function test_authenticated_student_cannot_duplicate_active_course_purchase(): void
    {
        Storage::fake('public');

        $student = User::factory()->create(['role' => 'student']);
        $course = Course::factory()->create([
            'code' => 'DUP-101',
            'is_published' => true,
        ]);

        Purchase::factory()->create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'course_code' => $course->code,
            'status' => Purchase::STATUS_PENDING_VALIDATION,
        ]);

        Sanctum::actingAs($student);

        $response = $this->postJson('/api/v1/aula/purchases', [
            'course_id' => $course->id,
            'amount' => 100,
            'currency' => 'PEN',
            'payment_method' => 'proof',
            'idempotency_key' => 'aula-duplicate-001',
            'receipt' => UploadedFile::fake()->create('voucher-duplicate.jpg', 100, 'image/jpeg'),
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['course_id']);
    }
}
