<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchases', function (Blueprint $table): void {
            $table->dropForeign(['course_id']);
            $table->foreign('course_id')
                  ->references('id')
                  ->on('courses')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table): void {
            $table->dropForeign(['course_id']);
            $table->foreign('course_id')
                  ->references('id')
                  ->on('courses')
                  ->cascadeOnDelete();
        });
    }
};
