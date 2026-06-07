<?php

namespace App\Traits;

use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use App\Services\TenantManager;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToTenant
{
    public static function bootBelongsToTenant(): void
    {
        static::addGlobalScope(new TenantScope());

        static::creating(function ($model) {
            $tenantManager = app(TenantManager::class);
            if (!$model->tenant_id) {
                if ($tenantManager->hasTenant()) {
                    $model->tenant_id = $tenantManager->getTenantId();
                } else {
                    // Fallback al primer tenant en la base de datos (útil en tests, seeders o desarrollo local)
                    try {
                        $firstTenantId = \Illuminate\Support\Facades\DB::table('tenants')->value('id');
                        if ($firstTenantId) {
                            $model->tenant_id = $firstTenantId;
                        }
                    } catch (\Exception $e) {
                        // Evitar fallar si la tabla no existe durante migraciones iniciales
                    }
                }
            }
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
