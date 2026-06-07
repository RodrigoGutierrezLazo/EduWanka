<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Specialty;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SpecialtySeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Especialidades de Formación ──────────────────────────────
        
        // Formación de Árbitros
        $arbitrosSections = [
            'hero' => [
                'subtitle' => 'Arbitraje Privado y Contrataciones del Estado',
                'video_title' => 'Simulación de Tribunal Arbitral',
                'badge' => 'Área de Estudio · Programa Oficial',
            ],
            'indicators' => [
                'duration' => '7 Meses',
                'hours' => '1152 Académicas',
                'mode' => 'Virtual en vivo',
                'accreditation' => 'SUNEDU / UNT',
            ],
            'presentation' => [
                'title' => 'Sobre el Diplomado',
                'about' => "El arbitraje se ha consolidado como uno de los mecanismos más potentes e indispensables para la solución de controversias en los ámbitos público y privado, atrayendo inversiones y resolviendo disputas con rapidez.\n\nNo obstante, la mayoría de los programas académicos vigentes perpetúan una enseñanza predominantemente teórica. Generan egresados que memorizan códigos legales, pero que lamentablemente carecen por completo de experiencia práctica e inmersiva sobre cómo estructurar un proceso arbitral de principio a fin.\n\nFrente a esta gran deficiencia académica, EduWanka presenta este programa exclusivo de alta especialización diseñado con un enfoque Teórico – Práctico – Inmersivo, donde el aprendizaje es progresivo, participativo y estructurado en torno a litigaciones de la vida real.",
                'objective' => 'Formar líderes y especialistas con dominio integral, tanto teórico como procedimental, de la práctica arbitral peruana, capacitándolos para intervenir exitosamente en procedimientos arbitrales.',
                'roles' => [
                    'Árbitros Únicos o Miembros de Tribunales',
                    'Secretarios Arbitrales y de Corte',
                    'Abogados Litigantes de Alta Performance',
                    'Asesores de Entidades Públicas y Empresas',
                    'Operadores Generales del Sistema Arbitral'
                ]
            ],
            'methodology' => [
                'pillars' => [
                    [
                        'title' => '1. Clases Teóricas Especializadas',
                        'desc' => 'Análisis conceptual exhaustivo del marco normativo, precedentes del OSCE y la jurisprudencia arbitral peruana más relevante.'
                    ],
                    [
                        'title' => '2. Talleres Prácticos',
                        'desc' => 'Casos de estudio dirigidos para la elaboración y corrección de cláusulas, actas, requerimientos y escritos tácticos del litigio.'
                    ],
                    [
                        'title' => '3. Simulación Integral de Arbitraje',
                        'desc' => 'Simulaciones intensivas donde los alumnos asumen roles activos en un Tribunal Arbitral simulado con expedientes reales.'
                    ]
                ],
                'tools' => [
                    [
                        'title' => 'Expediente Madre',
                        'desc' => 'Un expediente completo y documentado que incluye material clave para el litigio.',
                        'items' => ['Contrato y bases', 'Convenio arbitral', 'Cartas notariales', 'Informes y pericias', 'Cronología de hechos']
                    ],
                    [
                        'title' => 'Sistema de Roles',
                        'desc' => 'Los alumnos asumen identidades legales activas del proceso para fomentar empatía procesal.',
                        'items' => ['Árbitro Único / Tribunal', 'Demandante (Contratista)', 'Demandado (Entidad)', 'Secretario Arbitral']
                    ],
                    [
                        'title' => 'Tribunal Académico',
                        'desc' => 'Estructura organizativa permanente de simulación procesal en vivo.',
                        'items' => ['Corte arbitral simulada', 'Secretaría de audiencias', 'Audiencias y debates', 'Deliberaciones de laudo']
                    ]
                ]
            ],
            'profile' => [
                'skills' => [
                    'Comprender y explicar íntegramente el sistema arbitral nacional.',
                    'Elaborar convenios arbitrales válidos y blindados jurídicamente.',
                    'Redactar escritos, demandas e informes técnicos de alta precisión.',
                    'Dirigir y participar en audiencias y comités de resolución.',
                    'Aplicar técnicas de litigación oral, argumentación y negociación.',
                    'Analizar medios probatorios, informes periciales y pericias financieras.',
                    'Elaborar estrategias arbitrales ganadoras para resolver litigios.',
                    'Desempeñarse competentemente como secretario de tribunal arbitral.',
                    'Deliberar con solvencia técnica en controversias de alta complejidad.',
                    'Redactar laudos arbitrales robustos y debidamente motivados.',
                    'Dominar las sutilezas del arbitraje en Contrataciones del Estado.',
                    'Gestionar ágilmente expedientes arbitrales de inicio a fin.'
                ]
            ],
            'accreditations' => [
                'title' => 'Acreditaciones y Respaldo Académico',
                'items' => [
                    [
                        'title' => 'Certificación como Árbitro Privado',
                        'desc' => 'Título oficial e incorporación que te habilita para ejercer el rol de árbitro en controversias civiles y comerciales de carácter privado a nivel nacional.',
                        'badge' => '+ Inscripción en el Registro Nacional de Árbitros del Ministerio de Justicia'
                    ],
                    [
                        'title' => 'Certificación como Árbitro Especialista en Contrataciones del Estado',
                        'desc' => 'Acreditación oficial incorporándote como árbitro en materia de adquisiciones públicas y contratación de obras del Estado.',
                        'badge' => 'Ceremonia de Incorporación Oficial: Entrega en ceremonia presencial de resolución de registro de árbitro, medalla oficial del tribunal arbitral y diploma de acreditación institucional.'
                    ],
                    [
                        'title' => 'Especialización con Acreditación Universitaria',
                        'desc' => 'Nuestra plana y estructura curricular cuenta con la acreditación y supervisión de prestigiosas universidades peruanas licenciadas por SUNEDU, otorgándote validez oficial para tu CV en concursos públicos, contrataciones estatales y ascensos.',
                        'badge' => 'Programas de Especialización: Arbitraje (24 créditos / 384 hrs), Contrataciones Públicas (24 créditos / 384 hrs), Derecho Administrativo (24 créditos / 384 hrs).'
                    ]
                ]
            ],
            'syllabus' => [
                [
                    'number' => 1,
                    'title' => 'Introducción y Fundamentos del Arbitraje',
                    'topics' => [
                        'Introducción al arbitraje y principios arbitrales.',
                        'Concepto y naturaleza jurídica del arbitraje.',
                        'Arbitraje versus el proceso judicial tradicional.',
                        'Principios arbitrales cardinales: autonomía de la voluntad, debido proceso, competencia-competencia, confidencialidad, buena fe.',
                        'Marco normativo nacional y tipos de arbitraje en el Perú.',
                        'Decreto Legislativo 1071 y análisis comparado con reglamentos arbitrales de instituciones líderes.',
                        'Arbitraje Institucional, Ad Hoc, nacional e internacional, Comercial y Estatal.',
                        'Sujetos del proceso arbitral: Árbitros, partes, centros arbitrales y secretaría.',
                        'Modelos específicos: Arbitraje comercial, civil, laboral, de consumo e inmobiliario.'
                    ]
                ],
                [
                    'number' => 2,
                    'title' => 'Materias Arbitrales en Contratación Pública',
                    'topics' => [
                        'Delimitación constitucional y legal de materias arbitrales.',
                        'Ampliaciones de plazo contractual y mayores gastos generales.',
                        'Régimen de penalidades y resoluciones de contrato.',
                        'Desarrollo procedimental de las principales materias arbitrales en contratación del Estado.',
                        'Presentación e integración del expediente de contratación pública.'
                    ],
                    'taller' => 'Taller Práctico: Instalación del proceso arbitral y designación de grupos de simulación.'
                ],
                [
                    'number' => 3,
                    'title' => 'Convenio Arbitral y Actos Previos',
                    'topics' => [
                        'El convenio arbitral: definición jurídica e importancia estratégica.',
                        'Requisitos fundamentales de validez del convenio.',
                        'Convenios patológicos: análisis de casos, errores frecuentes y cómo evitarlos.',
                        'Mecanismos alternativos de prevención de controversias y trato directo.',
                        'Redacción y envío de cartas notariales en la etapa pre-arbitral.',
                        'Resolución contractual y estructuración de la estrategia pre-arbitral.'
                    ],
                    'taller' => 'Taller Práctico: Redacción de cláusulas arbitrales blindadas y elaboración de requerimientos tácticos.'
                ],
                [
                    'number' => 4,
                    'title' => 'Etapa Postulatoria del Arbitraje',
                    'topics' => [
                        'La solicitud de arbitraje: estructura formal y requisitos sustanciales.',
                        'Estrategia de contestación de la solicitud de arbitraje.',
                        'La reconvención en el proceso arbitral.',
                        'Excepciones y defensas previas admisibles.',
                        'Acumulación de pretensiones y procesos.',
                        'Régimen de medidas cautelares en sede arbitral y judicial.'
                    ],
                    'taller' => 'Taller Práctico: Elaboración completa de escritos postulatorios estratégicos y solicitudes de medidas cautelares.'
                ],
                [
                    'number' => 5,
                    'title' => 'Litigación Arbitral y Actuación Probatoria',
                    'topics' => [
                        'Teoría del caso aplicada al arbitraje.',
                        'Estructuración de la estrategia de litigación arbitral integral.',
                        'Ofrecimiento, admisión y actuación de medios probatorios.',
                        'Planificación y dirección de audiencias arbitrales (virtuales y presenciales).',
                        'Técnicas de interrogatorio y contrainterrogatorio de testigos y peritos.',
                        'Objeciones eficaces durante el debate arbitral.',
                        'Alegatos de apertura y alegatos de clausura memorables.'
                    ],
                    'taller' => 'Taller Práctico y Simulación: Audiencia de pruebas simulada con debates, interrogatorios a peritos y valoración de pruebas en tiempo real.'
                ],
                [
                    'number' => 6,
                    'title' => 'Secretaría Arbitral y Gestión del Expediente',
                    'topics' => [
                        'Funciones, responsabilidades y ética de la secretaría arbitral.',
                        'Gestión documental de vanguardia y notificaciones electrónicas.',
                        'El expediente arbitral físico y digital: ordenamiento, custodia e integridad.',
                        'Ética, principios de imparcialidad, independencia y revelación del árbitro.'
                    ],
                    'taller' => 'Taller Práctico: Elaboración formal de actas de audiencia, órdenes procesales y resoluciones de trámite del Tribunal.'
                ],
                [
                    'number' => 7,
                    'title' => 'El Laudo Arbitral',
                    'topics' => [
                        'Naturaleza jurídica, efectos y fuerza de cosa juzgada del laudo arbitral.',
                        'La debida motivación del laudo: estructura, razonamiento legal e incongruencias.',
                        'Valoración final de los medios probatorios admitidos.',
                        'Técnicas de deliberación interna del Tribunal Arbitral.',
                        'Régimen de nulidad del laudo y procedencia excepcional del Recurso de Amparo.',
                        'Mecanismos y procesos judiciales para la ejecución forzosa del laudo.'
                    ],
                    'taller' => 'Taller Práctico: Simulación de sesión de deliberación a puerta cerrada y redacción de la parte considerativa y resolutiva del laudo.'
                ],
                [
                    'number' => 8,
                    'title' => 'Arbitraje Comercial y Controversias Empresariales',
                    'topics' => [
                        'Estructura de los contratos comerciales modernos y cláusulas de solución de disputas.',
                        'Tratamiento ante incumplimientos contractuales complejos en el sector corporativo.',
                        'Determinación de indemnizaciones, daño emergente, lucro cesante y daño moral.',
                        'Criterios jurisprudenciales sobre interpretación de contratos mercantiles.'
                    ],
                    'taller' => 'Análisis de Casos: Casos reales y resoluciones corporativas bajo legislación comercial.'
                ],
                [
                    'number' => 9,
                    'title' => 'Arbitraje en Contrataciones Públicas Avanzado',
                    'topics' => [
                        'Responsabilidad civil, administrativa y ética del árbitro en contrataciones estatales.',
                        'Análisis crítico de jurisprudencia arbitral del OSCE y cortes judiciales.',
                        'Particularidades en la emisión del laudo en controversias de obras públicas y adquisiciones complejas.'
                    ]
                ],
                [
                    'number' => 10,
                    'title' => 'Simulación Integral Final: Tribunal Arbitral Académico',
                    'topics' => [
                        'Desarrollo e integración de todas las fases del proceso arbitral en un entorno simulado.',
                        'Fase postulatoria, audiencia de conciliación de puntos controvertidos, presentación de pericias, audiencia de pruebas con técnicas de litigación oral, deliberación a puerta cerrada y emisión final del laudo.'
                    ],
                    'taller' => 'Taller Vivencial de Simulación Permanente: Formación integral en simulación real de inicio a fin.'
                ]
            ],
            'teachers' => [
                [
                    'name' => 'Dr. Juan Carlos Morón Urbina',
                    'specialty' => 'Derecho Administrativo & Arbitraje Estatal',
                    'credentials' => 'Doctor en Derecho · Reconocido autor de "Comentarios a la LPAG"',
                    'bio' => 'Reconocido consultor y árbitro experto en Derecho Administrativo y Contrataciones del Estado. Autor de múltiples obras académicas fundamentales de referencia obligatoria en el ámbito nacional.',
                    'image' => 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=300'
                ],
                [
                    'name' => 'Dra. Marianella Ledesma Narváez',
                    'specialty' => 'Derecho Constitucional & Procesal',
                    'credentials' => 'Ex-presidenta del Tribunal Constitucional · Árbitro de Prestigio',
                    'bio' => 'Prestigiosa jurista nacional, docente universitaria y árbitro con amplia trayectoria en la resolución de controversias constitucionales, civiles y complejas en el ámbito público y privado.',
                    'image' => 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300'
                ],
                [
                    'name' => 'Dr. Roger Rubio Guerrero',
                    'specialty' => 'Arbitraje Corporativo & Comercial',
                    'credentials' => 'Magíster en Derecho · Especialista en Litigios Complejos',
                    'bio' => 'Especialista en arbitraje comercial nacional e internacional, contratación pública y concesiones. Con más de 15 años de experiencia liderando y resolviendo casos en diversos tribunales arbitrales.',
                    'image' => 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300'
                ],
                [
                    'name' => 'Dra. Ana María Arrarte Arispe',
                    'specialty' => 'Litigio Arbitral & Derecho Procesal Civil',
                    'credentials' => 'Docente de Postgrado · Árbitro Activa de Centros Líderes',
                    'bio' => 'Destacada abogada especializada en litigio arbitral, arbitraje de consumo y civil. Miembro activo de los principales centros de arbitraje del país y docente en reconocidas facultades de Derecho.',
                    'image' => 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300'
                ]
            ],
            'investment' => [
                'matricula_socios' => 'S/ 285.00',
                'matricula_publico' => 'S/ 295.00',
                'cuota_socios_antes' => 'S/ 550.00',
                'cuota_socios_despues' => 'S/ 650.00',
                'cuota_publico_antes' => 'S/ 590.00',
                'cuota_publico_despues' => 'S/ 695.00',
            ],
            'payment_accounts' => [
                'titular' => 'Lennin Patrick Gonzales Villanueva',
                'yape' => '970 054 014',
                'whatsapp' => '971 707 389',
                'accounts' => [
                    ['bank' => 'Banco de la Nación', 'acc' => '04-143-521775'],
                    ['bank' => 'Banco Interbank', 'acc' => '8983446602618', 'cci' => 'CCI: 00389801344660261841'],
                    ['bank' => 'Banco BCP', 'acc' => '355-03061608-0-71'],
                    ['bank' => 'BBVA Continental', 'acc' => '0011-0814-0266711374', 'cci' => 'CCI: 011814000266711374'],
                    ['bank' => 'Banco Scotiabank', 'acc' => '9430434630', 'cci' => 'CCI: 009-943-209430434630-28'],
                    ['bank' => 'Caja Huancayo', 'acc' => '107012211005165277', 'cci' => 'CCI: 808 012 21 1005165277-99']
                ]
            ]
        ];

        // Seed Formación de Árbitros
        Specialty::updateOrCreate(
            ['slug' => 'arbitros'],
            [
                'title' => 'Formación de Árbitros',
                'description' => 'Programa de alta especialización inmersivo teórico-práctico en arbitraje privado y contrataciones del Estado.',
                'image_url' => 'specialties/arbitros_cover.png',
                'type' => 'formacion',
                'order' => 1,
                'custom_sections' => $arbitrosSections,
            ]
        );

        // Formación de Peritos (Template with boilerplate sections)
        $peritosSections = $arbitrosSections;
        $peritosSections['hero']['subtitle'] = 'Peritaje Judicial, Fiscal y Forense';
        $peritosSections['hero']['badge'] = 'Programa de Formación Científica y Legal';
        $peritosSections['indicators']['duration'] = '6 Meses';
        $peritosSections['indicators']['hours'] = '980 Académicas';
        $peritosSections['presentation']['about'] = "La formación de peritos está orientada al estudio científico, técnico y legal para la elaboración de dictámenes periciales con el máximo rigor procesal.\n\nEste programa te capacita para actuar con absoluta idoneidad ante juzgados, fiscalías y tribunales arbitrales, dominando la sustentación de la prueba científica y las técnicas forenses actuales.";
        $peritosSections['presentation']['objective'] = 'Formar peritos judiciales y extrajudiciales con sólidos conocimientos científicos y metodológicos para el auxilio eficaz de la justicia.';
        $peritosSections['presentation']['roles'] = [
            'Perito Judicial de Parte o de Oficio',
            'Consultor Técnico Especializado',
            'Investigador Forense',
            'Asesor de Litigios Civiles y Penales'
        ];

        Specialty::updateOrCreate(
            ['slug' => 'peritos'],
            [
                'title' => 'Formación de Peritos',
                'description' => 'Especialización en dictámenes periciales forenses con rigor científico para actuar ante el Poder Judicial y Fiscalías.',
                'image_url' => 'specialties/peritos_cover.png',
                'type' => 'formacion',
                'order' => 2,
                'custom_sections' => $peritosSections,
            ]
        );

        // Formación de Conciliadores (Template with boilerplate sections)
        $conciliadoresSections = $arbitrosSections;
        $conciliadoresSections['hero']['subtitle'] = 'Conciliación Extrajudicial General y Familiar';
        $conciliadoresSections['hero']['badge'] = 'Programa Oficial Acreditado por el MINJUS';
        $conciliadoresSections['indicators']['duration'] = '4 Meses';
        $conciliadoresSections['indicators']['hours'] = '640 Académicas';
        $conciliadoresSections['presentation']['about'] = "Domina las técnicas de comunicación asertiva, negociación colaborativa y resolución pacífica de conflictos sin necesidad de llegar a la vía judicial.\n\nEste programa cuenta con la acreditación del Ministerio de Justicia y Derechos Humanos (MINJUS), habilitándote para fundar tu propio centro de conciliación o desempeñarte como conciliador oficial.";
        $conciliadoresSections['presentation']['objective'] = 'Formar Conciliadores Extrajudiciales oficiales competentes en la facilitación de acuerdos voluntarios en materia civil y familiar.';
        $conciliadoresSections['presentation']['roles'] = [
            'Conciliador Extrajudicial Oficial (General)',
            'Conciliador Especializado en Asuntos de Familia',
            'Director de Centro de Conciliación',
            'Especialista en Clima y Cultura de Paz'
        ];

        Specialty::updateOrCreate(
            ['slug' => 'conciliadores'],
            [
                'title' => 'Formación de Conciliadores',
                'description' => 'Acreditación oficial para el ejercicio de la conciliación extrajudicial general y familiar avalado por el MINJUS.',
                'image_url' => 'specialties/conciliadores_cover.png',
                'type' => 'formacion',
                'order' => 3,
                'custom_sections' => $conciliadoresSections,
            ]
        );

        // ── 2. Especialidades de Derecho ────────────────────────────────
        $derechoSpecialties = [
            'derecho-penal'                  => 'Derecho Penal',
            'derecho-civil'                  => 'Derecho Civil',
            'derecho-constitucional'         => 'Derecho Constitucional',
            'derecho-laboral'                => 'Derecho Laboral',
            'violencia-familiar'             => 'Violencia Familiar',
            'derecho-de-familia'             => 'Derecho de Familia',
            'derecho-sucesorio'              => 'Derecho Sucesorio',
            'derecho-administrativo'         => 'Derecho Administrativo',
            'contrataciones-del-estado'      => 'Contrataciones del Estado',
            'gestion-publica'                => 'Gestión Pública',
            'derecho-ambiental'              => 'Derecho Ambiental',
            'derecho-tributario-y-fiscal'    => 'Derecho Tributario y Fiscal',
            'derecho-municipal-y-regional'   => 'Derecho Municipal y Regional',
            'derecho-comercial-empresarial'  => 'Derecho Comercial / Empresarial',
            'derecho-minero-y-energetico'    => 'Derecho Minero y Energético',
            'derecho-propiedad-intelectual'  => 'Derecho de la Propiedad Intelectual',
        ];

        $orderIndex = 4;
        foreach ($derechoSpecialties as $slug => $title) {
            Specialty::updateOrCreate(
                ['slug' => $slug],
                [
                    'title' => $title,
                    'description' => 'Diplomados y cursos de actualización profesional de alta especialización en materia de ' . $title . '.',
                    'image_url' => null,
                    'type' => 'derecho',
                    'order' => $orderIndex++,
                    'custom_sections' => null,
                ]
            );
        }

        // ── 3. Vincular cursos de demostración existentes ─────────────────
        $penal = Specialty::where('slug', 'derecho-penal')->first();
        if ($penal) {
            Course::where('title', 'like', '%Penal%')->update(['specialty_id' => $penal->id, 'specialty' => $penal->title]);
        }

        $constitucional = Specialty::where('slug', 'derecho-constitucional')->first();
        if ($constitucional) {
            Course::where('title', 'like', '%Constitucional%')->update(['specialty_id' => $constitucional->id, 'specialty' => $constitucional->title]);
        }

        $contrataciones = Specialty::where('slug', 'contrataciones-del-estado')->first();
        if ($contrataciones) {
            Course::where('title', 'like', '%Contrataciones%')->update(['specialty_id' => $contrataciones->id, 'specialty' => $contrataciones->title]);
        }

        $civil = Specialty::where('slug', 'derecho-civil')->first();
        if ($civil) {
            Course::where('title', 'like', '%Civil%')->update(['specialty_id' => $civil->id, 'specialty' => $civil->title]);
        }

        $laboral = Specialty::where('slug', 'derecho-laboral')->first();
        if ($laboral) {
            Course::where('title', 'like', '%Laboral%')->update(['specialty_id' => $laboral->id, 'specialty' => $laboral->title]);
        }
    }
}
