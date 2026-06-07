# Plan de Correcciones — Auditoría, Libro de Reclamaciones y README

**Fecha:** 2026-06-07
**Basado en:** [`AUDITORIA_COMPLETA_SISTEMA_2026-06.md`](./AUDITORIA_COMPLETA_SISTEMA_2026-06.md)
**Objetivo:** Plan accionable, en fases, para cerrar los 14 hallazgos de la auditoría, diseñar la base de datos del Libro de Reclamaciones (general + por aula/tenant), y mantener el README sincronizado con el estado real del repo.

---

## 0. Corrección inmediata aplicada (.env)

`backend/.env:55` tenía `MAIL_PASSWORD=#Edu_Wanka_2026#` sin comillas. El parser de `.env` (Symfony Dotenv / `vlucas/phpdotenv`, usado por Laravel) trata `#` como inicio de comentario cuando no está entre comillas — por lo tanto Laravel leía `MAIL_PASSWORD` como **vacío** y descartaba `Edu_Wanka_2026#` como comentario, con lo cual el envío de correos fallaría silenciosamente (auth SMTP rechazada).

**Corregido →** `MAIL_PASSWORD="#Edu_Wanka_2026#"` (con comillas dobles, que `phpdotenv` respeta como valor literal).

⚠️ **Pendiente de confirmar con el usuario**: la cuenta cambió a `eduwanka@gmail.com` pero `MAIL_HOST` sigue en `smtp.hostinger.com`. Si la intención es enviar correos desde Gmail, hay que:
1. Cambiar `MAIL_HOST=smtp.gmail.com`, `MAIL_PORT=587`, `MAIL_ENCRYPTION=tls` (o `465`/`ssl`).
2. Generar una **contraseña de aplicación** de Google (Cuenta → Seguridad → Verificación en 2 pasos → Contraseñas de aplicaciones) — Gmail rechaza la contraseña normal de la cuenta para SMTP si tiene 2FA activo, que es obligatorio desde 2025 para nuevas cuentas.
Si en cambio Hostinger reenvía/aliasa ese correo, no hace falta tocar nada más. Verificar enviando un correo de prueba (`php artisan tinker` → `Mail::raw(...)`).

---

## 1. Plan de corrección de hallazgos de seguridad (por fases)

### Fase 0 — Crítico, bloqueante para producción multi-tenant (esta semana)

#### 1.1 Cerrar el bypass de aislamiento entre tenants
- **Archivo:** `app/Http/Middleware/TenantMiddleware.php:16-19`
- **Acción:** después de resolver el tenant (por header, host o subdominio), si hay un usuario autenticado (`$request->user()`), comparar `$user->tenant_id` contra el `tenant_id` resuelto. Si no coinciden y el usuario no es `superadmin`, responder `403 Forbidden`.
- **Test a agregar:** extender `TenantIsolationTest.php` con un caso "usuario del Tenant A envía `X-Tenant-Slug` del Tenant B → 403", y otro donde `superadmin` sí puede cruzar tenants.
- **Esfuerzo estimado:** 0.5–1 día (cambio + tests).

#### 1.2 Eliminar la fuga del token de recuperación de contraseña
- **Archivos:** `app/Http/Controllers/Api/V1/Auth/ForgotPasswordController.php:38-49`, `frontend/src/pages/ForgotPassword.tsx:26-28,73-83`
- **Acción backend:** quitar el `Log::info` que imprime el token en texto plano; quitar por completo la rama que devuelve `'token' => $token` en la respuesta JSON (incluso en local — usar `php artisan tinker` o revisar `storage/logs/laravel.log` con el canal de mail si se necesita depurar, o configurar `MAIL_MAILER=log` en `.env` local).
- **Acción frontend:** eliminar el bloque "Simulación de Desarrollo Local" que renderiza el link con el token (`ForgotPassword.tsx:73-83`) y el `setLocalTokenInfo` asociado (líneas 26-28).
- **Test a agregar:** aserción explícita en `RegisterAndRecoveryTest.php` de que la respuesta JSON de `/auth/forgot-password` **nunca** contiene la clave `token`, en ningún entorno.
- **Esfuerzo estimado:** 0.5 día.

### Fase 1 — Alta prioridad (próximo sprint, antes del próximo release)

