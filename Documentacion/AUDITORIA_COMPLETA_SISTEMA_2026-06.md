# Auditoría Completa del Sistema — EduWanka

**Fecha:** 2026-06-07
**Alcance:** Backend (Laravel 11 / PHP 8.2), Frontend (React 19 / Vite 6 / TS), Base de datos (MySQL, 42 migraciones), configuración, despliegue y cobertura de pruebas.
**Commit auditado:** `4989a55` (rama `main`, recién subida a `https://github.com/RodrigoGutierrezLazo/EduWanka`)
**Metodología:** Revisión estática de código (solo lectura) por área, con citas `archivo:línea`. No se ejecutó la aplicación ni se realizaron pruebas de penetración activas.

---

## 1. Resumen ejecutivo

EduWanka es un SaaS multi-tenant de aula virtual con un dominio de datos maduro (cursos → módulos → secciones → contenidos al estilo Moodle, compras, certificados, asistencia, exámenes). El código sigue en general buenas prácticas de Laravel (allowlists `$fillable`, queries parametrizadas, hashing bcrypt, rate limiting en endpoints sensibles), pero el **multi-tenancy fue retrofitteado sobre un esquema ya maduro** (junio 2026) y esa capa de aislamiento tiene **una falla crítica**: el slug de tenant llega por un header controlado por el cliente y nunca se valida contra el tenant real del usuario autenticado.

Se identificaron **7 hallazgos de seguridad concretos** (no solo observaciones de estilo), de los cuales **3 son críticos/altos** y requieren corrección antes de producción:

| # | Hallazgo | Severidad | Área |
|---|---|---|---|
| 1 | Bypass de aislamiento multi-tenant vía header `X-Tenant-Slug` no validado | 🔴 Crítica | Backend |
| 2 | Fuga del token de recuperación de contraseña en modo debug/local (y en logs) | 🔴 Crítica | Backend + Frontend |
| 3 | XSS almacenado: HTML de API renderizado sin sanitizar en 3 vistas (sin DOMPurify) | 🟠 Alta | Frontend |
| 4 | Monto de pago controlado por el cliente, sin validar contra el precio del curso | 🟠 Alta | Backend |
| 5 | Webhook de MercadoPago sin autenticación, sin verificación de firma y sin throttle | 🟠 Alta | Backend |
| 6 | IDOR/fuga de información en `index` de Assignments/Questionnaires/SubstituteExams (incluye respuestas correctas) | 🟠 Alta | Backend |
| 7 | Tokens de sesión y rol de usuario en `localStorage`/`sessionStorage` (amplifica cualquier XSS a takeover total) | 🟠 Alta | Frontend |

Adicionalmente se detectaron brechas de **integridad de datos** (uniques globales en vez de compuestos por tenant — colisión entre tenants), de **cobertura de pruebas** (el webhook de pagos y la emisión/revocación de certificados no tienen tests), y **restos de un scaffold de Google AI Studio/Gemini** tanto en el frontend (`vite.config.ts`, `package.json`, `.env.example`) como en la denominación del paquete (`"react-example"`).

---

## 2. Arquitectura general

**Modelo de dominio:** `Tenant` → `User`/`Course` → `CourseModule` → `ModuleSection` → `ContentItem` (árbol tipo Moodle), más cuatro ramas: comercio (`Purchase` → `PurchaseStatusAudit`), evaluación (`Questionnaire`/`SubstituteExam` + intentos/preguntas/opciones), asistencia (`AttendanceSession`/`Record`) y certificación (`Certificate` ← `CertificateTemplate`).

**42 migraciones** en total (3 por defecto de Laravel + 39 propias), organizadas por "sprints". Se observa una clara evolución incremental: el modelo `course_units` fue renombrado completo a `course_modules` a mitad de proyecto (`2026_05_11_000000_sprint11_rename_to_modules.php:11-24`), y la tabla `purchases` fue alterada **al menos 6 veces** después de su creación. El multi-tenancy (`tenants`, columna `tenant_id` en 8 tablas, `audit_logs`) se añadió recién el **2026-06-04 a 06-07**, días antes de esta auditoría — es decir, sobre un sistema ya en producción/avanzado, lo que explica varios de los hallazgos de aislamiento.

---

## 3. Auditoría de seguridad — Backend

