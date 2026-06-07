<?php

namespace Tests\Feature\Payments;

use App\Models\Course;
use App\Models\Purchase;
use App\Models\PurchaseStatusAudit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class MercadoPagoWebhookTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'test-webhook-secret';

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('services.mercadopago.webhook_secret', self::SECRET);
        config()->set('services.mercadopago.access_token', 'APP_USR-test-token');
    }

    private function signedHeaders(string $dataId, string $requestId, ?int $timestamp = null): array
    {
        $ts = $timestamp ?? time();
        $manifest = "id:" . strtolower($dataId) . ";request-id:{$requestId};ts:{$ts};";
        $hash = hash_hmac('sha256', $manifest, self::SECRET);

        return [
            'x-signature' => "ts={$ts},v1={$hash}",
            'x-request-id' => $requestId,
        ];
    }

    private function fakePaymentDetails(string $paymentId, string $purchaseId, string $status, float $transactionAmount): void
    {
        Http::fake([
            "https://api.mercadopago.com/v1/payments/{$paymentId}" => Http::response([
                'id' => $paymentId,
                'status' => $status,
                'transaction_amount' => $transactionAmount,
                'external_reference' => $purchaseId,
            ], 200),
        ]);
    }

    public function test_webhook_rejects_notification_with_invalid_signature(): void
    {
        $course = Course::factory()->create(['price' => 250]);
        $student = User::factory()->create(['role' => 'student']);
        $purchase = Purchase::factory()->create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'course_code' => $course->code,
            'amount' => 250,
            'status' => Purchase::STATUS_PENDING_PAYMENT,
        ]);

        $response = $this->withHeaders([
            'x-signature' => 'ts=1700000000,v1=' . str_repeat('0', 64),
            'x-request-id' => 'req-invalid-001',
        ])->postJson('/api/v1/payments/mercadopago/webhook?data.id=999111&type=payment', [
            'type' => 'payment',
            'data' => ['id' => '999111'],
        ]);

        $response->assertStatus(401);

        $this->assertSame(Purchase::STATUS_PENDING_PAYMENT, $purchase->fresh()->status);
    }

    public function test_webhook_rejects_notification_without_signature_headers(): void
    {
        $course = Course::factory()->create(['price' => 250]);
        $student = User::factory()->create(['role' => 'student']);
        Purchase::factory()->create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'course_code' => $course->code,
            'amount' => 250,
            'status' => Purchase::STATUS_PENDING_PAYMENT,
        ]);

        $response = $this->postJson('/api/v1/payments/mercadopago/webhook?data.id=999222&type=payment', [
            'type' => 'payment',
            'data' => ['id' => '999222'],
        ]);

        $response->assertStatus(401);
    }

    public function test_webhook_marks_purchase_as_paid_when_signature_and_amount_match(): void
    {
        Log::spy();

        $course = Course::factory()->create(['price' => 250]);
        $student = User::factory()->create(['role' => 'student']);
        $purchase = Purchase::factory()->create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'course_code' => $course->code,
            'amount' => 250,
            'status' => Purchase::STATUS_PENDING_PAYMENT,
        ]);

        $paymentId = '555111';
        $this->fakePaymentDetails($paymentId, (string) $purchase->id, 'approved', 250.00);

        $headers = $this->signedHeaders($paymentId, 'req-valid-001');

        $response = $this->withHeaders($headers)
            ->postJson("/api/v1/payments/mercadopago/webhook?data.id={$paymentId}&type=payment", [
                'type' => 'payment',
                'data' => ['id' => $paymentId],
            ]);

        $response->assertOk();

        $purchase->refresh();
        $this->assertSame(Purchase::STATUS_PAID, $purchase->status);
        $this->assertNotNull($purchase->paid_at);

        $this->assertDatabaseHas('purchase_status_audits', [
            'purchase_id' => $purchase->id,
            'to_status' => Purchase::STATUS_PAID,
        ]);
    }

    public function test_webhook_keeps_purchase_pending_and_logs_alert_when_amount_does_not_match(): void
    {
        Log::spy();

        $course = Course::factory()->create(['price' => 250]);
        $student = User::factory()->create(['role' => 'student']);
        $purchase = Purchase::factory()->create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'course_code' => $course->code,
            'amount' => 250,
            'status' => Purchase::STATUS_PENDING_PAYMENT,
        ]);

        $paymentId = '555222';
        // Mercado Pago reporta un monto muy distinto al registrado en la compra (posible manipulación)
        $this->fakePaymentDetails($paymentId, (string) $purchase->id, 'approved', 1.00);

        $headers = $this->signedHeaders($paymentId, 'req-mismatch-001');

        $response = $this->withHeaders($headers)
            ->postJson("/api/v1/payments/mercadopago/webhook?data.id={$paymentId}&type=payment", [
                'type' => 'payment',
                'data' => ['id' => $paymentId],
            ]);

        $response->assertStatus(422);

        $purchase->refresh();
        $this->assertSame(Purchase::STATUS_PENDING_PAYMENT, $purchase->status);
        $this->assertNull($purchase->paid_at);

        $this->assertDatabaseMissing('purchase_status_audits', [
            'purchase_id' => $purchase->id,
            'to_status' => Purchase::STATUS_PAID,
        ]);

        Log::shouldHaveReceived('warning')
            ->withArgs(fn (string $message) => str_contains($message, 'no coincide'))
            ->atLeast()
            ->once();
    }
}
