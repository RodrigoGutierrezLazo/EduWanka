<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ModuleSection extends Model
{
    protected $table = 'module_sections';

    protected $fillable = [
        'course_module_id',
        'title',
        'order',
    ];

    protected function casts(): array
    {
        return [
            'order' => 'integer',
        ];
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(CourseModule::class, 'course_module_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(ContentItem::class, 'module_section_id')->orderBy('order');
    }
    public function materials(): HasMany
    {
        return $this->items();
    }
}
