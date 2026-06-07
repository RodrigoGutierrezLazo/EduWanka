<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UnitSession extends Model
{
    protected $fillable = [
        'course_unit_id',
        'title',
        'order',
    ];

    public function unit(): BelongsTo
    {
        return $this->belongsTo(CourseUnit::class, 'course_unit_id');
    }

    public function materials(): HasMany
    {
        return $this->hasMany(Material::class);
    }
}
