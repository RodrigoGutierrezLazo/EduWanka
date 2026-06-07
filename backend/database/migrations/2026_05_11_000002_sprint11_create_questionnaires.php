<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Questionnaires
        Schema::create('questionnaires', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('course_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('passing_score')->nullable();
            $table->unsignedSmallInteger('max_attempts')->nullable(); // null = ilimitado
            $table->boolean('immediate_feedback')->default(true);
            $table->timestamps();

            $table->foreign('course_id')->references('id')->on('courses')->cascadeOnDelete();
        });

        // Questionnaire Questions
        Schema::create('questionnaire_questions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('questionnaire_id');
            $table->text('question_text');
            $table->enum('type', ['single', 'multiple', 'true_false'])->default('single');
            $table->unsignedSmallInteger('points')->default(1);
            $table->unsignedInteger('order')->default(0);
            $table->text('explanation')->nullable();
            $table->timestamps();

            $table->foreign('questionnaire_id')->references('id')->on('questionnaires')->cascadeOnDelete();
        });

        // Questionnaire Question Options
        Schema::create('questionnaire_question_options', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('questionnaire_question_id');
            $table->text('option_text');
            $table->boolean('is_correct')->default(false);
            $table->text('feedback')->nullable();
            $table->timestamps();

            $table->foreign('questionnaire_question_id')
                ->references('id')->on('questionnaire_questions')->cascadeOnDelete();
        });

        // Questionnaire Attempts
        Schema::create('questionnaire_attempts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('questionnaire_id');
            $table->unsignedSmallInteger('score')->default(0);
            $table->json('answers'); // { question_id: [option_ids] }
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('questionnaire_id')->references('id')->on('questionnaires')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('questionnaire_attempts');
        Schema::dropIfExists('questionnaire_question_options');
        Schema::dropIfExists('questionnaire_questions');
        Schema::dropIfExists('questionnaires');
    }
};
