<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CertificateTemplate extends Model
{
    use BelongsToTenant, Auditable;

    protected $fillable = [
        'name',
        'template_path',
        'fields',
        'created_by_user_id',
        'tenant_id',
    ];

    protected function casts(): array
    {
        return [
            'fields' => 'array',
        ];
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
