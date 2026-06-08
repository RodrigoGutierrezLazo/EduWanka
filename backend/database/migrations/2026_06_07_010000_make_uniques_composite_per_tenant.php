<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Hallazgo 2.1 de la auditoría: varias columnas eran únicas a nivel GLOBAL
 * cuando deberían serlo únicamente POR TENANT. En un SaaS multi-inquilino,
 * dos instituciones distintas deben poder tener, por ejemplo, un usuario con
 * el mismo correo, una especialidad con el mismo slug, o reutilizar un código
 * de certificado/idempotencia sin colisionar entre sí.
 *
 * La unicidad real ya queda garantizada dentro de cada tenant gracias al
 * `TenantScope` global (ver App\Models\Scopes\TenantScope), por lo que mover
 * estos índices a compuestos `(tenant_id, columna)` es coherente con el resto
 * del modelo de datos. `tenant_id` ya es NOT NULL en todas estas tablas
 * (migración 2026_06_07_000000), requisito para un índice único compuesto fiable.
 *
 * ⚠️ Antes de ejecutar en un entorno con datos reales: verificar que no existan
 * colisiones que ya violen la nueva regla compuesta (mismo tenant_id + mismo
 * valor duplicado). En una base limpia o con datos consistentes no aplica.
 */
return new class extends Migration
{
    /**
     * Tabla => [nombreIndiceUnicoActual, columna]
     */
    private array $map = [
        'users'        => ['users_email_unique', 'email'],
        'specialties'  => ['specialties_slug_unique', 'slug'],
        'certificates' => ['certificates_certificate_code_unique', 'certificate_code'],
        'purchases'    => ['purchases_idempotency_key_unique', 'idempotency_key'],
    ];

    public function up(): void
    {
        foreach ($this->map as $tableName => [$oldIndex, $column]) {
            if (!Schema::hasTable($tableName) || !Schema::hasColumn($tableName, 'tenant_id')) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) use ($oldIndex, $column) {
                $table->dropUnique($oldIndex);
                $table->unique(['tenant_id', $column]);
            });
        }
    }

    public function down(): void
    {
        foreach ($this->map as $tableName => [$oldIndex, $column]) {
            if (!Schema::hasTable($tableName) || !Schema::hasColumn($tableName, 'tenant_id')) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) use ($oldIndex, $column) {
                // Pasar el array de columnas deja que Laravel resuelva el nombre
                // autogenerado del índice compuesto (`{tabla}_tenant_id_{col}_unique`).
                $table->dropUnique(['tenant_id', $column]);
                // Restaurar el índice único global original con su nombre exacto.
                $table->unique($column, $oldIndex);
            });
        }
    }
};
