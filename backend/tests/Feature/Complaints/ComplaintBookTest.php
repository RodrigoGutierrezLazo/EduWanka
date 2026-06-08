<?php

namespace Tests\Feature\Complaints;

use App\Models\Complaint;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ComplaintBookTest extends TestCase
{
    use RefreshDatabase;

    private function tenant(string $slug): Tenant
    {
        return Tenant::create(['name' => "Colegio {$slug}", 'slug' => $slug, 'status' => 'active']);
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'type' => 'reclamo',
            'full_name' => 'Ana Flores',
            'document_type' => 'DNI',
            'document_number' => '12345678',
            'email' => 'ana@correo.test',
            'phone' => '987654321',
            'address' => 'Av. Siempre Viva 123',
            'is_minor' => false,
            'claimed_item' => 'Diplomado de Arbitraje',
            'claimed_item_type' => 'servicio',
            'claimed_amount' => 850.00,
            'detail' => 'No se emitió el diploma prometido.',
            'consumer_request' => 'Solicito la emisión inmediata del diploma.',
        ], $overrides);
    }

    public function test_public_can_register_a_complaint_and_gets_a_tracking_code(): void
    {
        $tenant = $this->tenant('uno');

        $response = $this->withHeader('X-Tenant-Slug', 'uno')
            ->postJson('/api/v1/complaints', $this->validPayload());

        $response->assertCreated()
            ->assertJsonPath('data.status', 'recibido')
            ->assertJsonStructure(['data' => ['code', 'status', 'created_at']]);

        $code = $response->json('data.code');
        $this->assertMatchesRegularExpression('/^RCL-\d{4}-\d{6}$/', $code);

        $this->assertDatabaseHas('complaints', [
            'code' => $code,
            'tenant_id' => $tenant->id,
            'document_number' => '12345678',
            'status' => 'recibido',
        ]);
    }

    public function test_complaint_folios_are_sequential_per_tenant(): void
    {
        $this->tenant('uno');

        $first = $this->withHeader('X-Tenant-Slug', 'uno')
            ->postJson('/api/v1/complaints', $this->validPayload())->json('data.code');
        $second = $this->withHeader('X-Tenant-Slug', 'uno')
            ->postJson('/api/v1/complaints', $this->validPayload())->json('data.code');

        $this->assertStringEndsWith('000001', $first);
        $this->assertStringEndsWith('000002', $second);
    }

    public function test_minor_requires_guardian_data(): void
    {
        $this->tenant('uno');

        $this->withHeader('X-Tenant-Slug', 'uno')
            ->postJson('/api/v1/complaints', $this->validPayload(['is_minor' => true]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['guardian_name', 'guardian_document_number']);
    }

    public function test_track_returns_status_within_scope(): void
    {
        $this->tenant('uno');
        $code = $this->withHeader('X-Tenant-Slug', 'uno')
            ->postJson('/api/v1/complaints', $this->validPayload())->json('data.code');

        $this->withHeader('X-Tenant-Slug', 'uno')
            ->getJson("/api/v1/complaints/track/{$code}")
            ->assertOk()
            ->assertJsonPath('data.code', $code)
            ->assertJsonPath('data.status', 'recibido');
    }

    public function test_track_does_not_leak_complaints_across_tenants(): void
    {
        $this->tenant('uno');
        $this->tenant('dos');

        $code = $this->withHeader('X-Tenant-Slug', 'uno')
            ->postJson('/api/v1/complaints', $this->validPayload())->json('data.code');

        // Buscar el folio del tenant uno desde el tenant dos → 404.
        $this->withHeader('X-Tenant-Slug', 'dos')
            ->getJson("/api/v1/complaints/track/{$code}")
            ->assertNotFound();
    }

    public function test_admin_only_sees_their_tenants_complaints(): void
    {
        $tenantA = $this->tenant('uno');
        $tenantB = $this->tenant('dos');

        $this->withHeader('X-Tenant-Slug', 'uno')->postJson('/api/v1/complaints', $this->validPayload(['full_name' => 'De Uno']));
        $this->withHeader('X-Tenant-Slug', 'dos')->postJson('/api/v1/complaints', $this->validPayload(['full_name' => 'De Dos']));

        $admin = User::factory()->create(['role' => 'admin', 'tenant_id' => $tenantA->id]);

        $response = $this->actingAs($admin)
            ->withHeader('X-Tenant-Slug', 'uno')
            ->getJson('/api/v1/aula/admin/complaints');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('De Uno', $response->json('data.0.full_name'));
    }

    public function test_admin_can_respond_and_change_status(): void
    {
        $tenant = $this->tenant('uno');
        $this->withHeader('X-Tenant-Slug', 'uno')->postJson('/api/v1/complaints', $this->validPayload());
        $complaint = Complaint::first();

        $admin = User::factory()->create(['role' => 'admin', 'tenant_id' => $tenant->id]);

        $this->actingAs($admin)
            ->withHeader('X-Tenant-Slug', 'uno')
            ->patchJson("/api/v1/aula/admin/complaints/{$complaint->id}", [
                'status' => 'resuelto',
                'response' => 'Se emitió el diploma.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'resuelto');

        $this->assertDatabaseHas('complaints', [
            'id' => $complaint->id,
            'status' => 'resuelto',
            'responded_by_user_id' => $admin->id,
        ]);
    }

    public function test_student_cannot_access_admin_complaints(): void
    {
        $tenant = $this->tenant('uno');
        $student = User::factory()->create(['role' => 'student', 'tenant_id' => $tenant->id]);

        $this->actingAs($student)
            ->withHeader('X-Tenant-Slug', 'uno')
            ->getJson('/api/v1/aula/admin/complaints')
            ->assertForbidden();
    }

    public function test_superadmin_general_scope_returns_only_platform_complaints(): void
    {
        $tenant = $this->tenant('uno');

        // Reclamo de tenant
        $this->withHeader('X-Tenant-Slug', 'uno')->postJson('/api/v1/complaints', $this->validPayload());
        // Reclamo general (sin tenant): se crea directo para la prueba.
        Complaint::create([
            'code' => 'RCL-2026-009999',
            'tenant_id' => null,
            'type' => 'queja',
            'full_name' => 'General Persona',
            'document_number' => '87654321',
            'email' => 'g@correo.test',
            'claimed_item' => 'Plataforma',
            'detail' => 'Caída del sistema.',
            'consumer_request' => 'Compensación.',
            'status' => 'recibido',
        ]);

        $superadmin = User::factory()->create(['role' => 'superadmin', 'tenant_id' => $tenant->id]);

        $response = $this->actingAs($superadmin)
            ->withHeader('X-Tenant-Slug', 'uno')
            ->getJson('/api/v1/aula/superadmin/complaints?scope=general');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('General Persona', $response->json('data.0.full_name'));
    }
}
