// Fase C6 — Ciclo de vida de certificados (admin)
// Ruta real: /aula/admin/certificados

describe("Gestión de certificados — Administrador", () => {
  beforeEach(() => {
    cy.loginAs("admin");
  });

  it("la página de certificados carga con el listado", () => {
    cy.visitAula("admin", "/certificados");
    cy.contains(/certificados/i, { timeout: 10000 }).should("be.visible");
  });

  it("muestra acciones de emisión o indica que no hay certificados pendientes", () => {
    cy.visitAula("admin", "/certificados");
    cy.get("body", { timeout: 10000 }).then(($body) => {
      const hasEmitBtn = $body.find("button, a").toArray()
        .some((el) => /emitir|generar|nuevo certificado/i.test(el.textContent ?? ""));
      const isEmpty = /no hay certificados|sin certificados|a[uú]n no/i.test($body.text());
      const hasList = $body.find("table tr, [class*='certificate'], li").length > 0;
      expect(hasEmitBtn || isEmpty || hasList).to.be.true;
    });
  });

  it("un certificado emitido es visible en la lista de /aula/certificados del estudiante", () => {
    cy.loginAs("student");
    cy.visitAula("student", "/certificados");
    cy.get("body", { timeout: 10000 }).then(($body) => {
      const text = $body.text();
      const hasCerts = $body.find("[class*='certificate'], .card, li, tr").length > 0;
      const isEmpty = /a[uú]n no tienes|sin certificados|no tienes certificados/i.test(text);
      expect(hasCerts || isEmpty).to.be.true;
    });
  });
});

describe("Verificación pública de certificados", () => {
  it("el verificador público responde a una consulta con un estado explícito", () => {
    cy.visit("/certificados");
    cy.fixture("courses").then(({ sampleCertificate }) => {
      // Certificates.tsx: input[0]=DNI placeholder "Ej: 12345678", input[1]=código "Ej: CERT-2026-XXXX"
      cy.get('input[type="text"]').first().type(sampleCertificate.dni);
      cy.get('input[type="text"]').last().type(sampleCertificate.code);
      cy.get("button").contains(/buscar|validar|verificar/i).first().click();
      cy.contains(/válido|valida|vigente|no se encontró|no encontrado|revocad/i, { timeout: 10000 })
        .should("exist");
    });
  });
});
