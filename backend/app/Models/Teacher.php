<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Traits\BelongsToTenant;

class Teacher extends Model
{
    use BelongsToTenant;
    protected $fillable = [
        'user_id',
        'name',
        'title',
        'specialty',
        'bio',
        'credentials',
        'photo_url',
        'email',
        'phone',
        'is_featured',
        'display_order',
    ];

    protected function casts(): array
    {
        return [
            'is_featured' => 'boolean',
            'display_order' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function courses(): BelongsToMany
    {
        return $this->belongsToMany(Course::class, 'course_teacher');
    }

    /**
     * Cursos donde este docente es el principal.
     */
    public function mainCourses(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Course::class, 'teacher_id');
    }
}
