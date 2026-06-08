<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\EnsureUserHasRole;
use App\Http\Middleware\EnsureTenantMatchesAuthenticatedUser;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'role' => EnsureUserHasRole::class,
            'tenant' => \App\Http\Middleware\TenantMiddleware::class,
            'tenant.verify' => EnsureTenantMatchesAuthenticatedUser::class,
        ]);
        $middleware->prepend(\App\Http\Middleware\TenantMiddleware::class);
        // Habilita autenticación basada en cookies httpOnly (sesión) para el SPA,
        // en lugar de exponer tokens de API en el almacenamiento del navegador.
        $middleware->statefulApi();

        // Esta aplicación es una API + SPA: no existe una ruta nombrada `login`
        // en el servidor (el login se renderiza enteramente en React, ver
        // `frontend/src/pages/Login.tsx` y la ruta `/login` en App.tsx; el
        // catch-all de `routes/web.php` sirve `index.html` para cualquier ruta
        // que no sea api|sanctum|storage). El valor por defecto de Laravel
        // (`redirectGuestsTo(fn () => route('login'))`, registrado en
        // ApplicationBuilder::withMiddleware) intenta resolver `route('login')`
        // -lanzando RouteNotFoundException, que se traduce en un 500- cada vez
        // que `Authenticate`/`AuthenticateSession` deben redirigir a un invitado
        // no autenticado y la petición no se reconoce como "espera JSON" (p.ej.
        // un fetch sin cabecera `Accept: application/json` ni
        // `X-Requested-With: XMLHttpRequest`, como el que emitiría un script
        // inyectado por XSS o un cliente mal configurado). Sobrescribimos el
        // destino por una ruta de la SPA: las peticiones JSON siguen recibiendo
        // un 401 limpio (`{"message": "Unauthenticated."}`), y cualquier otra
        // petición de navegador se redirige a `/login`, donde el router de
        // React muestra la pantalla real de inicio de sesión.
        $middleware->redirectGuestsTo('/login');
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
