<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubstituteExamQuestionOption extends Model
{
    protected $fillable = ['substitute_exam_question_id', 'option_text', 'is_correct'];

    protected function casts(): array
    {
        return ['is_correct' => 'boolean'];
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(SubstituteExamQuestion::class, 'substitute_exam_question_id');
    }
}
