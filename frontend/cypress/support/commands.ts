/// <reference types="cypress" />

// ---------------------------------------------------------------------------
// Comandos personalizados de Cypress para EduWanka.
// ---------------------------------------------------------------------------

export type DemoRole = "student" | "prof" | "admin" | "superadmin";

const EMAIL_BY_ROLE: Record<DemoRole, string> = {
  student: "studentEmail",
  prof: "profEmail",
  admin: "adminEmail",
  superadmin: "superadminEmail",
};

// Prefijos reales del enrutador React (App.tsx):
//   - student → /aula  (rutas directas bajo /aula/: cursos, pagos, certificados, notas, asistencia…)
//   - prof    → /aula/prof
//   - admin   → /aula/admin
//   - superadmin → /aula/superadmin
const AULA_PREFIX_BY_ROLE: Record<DemoRole, string> = {
  student: "/aula",
  prof: "/aula/prof",
  admin: "/aula/admin",
  superadmin: "/aula/superadmin",
};

/**
 * Inicia sesion a través del proxy de la SPA (localhost:3000) para que la
 * cookie de sesión httpOnly de Sanctum quede en el mismo origen que usa la
 * SPA — el enfoque correcto para Sanctum SPA auth con Cypress:
 *   1. GET /sanctum/csrf-cookie  → establece la cookie XSRF-TOKEN en :3000
 *   2. POST /api/v1/auth/login   → con X-XSRF-TOKEN; establece la sesión
 *   3. GET /api/v1/auth/me       → devuelve los datos del usuario autenticado
 */
Cypress.Commands.add("loginAs", (role: DemoRole) => {
  const baseUrl = Cypress.config("baseUrl") as string; // http://localhost:3000
  const email = Cypress.env(EMAIL_BY_ROLE[role]);
  const password = Cypress.env("demoPassword");

  return cy
    .request({ method: "GET", url: `${baseUrl}/sanctum/csrf-cookie`, failOnStatusCode: false })
    .then(() =>
      cy.getCookie("XSRF-TOKEN").then((xsrfCookie) => {
        const xsrfToken = xsrfCookie ? decodeURIComponent(xsrfCookie.value) : "";
        return cy.request({
          method: "POST",
          url: `${baseUrl}/api/v1/auth/login`,
          headers: { "X-XSRF-TOKEN": xsrfToken },
          body: { email, password },
          failOnStatusCode: true,
        });
      }),
    )
    .then(() =>
      cy.request({ method: "GET", url: `${baseUrl}/api/v1/auth/me` }).then((res) => res.body),
    );
});

/**
 * Visita una ruta del Aula Virtual del rol indicado.
 * path (opcional) se concatena al prefijo del rol, p.ej.:
 *   cy.visitAula("student", "/cursos")  →  visita /aula/cursos
 *   cy.visitAula("admin", "/pagos")     →  visita /aula/admin/pagos
 */
Cypress.Commands.add("visitAula", (role: DemoRole, path = "") => {
  cy.visit(`${AULA_PREFIX_BY_ROLE[role]}${path}`);
});

/**
 * Restaura la base de datos a un estado limpio y reproducible ejecutando
 * "migrate:fresh --seed" en el backend. Solo para entornos locales/CI.
 */
Cypress.Commands.add("seedDb", () => {
  const backendPath = Cypress.env("backendPath") || "../backend";
  return cy.exec(`cd ${backendPath} && php artisan migrate:fresh --seed`, {
    timeout: 180000,
    failOnNonZeroExit: false,
  });
});

/**
 * Selector por "data-testid", más estable que clases CSS de Tailwind.
 */
Cypress.Commands.add("byTestId", (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

/**
 * Selecciona, en un <select> encadenado, la <option> cuyo texto matchea el patrón.
 */
Cypress.Commands.add(
  "selectOptionMatching",
  { prevSubject: "element" },
  (subject: JQuery<HTMLElement>, pattern: RegExp) => {
    const select = subject[0] as HTMLSelectElement;
    const match = [...select.options].find((option) => pattern.test(option.text));
    if (!match) {
      throw new Error(`selectOptionMatching: ninguna <option> coincide con ${pattern}`);
    }
    return cy.wrap(subject).select(match.value);
  },
);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      loginAs(role: DemoRole): Chainable<unknown>;
      visitAula(role: DemoRole, path?: string): Chainable<unknown>;
      seedDb(): Chainable<unknown>;
      byTestId(testId: string): Chainable<JQuery<HTMLElement>>;
      selectOptionMatching(pattern: RegExp): Chainable<JQuery<HTMLElement>>;
    }
  }
}

export {};
