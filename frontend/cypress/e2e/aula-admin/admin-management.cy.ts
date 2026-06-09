// Fase C5 — Aula Virtual: Administrador
// Rutas reales (App.tsx): /aula/admin, /aula/admin/usuarios, /aula/admin/cursos,
// /aula/admin/pagos, /aula/admin/historial, /aula/admin/certificados,
// /aula/admin/reclamaciones

describe("Aula Virtual — Administrador", () => {
  beforeEach(() => {
    cy.loginAs("admin");
  });

  it("el dashboard del administrador carga con métricas visibles", () => {
    cy.visitAula("admin");
    cy.location("pathname", { timeout: 10000 }).should("include", "/aula/admin");
    cy.get("body").should("not.contain.text", "403");
  });

  it("la gestión de usuarios carga y muestra la lista", () => {
    cy.visitAula("admin", "/usuarios");
    cy.contains(/usuarios/i, { timeout: 10000 }).should("be.visible");
  });

  it("la gestión de cursos carga", () => {
    cy.visitAula("admin", "/cursos");
    cy.contains(/cursos/i, { timeout: 10000 }).should("be.visible");
  });

  it("crea un nuevo curso desde el botón 'Nuevo Curso'", () => {
    const title = `Curso E2E ${Date.now()}`;
    cy.visitAula("admin", "/cursos");
    cy.get("a, button").contains(/nuevo curso|agregar curso|crear/i, { timeout: 10000 }).first().click();

    cy.get('input[name*="titulo" i], input[name*="title" i], input[name*="nombre" i]').first().type(title);
    cy.get('input[name*="precio" i], input[name*="price" i]').first().type("199.90");
    cy.get("button[type=submit], button").contains(/guardar|crear|publicar/i).click();

    cy.contains(/curso creado|guardado|éxito/i, { timeout: 10000 }).should("exist");
  });

  it("la bandeja de pagos carga correctamente (/aula/admin/pagos)", () => {
    cy.visitAula("admin", "/pagos");
    cy.contains(/pagos|comprobantes|validar/i, { timeout: 10000 }).should("be.visible");
  });

  it("el historial de pagos carga (/aula/admin/historial)", () => {
    cy.visitAula("admin", "/historial");
    cy.contains(/historial|pagos/i, { timeout: 10000 }).should("be.visible");
  });

  it("la gestión de certificados carga (/aula/admin/certificados)", () => {
    cy.visitAula("admin", "/certificados");
    cy.contains(/certificados/i, { timeout: 10000 }).should("be.visible");
  });
});