### 3.1 Autenticación y sesiones
- **Login** (`LoginController.php:24-34`): `Hash::check` + Sanctum `plainTextToken`. Sin validación cruzada de tenant más allá del scope implícito de `BelongsToTenant`.
- **Registro** (`RegisterController.php:35-47`): fuerza `role => student`, usa `Rules\Password::defaults()`.
- **Logout** (`LogoutController.php:16`): revoca todos los tokens del usuario — correcto.
- 🔴 **Fuga de token de reseteo** (`ForgotPasswordController.php:38-49`): ante cualquier excepción al enviar el correo, genera el token vía `Password::broker()->createToken()`, **lo escribe en el log en texto plano** (`Log::info("TOKEN DE RESTABLECIMIENTO GENERADO (Log): {$token}…")`) y, si `app()->isLocal() || config('app.debug')`, **lo devuelve en la respuesta JSON** (`'token' => $token`). El `.env.example` trae `APP_DEBUG=true` por defecto — si ese valor llega a producción por descuido, **cualquiera puede tomar el control de una cuenta** solicitando el reseteo del email de la víctima y recibiendo el token directamente. El frontend (`ForgotPassword.tsx:26-28,73-83`) además **renderiza ese token como un enlace clickeable** ("Simulación de Desarrollo Local"), agravando el riesgo si el gating por entorno falla.
- **Hashing**: bcrypt, `BCRYPT_ROUNDS=12` — correcto.
- **Sanctum/CORS**: dominios stateful y orígenes CORS correctamente acotados a `*.eduwanka.pe` vía variables de entorno (`config/sanctum.php:18-23`, `config/cors.php:32`); `allowed_headers => ['*']` es permisivo pero estándar para SPA.
- **Rate limiting**: login/registro `5,1` en producción (`60,1` en local), forgot/reset `5,1` — razonable (`routes/api.php:91,95,99,103`).

### 3.2 Autorización y roles
- `EnsureUserHasRole` (`app/Http/Middleware/EnsureUserHasRole.php:26-30`) hace `in_array($user->role, $roles, true)` — simple y correcto, alias `role`.
- `AuthorizesModuleAccess` (`AuthorizesModuleAccess.php:19-43`): admin/superadmin siempre permitido; `prof` solo si es el profesor asignado; estudiante solo en GET con compra validada/pagada.
- 🟠 **IDOR / fuga de información en `index`**: `AssignmentController::index` (`AssignmentController.php:16-19`), `QuestionnaireController::index` (`QuestionnaireController.php:17-21`) y `SubstituteExamController::index` (`SubstituteExamController.php:17-20`) hacen `Model::all()/get()` **sin filtrar por curso autorizado ni verificar rol** — solo exigen `auth:sanctum` (`routes/api.php:272`). Cualquier estudiante autenticado puede listar **todas** las evaluaciones del tenant, incluyendo las de cursos en los que no está inscrito, y el `with('questions.options')` **filtra el flag `is_correct`** de las respuestas — exposición de las claves de respuesta.
- No existen Gates/Policies en `AppServiceProvider`; toda la autorización es ad-hoc en middlewares/traits/controladores.

### 3.3 Multi-tenancy — área de mayor riesgo
- `BelongsToTenant` (`BelongsToTenant.php:12-34`) aplica un `TenantScope` global y sella `tenant_id` al crear.
- `TenantScope::apply` (`TenantScope.php:16-18`) **solo filtra si `hasTenant()`** — si no se resuelve tenant, las queries quedan sin filtrar (devuelven filas de todos los tenants).
- 🔴 **Bypass de aislamiento vía header controlado por el cliente**: `TenantMiddleware::handle` (`TenantMiddleware.php:16-19`) confía en el header `X-Tenant-Slug` enviado por el cliente **antes** de intentar resolver por host/subdominio, **sin verificar en ningún punto que el usuario autenticado pertenezca a ese tenant** (no existe ninguna comparación contra `$request->user()->tenant_id`). Un usuario autenticado del Tenant A puede enviar `X-Tenant-Slug: tenant-b` y operar sobre los datos del Tenant B —cursos, compras, certificados, solicitudes de reseteo de contraseña, etc.— porque los chequeos de rol son agnósticos al tenant. Esto **anula por completo el propósito de `TenantScope`**. `TenantIsolationTest.php:82-103` solo cubre el caso "feliz" (usuario y header coinciden) y el caso de tenant suspendido — el escenario de *spoofing* cruzado **no está testeado**.
- La migración `2026_06_07_000000_make_tenant_id_not_nullable.php:22-75` hace un backfill seguro (crea/usa un tenant por defecto, actualiza `whereNull` antes del `change()`), pero envuelve el rearmado de FKs en bloques `try/catch` vacíos (líneas 58-63, 86-91) que silencian errores — un fallo ahí pasaría desapercibido.
- Endpoints de superadmin usan `withoutGlobalScope` correctamente, protegidos por `role:superadmin`.

