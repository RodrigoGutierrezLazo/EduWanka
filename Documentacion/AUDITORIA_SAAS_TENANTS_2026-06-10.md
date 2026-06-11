# Auditoría SaaS — Experiencia de inquilinos (tenants) — 2026-06-10

Auditoría enfocada en los procesos del modelo SaaS multi-tenant y en la experiencia
de las instituciones que "alquilan" su aula virtual. Cada hallazgo fue verificado
directamente en el código fuente (se indica archivo y línea).

---

## 1. Hallazgos críticos

### 1.1 No existe onboarding self-service de instituciones (GAP producto vs. marketing)

**Evidencia:**
- La landing (`frontend/src/pages/Home.tsx`) promete "Crea tu Aula Virtual en minutos",
  "Empieza Gratis" y "Regístrate Gratis... en menos de 30 segundos", pero **todos los CTAs
  apuntan a `/login`**.
- La única forma de crear un tenant es manual, por el superadmin, vía
  `POST /superadmin/tenants` (`TenantManagementController::store`).
- `RegisterController` solo registra **estudiantes** dentro del tenant actual.

**Impacto:** la promesa central del SaaS no es ejecutable por el cliente. Una institución
interesada no puede crear su aula, ni probar 30 días gratis, ni configurar nada sin
intervención manual del operador de la plataforma.

### 1.2 No existe sistema de suscripciones, trial ni enforcement de límites de plan

**Evidencia:**
- `Tenant.plan` es un string suelto (`backend/app/Models/Tenant.php:17`). No hay tabla
  `subscriptions`, ni `trial_ends_at`, ni `current_period_end`, ni facturación.
- La landing vende límites por plan (Starter: 1 curso / 30 estudiantes; Profesional:
  300 alumnos por curso) pero **ningún controlador valida esos límites**: un tenant
  Starter puede crear cursos y matricular estudiantes sin tope.
- El "Probar 30 Días Gratis" no tiene contraparte en backend: nada expira, nada avisa,
  nada suspende.

**Impacto:** no hay modelo de ingresos operable: no se puede cobrar, ni hacer upgrade,
ni vencer trials. Los planes son decorativos.

### 1.3 Fallback de tenant al "primer activo de la BD" (`TenantMiddleware.php:60-69`)

**Evidencia:** si no se puede deducir el slug (acceso por IP, dominio mal configurado,
host desconocido), el middleware toma `Tenant::where('status','active')->first()` como
tenant por defecto.

**Impacto:** un visitante que llega por un host no reconocido ve el branding, catálogo
de cursos y landing de un **tenant arbitrario** (el de menor id). Es no determinista
ante cambios de datos y filtra contenido de un cliente en contextos que no le
corresponden. Lo correcto: responder 404/página neutral de plataforma, o resolver a un
"tenant plataforma" explícito configurable.

### 1.4 El dominio propio (`tenants.domain`) no se usa para resolver el tenant

**Evidencia:** `TenantMiddleware` resuelve únicamente por slug de subdominio o header
`X-Tenant-Slug`. **Nunca consulta la columna `domain`**, aunque el modelo y el
controlador de superadmin la administran, y el plan Enterprise vende "Dominio propio".

**Impacto:** la funcionalidad "dominio propio" vendida en pricing no funciona. Además no
hay flujo de verificación DNS ni emisión de certificados para dominios custom.

---

## 2. Hallazgos altos

### 2.1 Suspensión de tenant es un 403 JSON crudo (`TenantMiddleware.php:81-85`)

Cuando el superadmin suspende un aula, **todas** las requests (incluidas las de
estudiantes que ya pagaron) reciben `{"error": "This institution has been suspended."}`.
No hay: página amigable de "aula en mantenimiento/suspendida", aviso previo al admin,
periodo de gracia, ni modo solo-lectura. Para el negocio del inquilino esto es un
apagón total sin comunicación.

### 2.2 Eliminación de tenant es hard delete sin salvaguardas (`TenantManagementController::destroy`)

`$tenant->delete()` directo: sin soft-delete, sin confirmación de dos pasos, sin export
previo de datos, sin política definida sobre los usuarios/cursos/certificados/compras
del tenant (según FKs puede fallar o dejar huérfanos). Para un SaaS, el offboarding debe
ser: desactivar → exportar → retener N días → purgar.

### 2.3 `/api/v1/tenants/public` expone slugs, plan y estado de todos los clientes (`routes/api.php:55-63`)

Útil para la sección "Aulas activas" de la landing, pero publica información comercial
(qué plan paga cada institución) y facilita enumeración de subdominios. Debería exponer
solo nombre + logo + slug de tenants que hayan **optado** por aparecer.

### 2.4 Sin panel de suscripción/uso para el admin del aula

