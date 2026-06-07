<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('questionnaires', 'due_date')) {
            Schema::table('questionnaires', function (Blueprint $table) {
                $table->dateTime('due_date')->nullable()->after('immediate_feedback');
            });
        }
    }

    public function down(): void
    {
        Schema::table('questionnaires', function (Blueprint $table) {
            $table->dropColumn('due_date');
        });
    }
};
