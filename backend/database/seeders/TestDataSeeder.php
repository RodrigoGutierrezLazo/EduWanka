<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Course;
use App\Models\Purchase;
use Illuminate\Database\Seeder;

class TestDataSeeder extends Seeder
{
    public function run()
    {
        // Usuarios de prueba (si no existen)
        $users = [
            ['email' => 'student@eduwanka.local', 'role' => 'student', 'name' => 'Student'],
            ['email' => 'prof@eduwanka.local', 'role' => 'prof', 'name' => 'Professor'],
            ['email' => 'admin@eduwanka.local', 'role' => 'admin', 'name' => 'Admin'],
            ['email' => 'superadmin@eduwanka.local', 'role' => 'superadmin', 'name' => 'Superadmin'],
        ];

        foreach ($users as $userData) {
            User::firstOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'role' => $userData['role'],
                    'password' => bcrypt('Password123!'),
                    'email_verified_at' => now(),
                ]
            );
        }

        // Crear 5 cursos si no existen
        $courses = [
            ['title' => 'Curso Básico 1', 'description' => 'Descripción', 'price' => 50, 'duration_weeks' => 4],
            ['title' => 'Curso Avanzado 2', 'description' => 'Descripción', 'price' => 100, 'duration_weeks' => 8],
            ['title' => 'Curso Especializado 3', 'description' => 'Descripción', 'price' => 150, 'duration_weeks' => 12],
            ['title' => 'Curso Intermedio 4', 'description' => 'Descripción', 'price' => 75, 'duration_weeks' => 6],
            ['title' => 'Curso Premium 5', 'description' => 'Descripción', 'price' => 200, 'duration_weeks' => 16],
        ];

        foreach ($courses as $courseData) {
            Course::firstOrCreate(
                ['title' => $courseData['title']],
                $courseData
            );
        }

        // Crear compras de prueba
        $student = User::where('email', 'student@eduwanka.local')->first();
        $courses = Course::all();

        foreach ($courses->take(3) as $course) {
            Purchase::firstOrCreate(
                ['user_id' => $student->id, 'course_id' => $course->id],
                [
                    'amount' => $course->price,
                    'status' => 'validated',
                    'idempotency_key' => 'seed-purchase-'.$student->id.'-'.$course->id,
                ]
            );
        }

        // Crear 1 compra pendiente
        Purchase::firstOrCreate(
            ['user_id' => $student->id, 'course_id' => $courses[3]->id],
            [
                'amount' => $courses[3]->price,
                'status' => 'pending_validation',
                'idempotency_key' => 'seed-purchase-'.$student->id.'-'.$courses[3]->id,
            ]
        );
    }
}
