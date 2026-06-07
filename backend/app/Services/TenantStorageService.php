<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TenantStorageService
{
    protected TenantManager $tenantManager;

    public function __construct(TenantManager $tenantManager)
    {
        $this->tenantManager = $tenantManager;
    }

    protected function getTenantSlug(): string
    {
        $tenant = $this->tenantManager->getTenant();
        return $tenant ? $tenant->slug : 'default';
    }

    /**
     * Store an uploaded file in the tenant's scoped directory.
     */
    public function store(UploadedFile $file, string $folder, ?string $filename = null): string
    {
        $slug = $this->getTenantSlug();
        $path = "{$slug}/{$folder}";

        if ($filename) {
            $extension = $file->getClientOriginalExtension();
            $filenameWithExt = $filename . '.' . $extension;
            return Storage::disk('tenant')->putFileAs($path, $file, $filenameWithExt);
        }

        return Storage::disk('tenant')->putFile($path, $file);
    }

    /**
     * Get the public URL of a file.
     */
    public function url(?string $path): ?string
    {
        if (!$path) {
            return null;
        }
        if (Str::startsWith($path, ['http://', 'https://'])) {
            return $path;
        }
        return Storage::disk('tenant')->url($path);
    }

    /**
     * Delete a file.
     */
    public function delete(?string $path): bool
    {
        if (!$path) {
            return false;
        }
        if (Storage::disk('tenant')->exists($path)) {
            return Storage::disk('tenant')->delete($path);
        }
        return false;
    }
}