### 3.4 Validación de entradas y asignación masiva
- Los controladores muestreados usan `$request->validate()` inline (sin Form Requests) con reglas razonablemente completas (`AssignmentController.php:30-36`, `QuestionnaireController.php:32-41`, etc.).
- 🟠 **Manipulación del monto de compra**: `RegisterPurchaseController::__invoke` acepta `'amount' => ['required','integer','min:1']` directamente del cliente (línea 45), lo persiste tal cual en `Purchase::amount` (línea 146) y lo reenvía a MercadoPago como `unit_price` (`PaymentGatewayService.php:36`). **El monto nunca se deriva ni valida contra `Course::price`** — un cliente malicioso podría enviar `amount: 1` para un curso costoso. El mismo problema existe en `storeForAuthenticatedUser` (líneas 227, 299).
- Los modelos usan `$fillable` (allowlist), no `$guarded = []` — patrón seguro. El `role` siempre se fuerza a `student` en los flujos de alta, así que no es explotable directamente vía mass-assignment.

### 3.5 Carga de archivos
- La mayoría valida `mimes:`/`max:` correctamente (certificados PDF ≤20MB, imágenes ≤5MB).
- 🟡 **Nombre de archivo sin sanitizar**: `AdminSpecialtyController::uploadBrochurePdf` (línea 168-169) usa `$file->getClientOriginalName()` tal cual para `storeAs()`. Laravel mitiga el *path traversal* clásico, pero permite colisiones/sobrescritura de archivos de otros tenants y nombres elegidos por el atacante.
- 🟡 **Sin restricción de tipo MIME en uploads genéricos**: `ModuleManagementController.php:137` y `AdminMaterialsController.php:81` aceptan **cualquier tipo de archivo** hasta 20-50MB en el disco `public`, servido sin autenticación en `/storage/*` — riesgo de *stored XSS* vía HTML/SVG/JS si se sube y sirve desde el mismo origen.
- 🟡 **Exposición pública de archivos sensibles**: recibos de pago, certificados y comprobantes residen en el disco `public` y se sirven sin autenticación en `/storage/*` (`AdminPaymentsController.php:46`, etc.). Quien obtenga/adivine la ruta de un recibo puede ver datos bancarios/personales de otro estudiante — la única protección es lo impredecible del nombre del archivo.

### 3.6 Pasarela de pagos (MercadoPago)
- `PaymentGatewayService` usa `Http::withToken()` con credenciales desde `config('services.mercadopago.*')` — sin secretos hardcodeados.
- 🟠 **Webhook sin autenticación ni verificación de firma**: `MercadoPagoWebhookController::__invoke` (`MercadoPagoWebhookController.php:17-23`) lee `type`/`data.id` del cuerpo **sin validar `x-signature`/secreto**, y la ruta (`routes/api.php:117-118`) **no tiene `auth` ni `throttle`**. Mitiga parcialmente re-consultando el pago directamente a la API de MercadoPago (línea 26), pero no compara `transaction_amount` contra `purchase->amount` antes de marcar como `paid` (líneas 57-63), y permite *flooding* de llamadas costosas sin límite de tasa.

### 3.7 Secretos y configuración
- No se hallaron secretos hardcodeados en `app/`, `config/`, `routes/` (solo `env()`/`config()`).
- `.env.example` y `.env.production.example` solo contienen placeholders (`MAIL_PASSWORD="CAMBIAR_POR_PASSWORD_HOSTINGER"`, `DB_PASSWORD=ESCRIBE_AQUI_UN_PASSWORD..."`, `APP_KEY=base64:GENERATE_WITH_KEY_GENERATE_ON_SERVER"`) — buena práctica.
- ⚠️ `.env.example:4` trae `APP_DEBUG=true` por defecto, lo que combinado con §3.1 es una combinación peligrosa si se copia sin cambios a un servidor.

### 3.8 Inyección SQL / queries crudas
- Todos los usos de `DB::raw`/`selectRaw`/`whereRaw` (en `AdminReportsController`, `SuperadminDataController`, `SuperadminMetricsController`, etc.) usan **fragmentos SQL estáticos**; la única parte "dinámica" es un `$monthExpression` derivado del *driver* de la conexión (no de input de usuario). **No se identificó riesgo de inyección SQL** — todo el input pasa por el query builder de Eloquent con bind de parámetros.

### 3.9 Auditoría (Audit Log)
- `Auditable` (`Auditable.php:14-39`) registra `created/updated/deleted`, redacta `password`/`remember_token`, y persiste `user_id`, `tenant_id`, `action`, `model_type/id`, `old/new_values` (JSON), IP y user-agent.
- 🟡 **No es resistente a manipulación**: `AuditLog` es un modelo Eloquent normal, sin *hash chaining* ni almacenamiento *append-only* — cualquiera con acceso a la BD (o un bug de escalación) podría alterar/borrar registros sin detección. Además, `Certificate`/`CertificateTemplate` **no usan `Auditable`**, dejando sin rastro las acciones más críticas legalmente (emisión/revocación de certificados).

