<?php

namespace Tests\Feature\Purchases;

use App\Models\Purchase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RegisterPurchaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_purchase_with_proof_creates_pending_validation_record(): void
    {
        Storage::fake('public');

        $response = $this->postJson('/api/v1/checkout/register-purchase', [
            'name' => 'Ana Student',
            'email' => 'ana.student@example.test',
            'password' => 'Secret123!',
            'course_code' => 'EDUWANKA-MVP',
            'amount' => 12000,
            'currency' => 'PEN',
            'payment_method' => 'proof',
            'idempotency_key' => 'idem-proof-001',
            'receipt' => UploadedFile::fake()->create('voucher.jpg', 100, 'image/jpeg'),
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.payment_method', 'proof')
            ->assertJsonPath('data.status', 'pending_validation')
            ->assertJsonPath('data.user.email', 'ana.student@example.test');

        $this->assertDatabaseHas('users', [
            'email' => 'ana.student@example.test',
            'role' => 'student',
        ]);

        $purchase = Purchase::query()
            ->where('idempotency_key', 'idem-proof-001')
            ->first();

        $this->assertNotNull($purchase);
        $this->assertNotNull($purchase->receipt_path);
        Storage::disk('public')->assertExists($purchase->receipt_path);
    }

    public function test_register_purchase_with_proof_requires_receipt_file(): void
    {
        $response = $this->postJson('/api/v1/checkout/register-purchase', [
            'name' => 'Ana Student',
            'email' => 'ana.no-proof@example.test',
            'password' => 'Secret123!',
            'course_code' => 'EDUWANKA-MVP',
            'amount' => 12000,
            'currency' => 'PEN',
            'payment_method' => 'proof',
            'idempotency_key' => 'idem-proof-002',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['receipt']);
    }

    public function test_register_purchase_with_culqi_creates_pending_payment_without_receipt(): void
    {
        config()->set('services.culqi.enabled', true);
        config()->set('services.culqi.public_key', 'pk_test_123');
        config()->set('services.culqi.secret_key', 'sk_test_123');

        $response = $this->postJson('/api/v1/checkout/register-purchase', [
            'name' => 'Luis Culqi',
            'email' => 'luis.culqi@example.test',
            'password' => 'Secret123!',
            'course_code' => 'EDUWANKA-MVP',
            'amount' => 12000,
            'currency' => 'PEN',
            'payment_method' => 'culqi',
            'idempotency_key' => 'idem-culqi-001',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.payment_method', 'culqi')
            ->assertJsonPath('data.status', 'pending_payment')
            ->assertJsonPath('data.receipt_path', null);
    }

    public function test_register_purchase_with_culqi_is_blocked_when_feature_flag_is_disabled(): void
    {
        config()->set('services.culqi.enabled', false);

        $response = $this->postJson('/api/v1/checkout/register-purchase', [
            'name' => 'Luis Culqi',
            'email' => 'luis.culqi.disabled@example.test',
            'password' => 'Secret123!',
            'course_code' => 'EDUWANKA-MVP',
            'amount' => 12000,
            'currency' => 'PEN',
            'payment_method' => 'culqi',
            'idempotency_key' => 'idem-culqi-disabled-001',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonPath('message', 'This payment method is not currently available.');
    }

    public function test_register_purchase_with_culqi_is_blocked_when_keys_are_not_configured(): void
    {
        config()->set('services.culqi.enabled', true);
        config()->set('services.culqi.public_key', '');
        config()->set('services.culqi.secret_key', '');

        $response = $this->postJson('/api/v1/checkout/register-purchase', [
            'name' => 'Luis Culqi',
            'email' => 'luis.culqi.no-keys@example.test',
            'password' => 'Secret123!',
            'course_code' => 'EDUWANKA-MVP',
            'amount' => 12000,
            'currency' => 'PEN',
            'payment_method' => 'culqi',
            'idempotency_key' => 'idem-culqi-no-keys-001',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonPath('message', 'This payment method is not currently available.');
    }

    public function test_register_purchase_requires_valid_password_when_user_already_exists(): void
    {
        User::factory()->create([
            'name' => 'Existing Student',
            'email' => 'existing.student@example.test',
            'password' => bcrypt('CorrectSecret123!'),
            'role' => 'student',
        ]);

        $response = $this->postJson('/api/v1/checkout/register-purchase', [
            'name' => 'Existing Student',
            'email' => 'existing.student@example.test',
            'password' => 'WrongSecret123!',
            'course_code' => 'EDUWANKA-MVP',
            'amount' => 12000,
            'currency' => 'PEN',
            'payment_method' => 'proof',
            'idempotency_key' => 'idem-existing-user-001',
            'receipt' => UploadedFile::fake()->create('voucher-existing.jpg', 100, 'image/jpeg'),
        ]);

        $response
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Invalid credentials for existing account');
    }

    public function test_register_purchase_for_existing_user_with_valid_password_creates_purchase(): void
    {
        Storage::fake('public');

        User::factory()->create([
            'name' => 'Existing Student',
            'email' => 'existing.valid@example.test',
            'password' => bcrypt('CorrectSecret123!'),
            'role' => 'student',
        ]);

        $response = $this->postJson('/api/v1/checkout/register-purchase', [
            'name' => 'Existing Student',
            'email' => 'existing.valid@example.test',
            'password' => 'CorrectSecret123!',
            'course_code' => 'EDUWANKA-MVP',
            'amount' => 12000,
            'currency' => 'PEN',
            'payment_method' => 'proof',
            'idempotency_key' => 'idem-existing-user-002',
            'receipt' => UploadedFile::fake()->create('voucher-existing-valid.jpg', 100, 'image/jpeg'),
        ]);

        $response->assertCreated();

        $this->assertDatabaseHas('purchases', [
            'idempotency_key' => 'idem-existing-user-002',
            'status' => 'pending_validation',
        ]);
    }

    public function test_register_purchase_honors_idempotency_key_and_avoids_duplicate_records(): void
    {
        Storage::fake('public');

        $payload = [
            'name' => 'Repeat Student',
            'email' => 'repeat.student@example.test',
            'password' => 'Secret123!',
            'course_code' => 'EDUWANKA-MVP',
            'amount' => 12000,
            'currency' => 'PEN',
            'payment_method' => 'proof',
            'idempotency_key' => 'idem-repeat-001',
            'receipt' => UploadedFile::fake()->create('voucher-repeat.jpg', 100, 'image/jpeg'),
        ];

        $this->postJson('/api/v1/checkout/register-purchase', $payload)
            ->assertCreated();

        $secondResponse = $this->postJson('/api/v1/checkout/register-purchase', $payload);

        $secondResponse
            ->assertOk()
            ->assertJsonPath('data.idempotency_key', 'idem-repeat-001');

        $this->assertEquals(1, Purchase::query()->where('idempotency_key', 'idem-repeat-001')->count());
        $this->assertEquals(1, User::query()->where('email', 'repeat.student@example.test')->count());
    }
}
