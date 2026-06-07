<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuestionnaireQuestion extends Model
{
    protected $fillable = [
        'questionnaire_id', 'question_text', 'type', 'points', 'order', 'explanation',
    ];

    protected function casts(): array
    {
        return ['points' => 'integer', 'order' => 'integer'];
    }

    public function questionnaire(): BelongsTo
    {
        return $this->belongsTo(Questionnaire::class);
    }

    public function options(): HasMany
    {
        return $this->hasMany(QuestionnaireQuestionOption::class, 'questionnaire_question_id');
    }
}
