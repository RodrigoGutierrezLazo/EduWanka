<?php

namespace Tests\Feature\Aula;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Hallazgo 2.1: la unicidad de ciertas columnas (email, slug, certificate_code,
 * idempotency_key) pasó de ser GLOBAL a ser POR TENANT. Estas pruebas verifican
 * el nuevo índice compuesto sobre `users.email` a nivel de base de datos.
 */
class TenantCompositeUniqueTest extends TestCase
{
    use RefreshDatabase;

    public function test_same_email_is_allowed_across_different_tenants(): void
    {
        $tenantA = Tenant::create(['name' => 'Colegio A', 'slug' => 'colegio-a', 'status' => 'active']);
        $tenantB = Tenant::create(['name' => 'Colegio B', 'slug' => 'colegio-b', 'status' => 'active']);

        $userA = User::factory()->create([
            'email' => 'misma@correo.test',
            'tenant_id' => $tenantA->id,
        ]);

        // Mismo correo, distinto tenant: debe permitirse sin excepción.
        $userB = User::factory()->create([
            'email' => 'misma@correo.test',
            'tenant_id' => $tenantB->id,
        ]);

        $this->assertNotEquals($userA->tenant_id, $userB->tenant_id);
        $this->assertEquals('misma@correo.test', $userB->email);
        $this->assertDatabaseCount('users', 2);
    }

    public function test_same_email_is_rejected_within_the_same_tenant(): void
    {
        $tenant = Tenant::create(['name' => 'Colegio A', 'slug' => 'colegio-a', 'status' => 'active']);

        User::factory()->create([
            'email' => 'duplicado@correo.test',
            'tenant_id' => $tenant->id,
        ]);

        $this->expectException(QueryException::class);

        // Segundo usuario con el MISMO correo en el MISMO tenant: viola el índice
        // único compuesto (tenant_id, email).
        User::withoutEvents(function () use ($tenant) {
            User::create([
                'name' => 'Otro',
                'email' => 'duplicado@correo.test',
                'password' => Hash::make('Password123!'),
                'role' => 'student',
                'tenant_id' => $tenant->id,
            ]);
        });
    }
}
