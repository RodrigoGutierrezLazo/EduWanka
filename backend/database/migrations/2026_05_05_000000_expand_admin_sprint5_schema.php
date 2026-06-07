<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table): void {
            $table->string('code')->nullable()->index();
            $table->string('level')->nullable();
            $table->string('image_url')->nullable();
            $table->string('teacher_name')->nullable();
            $table->boolean('is_published')->default(true)->index();
            $table->string('slug')->nullable()->index();
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->string('dni')->nullable()->index();
            $table->string('phone')->nullable();
            $table->string('avatar_url')->nullable();
        });

        Schema::table('certificates', function (Blueprint $table): void {
            $table->string('dni')->nullable()->index();
            $table->string('student_name')->nullable();
            $table->string('grade')->nullable();
            $table->string('file_path')->nullable();
            $table->string('status')->default('active')->index();
            $table->string('batch_id')->nullable()->index();
            $table->string('template_name')->nullable();
            $table->string('source_filename')->nullable();
            $table->text('notes')->nullable();
        });

        Schema::create('attendance_sessions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->string('status', 20)->default('closed')->index();
            $table->string('access_code', 20)->nullable()->index();
            $table->timestamps();
        });

        Schema::create('attendance_records', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('attendance_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('registered_at');
            $table->timestamps();
            $table->unique(['attendance_session_id', 'user_id'], 'attendance_unique_user_session');
        });

        Schema::create('course_units', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();
        });

        Schema::create('unit_sessions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('course_unit_id')->constrained('course_units')->cascadeOnDelete();
            $table->string('title');
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();
        });

        Schema::create('materials', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('unit_session_id')->constrained('unit_sessions')->cascadeOnDelete();
            $table->string('type', 20);
            $table->string('title');
            $table->string('path')->nullable();
            $table->text('url')->nullable();
            $table->timestamps();
        });

        Schema::create('exams', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('course_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('status', 20)->default('open')->index();
            $table->timestamp('opens_at')->nullable();
            $table->timestamp('closes_at')->nullable();
            $table->timestamps();
        });

        Schema::create('password_requests', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('email')->index();
            $table->string('status', 20)->default('pending')->index();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });

        Schema::create('certificate_templates', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('template_path');
            $table->json('fields')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificate_templates');
        Schema::dropIfExists('password_requests');
        Schema::dropIfExists('exams');
        Schema::dropIfExists('materials');
        Schema::dropIfExists('unit_sessions');
        Schema::dropIfExists('course_units');
        Schema::dropIfExists('attendance_records');
        Schema::dropIfExists('attendance_sessions');

        Schema::table('certificates', function (Blueprint $table): void {
            $table->dropColumn([
                'dni',
                'student_name',
                'grade',
                'file_path',
                'status',
                'batch_id',
                'template_name',
                'source_filename',
                'notes',
            ]);
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['dni', 'phone', 'avatar_url']);
        });

        Schema::table('courses', function (Blueprint $table): void {
            $table->dropColumn(['code', 'level', 'image_url', 'teacher_name', 'is_published', 'slug']);
        });
    }
};
