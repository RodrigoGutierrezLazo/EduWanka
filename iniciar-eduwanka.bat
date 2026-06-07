@echo off
setlocal

title EduWanka - Inicio rapido

set "ROOT=C:\xampp\htdocs\EduWanka"
set "BACKEND=%ROOT%\backend"
set "FRONTEND=%ROOT%\frontend"
set "XAMPP=C:\xampp"

echo ==========================================
echo   EduWanka - Inicio rapido del sistema
echo ==========================================
echo.

if not exist "%BACKEND%\artisan" (
  echo ERROR: No se encontro el backend en:
  echo %BACKEND%
  pause
  exit /b 1
)

if not exist "%FRONTEND%\package.json" (
  echo ERROR: No se encontro el frontend en:
  echo %FRONTEND%
  pause
  exit /b 1
)

echo [1/4] Iniciando MySQL de XAMPP...
if exist "%XAMPP%\mysql_start.bat" (
  start "EduWanka - MySQL XAMPP" cmd /k "cd /d %XAMPP% && mysql_start.bat"
) else (
  echo AVISO: No se encontro %XAMPP%\mysql_start.bat
  echo Inicia MySQL manualmente desde el panel de XAMPP.
)

echo.
echo [2/4] Iniciando backend Laravel en http://localhost:8000 ...
start "EduWanka - Backend Laravel" cmd /k "cd /d %BACKEND% && php artisan serve --port=8000"

echo.
echo [3/4] Esperando unos segundos antes de iniciar el frontend...
timeout /t 4 /nobreak > nul

echo.
echo [4/4] Iniciando frontend Vite...
start "EduWanka - Frontend Vite" cmd /k "cd /d %FRONTEND% && npm run dev"

echo.
echo Listo. Abre la URL que muestre la ventana del frontend.
echo Normalmente sera:
echo   http://localhost:3000
echo.
echo Si el puerto 3000 esta ocupado, Vite puede usar 3001, 3002, etc.
echo.
echo Credenciales demo:
echo   admin@eduwanka.local
echo   Password123!
echo.
pause
