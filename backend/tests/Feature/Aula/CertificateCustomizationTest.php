<?php

namespace Tests\Feature\Aula;

use App\Models\Tenant;
use App\Models\User;
use App\Models\CertificateTemplate;
use App\Services\TenantManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CertificateCustomizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_can_create_and_preview_builder_certificate_template(): void
    {
        // 1. Create Tenant and Tenant Context
        $tenant = Tenant::create([
            'name' => 'Aula Verde',
            'slug' => 'aula-verde',
            'status' => 'active',
            'primary_color' => '#10B981',
            'secondary_color' => '#3B82F6',
            'payment_methods' => []
        ]);

        $tenantManager = app(TenantManager::class);
        $tenantManager->setTenant($tenant);

        // 2. Create Admin user
        $admin = User::create([
            'name' => 'Admin Verde',
            'email' => 'admin@verde.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
            'tenant_id' => $tenant->id,
        ]);

        // 3. Post to store template with builder settings (no template file)
        $fields = [
            'name' => ['page' => 1, 'x' => 28, 'y' => 90, 'width' => 240, 'fontSize' => 26, 'align' => 'center'],
            'code' => ['page' => 1, 'x' => 28, 'y' => 180, 'width' => 80, 'fontSize' => 10, 'align' => 'left'],
            'grade' => ['page' => 1, 'x' => 200, 'y' => 180, 'width' => 70, 'fontSize' => 10, 'align' => 'right'],
            'is_builder' => true,
            'builder_settings' => [
                'logo_path' => null,
                'logo_pos' => ['x' => 123, 'y' => 22, 'width' => 50, 'height' => 20],
                'header_text' => 'DIPLOMA DE EXCELENCIA',
                'header_pos' => ['x' => 28, 'y' => 55, 'width' => 240, 'fontSize' => 24, 'align' => 'center'],
                'body_text' => 'Otorgado a el/la estudiante por su alto rendimiento.',
                'body_pos' => ['x' => 28, 'y' => 125, 'width' => 240, 'fontSize' => 14, 'align' => 'center'],
                'signature_text_1' => 'Director General',
                'signature_pos_1' => ['x' => 108, 'y' => 175, 'width' => 80, 'fontSize' => 11, 'align' => 'center'],
                'signature_img_1' => null,
                'signature_img_pos_1' => ['x' => 123, 'y' => 148, 'width' => 50, 'height' => 22],
                'custom_rectangles' => [
                    ['id' => 'r1', 'x' => 50, 'y' => 50, 'width' => 197, 'height' => 110, 'color' => '#CCCCCC', 'filled' => false]
                ],
            ]
        ];

        $response = $this->actingAs($admin)
            ->withHeader('X-Tenant-Slug', 'aula-verde')
            ->postJson('/api/v1/admin/certificates/template', [
                'name' => 'Plantilla Predeterminada Verde',
                'fields' => json_encode($fields),
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('certificate_templates', [
            'name' => 'Plantilla Predeterminada Verde',
            'tenant_id' => $tenant->id,
        ]);

        $templateId = $response->json('id');

        // 4. Test Preview using visual builder template
        $previewResponse = $this->actingAs($admin)
            ->withHeader('X-Tenant-Slug', 'aula-verde')
            ->postJson('/api/v1/admin/certificates/preview', [
                'template_id' => $templateId,
                'fields' => json_encode($fields),
                'student_name' => 'Carlos Fuentes',
                'dni' => '77665544',
                'code' => 'VERDE-123',
                'grade' => '20',
            ]);

        $previewResponse->assertStatus(200);
        $previewResponse->assertJsonStructure(['url', 'preview']);
        
        $filePath = str_replace('/storage/', '', $previewResponse->json('url'));
        $this->assertTrue(Storage::disk('public')->exists($filePath));
    }
}
