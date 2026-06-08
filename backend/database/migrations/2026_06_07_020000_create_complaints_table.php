<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Libro de Reclamaciones (D.S. 011-2011-PCM — Código de Protección y Defensa
 * del Consumidor). Una sola tabla cubre dos ámbitos distinguidos por tenant_id:
 *
 *   - tenant_id = <institución>  → libro de reclamaciones de esa aula/tenant.
 *   - tenant_id = NULL           → libro general de EduWanka (plataforma SaaS).
 *
 * `tenant_id` es nullable a propósito (excepción deliberada a la regla 2.1):
 * el ámbito se asigna explícitamente en el controlador según el origen de la
 * solicitud, NO mediante el trait BelongsToTenant. Ver app/Models/Complaint.php.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('complaints', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // Folio público: RCL-2026-000123

            // Ámbito: NULL = libro general; valor = libro del tenant/institución.
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('course_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            // Indecopi: 'reclamo' (disconformidad con el bien/servicio) | 'queja' (atención)
            $table->enum('type', ['reclamo', 'queja']);

            // Datos del consumidor reclamante (independiente de si está registrado)
            $table->string('full_name');
            $table->string('document_type', 20)->default('DNI'); // DNI, CE, Pasaporte
            $table->string('document_number', 20);
            $table->string('email');
            $table->string('phone', 30)->nullable();
            $table->text('address')->nullable();

            // Datos del menor y su apoderado, si aplica.
            $table->boolean('is_minor')->default(false);
            $table->string('guardian_name')->nullable();
            $table->string('guardian_document_number', 20)->nullable();

            // Detalle del reclamo.
            $table->string('claimed_item');               // Bien o servicio reclamado
            $table->string('claimed_item_type', 20)->default('servicio'); // producto | servicio
            $table->decimal('claimed_amount', 10, 2)->nullable();
            $table->text('detail');                        // Descripción del reclamo/queja
            $table->text('consumer_request');              // Pedido concreto del consumidor

            // Seguimiento y resolución.
            $table->string('status', 20)->default('recibido'); // recibido | en_proceso | resuelto | cerrado
            $table->text('response')->nullable();
            $table->foreignId('responded_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('responded_at')->nullable();

            // Trazabilidad técnica.
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();

            $table->timestamps();

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'created_at']);
            $table->index('document_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('complaints');
    }
};
