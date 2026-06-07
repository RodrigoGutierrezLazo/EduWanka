<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('substitute_exams', 'due_date')) {
            Schema::table('substitute_exams', function (Blueprint $table) {
                $table->dateTime('due_date')->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::table('substitute_exams', function (Blueprint $table) {
            $table->dropColumn('due_date');
        });
    }
};
