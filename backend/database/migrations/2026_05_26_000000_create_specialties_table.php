<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('specialties', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('image_url')->nullable();
            $table->string('type')->default('derecho'); // 'formacion' or 'derecho'
            $table->integer('order')->default(0);
            $table->json('custom_sections')->nullable(); // Stores all the customizable sections for 'formacion' pages
            $table->timestamps();
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->foreignId('specialty_id')->nullable()->constrained('specialties')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropForeign(['specialty_id']);
            $table->dropColumn('specialty_id');
        });

        Schema::dropIfExists('specialties');
    }
};
