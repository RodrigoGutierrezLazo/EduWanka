# Plan de Dockerización y Pruebas E2E con Cypress

**Fecha:** 2026-06-08
**Estado actual del proyecto:** EduWanka corre en local sobre XAMPP (MySQL + PHP/Apache) para el backend y el servidor de desarrollo de Vite para el frontend, orquestados con `iniciar-eduwanka.bat`. Las pruebas automatizadas actuales son backend-only con PHPUnit (`php artisan test`, 23 archivos) y verificación de tipos en frontend (`npm run lint` → `tsc --noEmit`). No existen `Dockerfile`, `docker-compose.yml` ni pruebas E2E de navegador.
**Objetivo:** Plan accionable, en fases, para (1) contenerizar EduWanka con Docker/Docker Compose sin romper el flujo local actual, y (2) incorporar una suite de pruebas E2E con Cypress que cubra los flujos críticos de negocio desde la perspectiva del usuario, complementando — no reemplazando — la batería de PHPUnit.

---

## 0. Principios que guían el plan

1. **No romper lo que funciona.** XAMPP + `iniciar-eduwanka.bat` deben seguir siendo una opción válida para desarrollo local; Docker se añade como alternativa, no como reemplazo obligatorio.
2. **Paridad de configuración.** Las variables de entorno, puertos (`8000` backend, `3000` frontend) y el contrato de la API (`/api/v1`, `openapi.yaml`) deben ser idénticos dentro y fuera de los contenedores, para que `apiClient` y los tests no necesiten ramas de código por entorno.
3. **Incremental y verificable.** Cada fase debe terminar en un estado funcional y probado (`docker compose up` levanta el sistema; `npx cypress run` pasa en verde) antes de pasar a la siguiente.
4. **Reutilizar lo existente.** Cypress debe apoyarse en los mismos seeders/factories y credenciales demo (`student@eduwanka.local`, etc.) que ya usa PHPUnit, y Docker debe replicar exactamente los pasos del README (`composer install`, `migrate --seed`, `npm run build`).

---

## 1. Plan de Dockerización (por fases)

### Fase D0 — Preparación y auditoría del entorno (0.5 día)

- **Objetivo:** dejar el repositorio listo para contenerizar sin sorpresas.
- **Acciones:**
  1. Revisar `backend/.env.example` y `frontend/.env.example` (o crearlos si faltan) y asegurarse de que **todas** las variables que hoy se configuran "a mano" en XAMPP (host/usuario/clave de MySQL, `APP_URL`, `MERCADOPAGO_*`, `MAIL_*`) estén documentadas allí — serán la base de los `environment:` de `docker-compose.yml`.
  2. Confirmar la versión exacta de PHP (8.2), extensiones requeridas por `composer.json` (`pdo_mysql`, `mbstring`, `gd`, `zip`, `bcmath`, `intl` si aplica) y la versión de Node (20+) usada por `frontend/package.json`.
  3. Añadir `.dockerignore` en `backend/` (excluir `vendor/`, `node_modules/`, `storage/logs/*`, `.env`) y en `frontend/` (excluir `node_modules/`, `dist/`).
- **Entregable:** `.env.example` actualizado en ambos proyectos + `.dockerignore` en ambos.

### Fase D1 — Dockerfile del backend (Laravel) (1 día)

- **Archivo a crear:** `backend/Dockerfile`
- **Acciones:**
  1. Imagen base `php:8.2-fpm` (o `php:8.2-cli` si se prefiere `artisan serve` dentro del contenedor para mantener paridad exacta con el flujo actual).
  2. Instalar extensiones del sistema y de PHP necesarias (`docker-php-ext-install pdo_mysql mbstring gd zip bcmath`).
  3. Instalar Composer (`COPY --from=composer:2 /usr/bin/composer /usr/bin/composer`).
  4. Copiar el código, ejecutar `composer install --no-dev --optimize-autoloader`.
  5. Definir un **entrypoint** (`docker/entrypoint.sh`) que, al iniciar el contenedor:
     - espere a que MySQL esté disponible (`wait-for-it.sh` o un loop simple con `mysqladmin ping`),
     - ejecute `php artisan migrate --seed --force` (idempotente gracias a los seeders existentes),
     - genere `APP_KEY` si no existe (`php artisan key:generate --force`),
     - finalmente lance `php artisan serve --host=0.0.0.0 --port=8000`.
  6. Exponer el puerto `8000`.
