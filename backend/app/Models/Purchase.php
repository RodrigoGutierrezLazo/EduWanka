<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\BelongsToTenant;
use App\Traits\Auditable;

class Purchase extends Model
{
    use HasFactory, BelongsToTenant, Auditable;

    public const STATUS_PENDING_VALIDATION = 'pending_validation';
    public const STATUS_VALIDATED = 'validated';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_PENDING_PAYMENT = 'pending_payment';
    public const STATUS_PAID = 'paid';

    protected $fillable = [
        'user_id',
        'course_id',
        'course_code',
        'amount',
        'currency',
        'payment_method',
        'payment_provider',
        'status',
        'receipt_path',
        'idempotency_key',
        // Campos del checkout EduWanka
        'payment_modality',
        'bank_entity',
        'operation_number',
        'declared_amount',
        'certificate_delivery',
        'delivery_company',
        'delivery_address',
        'shipping_status',
        'tracking_number',
        'next_course_interest',
        'accepted_terms_at',
        'certification_institution',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'declared_amount'   => 'decimal:2',
            'accepted_terms_at' => 'datetime',
            'paid_at'           => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function statusAudits(): HasMany
    {
        return $this->hasMany(PurchaseStatusAudit::class);
    }
}
