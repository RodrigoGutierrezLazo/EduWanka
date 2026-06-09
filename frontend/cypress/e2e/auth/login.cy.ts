// Fase C3 — Autenticación: login con cada rol demo y casos negativos.

describe("Login al Aula Virtual", () => {
  beforeEach(() => {
    cy.visit("/login");
  });

  it("muestra el formulario de autenticación", () => {
    cy.get('input[type="email"], input[name*="email" i]').should("be.visible");
    cy.get('input[type="password"]').should("be.visible");
    cy.get("button[type=submit], button").contains(/iniciar sesi[oó]n|entrar/i).should("be.visible");
  });

  it("rechaza credenciales inválidas con un mensaje de error", () => {
    cy.get('input[type="email"], input[name*="email" i]').first().type("no-existe@eduwanka.local");
    cy.get('input[type="password"]').first().type("clave-incorrecta-123");
    cy.get("button[type=submit], button").contains(/iniciar sesi[oó]n|entrar/i).click();
    cy.contains(/credenciales|no v[aá]lid|incorrect|no se pudo/i, { timeout: 10000 }).should("be.visible");
    cy.location("pathname").should("eq", "/login");
  });

  it("expone el enlace de recuperación de contraseña", () => {
    cy.get("a[href*='forgot-password']").should("exist");
  });

  (["student", "prof", "admin", "superadmin"] as const).forEach((role) => {
    it(`permite iniciar sesión como ${role} y redirige al aula`, () => {
      cy.fixture("users").then((users) => {
        const { email, password } = users[role];
        cy.get('input[type="email"], input[name*="email" i]').first().clear().type(email);
        cy.get('input[type="password"]').first().clear().type(password);
        cy.get("button[type=submit], button").contains(/iniciar sesi[oó]n|entrar/i).click();
        // Todos los roles aterrizan en alguna subruta de /aula
        cy.location("pathname", { timeout: 15000 }).should("include", "/aula");
      });
    });
  });
});

describe("Recuperación y restablecimiento de contraseña", () => {
  it("la solicitud de recuperación acepta un correo y confirma el envío", () => {
    cy.visit("/forgot-password");
    cy.fixture("users").then(({ student }) => {
      cy.get('input[type="email"], input[name*="email" i]').first().type(student.email);
      cy.get("button[type=submit], button").contains(/enviar|recuperar|continuar/i).click();
      cy.contains(/revisa tu correo|enviado|enlace de recuperaci[oó]n|email/i, { timeout: 10000 })
        .should("exist");
    });
  });

  it("la pantalla de restablecimiento requiere un token válido", () => {
    cy.visit("/reset-password");
    // Sin token: la SPA debe indicar enlace inválido, no mostrar formulario funcional
    cy.contains(/token|enlace|inv[aá]lido|expirado|requerido/i, { timeout: 10000 }).should("exist");
  });
});