### 3.10 Rate limiting
- Catálogo público `120,1`; auth `5,1`/`60,1` local; checkout `20,1`; verificación de certificados `20,1` (anti fuerza-bruta).
- 🟡 **Brechas**: el webhook de MercadoPago no tiene throttle (ver §3.6); el bloque de Módulos (Sprint 11: cuestionarios, exámenes sustitutos, asignaciones — `routes/api.php:272-311`, incluido el IDOR de §3.2) solo exige `auth:sanctum`, sin throttle ni restricción de rol explícita — un estudiante podría saturar `submitAttempt`/`submit` sin límite.

---

## 4. Auditoría de base de datos

### 4.1 Esquema general
42 migraciones; los hitos clave: creación de `courses`/`purchases`/`certificates` (abril 2026), expansión Sprint 5 (asistencia, unidades, materiales, exámenes, plantillas de certificado), renombrado completo Sprint 11 (`course_units→course_modules`, `unit_sessions→module_sections`, `materials→content_items`), y finalmente la tabla `tenants` + `audit_logs` (junio 2026) — un *retrofit* de multi-tenancy sobre un esquema ya maduro.

### 4.2 Multi-tenancy a nivel BD — área de riesgo
- `tenant_id` se añadió como **nullable** a 8 tablas (`2026_06_04_000001_add_tenant_id_to_existing_tables.php:9-29`) y luego se forzó a `NOT NULL` con backfill (§3.3).
- 🔴 `certificate_templates` aparece en la lista de "no nulos" pero **no fue incluida** en la migración que añade la columna originalmente — solo la obtiene vía otra migración posterior (`2026_06_06_000000_update_tenants_and_templates_for_customization.php`). El orden entre ambas migraciones es frágil.
- 🔴 **Uniques globales, no compuestos por tenant**: `users.email`, `purchases.idempotency_key`, `certificates.certificate_code`, `courses.slug`, `specialties.slug` son **únicos globalmente**, no `(tenant_id, columna)`. Esto impide que dos tenants distintos tengan, p. ej., un usuario con el mismo email o un curso con el mismo slug — una limitación real de escalabilidad/colisión cruzada para un SaaS multi-tenant.
- Tampoco hay índices compuestos `(tenant_id, status)`/`(tenant_id, email)` — cada query ahora antepone un predicado `tenant_id =`, y a medida que crezca el volumen por tenant esto impactará el rendimiento.

### 4.3 Relaciones e integridad
- `User`, `Course`, `Purchase`, `Certificate`, `CertificateTemplate` usan `BelongsToTenant`; `User`/`Course`/`Purchase` también usan `Auditable`, pero `Certificate`/`CertificateTemplate` no (ver §3.9).
- `BelongsToTenant` cae a "el primer tenant de la BD" si no hay contexto (`BelongsToTenant.php:16-33`) — conveniente para tests/dev local, pero puede enmascarar la falta de contexto de tenant en producción.
- Corrección positiva: `purchases.user_id`/`course_id` se cambiaron de `cascadeOnDelete` a `nullOnDelete`/`set null` para preservar registros de pago tras incidentes previos.
- 🟡 `certificates.exam_attempt_id` mantiene `cascadeOnDelete()` — **borrar un intento de examen borra el certificado emitido**, riesgoso para un documento con valor legal/de cumplimiento (`restrict`/`set null` serían más seguros).

### 4.4 Índices y rendimiento
Se indexan correctamente columnas de búsqueda/estado (`courses.code/slug/is_published`, `certificates.dni/status/batch_id/revoked_at`, `attendance_sessions.status/access_code`, etc.) y existen *uniques* compuestos donde corresponde (`content_progress(user_id, content_item_id)`, `audit_logs(model_type, model_id)`).
🟡 **Faltantes**: `purchases.status` (columna muy filtrada en dashboards admin) **no tiene índice**, tampoco `shipping_status` ni `course_code`.

### 4.5 Integridad de datos / enums
No existen ENUMs a nivel de BD — todos los campos de estado son `string` con valores documentados solo en comentarios y constantes de clase (`Purchase::STATUS_*`). Es un patrón común en Laravel, pero para un sistema de pagos/certificación implica que **nada impide persistir un estado inválido** vía `DB::table()`/seed/raw query directo — no hay CHECK constraints.

### 4.6 Tabla de auditoría
Captura `user_id`, `tenant_id`, `action`, `model_type/id`, `old/new_values` (JSON), `ip_address` (45 — compatible IPv6), `user_agent`. Buena base forense, pero: (a) certificados no auditados (§3.9); (b) `tenant_id` tiene `cascadeOnDelete` — **borrar un tenant destruye su propio rastro de auditoría**, contraproducente para retención forense/cumplimiento.

### 4.7 Factories
`UserFactory`/`CourseFactory`/`PurchaseFactory` son realistas (montos en soles, `pending_validation` por defecto, transferencia bancaria). Sin datos sensibles hardcodeados más allá del password estándar `Hash::make('password')` y un slug `'default-test'` duplicado copy-paste en las tres factories (mejora de DRY, no riesgo de seguridad).

