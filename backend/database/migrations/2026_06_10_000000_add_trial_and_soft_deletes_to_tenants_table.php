<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            // Fin del periodo de prueba del plan starter. NULL = cuenta sin
            // trial (tenants legacy creados por superadmin o planes pagados).
            $table->timestamp('trial_ends_at')->nullable()->after('plan');
            // Correo de contacto del dueño del aula (para avisos de trial/facturación)
            $table->string('contact_email')->nullable()->after('trial_ends_at');
            // Offboarding seguro: los tenants se desactivan y purgan después,
            // nunca se borran de inmediato con sus cursos/certificados.
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['trial_ends_at', 'contact_email', 'deleted_at']);
        });
    }
};
