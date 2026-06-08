<?php

namespace Tests\Unit;

use App\Models\Tenant;
use App\Services\TenantManager;
use PHPUnit\Framework\TestCase;

/**
 * Pruebas unitarias puras (sin base de datos) del TenantManager, el servicio
 * que mantiene el inquilino activo durante el ciclo de una petición y del que
 * dependen el TenantScope global y el trait BelongsToTenant.
 */
class TenantManagerTest extends TestCase
{
    public function test_starts_without_an_active_tenant(): void
    {
        $manager = new TenantManager();

        $this->assertFalse($manager->hasTenant());
        $this->assertNull($manager->getTenant());
        $this->assertNull($manager->getTenantId());
    }

    public function test_set_tenant_exposes_it_and_its_id(): void
    {
        $manager = new TenantManager();

        // Modelo en memoria, sin tocar la base de datos.
        $tenant = (new Tenant())->forceFill(['id' => 42, 'slug' => 'colegio-x']);
        $manager->setTenant($tenant);

        $this->assertTrue($manager->hasTenant());
        $this->assertSame($tenant, $manager->getTenant());
        $this->assertSame(42, $manager->getTenantId());
    }

    public function test_setting_a_new_tenant_replaces_the_previous_one(): void
    {
        $manager = new TenantManager();

        $first = (new Tenant())->forceFill(['id' => 1]);
        $second = (new Tenant())->forceFill(['id' => 2]);

        $manager->setTenant($first);
        $manager->setTenant($second);

        $this->assertSame(2, $manager->getTenantId());
    }
}
