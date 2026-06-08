import axios from 'axios';
import { clearAllAuthStorages } from './auth';

import { getActiveTenantSlug } from './tenant';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  withCredentials: true,
  // La API y el SPA siempre comparten origen (proxy en dev, mismo dominio en
  // producción), por lo que es seguro adjuntar el token CSRF de la cookie
  // XSRF-TOKEN en cada petición de escritura (requerido por Sanctum SPA).
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const tenantSlug = getActiveTenantSlug();
  if (tenantSlug) {
    config.headers['X-Tenant-Slug'] = tenantSlug;
  }

  return config;
});

/**
 * Solicita la cookie XSRF-TOKEN antes de operaciones de autenticación
 * (login/registro), tal como requiere el modo SPA de Laravel Sanctum
 * para que las peticiones subsecuentes superen la verificación CSRF.
 */
export async function ensureCsrfCookie(): Promise<void> {
  await apiClient.get('/sanctum/csrf-cookie');
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url ?? '';
      // Don't auto-redirect for login attempts or aula access checks
      if (url.includes('/api/v1/auth/login') || url.includes('/api/v1/aula/access')) {
        return Promise.reject(error);
      }
      clearAllAuthStorages();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);
