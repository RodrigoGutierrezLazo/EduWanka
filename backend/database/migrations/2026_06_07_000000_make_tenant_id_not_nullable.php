<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private array $tables = [
        'users',
        'courses',
        'purchases',
        'certificates',
        'specialties',
        'settings',
        'attendance_sessions',
        'teachers',
        'certificate_templates',
    ];

    public function up(): void
    {
        // 1. Asegurar que existe al menos un tenant
        $tenantId = DB::table('tenants')->value('id');

        if (!$tenantId) {
            $tenantId = DB::table('tenants')->insertGetId([
                'name' => 'EduWanka Principal',
                'slug' => 'default',
                'domain' => 'default.eduwanka.local',
                'plan' => 'free',
                'status' => 'active',
                'primary_color' => '#7A0F1F',
                'secondary_color' => '#C8A14A',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 2. Actualizar registros huérfanos con el tenant_id válido
        foreach ($this->tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                DB::table($tableName)
                    ->whereNull('tenant_id')
                    ->update(['tenant_id' => $tenantId]);
            }
        }

        // 3. Alterar columnas a NOT NULL
        $isSqlite = DB::getDriverName() === 'sqlite';

        foreach ($this->tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName, $isSqlite) {
                    if (!$isSqlite) {
                        // Primero eliminamos la clave foránea anterior para poder modificar la columna
                        try {
                            $foreignKeyName = $tableName . '_tenant_id_foreign';
                            $table->dropForeign($foreignKeyName);
                        } catch (\Exception $e) {
                            // Omitir si no existe o falla
                        }
                    }

                    // Modificar la columna a NOT NULL
                    $table->foreignId('tenant_id')->nullable(false)->change();

                    if (!$isSqlite) {
                        // Re-agregar el constraint
                        $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
                    }
                });
            }
        }
    }

    public function down(): void
    {
        $isSqlite = DB::getDriverName() === 'sqlite';

        foreach ($this->tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName, $isSqlite) {
                    if (!$isSqlite) {
                        try {
                            $foreignKeyName = $tableName . '_tenant_id_foreign';
                            $table->dropForeign($foreignKeyName);
                        } catch (\Exception $e) {
                            // Omitir si falla
                        }
                    }

                    $table->foreignId('tenant_id')->nullable(true)->change();

                    if (!$isSqlite) {
                        $table->foreign('tenant_id')->references('id')->on('tenants')->nullOnDelete();
                    }
                });
            }
        }
    }
};
