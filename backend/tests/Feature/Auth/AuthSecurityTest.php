<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_me_endpoint_requires_authenticated_session(): void
    {
        $response = $this->getJson('/api/v1/auth/me');

        $response->assertUnauthorized();
    }

    public function test_login_returns_user_payload_for_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'student@example.test',
            'password' => bcrypt('Secret123!'),
            'role' => 'student',
        ]);

        $response = $this->withHeaders(['Origin' => 'http://localhost:3000'])
            ->postJson('/api/v1/auth/login', [
                'email' => $user->email,
                'password' => 'Secret123!',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.email', 'student@example.test')
            ->assertJsonPath('data.role', 'student')
            ->assertJsonMissingPath('data.token');

        // La autenticación queda respaldada por la sesión (cookie httpOnly),
        // no por un token de API expuesto al JavaScript del navegador.
        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_login_does_not_expose_an_api_token_in_the_response(): void
    {
        $user = User::factory()->create([
            'email' => 'no-token@example.test',
            'password' => bcrypt('Secret123!'),
            'role' => 'student',
        ]);

        $response = $this->withHeaders(['Origin' => 'http://localhost:3000'])
            ->postJson('/api/v1/auth/login', [
                'email' => $user->email,
                'password' => 'Secret123!',
            ]);

        $response->assertOk();
        $this->assertArrayNotHasKey('token', $response->json('data'));
    }

    public function test_student_cannot_access_admin_endpoint(): void
    {
        $user = User::factory()->create([
            'role' => 'student',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/admin/ping');

        $response->assertForbidden();
    }

    public function test_login_rejects_wrong_password(): void
    {
        $user = User::factory()->create([
            'email' => 'wrong-pass@example.test',
            'password' => bcrypt('CorrectSecret123!'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'WrongSecret123!',
        ]);

        $response->assertUnauthorized();
    }

    public function test_admin_can_access_admin_endpoint(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/admin/ping');

        $response->assertOk();
    }

    public function test_logout_destroys_the_authenticated_session(): void
    {
        $user = User::factory()->create([
            'email' => 'logout@example.test',
            'password' => bcrypt('Secret123!'),
            'role' => 'student',
        ]);

        $this->withHeaders(['Origin' => 'http://localhost:3000'])
            ->postJson('/api/v1/auth/login', [
                'email' => $user->email,
                'password' => 'Secret123!',
            ])
            ->assertOk();

        $this->assertAuthenticatedAs($user, 'web');

        $this->withHeaders(['Origin' => 'http://localhost:3000'])
            ->postJson('/api/v1/auth/logout')
            ->assertOk();

        $this->assertGuest('web');
    }

    public function test_protected_route_rejects_request_after_logout(): void
    {
        $user = User::factory()->create([
            'email' => 'logout-me@example.test',
            'password' => bcrypt('Secret123!'),
            'role' => 'student',
        ]);

        $this->withHeaders(['Origin' => 'http://localhost:3000'])
            ->postJson('/api/v1/auth/login', [
                'email' => $user->email,
                'password' => 'Secret123!',
            ])
            ->assertOk();

        // Sanctum resuelve su guard vía `Auth::viaRequest`, que cachea el
        // usuario autenticado en la instancia de `RequestGuard`. En un proceso
        // real cada petición HTTP crea una instancia nueva, pero el harness de
        // pruebas reutiliza `$this->app` entre llamadas `call()` sucesivas;
        // `forgetGuards()` fuerza una resolución fresca y simula fielmente
        // peticiones HTTP independientes (patrón recomendado por Laravel para
        // probar flujos multi-petición de autenticación).
        Auth::forgetGuards();

        $this->withHeaders(['Origin' => 'http://localhost:3000'])
            ->postJson('/api/v1/auth/logout')
            ->assertOk();

        Auth::forgetGuards();

        $this->withHeaders(['Origin' => 'http://localhost:3000'])
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized();
    }

    public function test_prof_can_access_prof_endpoint(): void
    {
        $prof = User::factory()->create([
            'role' => 'prof',
        ]);

        Sanctum::actingAs($prof);

        $response = $this->getJson('/api/v1/prof/ping');

        $response->assertOk();
    }

    public function test_student_cannot_access_prof_endpoint(): void
    {
        $student = User::factory()->create([
            'role' => 'student',
        ]);

        Sanctum::actingAs($student);

        $response = $this->getJson('/api/v1/prof/ping');

        $response->assertForbidden();
    }

    public function test_login_rate_limit_returns_too_many_requests_after_five_attempts(): void
    {
        $ipAddress = '10.10.10.10';

        User::factory()->create([
            'email' => 'limit@example.test',
            'password' => bcrypt('Secret123!'),
        ]);

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->withServerVariables(['REMOTE_ADDR' => $ipAddress])
                ->postJson('/api/v1/auth/login', [
                    'email' => 'limit@example.test',
                    'password' => 'WrongSecret!',
                ])
                ->assertUnauthorized();
        }

        $response = $this->withServerVariables(['REMOTE_ADDR' => $ipAddress])
            ->postJson('/api/v1/auth/login', [
                'email' => 'limit@example.test',
                'password' => 'WrongSecret!',
            ]);

        $response->assertStatus(429);
    }
}