#### 1.3 Validar el monto de compra en servidor
- **Archivo:** `app/Http/Controllers/Api/V1/Purchases/RegisterPurchaseController.php:45,146,227,299`
- **Acción:** eliminar `amount` de las reglas de validación que aceptan el valor del cliente; calcularlo siempre desde `Course::findOrFail($courseId)->price` (aplicando descuentos/promos solo si existen como entidades server-side). Igual en `PaymentGatewayService::createPreference` — pasar el precio recalculado, no `$purchase->amount` tal cual si proviene del request.
- **Test a agregar:** caso en `RegisterPurchaseTest.php` que envíe `amount: 1` para un curso de S/ 500 y verifique que la compra se registra con el precio real del curso, no con el valor manipulado.
- **Esfuerzo estimado:** 1 día.

#### 1.4 Endurecer el webhook de MercadoPago
- **Archivos:** `app/Http/Controllers/Api/V1/Payments/MercadoPagoWebhookController.php:17-23`, `routes/api.php:117-118`
- **Acción:**
  1. Verificar la cabecera `x-signature`/`x-request-id` contra el secreto del webhook (`MERCADOPAGO_WEBHOOK_SECRET` nuevo en `.env`) según el [esquema HMAC documentado por MercadoPago].
  2. Agregar `->middleware('throttle:30,1')` a la ruta.
  3. Antes de marcar `paid`, comparar `payment['transaction_amount']` contra `purchase->amount` (con tolerancia de redondeo) y registrar/alertar si no coincide, sin marcar como pagado.
- **Test a agregar:** nuevo `MercadoPagoWebhookTest.php` con casos: firma inválida → 401/403; firma válida + monto coincide → `paid`; firma válida + monto no coincide → queda pendiente + log de alerta.
- **Esfuerzo estimado:** 1.5 días (incluye investigar el formato de firma de MercadoPago).

#### 1.5 Corregir IDOR en listados de evaluaciones
- **Archivos:** `AssignmentController.php:16-19`, `QuestionnaireController.php:17-21`, `SubstituteExamController.php:17-20`
- **Acción:** aplicar el mismo patrón de `AuthorizesModuleAccess` que ya usan los `show`: filtrar por curso autorizado según rol (admin/superadmin → todo el tenant; prof → solo `assigned_prof_id = auth()->id()`; estudiante → solo cursos con compra `validated`/`paid`), y en las respuestas para no-admin **excluir** `is_correct` de las opciones (usar un `Resource`/`toArray` condicional).
- **Test a agregar:** en cada controlador, caso "estudiante de Curso A no ve evaluaciones de Curso B" y "estudiante no recibe `is_correct` en el payload".
- **Esfuerzo estimado:** 1 día.

#### 1.6 Sanitizar HTML renderizado en el frontend
- **Archivos:** `StudentCourseDetail.tsx:97`, `StudentAssignment.tsx:113`, `HomeLegacy.tsx:960`
- **Acción:** `npm install dompurify @types/dompurify` en `frontend/`; envolver cada `dangerouslySetInnerHTML={{ __html: X }}` en `dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(X) }}`, idealmente centralizado en un helper `sanitizeHtml()` en `lib/`.
- **Esfuerzo estimado:** 0.5 día.

#### 1.7 Migrar tokens a cookies httpOnly (Sanctum SPA)
- **Archivos:** `frontend/src/lib/apiClient.ts`, `lib/auth.ts`, `Login.tsx`, `Register.tsx`, backend `config/sanctum.php`
- **Acción (cambio mayor — planificar como su propio mini-proyecto):**
  1. Backend: confirmar que el guard `web` + `EnsureFrontendRequestsAreStateful` están activos para las rutas SPA.
  2. Frontend: antes del login, llamar `GET /sanctum/csrf-cookie`; quitar el interceptor que adjunta `Authorization: Bearer`; dejar que la cookie de sesión viaje sola con `withCredentials: true` (ya activo).
  3. Quitar `eduwanka_access_token` de `localStorage`/`sessionStorage`; mantener solo datos no sensibles de UI (p. ej. nombre para mostrar) si se requiere, idealmente obtenidos vía `/auth/me` en cada carga.
- **Riesgo:** este cambio toca todo el flujo de auth — requiere pruebas manuales exhaustivas de los 4 roles antes de fusionar. Recomendado hacerlo en una rama dedicada con QA completo.
- **Esfuerzo estimado:** 3–4 días (incluye QA manual de los 4 roles).

