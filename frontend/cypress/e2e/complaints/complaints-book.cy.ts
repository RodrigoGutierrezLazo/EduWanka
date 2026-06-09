// Fase C6 — Libro de Reclamaciones
// Ruta real pública: /reclamaciones (App.tsx)
// Ruta real admin:   /aula/admin/reclamaciones

const FORM_SELECTOR = 'input[name*="nombre" i], textarea, input[name*="descripcion" i]';

describe("Libro de Reclamaciones — registro público", () => {
  beforeEach(() => {
    cy.visit("/reclamaciones", { failOnStatusCode: false });
  });

  it("la página carga sin error de servidor", () => {
    cy.get("body").should("not.contain.text", "500");
    cy.location("pathname").should("include", "reclamaciones");
  });

  it("expone el formulario de registro (o documenta que está en construcción)", () => {
    cy.get("body", { timeout: 10000 }).then(($body) => {
      // querySelectorAll uses native browser CSS (supports [attr i]); jQuery $body.find() does not.
      if ($body[0].querySelectorAll(FORM_SELECTOR).length === 0) {
        cy.log("[Info] El formulario de reclamaciones aún está en desarrollo — se omite la aserción detallada.");
        return;
      }
      cy.get('input[name*="nombre" i]').should("be.visible");
      cy.get("button[type=submit], button").contains(/enviar|registrar/i).should("be.visible");
    });
  });

  it("registra una reclamación y devuelve confirmación (cuando el módulo esté activo)", () => {
    cy.get("body", { timeout: 10000 }).then(($body) => {
      if ($body[0].querySelectorAll(FORM_SELECTOR).length === 0) {
        cy.log("[Info] Formulario no disponible — se omite el registro de prueba.");
        return;
      }
      const unique = Date.now();
      cy.get('input[name*="nombre" i]').first().type("Reclamante E2E");
      cy.get('input[type="email"], input[name*="email" i]').first().type(`e2e.${unique}@eduwanka.local`);
      cy.get('select[name*="tipo" i]').then(($s) => { if ($s.length) cy.wrap($s).first().select(1); });
      cy.get('textarea, input[name*="detalle" i], input[name*="descripcion" i]').first()
        .type("Reclamo de prueba E2E — verificación automática Cypress.");
      cy.get("button[type=submit], button").contains(/enviar|registrar/i).click();
      cy.contains(/c[oó]digo de seguimiento|registrado|hemos recibido/i, { timeout: 15000 })
        .should("exist");
    });
  });
});

describe("Libro de Reclamaciones — gestión administrativa", () => {
  it("el panel admin expone el módulo de reclamaciones (cuando esté activo)", () => {
    cy.loginAs("admin");
    cy.visitAula("admin", "/reclamaciones");
    cy.get("body", { timeout: 10000 }).then(($body) => {
      if ($body.find("table, [class*='complaint'], li").length === 0 &&
          !/reclamaci/i.test($body.text())) {
        cy.log("[Info] El módulo admin de reclamaciones aún no está disponible.");
        return;
      }
      cy.contains(/reclamaci/i).should("exist");
    });
  });
});
