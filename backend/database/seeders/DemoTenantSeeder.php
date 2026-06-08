<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoTenantSeeder extends Seeder
{
    /**
     * Seed demo tenants with simulated data.
     * Creates 3 tenants with different color themes:
     *   1. Academia Demo     - Red/granate (#7A0F1F)
     *   2. Instituto Azul    - Blue/navy  (#0F3D7A)
     *   3. Centro Verde      - Green/teal (#0F7A4A)
     */
    public function run(): void
    {
        // Limpiar datos existentes de las aulas demo para evitar duplicados en re-ejecuciones
        $slugs = ['demo', 'azul', 'verde'];
        $existingTenantIds = DB::table('tenants')->whereIn('slug', $slugs)->pluck('id')->toArray();

        if (!empty($existingTenantIds)) {
            DB::table('purchases')->whereIn('tenant_id', $existingTenantIds)->delete();
            DB::table('courses')->whereIn('tenant_id', $existingTenantIds)->delete();
            DB::table('users')->whereIn('tenant_id', $existingTenantIds)->delete();
            DB::table('tenants')->whereIn('id', $existingTenantIds)->delete();
        }

        $tenants = [
            [
                'name'    => 'Academia Demo',
                'slug'    => 'demo',
                'domain'  => 'demo.eduwanka.net.pe',
                'plan'    => 'pro',
                'settings' => [
                    'primary_color' => '#7A0F1F',
                    'accent_color'  => '#C8A14A',
                    'logo_url'      => null,
                    'description'   => 'Aula de demostración con tema granate. Explora todas las funcionalidades de EduWanka SaaS.',
                ],
                'courses' => [
                    ['title' => 'Diplomado en Gestión Pública', 'slug' => 'diplomado-gestion-publica-demo', 'description' => 'Formación integral en administración pública moderna, normatividad y gestión de recursos del Estado.', 'category' => 'Gestión Pública', 'type' => 'DIPLOMADO', 'price' => 450.00, 'price_label' => 'S/ 450.00', 'duration_weeks' => 12, 'status' => 'published'],
                    ['title' => 'Curso de Contrataciones del Estado', 'slug' => 'contrataciones-estado-demo', 'description' => 'Domina los procesos de contratación estatal, la Ley de Contrataciones y su reglamento vigente.', 'category' => 'Derecho Administrativo', 'type' => 'CURSO', 'price' => 180.00, 'price_label' => 'S/ 180.00', 'duration_weeks' => 6, 'status' => 'published'],
                    ['title' => 'Taller de Redacción Jurídica Avanzada', 'slug' => 'redaccion-juridica-demo', 'description' => 'Mejora tus habilidades de redacción de documentos legales, contratos y escritos judiciales.', 'category' => 'Habilidades Legales', 'type' => 'TALLER', 'price' => 120.00, 'price_label' => 'S/ 120.00', 'duration_weeks' => 4, 'status' => 'published'],
                ],
                'admin'     => ['name' => 'Admin', 'last_name' => 'Demo', 'email' => 'admin@demo.eduwanka.net.pe'],
                'professor' => ['name' => 'Carlos', 'last_name' => 'Mendoza Quispe', 'email' => 'prof@demo.eduwanka.net.pe'],
                'students'  => [
                    ['María', 'Torres Guzmán'], ['Luis', 'Fernández Vargas'], ['Ana', 'Sánchez Paredes'],
                    ['Pedro', 'Rojas López'], ['Carmen', 'Huamán Ríos'], ['Diego', 'Castillo Vera'],
                    ['Rosa', 'Espinoza Chávez'], ['Miguel', 'Arana Salazar'], ['Lucía', 'Ochoa Ramírez'],
                    ['Jorge', 'Benítez Arias'], ['Patricia', 'Núñez Díaz'], ['Fernando', 'Quispe Mamani'],
                    ['Silvia', 'Condori Apaza'], ['Roberto', 'Vilca Cáceres'], ['Isabel', 'Morales Flores'],
                ],
            ],
            [
                'name'    => 'Instituto Azul',
                'slug'    => 'azul',
                'domain'  => 'azul.eduwanka.net.pe',
                'plan'    => 'professional',
                'settings' => [
                    'primary_color' => '#0F3D7A',
                    'accent_color'  => '#4A98C8',
                    'logo_url'      => null,
                    'description'   => 'Instituto con tema azul navy. Especializado en tecnología y ciencias de la computación.',
                ],
                'courses' => [
                    ['title' => 'Desarrollo Web Full Stack', 'slug' => 'fullstack-azul', 'description' => 'Aprende HTML, CSS, JavaScript, React y Node.js para crear aplicaciones web profesionales.', 'category' => 'Tecnología', 'type' => 'CURSO', 'price' => 350.00, 'price_label' => 'S/ 350.00', 'duration_weeks' => 10, 'status' => 'published'],
                    ['title' => 'Ciberseguridad Empresarial', 'slug' => 'ciberseguridad-azul', 'description' => 'Protege los activos digitales de tu organización con las mejores prácticas y herramientas.', 'category' => 'Seguridad', 'type' => 'DIPLOMADO', 'price' => 520.00, 'price_label' => 'S/ 520.00', 'duration_weeks' => 14, 'status' => 'published'],
                    ['title' => 'Inteligencia Artificial Aplicada', 'slug' => 'ia-aplicada-azul', 'description' => 'Implementa modelos de machine learning y deep learning en proyectos reales.', 'category' => 'Tecnología', 'type' => 'CURSO', 'price' => 280.00, 'price_label' => 'S/ 280.00', 'duration_weeks' => 8, 'status' => 'published'],
                ],
                'admin'     => ['name' => 'Admin', 'last_name' => 'Azul', 'email' => 'admin@azul.eduwanka.net.pe'],
                'professor' => ['name' => 'Elena', 'last_name' => 'Vargas Torres', 'email' => 'prof@azul.eduwanka.net.pe'],
                'students'  => [
                    ['Andrés', 'Gutiérrez Lima'], ['Sofía', 'Paredes Cruz'], ['Daniel', 'Ríos Poma'],
                    ['Valeria', 'Cárdenas Muñoz'], ['Mateo', 'Salazar Inca'], ['Camila', 'Torres Calla'],
                    ['Sebastián', 'Flores Yupanqui'], ['Gabriela', 'Montoya Ramos'], ['Alejandro', 'Ccasa Quispe'],
                    ['Natalia', 'Huanca Mamani'], ['Ricardo', 'Arce Vilca'],  ['Laura', 'Pari Choque'],
                ],
            ],
            [
                'name'    => 'Centro Verde',
                'slug'    => 'verde',
                'domain'  => 'verde.eduwanka.net.pe',
                'plan'    => 'starter',
                'settings' => [
                    'primary_color' => '#0F7A4A',
                    'accent_color'  => '#4AC87A',
                    'logo_url'      => null,
                    'description'   => 'Centro con tema verde esmeralda. Enfocado en salud, medio ambiente y bienestar.',
                ],
                'courses' => [
                    ['title' => 'Nutrición y Dietética Clínica', 'slug' => 'nutricion-verde', 'description' => 'Fundamentos de nutrición clínica, planificación de dietas y manejo nutricional del paciente.', 'category' => 'Salud', 'type' => 'DIPLOMADO', 'price' => 400.00, 'price_label' => 'S/ 400.00', 'duration_weeks' => 12, 'status' => 'published'],
                    ['title' => 'Gestión Ambiental Sostenible', 'slug' => 'gestion-ambiental-verde', 'description' => 'Estrategias para la conservación del medio ambiente y desarrollo sostenible en organizaciones.', 'category' => 'Medio Ambiente', 'type' => 'CURSO', 'price' => 220.00, 'price_label' => 'S/ 220.00', 'duration_weeks' => 8, 'status' => 'published'],
                    ['title' => 'Primeros Auxilios y Emergencias', 'slug' => 'primeros-auxilios-verde', 'description' => 'Capacitación práctica en atención de emergencias, RCP y manejo de situaciones críticas.', 'category' => 'Salud', 'type' => 'TALLER', 'price' => 90.00, 'price_label' => 'S/ 90.00', 'duration_weeks' => 3, 'status' => 'published'],
                ],
                'admin'     => ['name' => 'Admin', 'last_name' => 'Verde', 'email' => 'admin@verde.eduwanka.net.pe'],
                'professor' => ['name' => 'Javier', 'last_name' => 'Huamán Condori', 'email' => 'prof@verde.eduwanka.net.pe'],
                'students'  => [
                    ['Claudia', 'Quispe Mamani'], ['Oscar', 'Ccama Ramos'], ['Fernanda', 'Apaza Huanca'],
                    ['Gonzalo', 'Vilca Tacuri'], ['Viviana', 'Choque Flores'], ['Raúl', 'Yupanqui Lima'],
                    ['Teresa', 'Mamani Condori'], ['Eduardo', 'Puma Canaza'], ['Luz', 'Ticona Ccalla'],
                    ['Héctor', 'Cárdenas Coaquira'],
                ],
            ],
        ];

        foreach ($tenants as $config) {
            $this->seedTenant($config);
        }

        $this->command->info('');
        $this->command->info('╔══════════════════════════════════════════════════════════════╗');
        $this->command->info('║  ✅ 3 AULAS DEMO CREADAS CON ÉXITO                         ║');
        $this->command->info('╠══════════════════════════════════════════════════════════════╣');
        $this->command->info('║                                                              ║');
        $this->command->info('║  🔴 Academia Demo (Granate)                                 ║');
        $this->command->info('║     URL:    demo.eduwanka.net.pe                             ║');
        $this->command->info('║     Admin:  admin@demo.eduwanka.net.pe / demo1234           ║');
        $this->command->info('║     Prof:   prof@demo.eduwanka.net.pe  / demo1234           ║');
        $this->command->info('║     Color:  #7A0F1F (Granate) + #C8A14A (Dorado)            ║');
        $this->command->info('║                                                              ║');
        $this->command->info('║  🔵 Instituto Azul (Navy)                                   ║');
        $this->command->info('║     URL:    azul.eduwanka.net.pe                             ║');
        $this->command->info('║     Admin:  admin@azul.eduwanka.net.pe / demo1234           ║');
        $this->command->info('║     Prof:   prof@azul.eduwanka.net.pe  / demo1234           ║');
        $this->command->info('║     Color:  #0F3D7A (Azul Navy) + #4A98C8 (Celeste)         ║');
        $this->command->info('║                                                              ║');
        $this->command->info('║  🟢 Centro Verde (Esmeralda)                                ║');
        $this->command->info('║     URL:    verde.eduwanka.net.pe                            ║');
        $this->command->info('║     Admin:  admin@verde.eduwanka.net.pe / demo1234          ║');
        $this->command->info('║     Prof:   prof@verde.eduwanka.net.pe  / demo1234          ║');
        $this->command->info('║     Color:  #0F7A4A (Verde) + #4AC87A (Verde Claro)         ║');
        $this->command->info('║                                                              ║');
        $this->command->info('║  Contraseña universal: demo1234                              ║');
        $this->command->info('╚══════════════════════════════════════════════════════════════╝');
    }

    private function seedTenant(array $config): void
    {
        // ── 1. Tenant record ────────────────────────────────────
        $tenantId = DB::table('tenants')->insertGetId([
            'name'            => $config['name'],
            'slug'            => $config['slug'],
            'domain'          => $config['domain'],
            'plan'            => $config['plan'],
            'status'          => 'active',
            'primary_color'   => $config['settings']['primary_color'] ?? '#7A0F1F',
            'secondary_color' => $config['settings']['accent_color'] ?? '#C8A14A',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        // ── 2. Admin user ───────────────────────────────────────
        DB::table('users')->insert([
            'name'       => $config['admin']['name'],
            'last_name'  => $config['admin']['last_name'],
            'email'      => $config['admin']['email'],
            'password'   => Hash::make('demo1234'),
            'role'       => 'admin',
            'tenant_id'  => $tenantId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // ── 3. Professor ────────────────────────────────────────
        DB::table('users')->insert([
            'name'       => $config['professor']['name'],
            'last_name'  => $config['professor']['last_name'],
            'email'      => $config['professor']['email'],
            'password'   => Hash::make('demo1234'),
            'role'       => 'prof',
            'tenant_id'  => $tenantId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // ── 4. Students ─────────────────────────────────────────
        $studentIds = [];
        foreach ($config['students'] as $idx => [$name, $lastName]) {
            $studentIds[] = DB::table('users')->insertGetId([
                'name'       => $name,
                'last_name'  => $lastName,
                'email'      => "est{$idx}@{$config['slug']}.eduwanka.net.pe",
                'password'   => Hash::make('demo1234'),
                'role'       => 'student',
                'tenant_id'  => $tenantId,
                'created_at' => now()->subDays(rand(1, 60)),
                'updated_at' => now(),
            ]);
        }

        // ── 5. Courses ──────────────────────────────────────────
        $courseIds = [];
        foreach ($config['courses'] as $courseData) {
            $courseIds[] = DB::table('courses')->insertGetId([
                'title'          => $courseData['title'],
                'slug'           => $courseData['slug'],
                'description'    => $courseData['description'],
                'specialty'      => $courseData['category'] ?? null,
                'type'           => $courseData['type'] ?? 'Curso',
                'price'          => $courseData['price'],
                'duration_weeks' => $courseData['duration_weeks'],
                'is_published'   => ($courseData['status'] ?? 'published') === 'published',
                'tenant_id'      => $tenantId,
                'created_at'     => now()->subDays(rand(10, 90)),
                'updated_at'     => now(),
            ]);
        }

        // ── 6. Purchases ────────────────────────────────────────
        $statuses = ['paid', 'validated', 'pending_validation', 'pending_payment'];
        $banks    = ['BCP', 'Interbank', 'BBVA', 'Scotiabank', 'Yape'];

        foreach ($studentIds as $studentId) {
            $numCourses = min(count($courseIds), rand(1, 2));
            $selected   = array_slice($courseIds, 0, $numCourses);

            foreach ($selected as $courseId) {
                $ci     = array_search($courseId, $courseIds);
                $course = $config['courses'][$ci];

                DB::table('purchases')->insert([
                    'user_id'          => $studentId,
                    'course_id'        => $courseId,
                    'amount'           => $course['price'],
                    'status'           => $statuses[array_rand($statuses)],
                    'payment_method'   => 'transfer',
                    'bank_entity'      => $banks[array_rand($banks)],
                    'operation_number' => strtoupper(Str::random(8)),
                    'tenant_id'        => $tenantId,
                    'idempotency_key'  => (string) Str::uuid(),
                    'created_at'       => now()->subDays(rand(1, 30)),
                    'updated_at'       => now(),
                ]);
            }
        }
    }
}
