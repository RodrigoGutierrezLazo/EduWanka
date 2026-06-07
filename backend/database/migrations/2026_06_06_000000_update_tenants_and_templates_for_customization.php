<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->json('payment_methods')->nullable()->after('status');
        });

        Schema::table('certificate_templates', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('fields')->constrained('tenants')->nullOnDelete();
            $table->string('template_path')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('certificate_templates', function (Blueprint $table) {
            $table->dropForeign(['certificate_templates_tenant_id_foreign']);
            $table->dropColumn('tenant_id');
            $table->string('template_path')->nullable(false)->change();
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('payment_methods');
        });
    }
};
