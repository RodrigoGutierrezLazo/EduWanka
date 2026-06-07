<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Services\TenantManager;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TenantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenantManager = app(TenantManager::class);
        $tenantSlug = $request->header('X-Tenant-Slug');

        // 1. Si no hay header, intentar deducir del host (subdominio)
        if (!$tenantSlug) {
            $host = $request->getHost(); // ej: demo.eduwanka.local, verde.localhost o localhost
            $parts = explode('.', $host);
            
            // Si es un dominio local del tipo algo.localhost, tiene 2 partes
            if (count($parts) === 2 && $parts[1] === 'localhost') {
                $tenantSlug = $parts[0];
            } elseif (count($parts) >= 3) {
                // Para demo.eduwanka.local o demo.eduwanka.com
                if ($parts[0] !== 'www') {
                    $tenantSlug = $parts[0];
                }
            }
        }

        // 2. Si aún no hay slug, usar el primero como default para compatibilidad / fallback
        if (!$tenantSlug) {
            try {
                $defaultTenant = Tenant::where('status', 'active')->first();
                if ($defaultTenant) {
                    $tenantSlug = $defaultTenant->slug;
                }
            } catch (\Exception $e) {
                // Silenciar error si la tabla tenants no existe (ej. en tests sin DB)
            }
        }

        // 3. Resolver y activar inquilino
        if ($tenantSlug) {
            $tenant = Tenant::where('slug', $tenantSlug)->first();

            if (!$tenant) {
                return response()->json([
                    'error' => 'Institution not found.'
                ], 404);
            }

            if ($tenant->status === 'suspended') {
                return response()->json([
                    'error' => 'This institution has been suspended.'
                ], 403);
            }

            $tenantManager->setTenant($tenant);
        }

        return $next($request);
    }
}
