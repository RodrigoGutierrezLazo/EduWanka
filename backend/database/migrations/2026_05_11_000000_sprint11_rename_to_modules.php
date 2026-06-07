<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Rename course_units → course_modules
        Schema::rename('course_units', 'course_modules');

        // 2. Rename unit_sessions → module_sections + rename FK
        Schema::rename('unit_sessions', 'module_sections');
        Schema::table('module_sections', function (Blueprint $table) {
            $table->renameColumn('course_unit_id', 'course_module_id');
        });

        // 3. Rename materials → content_items + rename FK
        Schema::rename('materials', 'content_items');
        Schema::table('content_items', function (Blueprint $table) {
            $table->renameColumn('unit_session_id', 'module_section_id');
        });
    }

    public function down(): void
    {
        Schema::table('content_items', function (Blueprint $table) {
            $table->renameColumn('module_section_id', 'unit_session_id');
        });
        Schema::rename('content_items', 'materials');

        Schema::table('module_sections', function (Blueprint $table) {
            $table->renameColumn('course_module_id', 'course_unit_id');
        });
        Schema::rename('module_sections', 'unit_sessions');

        Schema::rename('course_modules', 'course_units');
    }
};
