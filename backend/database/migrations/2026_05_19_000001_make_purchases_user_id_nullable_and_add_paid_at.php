<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchases', function (Blueprint $table): void {
            // Permitir user_id nullable para preservar pagos cuando se elimina un usuario
            $table->unsignedBigInteger('user_id')->nullable()->change();

            // Registrar fecha de pago al validar
            $table->timestamp('paid_at')->nullable()->after('status');
        });

        // Cambiar cascade a set null
        Schema::table('purchases', function (Blueprint $table): void {
            $table->dropForeign(['user_id']);
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table): void {
            $table->dropForeign(['user_id']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->dropColumn('paid_at');
        });
    }
};
