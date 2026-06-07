<?php

namespace Database\Factories;

use App\Models\Purchase;
use App\Models\User;
use App\Models\Course;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PurchaseFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'course_code' => 'DEMO-CODE',
            'amount' => 1,
            'currency' => 'PEN',
            'payment_method' => 'bank_transfer',
            'status' => Purchase::STATUS_PENDING_VALIDATION,
            'idempotency_key' => 'purchase-' . Str::uuid(),
            'tenant_id' => \App\Models\Tenant::first()?->id ?? \App\Models\Tenant::create([
                'name' => 'Default Test Tenant',
                'slug' => 'default-test',
                'status' => 'active',
            ])->id,
        ];
    }
}
