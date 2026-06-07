import DOMPurify from 'dompurify';

/**
 * Sanitiza HTML antes de inyectarlo con `dangerouslySetInnerHTML`.
 *
 * Se usa para contenido enriquecido autorado por staff (instrucciones de
 * tareas, items de curso, secciones del home) que se renderiza para
 * estudiantes/visitantes: si una cuenta de prof/admin se ve comprometida,
 * o el contenido fue editado con datos pegados de otra fuente, esto evita
 * que se inyecten <script>, manejadores onerror/onclick, etc. (XSS
 * almacenado).
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'a', 'b', 'strong', 'i', 'em', 'u', 's', 'p', 'br', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
      'span', 'div', 'img', 'figure', 'figcaption', 'table', 'thead', 'tbody',
      'tr', 'th', 'td', 'hr',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'style'],
    ALLOW_DATA_ATTR: false,
  });
}
