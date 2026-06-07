<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuestionnaireQuestionOption extends Model
{
    protected $fillable = [
        'questionnaire_question_id', 'option_text', 'is_correct', 'feedback',
    ];

    protected function casts(): array
    {
        return ['is_correct' => 'boolean'];
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(QuestionnaireQuestion::class, 'questionnaire_question_id');
    }
}
