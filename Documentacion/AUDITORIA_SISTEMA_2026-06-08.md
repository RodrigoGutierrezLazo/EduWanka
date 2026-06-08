# Auditoría del Sistema — EduWanka (2026-06-08)

**Fecha:** 2026-06-08
**Alcance:** Nueva revisión integral del sistema (backend Laravel 11 + frontend React/Vite), posterior a la [Re-Auditoría 2026-06-07](./RE_AUDITORIA_SISTEMA_2026-06-07.md) que cerró los 14 hallazgos originales y entregó el Libro de Reclamaciones.
**Metodología:** Revisión estática de controladores, rutas, migraciones, configuración y frontend; ejecución de la suite de pruebas; verificación cruzada de hallazgos residuales documentados en la re-auditoría anterior (§3).
**Estado:** Todos los hallazgos reportados (H-1 a H-12) fueron corregidos durante esta misma sesión. Ver §2 para el detalle de cada corrección y su evidencia.

---

## 1. Resumen ejecutivo

Esta auditoría identificó **12 hallazgos**: 3 de severidad alta, 4 de severidad media y 5 de severidad baja/informativa. El más relevante (H-3) confirma y amplía el hallazgo residual #2 de la re-auditoría anterior: los endpoints de subida de archivos de `ModuleManagementController` y `AdminMaterialsController` aceptaban **cualquier tipo de archivo**, lo que permite un **XSS almacenado** vía HTML/SVG/JS servido desde el mismo origen (`/storage/*` sin `Content-Disposition: attachment`).

Durante la corrección se descubrió además que `AdminMaterialsController` es **código muerto**: sus modelos (`CourseUnit`, `UnitSession`, `Material`) apuntan a tablas (`course_units`, `unit_sessions`, `materials`) que el Sprint 11 renombró a `course_modules`/`module_sections`/`content_items`, por lo que cualquier llamada a sus endpoints producía un error 500 (`SQLSTATE[HY000]: ... no such table: course_units`). Se eliminaron sus rutas (H-8).

| Severidad | Cantidad | Estado |
|---|---|---|
| 🟠 Alta | 3 (H-1, H-2, H-3) | ✅ 3/3 corregidos |
| 🟡 Media | 4 (H-4, H-5, H-6, H-7) | ✅ 4/4 corregidos |
| 🔵 Baja/Info | 5 (H-8 – H-12) | ✅ 5/5 corregidos/documentados |
| **Total** | **12** | **✅ 12/12 cerrados** |

**Estado de la suite tras las correcciones:** 119 tests / 352 assertions / 100% verde. **Frontend:** `tsc --noEmit` sin errores.

---

## 2. Hallazgos, corrección aplicada y evidencia

### H-1 🟠 — `AdminSettingsController::uploadSettingFile` sin allowlist de MIME
**Archivo:** `backend/app/Http/Controllers/Api/V1/Admin/AdminSettingsController.php:119-125`
**Riesgo:** El endpoint de subida de archivos de configuración del tenant (logos, fotos de testimonios, convenios) solo validaba `file|max:51200`, sin restringir extensión/MIME. Un admin (o una sesión de admin comprometida) podía subir `.html`/`.svg`/`.js` que el navegador ejecuta al servirse desde `/storage/*` en el mismo origen → robo de sesión de otros administradores que abrieran el archivo.
**Corrección:** Se aplicó la regla `mimes:` poblada desde el nuevo allowlist centralizado `config('uploads.content_item_extensions')`.
```php
$allowedExtensions = implode(',', config('uploads.content_item_extensions'));
$request->validate([
    'file'   => ['required', 'file', 'max:51200', "mimes:{$allowedExtensions}"],
    'folder' => ['required', 'string', 'in:testimonials_photos,testimonials_videos,convenios,tenant_logos,payment_logos'],
]);
```
**Estado:** ✅ Corregido y cubierto por `UploadMimeRestrictionTest`.

