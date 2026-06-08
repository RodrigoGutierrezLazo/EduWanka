import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: mode === 'development' ? '/' : '/spa/',
    build: {
      outDir: path.resolve(__dirname, '../backend/public/spa'),
      emptyOutDir: false,
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_DEV_PROXY || 'http://localhost:8000',
          changeOrigin: true,
        },
        '/sanctum': {
          target: env.VITE_DEV_PROXY || 'http://localhost:8000',
          changeOrigin: true,
        },
        '/storage': {
          target: env.VITE_DEV_PROXY || 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
  };
});
