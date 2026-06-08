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
            $host = strtolower($request->getHost()); // ej: demo.eduwanka.local, verde.localhost, demo.eduwanka.net.pe o localhost
            $baseDomain = $this->baseDomain();

            if ($baseDomain) {
                // Comparar explícitamente contra el dominio raíz real de la
                // plataforma en vez de adivinar por cantidad de segmentos:
                // sufijos de 2 niveles como ".net.pe"/".com.pe"/".co.uk"
                // hacen que el propio dominio raíz (ej. "eduwanka.net.pe",
                // 3 partes) sea indistinguible de un subdominio de inquilino
                // tipo "demo.eduwanka.net.pe" (también 3 partes) si solo se
                // cuenta el número de segmentos.
                if ($host === $baseDomain || $host === "www.{$baseDomain}") {
                    // Dominio raíz del SaaS: sin slug derivado del host
                    // (cae al inquilino por defecto en el paso 2).
                } elseif (str_ends_with($host, ".{$baseDomain}")) {
                    $sub = substr($host, 0, -(strlen($baseDomain) + 1));
                    $slug = explode('.', $sub)[0];
                    if ($slug !== 'www') {
                        $tenantSlug = $slug;
                    }
                }
                // Si el host no coincide ni es subdominio del dominio base
                // conocido (p.ej. se accedió por IP), no se deduce slug:
                // cae al inquilino por defecto en el paso 2.
            } else {
                $parts = explode('.', $host);

                // Si es un dominio local del tipo algo.localhost, tiene 2 partes
                if (count($parts) === 2 && $parts[1] === 'localhost') {
                    $tenantSlug = $parts[0];
                } elseif (count($parts) >= 3) {
                    // Para demo.eduwanka.local o demo.eduwanka.net.pe
                    if ($parts[0] !== 'www') {
                        $tenantSlug = $parts[0];
                    }
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

    /**
     * Dominio raíz real de la plataforma SaaS (ej: "eduwanka.net.pe"),
     * tomado de TENANT_BASE_DOMAIN o, en su defecto, derivado de APP_URL.
     *
     * Es necesario configurarlo explícitamente porque NO se puede inferir
     * de forma fiable contando segmentos del host: sufijos de dominio de
     * 2 niveles como ".net.pe", ".com.pe" o ".co.uk" hacen que el propio
     * dominio raíz (3 partes) sea indistinguible de un subdominio de
     * inquilino (también 3 partes, ej. "demo.eduwanka.net.pe").
     */
    private function baseDomain(): ?string
    {
        $configured = config('app.tenant_base_domain');
        if ($configured) {
            return strtolower(trim($configured));
        }

        $host = parse_url((string) config('app.url'), PHP_URL_HOST);

        return $host ? strtolower($host) : null;
    }
}
