<p align="center">
  <img src="logo_eduwanka.png" alt="EduWanka" width="120" />
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

- Arquitectura multi-tenant: cada institucion opera como un tenant aislado (subdominio propio, branding, datos scopeados por `tenant_id`).
- Registro de cuentas y recuperacion de contraseña (registro, forgot-password, reset-password) para estudiantes.
- Integracion de pasarela de pagos MercadoPago (preferencias de pago y webhook de confirmacion).
- Sistema de auditoria (`audit_logs`): registro de creaciones/cambios/eliminaciones en modelos sensibles (usuarios, cursos, compras).
- Consolidacion de modulos tipo aula virtual: modulos, secciones, items, cuestionarios, examenes sustitutorios y tareas.
- Ampliacion de flujos para admin, profesor, estudiante y superadmin.
- Integracion de gestion de certificados, compras, asistencia y progreso de contenido.
- Auditoria de seguridad completa del sistema (ver seccion "Auditoria y Seguridad" mas abajo).

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
├── backend/          # API Laravel, modelos, controladores, rutas, migraciones, tests y Dockerfile
├── frontend/         # SPA React/Vite/TypeScript, Dockerfile y suite E2E (cypress/)
├── Documentacion/    # Analisis, diseno, reportes y auditorias del sistema
├── eduwanka.sql      # Dump de base de datos de referencia (no se versiona, ver .gitignore)
├── openapi.yaml      # Contrato OpenAPI base
├── docker-compose.yml            # Orquestacion Docker (db + backend + frontend)
├── docker-compose.override.yml   # Overrides de desarrollo (hot-reload, phpMyAdmin)
├── .env.docker.example           # Plantilla de variables para Docker Compose
├── iniciar-eduwanka.bat          # Inicio rapido local (XAMPP + Laravel + Vite)
├── docker-eduwanka.bat           # Inicio rapido con Docker Compose
├── Makefile                      # Atajos multiplataforma para Docker Compose
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

## Levantar con Docker (alternativa a XAMPP)

Como alternativa al flujo local con XAMPP, el repositorio incluye una
orquestacion completa con Docker Compose (`docker-compose.yml` +
`docker-compose.override.yml`): contenedores para MySQL, el backend Laravel
y el frontend React, con migraciones y seeders ejecutados automaticamente al
iniciar. Ambos flujos coexisten sin chocar (MySQL del contenedor se expone en
el puerto `3307` del host, no en el `3306` que usa XAMPP).

Requisitos: Docker Desktop (o Docker Engine + Compose plugin).

```bash
# 1. Copiar la plantilla de variables de entorno (solo la primera vez)
copy .env.docker.example .env

# 2. Levantar el stack (modo desarrollo: Vite con hot-reload + phpMyAdmin)
docker compose up --build
```

URLs una vez levantado el stack:

```text
Frontend (Vite dev server con hot-reload):  http://localhost:3000
Backend / API:                               http://localhost:8000/api/v1
phpMyAdmin:                                  http://localhost:8081
```

En Windows tambien puedes usar el script de conveniencia (analogo a
`iniciar-eduwanka.bat`, pero para Docker):

```bat
docker-eduwanka.bat        REM levanta el stack (modo desarrollo)
docker-eduwanka.bat down   REM detiene y elimina los contenedores
docker-eduwanka.bat test   REM corre "php artisan test" dentro del contenedor
docker-eduwanka.bat logs   REM sigue los logs de todos los servicios
```

O, si tienes `make` disponible (Git Bash/WSL), los mismos atajos viven en el
`Makefile`: `make up`, `make down`, `make test`, `make logs`, `make shell`.

Para un perfil mas cercano a produccion (la SPA compilada y servida por
Nginx, sin hot-reload ni phpMyAdmin):

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build
```

El detalle de las decisiones de diseno (Dockerfiles multi-stage, healthchecks,
estrategia de migraciones automaticas, etc.) esta documentado en
[`Documentacion/PLAN_DOCKERIZACION_Y_PRUEBAS_E2E_CYPRESS.md`](Documentacion/PLAN_DOCKERIZACION_Y_PRUEBAS_E2E_CYPRESS.md).

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

POST   /auth/register
POST   /auth/forgot-password
POST   /auth/reset-password
POST   /payments/mercadopago/webhook
```

El contrato base esta en `openapi.yaml`; las rutas completas viven en `backend/routes/api.php`.

