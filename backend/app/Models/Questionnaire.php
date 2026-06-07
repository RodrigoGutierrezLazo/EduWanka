<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Questionnaire extends Model
{
    protected $fillable = [
        'course_id', 'title', 'description',
        'passing_score', 'max_attempts', 'immediate_feedback', 'due_date',
    ];

    protected function casts(): array
    {
        return [
            'immediate_feedback' => 'boolean',
            'due_date' => 'datetime',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(QuestionnaireQuestion::class)->orderBy('order');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(QuestionnaireAttempt::class);
    }
}
