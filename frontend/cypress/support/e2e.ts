// ---------------------------------------------------------------------------
// Punto de entrada de soporte para todos los specs E2E (cargado antes de cada
// archivo de prueba). Registra los comandos personalizados y configura
// comportamientos globales de la suite.
// ---------------------------------------------------------------------------

import "./commands";

// La SPA usa React Query y puede emitir advertencias de "act()" o errores de
// red ya manejados (p.ej. al probar credenciales invalidas a proposito) que
// no deben tumbar el test. Solo dejamos pasar excepciones no controladas
// inesperadas (Cypress seguira fallando el test si una aserción no se cumple).
Cypress.on("uncaught:exception", (err) => {
  if (/ResizeObserver loop|Network Error|Request failed with status code/i.test(err.message)) {
    return false;
  }
  return true;
});
