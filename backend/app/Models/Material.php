<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Material extends Model
{
    protected $fillable = [
        'unit_session_id',
        'type',
        'title',
        'path',
        'url',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(UnitSession::class, 'unit_session_id');
    }
}
