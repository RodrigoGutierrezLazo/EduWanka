<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Hallazgo 2.6 de la auditoría: dos claves foráneas usaban `cascadeOnDelete`
 * donde provocaba pérdida de datos no deseada.
 *
 * 1) `certificates.exam_attempt_id` → originalmente CASCADE hacia `exam_attempts`.
 *    Esa tabla legacy fue eliminada en la migración 2026_05_12 (limpieza de
 *    exámenes legacy) con las comprobaciones de FK deshabilitadas, dejando una
 *    clave foránea "colgante" hacia una tabla inexistente. Aquí la eliminamos
 *    definitivamente y dejamos la columna como `nullable` sin FK (un certificado
 *    es un documento legal que debe sobrevivir aunque se depure su intento de
 *    examen, y muchos se importan en lote sin intento asociado).
 *
 * 2) `audit_logs.tenant_id` → CASCADE: borrar un tenant eliminaba TODO su
 *    rastro de auditoría, justo lo que un ente regulador querría conservar.
 *    Pasa a `nullOnDelete()` para preservar el historial (el registro queda
 *    huérfano de tenant pero intacto). La columna ya es nullable.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('certificates') && Schema::hasColumn('certificates', 'exam_attempt_id')) {
            // Eliminar la FK colgante si todavía existe (su tabla destino ya no está).
            if ($this->columnHasForeignKey('certificates', 'exam_attempt_id')) {
                Schema::table('certificates', function (Blueprint $table) {
                    $table->dropForeign(['exam_attempt_id']);
                });
            }

            // Garantizar que la columna sea nullable (no debe arrastrar borrados).
            Schema::table('certificates', function (Blueprint $table) {
                $table->unsignedBigInteger('exam_attempt_id')->nullable()->change();
            });

            // Solo re-crear la FK si la tabla destino existe (no es el caso tras
            // la limpieza legacy). Si en el futuro vuelve, será con nullOnDelete.
            if (Schema::hasTable('exam_attempts')) {
                Schema::table('certificates', function (Blueprint $table) {
                    $table->foreign('exam_attempt_id')->references('id')->on('exam_attempts')->nullOnDelete();
                });
            }
        }

        if (Schema::hasTable('audit_logs') && Schema::hasColumn('audit_logs', 'tenant_id')) {
            if ($this->columnHasForeignKey('audit_logs', 'tenant_id')) {
                Schema::table('audit_logs', function (Blueprint $table) {
                    $table->dropForeign(['tenant_id']);
                });
            }
            Schema::table('audit_logs', function (Blueprint $table) {
                $table->foreign('tenant_id')->references('id')->on('tenants')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        // No se restaura la FK colgante de certificates → exam_attempts (la tabla
        // ya no existe). Solo revertimos audit_logs a su CASCADE original.
        if (Schema::hasTable('audit_logs') && Schema::hasColumn('audit_logs', 'tenant_id')) {
            if ($this->columnHasForeignKey('audit_logs', 'tenant_id')) {
                Schema::table('audit_logs', function (Blueprint $table) {
                    $table->dropForeign(['tenant_id']);
                });
            }
            Schema::table('audit_logs', function (Blueprint $table) {
                $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            });
        }
    }

    /**
     * Comprobación de FK independiente del motor (MySQL/SQLite) usando la
     * introspección nativa de Laravel 11.
     */
    private function columnHasForeignKey(string $table, string $column): bool
    {
        foreach (Schema::getForeignKeys($table) as $fk) {
            if (in_array($column, $fk['columns'] ?? [], true)) {
                return true;
            }
        }

        return false;
    }
};
