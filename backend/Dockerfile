# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# EduWanka — Backend (Laravel 11 / PHP 8.2)
#
# Imagen pensada para desarrollo/demo local con docker-compose: instala
# dependencias con Composer, copia el codigo, expone el puerto 8000 y delega
# en docker/entrypoint.sh la inicializacion (APP_KEY, espera de MySQL,
# migrate --seed, storage:link) antes de levantar "php artisan serve".
#
# Ver: docker-compose.yml (servicio "backend") y Documentacion/
#      PLAN_DOCKERIZACION_Y_PRUEBAS_E2E_CYPRESS.md (Fase D1).
# ---------------------------------------------------------------------------

FROM php:8.2-cli AS base

# --- Dependencias del sistema y extensiones de PHP requeridas por composer.json
#     (pdo_mysql: MySQL: mbstring/zip/bcmath/gd: PhpSpreadsheet y FPDI/FPDF;
#      intl: validaciones de formato; exif/xml: dependencias transitivas de gd/zip)
RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        unzip \
        libzip-dev \
        libpng-dev \
        libjpeg62-turbo-dev \
        libfreetype6-dev \
        libicu-dev \
        libonig-dev \
        default-mysql-client \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        pdo_mysql \
        mbstring \
        zip \
        bcmath \
        gd \
        intl \
        exif \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# --- Composer (copiado desde la imagen oficial, sin instalarlo via curl|sh)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# --- Instalar dependencias de PHP primero (mejor cacheo de capas: solo se
#     reinstalan si composer.json/composer.lock cambian, no en cada COPY de codigo)
COPY composer.json composer.lock ./
RUN composer install \
        --no-dev \
        --no-interaction \
        --no-progress \
        --no-scripts \
        --optimize-autoloader

# --- Copiar el resto del codigo de la aplicacion
COPY . .

# --- Volver a ejecutar el discover de paquetes ahora que el codigo esta completo
RUN composer dump-autoload --optimize \
    && php artisan package:discover --ansi || true

# --- Permisos de escritura para Laravel (storage/, bootstrap/cache/)
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R ug+rwx storage bootstrap/cache

RUN chmod +x docker/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["docker/entrypoint.sh"]