### H-2 🟠 — `AssignmentController::submit` permite subir cualquier tipo de archivo (vector de bajo privilegio)
**Archivo:** `backend/app/Http/Controllers/Api/V1/Modules/AssignmentController.php:76-82`
**Riesgo:** Este es el endpoint de entrega de tareas, **accesible por estudiantes** — el rol de menor confianza del sistema. Aceptar cualquier MIME aquí es más peligroso que en endpoints de admin: baja la barrera para que un atacante (o cuenta de estudiante comprometida) plante un payload `.html`/`.svg` que un docente o administrador abrirá luego al revisar la entrega, ejecutando JS en el origen de la SPA con sus cookies de sesión.
**Corrección:** Allowlist de MIME vía `config('uploads.content_item_extensions')`.
```php
$allowedExtensions = implode(',', config('uploads.content_item_extensions'));
$request->validate([
    'file'    => ['sometimes', 'file', 'max:20480', "mimes:{$allowedExtensions}"],
    'comment' => ['sometimes', 'nullable', 'string', 'max:2000'],
]);
```
**Estado:** ✅ Corregido y cubierto por `UploadMimeRestrictionTest`.

### H-3 🟠 — XSS almacenado: `ModuleManagementController`/`AdminMaterialsController` sin allowlist de MIME (confirma hallazgo residual #2 de la re-auditoría 2026-06-07)
**Archivos:** `backend/app/Http/Controllers/Api/V1/Modules/ModuleManagementController.php:135-141`, `backend/app/Http/Controllers/Api/V1/Admin/AdminMaterialsController.php:78-83`
**Riesgo:** Los endpoints principales de subida de material de curso (Sprint 11) y su antecesor Sprint 5 aceptaban cualquier `file|max:51200`/`max:20480`. Combinado con que el disco `public` sirve los archivos en `/storage/*` **sin** `Content-Disposition: attachment`, el navegador renderiza `.html`/`.svg`/`.js` inline y ejecuta JS arbitrario en el origen de la SPA → robo de sesión, pivote a cuentas de mayor privilegio.
**Corrección:**
1. Se creó `backend/config/uploads.php`, un allowlist centralizado de extensiones permitidas (documentos, imágenes, video, audio, comprimidos) y una lista de extensiones explícitamente bloqueadas (`html, htm, svg, js, mjs, css, php, phtml, exe, bat, cmd, sh, msi, dll, so, py, rb, jsp, asp, aspx, cgi, pl`) para referencia/uso futuro.
2. Ambos controladores ahora validan con `mimes:` poblado desde ese config:
```php
// ModuleManagementController::storeItem
$allowedExtensions = implode(',', config('uploads.content_item_extensions'));
'file' => ['required', 'file', 'max:51200', "mimes:{$allowedExtensions}"],

// AdminMaterialsController::storeMaterial
$allowedExtensions = implode(',', config('uploads.material_extensions'));
'file' => ['required_if:type,file', 'file', 'max:20480', "mimes:{$allowedExtensions}"],
```
3. Se creó `backend/tests/Feature/Uploads/UploadMimeRestrictionTest.php` (11 tests / 37 assertions) que verifica el rechazo de `.html`, `.svg`, `.php`, `.js`, `.exe` y la aceptación de `.pdf`, `.docx`, `.mp4`, `.zip`, además de la integridad del propio archivo de configuración.
**Nota:** `AdminMaterialsController` resultó ser código muerto (ver H-8) — su corrección de MIME se conserva por completitud y porque comparte el `config/uploads.php` reutilizado por el resto de endpoints, pero sus rutas fueron eliminadas.
**Estado:** ✅ Corregido y verificado con tests dedicados (100% verde).