---

## 5. Auditoría de seguridad — Frontend

### 5.1 Cliente API y manejo de autenticación
`apiClient.ts` es una instancia de Axios con `withCredentials: true` (línea 11) — sugiere autenticación por cookies de Sanctum — **pero además** adjunta un `Authorization: Bearer <token>` leído de almacenamiento (líneas 17-30). Es un **modelo híbrido/confuso**: cookies y bearer tokens conviven, y en la práctica se usa el segundo (`Login.tsx:50-57`, `Register.tsx:51-57` escriben el token al storage tras el login/registro).
**No hay manejo de CSRF en absoluto** (cero referencias a `XSRF`/`sanctum/csrf-cookie` en `src`), pese al proxy `/sanctum` configurado en `vite.config.ts:36-39` — consistente con un modelo de bearer token puro, pero confirma que el flujo de cookies de Sanctum no está realmente activo.
El interceptor de 401 (`apiClient.ts:32-47`) limpia el storage y redirige a `/login` con `window.location.href`, sin lógica de refresh de tokens.

### 5.2 Enrutamiento y control de acceso — solo del lado del cliente
🟠 `ProtectedRoute.tsx:8-23` decide acceso según `isAuthenticated()`/`getCurrentUserRole()`, que **solo leen JSON de `localStorage`/`sessionStorage`** (`auth.ts:88-98`) — datos completamente controlables por el atacante. Cualquier usuario puede abrir la consola, ejecutar `localStorage.setItem('eduwanka_user', JSON.stringify({role:'superadmin',...}))`, y la SPA mostrará menús/rutas de administrador. **Esto solo es seguro si cada endpoint del backend revalida el rol de forma independiente** — lo cual, según §3.2, sí ocurre vía middleware `role:` en la mayoría de los casos, pero la "seguridad" del gating en el cliente es nula por sí sola. `AulaLayout.tsx:203-223` sí hace una verificación real contra `/api/v1/aula/access`, pero solo decide si renderiza contenido, no qué rutas/menús se muestran.

### 5.3 XSS — confirmado, HTML sin sanitizar
🟠 **4 usos de `dangerouslySetInnerHTML`, ninguno con sanitizador** (no hay DOMPurify/sanitize-html en `package.json`):
- `StudentCourseDetail.tsx:97` — `item.body_html` de un módulo de curso, renderizado crudo.
- `StudentAssignment.tsx:113` — `assignment.instructions` (autoría de profesor/admin), renderizado crudo a estudiantes.
- `HomeLegacy.tsx:960` — `content.html_content` de una sección "HTML personalizado" del landing del tenant — vector de *stored XSS* potencialmente cruzado entre tenants si un admin de tenant (rol de menor confianza) puede editarlo.
- `HomeLegacy.tsx:786` — bloque `<style>` estático (riesgo bajo, no es dato de usuario).

Cualquiera de estos campos editables por un rol de menor privilegio (profesor, admin de tenant) y visto por uno de mayor confianza (estudiante, visitantes de otro tenant) constituye una cadena de *stored XSS* real. Se recomienda DOMPurify antes de renderizar.

### 5.4 Datos sensibles en almacenamiento del navegador
🟠 `auth.ts` guarda `eduwanka_access_token`, `eduwanka_user` (incluye el rol) y `eduwanka_active_auth` en `localStorage`/`sessionStorage` (`Login.tsx:50-57`; `Register.tsx` siempre escribe en ambos). **Esto significa que cualquier XSS (ver §5.3) deriva en control total de la cuenta** — los tokens son legibles por cualquier script inyectado, a diferencia de cookies `httpOnly`. Dado que `withCredentials: true` ya está activo, migrar a cookies `httpOnly` + flujo CSRF de Sanctum sería más seguro.
`tenant.ts:11-13` cae a `localStorage.getItem('active_tenant_slug')` en `localhost`, valor que se adjunta como header `X-Tenant-Slug` (`apiClient.ts:24-27`) — en local, cualquiera puede falsificar el tenant activo. Es aceptable como utilidad de desarrollo (gateada por `isLocalhost`), **pero el backend nunca debe confiar en ese header para autorización** — y según §3.3, lamentablemente sí lo hace.

### 5.5 Páginas nuevas de autenticación
- **Register.tsx**: validación mínima (solo coincidencia de contraseñas); delega en mensajes de error del backend — razonable. Persiste el token en local **y** session storage siempre, sin opción "recordarme".
- 🟠 **ForgotPassword.tsx:26-28,73-83**: si `data.token` viene en la respuesta, lo **muestra directamente como enlace clickeable** ("Simulación de Desarrollo Local"). Esto amplifica el riesgo de §3.1 — si el backend alguna vez devuelve el token fuera de un entorno local/debug, el frontend lo expone de inmediato a quien hizo la solicitud.
- **ResetPassword.tsx**: lee `token`/`email` de query params, valida coincidencia y presencia, mensajes de error genéricos — sin problemas evidentes más allá de depender de que el token llegue por un canal seguro.

