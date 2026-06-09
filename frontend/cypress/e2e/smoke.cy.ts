// Spec de humo: verifica que el entorno E2E esta levantado y funcionando.

describe("Smoke test del entorno E2E", () => {
  it("la landing carga y contiene el nombre de la plataforma", () => {
    cy.visit("/");
    // EduWanka aparece en múltiples lugares (título, logo alt, meta…). Buscamos
    // sin restricción de visibilidad porque el texto puede estar en capas que
    // Tailwind oculta en viewport pequeño (ej. .hidden.lg:block).
    cy.contains(/eduwanka/i, { matchCase: false }).should("exist");
  });

  it("el backend responde a través del proxy (/api/v1/health)", () => {
    cy.request(`${Cypress.env("apiUrl")}/health`).then((res) => {
      expect(res.status).to.eq(200);
    });
  });

  it("la landing expone un enlace al área de autenticación", () => {
    cy.visit("/");
    // El layout público incluye un botón/enlace hacia /login o /aula.
    cy.get("a[href*='/login'], a[href*='/aula'], a[href*='/registro']").should("exist");
  });
});
