<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToTenant;

class Setting extends Model
{
    use BelongsToTenant;
    protected $fillable = [
        'key',
        'value',
    ];

    /**
     * Get a setting value.
     */
    public static function getValue(string $key, $default = null): ?string
    {
        $setting = self::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    /**
     * Set a setting value.
     */
    public static function setValue(string $key, ?string $value): self
    {
        return self::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
    }
}