### Fase 2 — Media prioridad (deuda técnica, próximos 1–2 sprints)

| # | Hallazgo | Acción resumida | Esfuerzo |
|---|---|---|---|
| 2.1 | Uniques globales en vez de compuestos por tenant (`email`, `slug`, `certificate_code`, `idempotency_key`) | Nueva migración: `dropUnique` + `unique(['tenant_id', 'columna'])`; requiere revisar datos existentes por colisiones antes de aplicar | 2 días |
| 2.2 | `nginx.conf.example`: puerto 445→443, falta HSTS y gzip | Editar el archivo de ejemplo; agregar `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;`, bloque `gzip on; gzip_types text/css application/javascript ...;` | 0.25 día |
| 2.3 | Cobertura de tests: webhook, emisión/revocación de certificados, `Unit/` vacío | Agregar `CertificateLifecycleTest.php` (emitir → verificar → revocar → restaurar) y al menos 2-3 unit tests reales (p.ej. `Purchase::canBeRevoked()`, helpers de `TenantManager`) | 2 días |
| 2.4 | Restos de scaffold "AI Studio"/Gemini (`vite.config.ts:19-21`, `frontend/.env.example`, `package.json`) | Quitar el bloque `define` de `GEMINI_API_KEY`; reescribir `.env.example` con `VITE_API_BASE_URL`/`VITE_DEV_PROXY`; renombrar `"name": "react-example"` → `"eduwanka-frontend"`; quitar `@google/genai`, `dotenv`, `express`, deduplicar `vite` | 0.5 día |
| 2.5 | Exposición pública de recibos/certificados sin auth vía `/storage/*`; nombre de archivo del cliente sin sanitizar | Servir `purchases/receipts/*` y `certificates/*` vía un endpoint autenticado con *signed URLs* (`URL::temporarySignedRoute`); en `AdminSpecialtyController::uploadBrochurePdf` generar nombre con `Str::uuid()` en vez de `getClientOriginalName()` | 1.5 días |
| 2.6 | `cascadeOnDelete` en `certificates.exam_attempt_id` y `audit_logs.tenant_id`; certificados sin `Auditable` | Nueva migración: cambiar a `nullOnDelete()`/`restrictOnDelete()`; añadir `use Auditable` a `Certificate`/`CertificateTemplate` | 1 día |

**Orden sugerido de ejecución:** Fase 0 → Fase 1 (1.3 y 1.4 en paralelo si hay dos desarrolladores, 1.7 al final por ser la de mayor riesgo/alcance) → Fase 2 según disponibilidad, priorizando 2.1 (impacta el diseño de nuevas tablas, incluido el Libro de Reclamaciones — ver §2 más abajo) y 2.5.

---

## 2. Diseño de base de datos: Libro de Reclamaciones

### 2.1 Marco legal y alcance

En Perú, el **Libro de Reclamaciones** es obligatorio (Código de Protección y Defensa del Consumidor, D.S. 011-2011-PCM) para todo proveedor de bienes/servicios — incluye instituciones educativas. Cada *tenant* (institución que usa EduWanka) es un proveedor independiente y **legalmente necesita su propio libro**, separado del de EduWanka como operador de la plataforma SaaS.

Por eso el requerimiento "cada aula individual y aula general" se traduce en dos ámbitos sobre **una misma tabla**, distinguidos por `tenant_id`:

- **Libro por tenant** (`tenant_id` = el de la institución): reclamos sobre los cursos/servicios de esa institución específica — lo que el usuario llama "cada aula individual".
- **Libro general de EduWanka** (`tenant_id = NULL`): reclamos sobre la plataforma SaaS en sí (fallas del sistema, soporte, facturación de la propia EduWanka) — "aula general". Se modela como `NULL` en vez de un tenant especial para que sea explícito y no contamine las estadísticas por institución.

Esto reutiliza la infraestructura multi-tenant ya existente (`BelongsToTenant`, `TenantScope`) sin crear un segundo sistema paralelo, y es coherente con cómo Indecopi exige que cada proveedor lleve un libro identificable y trazable.

### 2.2 Tabla `complaints` (migración propuesta)

