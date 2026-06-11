<?php

namespace App\Http\Controllers\Api\V1\Tenants;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;

/**
 * Alta self-service de instituciones (auditoría 2026-06-10, hallazgo 1.1):
 * la landing promete "crea tu aula en minutos" — este endpoint lo hace real.
 * Crea el tenant + su usuario admin + trial de 30 días en una transacción.
 */
class TenantRegistrationController extends Controller
{
    /**
     * Subdominios que no pueden usarse como slug de aula.
     */
    private const RESERVED_SLUGS = [
        'www', 'api', 'app', 'admin', 'mail', 'smtp', 'ftp', 'ns1', 'ns2',
        'aula', 'login', 'registro', 'soporte', 'status', 'docs', 'cdn',
        'static', 'assets', 'storage', 'superadmin', 'eduwanka',
    ];

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'institution_name' => ['required', 'string', 'max:255'],
            'slug' => [
                'required', 'string', 'min:3', 'max:30',
                'regex:/^[a-z0-9](?:-?[a-z0-9])*$/',
                'unique:tenants,slug',
                function ($attribute, $value, $fail) {
                    if (in_array($value, self::RESERVED_SLUGS, true)) {
                        $fail('Ese subdominio está reservado, elige otro.');
                    }
                },
            ],
            'name' => ['required', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'phone' => ['nullable', 'string', 'max:20'],
        ], [
            'slug.regex' => 'El subdominio solo puede contener minúsculas, números y guiones.',
            'slug.unique' => 'Ese subdominio ya está en uso, elige otro.',
        ]);

        [$tenant, $admin] = DB::transaction(function () use ($data) {
            $tenant = Tenant::create([
                'name' => $data['institution_name'],
                'slug' => $data['slug'],
                'plan' => 'starter',
                'status' => 'active',
                'trial_ends_at' => now()->addDays(30),
                'contact_email' => $data['email'],
            ]);

            // tenant_id se asigna por propiedad (no por fillable) para que el
            // hook de BelongsToTenant no lo pise con el tenant del contexto.
            $admin = new User([
                'name' => $data['name'],
                'last_name' => $data['last_name'] ?? '',
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => 'admin',
                'phone' => $data['phone'] ?? null,
            ]);
            $admin->tenant_id = $tenant->id;
            $admin->save();

            return [$tenant, $admin];
        });

        return response()->json([
            'message' => '¡Tu aula virtual fue creada! Tienes 30 días de prueba gratis.',
            'data' => [
                'tenant' => [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                    'plan' => $tenant->plan,
                    'trial_ends_at' => $tenant->trial_ends_at?->toIso8601String(),
                ],
                'admin' => [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                ],
                'aula_url' => $this->aulaUrl($tenant),
            ],
        ], 201);
    }

    public function checkSlug(Request $request): JsonResponse
    {
        $slug = Str::slug((string) $request->query('slug', ''));

        if (strlen($slug) < 3) {
            return response()->json([
                'available' => false,
                'slug' => $slug,
                'reason' => 'El subdominio debe tener al menos 3 caracteres.',
            ]);
        }

        $reserved = in_array($slug, self::RESERVED_SLUGS, true);
        $taken = Tenant::withTrashed()->where('slug', $slug)->exists();

        return response()->json([
            'available' => !$reserved && !$taken,
            'slug' => $slug,
            'reason' => $reserved
                ? 'Ese subdominio está reservado.'
                : ($taken ? 'Ese subdominio ya está en uso.' : null),
        ]);
    }

    private function aulaUrl(Tenant $tenant): string
    {
        $baseDomain = config('app.tenant_base_domain')
            ?: parse_url((string) config('app.url'), PHP_URL_HOST)
            ?: 'eduwanka.net.pe';

        return "https://{$tenant->slug}.{$baseDomain}";
    }
}
