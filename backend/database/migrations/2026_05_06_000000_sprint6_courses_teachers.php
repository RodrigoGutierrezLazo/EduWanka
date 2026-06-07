<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Tabla de docentes (perfil público) ──────────────────────────
        Schema::create('teachers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('title')->nullable(); // Dr., Dra., Mg., Lic.
            $table->string('specialty')->nullable();
            $table->text('bio')->nullable();
            $table->string('credentials')->nullable();
            $table->string('photo_url')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->boolean('is_featured')->default(false)->index();
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();
        });

        // ── Pivot: docentes visibles en la ficha de un curso ────────────
        Schema::create('course_teacher', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained()->cascadeOnDelete();
            $table->unique(['course_id', 'teacher_id']);
        });

        // ── Expandir cursos ─────────────────────────────────────────────
        Schema::table('courses', function (Blueprint $table): void {
            $table->string('type')->default('Curso')->after('code');       // Curso, Diplomado, Especialidad, Programa
            $table->string('specialty')->nullable()->after('type');         // Área temática
            $table->json('syllabus')->nullable()->after('description');     // JSON array de temas
            $table->json('requirements')->nullable()->after('syllabus');    // JSON array de requisitos
            $table->date('start_date')->nullable()->after('duration_weeks');
            $table->date('end_date')->nullable()->after('start_date');
            $table->unsignedInteger('hours')->nullable()->after('end_date');
            $table->foreignId('teacher_id')->nullable()->after('teacher_name')
                  ->constrained('teachers')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table): void {
            $table->dropForeign(['teacher_id']);
            $table->dropColumn([
                'type', 'specialty', 'syllabus', 'requirements',
                'start_date', 'end_date', 'hours', 'teacher_id',
            ]);
        });

        Schema::dropIfExists('course_teacher');
        Schema::dropIfExists('teachers');
    }
};
