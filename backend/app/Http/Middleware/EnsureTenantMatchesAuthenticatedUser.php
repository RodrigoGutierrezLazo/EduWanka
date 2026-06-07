<?php

namespace App\Http\Middleware;

use App\Services\TenantManager;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantMatchesAuthenticatedUser
{
    /**
     * Verifica que el tenant resuelto por TenantMiddleware (header/host) coincida
     * con el tenant_id del usuario autenticado, evitando que un usuario de un
     * inquilino acceda a datos de otro simplemente enviando otro X-Tenant-Slug.
     *
     * Debe ejecutarse después de auth:sanctum, ya que TenantMiddleware corre
     * como middleware global (antes de que el usuario sea resuelto).
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $tenant = app(TenantManager::class)->getTenant();

        if ($user && $tenant && $user->role !== 'superadmin' && $user->tenant_id !== $tenant->id) {
            return response()->json([
                'message' => 'Forbidden',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
