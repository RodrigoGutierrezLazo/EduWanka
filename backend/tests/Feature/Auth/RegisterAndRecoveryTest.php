<?php

namespace Tests\Feature\Auth;

use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class RegisterAndRecoveryTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup a test tenant
        $this->tenant = Tenant::create([
            'name' => 'EduWanka Academy',
            'slug' => 'eduwanka-academy',
            'status' => 'active',
        ]);
    }

    public function test_student_can_register_successfully(): void
    {
        $response = $this->withHeader('X-Tenant-Slug', 'eduwanka-academy')
            ->postJson('/api/v1/auth/register', [
                'name' => 'Carlos',
                'last_name' => 'Mendoza',
                'email' => 'carlos.mendoza@example.test',
                'password' => 'Password123!',
                'password_confirmation' => 'Password123!',
                'dni' => '12345678',
                'phone' => '999888777',
                'city' => 'Huancayo',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => ['id', 'name', 'email', 'role', 'token']
            ])
            ->assertJsonPath('data.email', 'carlos.mendoza@example.test')
            ->assertJsonPath('data.role', 'student');

        $this->assertDatabaseHas('users', [
            'email' => 'carlos.mendoza@example.test',
            'role' => 'student',
            'tenant_id' => $this->tenant->id,
            'dni' => '12345678',
        ]);
    }

    public function test_registration_blocked_when_no_tenant_exists(): void
    {
        // Eliminar todos los tenants de la base de datos para simular ausencia total de contexto
        Tenant::query()->delete();

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Carlos',
            'last_name' => 'Mendoza',
            'email' => 'carlos.mendoza@example.test',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'dni' => '12345678',
            'phone' => '999888777',
        ]);

        $response->assertStatus(400)
            ->assertJsonPath('message', 'El contexto de la institución es requerido.');
    }

    public function test_registration_fails_on_duplicate_email(): void
    {
        User::factory()->create([
            'email' => 'carlos.mendoza@example.test',
            'tenant_id' => $this->tenant->id,
            'dni' => '87654321',
        ]);

        $response = $this->withHeader('X-Tenant-Slug', 'eduwanka-academy')
            ->postJson('/api/v1/auth/register', [
                'name' => 'Carlos2',
                'last_name' => 'Mendoza',
                'email' => 'carlos.mendoza@example.test',
                'password' => 'Password123!',
                'password_confirmation' => 'Password123!',
                'dni' => '12345678',
                'phone' => '999888777',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_password_recovery_flow(): void
    {
        // 1. Crear el usuario
        $user = User::factory()->create([
            'email' => 'carlos.recovery@example.test',
            'password' => Hash::make('OldPassword123!'),
            'tenant_id' => $this->tenant->id,
        ]);

        // 2. Solicitar recuperación
        $forgotResponse = $this->withHeader('X-Tenant-Slug', 'eduwanka-academy')
            ->postJson('/api/v1/auth/forgot-password', [
                'email' => 'carlos.recovery@example.test',
            ]);

        $forgotResponse->assertStatus(200);
        $message = $forgotResponse->json('message');

        $this->assertTrue(
            str_contains($message, 'enlace') ||
            str_contains($message, 'Simulación') ||
            str_contains($message, 'servidor de correo')
        );

        // El token de restablecimiento nunca debe viajar en la respuesta JSON
        $this->assertArrayNotHasKey('token', $forgotResponse->json());

        // 3. Generar token real (usando el broker de Laravel para evitar fallos de SMTP fakes)
        $token = Password::broker()->createToken($user);

        // 4. Resetear contraseña
        $resetResponse = $this->withHeader('X-Tenant-Slug', 'eduwanka-academy')
            ->postJson('/api/v1/auth/reset-password', [
                'token' => $token,
                'email' => 'carlos.recovery@example.test',
                'password' => 'NewPassword123!',
                'password_confirmation' => 'NewPassword123!',
            ]);

        $resetResponse->assertStatus(200)
            ->assertJsonPath('message', 'Tu contraseña ha sido restablecida con éxito.');

        // 5. Validar que la contraseña cambió e iniciar sesión
        $loginResponse = $this->withHeader('X-Tenant-Slug', 'eduwanka-academy')
            ->postJson('/api/v1/auth/login', [
                'email' => 'carlos.recovery@example.test',
                'password' => 'NewPassword123!',
            ]);

        $loginResponse->assertOk()
            ->assertJsonStructure(['data' => ['token']]);
    }

    public function test_forgot_password_never_leaks_token_when_mail_sending_fails(): void
    {
        User::factory()->create([
            'email' => 'leak.check@example.test',
            'tenant_id' => $this->tenant->id,
        ]);

        // Forzar el camino del catch (fallo al enviar el correo) que antes filtraba el token
        Password::shouldReceive('broker')
            ->andThrow(new \Exception('SMTP no disponible (simulado)'));

        $response = $this->withHeader('X-Tenant-Slug', 'eduwanka-academy')
            ->postJson('/api/v1/auth/forgot-password', [
                'email' => 'leak.check@example.test',
            ]);

        $response->assertStatus(200);
        $this->assertArrayNotHasKey('token', $response->json());
        $this->assertArrayNotHasKey('email', $response->json());
    }
}