- **Entregable:** `backend/Dockerfile`, `backend/docker/entrypoint.sh`, build verificado con `docker build -t eduwanka-backend ./backend`.

### Fase D2 — Dockerfile del frontend (React/Vite) (1 día)

- **Archivo a crear:** `frontend/Dockerfile` (multi-stage)
- **Acciones:**
  1. **Etapa `build`:** imagen `node:20-alpine`, `npm ci`, `npm run build` → genera `dist/`.
  2. **Etapa `serve`:** imagen ligera (`nginx:alpine` o `node:20-alpine` con `vite preview`/`serve`), copiar `dist/` desde la etapa `build` y servirlo en el puerto `3000`.
  3. Configurar la URL de la API mediante variable de entorno de build (`VITE_API_URL=http://localhost:8000/api/v1` por defecto, sobreescribible), sin romper el `apiClient` actual que apunta a `http://localhost:8000/api/v1`.
  4. Alternativa recomendada para mantener el flujo descrito en el README ("copiar `dist/` a `backend/public/spa/`"): un segundo *target* de build que en vez de servir con Nginx, copia `dist/` a un volumen compartido que el contenedor del backend monta en `public/spa/`. Documentar ambas opciones y elegir una como predeterminada (se sugiere Nginx por simplicidad de orquestación).
- **Entregable:** `frontend/Dockerfile`, build verificado con `docker build -t eduwanka-frontend ./frontend`.

### Fase D3 — Orquestación con Docker Compose (1 día)

- **Archivo a crear:** `docker-compose.yml` (raíz del repo)
- **Servicios:**

  | Servicio | Imagen / build | Puerto | Depende de | Notas |
  |---|---|---|---|---|
  | `db` | `mysql:8.0` | `3306` (interno) | — | Volumen persistente `db_data:/var/lib/mysql`; variables `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD` sincronizadas con `backend/.env` |
  | `backend` | `./backend/Dockerfile` | `8000:8000` | `db` (con `condition: service_healthy`) | Monta `./backend:/var/www/html` en desarrollo (hot-reload de PHP); usa `env_file: backend/.env` |
  | `frontend` | `./frontend/Dockerfile` | `3000:80` (Nginx) o `3000:3000` (Vite) | `backend` | Variable `VITE_API_URL` apuntando al backend |
  | `phpmyadmin` *(opcional, solo en `docker-compose.override.yml` de desarrollo)* | `phpmyadmin:5` | `8081:80` | `db` | Equivalente al phpMyAdmin de XAMPP, útil para depuración |

- **Acciones:**
  1. Definir `healthcheck` en `db` (`mysqladmin ping`) para que `backend` espere a que la base de datos esté realmente lista (evita condiciones de carrera con `migrate`).
  2. Definir una red interna (`eduwanka-net`) para que los servicios se resuelvan por nombre (`db`, `backend`).
  3. Crear `docker-compose.override.yml` para desarrollo (monta volúmenes de código para hot-reload, expone `phpmyadmin`) y mantener `docker-compose.yml` limpio para un perfil más cercano a producción.
  4. Probar el flujo completo: `docker compose up --build` → backend migra y siembra → frontend compila y sirve → `GET http://localhost:8000/api/v1/health` responde `200` → `http://localhost:3000` carga la SPA y se conecta al backend.
- **Entregable:** `docker-compose.yml`, `docker-compose.override.yml`, smoke test manual documentado (los mismos pasos de verificación que ya usa el capítulo 14 del informe: health check, login demo, catálogo, verificación de certificado).

### Fase D4 — Documentación, scripts y CI (0.5–1 día)

- **Acciones:**
  1. Añadir una sección "Levantar con Docker" al `README.md`, en paralelo a la sección "Inicio Rápido Local" existente (no reemplazarla):
     ```bash
     docker compose up --build
     # Backend:  http://localhost:8000/api/v1
     # Frontend: http://localhost:3000
     ```
  2. Crear `Makefile` o script `docker-eduwanka.sh`/`.bat` con atajos (`make up`, `make down`, `make test`, `make logs`) análogos a `iniciar-eduwanka.bat`.
  3. *(Opcional, recomendado a futuro)* Workflow de GitHub Actions (`.github/workflows/ci.yml`) que construya las imágenes y ejecute `php artisan test` dentro del contenedor `backend` en cada *push*/PR — primer paso hacia integración continua real.
- **Entregable:** README actualizado, script de conveniencia, workflow de CI (al menos como borrador).

