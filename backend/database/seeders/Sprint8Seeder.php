<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseUnit;
use App\Models\UnitSession;
use App\Models\Exam;
use App\Models\ExamQuestion;
use App\Models\ExamQuestionOption;
use Illuminate\Database\Seeder;

class Sprint8Seeder extends Seeder
{
    public function run(): void
    {
        $courses = Course::all();

        if ($courses->isEmpty()) {
            $this->command->warn('No hay cursos para seedear contenidos. Ejecuta LocalDemoSeeder primero.');
            return;
        }

        foreach ($courses as $course) {
            // 1. Crear Unidades
            for ($u = 1; $u <= 2; $u++) {
                $unit = CourseUnit::create([
                    'course_id' => $course->id,
                    'title' => "Unidad $u: Introducción y Fundamentos",
                    'order' => $u,
                ]);

                // 2. Crear Sesiones por Unidad
                for ($s = 1; $s <= 2; $s++) {
                    $session = UnitSession::create([
                        'course_unit_id' => $unit->id,
                        'title' => "Sesión $s: Aspectos Clave",
                        'order' => $s,
                    ]);

                    // 3. Crear Materiales (pueden ser placeholders o URLs)
                    $session->materials()->createMany([
                        [
                            'title' => 'Guía de Lectura - PDF',
                            'type' => 'pdf',
                            'url' => 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                        ],
                        [
                            'title' => 'Clase Grabada - Video',
                            'type' => 'video',
                            'url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        ]
                    ]);
                }
            }

            // 4. Crear Examen Final
            $exam = Exam::create([
                'course_id' => $course->id,
                'title' => 'Examen Final de Certificación',
                'status' => 'open',
            ]);

            // 5. Crear Preguntas para el Examen
            for ($q = 1; $q <= 5; $q++) {
                $question = ExamQuestion::create([
                    'exam_id' => $exam->id,
                    'question_text' => "¿Cuál es el principio fundamental aplicable a la pregunta $q del curso {$course->title}?",
                    'points' => 4, // 5 preguntas x 4 puntos = 20
                ]);

                // 6. Opciones
                ExamQuestionOption::create([
                    'exam_question_id' => $question->id,
                    'option_text' => 'Opción Correcta (Sugerida)',
                    'is_correct' => true,
                ]);

                for ($o = 1; $o <= 3; $o++) {
                    ExamQuestionOption::create([
                        'exam_question_id' => $question->id,
                        'option_text' => "Opción Incorrecta $o",
                        'is_correct' => false,
                    ]);
                }
            }
        }

        $this->command->info('Sprint 8 Seeder completado: Contenidos y Exámenes generados para todos los cursos.');
    }
}
