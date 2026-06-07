# INAPROF — Guia para Claude Code

## Stack

- **Backend**: Laravel 11, PHP 8.2+, Laravel Sanctum (auth), MySQL via XAMPP
- **Frontend**: React 19, Vite 6, TypeScript, Tailwind CSS 4
- **UI**: lucide-react (iconos), motion (animaciones), TanStack React Query (data fetching)
- **PDFs**: FPDI/FPDF (generacion), pdfjs-dist (preview en frontend)
- **Spreadsheets**: PhpSpreadsheet (import/export XLSX/CSV)

## Comandos de desarrollo

```bash
# Backend (puerto 8000)
cd backend && php artisan serve --port=8000

# Frontend (puerto 3000)
cd frontend && npm run dev

# Build produccion
cd frontend && npm run build
# Luego copiar dist/ a backend/public/spa/

# Tests backend
cd backend && php artisan test

# Verificar sintaxis PHP
php -l backend/app/Http/Controllers/Api/V1/Admin/NombreController.php

# Limpiar previews de certificados
cd backend && php artisan certificates:clean-previews

# Limpiar archivos huerfanos
cd backend && php artisan storage:clean-orphaned --dry-run
```

## Estructura del proyecto

```
INAPROF/
├── backend/                # API Laravel
│   ├── app/Models/         # Eloquent models
│   ├── app/Http/Controllers/Api/V1/  # Controllers por rol
│   │   ├── Admin/          # AdminCertificatesController, AdminCoursesController, etc.
│   │   ├── Professor/      # ProfessorCertificateController, etc.
│   │   ├── Learning/       # VerifyCertificateController, etc.
│   │   └── Aula/           # AdminDataController, StudentDataController, etc.
│   ├── routes/api.php      # Todas las rutas API
│   ├── database/migrations/
│   └── public/spa/         # Frontend compilado (Vite output)
├── frontend/               # SPA React/Vite
│   ├── src/pages/          # Paginas por seccion
│   │   ├── aula/admin/     # AdminCertificados, AdminCursos, AdminHistorial, etc.
│   │   ├── aula/professor/ # ProfessorCertificates, ProfessorCourses, etc.
│   │   ├── aula/student/   # StudentProfile, StudentCourses, etc.
│   │   └── aula/superadmin/
│   ├── src/components/     # Componentes reutilizables
│   ├── src/hooks/          # React Query hooks
│   └── src/lib/            # apiClient, types, utils
├── Documentacion/          # Documentacion centralizada (6 secciones)
└── README.md
```

## Convenciones

- Documentacion en espanol, codigo en ingles
- API base: `http://localhost:8000/api/v1`
- Autenticacion: Laravel Sanctum con cookies (SPA)
- Roles: `student`, `prof`, `admin`, `superadmin`
- Moneda: Soles peruanos (S/), locale `es-PE`
- Commits en espanol

## Modelos principales

- `User` (name, email, role, dni, phone, city)
- `Course` (title, code, price, certificate_template_id)
- `Purchase` (user_id, course_id, amount, status, bank_entity, receipt_path)
- `Certificate` (user_id, course_id, certificate_code, dni, file_path, revoked_at)
- `CertificateTemplate` (name, template_path, fields)
- `CourseModule` → `ModuleSection` → `ContentItem` (estructura tipo Moodle)

## Flujo de pagos

`pending_validation` → `validated` (admin valida) → `paid` (confirmado)
`pending_validation` → `rejected` (admin rechaza)

## Documentacion

Toda la documentacion esta centralizada en `Documentacion/` (ver `Documentacion/INDICE.md` para la guia completa):

### Documentos tecnicos clave
- `01_Inicial_y_Arquitectura/Arquitectura_Tecnica.md` — Arquitectura completa, diagramas, pipelines, seguridad
- `01_Inicial_y_Arquitectura/Esquema_Base_de_Datos.md` — 27 tablas MySQL con columnas, FKs, relaciones Eloquent
- `01_Inicial_y_Arquitectura/Referencia_API_Completa.md` — 80+ endpoints organizados por rol y categoria
- `01_Inicial_y_Arquitectura/Flujos_de_Usuario.md` — Flujos end-to-end por rol (visitante, student, prof, admin, superadmin)

### Estructura de carpetas
- `00_Especificaciones_SDD_Estado_del_arte/` — Manifiesto y contratos SDD
- `01_Inicial_y_Arquitectura/` — Arquitectura, BD, API, flujos, diseno
- `02_Planificacion_y_Fases/` — Fases de desarrollo con sprints integrados
- `03_Pruebas_y_QA/` — Resultados SDD por fase
- `04_Guias_y_Operaciones/` — RUNBOOK, checklist, formularios, errores conocidos
- `05_Auditorias_y_Cierre/` — Auditorias, resumen consolidado, indice de trabajos