### H-4 🟡 — Columnas de `purchases` consultadas con frecuencia sin índice
**Archivo nuevo:** `backend/database/migrations/2026_06_08_000000_add_indexes_to_purchases_table.php`
**Riesgo:** (Documentado como hallazgo §4.4 de la re-auditoría anterior). `purchases.status`, `purchases.course_code` y `purchases.shipping_status` se filtran constantemente desde paneles de admin (validación de pagos, reportes, seguimiento de envíos) sin índice — degradación de rendimiento a medida que crece el volumen por tenant.
**Corrección:** Migración que agrega índices a `status`, `course_code` y, si existe, `shipping_status` (comprobación condicional con `Schema::hasColumn` para compatibilidad con entornos donde la columna pudiera no existir aún).
**Estado:** ✅ Migración creada, aplicada y reversible (`down()` simétrico).

### H-5 🟡 — `per_page` sin límite superior permite volcado masivo de tablas
**Archivos:** 8 controladores de listados de admin/superadmin.
**Riesgo:** Varios endpoints de listado aceptaban `per_page` directamente del query string sin techo (`(int) $request->query('per_page', N)`), permitiendo a un admin (o sesión de admin comprometida) extraer tablas completas en una sola petición (`?per_page=999999`), saltándose la paginación pensada para uso normal del panel — vector de exfiltración masiva de datos de usuarios/pagos/certificados.
**Corrección:** Se acotó el valor máximo a 200 en los 8 puntos detectados (2 reportados originalmente + 6 adicionales hallados en una pasada de `grep` de seguimiento):
- `AdminPaymentsController.php:30`, `AdminUsersController.php:61`, `AdminCertificatesController.php:39`, `AdminCoursesController.php:36`, `AdminPasswordRequestsController.php:20`, `AdminTeachersController.php:30`, `SuperadminComplaintController.php:35`, `AdminComplaintController.php:46`.
```php
$query->paginate(min((int) $request->query('per_page', 50), 200));
```
**Estado:** ✅ Corregido en los 8 archivos; verificado con `grep` que no quedan llamadas `paginate()` sin techo.

### H-6 🟡 — `TenantManagementController::uploadLogo` permitía `.svg` en logos de tenant
**Archivo:** `backend/app/Http/Controllers/Api/V1/Superadmin/TenantManagementController.php:100`
**Riesgo:** El endpoint de subida de logo de tenant (superadmin) incluía `svg` en su allowlist de `mimes`. Los SVG pueden contener `<script>`/`onload` embebido y ejecutarse al renderizarse inline en el navegador — vector de XSS almacenado incluso con allowlist "de imágenes".
**Corrección:** Se removió `svg` del allowlist: `'mimes:jpg,jpeg,png,webp,svg'` → `'mimes:jpg,jpeg,png,webp'`.
**Estado:** ✅ Corregido.

### H-7 🟡 — Rutas de gestión de módulos (Sprint 11) sin throttling
**Archivo:** `backend/routes/api.php` (grupo de rutas de `ModuleManagementController`/módulos)
**Riesgo:** El grupo de rutas autenticadas para gestión de cursos/módulos/secciones/contenido (incluye subida de archivos) carecía de `throttle`, a diferencia de otros grupos sensibles del sistema (pagos, autenticación). Esto permite ráfagas de peticiones (incluida la subida repetida de archivos grandes) sin limitación, facilitando abuso/DoS de bajo costo.
**Corrección:** Se agregó `throttle:120,1` al middleware del grupo:
```php
Route::middleware(['auth:sanctum', 'tenant.verify', 'throttle:120,1'])->group(function (): void {
```
**Estado:** ✅ Corregido — alineado con los demás grupos de rutas autenticadas (todos ahora llevan `throttle`).