**Esfuerzo total estimado — Dockerización: ~4–5 días** (D0: 0.5, D1: 1, D2: 1, D3: 1, D4: 0.5–1).
**Orden sugerido:** D0 → D1 y D2 en paralelo (si hay dos personas) → D3 → D4.

---

## 2. Plan de Pruebas E2E con Cypress (por fases)

### Fase C0 — Instalación y configuración base (0.5 día)

- **Acciones:**
  1. `cd frontend && npm install -D cypress @testing-library/cypress` (instalar como dependencia de desarrollo del frontend, ya que Cypress prueba la SPA contra el backend real).
  2. Crear `frontend/cypress.config.ts`:
     ```ts
     import { defineConfig } from "cypress";

     export default defineConfig({
       e2e: {
         baseUrl: "http://localhost:3000",
         supportFile: "cypress/support/e2e.ts",
         specPattern: "cypress/e2e/**/*.cy.ts",
         env: {
           apiUrl: "http://localhost:8000/api/v1",
         },
       },
     });
     ```
  3. Estructura de carpetas:
     ```
     frontend/cypress/
     ├── e2e/
     │   ├── auth/
     │   ├── catalog/
     │   ├── checkout/
     │   ├── aula-student/
     │   ├── aula-professor/
     │   ├── aula-admin/
     │   ├── certificates/
     │   └── complaints/
     ├── fixtures/         # datos de prueba (cursos demo, usuarios demo)
     ├── support/
     │   ├── commands.ts   # comandos personalizados (cy.loginAs, cy.seedDb...)
     │   └── e2e.ts
     └── downloads/
     ```
  4. Añadir scripts a `frontend/package.json`:
     ```json
     "cypress:open": "cypress open",
     "cypress:run": "cypress run",
     "test:e2e": "start-server-and-test dev http://localhost:3000 cypress:run"
     ```
     (`start-server-and-test` evita tener que levantar el frontend manualmente antes de correr la suite).
- **Entregable:** Cypress instalado y ejecutándose con un *spec* de humo (`smoke.cy.ts` que visita `/` y verifica que carga el landing).

### Fase C1 — Comandos personalizados y *fixtures* reutilizables (0.5–1 día)

- **Acciones:**
  1. `cy.loginAs(role)`: comando que hace login por API (`cy.request('POST', `${apiUrl}/auth/login`, {...})`) usando las **credenciales demo ya existentes** (`student@eduwanka.local` / `Password123!`, `prof@...`, `admin@...`, `superadmin@...`) y preserva la cookie de sesión de Sanctum, evitando repetir el flujo de UI de login en cada test.
  2. `cy.seedDb()` / `cy.resetDb()`: comando que invoca (vía `cy.exec` o un endpoint de prueba protegido por `APP_ENV=testing`) `php artisan migrate:fresh --seed` en el backend antes de las suites que necesitan estado limpio — análogo a lo que hace `RefreshDatabase` en PHPUnit, pero a nivel E2E.
  3. *Fixtures*: `cypress/fixtures/users.json`, `cypress/fixtures/courses.json` con los datos demo documentados en el README, para no hardcodear credenciales en cada *spec*.
  4. Definir *data-testid* o *aria-labels* consistentes en los componentes críticos del frontend (botones de checkout, tarjetas de curso, formularios) para que los selectores de Cypress no dependan de clases de Tailwind que cambian con el diseño.
- **Entregable:** `commands.ts` con `loginAs`, `seedDb`, `byTestId`; *fixtures* base.

### Fase C2 — Flujos del visitante y catálogo (0.5 día)

- **Specs:** `cypress/e2e/catalog/`
- **Casos a cubrir:**
  1. La landing carga, muestra estadísticas, especialidades y el carrusel de cursos.
  2. El catálogo (`/cursos`) permite buscar y filtrar por categoría/instructor/precio, y navegar al detalle de un curso.
  3. El formulario de verificación pública de certificados (`/verificar-certificado`) acepta código + DNI y muestra el resultado (válido / revocado / no encontrado) — usando un certificado *seedeado* de prueba.
  4. El formulario de contacto valida campos obligatorios y el checkbox de políticas de privacidad.
- **Esfuerzo:** 0.5 día.

### Fase C3 — Autenticación y registro (0.5–1 día)

