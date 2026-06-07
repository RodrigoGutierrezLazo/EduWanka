<?php

namespace Tests\Feature\Aula;

use App\Models\Course;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantManager;
use App\Models\Scopes\TenantScope;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_isolation_in_database_queries(): void
    {
        // 1. Crear dos inquilinos
        $tenant1 = Tenant::create([
            'name' => 'Colegio A',
            'slug' => 'colegio-a',
            'status' => 'active',
        ]);

        $tenant2 = Tenant::create([
            'name' => 'Colegio B',
            'slug' => 'colegio-b',
            'status' => 'active',
        ]);

        $tenantManager = app(TenantManager::class);

        // 2. Simular inquilino 1 y crear curso
        $tenantManager->setTenant($tenant1);
        $course1 = Course::create([
            'title' => 'Curso de Colegio A',
            'code' => 'COLA-01',
            'price' => 100.00,
            'duration_weeks' => 12,
            'hours' => 120,
            'level' => 'intermedio',
            'teacher_name' => 'Profesor Test',
            'slug' => 'curso-a',
        ]);

        // Validar que se asignó tenant_id automáticamente
        $this->assertEquals($tenant1->id, $course1->tenant_id);

        // 3. Simular inquilino 2 y crear curso
        $tenantManager->setTenant($tenant2);
        $course2 = Course::create([
            'title' => 'Curso de Colegio B',
            'code' => 'COLB-01',
            'price' => 150.00,
            'duration_weeks' => 10,
            'hours' => 100,
            'level' => 'básico',
            'teacher_name' => 'Profesor Test',
            'slug' => 'curso-b',
        ]);

        $this->assertEquals($tenant2->id, $course2->tenant_id);

        // 4. Validar aislamiento cuando inquilino 1 está activo
        $tenantManager->setTenant($tenant1);
        $coursesFor1 = Course::all();
        $this->assertCount(1, $coursesFor1);
        $this->assertEquals($course1->id, $coursesFor1->first()->id);

        // 5. Validar aislamiento cuando inquilino 2 está activo
        $tenantManager->setTenant($tenant2);
        $coursesFor2 = Course::all();
        $this->assertCount(1, $coursesFor2);
        $this->assertEquals($course2->id, $coursesFor2->first()->id);

        // 6. Validar que bypass de scope retorna todo
        $allCourses = Course::withoutGlobalScope(TenantScope::class)->get();
        $this->assertCount(2, $allCourses);
    }

    public function test_tenant_middleware_resolves_and_validates_tenant(): void
    {
        $tenant = Tenant::create([
            'name' => 'Colegio EduWanka',
            'slug' => 'eduwanka',
            'status' => 'active',
        ]);

        // Cargar un usuario
        $user = User::factory()->create([
            'role' => 'student',
            'tenant_id' => $tenant->id,
        ]);

        // Petición con el header correcto
        $response = $this->actingAs($user)
            ->withHeader('X-Tenant-Slug', 'eduwanka')
            ->getJson('/api/v1/aula/student-data');

        $response->assertStatus(200);
        $response->assertJsonStructure(['purchases', 'certificates', 'stats']);
    }

    public function test_tenant_middleware_rejects_suspended_tenant(): void
    {
        $tenant = Tenant::create([
            'name' => 'Colegio EduWanka',
            'slug' => 'eduwanka',
            'status' => 'suspended', // SUSPENDIDO!
        ]);

        $user = User::factory()->create([
            'role' => 'student',
            'tenant_id' => $tenant->id,
        ]);

        $response = $this->actingAs($user)
            ->withHeader('X-Tenant-Slug', 'eduwanka')
            ->getJson('/api/v1/aula/student-data');

        $response->assertStatus(403);
        $response->assertJsonFragment(['error' => 'This institution has been suspended.']);
    }
}
