<?php

namespace Tests\Feature\Files;

use App\Models\Certificate;
use App\Models\Purchase;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Hallazgo 2.5: comprobantes de pago y certificados ya no se sirven como
 * estáticos públicos, sino por endpoints autenticados con verificación de
 * propiedad y de tenant. Estas pruebas cubren el control de acceso.
 */
class SecureFileDownloadTest extends TestCase
{
    use RefreshDatabase;

    private function makeTenant(string $slug): Tenant
    {
        return Tenant::create(['name' => "Colegio {$slug}", 'slug' => $slug, 'status' => 'active']);
    }

    public function test_guest_cannot_download_a_receipt(): void
    {
        $tenant = $this->makeTenant('uno');
        $owner = User::factory()->create(['role' => 'student', 'tenant_id' => $tenant->id]);
        $purchase = Purchase::factory()->create([
            'user_id' => $owner->id,
            'tenant_id' => $tenant->id,
            'receipt_path' => 'purchases/receipts/x.jpg',
        ]);

        $this->withHeader('X-Tenant-Slug', 'uno')
            ->getJson("/api/v1/files/receipts/{$purchase->id}")
            ->assertUnauthorized();
    }

    public function test_owner_student_can_download_their_own_receipt(): void
    {
        Storage::fake('local');
        $tenant = $this->makeTenant('uno');
        $owner = User::factory()->create(['role' => 'student', 'tenant_id' => $tenant->id]);

        $path = 'purchases/receipts/comprobante.jpg';
        Storage::disk('local')->put($path, 'CONTENIDO-PDF');

        $purchase = Purchase::factory()->create([
            'user_id' => $owner->id,
            'tenant_id' => $tenant->id,
            'receipt_path' => $path,
        ]);

        $response = $this->actingAs($owner)
            ->withHeader('X-Tenant-Slug', 'uno')
            ->get("/api/v1/files/receipts/{$purchase->id}");

        $response->assertOk();
        $this->assertSame('CONTENIDO-PDF', $response->streamedContent());
    }

    public function test_a_student_cannot_download_another_students_receipt(): void
    {
        Storage::fake('local');
        $tenant = $this->makeTenant('uno');
        $owner = User::factory()->create(['role' => 'student', 'tenant_id' => $tenant->id]);
        $intruder = User::factory()->create(['role' => 'student', 'tenant_id' => $tenant->id]);

        $path = 'purchases/receipts/comprobante.jpg';
        Storage::disk('local')->put($path, 'SECRETO');

        $purchase = Purchase::factory()->create([
            'user_id' => $owner->id,
            'tenant_id' => $tenant->id,
            'receipt_path' => $path,
        ]);

        $this->actingAs($intruder)
            ->withHeader('X-Tenant-Slug', 'uno')
            ->get("/api/v1/files/receipts/{$purchase->id}")
            ->assertForbidden();
    }

    public function test_admin_can_download_a_receipt_in_their_tenant(): void
    {
        Storage::fake('local');
        $tenant = $this->makeTenant('uno');
        $owner = User::factory()->create(['role' => 'student', 'tenant_id' => $tenant->id]);
        $admin = User::factory()->create(['role' => 'admin', 'tenant_id' => $tenant->id]);

        $path = 'purchases/receipts/comprobante.jpg';
        Storage::disk('local')->put($path, 'OK');

        $purchase = Purchase::factory()->create([
            'user_id' => $owner->id,
            'tenant_id' => $tenant->id,
            'receipt_path' => $path,
        ]);

        $this->actingAs($admin)
            ->withHeader('X-Tenant-Slug', 'uno')
            ->get("/api/v1/files/receipts/{$purchase->id}")
            ->assertOk();
    }

    public function test_receipt_of_another_tenant_is_not_found(): void
    {
        Storage::fake('local');
        $tenantA = $this->makeTenant('uno');
        $tenantB = $this->makeTenant('dos');

        $ownerA = User::factory()->create(['role' => 'student', 'tenant_id' => $tenantA->id]);
        $purchaseA = Purchase::factory()->create([
            'user_id' => $ownerA->id,
            'tenant_id' => $tenantA->id,
            'receipt_path' => 'purchases/receipts/a.jpg',
        ]);

        // Un admin del tenant B intenta acceder a un comprobante del tenant A:
        // el TenantScope global oculta el registro → 404.
        $adminB = User::factory()->create(['role' => 'admin', 'tenant_id' => $tenantB->id]);

        $this->actingAs($adminB)
            ->withHeader('X-Tenant-Slug', 'dos')
            ->get("/api/v1/files/receipts/{$purchaseA->id}")
            ->assertNotFound();
    }

    public function test_owner_can_download_certificate_and_outsider_cannot(): void
    {
        Storage::fake('local');
        $tenant = $this->makeTenant('uno');
        $owner = User::factory()->create(['role' => 'student', 'tenant_id' => $tenant->id]);
        $intruder = User::factory()->create(['role' => 'student', 'tenant_id' => $tenant->id]);

        $path = 'certificates/cert.pdf';
        Storage::disk('local')->put($path, 'PDF-CERT');

        // Asignar tenant al manager para que el hook BelongsToTenant fije tenant_id.
        app(TenantManager::class)->setTenant($tenant);
        $cert = Certificate::create([
            'user_id' => $owner->id,
            'certificate_code' => 'CERT-001',
            'dni' => '12345678',
            'student_name' => 'Alumno Uno',
            'score' => 100,
            'file_path' => $path,
            'status' => 'active',
        ]);

        $this->actingAs($owner)
            ->withHeader('X-Tenant-Slug', 'uno')
            ->get("/api/v1/files/certificates/{$cert->id}")
            ->assertOk();

        $this->actingAs($intruder)
            ->withHeader('X-Tenant-Slug', 'uno')
            ->get("/api/v1/files/certificates/{$cert->id}")
            ->assertForbidden();
    }
}
