<?php

namespace Tests\Feature\Payments;

use App\Models\User;
use App\Models\Purchase;
use App\Models\Course;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransitionPurchaseStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_validate_payment()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $student = User::factory()->create(['role' => 'student']);
        $purchase = Purchase::create([
            'user_id' => $student->id,
            'course_code' => 'TEST',
            'amount' => 1000,
            'currency' => 'PEN',
            'payment_method' => 'proof',
            'status' => 'pending_validation',
            'idempotency_key' => uniqid(),
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/payments/{$purchase->id}/status", [
                'new_status' => 'validated',
                'reason' => 'Comprobante válido',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('validated', $purchase->fresh()->status);
    }

    public function test_cannot_transition_from_paid()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $student = User::factory()->create(['role' => 'student']);
        $purchase = Purchase::create([
            'user_id' => $student->id,
            'course_code' => 'TEST',
            'amount' => 1000,
            'currency' => 'PEN',
            'payment_method' => 'proof',
            'status' => 'paid',
            'idempotency_key' => uniqid(),
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/payments/{$purchase->id}/status", [
                'new_status' => 'validated',
            ]);

        $response->assertStatus(422);
        $this->assertEquals('paid', $purchase->fresh()->status);
    }

    public function test_unauthorized_user_cannot_transition()
    {
        $student = User::factory()->create(['role' => 'student']);
        $purchase = Purchase::create([
            'user_id' => $student->id,
            'course_code' => 'TEST',
            'amount' => 1000,
            'currency' => 'PEN',
            'payment_method' => 'proof',
            'status' => 'pending_validation',
            'idempotency_key' => uniqid(),
        ]);

        $response = $this->actingAs($student, 'sanctum')
            ->postJson("/api/v1/payments/{$purchase->id}/status", [
                'new_status' => 'validated',
            ]);

        $response->assertStatus(403);
    }
}