### H-8 🔵 — Código muerto: `AdminMaterialsController` apunta a tablas inexistentes (Sprint 5 vs. Sprint 11)
**Archivo:** `backend/routes/api.php`
**Hallazgo:** La migración `2026_05_11_000000_sprint11_rename_to_modules.php` renombró `course_units` → `course_modules`, `unit_sessions` → `module_sections` y `materials` → `content_items`, pero los modelos legacy `CourseUnit`, `UnitSession` y `Material` (sin override de `protected $table`) siguen apuntando a las tablas viejas, ahora inexistentes. Cualquier llamada a las 9 rutas de `AdminMaterialsController` produce **500** (`SQLSTATE[HY000]: General error: 1 no such table: course_units`), confirmado al intentar testear ese controlador directamente.
**Decisión de corrección:** En vez de reparar modelos que apuntan a una estructura de datos que ya no existe (y que duplicarían `ModuleManagementController`, su reemplazo activo del Sprint 11), se **eliminaron las 9 rutas muertas** y se comentó su import, dejando un bloque explicativo:
```php
// ═══ Sprint 5 legacy (AdminMaterialsController) ELIMINADO ═══
// Las tablas course_units/unit_sessions/materials fueron renombradas
// a course_modules/module_sections/content_items en Sprint 11. Los
// modelos CourseUnit/UnitSession/Material apuntan a tablas inexistentes
// y producían 500. Reemplazado por ModuleManagementController (Sprint 11).
```
**Estado:** ✅ Rutas eliminadas; superficie de ataque y de errores 500 reducida. `ModuleManagementController` (con su nuevo allowlist de MIME, ver H-3) es el único punto de entrada activo para esta funcionalidad.

### H-9 🔵 — `console.error`/`console.warn` exponen detalles internos en producción
**Archivos:** 10 archivos del frontend (`App.tsx`, `Courses.tsx`, `ContentForms.tsx`, `AdminCertificados.tsx`, `AdminCourseEditor.tsx`, `AdminCuentas.tsx`, `AdminInicio.tsx`, `AdminSpecialtyBrochureBuilder.tsx`, `ProfessorStudents.tsx`, `ProfessorCertificates.tsx`) — 20 llamadas en total.
**Riesgo:** Los `console.error`/`console.warn` con objetos de error completos (incluyendo, en algunos casos, payloads de respuesta de la API) quedan visibles en la consola del navegador también en producción, ayudando a un atacante a mapear rutas internas, mensajes de validación y estructura del backend.
**Corrección:** Se creó un logger de solo-desarrollo `frontend/src/lib/logger.ts`:
```ts
const isDev = import.meta.env.DEV;
export const logger = {
  error(...args: unknown[]) { if (isDev) console.error(...args); },
  warn(...args: unknown[])  { if (isDev) console.warn(...args); },
};
```
y se reemplazaron las 20 llamadas `console.error(...)`/`console.warn(...)` por `logger.error(...)`/`logger.warn(...)` en los 10 archivos (con su import correspondiente). En desarrollo (`import.meta.env.DEV === true`) el comportamiento es idéntico al actual; en producción (`npm run build`) los mensajes simplemente no se emiten.
**Estado:** ✅ Corregido — verificado con `grep` que no quedan `console.error`/`console.warn` fuera de `lib/logger.ts`, y `tsc --noEmit` sin errores.

### H-10 🔵 — `SESSION_ENCRYPT=false` por defecto
**Archivo:** `backend/.env.example` (config real en `backend/config/session.php:50`, controlada por `env('SESSION_ENCRYPT', false)`)
**Observación:** La cookie de sesión de Sanctum (httpOnly, base de la autenticación SPA tras la migración 1.7) no va cifrada por defecto. Si bien el contenido de la cookie de sesión de Laravel ya está firmado/protegido contra manipulación por el `EncryptCookies`/session signing estándar, cifrar adicionalmente el payload de sesión (`SESSION_ENCRYPT=true`) añade una capa extra de defensa en profundidad para producción, evitando que el contenido de la sesión sea legible si llegase a filtrarse por otra vía (logs, backups del driver `database`, etc.).
**Corrección:** No se puede "corregir" un valor `env()` en el código (no hay `.env` versionado), así que se documentó la recomendación directamente en `backend/.env.example`, junto al valor:
```
# IMPORTANTE (producción): cambiar a SESSION_ENCRYPT=true. Esto cifra la
# cookie de sesión (Sanctum SPA usa cookies httpOnly) con APP_KEY, evitando
# que el contenido del payload de sesión pueda leerse o manipularse si se
# llegara a filtrar. En local puede quedar en false para depurar más fácil.
SESSION_ENCRYPT=false
```
**Estado:** ✅ Documentado como requisito de despliegue a producción en `.env.example` (no existe un `RUNBOOK` dedicado en `Documentacion/` actualmente — la guía de variables de entorno vive en este archivo).

