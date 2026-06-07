<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Purchase;
use App\Models\User;
use App\Models\Teacher;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class LocalDemoSeeder extends Seeder
{
    public const DEMO_PASSWORD = 'Password123!';

    public const COURSE_CODE = 'EDUWANKA-MVP';

    public function run(): void
    {
        $passwordHash = Hash::make(self::DEMO_PASSWORD);

        $student = User::updateOrCreate(
            ['email' => 'student@eduwanka.local'],
            ['name' => 'Demo Estudiante', 'password' => $passwordHash, 'role' => 'student', 'dni' => '70000001', 'phone' => '987654321'],
        );
        User::updateOrCreate(
            ['email' => 'prof@eduwanka.local'],
            ['name' => 'Demo Profesor', 'password' => $passwordHash, 'role' => 'prof', 'dni' => '70000002'],
        );
        User::updateOrCreate(
            ['email' => 'admin@eduwanka.local'],
            ['name' => 'Demo Admin', 'password' => $passwordHash, 'role' => 'admin', 'dni' => '70000003'],
        );
        User::updateOrCreate(
            ['email' => 'superadmin@eduwanka.local'],
            ['name' => 'Demo Superadmin', 'password' => $passwordHash, 'role' => 'superadmin', 'dni' => '70000004'],
        );

        // Cursos demo para que el panel admin no aparezca vacío
        $coursesDemo = [
            ['code' => 'DER-001', 'title' => 'Derecho Constitucional Avanzado',  'level' => 'avanzado',   'price' => 299.00, 'teacher_name' => 'Lic. Carlos Mendoza',  'duration_weeks' => 12, 'description' => 'Análisis profundo del Derecho Constitucional peruano contemporáneo.'],
            ['code' => 'DER-002', 'title' => 'Derecho Penal Empresarial',         'level' => 'intermedio', 'price' => 249.00, 'teacher_name' => 'Dra. Ana Rodríguez',   'duration_weeks' => 10, 'description' => 'Responsabilidad penal de las personas jurídicas y compliance.'],
            ['code' => 'DER-003', 'title' => 'Procedimientos Civil Moderno',      'level' => 'intermedio', 'price' => 279.00, 'teacher_name' => 'Dr. Miguel Torres',    'duration_weeks' => 11, 'description' => 'Aplicación práctica del Nuevo Código Procesal Civil.'],
            ['code' => 'DER-004', 'title' => 'Contrataciones del Estado',         'level' => 'avanzado',   'price' => 329.00, 'teacher_name' => 'Dra. Patricia Vega',   'duration_weeks' => 14, 'description' => 'Régimen contractual público y casos prácticos.'],
            ['code' => 'DER-005', 'title' => 'Derecho Laboral Práctico',          'level' => 'basico',     'price' => 199.00, 'teacher_name' => 'Lic. Roberto Salas',   'duration_weeks' => 8,  'description' => 'Fundamentos del Derecho Laboral y casuística.'],
        ];

        foreach ($coursesDemo as $c) {
            Course::updateOrCreate(
                ['code' => $c['code']],
                array_merge($c, ['is_published' => true]),
            );
        }

        Purchase::updateOrCreate(
            ['idempotency_key' => 'seed-demo-eduwanka-mvp-purchase-001'],
            [
                'user_id' => $student->id,
                'course_code' => self::COURSE_CODE,
                'amount' => 1,
                'currency' => 'PEN',
                'payment_method' => 'seed',
                'payment_provider' => null,
                'status' => Purchase::STATUS_VALIDATED,
                'receipt_path' => null,
            ],
        );

        Teacher::updateOrCreate(
            ['name' => 'Juan Carlos Morón Urbina'],
            [
                'title' => 'Dr.',
                'specialty' => 'Derecho Administrativo & Arbitraje Estatal',
                'credentials' => 'Doctor en Derecho · Reconocido autor de "Comentarios a la LPAG"',
                'bio' => 'Reconocido consultor y árbitro experto en Derecho Administrativo y Contrataciones del Estado. Autor de múltiples obras académicas de referencia obligatoria en el ámbito nacional.',
                'photo_url' => 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=300',
                'is_featured' => true,
                'display_order' => 1
            ]
        );

        Teacher::updateOrCreate(
            ['name' => 'Marianella Ledesma Narváez'],
            [
                'title' => 'Dra.',
                'specialty' => 'Derecho Constitucional & Procesal',
                'credentials' => 'Ex-presidenta del Tribunal Constitucional · Árbitro de Prestigio',
                'bio' => 'Destacada jurista peruana, ex-presidenta del Tribunal Constitucional, con amplia experiencia en arbitraje nacional e internacional y docencia universitaria de posgrado.',
                'photo_url' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
                'is_featured' => true,
                'display_order' => 2
            ]
        );

        Teacher::updateOrCreate(
            ['name' => 'Carlos Medina'],
            [
                'title' => 'Dr.',
                'specialty' => 'Derecho Penal & Compliance',
                'credentials' => 'Especialista en Litigación Oral y Derecho Penal Económico',
                'bio' => 'Abogado litigante con especialización en compliance corporativo y delitos contra la administración pública. Profesor universitario y ponente en congresos internacionales.',
                'photo_url' => 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300',
                'is_featured' => true,
                'display_order' => 3
            ]
        );

        Teacher::updateOrCreate(
            ['name' => 'Roger Rubio Guerrero'],
            [
                'title' => 'Dr.',
                'specialty' => 'Arbitraje Corporativo & Comercial',
                'credentials' => 'Magíster en Derecho · Especialista en Litigios Complejos',
                'bio' => 'Especialista en arbitraje comercial nacional e internacional, contratación pública y concesiones. Con más de 15 años de experiencia liderando y resolviendo casos en diversos tribunales arbitrales.',
                'photo_url' => 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300',
                'is_featured' => true,
                'display_order' => 4
            ]
        );

        Teacher::updateOrCreate(
            ['name' => 'Ana María Arrarte Arispe'],
            [
                'title' => 'Dra.',
                'specialty' => 'Litigio Arbitral & Derecho Procesal Civil',
                'credentials' => 'Docente de Postgrado · Árbitro Activa de Centros Líderes',
                'bio' => 'Destacada abogada especializada en litigio arbitral, arbitraje de consumo y civil. Miembro activo de los principales centros de arbitraje del país y docente en reconocidas facultades de Derecho.',
                'photo_url' => 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300',
                'is_featured' => true,
                'display_order' => 5
            ]
        );

        $this->call(SpecialtySeeder::class);
    }
}
