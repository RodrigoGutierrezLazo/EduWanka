# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# EduWanka — Frontend (React 19 / Vite 6 / TypeScript)
#
# Dockerfile multi-stage con dos formas de uso (ver docker-compose*.yml):
#
#   * target "dev"  -> servidor de desarrollo de Vite con hot-reload y el
#                      proxy a /api, /sanctum, /storage hacia el backend
#                      (igual que "npm run dev" en local). Usado por
#                      docker-compose.override.yml para desarrollo.
#
#   * target "nginx" (por defecto) -> build de produccion ("npm run build")
#                      servido por Nginx, con el mismo proxy reverso hacia el
#                      backend para que la SPA y la API compartan origen tal
#                      como ocurre cuando "dist/" se copia a
#                      "backend/public/spa". Usado por docker-compose.yml.
#
# Ver: Documentacion/PLAN_DOCKERIZACION_Y_PRUEBAS_E2E_CYPRESS.md (Fase D2).
# ---------------------------------------------------------------------------

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------------
# Etapa "dev": usada por docker-compose.override.yml (perfil de desarrollo).
# El codigo se monta como volumen, por lo que aqui solo dejamos node_modules
# listos y exponemos el puerto del dev server (3000, igual que "npm run dev").
# ---------------------------------------------------------------------------
FROM deps AS dev
WORKDIR /app
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---------------------------------------------------------------------------
# Etapa "build": genera los assets estaticos de produccion (dist/).
# ---------------------------------------------------------------------------
FROM deps AS build
WORKDIR /app
COPY . .
# VITE_API_BASE_URL vacio + proxy de Nginx -> SPA y API comparten origen,
# igual que en produccion (ver vite.config.ts y nginx.conf de esta imagen).
ARG VITE_API_BASE_URL=
ARG VITE_APP_BASE_DOMAIN=
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_APP_BASE_DOMAIN=${VITE_APP_BASE_DOMAIN}
RUN npm run build

# ---------------------------------------------------------------------------
# Etapa final "nginx": sirve dist/ y reenvia /api, /sanctum y /storage al
# backend, tal como hace el proxy de Vite en desarrollo (server.proxy en
# vite.config.ts) y como ocurre en produccion al servir la SPA desde Laravel.
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS nginx
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