### H-11 🔵 — `CORS_ALLOWED_ORIGINS`/`SANCTUM_STATEFUL_DOMAINS` apuntan solo a `localhost` en el ejemplo
**Archivo:** `backend/.env.example:73-74` (config real en `backend/config/cors.php:22` vía `env('CORS_ALLOWED_ORIGINS', ...)`)
**Observación:** El `.env.example` trae preconfigurados orígenes de `localhost`/`127.0.0.1`/`*.localhost` para el flujo de desarrollo con tenants (`LocalhostTenantSelector`). Si un despliegue de producción copiara este archivo sin editarlo, el backend aceptaría peticiones CORS con credenciales (`supports_credentials: true`) desde cualquier origen `localhost` — lo que un atacante puede simular sirviendo una página maliciosa desde su propia máquina, abusando de las cookies de sesión httpOnly del usuario.
**Corrección:** Se agregó un bloque de advertencia explícito justo encima de las variables, indicando que esos valores son solo para desarrollo y deben restringirse a los dominios reales en producción:
```
# IMPORTANTE (producción): estos valores de localhost son SOLO para
# desarrollo. En producción, CORS_ALLOWED_ORIGINS y SANCTUM_STATEFUL_DOMAINS
# deben restringirse exclusivamente a los dominios reales del SPA/tenants
# (ej. https://app.eduwanka.com,https://*.eduwanka.com). Dejar localhost en
# la lista de orígenes permitidos en producción habilitaría a cualquier sitio
# que se sirva desde un entorno local del atacante a hacer peticiones
# autenticadas con las cookies de sesión httpOnly del usuario (CSRF/CORS
# bypass). Ver también `config/cors.php` y `EnsureFrontendRequestsAreStateful`.
```
**Estado:** ✅ Documentado como requisito crítico de despliegue a producción.

### H-12 🔵 — TODO sin resolver: reenvío de email de certificado (feature incompleta)
**Archivo:** `frontend/src/pages/aula/professor/ProfessorCertificates.tsx:134-142`
**Observación:** `resendEmail()` tenía un `// TODO: implement backend endpoint for email resend` y solo mostraba una alerta de "próximamente". **No es un riesgo de seguridad** — es una funcionalidad incompleta que informa correctamente al usuario que aún no está disponible (no simula un envío que no ocurre).
**Corrección:** Se reemplazó el TODO escueto por un comentario de backlog explícito que documenta qué falta implementar (endpoint backend de reenvío, p. ej. `POST /api/v1/prof/courses/{course}/certificates/{cert}/resend-email` reutilizando el mailable existente de emisión de certificados), de forma que quede como ítem de backlog rastreable en el propio código en lugar de un TODO huérfano.
**Estado:** ✅ Documentado como backlog (no requiere corrección de seguridad).

---

## 3. Estado positivo del sistema (confirmado durante esta auditoría)

