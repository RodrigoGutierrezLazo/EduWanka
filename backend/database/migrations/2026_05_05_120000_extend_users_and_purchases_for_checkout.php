<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Extiende `users` y `purchases` con los campos requeridos por el flujo
 * de inscripción de EduWanka (basado en FORMULARIOS INFO.md):
 *
 * Datos del estudiante (van al PERFIL del usuario):
 *   - last_name, city, academic_condition, certification_institution
 *
 * Datos de la compra/inscripción (van a la PURCHASE):
 *   - payment_modality, bank_entity, operation_number, declared_amount
 *   - certificate_delivery, delivery_address, delivery_company,
 *     next_course_interest, accepted_terms_at
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('last_name')->nullable()->after('name');
            $table->string('city')->nullable()->after('phone');
            // Abogado / Bachiller / Estudiante / Otro
            $table->string('academic_condition', 30)->nullable()->after('city');
            // EduWanka / CAJ-Junin / CAJ-Ayacucho / CAJ-Huancavelica
            $table->string('certification_institution', 60)->nullable()->after('academic_condition');
        });

        Schema::table('purchases', function (Blueprint $table): void {
            // Modalidad de pago (formulario EduWanka)
            $table->string('payment_modality', 20)->nullable()->after('payment_method'); // single / installments
            // Detalle del depósito/transferencia
            $table->string('bank_entity', 50)->nullable()->after('payment_modality'); // BBVA, BCP, Yape, Plin, Scotia, Interbank, BancoNacion, presencial
            $table->string('operation_number', 80)->nullable()->after('bank_entity');
            $table->decimal('declared_amount', 10, 2)->nullable()->after('operation_number');
            // Logística del certificado
            $table->string('certificate_delivery', 20)->nullable()->after('declared_amount'); // digital / pickup / delivery
            $table->string('delivery_company', 30)->nullable()->after('certificate_delivery'); // shalom, olva, oficina
            $table->text('delivery_address')->nullable()->after('delivery_company');
            // Lead generation
            $table->string('next_course_interest', 255)->nullable()->after('delivery_address');
            // Aceptación de declaración jurada
            $table->timestamp('accepted_terms_at')->nullable()->after('next_course_interest');
        });
    }

    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table): void {
            $table->dropColumn([
                'payment_modality',
                'bank_entity',
                'operation_number',
                'declared_amount',
                'certificate_delivery',
                'delivery_company',
                'delivery_address',
                'next_course_interest',
                'accepted_terms_at',
            ]);
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn([
                'last_name',
                'city',
                'academic_condition',
                'certification_institution',
            ]);
        });
    }
};
