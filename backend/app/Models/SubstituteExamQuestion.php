<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubstituteExamQuestion extends Model
{
    protected $fillable = ['substitute_exam_id', 'question_text', 'points', 'order'];

    protected function casts(): array
    {
        return ['points' => 'integer', 'order' => 'integer'];
    }

    public function substituteExam(): BelongsTo
    {
        return $this->belongsTo(SubstituteExam::class);
    }

    public function options(): HasMany
    {
        return $this->hasMany(SubstituteExamQuestionOption::class, 'substitute_exam_question_id');
    }
}
