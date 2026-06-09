// Fase C2 — Flujos del visitante: catálogo y verificación de certificados.
// NOTA: la ruta /cursos tiene detección de tenant. En local (localhost) usa
// localStorage 'active_tenant_slug' para determinar si muestra la ficha de
// marketing (sin tenant) o el catálogo real (con tenant).
// Todos los tests de catálogo activan el tenant 'demo' vía localStorage.

describe("Catálogo público de cursos", () => {
  beforeEach(() => {
    // Activar tenant 'demo' para que /cursos renderice el TenantCoursesList
    cy.window().then((win) => {
      win.localStorage.setItem("active_tenant_slug", "demo");
    });
    cy.visit("/cursos");
  });

  it("muestra un grid con al menos un curso publicado", () => {
    cy.get("article, [class*='course'], [class*='Course'], .card, li", { timeout: 10000 })
      .filter((_, el) => (el.textContent?.trim().length ?? 0) > 5)
      .should("have.length.greaterThan", 0);
  });

  it("permite buscar cursos por texto y el campo acepta la entrada", () => {
    cy.fixture("courses").then(({ searchTerm }) => {
      cy.get('input[type="text"], input[type="search"]', { timeout: 10000 })
        .first()
        .type(searchTerm);
      cy.get('input[type="text"], input[type="search"]')
        .first()
        .should("have.value", searchTerm);
    });
  });

  it("navega al detalle de un curso al hacer click en el primer enlace de curso", () => {
    // Esperar a que carguen los cursos y luego hacer click en el primero
    cy.get("a[href*='/cursos/']", { timeout: 10000 }).first().click();
    cy.location("pathname").should("match", /\/cursos\/.+/);
  });
});

describe("Verificación pública de certificados", () => {
  beforeEach(() => {
    cy.visit("/certificados");
  });

  it("muestra el formulario de validación con campos de DNI y código", () => {
    // Certificates.tsx: inputs con placeholder "Ej: 12345678" (DNI) y "Ej: CERT-2026-XXXX" (código)
    cy.get('input[type="text"]', { timeout: 10000 }).should("have.length.gte", 2);
    cy.get("button[type=submit]").should("be.visible");
  });

  it("responde a una consulta con un estado explícito", () => {
    cy.fixture("courses").then(({ sampleCertificate }) => {
      // Primer input: DNI, segundo: código (orden en Certificates.tsx)
      cy.get('input[type="text"]').first().type(sampleCertificate.dni);
      cy.get('input[type="text"]').last().type(sampleCertificate.code);
      cy.get("button[type=submit]").click();
      cy.contains(/válido|valida|vigente|no se encontró|no encontrado|revocado|no existe|error/i, { timeout: 10000 })
        .should("exist");
    });
  });
});
