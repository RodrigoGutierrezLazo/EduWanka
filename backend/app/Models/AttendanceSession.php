<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\BelongsToTenant;

class AttendanceSession extends Model
{
    use BelongsToTenant;
    protected $fillable = [
        'course_id',
        'date',
        'start_time',
        'end_time',
        'status',
        'access_code',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function records(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }
}
