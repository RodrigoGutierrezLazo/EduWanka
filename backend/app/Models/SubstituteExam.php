<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubstituteExam extends Model
{
    protected $fillable = [
        'original_questionnaire_id', 'title', 'opens_at', 'closes_at', 'min_failed_score', 'due_date',
    ];

    protected function casts(): array
    {
        return [
            'opens_at'        => 'datetime',
            'closes_at'       => 'datetime',
            'due_date'        => 'datetime',
            'min_failed_score'=> 'integer',
        ];
    }

    public function originalQuestionnaire(): BelongsTo
    {
        return $this->belongsTo(Questionnaire::class, 'original_questionnaire_id');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(SubstituteExamQuestion::class)->orderBy('order');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(SubstituteExamAttempt::class);
    }
}
