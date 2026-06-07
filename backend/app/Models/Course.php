<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\BelongsToTenant;

class Course extends Model
{
    use HasFactory, BelongsToTenant;
    protected $fillable = [
        'title',
        'code',
        'type',
        'specialty',
        'specialty_id',
        'description',
        'syllabus',
        'requirements',
        'price',
        'duration_weeks',
        'start_date',
        'end_date',
        'hours',
        'level',
        'image_url',
        'teacher_name',
        'teacher_id',
        'assigned_prof_id',
        'certificate_template_id',
        'is_published',
        'slug',
    ];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'price' => 'decimal:2',
            'syllabus' => 'array',
            'requirements' => 'array',
            'start_date' => 'date',
            'end_date' => 'date',
            'hours' => 'integer',
        ];
    }

    // ── Relaciones ──────────────────────────────────────────────────

    /** Especialidad asociada al curso. */
    public function specialty(): BelongsTo
    {
        return $this->belongsTo(Specialty::class, 'specialty_id');
    }

    /** Docente principal del curso. */
    public function mainTeacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'teacher_id');
    }

    /** Usuario (rol=prof) designado por el admin para administrar el contenido del curso. */
    public function assignedProf(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_prof_id');
    }

    /** Plantilla de certificado por defecto para este curso. */
    public function certificateTemplate(): BelongsTo
    {
        return $this->belongsTo(CertificateTemplate::class);
    }

    /** Docentes visibles en la ficha del curso (pivot). */
    public function teachers(): BelongsToMany
    {
        return $this->belongsToMany(Teacher::class, 'course_teacher');
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class);
    }

    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class);
    }

    public function attendanceSessions(): HasMany
    {
        return $this->hasMany(AttendanceSession::class);
    }

    /** NEW — Sprint 11: Módulos del curso (Moodle-like). */
    public function modules(): HasMany
    {
        return $this->hasMany(CourseModule::class)->orderBy('order');
    }

    /** LEGACY alias — mantener 1 sprint para compatibilidad con clientes anteriores. */
    public function units(): HasMany
    {
        return $this->modules();
    }
}
