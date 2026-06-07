<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;

class PublicSettingsController extends Controller
{
    /**
     * Get the general homepage hero settings.
     */
    public function getHeroSettings(): JsonResponse
    {
        $badge = Setting::getValue('hero_badge', 'EXCELENCIA ACADÉMICA');
        $title = Setting::getValue('hero_title', 'Forjando el Futuro de los {Profesionales}');
        $description = Setting::getValue('hero_description', 'Institución líder dedicada a la formación superior, ofreciendo programas académicos de vanguardia diseñados para el éxito en el mundo real.');
        $bgUrl = Setting::getValue('hero_bg_url', '/storage/hero/hero_law_bg.png');

        $missionDefault = [
            'title' => 'Institución de Excelencia',
            'description' => 'Valores y pilares fundamentales que guían nuestro compromiso con la educación superior y el éxito profesional.',
            'mision_title' => 'Nuestra Misión',
            'mision_desc' => 'Formar profesionales altamente capacitados mediante educación de excelencia, metodologías innovadoras y un enfoque práctico que les permita destacar en el competitivo mundo actual.',
            'vision_title' => 'Nuestra Visión',
            'vision_desc' => 'Ser la institución líder en educación continua en la región, reconocida por la calidad de nuestros programas, el éxito de nuestros egresados y nuestro impacto positivo en la sociedad.',
            'valores_title' => 'Nuestros Valores',
            'valores_desc' => 'Excelencia académica, integridad profesional, innovación constante y compromiso social son los pilares fundamentales que guían cada una de nuestras acciones y decisiones.'
        ];

        $statsDefault = [
            'students_count' => '5000',
            'courses_count' => '50',
            'teachers_count' => '25',
            'satisfaction_percent' => '98'
        ];

        $testimonialsDefault = [
            [
                'name' => 'Andrea Rivas',
                'role' => 'Egresada de Gestión Empresarial',
                'quote' => 'EduWanka cambió mi perspectiva sobre el liderazgo. Los docentes comparten experiencias reales.',
                'image_url' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?fit=crop&w=300&h=300',
                'video_url' => 'https://assets.mixkit.co/videos/preview/mixkit-girl-studying-in-a-library-40547-large.mp4'
            ],
            [
                'name' => 'Javier López',
                'role' => 'Estudiante de Tecnología',
                'quote' => 'La calidad de los laboratorios y el enfoque práctico me permitieron conseguir empleo rápido.',
                'image_url' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?fit=crop&w=300&h=300',
                'video_url' => 'https://assets.mixkit.co/videos/preview/mixkit-young-man-working-on-his-laptop-in-a-coffee-shop-40294-large.mp4'
            ],
            [
                'name' => 'Sofía Martínez',
                'role' => 'Alumna de Derecho Corporativo',
                'quote' => 'El rigor académico es excepcional. Me siento preparada para enfrentar los desafíos más complejos.',
                'image_url' => 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?fit=crop&w=300&h=300',
                'video_url' => 'https://assets.mixkit.co/videos/preview/mixkit-female-student-reading-a-book-in-the-library-40545-large.mp4'
            ]
        ];

        $missionDb = Setting::getValue('home_mission_vision_values');
        $statsDb = Setting::getValue('home_impact_stats');
        $testimonialsDb = Setting::getValue('home_testimonials');
        $conveniosEnabled = Setting::getValue('home_convenios_enabled', '1');
        $conveniosDb = Setting::getValue('home_convenios_logos');
        $conveniosDefault = ['UNT.png'];

        $defaultSections = [
            [
                'id' => 'hero',
                'type' => 'hero',
                'enabled' => true,
                'content' => [
                    'badge' => $badge,
                    'title' => $title,
                    'description' => $description,
                    'bg_url' => $bgUrl,
                ]
            ],
            [
                'id' => 'benefits',
                'type' => 'benefits',
                'enabled' => true,
                'content' => [
                    'title' => 'Una Plataforma Diseñada para tu Éxito',
                    'subtitle' => 'Todo lo que necesitas para tu desarrollo profesional.',
                    'cards' => [
                        [
                            'title' => 'Gestión Avanzada',
                            'desc' => 'Controla tus cursos, notas y asistencias desde un solo lugar.',
                        ],
                        [
                            'title' => 'Pagos en Línea',
                            'desc' => 'Paga tus matrículas de forma fácil y segura mediante múltiples opciones.',
                        ],
                        [
                            'title' => 'Certificación Oficial',
                            'desc' => 'Obtén certificados con código QR listos para verificar y descargar.',
                        ]
                    ]
                ]
            ],
            [
                'id' => 'stats',
                'type' => 'stats',
                'enabled' => true,
                'content' => $statsDb ? json_decode($statsDb, true) : $statsDefault
            ],
            [
                'id' => 'mission_vision',
                'type' => 'mission_vision',
                'enabled' => true,
                'content' => $missionDb ? json_decode($missionDb, true) : $missionDefault
            ],
            [
                'id' => 'programs',
                'type' => 'programs',
                'enabled' => true,
                'content' => [
                    'title' => 'Programas Académicos',
                    'subtitle' => 'Desarrolla tu potencial con nuestros programas estructurados para la excelencia.',
                ]
            ],
            [
                'id' => 'specialties',
                'type' => 'specialties',
                'enabled' => true,
                'content' => [
                    'title' => 'Nuestras Especialidades',
                    'subtitle' => 'Rutas formativas especializadas para destacar en el ámbito profesional.',
                ]
            ],
            [
                'id' => 'testimonials',
                'type' => 'testimonials',
                'enabled' => true,
                'content' => [
                    'title' => 'Lo que dicen nuestros estudiantes',
                    'subtitle' => 'Testimonios reales de egresados que transformaron su futuro con nosotros.',
                    'list' => $testimonialsDb ? json_decode($testimonialsDb, true) : $testimonialsDefault
                ]
            ],
            [
                'id' => 'convenios',
                'type' => 'convenios',
                'enabled' => $conveniosEnabled === '1',
                'content' => [
                    'logos' => $conveniosDb ? json_decode($conveniosDb, true) : $conveniosDefault
                ]
            ],
            [
                'id' => 'cta',
                'type' => 'cta',
                'enabled' => true,
                'content' => [
                    'title' => '¿Listo para iniciar tu formación?',
                    'desc' => 'Regístrate hoy y accede a una educación de primer nivel diseñada para el mundo real.',
                    'btn_text' => 'Matricularse Ahora',
                    'btn_url' => '/login'
                ]
            ]
        ];

        $sectionsDb = Setting::getValue('home_landing_sections');
        $sections = $sectionsDb ? json_decode($sectionsDb, true) : $defaultSections;

        return response()->json([
            'data' => [
                'hero_badge'                 => $badge,
                'hero_title'                 => $title,
                'hero_description'           => $description,
                'hero_bg_url'                => $bgUrl,
                'home_mission_vision_values' => $missionDb ? json_decode($missionDb, true) : $missionDefault,
                'home_impact_stats'          => $statsDb ? json_decode($statsDb, true) : $statsDefault,
                'home_testimonials'          => $testimonialsDb ? json_decode($testimonialsDb, true) : $testimonialsDefault,
                'home_convenios_enabled'     => $conveniosEnabled === '1',
                'home_convenios_logos'       => $conveniosDb ? json_decode($conveniosDb, true) : $conveniosDefault,
                'home_landing_sections'      => $sections,
            ]
        ]);
    }
}
