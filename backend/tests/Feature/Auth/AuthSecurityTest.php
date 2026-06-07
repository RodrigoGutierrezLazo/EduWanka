<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\PersonalAccessToken;
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

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'Secret123!',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.email', 'student@example.test')
            ->assertJsonPath('data.role', 'student');
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

    public function test_logout_revokes_current_token(): void
    {
        $user = User::factory()->create([
            'email' => 'logout@example.test',
            'password' => bcrypt('Secret123!'),
            'role' => 'student',
        ]);

        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'Secret123!',
        ]);

        $token = $loginResponse->json('data.token');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/auth/logout')
            ->assertOk();

        $this->assertNull(PersonalAccessToken::findToken($token));
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
