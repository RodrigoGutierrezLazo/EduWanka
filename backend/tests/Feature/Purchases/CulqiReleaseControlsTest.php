<?php

namespace Tests\Feature\Purchases;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CulqiReleaseControlsTest extends TestCase
{
    use RefreshDatabase;

    public function test_culqi_readiness_requires_authentication(): void
    {
        $response = $this->getJson('/api/v1/payments/culqi/readiness');

        $response->assertUnauthorized();
    }

    public function test_student_cannot_access_culqi_readiness_endpoint(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        Sanctum::actingAs($student);

        $response = $this->getJson('/api/v1/payments/culqi/readiness');

        $response->assertForbidden();
    }

    public function test_admin_can_view_culqi_readiness_status(): void
    {
        config()->set('services.culqi.enabled', true);
        config()->set('services.culqi.public_key', 'pk_test_123');
        config()->set('services.culqi.secret_key', 'sk_test_123');

        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/payments/culqi/readiness');

        $response
            ->assertOk()
            ->assertJsonPath('data.enabled', true)
            ->assertJsonPath('data.keys_configured', true)
            ->assertJsonPath('data.can_accept_culqi', true)
            ->assertJsonPath('data.rollback_ready', true);
    }

    public function test_admin_can_detect_culqi_rollback_mode_when_flag_is_off(): void
    {
        config()->set('services.culqi.enabled', false);
        config()->set('services.culqi.public_key', 'pk_test_123');
        config()->set('services.culqi.secret_key', 'sk_test_123');

        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/payments/culqi/readiness');

        $response
            ->assertOk()
            ->assertJsonPath('data.enabled', false)
            ->assertJsonPath('data.can_accept_culqi', false)
            ->assertJsonPath('data.rollback_mode', true);
    }

    public function test_superadmin_can_view_culqi_readiness_status(): void
    {
        config()->set('services.culqi.enabled', true);
        config()->set('services.culqi.public_key', 'pk_test_123');
        config()->set('services.culqi.secret_key', 'sk_test_123');

        $superadmin = User::factory()->create(['role' => 'superadmin']);
        Sanctum::actingAs($superadmin);

        $response = $this->getJson('/api/v1/payments/culqi/readiness');

        $response
            ->assertOk()
            ->assertJsonPath('data.enabled', true)
            ->assertJsonPath('data.can_accept_culqi', true);
    }

    public function test_readiness_shows_not_configured_when_keys_do_not_match_expected_prefix(): void
    {
        config()->set('services.culqi.enabled', true);
        config()->set('services.culqi.public_key', 'invalid_public_key');
        config()->set('services.culqi.secret_key', 'invalid_secret_key');

        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/payments/culqi/readiness');

        $response
            ->assertOk()
            ->assertJsonPath('data.enabled', true)
            ->assertJsonPath('data.keys_configured', false)
            ->assertJsonPath('data.can_accept_culqi', false);
    }
}
