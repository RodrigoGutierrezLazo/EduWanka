<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuestionnaireAttempt extends Model
{
    protected $fillable = [
        'user_id', 'questionnaire_id', 'score', 'answers', 'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'answers'      => 'array',
            'score'        => 'integer',
            'completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function questionnaire(): BelongsTo
    {
        return $this->belongsTo(Questionnaire::class);
    }
}
