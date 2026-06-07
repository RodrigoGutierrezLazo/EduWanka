export function getActiveTenantSlug(): string | null {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // 1. Si es un subdominio de localhost (ej: verde.localhost o azul.localhost)
  if (parts.length === 2 && parts[1] === 'localhost') {
    return parts[0];
  }
  
  // 2. Si estamos en localhost puro o 127.0.0.1 (sin subdominio), permitir fallback de localStorage
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return localStorage.getItem('active_tenant_slug');
  }
  
  // 3. En producción, si tiene subdominio (ej: demo.eduwanka.com), resolvemos el primer segmento
  if (parts.length >= 3) {
    // Asegurarse de que no sea 'www'
    if (parts[0] !== 'www') {
      return parts[0];
    }
  }
  
  return null;
}

export function hasActiveTenant(): boolean {
  return getActiveTenantSlug() !== null;
}
