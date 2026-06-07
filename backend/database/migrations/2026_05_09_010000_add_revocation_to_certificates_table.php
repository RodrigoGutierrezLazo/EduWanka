<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Agrega columnas de revocación a la tabla certificates.
 *
 * - revoked_at: timestamp nullable que marca cuándo fue revocado
 * - revoked_reason: motivo libre escrito por el admin
 * - revoked_by_user_id: usuario que ejecutó la revocación (auditoría)
 *
 * No es destructivo: todos los certificados existentes quedarán con
 * revoked_at = NULL (o sea, válidos). El estado 'active' se conserva.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->timestamp('revoked_at')->nullable()->after('status');
            $table->text('revoked_reason')->nullable()->after('revoked_at');
            $table->foreignId('revoked_by_user_id')
                ->nullable()
                ->after('revoked_reason')
                ->constrained('users')
                ->nullOnDelete();

            // Índice para búsquedas rápidas de certificados activos
            $table->index('revoked_at', 'certificates_revoked_at_index');
        });
    }

    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->dropIndex('certificates_revoked_at_index');
            $table->dropForeign(['revoked_by_user_id']);
            $table->dropColumn(['revoked_at', 'revoked_reason', 'revoked_by_user_id']);
        });
    }
};
