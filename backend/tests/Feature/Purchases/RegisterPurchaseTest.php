<?php

namespace Tests\Feature\Purchases;

use App\Models\Course;
use App\Models\Purchase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RegisterPurchaseTest extends TestCase
{
    use RefreshDatabase;

    private Course $course;

    protected function setUp(): void
    {
        parent::setUp();

        $this->course = Course::factory()->create([
            'code' => 'EDUWANKA-MVP',
            'price' => 500.00,
        ]);
    }

    public function test_register_purchase_with_proof_creates_pending_validation_record(): void
    {
        Storage::fake('public');

        $response = $this->postJson('/api/v1/checkout/register-purchase', [
            'name' => 'Ana Student',
            'email' => 'ana.student@example.test',
            'password' => 'Secret123!',
            'course_code' => 'EDUWANKA-MVP',
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

        // El monto se calcula siempre desde el precio del curso, nunca desde el cliente
        $this->assertEquals((int) round($this->course->price), $purchase->amount);
    }

    public function test_register_purchase_ignores_client_supplied_amount_and_uses_course_price(): void
    {
        Storage::fake('public');

        $response = $this->postJson('/api/v1/checkout/register-purchase', [
            'name' => 'Manipulador',
            'email' => 'manipulador@example.test',
            'password' => 'Secret123!',
            'course_code' => 'EDUWANKA-MVP',
            'amount' => 1, // Intento de manipular el monto de un curso de S/ 500
            'currency' => 'PEN',
            'payment_method' => 'proof',
            'idempotency_key' => 'idem-tamper-001',
            'receipt' => UploadedFile::fake()->create('voucher-tamper.jpg', 100, 'image/jpeg'),
        ]);

        $response->assertCreated();

        $purchase = Purchase::query()->where('idempotency_key', 'idem-tamper-001')->first();

        $this->assertNotNull($purchase);
        $this->assertEquals((int) round($this->course->price), $purchase->amount);
        $this->assertNotEquals(1, $purchase->amount);
    }

    public function test_register_purchase_rejects_unknown_course_code(): void
    {
        Storage::fake('public');

        $response = $this->postJson('/api/v1/checkout/register-purchase', [
            'name' => 'Sin Curso',
            'email' => 'sin.curso@example.test',
            'password' => 'Secret123!',
            'course_code' => 'NO-EXISTE-999',
            'currency' => 'PEN',
            'payment_method' => 'proof',
            'idempotency_key' => 'idem-no-course-001',
            'receipt' => UploadedFile::fake()->create('voucher-no-course.jpg', 100, 'image/jpeg'),
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['course_code']);
    }

    public function test_register_purchase_with_proof_requires_receipt_file(): void
    {
        $response = $this->postJson('/api/v1/checkout/register-purchase', [
            'name' => 'Ana Student',
            'email' => 'ana.no-proof@example.test',
            'password' => 'Secret123!',
            'course_code' => 'EDUWANKA-MVP',
            'currency' => 'PEN',
            'payment_method' => 'proof',
            'idempotency_key' => 'idem-proof-002',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['receipt']);
    }

    public function test_register_purchase_with_mercadopago_creates_preference(): void
    {
        \Illuminate\Support\Facades\Http::fake([
            'https://api.mercadopago.com/*' => \Illuminate\Support\Facades\Http::response([
                'id' => 'mp-pref-123456',
                'init_point' => 'https://www.mercadopago.com.pe/sandbox/button',
            ], 200),
        ]);

        config()->set('services.mercadopago.access_token', 'APP_USR-test-token');
        config()->set('services.mercadopago.public_key', 'APP_USR-test-key');

        $response = $this->postJson('/api/v1/checkout/register-purchase', [
            'name' => 'Luis MP',
            'email' => 'luis.mp@example.test',
            'password' => 'Secret123!',
            'course_code' => 'EDUWANKA-MVP',
            'currency' => 'PEN',
            'payment_method' => 'mercadopago',
            'idempotency_key' => 'idem-mp-001',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.payment_method', 'mercadopago')
            ->assertJsonPath('data.status', 'pending_payment')
            ->assertJsonPath('data.preference_id', 'mp-pref-123456')
            ->assertJsonPath('data.init_point', 'https://www.mercadopago.com.pe/sandbox/button');
    }

    public function test_register_purchase_with_mercadopago_is_blocked_when_keys_are_not_configured(): void
    {
        config()->set('services.mercadopago.access_token', '');
        config()->set('services.mercadopago.public_key', '');

        $response = $this->postJson('/api/v1/checkout/register-purchase', [
            'name' => 'Luis MP',
            'email' => 'luis.mp.no-keys@example.test',
            'password' => 'Secret123!',
            'course_code' => 'EDUWANKA-MVP',
            'currency' => 'PEN',
            'payment_method' => 'mercadopago',
            'idempotency_key' => 'idem-mp-no-keys-001',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonPath('message', 'El método de pago por Mercado Pago no está disponible actualmente.');
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
