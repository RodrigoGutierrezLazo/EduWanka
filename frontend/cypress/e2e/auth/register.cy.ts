// Fase C3 — Registro de cuentas (estudiante)
// Register.tsx usa name="name", "last_name", "email", "dni", "phone", "city",
// "password", "password_confirmation" (sin accents en los atributos name).

describe("Registro de cuenta de estudiante", () => {
  beforeEach(() => {
    cy.visit("/registro");
  });

  it("muestra todos los campos solicitados por el formulario", () => {
    // Campos reales de Register.tsx
    cy.get('input[name="name"]').should("exist");
    cy.get('input[name="last_name"]').should("exist");
    cy.get('input[type="email"], input[name="email"]').should("exist");
    cy.get('input[name="dni"]').should("exist");
    cy.get('input[name="phone"]').should("exist");
    cy.get('input[name="city"]').should("exist");
    cy.get('input[type="password"]').should("have.length.gte", 2);
  });

  it("valida que la confirmación de contraseña coincida", () => {
    const unique = Date.now();
    cy.fixture("users").then(({ newStudent }) => {
      cy.get('input[name="name"]').type(newStudent.name);
      cy.get('input[name="last_name"]').type(newStudent.lastName);
      cy.get('input[type="email"]').first().type(`e2e.${unique}@eduwanka.local`);
      cy.get('input[name="dni"]').type(`9${String(unique).slice(-7)}`);
      cy.get('input[name="phone"]').type(newStudent.phone);
      cy.get('input[name="city"]').type(newStudent.city);
      cy.get('input[name="password"]').type(newStudent.password);
      cy.get('input[name="password_confirmation"]').type("ContraseñaQueNoCoincide123!");

      cy.get("button[type=submit], button").contains(/crear cuenta|registr/i).click();
      cy.contains(/no coincid|deben coincidir|misma contrase/i, { timeout: 10000 }).should("be.visible");
    });
  });

  it("registra una cuenta nueva e inicia sesión automáticamente en /aula", () => {
    const unique = Date.now();
    cy.fixture("users").then(({ newStudent }) => {
      const email = `e2e.${unique}@eduwanka.local`;

      cy.get('input[name="name"]').type(newStudent.name);
      cy.get('input[name="last_name"]').type(newStudent.lastName);
      cy.get('input[type="email"]').first().type(email);
      cy.get('input[name="dni"]').type(`9${String(unique).slice(-7)}`);
      cy.get('input[name="phone"]').type(newStudent.phone);
      cy.get('input[name="city"]').type(newStudent.city);
      cy.get('input[name="password"]').type(newStudent.password);
      cy.get('input[name="password_confirmation"]').type(newStudent.password);

      cy.get("button[type=submit], button").contains(/crear cuenta|registr/i).click();

      cy.location("pathname", { timeout: 15000 }).should("include", "/aula");
    });
  });
});
