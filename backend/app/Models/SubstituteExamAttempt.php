<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubstituteExamAttempt extends Model
{
    protected $fillable = [
        'user_id', 'substitute_exam_id', 'score', 'passed', 'answers', 'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'answers'      => 'array',
            'score'        => 'integer',
            'passed'       => 'boolean',
            'completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function substituteExam(): BelongsTo
    {
        return $this->belongsTo(SubstituteExam::class);
    }
}
