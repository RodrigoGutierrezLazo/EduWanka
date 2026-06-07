<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sprint 9 — Panel de Docente
 *
 * Agrega `assigned_prof_id` a cursos para que el admin pueda designar
 * qué usuario con rol 'prof' es responsable de cada curso.
 * Este campo es distinto de teacher_id (perfil público del docente).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table): void {
            // Usuario (rol=prof) responsable de administrar el contenido del curso.
            // El admin designa esto; sólo este usuario puede crear material,
            // calificar y emitir certificados para este curso.
            $table->foreignId('assigned_prof_id')
                ->nullable()
                ->after('teacher_id')
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table): void {
            $table->dropForeign(['assigned_prof_id']);
            $table->dropColumn('assigned_prof_id');
        });
    }
};
