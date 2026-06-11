# Procesos SaaS del Aula Virtual — 2026-06-10

Este documento describe los **nuevos procesos implementados** que convierten a
EduWanka en un SaaS alquilable de aulas virtuales, cerrando los hallazgos de la
`AUDITORIA_SAAS_TENANTS_2026-06-10.md`. Cada proceso indica los archivos que lo
implementan.

---

## 1. Alta self-service de instituciones (onboarding)

**Antes:** las aulas solo las creaba el superadmin a mano; la landing prometía
"crea tu aula en minutos" sin que existiera el flujo.

**Ahora:**

```
Visitante → /crear-aula (landing)
   → completa: institución, subdominio (verificación en vivo), datos del admin
   → POST /api/v1/tenants/register
       · crea Tenant (plan starter, status active, trial_ends_at = +30 días)
       · crea User admin vinculado al tenant (en una transacción)
   → pantalla de éxito con la URL del aula (slug.eduwanka.net.pe)
   → login con las credenciales registradas
```

| Pieza | Archivo |
|---|---|
| Endpoint de registro | `backend/app/Http/Controllers/Api/V1/Tenants/TenantRegistrationController.php` |
| Verificación de subdominio | `GET /api/v1/tenants/check-slug?slug=...` (mismo controlador) |
| Página pública | `frontend/src/pages/CrearAula.tsx` (ruta `/crear-aula`) |
| Migración trial | `backend/database/migrations/2026_06_10_000000_add_trial_and_soft_deletes_to_tenants_table.php` |

Reglas del slug: 3-30 caracteres `[a-z0-9-]`, único (incluye tenants
soft-deleted) y fuera de la lista de reservados (`www`, `api`, `admin`,
`superadmin`, etc.). Throttle: 5 req/min en producción.

## 2. Planes, trial y límites (enforcement real)

**Antes:** `tenants.plan` era decorativo; un tenant starter podía crear cursos
y alumnos sin tope y el "30 días gratis" no existía en backend.

**Ahora** (`backend/app/Services/PlanLimits.php`):

| Plan | Cursos | Estudiantes |
|---|---|---|
| `starter` (trial 30 días) | 1 | 30 |
| `professional` / `pro` | ilimitados | ilimitados |
| `enterprise` | ilimitados | ilimitados |

Puntos de enforcement (responden **HTTP 402** con `code: plan_limit_reached`
y mensaje en español):

- Crear curso (`AdminCoursesController::store`): bloquea si se alcanzó el
  límite de cursos **o si el trial venció**.
- Registro público de estudiante (`Auth\RegisterController`): bloquea si el
  aula alcanzó su límite de estudiantes o su trial venció.
- Alta de estudiante por admin (`AdminUsersController::store`): ídem.

Semántica del trial: `trial_ends_at = NULL` → cuenta sin trial (tenants legacy
o pagados, nada cambia para ellos). El trial vencido **no apaga el aula**: los
estudiantes existentes siguen accediendo a lo comprado; solo se bloquean
nuevas altas y nuevos cursos (dunning suave).

## 3. Visibilidad de la suscripción para el dueño del aula

`GET /api/v1/admin/subscription` (rol admin/superadmin) devuelve:

```json
{
  "data": {
    "plan": "starter",
    "on_trial": true,
    "trial_ends_at": "2026-07-10T...",
    "trial_days_left": 30,
    "limits": { "courses": 1, "students": 30 },
    "usage":  { "courses": 1, "students": 12 }
  }
}
```

Implementación: `backend/app/Http/Controllers/Api/V1/Admin/AdminSubscriptionController.php`.
Pensado para alimentar una tarjeta "Mi suscripción" en el dashboard admin
(consumo vs. límites + CTA de upgrade).

## 4. Resolución de tenants robusta

`backend/app/Http/Middleware/TenantMiddleware.php`, en orden:

1. **Dominio propio** (nuevo): si el host coincide con `tenants.domain`, ese
   tenant gana. Hace funcional el "dominio propio" del plan Enterprise.
2. Header `X-Tenant-Slug` (SPA en localhost).
3. Subdominio de `TENANT_BASE_DOMAIN` (maneja sufijos de 2 niveles `.net.pe`).
4. **Fallback determinista** (corregido): primero `DEFAULT_TENANT_SLUG` (.env),
   y en su defecto el tenant activo de **menor id** (antes era "el primero que
   devolviera la BD", no determinista y filtraba datos de un cliente arbitrario).

Variables de entorno relevantes:

```env
TENANT_BASE_DOMAIN=eduwanka.net.pe
DEFAULT_TENANT_SLUG=demo
```

## 5. Offboarding seguro de tenants

- `DELETE /superadmin/tenants/{tenant}` ahora hace **soft delete**
  (`tenants.deleted_at`): cursos, certificados y compras se conservan para
  export/restauración. La purga definitiva es una decisión aparte.
- El alta por superadmin responde `201` (antes devolvía el código inválido `210`).

## 6. Privacidad comercial en la landing

`GET /api/v1/tenants/public` ya **no expone `plan` ni `status`** de los
clientes (solo nombre, slug y logo). La sección "Aulas activas" de la landing
fue ajustada en consecuencia.

## 7. Landing renovada (marketing = producto)

- **Hero 3D interactivo**: el dashboard simulado se inclina siguiendo el mouse
  (perspectiva + profundidad real con `translateZ`, brillo especular), con
  contadores animados, barras que crecen y tarjetas flotantes
  (`frontend/src/components/Tilt3D.tsx`).
- **Demo animada "Mira cómo nace un aula"** (`frontend/src/components/DemoShowcase.tsx`):
  walkthrough auto-reproducible de 5 escenas (Regístrate → Tu marca → Crea tu
  curso → Publica y vende → Certifica) con controles de reproducción, barra de
  progreso y navegación por pasos. El botón "Ver Demo" del hero salta a `#demo`.
- Sección "Implementación" de `/cursos` con el mismo efecto 3D y animaciones
  por módulo.
- **Todos los CTAs** ("Empieza Gratis", "Crear Mi Aula Ahora", planes) apuntan
  ahora a `/crear-aula` (antes iban a `/login`, un callejón sin salida para
  un visitante sin cuenta). Enterprise apunta a `/contacto`.

## 8. Pruebas realizadas (2026-06-10)

- `php artisan test`: **119 pruebas / 352 aserciones, todas en verde** tras los
  cambios de backend.
- E2E manual del registro: `check-slug` (disponible → ocupado) y
  `POST /tenants/register` crean tenant + admin + trial correctamente
  (verificado contra la BD local y limpiado después).
- `npm run build`: build de producción OK (output en `backend/public/spa/`).
- Verificación en navegador: landing con demo y hero 3D, `/crear-aula` y
  `/cursos` renderizan sin errores de consola.

## 9. Pendientes recomendados (siguiente iteración)

1. Cobro recurrente del plan (suscripciones MercadoPago) + página de upgrade.
2. Comando programado de recordatorios de trial (7/3/1 días) por email.
3. Página amigable de "aula suspendida" (hoy el API responde 403 JSON).
4. Wizard post-registro (marca → métodos de pago → primer curso) con checklist.
5. Verificación DNS self-service para dominios propios.
6. Tests automatizados del nuevo flujo de registro y límites de plan.
