#!/usr/bin/env sh
# Entrypoint del contenedor backend (Laravel).
#
# Reproduce, de forma automatizada, los pasos manuales descritos en el
# README ("Inicio Rapido Local"): generar APP_KEY, esperar a que MySQL este
# disponible, migrar + sembrar la base de datos, enlazar storage y finalmente
# levantar el servidor. Es idempotente: puede ejecutarse en cada arranque del
# contenedor sin duplicar datos ni romper un estado ya inicializado.
set -e

# ---------------------------------------------------------------------------
# 1. Asegurar que exista un .env (en imagenes construidas para CI/produccion
#    se monta o se copia uno real; en desarrollo local se parte de .env.example
#    si el volumen aun no tiene .env propio).
# ---------------------------------------------------------------------------
if [ ! -f .env ]; then
  echo "[entrypoint] No existe .env, copiando desde .env.example..."
  cp .env.example .env
fi

# ---------------------------------------------------------------------------
# 2. Generar APP_KEY si falta (evita el error "No application encryption key").
# ---------------------------------------------------------------------------
if ! grep -q "^APP_KEY=base64:" .env; then
  echo "[entrypoint] Generando APP_KEY..."
  php artisan key:generate --force
fi

# ---------------------------------------------------------------------------
# 3. Esperar a que el servicio "db" (MySQL) acepte conexiones. Sin este paso,
#    "migrate" falla con "Connection refused" porque el contenedor backend
#    suele arrancar antes de que MySQL termine su inicializacion interna.
# ---------------------------------------------------------------------------
DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-3306}"
echo "[entrypoint] Esperando a que ${DB_HOST}:${DB_PORT} acepte conexiones..."
ATTEMPTS=0
MAX_ATTEMPTS=60
until php -r "exit(@fsockopen('${DB_HOST}', ${DB_PORT}) ? 0 : 1);"; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
    echo "[entrypoint] ERROR: ${DB_HOST}:${DB_PORT} no respondio tras ${MAX_ATTEMPTS} intentos." >&2
    exit 1
  fi
  sleep 2
done
echo "[entrypoint] Base de datos disponible."

# ---------------------------------------------------------------------------
# 4. Migrar y sembrar. "migrate --seed" es seguro de re-ejecutar: Laravel
#    omite las migraciones ya aplicadas y los seeders del proyecto
#    (DatabaseSeeder -> DemoTenantSeeder, LocalDemoSeeder, etc.) usan
#    firstOrCreate/updateOrCreate, por lo que no duplican filas.
# ---------------------------------------------------------------------------
echo "[entrypoint] Ejecutando migraciones y seeders..."
php artisan migrate --seed --force

# ---------------------------------------------------------------------------
# 5. Enlazar storage publico (equivalente a "php artisan storage:link" del
#    setup local), necesario para servir comprobantes, certificados, etc.
# ---------------------------------------------------------------------------
if [ ! -L public/storage ] && [ ! -d public/storage ]; then
  echo "[entrypoint] Creando enlace simbolico storage:link..."
  php artisan storage:link
fi

# ---------------------------------------------------------------------------
# 6. Cache de configuracion/rutas solo si APP_ENV != local (en local conviene
#    poder editar .env / rutas sin recompilar cachés).
# ---------------------------------------------------------------------------
if [ "${APP_ENV}" != "local" ]; then
  echo "[entrypoint] Cacheando configuracion, rutas y vistas (entorno ${APP_ENV})..."
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
fi

echo "[entrypoint] Listo. Levantando servidor en 0.0.0.0:${PORT:-8000}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
