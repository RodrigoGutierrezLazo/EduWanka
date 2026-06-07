<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Substitute Exams
        Schema::create('substitute_exams', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_exam_id');
            $table->string('title');
            $table->timestamp('opens_at')->nullable();
            $table->timestamp('closes_at')->nullable();
            $table->unsignedSmallInteger('min_failed_score')->default(11); // score below this triggers eligibility
            $table->timestamps();

            $table->foreign('original_exam_id')->references('id')->on('exams')->cascadeOnDelete();
        });

        // Substitute Exam Questions
        Schema::create('substitute_exam_questions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('substitute_exam_id');
            $table->text('question_text');
            $table->unsignedSmallInteger('points')->default(1);
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();

            $table->foreign('substitute_exam_id')->references('id')->on('substitute_exams')->cascadeOnDelete();
        });

        // Substitute Exam Question Options
        Schema::create('substitute_exam_question_options', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('substitute_exam_question_id');
            $table->text('option_text');
            $table->boolean('is_correct')->default(false);
            $table->timestamps();

            $table->foreign('substitute_exam_question_id', 'sub_exam_q_options_fk')
                ->references('id')->on('substitute_exam_questions')->cascadeOnDelete();
        });

        // Substitute Exam Attempts
        Schema::create('substitute_exam_attempts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('substitute_exam_id');
            $table->unsignedSmallInteger('score')->default(0);
            $table->boolean('passed')->default(false);
            $table->json('answers');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('substitute_exam_id')->references('id')->on('substitute_exams')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('substitute_exam_attempts');
        Schema::dropIfExists('substitute_exam_question_options');
        Schema::dropIfExists('substitute_exam_questions');
        Schema::dropIfExists('substitute_exams');
    }
};