```php
Schema::create('complaints', function (Blueprint $table) {
    $table->id();
    $table->string('code')->unique();          // Ej: "RCL-2026-000123" — folio público de seguimiento

    // Ámbito: NULL = libro general de EduWanka; valor = libro del tenant/institución
    $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
    // Curso/aula relacionada (opcional — permite ligar el reclamo a un curso puntual)
    $table->foreignId('course_id')->nullable()->constrained()->nullOnDelete();
    // Usuario autenticado que reclama, si aplica (permite reclamos de visitantes no registrados)
    $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

    // Tipo según Indecopi: 'reclamo' (disconformidad con el bien/servicio) | 'queja' (disconformidad con la atención)
    $table->enum('type', ['reclamo', 'queja']);

    // Datos del consumidor reclamante (independiente de si está registrado)
    $table->string('full_name');
    $table->string('document_type', 20)->default('DNI');   // DNI, CE, Pasaporte
    $table->string('document_number', 20);
    $table->string('email');
    $table->string('phone', 30)->nullable();
    $table->text('address')->nullable();

    // Datos del menor de edad y su apoderado, si el reclamante es menor (exigido por Indecopi)
    $table->boolean('is_minor')->default(false);
    $table->string('guardian_name')->nullable();
    $table->string('guardian_document_number', 20)->nullable();

    // Detalle del reclamo
    $table->string('claimed_item');              // Bien o servicio reclamado (ej: "Curso de Excel Avanzado")
    $table->decimal('claimed_amount', 10, 2)->nullable(); // Monto reclamado, si aplica
    $table->text('detail');                      // Descripción del reclamo/queja
    $table->text('consumer_request');            // Pedido concreto del consumidor

    // Seguimiento y resolución (gestionado por admin del tenant o de EduWanka según ámbito)
    $table->string('status', 20)->default('recibido'); // recibido | en_proceso | resuelto | cerrado
    $table->text('response')->nullable();
    $table->foreignId('responded_by_user_id')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamp('responded_at')->nullable();

    // Trazabilidad técnica (quién/cuándo envió el reclamo)
    $table->string('ip_address', 45)->nullable();
    $table->text('user_agent')->nullable();

    $table->timestamps();

    $table->index(['tenant_id', 'status']);
    $table->index(['tenant_id', 'created_at']);
    $table->index('document_number');
});
```

**Notas de diseño:**
- `code` es el folio público que se le entrega al consumidor para hacer seguimiento (formato sugerido `RCL-{año}-{secuencial por ámbito}`, generado en el `Observer`/`Service`, no en la migración).
- `tenant_id` nullable es la **excepción deliberada** a la regla "todo lleva tenant" que se acaba de imponer (hallazgo 2.1) — debe documentarse explícitamente en el modelo para que nadie la "corrija" por error en una futura limpieza. Por la misma razón, `Complaint` **no** debe usar el trait `BelongsToTenant` (que fuerza `tenant_id` no nulo); en su lugar se asigna el tenant explícitamente en el controlador según el contexto de origen de la solicitud (si viene de un subdominio de tenant → ese `tenant_id`; si viene del dominio raíz `eduwanka.pe` → `NULL`).
- `user_id` nullable porque el Libro de Reclamaciones es de acceso público — un visitante no registrado también puede reclamar.
- Sí debe usar el trait `Auditable` (sin `BelongsToTenant`) para dejar rastro de cambios de estado y respuestas — esto es justamente lo que un ente regulador pediría ver en una fiscalización.

### 2.3 Modelo `Complaint`

```php
class Complaint extends Model
{
    use HasFactory, Auditable; // NO BelongsToTenant — el ámbito es explícito, ver §2.2

    protected $fillable = [
        'tenant_id', 'course_id', 'user_id', 'type',
        'full_name', 'document_type', 'document_number', 'email', 'phone', 'address',
        'is_minor', 'guardian_name', 'guardian_document_number',
        'claimed_item', 'claimed_amount', 'detail', 'consumer_request',
        'status', 'response', 'responded_by_user_id', 'responded_at',
        'ip_address', 'user_agent',
    ];

    protected $casts = [
        'is_minor' => 'boolean',
        'claimed_amount' => 'decimal:2',
        'responded_at' => 'datetime',
    ];

    public function tenant(): BelongsTo { return $this->belongsTo(Tenant::class); }
    public function course(): BelongsTo { return $this->belongsTo(Course::class); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function respondedBy(): BelongsTo { return $this->belongsTo(User::class, 'responded_by_user_id'); }

    public function scopeGeneral($query) { return $query->whereNull('tenant_id'); }
    public function scopeForTenant($query, int $tenantId) { return $query->where('tenant_id', $tenantId); }
}
```

