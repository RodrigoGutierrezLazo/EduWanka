<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Reclamo/queja del Libro de Reclamaciones.
 *
 * IMPORTANTE: este modelo NO usa el trait BelongsToTenant a propósito. A
 * diferencia del resto del sistema (donde tenant_id es obligatorio, ver
 * hallazgo 2.1), aquí `tenant_id` puede ser NULL para representar el libro
 * GENERAL de EduWanka (la plataforma SaaS), separado de los libros por aula.
 * El ámbito se asigna explícitamente en el controlador según el origen de la
 * solicitud. Por eso tampoco aplica el TenantScope global: las consultas se
 * acotan manualmente con los scopes `general()` / `forTenant()`.
 *
 * Sí usa Auditable para dejar rastro de cambios de estado y respuestas, que es
 * justamente lo que un ente regulador (Indecopi) pediría en una fiscalización.
 */
class Complaint extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'code', 'tenant_id', 'course_id', 'user_id', 'type',
        'full_name', 'document_type', 'document_number', 'email', 'phone', 'address',
        'is_minor', 'guardian_name', 'guardian_document_number',
        'claimed_item', 'claimed_item_type', 'claimed_amount', 'detail', 'consumer_request',
        'status', 'response', 'responded_by_user_id', 'responded_at',
        'ip_address', 'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'is_minor' => 'boolean',
            'claimed_amount' => 'decimal:2',
            'responded_at' => 'datetime',
        ];
    }

    public const STATUSES = ['recibido', 'en_proceso', 'resuelto', 'cerrado'];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function respondedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responded_by_user_id');
    }

    /** Libro general de EduWanka (sin tenant). */
    public function scopeGeneral($query)
    {
        return $query->whereNull('tenant_id');
    }

    /** Libro de un tenant/institución concreto. */
    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Genera el siguiente folio público correlativo, con formato
     * RCL-{año}-{secuencial de 6 dígitos}. El secuencial es GLOBAL por año
     * (no por ámbito) para garantizar que el folio sea único de forma global
     * —`code` tiene un índice único global—, de modo que un mismo folio nunca
     * identifique a dos reclamos distintos aunque pertenezcan a libros (tenants)
     * diferentes. El parámetro de ámbito se conserva por compatibilidad futura.
     */
    public static function generateCode(?int $tenantId = null): string
    {
        $year = now()->year;

        $count = static::query()
            ->whereYear('created_at', $year)
            ->count();

        return sprintf('RCL-%d-%06d', $year, $count + 1);
    }
}
