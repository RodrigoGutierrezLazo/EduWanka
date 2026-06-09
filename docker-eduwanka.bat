@echo off
setlocal

title EduWanka - Docker

set "ROOT=C:\xampp\htdocs\EduWanka"

echo ==========================================
echo   EduWanka - Stack con Docker Compose
echo ==========================================
echo.

if not exist "%ROOT%\docker-compose.yml" (
  echo ERROR: No se encontro docker-compose.yml en:
  echo %ROOT%
  pause
  exit /b 1
)

if not exist "%ROOT%\.env" (
  echo AVISO: No existe ".env" en la raiz del proyecto.
  echo Copiando ".env.docker.example" a ".env"...
  copy "%ROOT%\.env.docker.example" "%ROOT%\.env" > nul
  echo Revisa y ajusta "%ROOT%\.env" antes de continuar si lo necesitas.
  echo.
)

cd /d "%ROOT%"

set "ACTION=%~1"
if "%ACTION%"=="" set "ACTION=up"

if /i "%ACTION%"=="up" (
  echo [Docker] Levantando stack ^(db + backend + frontend^)...
  echo Perfil de DESARROLLO: Vite con hot-reload + phpMyAdmin ^(docker-compose.override.yml^)
  docker compose up --build
  goto :end
)

if /i "%ACTION%"=="up:prod" (
  echo [Docker] Levantando stack en perfil produccion-like ^(SPA servida por Nginx^)...
  docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build
  goto :end
)

if /i "%ACTION%"=="down" (
  echo [Docker] Deteniendo y removiendo contenedores...
  docker compose down
  goto :end
)

if /i "%ACTION%"=="logs" (
  docker compose logs -f
  goto :end
)

if /i "%ACTION%"=="test" (
  echo [Docker] Ejecutando suite de PHPUnit dentro del contenedor backend...
  docker compose exec backend php artisan test
  goto :end
)

if /i "%ACTION%"=="shell" (
  docker compose exec backend bash
  goto :end
)

echo Uso: docker-eduwanka.bat [up^|up:prod^|down^|logs^|test^|shell]
echo   up        Levanta el stack en modo desarrollo ^(por defecto^)
echo   up:prod   Levanta el stack en modo produccion-like ^(Nginx^)
echo   down      Detiene y elimina los contenedores
echo   logs      Muestra los logs de todos los servicios
echo   test      Corre "php artisan test" dentro del contenedor backend
echo   shell     Abre una shell dentro del contenedor backend

:end
echo.
pause