| Área | Estado |
|---|---|
| Autenticación SPA (Sanctum, cookies httpOnly) | ✅ `apiClient.ts` usa `withCredentials`+`withXSRFToken`; `auth.ts` no cachea tokens, solo perfil no sensible |
| Aislamiento por tenant (`tenant.verify`, `EnsureTenantMatchesAuthenticatedUser`) | ✅ Aplicado en todos los grupos autenticados |
| Validación de monto de compra en servidor | ✅ Calculado desde `Course::price`, ignora valor del cliente |
| Webhook de MercadoPago (firma + throttle + comparación de monto) | ✅ Verificado con `MercadoPagoWebhookTest` |
| IDOR en evaluaciones (scoping por curso + exclusión de `is_correct`) | ✅ Verificado con tests dedicados |
| Sanitización de HTML en frontend (DOMPurify vía `sanitizeHtml.ts`) | ✅ Aplicado en vistas que renderizan HTML de usuario |
| Uniques compuestos por tenant | ✅ Migración + reglas `Rule::unique(...)->where('tenant_id', ...)` |
| `cascadeOnDelete` corregidos + trait `Auditable` en certificados | ✅ Verificado |
| Libro de Reclamaciones (backend + frontend) | ✅ Completo, con `tenant_id` asignado en servidor |
| Recibos/certificados servidos vía endpoint autenticado | ✅ `SecureFileController`, sin path traversal |
| Suite de pruebas | ✅ 119 tests / 352 assertions / 100% verde |
| `tsc --noEmit` (frontend) | ✅ Sin errores |

---

## 4. Matriz de priorización de la corrección aplicada

| Prioridad | Hallazgos | Justificación |
|---|---|---|
| P0 (crítico/inmediato) | H-3 | XSS almacenado vía endpoint principal de contenido de curso — mayor superficie de exposición |
| P1 (alto) | H-1, H-2 | Mismo vector de XSS en endpoints de configuración (admin) y tareas (estudiante, bajo privilegio) |
| P2 (medio) | H-5, H-6, H-7 | Exfiltración de datos por paginación sin techo, SVG en logos, falta de rate limiting |
| P3 (bajo, deuda técnica) | H-4, H-8 | Rendimiento (índices) y limpieza de código muerto que producía 500 |
| P4 (informativo/documentación) | H-9, H-10, H-11, H-12 | Buenas prácticas de logging y configuración de despliegue; backlog documentado |

Todas las prioridades fueron resueltas en esta misma sesión — no quedan elementos pendientes de esta auditoría.

---

## 5. Conclusión

El sistema mantiene el cierre de los 14 hallazgos de auditorías previas y supera adicionalmente los 12 hallazgos detectados en esta revisión, todos corregidos:

- Se centralizó la validación de subida de archivos en `config/uploads.php` y se aplicó de forma consistente en **5 endpoints** (`AdminSettingsController`, `AssignmentController`, `ModuleManagementController`, `AdminMaterialsController`, además del ajuste puntual de `TenantManagementController`), cerrando la vía de XSS almacenado vía archivos servidos desde el mismo origen.
- Se identificó y eliminó código muerto (`AdminMaterialsController`/Sprint 5) que producía errores 500 por un refactor incompleto del Sprint 11.
- Se acotó la paginación en 8 controladores para prevenir volcados masivos de datos, se agregaron índices de rendimiento a `purchases`, y se aplicó `throttle` al grupo de rutas de gestión de módulos.
- Se introdujo un logger de solo-desarrollo (`lib/logger.ts`) que evita filtrar detalles internos por consola en producción, reemplazando 20 llamadas `console.error`/`console.warn` en 10 archivos.
- Se documentaron en `.env.example` los requisitos de configuración crítica para producción (`SESSION_ENCRYPT=true`, restricción de `CORS_ALLOWED_ORIGINS`/`SANCTUM_STATEFUL_DOMAINS` a dominios reales).
- Se dejó documentado como backlog (no como riesgo de seguridad) el TODO de reenvío de email de certificados.

**Estado final de la suite:** 119 tests / 352 assertions / 100% verde. **Frontend:** `tsc --noEmit` sin errores. El sistema queda en un estado consistente, sin hallazgos abiertos de esta auditoría.