### 5.6 Estado y peticiones de datos
TanStack React Query usado consistentemente; 5 hooks delgados en `src/hooks/` para datos de dashboards. No se hallaron usos sueltos de `axios`/`fetch` fuera de `apiClient` salvo uno legítimo (`AdminCertificados.tsx:1154`, descarga de un PDF de plantilla — no es llamada API autenticada).

### 5.7 Organización de componentes
Estructura clara por rol (`pages/aula/{admin,professor,student,superadmin}`), pero con **archivos muy grandes** (`AdminCertificados.tsx` 1947 líneas, `AdminInicio.tsx` 1332, `AdminSpecialtyBrochureBuilder.tsx` 1189) que mezclan *fetching*, UI pesada y lógica de negocio — candidatos a descomposición. `HomeLegacy.tsx` **no es código muerto** (se renderiza condicionalmente cuando hay tenant activo — `App.tsx:177-179`), pero su nombre confunde. Lógica de "olvidé mi contraseña" duplicada entre el modal de `Login.tsx` y la página `ForgotPassword.tsx`.
🟡 **Hallazgo funcional (no de seguridad)**: el Libro de Reclamaciones (`ComplaintsBook.tsx:114-122`, `AdminComplaints.tsx`) está implementado **completamente como un mock en `localStorage`** (`eduwanka_complaints` + `MOCK_COMPLAINTS`) y **nunca llama al backend** — los reclamos enviados por usuarios reales solo se guardan en su propio navegador, no se persisten en el servidor. Esto puede ser un problema legal/regulatorio para una institución educativa peruana (el Libro de Reclamaciones es obligatorio por ley).

### 5.8 Configuración de build
🟡 `vite.config.ts:19-21` inyecta `process.env.GEMINI_API_KEY` como constante en el bundle del cliente — **resto de un scaffold de Google AI Studio** ajeno a este proyecto. Si esa variable llega a poblarse alguna vez, **la clave quedaría embebida en el JS público**, expuesta a todos los visitantes. Se recomienda eliminar ese bloque `define` y las referencias a Gemini/AI Studio en `.env.example`.

---

## 6. Auditoría de pruebas, configuración y despliegue

### 6.1 Cobertura de pruebas backend
12 archivos de Feature tests (~60 métodos): `Api/`, `Aula/` (incluye `TenantIsolationTest`), `Auth/` (`AuthSecurityTest`, `RegisterAndRecoveryTest`), `Payments/`, `Purchases/` (4 archivos, incluye mocks de MercadoPago e idempotencia). Carpetas `Feature/Admin` y `Feature/Learning` están **vacías**. `Unit/` solo tiene el `ExampleTest` por defecto — **cero pruebas unitarias reales**.

Las pruebas revisadas (`RegisterAndRecoveryTest`, `TenantIsolationTest`, `RegisterPurchaseTest`, `AuthSecurityTest`) cubren lógica de negocio y límites de seguridad reales (no solo *happy paths*): contexto de tenant obligatorio, aislamiento por scope, tenant suspendido → 403, acceso por rol, idempotencia de compras.

🔴 **Brechas críticas de cobertura**:
- El **webhook de MercadoPago no tiene ningún test** (cero referencias a "webhook" en `tests/`), pese a ser el punto de confirmación de pagos reales.
- **No hay pruebas de emisión/revocación de certificados** (`AdminCertificatesController::revoke/restore/destroy/batch`, `ProfessorCertificateController::issue/destroy`) — solo se cubre la personalización de plantillas.
- No hay pruebas para `CertificateBulkImportController` ni para los controladores `Admin`/`Learning` en general.

### 6.2 Configuración de entorno y secretos
`.env.example`/`.env.production.example` contienen **solo placeholders** bien documentados (`CAMBIAR_POR_PASSWORD_HOSTINGER`, `ESCRIBE_AQUI_UN_PASSWORD...`, `APP_KEY=base64:GENERATE_WITH_KEY_GENERATE_ON_SERVER`) y están correctamente en `.gitignore`. La config de producción documenta correctamente `SESSION_DOMAIN=.eduwanka.pe` para cookies cruzadas entre subdominios de tenants.
🟡 `frontend/.env.example` es **boilerplate obsoleto de un scaffold "AI Studio"** (`GEMINI_API_KEY`, `APP_URL="MY_APP_URL"`) — no documenta las variables reales (`VITE_API_BASE_URL`, `VITE_DEV_PROXY`), confunde a cualquiera que siga el setup.

