# Análisis, Estrategia y Estado de Migración del Frontend

## Estado de la Migración: COMPLETADA ✅

La integración del frontend de EduWanka con el backend de Laravel se ha completado con éxito, logrando unificar la lógica de comunicación y autenticación sin alterar la interfaz de usuario premium ni las animaciones existentes.

A continuación, se detalla el análisis de la arquitectura de conexión implementada y la estrategia que se ejecutó para lograr esta integración segura.

## 1. Análisis del Proyecto Frontend (Carpeta `frontend/`)

### Stack Tecnológico
*   **Core:** React 19 + Vite.
*   **Lenguaje:** JavaScript puro (sin TypeScript).
*   **Estilos:** CSS estándar puro (no utiliza Tailwind CSS).
*   **Manejo de Estado/API:** `@tanstack/react-query` v5 y `axios` v1.
*   **Enrutamiento:** `react-router-dom`.

### Conexión con el Backend
El proyecto está fuertemente acoplado a un backend en **Laravel** utilizando **Sanctum** para la autenticación:
1.  **Proxy de Desarrollo (`vite.config.js`):** Redirige todas las peticiones a `/api` y `/sanctum` hacia `http://eduwanka.test` o a la URL definida en `VITE_DEV_PROXY`.
2.  **Cliente HTTP (`src/infra/http/apiClient.js`):** 
    *   Utiliza `axios` configurado con `withCredentials: true` (necesario para Sanctum).
    *   Implementa un **interceptor de peticiones** que inyecta automáticamente un token Bearer (`access_token`) extraído de `localStorage` o `sessionStorage` en cada solicitud.
    *   Implementa un **interceptor de respuestas** que captura los errores `401 Unauthorized`. Si el token expira o es inválido, limpia el almacenamiento local y redirige al usuario automáticamente a la página de `/login`.
3.  **Build Target:** Está configurado para compilar sus archivos (`dist`) directamente dentro de la carpeta pública del backend: `../backend/public/spa`.

---

## 2. Diagnóstico de Compatibilidad

**⚠️ Advertencia Importante:** 
Reemplazar tu proyecto actual directamente por el contenido de la carpeta `frontend/` **eliminaría todo el trabajo de diseño moderno** que hemos realizado (Tailwind CSS 4, Framer Motion, tipado estricto con TypeScript, utilidades UI, etc.). El nuevo frontend tiene una UI muy básica con CSS tradicional.

---

## 3. Estrategia de Integración Segura (Paso a Paso)

Para conectar tu frontend actual (el que tiene el diseño hermoso) con el backend, en lugar de reemplazar los archivos, debemos **extraer la lógica de conexión** del nuevo proyecto e inyectarla en el actual. 

Aquí están los pasos para hacerlo sin generar errores:

### Paso 1: Instalar las dependencias de conexión
En tu proyecto actual, debes instalar las librerías que usa el otro proyecto para conectarse al backend:
```bash
npm install axios @tanstack/react-query
```

### Paso 2: Migrar la configuración de Vite
Debemos actualizar tu `vite.config.ts` actual para que sepa cómo comunicarse con Laravel durante el desarrollo y dónde enviar la compilación (si decides servir la web desde Laravel):
```typescript
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_DEV_PROXY || 'http://eduwanka.test';

  return {
    // Si Laravel va a servir el SPA desde una subruta, descomentar la siguiente línea:
    // base: '/spa/', 
    plugins: [react(), tailwindcss()],
    // Si decides que Laravel sirva los estáticos:
    /* build: {
      outDir: path.resolve(__dirname, '../backend/public/spa'),
      emptyOutDir: true,
    }, */
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/sanctum': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
```

### Paso 3: Replicar el Cliente API
Crear un archivo en tu proyecto actual (por ejemplo, `src/lib/apiClient.ts`) adaptando el código de `infra/http/apiClient.js` pero con TypeScript:
```typescript
import axios from 'axios';

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
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url ?? '';
      if (url.includes('/api/v1/auth/login')) {
        return Promise.reject(error);
      }
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Paso 4: Configurar React Query
Envolver tu aplicación en el `QueryClientProvider` dentro de `src/main.tsx` o `src/App.tsx` para poder consumir los endpoints con hooks:
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

// Y dentro del renderizado:
<QueryClientProvider client={queryClient}>
    <App />
</QueryClientProvider>
```

### Conclusión y Estado de Implementación
La integración se ha completado siguiendo exitosamente este diseño:
*   Se instalaron las dependencias necesarias y se configuraron las consultas dinámicas con `@tanstack/react-query`.
*   El cliente HTTP y las utilidades de sesión/tenant se encuentran estructuradas bajo [apiClient.ts](file:///c:/xampp/htdocs/EduWanka/frontend/src/lib/apiClient.ts) y [auth.ts](file:///c:/xampp/htdocs/EduWanka/frontend/src/lib/auth.ts).
*   Se configuró el enrutamiento general en [App.tsx](file:///c:/xampp/htdocs/EduWanka/frontend/src/App.tsx) para admitir flujos de sesión (registro, recuperación de contraseña, inicio de sesión) manteniendo intacto el diseño responsivo premium y las animaciones fluidas del sitio.