## Modulos Funcionales

- Autenticacion con Sanctum (login, registro, recuperacion de contraseña) y proteccion por roles.
- Arquitectura multi-tenant: instituciones aisladas por `tenant_id`, con branding y dominio propios.
- Catalogo publico de cursos y docentes.
- Flujo de compra e inscripcion, con pasarela de pagos MercadoPago (preferencias y webhook).
- Aula del estudiante con cursos, materiales, progreso, tareas y evaluaciones.
- Administracion de cursos, docentes, usuarios, participantes y pagos.
- Gestion de asistencia para admin y profesor.
- Certificados, plantillas, previsualizacion, emision y verificacion.
- Panel de profesor con cursos, estudiantes, materiales, perfil y certificados.
- Panel de superadmin con usuarios, tenants y metricas globales.
- Modulos tipo Moodle: modulos, secciones, items, cuestionarios, examenes sustitutorios y tareas.
- Registro de auditoria (`audit_logs`) de cambios sobre modelos sensibles.
- Libro de Reclamaciones (en migracion de prototipo local a backend — ver plan de correcciones).

## Auditoria y Seguridad

El sistema cuenta con una auditoria tecnica completa (backend, base de datos, frontend, configuracion y despliegue), con hallazgos clasificados por severidad y un plan de correccion en fases:

- [`Documentacion/AUDITORIA_COMPLETA_SISTEMA_2026-06.md`](Documentacion/AUDITORIA_COMPLETA_SISTEMA_2026-06.md) — informe completo con hallazgos, ubicacion exacta (`archivo:linea`) y severidad.
- [`Documentacion/PLAN_CORRECCIONES_AUDITORIA_Y_LIBRO_RECLAMACIONES.md`](Documentacion/PLAN_CORRECCIONES_AUDITORIA_Y_LIBRO_RECLAMACIONES.md) — plan de correccion por fases (critico → alta → media prioridad), incluyendo el diseño de base de datos del Libro de Reclamaciones.

Buenas practicas de configuracion local:

- No subir archivos `.env` (backend y frontend ya estan en `.gitignore`).
- No subir `.cursor/mcp.json` ni las carpetas `.cursor/`/`.claude/`; contienen configuraciones locales, historiales y pueden incluir claves.
- Mantener secretos en variables de entorno o en un gestor de secretos; nunca hardcodearlos en el codigo.
- Revisar cualquier credencial expuesta antes de publicar cambios (`git status`, `git diff --cached`).
- Las rutas sensibles usan autenticacion Sanctum, roles (`role:` middleware) y throttling en backend — revisa la auditoria antes de exponer nuevos endpoints.

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

Pruebas E2E (Cypress) — requieren el backend (`:8000`) y el frontend (`:3000`)
corriendo, ya sea en local (XAMPP + `npm run dev`) o con `docker compose up`:

```bash
cd frontend
npm run cypress:open   # modo interactivo (recomendado en desarrollo)
npm run test:e2e       # modo headless, levanta el dev server automaticamente
```

Antes de la primera corrida, siembra datos limpios para que los specs sean
reproducibles: `cd backend && php artisan migrate:fresh --seed`. Los
escenarios cubiertos (catalogo, autenticacion, checkout/matricula, Aula
Virtual por rol, certificados, Libro de Reclamaciones) y la convencion de
comandos personalizados (`cy.loginAs`, `cy.seedDb`) estan documentados en
[`Documentacion/PLAN_DOCKERIZACION_Y_PRUEBAS_E2E_CYPRESS.md`](Documentacion/PLAN_DOCKERIZACION_Y_PRUEBAS_E2E_CYPRESS.md).

## Documentacion

La carpeta `Documentacion/` reune los analisis, diseños, reportes y auditorias del proyecto:

```text
Documentacion/
├── ANALISIS_MIGRACION_FRONTEND.md
├── AUDITORIA_COMPLETA_SISTEMA_2026-06.md
├── DESIGN.md
├── PLAN_CORRECCIONES_AUDITORIA_Y_LIBRO_RECLAMACIONES.md
├── IMPLEMENTACION_DOCKERIZACION_Y_CYPRESS_2026-06.md
├── PLAN_DOCKERIZACION_Y_PRUEBAS_E2E_CYPRESS.md
├── REPORTE_SITIO.md
└── páginawebinfo.md
```
