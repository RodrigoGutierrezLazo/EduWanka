<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class CourseFactory extends Factory
{
    public function definition(): array
    {
        $title = $this->faker->sentence(3);
        return [
            'title' => $title,
            'code' => 'COURSE-' . strtoupper(Str::random(5)),
            'slug' => Str::slug($title),
            'description' => $this->faker->paragraph,
            'price' => $this->faker->randomFloat(2, 100, 500),
            'is_published' => true,
            'level' => 'intermedio',
            'duration_weeks' => 10,
            'tenant_id' => \App\Models\Tenant::first()?->id ?? \App\Models\Tenant::create([
                'name' => 'Default Test Tenant',
                'slug' => 'default-test',
                'status' => 'active',
            ])->id,
        ];
    }
}
