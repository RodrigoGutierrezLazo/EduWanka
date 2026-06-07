<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\ModuleSection;
use App\Models\ContentItem;
use App\Models\Questionnaire;
use App\Models\QuestionnaireQuestion;
use App\Models\QuestionnaireQuestionOption;
use App\Models\Assignment;

/**
 * Sprint11DemoSeeder
 *
 * Crea un módulo de demostración con los 9 tipos de contenido
 * en el primer curso publicado de la base de datos.
 *
 * Uso:
 *   php artisan db:seed --class=Sprint11DemoSeeder
 */
class Sprint11DemoSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Tomar el primer curso disponible ─────────────────────────────
        $course = Course::first();

        if (!$course) {
            $this->command->error('No hay cursos en la base de datos. Crea al menos uno antes de ejecutar este seeder.');
            return;
        }

        $this->command->info("Usando curso: [{$course->id}] {$course->title}");

        // ── 2. Crear Cuestionario de demo ───────────────────────────────────
        $questionnaire = Questionnaire::create([
            'course_id'          => $course->id,
            'title'              => '[DEMO] Quiz de Conceptos Básicos',
            'description'        => 'Cuestionario de demostración Sprint 11',
            'passing_score'      => 60,
            'max_attempts'       => null,
            'immediate_feedback' => true,
        ]);

        $q1 = QuestionnaireQuestion::create([
            'questionnaire_id' => $questionnaire->id,
            'question_text'    => '¿Cuál es la capital del Perú?',
            'type'             => 'single',
            'points'           => 10,
            'order'            => 1,
            'explanation'      => 'Lima es la capital y ciudad más poblada del Perú.',
        ]);
        QuestionnaireQuestionOption::insert([
            ['questionnaire_question_id' => $q1->id, 'option_text' => 'Cusco',  'is_correct' => false, 'feedback' => 'Cusco fue la capital del Imperio Inca, no del Perú moderno.'],
            ['questionnaire_question_id' => $q1->id, 'option_text' => 'Lima',   'is_correct' => true,  'feedback' => '¡Correcto! Lima es la capital.'],
            ['questionnaire_question_id' => $q1->id, 'option_text' => 'Arequipa','is_correct' => false, 'feedback' => 'Arequipa es la segunda ciudad más importante del Perú.'],
        ]);

        $q2 = QuestionnaireQuestion::create([
            'questionnaire_id' => $questionnaire->id,
            'question_text'    => '¿El Perú comparte frontera con Brasil?',
            'type'             => 'true_false',
            'points'           => 5,
            'order'            => 2,
            'explanation'      => 'Perú y Brasil comparten una frontera de aproximadamente 2,822 km.',
        ]);
        QuestionnaireQuestionOption::insert([
            ['questionnaire_question_id' => $q2->id, 'option_text' => 'Verdadero', 'is_correct' => true,  'feedback' => '¡Correcto!'],
            ['questionnaire_question_id' => $q2->id, 'option_text' => 'Falso',     'is_correct' => false, 'feedback' => 'Incorrecto. Sí comparten frontera.'],
        ]);

        // ── 3. Crear Tarea de demo ──────────────────────────────────────────
        $assignment = Assignment::create([
            'course_id'    => $course->id,
            'title'        => '[DEMO] Informe de Actividad Semana 1',
            'instructions' => '<p>Redacta un informe de <strong>2 páginas</strong> describiendo lo aprendido esta semana.</p><ul><li>Usa fuente Arial 12pt</li><li>Incluye introducción y conclusión</li><li>Cita al menos una fuente bibliográfica</li></ul><p>Entrega en formato <strong>PDF</strong>.</p>',
            'due_at'       => now()->addDays(7),
            'max_score'    => 20,
        ]);

        // ── 4. Módulo de demo ───────────────────────────────────────────────
        $module = CourseModule::create([
            'course_id'   => $course->id,
            'title'       => '[DEMO] Módulo 1 — Los 9 Tipos de Contenido',
            'description' => 'Módulo generado automáticamente por Sprint11DemoSeeder para verificar los 9 tipos de ContentItem.',
            'order'       => 99,
        ]);

        $section = ModuleSection::create([
            'course_module_id' => $module->id,
            'title'            => 'Sección de Demostración',
            'order'            => 1,
        ]);

        // ── 5. Los 9 tipos de ContentItem ───────────────────────────────────
        $items = [
            [
                'type'      => 'video',
                'title'     => '[DEMO] Video — Tutorial de Laravel',
                'url'       => 'https://www.youtube.com/watch?v=MYyJ4PuL4pY',
                'order'     => 1,
                'published' => true,
            ],
            [
                'type'      => 'file',
                'title'     => '[DEMO] Archivo — Guía de Estudio (simulated)',
                'path'      => 'demo/guia-estudio.pdf',
                'order'     => 2,
                'published' => true,
            ],
            [
                'type'      => 'meet',
                'title'     => '[DEMO] Clase en Vivo — Viernes 6pm',
                'url'       => 'https://meet.google.com/demo-link-eduwanka',
                'order'     => 3,
                'published' => true,
            ],
            [
                'type'      => 'text',
                'title'     => '[DEMO] Texto — Introducción al Módulo',
                'body_html' => '<h2>Bienvenido al Módulo de Demostración</h2><p>Este módulo fue creado por el <strong>Sprint11DemoSeeder</strong> para verificar que los 9 tipos de contenido funcionan correctamente en la plataforma.</p><blockquote>La educación es el arma más poderosa que puedes usar para cambiar el mundo. — Nelson Mandela</blockquote>',
                'order'     => 4,
                'published' => true,
            ],
            [
                'type'      => 'url',
                'title'     => '[DEMO] Enlace — Documentación de Laravel',
                'url'       => 'https://laravel.com/docs',
                'order'     => 5,
                'published' => true,
            ],
            [
                'type'          => 'exam',
                'title'         => '[DEMO] Examen — Evaluación Parcial',
                'referenced_id' => 1,  // Ajustar al ID de un examen existente
                'order'         => 6,
                'published'     => false,  // Oculto por defecto; activar manualmente
            ],
            [
                'type'          => 'questionnaire',
                'title'         => '[DEMO] Cuestionario — Quiz Conceptos Básicos',
                'referenced_id' => $questionnaire->id,
                'order'         => 7,
                'published'     => true,
            ],
            [
                'type'          => 'substitute_exam',
                'title'         => '[DEMO] Examen Sustitutorio — Para reprobados',
                'referenced_id' => 1,  // Ajustar al ID de un examen sustitutorio existente
                'order'         => 8,
                'published'     => false,
            ],
            [
                'type'          => 'assignment',
                'title'         => '[DEMO] Tarea — Informe Semana 1',
                'referenced_id' => $assignment->id,
                'order'         => 9,
                'published'     => true,
            ],
        ];

        foreach ($items as $itemData) {
            ContentItem::create(array_merge($itemData, [
                'module_section_id' => $section->id,
            ]));
        }

        $this->command->info('✅ Sprint11DemoSeeder ejecutado correctamente.');
        $this->command->table(
            ['Tipo', 'Título', 'Publicado'],
            collect($items)->map(fn($i) => [
                $i['type'],
                $i['title'],
                ($i['published'] ?? false) ? 'SÍ' : 'NO',
            ])->toArray()
        );

        $this->command->newLine();
        $this->command->info("Accede al gestor de materiales:");
        $this->command->line("  Admin:    /aula/admin/materiales/{$course->id}");
        $this->command->line("  Alumno:   /aula/cursos/{$course->id}");
        $this->command->line("  Quiz:     /aula/cuestionario/{$questionnaire->id}");
        $this->command->line("  Tarea:    /aula/tarea/{$assignment->id}");
    }
}