- **Specs:** `cypress/e2e/auth/`
- **Casos a cubrir:**
  1. Registro (`/registro`): completa el formulario, llama a `/api/v1/auth/register`, redirige automáticamente a `/aula`.
  2. Login con cada uno de los 4 roles demo y verificación de que cada uno aterriza en su dashboard correspondiente (`/aula/student`, `/aula/professor`, `/aula/admin`, `/aula/superadmin`).
  3. Recuperación de contraseña: solicitud (`/forgot-password`) y restablecimiento (`/reset-password`) con un token generado vía `cy.request` directo a la API (sin depender de correo real).
  4. Casos negativos: credenciales inválidas, *throttling* de intentos (verificar que tras varios intentos fallidos se bloquea temporalmente, reflejando `AuthSecurityTest` del backend pero desde la UI).
- **Esfuerzo:** 0.5–1 día.

### Fase C4 — Checkout y matrícula (flujo crítico de negocio) (1 día)

- **Specs:** `cypress/e2e/checkout/`
- **Casos a cubrir:**
  1. **Pago manual (comprobante):** estudiante selecciona un curso → checkout → sube un comprobante de prueba (`cypress/fixtures/comprobante.png`) → la compra queda `pending_validation` → un administrador (sesión paralela vía `cy.loginAs('admin')`) la valida desde la bandeja de pagos → la compra pasa a `validated`/`paid` → el estudiante ve el curso habilitado en "Mis Cursos".
  2. **Pago en línea (Mercado Pago):** dado que el *checkout* real redirige a una pasarela externa, este caso se cubre con un **doble**: se intercepta la llamada a `/checkout/register-purchase` (`cy.intercept`) y se simula el retorno (`?status=success|failure|pending`) para verificar que la SPA reacciona correctamente a cada estado, dejando la integración real cubierta por `MercadoPagoWebhookTest` en PHPUnit.
  3. Caso negativo: intentar acceder a un curso sin haberlo comprado → la UI debe redirigir o mostrar un estado de "curso no disponible".
- **Esfuerzo:** 1 día (es el flujo más complejo por involucrar dos roles y un servicio externo simulado).

### Fase C5 — Aula Virtual: estudiante, profesor y administrador (1.5–2 días)

- **Specs:** `cypress/e2e/aula-student/`, `aula-professor/`, `aula-admin/`
- **Casos a cubrir (estudiante):**
  - Navegar módulos/secciones/contenidos de un curso comprado (videos, documentos, enlaces) y que el progreso se registre (`content_progress`).
  - Rendir un cuestionario y un examen sustitutorio; enviar una tarea; verificar que las calificaciones aparecen en "Mis Notas".
  - Consultar su historial de asistencia y de pagos, y descargar un certificado emitido.
- **Casos a cubrir (profesor):**
  - Ver sus cursos asignados y su lista de estudiantes.
  - Crear/editar materiales y un cuestionario; registrar asistencia de una sesión; calificar una entrega.
- **Casos a cubrir (administrador):**
  - CRUD de cursos, docentes y usuarios.
  - Bandeja de validación de pagos (aprobar/rechazar un comprobante) e historial de pagos.
  - Gestor de certificados: emitir, revocar y restaurar un certificado, y verificar que el cambio se refleja en el verificador público y en `audit_logs`.
- **Esfuerzo:** 1.5–2 días (es la sección más extensa; puede dividirse por rol entre varios integrantes).

### Fase C6 — Certificados, Libro de Reclamaciones y multi-tenancy (1 día)

- **Specs:** `cypress/e2e/certificates/`, `complaints/`
- **Casos a cubrir:**
  1. Ciclo de vida completo de un certificado desde la UI: emisión (admin) → aparece en "Mis Certificados" (estudiante) → verificación pública por código + DNI → revocación (admin) → la verificación pública refleja el estado "revocado".
  2. Libro de Reclamaciones: un visitante registra una reclamación (`/libro-de-reclamaciones`), recibe un código de seguimiento, y un administrador la visualiza y actualiza su estado desde su panel.
  3. *(Opcional, requiere dos *tenants* sembrados)* Verificar desde la UI que un usuario del tenant A no puede ver cursos/certificados/datos del tenant B — complementa `TenantIsolationTest` de PHPUnit con una verificación de extremo a extremo.
- **Esfuerzo:** 1 día.

### Fase C7 — Integración continua (0.5 día)

