<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\BelongsToTenant;

class Specialty extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'image_url',
        'brochure_pdf_path',
        'type',
        'order',
        'custom_sections',
    ];

    protected function casts(): array
    {
        return [
            'order' => 'integer',
            'custom_sections' => 'array',
        ];
    }

    /**
     * Courses in this specialty.
     */
    public function courses(): HasMany
    {
        return $this->hasMany(Course::class, 'specialty_id');
    }

    /**
     * Published courses in this specialty.
     */
    public function publishedCourses(): HasMany
    {
        return $this->hasMany(Course::class, 'specialty_id')->where('is_published', true);
    }
}
