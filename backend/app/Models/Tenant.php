<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tenant extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'domain',
        'plan',
        'trial_ends_at',
        'contact_email',
        'logo_path',
        'primary_color',
        'secondary_color',
        'status',
        'payment_methods',
    ];

    protected function casts(): array
    {
        return [
            'payment_methods' => 'array',
            'trial_ends_at' => 'datetime',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }

    /**
     * El tenant está dentro de su periodo de prueba.
     * NULL en trial_ends_at significa cuenta sin trial (legacy o pagada).
     */
    public function onTrial(): bool
    {
        return $this->trial_ends_at !== null && $this->trial_ends_at->isFuture();
    }

    /**
     * El periodo de prueba terminó y el tenant sigue en plan starter.
     */
    public function trialExpired(): bool
    {
        return $this->plan === 'starter'
            && $this->trial_ends_at !== null
            && $this->trial_ends_at->isPast();
    }
}
