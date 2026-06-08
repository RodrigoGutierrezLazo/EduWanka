<?php

namespace Tests\Feature\Learning;

use App\Models\Certificate;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Hallazgo 2.3 (cobertura): ciclo de vida del certificado a través del endpoint
 * público de verificación: emisión → verificación válida → revocación →
 * verificación rechazada (410) → restauración → verificación válida de nuevo.
 */
class CertificateLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tenant = Tenant::create(['name' => 'Colegio Uno', 'slug' => 'uno', 'status' => 'active']);
        app(TenantManager::class)->setTenant($this->tenant);
    }

    private function makeCertificate(): Certificate
    {
        $student = User::factory()->create(['role' => 'student', 'tenant_id' => $this->tenant->id, 'dni' => '12345678']);

        return Certificate::create([
            'user_id' => $student->id,
            'certificate_code' => 'CERT-LIFECYCLE-1',
            'dni' => '12345678',
            'student_name' => 'Alumno Uno',
            'score' => 100,
            'status' => 'active',
        ]);
    }

    private function verify(string $code, string $dni)
    {
        return $this->withHeader('X-Tenant-Slug', 'uno')
            ->postJson('/api/v1/certificates/verify', [
                'certificate_code' => $code,
                'dni' => $dni,
            ]);
    }

    public function test_active_certificate_verifies_successfully_with_matching_dni(): void
    {
        $cert = $this->makeCertificate();

        $this->verify($cert->certificate_code, '12345678')
            ->assertOk()
            ->assertJsonPath('valid', true);
    }

    public function test_verification_fails_when_dni_does_not_match(): void
    {
        $cert = $this->makeCertificate();

        $this->verify($cert->certificate_code, '99999999')
            ->assertStatus(422)
            ->assertJsonPath('valid', false);
    }

    public function test_revoked_certificate_is_reported_as_gone(): void
    {
        $cert = $this->makeCertificate();

        $cert->update(['status' => 'revoked', 'revoked_at' => now(), 'revoked_reason' => 'Prueba']);

        $this->verify($cert->certificate_code, '12345678')
            ->assertStatus(410)
            ->assertJsonPath('valid', false);
    }

    public function test_restored_certificate_verifies_again(): void
    {
        $cert = $this->makeCertificate();
        $cert->update(['status' => 'revoked', 'revoked_at' => now()]);
        $this->verify($cert->certificate_code, '12345678')->assertStatus(410);

        // Restaurar
        $cert->update(['status' => 'active', 'revoked_at' => null, 'revoked_reason' => null]);

        $this->verify($cert->certificate_code, '12345678')
            ->assertOk()
            ->assertJsonPath('valid', true);
    }

    public function test_unknown_code_returns_not_found(): void
    {
        $this->verify('NO-EXISTE', '12345678')
            ->assertStatus(404)
            ->assertJsonPath('valid', false);
    }
}
