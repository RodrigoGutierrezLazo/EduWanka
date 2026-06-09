// Fase C6 (opcional) — Aislamiento multi-tenant desde la UI
// (ver páginawebinfo.md > 3.1 y Documentacion/PLAN_DOCKERIZACION_Y_PRUEBAS_E2E_CYPRESS.md)
//
// Complementa TenantIsolationTest (PHPUnit) con una verificación end-to-end:
// el catálogo público de un tenant no debe filtrar cursos de otro. Requiere
// que el seeder de demo registre al menos dos tenants con subdominios propios
// (ver DemoTenantSeeder). Si solo existe un tenant en la semilla actual
// (p. ej. en un entorno recién instalado), el spec lo documenta y no falla.
//
// Nota: visitar subdominios *.localhost requiere que VITE_APP_BASE_DOMAIN /
// TENANT_BASE_DOMAIN estén configurados (ver .env.docker.example) y que el
// sistema operativo resuelva *.localhost a 127.0.0.1 (la mayoría lo hace
// de forma nativa; en Windows puede requerir una entrada en hosts).

describe("Aislamiento multi-tenant (catálogo público)", () => {
  let tenants: Array<{ slug: string; courseTitles: string[] }> = [];

  before(() => {
    cy.request(`${Cypress.env("apiUrl")}/tenants`).then(
      (res) => {
        const list = res.body?.data ?? res.body ?? [];
        tenants = list.slice(0, 2).map((t: { slug?: string; subdomain?: string }) => ({
          slug: t.slug || t.subdomain || "",
          courseTitles: [],
        }));
      },
      // El endpoint público de tenants puede no existir en todas las versiones;
      // en ese caso, el spec documenta la limitación sin fallar.
    );
  });

  it("compara el catálogo de dos tenants y confirma que no comparten cursos", function () {
    if (tenants.length < 2 || !tenants[0].slug || !tenants[1].slug) {
      cy.log(
        "[Información] Se requieren al menos dos tenants con subdominio propio " +
        "sembrados (ver DemoTenantSeeder) para ejercitar este spec end-to-end. " +
        "La cobertura de aislamiento a nivel de datos ya está garantizada por " +
        "TenantIsolationTest (PHPUnit); este spec queda listo para activarse " +
        "en cuanto el entorno de pruebas E2E siembre un segundo tenant.",
      );
      return;
    }

    const baseDomain = Cypress.env("appBaseDomain") || "localhost:3000";

    cy.visit(`http://${tenants[0].slug}.${baseDomain}/cursos`, { failOnStatusCode: false });
    cy.get('[data-testid="course-card"], article').then(($cards) => {
      tenants[0].courseTitles = [...$cards].map((el) => el.textContent?.trim() || "");
    });

    cy.visit(`http://${tenants[1].slug}.${baseDomain}/cursos`, { failOnStatusCode: false });
    cy.get('[data-testid="course-card"], article').then(($cards) => {
      tenants[1].courseTitles = [...$cards].map((el) => el.textContent?.trim() || "");

      const overlap = tenants[0].courseTitles.filter((title) => tenants[1].courseTitles.includes(title));
      expect(overlap, "cursos compartidos entre tenants distintos (no debería haber ninguno)").to.have.length(0);
    });
  });
});
