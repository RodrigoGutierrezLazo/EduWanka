<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Hallazgo H-4: Las columnas status, shipping_status y course_code de la tabla
 * purchases carecían de índice, causando full table scan en queries de reportes,
 * historial de pagos y listado de cursos del estudiante.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->index('status');
            $table->index('course_code');
        });

        if (Schema::hasColumn('purchases', 'shipping_status')) {
            Schema::table('purchases', function (Blueprint $table) {
                $table->index('shipping_status');
            });
        }
    }

    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['course_code']);
        });

        if (Schema::hasColumn('purchases', 'shipping_status')) {
            Schema::table('purchases', function (Blueprint $table) {
                $table->dropIndex(['shipping_status']);
            });
        }
    }
};