### 6.3 CORS y Sanctum
`config/cors.php` restringe rutas a `api/*`/`sanctum/csrf-cookie`, orígenes desde `CORS_ALLOWED_ORIGINS` (prod: `https://eduwanka.pe,https://*.eduwanka.pe`), `supports_credentials => true`. **Se verificó en el vendor** (`fruitcake/php-cors/.../CorsService.php:106-132`) que el wildcard `*.eduwanka.pe` se convierte en un patrón regex anclado — **no** es el antipatrón `Access-Control-Allow-Origin: *`. Esta configuración es correcta y coherente con `SANCTUM_STATEFUL_DOMAINS`.

### 6.4 Configuración de despliegue (nginx.conf.example)
En general sólido: redirección HTTP→HTTPS, TLS 1.2/1.3 con cifrados modernos, headers de seguridad (`X-Frame-Options`, `CSP`, `X-Content-Type-Options`, `Referrer-Policy`), proxy a PHP-FPM vía socket, bloqueo de dotfiles (`.env`/`.git`).
🔴 **Bug evidente — línea 22**: `listen 445 ssl http2;` (puerto **445**, el de SMB) en vez de **443**, mientras la directiva IPv6 en la línea 23 sí usa `[::]:443` — un typo/placeholder que **rompería HTTPS en IPv4** si se copia tal cual (el comentario "Cambiar a 443 al habilitar producción" sugiere que es intencional como placeholder, pero es arriesgado dejarlo así en un archivo "example" pensado para copiarse).
🟡 Faltan: cabecera **HSTS** (`Strict-Transport-Security`) pese a tener TLS completo, directivas `gzip`, y `expires`/`cache-control` para los bundles JS/CSS de la SPA (solo `/storage` los tiene).

### 6.5 Salud de dependencias
`composer.json`: PHP `^8.2`, Laravel `^11.0`, Sanctum `^4.3`, PhpSpreadsheet `^5.7`, FPDI/FPDF — generación moderna y razonable para un LTS.
`package.json` (frontend): React `^19`, Vite `^6`, TS `~5.8`, Tailwind `^4`, TanStack Query `^5`, axios `^1.15`, react-router-dom `^7` — todo actual. Pero:
- 🟡 El **nombre del paquete sigue siendo `"react-example"`** — nunca se renombró.
- 🟡 `vite` aparece duplicado en `dependencies` **y** `devDependencies`.
- 🟡 `@google/genai`, `dotenv`, `express` parecen restos no usados del scaffold de AI Studio (consistente con §5.8 y §6.2) — peso muerto a podar.

### 6.6 Proceso de build/ejecución
`iniciar-eduwanka.bat` hardcodea `C:\xampp\htdocs\EduWanka` y `C:\xampp` — específico de esta máquina (aunque sí valida que las rutas existan antes de lanzar). Imprime credenciales de demo en texto plano (`admin@eduwanka.local` / `Password123!`) — aceptable para desarrollo local, pero un hábito a vigilar para que nunca migre a un script "deployable". El `README.md` documenta un proceso de setup claro y razonable, aunque referencia rutas de documentación (`04_Pruebas_y_QA/`, `03_Desarrollo_Sprints/`) que **no coinciden** con las reales (`03_Pruebas_y_QA/`, `02_Planificacion_y_Fases/` según `CLAUDE.md`) — *drift* de documentación.

### 6.7 Comandos de limpieza de almacenamiento
Ambos comandos en `app/Console/Commands/` son seguros:
- `certificates:clean-previews`: solo borra `.pdf` en `certificate-previews/` con más de 1 hora de antigüedad — alcance acotado.
- `storage:clean-orphaned --dry-run`: soporta modo simulación, solo apunta a subcarpetas con nombres puramente numéricos verificados contra la BD, y registra cada huérfano antes de actuar. Por defecto sí borra, pero la lógica es conservadora y bien registrada. Ninguno está programado en `routes/console.php` — solo se ejecutan manualmente.

---

## 7. Tabla consolidada de hallazgos priorizados

