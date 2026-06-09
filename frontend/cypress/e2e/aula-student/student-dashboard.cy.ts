// Fase C5 — Aula Virtual: Estudiante
// Rutas reales (App.tsx): /aula/cursos, /aula/pagos, /aula/certificados,
// /aula/notas, /aula/asistencia

describe("Aula Virtual — Estudiante", () => {
  beforeEach(() => {
    cy.loginAs("student");
  });

  it("el área de cursos muestra el título 'Mis Cursos'", () => {
    cy.visitAula("student", "/cursos");
    cy.contains(/mis cursos/i, { timeout: 10000 }).should("be.visible");
  });

  it("lista los cursos comprados (o informa que no hay ninguno)", () => {
    cy.visitAula("student", "/cursos");
    cy.get("body", { timeout: 10000 }).then(($body) => {
      const hasCourses = $body.find("article, [class*='course'], a[href*='/cursos/']").length > 0;
      const isEmpty = /no tienes cursos|no hay cursos|sin cursos|a[uú]n no/i.test($body.text());
      expect(hasCourses || isEmpty).to.be.true;
    });
  });

  it("la sección de pagos carga sin error", () => {
    cy.visitAula("student", "/pagos");
    cy.contains(/pagos|historial|comprobante/i, { timeout: 10000 }).should("be.visible");
  });

  it("la sección de certificados carga y muestra estado explícito", () => {
    cy.visitAula("student", "/certificados");
    cy.contains(/certificado|no tienes|sin certificados/i, { timeout: 10000 }).should("exist");
  });

  it("la sección de notas carga sin error", () => {
    cy.visitAula("student", "/notas");
    cy.contains(/notas|calificaci|historial|intento/i, { timeout: 10000 }).should("exist");
  });

  it("la sección de asistencia carga sin error", () => {
    cy.visitAula("student", "/asistencia");
    cy.contains(/asistencia/i, { timeout: 10000 }).should("be.visible");
  });
});
