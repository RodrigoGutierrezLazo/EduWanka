<?php

namespace App\Traits;

use App\Models\AuditLog;
use App\Services\TenantManager;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(function ($model) {
            $model->logAudit('created', null, $model->getAttributes());
        });

        static::updated(function ($model) {
            $changes = $model->getChanges();
            unset($changes['updated_at']);

            if (empty($changes)) {
                return;
            }

            $oldValues = [];
            $newValues = [];

            foreach ($changes as $key => $newValue) {
                $oldValues[$key] = $model->getOriginal($key);
                $newValues[$key] = $newValue;
            }

            $model->logAudit('updated', $oldValues, $newValues);
        });

        static::deleted(function ($model) {
            $model->logAudit('deleted', $model->getOriginal(), null);
        });
    }

    protected function logAudit(string $action, ?array $oldValues, ?array $newValues): void
    {
        // Omitir contraseñas u otros datos sensibles
        $sensitive = ['password', 'remember_token'];
        if ($oldValues) {
            foreach ($sensitive as $field) {
                unset($oldValues[$field]);
            }
        }
        if ($newValues) {
            foreach ($sensitive as $field) {
                unset($newValues[$field]);
            }
        }

        $tenantManager = app(TenantManager::class);
        $tenantId = $this->tenant_id ?? ($tenantManager->hasTenant() ? $tenantManager->getTenantId() : null);

        AuditLog::create([
            'user_id' => Auth::id(),
            'tenant_id' => $tenantId,
            'action' => $action,
            'model_type' => get_class($this),
            'model_id' => $this->getKey(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }
}
