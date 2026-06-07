<p align="center">
  <img src="frontend/Logo.ico" alt="EduWanka" width="80" />
</p>

# EduWanka

Plataforma educativa institucional para gestion de cursos, aula virtual, pagos, asistencia, materiales, evaluaciones y certificados. El sistema esta organizado como una aplicacion full-stack con backend Laravel y frontend React/Vite.

## Estado Actual

El proyecto se encuentra en una etapa funcional avanzada. La aplicacion ya cuenta con flujos operativos para los cuatro roles principales:

| Rol | Alcance principal |
| --- | --- |
| Estudiante | Aula, cursos comprados, materiales, tareas, cuestionarios, pagos y certificados |
| Profesor | Cursos asignados, estudiantes, asistencia, materiales, perfil publico y certificados |
| Admin | Cursos, docentes, usuarios, pagos, reportes, asistencia, materiales y certificados |
| Superadmin | Vista global, usuarios y metricas de rendimiento |

Ultimos cambios consolidados:

- Publicacion del repositorio limpio en GitHub, sin el historial que contenia secretos locales.
- Eliminacion de la referencia rota al submodulo `EduWanka-Aula`.
- Exclusión del archivo local `.cursor/mcp.json`, que contiene configuracion sensible del entorno.
- Consolidacion de modulos tipo aula virtual: secciones, items, cuestionarios, examenes sustitutorios y tareas.
- Ampliacion de flujos para admin, profesor, estudiante y superadmin.
- Integracion de gestion de certificados, compras, asistencia y progreso de contenido.

## Stack Tecnico

| Capa | Tecnologia |
| --- | --- |
| Backend | Laravel 11, PHP 8.2, Laravel Sanctum |
| Frontend | React 19, Vite 6, TypeScript |
| UI | Tailwind CSS 4, lucide-react, motion |
| Datos HTTP | Axios, TanStack React Query |
| Base de datos local | MySQL con XAMPP |
| PDFs y hojas de calculo | FPDI/FPDF, PhpSpreadsheet |
| Testing | PHPUnit, pruebas feature/unitarias, carpeta `Pruebas/` |

## Estructura

```text
EduWanka/
├── backend/          # API Laravel, modelos, controladores, rutas, migraciones y tests
├── frontend/         # SPA React/Vite/TypeScript
├── Documentacion/    # Arquitectura, planificacion, sprints, QA, runbooks y auditorias
├── Pruebas/          # Evidencias y materiales de prueba
├── openapi.yaml      # Contrato OpenAPI base
├── iniciar-eduwanka.bat
└── README.md
```

## Inicio Rapido Local

Requisitos recomendados:

- PHP 8.2 o superior
- Composer
- Node.js 20 o superior
- XAMPP con MySQL
- Git

### 1. Backend

```bash
cd backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve --port=8000
```

### 2. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

URL por defecto:

```text
http://localhost:3000
```

### 3. Inicio automatico en Windows

Tambien puedes usar:

```bat
iniciar-eduwanka.bat
```

El script inicia MySQL de XAMPP, levanta Laravel en `http://localhost:8000` y luego inicia Vite para el frontend.

## Credenciales Demo

| Rol | Email | Password |
| --- | --- | --- |
| Estudiante | `student@eduwanka.local` | `Password123!` |
| Profesor | `prof@eduwanka.local` | `Password123!` |
| Admin | `admin@eduwanka.local` | `Password123!` |
| Superadmin | `superadmin@eduwanka.local` | `Password123!` |

Estas cuentas dependen de los seeders locales. Si no existen, ejecuta nuevamente las migraciones y seeders del backend.

## APIs Principales

Base local:

```text
http://localhost:8000/api/v1
```

Endpoints destacados:

```text
GET    /health
POST   /auth/login
GET    /auth/me
POST   /auth/logout

GET    /courses
GET    /courses/{idOrSlug}
GET    /teachers

GET    /aula/access
GET    /aula/student-data
GET    /aula/admin-data
GET    /aula/professor-data
GET    /aula/superadmin-data

POST   /checkout/register-purchase
POST   /payments/{purchase}/status
POST   /certificates/verify
GET    /certificates/latest

GET    /aula/courses/{course}/modules
POST   /aula/courses/{course}/modules
POST   /aula/questionnaires/{questionnaire}/submit
POST   /aula/substitute-exams/{substituteExam}/submit
POST   /aula/assignments/{assignment}/submit
```

El contrato base esta en `openapi.yaml`; las rutas completas viven en `backend/routes/api.php`.

## Modulos Funcionales

- Autenticacion con Sanctum y proteccion por roles.
- Catalogo publico de cursos y docentes.
- Flujo de compra e inscripcion.
- Aula del estudiante con cursos, materiales, progreso, tareas y evaluaciones.
- Administracion de cursos, docentes, usuarios, participantes y pagos.
- Gestion de asistencia para admin y profesor.
- Certificados, plantillas, previsualizacion, emision y verificacion.
- Panel de profesor con cursos, estudiantes, materiales, perfil y certificados.
- Panel de superadmin con usuarios y metricas.
- Modulos tipo Moodle: modulos, secciones, items, cuestionarios, examenes sustitutorios y tareas.

## Pruebas

Backend:

```bash
cd backend
php artisan test
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

La documentacion historica de QA y sprints esta en `Documentacion/04_Pruebas_y_QA/` y `Documentacion/03_Desarrollo_Sprints/`.

## Seguridad y Configuracion

- No subir archivos `.env`.
- No subir `.cursor/mcp.json`; contiene configuraciones locales y puede incluir claves.
- Mantener secretos en variables de entorno o en un gestor de secretos.
- Revisar cualquier credencial expuesta antes de publicar cambios.
- Las rutas sensibles usan autenticacion Sanctum, roles y throttling en backend.

## Documentacion

La documentacion extendida esta organizada por etapas:

```text
Documentacion/
├── 00_Especificaciones_SDD_Estado_del_arte/
├── 01_Inicial_y_Arquitectura/
├── 02_Planificacion_y_Fases/
├── 03_Desarrollo_Sprints/
├── 04_Pruebas_y_QA/
├── 05_Guias_y_Operaciones/
└── 06_Auditorias_y_Cierre/
```

Para operacion local, revisa tambien `Documentacion/05_Guias_y_Operaciones/RUNBOOK.md`.
