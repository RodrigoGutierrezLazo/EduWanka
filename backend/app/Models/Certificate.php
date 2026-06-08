<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\BelongsToTenant;
use App\Traits\Auditable;

class Certificate extends Model
{
    use HasFactory, BelongsToTenant, Auditable;

    protected $fillable = [
        'user_id',
        'exam_attempt_id',
        'course_id',
        'course_code',
        'score',
        'certificate_code',
        'dni',
        'student_name',
        'grade',
        'file_path',
        'status',
        'revoked_at',
        'revoked_reason',
        'revoked_by_user_id',
        'batch_id',
        'template_name',
        'source_filename',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'revoked_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function examAttempt(): BelongsTo
    {
        return $this->belongsTo(ExamAttempt::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /** Usuario que ejecutó la revocación (puede ser null si no se eligió). */
    public function revokedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'revoked_by_user_id');
    }

    /** Scope: solo certificados activos (no revocados y con estado activo). */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('revoked_at')->where('status', 'active');
    }

    /** Scope: solo certificados revocados. */
    public function scopeRevoked(Builder $query): Builder
    {
        return $query->whereNotNull('revoked_at');
    }

    /** Conveniencia: ¿este certificado fue revocado? */
    public function isRevoked(): bool
    {
        return $this->revoked_at !== null;
    }
}
