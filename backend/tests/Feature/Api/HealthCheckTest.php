<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    public function test_health_endpoint_returns_expected_payload(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => ['status', 'service'],
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'ok',
                    'service' => 'eduwanka-api',
                ],
            ]);
    }
}