- **Acciones:**
  1. Añadir un *job* al workflow de GitHub Actions (el mismo propuesto en la Fase D4, o uno independiente) que:
     - levante el stack con `docker compose up -d` (o backend + frontend en modo CI sin Docker, como alternativa más liviana),
     - ejecute `php artisan migrate:fresh --seed`,
     - corra `npm run test:e2e` (Cypress headless) contra ese entorno,
     - publique como *artifact* las capturas/vídeos que Cypress genera automáticamente en caso de fallo.
  2. Documentar en el README cómo correr la suite localmente (`npm run cypress:open` para modo interactivo, `npm run test:e2e` para headless con servidor incluido).
- **Entregable:** workflow de CI con el job de Cypress, sección "Pruebas E2E" en el README.

**Esfuerzo total estimado — Cypress: ~5–6.5 días** (C0: 0.5, C1: 0.5–1, C2: 0.5, C3: 0.5–1, C4: 1, C5: 1.5–2, C6: 1, C7: 0.5).
**Orden sugerido:** C0 → C1 → (C2, C3 en paralelo) → C4 → C5 → C6 → C7.

---

## 3. Cronograma combinado y dependencias

```
Semana 1: D0 → D1/D2 (paralelo) → D3            |  C0 → C1 → C2/C3 (paralelo)
Semana 2: D4 (cierre Docker)                     |  C4 → C5
Semana 3:                                        |  C6 → C7 (cierre Cypress)
```

- **Dependencia clave:** las fases C4–C6 de Cypress se benefician de tener el entorno Dockerizado (D3) ya operativo, porque permite levantar una base de datos limpia y reproducible (`docker compose run backend php artisan migrate:fresh --seed`) antes de cada corrida de la suite E2E — exactamente el mismo principio de aislamiento que ya usa PHPUnit con SQLite en memoria.
- **Nada bloquea el inicio de Cypress en paralelo a Docker:** las fases C0–C3 pueden arrancar de inmediato contra el entorno XAMPP actual (`npm run dev` + `php artisan serve`), y migrar a Docker como entorno de ejecución una vez que D3 esté listo.

**Esfuerzo total estimado del plan completo: ~9–11.5 días-persona**, repartibles entre 2–3 integrantes en aproximadamente 2–3 semanas.

---

## 4. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Diferencias de comportamiento entre XAMPP local y contenedores (zonas horarias, locales, versión de MySQL) | Fijar versiones exactas en las imágenes (`mysql:8.0`, `php:8.2-fpm`) y comparar `php artisan about` dentro y fuera del contenedor antes de dar la fase D3 por cerrada |
| Cypress generando datos que ensucien la base de datos de desarrollo | Usar siempre `cy.seedDb()`/`migrate:fresh --seed` antes de cada suite, y — preferiblemente — apuntar Cypress a una base de datos dedicada (`eduwanka_e2e`) distinta de la de desarrollo |
| Flujo de Mercado Pago imposible de probar end-to-end sin credenciales reales de sandbox | Usar `cy.intercept` para simular las respuestas de la pasarela (Fase C4, caso 2) y dejar la integración real cubierta por `MercadoPagoWebhookTest` (PHPUnit) con datos de sandbox |
| Selectores de Cypress frágiles ante cambios de diseño (Tailwind) | Introducir atributos `data-testid` estables en los componentes clave (Fase C1, punto 4) en lugar de depender de clases CSS o textos traducibles |
| Tiempo de build de las imágenes Docker en CI | Usar *layer caching* de Docker (`actions/cache` o `docker/build-push-action` con `cache-from`/`cache-to`) y `composer install`/`npm ci` en capas separadas del `COPY` del código fuente |

---

## 5. Criterios de aceptación del plan

- **Dockerización:** `docker compose up --build` levanta `db` + `backend` + `frontend` desde cero, ejecuta migraciones y *seeders* automáticamente, expone la API en `:8000` y la SPA en `:3000`, y un usuario puede iniciar sesión con las credenciales demo y navegar el Aula Virtual — sin tocar XAMPP.
- **Cypress:** `npm run test:e2e` ejecuta en verde, de forma headless y reproducible, al menos los flujos de las fases C2–C6 (catálogo, autenticación, checkout/matrícula, aula por rol, certificados y reclamaciones), generando capturas/vídeos como evidencia ante cualquier fallo.
- **Integración:** ambos mecanismos quedan documentados en el `README.md` y, opcionalmente, integrados en un workflow de CI que los ejecuta automáticamente ante cada cambio relevante — cerrando el ciclo de automatización descrito como recomendación en el informe del proyecto.
