import axios from 'axios';
import { clearAllAuthStorages, getAccessToken } from './auth';

import { getActiveTenantSlug } from './tenant';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const tenantSlug = getActiveTenantSlug();
  if (tenantSlug) {
    config.headers['X-Tenant-Slug'] = tenantSlug;
  }

  return config;
});

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