El admin de un tenant no tiene ninguna vista de: plan contratado, consumo vs. límites
("23/30 estudiantes"), fecha de renovación, historial de pagos a la plataforma, ni botón
de upgrade. Toda la relación comercial es opaca y manual.

---

## 3. Hallazgos medios / menores

| # | Hallazgo | Evidencia |
|---|----------|-----------|
| 3.1 | `store()` de tenants responde **HTTP 210** (código inexistente; debe ser 201) | `TenantManagementController.php:38` |
| 3.2 | Crear tenant no crea su usuario admin: el aula nace vacía y sin dueño; el alta del admin es otro paso manual | `TenantManagementController::store` |
| 3.3 | Logos de tenant se guardan sin aislamiento por tenant (`tenants/logos/`) pese a existir `TenantStorageService` | `TenantManagementController::uploadLogo` |
| 3.4 | Branding por tenant limitado a 2 colores + logo; no hay favicon, email branding, ni plantillas de correo con la marca del aula | `Tenant.php`, ruta `/tenant/current` |
| 3.5 | No hay impersonation ("entrar como admin del tenant") para soporte del superadmin | rutas superadmin en `routes/api.php` |
| 3.6 | `toggleStatus` no registra motivo ni notifica al tenant | `TenantManagementController::toggleStatus` |

**Aspectos sólidos verificados (no requieren acción):** aislamiento de datos vía
`TenantScope` global + trait `BelongsToTenant`; `EnsureTenantMatchesAuthenticatedUser`
bloquea cross-tenant de usuarios autenticados (con bypass correcto para superadmin);
resolución de subdominio robusta para sufijos de 2 niveles (`.net.pe`); uniques
compuestos por tenant en BD; settings y certificados scoped por tenant.

---

## 4. Hoja de ruta recomendada (prioridad para "aula SaaS perfecto")

### Fase 1 — Hacer real la promesa de la landing (onboarding self-service)
1. **Registro público de institución**: formulario (nombre, slug con validación en vivo
   de disponibilidad, email, password) → crea `tenant` + usuario `admin` + trial 30 días
   en una transacción; login automático y redirección al wizard.
2. **Wizard de configuración inicial** (4 pasos): identidad de marca (logo/colores) →
   métodos de pago (Yape/Plin/transferencia/MercadoPago) → primer curso (con plantilla
   de ejemplo) → invitar docentes. Checklist persistente de progreso en el dashboard
   del admin hasta completar el setup.
3. **Seed de datos demo opcional** para que el aula no nazca vacía.

### Fase 2 — Suscripciones y límites
4. Tabla `subscriptions` (`tenant_id, plan, status, trial_ends_at, current_period_end`)
   + comando programado que expira trials y dispara recordatorios (7/3/1 días).
5. Middleware/Policy de **enforcement de límites por plan** en creación de cursos y
   matrículas, con respuesta 402/upgrade-prompt en el frontend, nunca un error críptico.
6. **Página "Mi suscripción"** para el admin del aula: plan, uso vs. límites, renovación,
   upgrade in-app (MercadoPago suscripciones ya hay webhook base).
7. **Dunning suave**: impago → aviso → modo solo-lectura (estudiantes conservan acceso
   a lo comprado) → suspensión. Nunca apagón inmediato.

### Fase 3 — Robustez multi-tenant
8. Eliminar el fallback al "primer tenant activo": host no reconocido → landing de la
   plataforma o 404 amigable.
9. Resolver tenants también por columna `domain` + flujo de verificación DNS (TXT) para
   dominio propio (cumplir lo vendido en Enterprise).
10. Página pública amigable para aula suspendida/inexistente (en vez de JSON 403/404).
11. Soft-deletes en `tenants` + offboarding con export de datos (PhpSpreadsheet ya está
    en el stack) y purga diferida.
12. Corregir HTTP 210 → 201 en `TenantManagementController::store`.

### Fase 4 — Experiencia diaria del dueño del aula
13. Emails transaccionales con la marca del tenant (logo, colores, remitente con nombre
    del aula).
14. Impersonation auditada para soporte (superadmin "entra como" admin del tenant, con
    registro en `audit_logs`).
15. Exportes self-service (alumnos, ventas, certificados en XLSX/CSV).
16. Métricas SaaS para superadmin: MRR, churn, tenants en trial, salud por tenant.
17. `/tenants/public` solo con tenants que opten por aparecer y sin exponer `plan`.

---

*Auditoría realizada el 2026-06-10. Complementa `AUDITORIA_COMPLETA_SISTEMA_2026-06.md`
y `RE_AUDITORIA_SISTEMA_2026-06-07.md`, que cubrieron seguridad general; esta se centra
en el modelo de negocio SaaS y la experiencia del inquilino.*
