// Dominio raíz real de la plataforma (ej: eduwanka.net.pe). Se configura por
// build vía VITE_APP_BASE_DOMAIN porque NO se puede inferir de forma fiable
// contando segmentos: sufijos de 2 niveles como ".net.pe", ".com.pe" o
// ".co.uk" hacen que el propio dominio raíz (p.ej. "eduwanka.net.pe", 3
// partes) sea indistinguible de un subdominio de inquilino tipo
// "demo.eduwanka.net.pe" (también 3 partes) si solo se cuentan las partes.
const BASE_DOMAIN = (import.meta.env.VITE_APP_BASE_DOMAIN as string | undefined)?.toLowerCase().trim() || null;

export function getActiveTenantSlug(): string | null {
  const hostname = window.location.hostname.toLowerCase();
  const parts = hostname.split('.');

  // 1. Si es un subdominio de localhost (ej: verde.localhost o azul.localhost)
  if (parts.length === 2 && parts[1] === 'localhost') {
    return parts[0];
  }

  // 2. Si estamos en localhost puro o 127.0.0.1 (sin subdominio), permitir fallback de localStorage
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return localStorage.getItem('active_tenant_slug');
  }

  // 3. Si conocemos el dominio base real de la plataforma, comparar contra él
  // explícitamente en vez de adivinar por cantidad de segmentos. Esto evita
  // que el dominio raíz (ej. "eduwanka.net.pe") se confunda con un
  // subdominio de inquilino solo porque tiene 3 partes.
  if (BASE_DOMAIN) {
    if (hostname === BASE_DOMAIN || hostname === `www.${BASE_DOMAIN}`) {
      return null;
    }
    if (hostname.endsWith(`.${BASE_DOMAIN}`)) {
      const sub = hostname.slice(0, -(BASE_DOMAIN.length + 1));
      // Un subdominio puede tener más de un nivel (ej. "a.b.eduwanka.net.pe");
      // el slug del inquilino es siempre el primer segmento.
      const slug = sub.split('.')[0];
      return slug === 'www' ? null : slug;
    }
    // El host no coincide ni es subdominio del dominio base conocido (p.ej.
    // se accedió por IP): no se puede derivar un inquilino del host.
    return null;
  }

  // 4. Sin dominio base configurado: heurística de respaldo para entornos
  // (ej. previsualizaciones) donde se desconoce el dominio final. Con sufijos
  // de dominio de 2 niveles (.net.pe, .com.pe, .co.uk...) el dominio raíz ya
  // tiene 3 partes, así que ahí se exigen 4+ partes para considerar que hay
  // subdominio de inquilino. Incidente de producción 2026-06-10: el build sin
  // VITE_APP_BASE_DOMAIN trataba "eduwanka.net.pe" como el inquilino
  // "eduwanka" y mostraba un aula en vez de la landing del SaaS.
  const TWO_LEVEL_SUFFIXES = [
    'net.pe', 'com.pe', 'org.pe', 'edu.pe', 'gob.pe', 'nom.pe', 'mil.pe',
    'co.uk', 'org.uk', 'com.mx', 'com.ar', 'com.br', 'com.co', 'com.ec',
  ];
  const lastTwo = parts.slice(-2).join('.');
  const minPartsForTenant = TWO_LEVEL_SUFFIXES.includes(lastTwo) ? 4 : 3;

  if (parts.length >= minPartsForTenant && parts[0] !== 'www') {
    return parts[0];
  }

  return null;
}

export function hasActiveTenant(): boolean {
  return getActiveTenantSlug() !== null;
}
