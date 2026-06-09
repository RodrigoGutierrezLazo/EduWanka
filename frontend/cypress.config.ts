import { defineConfig } from "cypress";

// ---------------------------------------------------------------------------
// Configuracion de Cypress para la suite E2E de EduWanka.
//
// La suite corre contra el frontend (Vite dev server, http://localhost:3000)
// que a su vez proxifica /api, /sanctum y /storage hacia el backend Laravel
// (http://localhost:8000), exactamente igual que en desarrollo local o con
// "docker compose up" (ver vite.config.ts y frontend/docker/nginx.conf).
//
// Ver: Documentacion/PLAN_DOCKERIZACION_Y_PRUEBAS_E2E_CYPRESS.md (Fase C0).
// ---------------------------------------------------------------------------

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/e2e/**/*.cy.ts",
    fixturesFolder: "cypress/fixtures",
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 8000,
    retries: {
      runMode: 1,
      openMode: 0,
    },
    env: {
      // URL de la API consumida directamente desde los tests (cy.request) para
      // login programatico, siembra de datos y aserciones de respaldo.
      apiUrl: "http://localhost:8000/api/v1",
      // Credenciales demo del README/seeders (DemoTenantSeeder, LocalDemoSeeder).
      // Pueden sobreescribirse vía CYPRESS_* o --env si se usan otras semillas.
      demoPassword: "Password123!",
      studentEmail: "student@eduwanka.local",
      profEmail: "prof@eduwanka.local",
      adminEmail: "admin@eduwanka.local",
      superadminEmail: "superadmin@eduwanka.local",
    },
    setupNodeEvents(_on, _config) {
      // Punto de extension para tareas a nivel Node (p.ej. limpiar archivos
      // descargados, leer fixtures dinámicos). Se deja preparado y vacío
      // hasta que un escenario concreto lo requiera.
    },
  },
});