| Prioridad | Hallazgo | Ubicación | Acción recomendada |
|---|---|---|---|
| 1 🔴 | Header `X-Tenant-Slug` no validado contra el tenant del usuario → fuga cruzada entre tenants | `TenantMiddleware.php:16-19` | Validar `$request->user()->tenant_id` contra el tenant resuelto; rechazar con 403 si no coinciden (salvo superadmin) |
| 2 🔴 | Token de reseteo de contraseña expuesto en logs y en respuesta JSON bajo debug/local; el frontend lo renderiza como link | `ForgotPasswordController.php:38-49`, `ForgotPassword.tsx:26-28` | Eliminar el log en texto plano; nunca devolver el token en la respuesta (ni siquiera en local — usar Mailtrap/logs de correo); quitar el renderizado del link en el frontend |
| 3 🟠 | `listen 445 ssl http2` en vez de 443 en el ejemplo de nginx | `nginx.conf.example:22` | Corregir a 443 antes de publicar el ejemplo; añadir HSTS y gzip |
| 4 🟠 | Monto de compra controlado por el cliente sin validar contra `Course::price` | `RegisterPurchaseController.php:45,146,227,299` | Calcular el monto en servidor a partir del curso; ignorar/rechazar el `amount` enviado por el cliente |
| 5 🟠 | Webhook de MercadoPago sin auth, sin verificación de firma, sin throttle, sin comparar `transaction_amount` | `MercadoPagoWebhookController.php:17-23`, `routes/api.php:117-118` | Validar firma `x-signature`/secreto; aplicar `throttle`; comparar el monto recibido contra `purchase->amount` antes de marcar `paid` |
| 6 🟠 | `index` de Assignments/Questionnaires/SubstituteExams sin scoping ni rol → IDOR + fuga de respuestas correctas | `AssignmentController.php:16-19`, `QuestionnaireController.php:17-21`, `SubstituteExamController.php:17-20` | Filtrar por curso autorizado (reusar `AuthorizesModuleAccess`) y excluir `is_correct` para roles no-admin |
| 7 🟠 | XSS almacenado: `dangerouslySetInnerHTML` sin sanitizar | `StudentCourseDetail.tsx:97`, `StudentAssignment.tsx:113`, `HomeLegacy.tsx:960` | Integrar DOMPurify (`npm i dompurify`) y sanitizar antes de renderizar |
| 8 🟠 | Tokens y rol de usuario en `localStorage`/`sessionStorage` | `auth.ts`, `Login.tsx:50-57`, `Register.tsx:52-56` | Migrar a cookies `httpOnly` + flujo CSRF de Sanctum (ya hay `withCredentials: true`) |
| 9 🟡 | Uniques globales (`email`, `slug`, `certificate_code`, `idempotency_key`) en vez de compuestos por `tenant_id` | Varias migraciones (§4.2) | Migrar a `unique(['tenant_id', 'columna'])`; requiere migración de datos cuidadosa |
| 10 🟡 | Libro de Reclamaciones implementado solo como mock en `localStorage`, nunca persiste en backend | `ComplaintsBook.tsx:114-122`, `AdminComplaints.tsx` | Conectar a un endpoint real — posible obligación legal en Perú |
| 11 🟡 | Cobertura de pruebas: webhook y emisión/revocación de certificados sin tests; `Unit/` vacío | `tests/Feature/`, `tests/Unit/ExampleTest.php` | Añadir tests de webhook (firma inválida, monto no coincidente) y de ciclo de vida de certificados |
| 12 🟡 | Restos de scaffold "AI Studio"/Gemini: `vite.config.ts:19-21`, `frontend/.env.example`, `package.json` (`"react-example"`, `@google/genai`, `dotenv`, `express`, `vite` duplicado) | Frontend | Eliminar el bloque `define` de `GEMINI_API_KEY`, reescribir `.env.example`, renombrar el paquete y podar dependencias no usadas |
| 13 🟡 | Exposición pública sin auth de recibos/certificados vía `/storage/*`; nombre de archivo del cliente sin sanitizar en brochures | `AdminPaymentsController.php:46`, `AdminSpecialtyController.php:168-169` | Servir estos archivos vía un endpoint autenticado con *signed URLs*, o generar nombres aleatorios server-side |
| 14 🟡 | `certificates.exam_attempt_id` con `cascadeOnDelete`; `audit_logs.tenant_id` con `cascadeOnDelete`; certificados sin `Auditable` | Migraciones de `certificates`/`audit_logs`, modelos `Certificate`/`CertificateTemplate` | Cambiar a `restrict`/`set null` para preservar documentos legales y rastros de auditoría |

---

## 8. Conclusión

El sistema tiene una base de código sólida y sigue convenciones de Laravel/React modernas (validación, hashing, queries parametrizadas, rate limiting, React Query, allowlists de mass-assignment). El **riesgo principal es estructural**: el multi-tenancy se añadió como una capa sobre un sistema ya maduro, y esa capa tiene una **brecha de validación crítica** (el header de tenant no se contrasta con el usuario autenticado) que, combinada con la exposición del token de reseteo de contraseña, constituye el par de hallazgos de mayor prioridad a corregir antes de cualquier despliegue multi-tenant en producción. Los hallazgos de frontend (XSS sin sanitizar, tokens en `localStorage`) son el segundo bloque más urgente, ya que se amplifican mutuamente: cualquier XSS exitoso se traduce directamente en robo de sesión completo.

Se recomienda priorizar, en este orden: (1) cierre del bypass de tenant, (2) eliminación de la fuga del token de reseteo, (3) saneamiento de HTML en frontend + migración de tokens a cookies `httpOnly`, (4) validación server-side del monto de compra y endurecimiento del webhook de pagos, y (5) el resto de hallazgos 🟡 como deuda técnica a planificar en los próximos sprints.