### 2.4 Endpoints API propuestos

```text
# Público (sin auth — el Libro de Reclamaciones es de acceso libre por ley)
POST   /api/v1/complaints                    # Crear reclamo/queja. El backend determina tenant_id
                                              #   por el dominio/subdominio de origen (Origin/Referer + TenantManager),
                                              #   nunca por un campo del body.
GET    /api/v1/complaints/track/{code}       # Consultar estado por folio (sin exponer datos de otros reclamantes)

# Administración (requiere auth + rol admin/superadmin, scopeado por tenant vía middleware existente)
GET    /api/v1/aula/admin/complaints         # Listado del libro del tenant actual (admin de institución)
GET    /api/v1/aula/admin/complaints/{id}
PATCH  /api/v1/aula/admin/complaints/{id}    # Cambiar status / registrar respuesta

# Superadmin — libro general de EduWanka (tenant_id = NULL) + vista consolidada de todos los tenants
GET    /api/v1/aula/superadmin/complaints?scope=general
GET    /api/v1/aula/superadmin/complaints?scope=all
```

`throttle:10,1` en el endpoint público de creación para prevenir spam, similar al patrón ya usado en checkout/verificación de certificados.

### 2.5 Plan de implementación (conecta con el hallazgo 1.10 de la auditoría)

La auditoría encontró que el "Libro de Reclamaciones" actual (`ComplaintsBook.tsx`, `AdminComplaints.tsx`) es **enteramente un mock en `localStorage`** que nunca llega al backend — un problema potencialmente legal, no solo técnico. Pasos para reemplazarlo:

1. **Backend** (2 días): migración + modelo + `ComplaintController` (público) + `AdminComplaintController`/`SuperadminComplaintController` + `FormRequest` de validación + tests (`ComplaintBookTest.php`: creación pública, scoping por tenant, folio único, transición de estados, que un admin de Tenant A no vea reclamos de Tenant B).
2. **Frontend — formulario público** (1 día): reemplazar el `localStorage.setItem('eduwanka_complaints', ...)` en `ComplaintsBook.tsx` por `apiClient.post('/complaints', ...)`; mostrar el folio (`code`) devuelto para que el usuario pueda hacer seguimiento.
3. **Frontend — panel admin** (1.5 días): reemplazar `MOCK_COMPLAINTS` en `AdminComplaints.tsx` por `useQuery`/`apiClient.get('/aula/admin/complaints')`, con UI para responder y cambiar estado.
4. **Frontend — panel superadmin** (0.5 día): nueva vista en `SuperadminUsers`/dashboard para el libro general (`tenant_id = NULL`) y, opcionalmente, una vista consolidada de todos los tenants (solo lectura, para soporte).
5. **Migración de datos existentes**: si hay reclamos reales atrapados en `localStorage` de usuarios actuales, no son recuperables desde el servidor (nunca llegaron) — comunicar esto y, si es crítico, ofrecer un mecanismo temporal de "reenvío" la primera vez que el usuario abra la página tras el despliegue.

**Esfuerzo total estimado:** ~6 días de desarrollo + 1 día de QA legal/funcional (validar que el flujo cumple lo exigido por Indecopi: folio de seguimiento, plazos de respuesta visibles, datos mínimos del formulario).

---

## 3. Mejoras al README

Aplicadas directamente en este mismo cambio (ver `README.md`):

- Se corrigió la sección **Estructura** y **Documentación**: el README mencionaba carpetas que no existen en el repo (`Pruebas/`, `Documentacion/00_.../06_Auditorias_y_Cierre/`, `RUNBOOK.md`) — se reemplazó por la estructura real y plana de `Documentacion/` (5 archivos, incluida la nueva auditoría).
- Se agregó el **Libro de Reclamaciones** y la **pasarela de pagos MercadoPago** a la lista de módulos funcionales (no estaban documentados pese a tener controladores y rutas).
- Se agregó una sección de **Auditoría y seguridad** que enlaza al informe de auditoría y a este plan, para que cualquier colaborador nuevo entienda el estado real de la seguridad del proyecto antes de tocar código sensible.
- Se actualizó "Últimos cambios consolidados" con el trabajo reciente (multi-tenancy, registro/recuperación de contraseña, auditoría/`audit_logs`).
