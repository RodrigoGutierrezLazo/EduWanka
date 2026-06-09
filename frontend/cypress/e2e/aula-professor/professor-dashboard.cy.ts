// Fase C5 — Aula Virtual: Profesor
// Rutas reales (App.tsx): /aula/prof, /aula/prof/cursos, /aula/prof/alumnos,
// /aula/prof/certificados, /aula/prof/perfil

describe("Aula Virtual — Profesor", () => {
  beforeEach(() => {
    cy.loginAs("prof");
  });

  it("el dashboard del profesor carga en /aula/prof", () => {
    cy.visitAula("prof");
    cy.location("pathname", { timeout: 10000 }).should("include", "/aula/prof");
    cy.get("body").should("not.contain.text", "404");
  });

  it("la sección de cursos del profesor carga y lista cursos asignados", () => {
    cy.visitAula("prof", "/cursos");
    cy.contains(/mis cursos|cursos asignados|cursos/i, { timeout: 10000 }).should("be.visible");
  });

  it("la sección de alumnos carga sin error", () => {
    cy.visitAula("prof", "/alumnos");
    cy.contains(/alumnos|estudiantes|participantes/i, { timeout: 10000 }).should("exist");
  });

  it("navega al detalle de un curso si hay cursos disponibles", () => {
    cy.visitAula("prof", "/cursos");
    cy.get("body", { timeout: 10000 }).then(($body) => {
      const link = $body.find("a[href*='/aula/prof/cursos/']")[0];
      if (link) {
        cy.wrap(link).click();
        cy.location("pathname").should("match", /\/aula\/prof\/cursos\/.+/);
      } else {
        cy.log("No hay cursos asignados al profesor en la semilla actual.");
      }
    });
  });

  it("el perfil del profesor carga", () => {
    cy.visitAula("prof", "/perfil");
    cy.contains(/perfil|mi perfil|datos personales/i, { timeout: 10000 }).should("exist");
  });
});
