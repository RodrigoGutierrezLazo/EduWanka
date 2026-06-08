/**
 * Logger de solo-desarrollo.
 *
 * Evita filtrar detalles internos (mensajes de error, stacks, payloads de
 * respuesta de la API, etc.) a la consola del navegador en producción —
 * esa información puede ayudar a un atacante a mapear el backend. En
 * desarrollo (`import.meta.env.DEV`) se comporta igual que `console.error`
 * / `console.warn`.
 */
const isDev = import.meta.env.DEV;

export const logger = {
  error(...args: unknown[]): void {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.error(...args);
    }
  },
  warn(...args: unknown[]): void {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.warn(...args);
    }
  },
};
