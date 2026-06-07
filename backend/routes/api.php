<?php

use App\Http\Controllers\Api\V1\HealthCheckController;
use App\Http\Controllers\Api\V1\AdminPingController;
use App\Http\Controllers\Api\V1\ProfPingController;
use App\Http\Controllers\Api\V1\PublicCoursesController;
use App\Http\Controllers\Api\V1\PublicTeachersController;
use App\Http\Controllers\Api\V1\Auth\LoginController;
use App\Http\Controllers\Api\V1\Auth\LogoutController;
use App\Http\Controllers\Api\V1\Auth\MeController;
use App\Http\Controllers\Api\V1\Auth\RegisterController;
use App\Http\Controllers\Api\V1\Auth\ForgotPasswordController;
use App\Http\Controllers\Api\V1\Auth\ResetPasswordController;
use App\Http\Controllers\Api\V1\Aula\AulaAccessController;
use App\Http\Controllers\Api\V1\Learning\LatestCertificateController;
use App\Http\Controllers\Api\V1\Learning\VerifyCertificateController;
use App\Http\Controllers\Api\V1\Payments\CulqiReadinessController;
use App\Http\Controllers\Api\V1\Payments\TransitionPurchaseStatusController;
use App\Http\Controllers\Api\V1\Purchases\RegisterPurchaseController;
use App\Http\Controllers\Api\V1\Admin\AdminAttendanceController;
use App\Http\Controllers\Api\V1\Admin\AdminCertificatesController;
use App\Http\Controllers\Api\V1\Admin\AdminCoursesController;
use App\Http\Controllers\Api\V1\Admin\AdminMaterialsController;
use App\Http\Controllers\Api\V1\Admin\AdminPasswordRequestsController;
use App\Http\Controllers\Api\V1\Admin\AdminPaymentsController;
use App\Http\Controllers\Api\V1\Admin\AdminReportsController;
use App\Http\Controllers\Api\V1\Admin\AdminEnrollmentController;
use App\Http\Controllers\Api\V1\Admin\AdminTeachersController;
use App\Http\Controllers\Api\V1\Admin\AdminUsersController;
use App\Http\Controllers\Api\V1\Admin\AdminSpecialtyController;
use App\Http\Controllers\Api\V1\PublicSpecialtiesController;
use App\Http\Controllers\Api\V1\Professor\ProfessorProfileController;
// Sprint 11 — Módulos tipo Moodle
use App\Http\Controllers\Api\V1\Modules\ModuleManagementController;
use App\Http\Controllers\Api\V1\Modules\QuestionnaireController;
use App\Http\Controllers\Api\V1\Modules\SubstituteExamController;
use App\Http\Controllers\Api\V1\Modules\AssignmentController;
use App\Http\Controllers\Api\V1\Aula\ContentProgressController;
use App\Http\Controllers\Api\V1\Professor\ProfessorAttendanceController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/health', HealthCheckController::class)->name('api.v1.health');

    // ── Catálogo público (sin auth) ────────────────────────────────────
    Route::middleware('throttle:120,1')->group(function (): void {
        Route::get('/courses', [PublicCoursesController::class, 'index'])->name('api.v1.courses.index');
        Route::get('/courses/{idOrSlug}', [PublicCoursesController::class, 'show'])->name('api.v1.courses.show');
        Route::get('/teachers', [PublicTeachersController::class, 'index'])->name('api.v1.teachers.index');
        Route::get('/teachers/{teacher}', [PublicTeachersController::class, 'show'])->name('api.v1.teachers.show');
        Route::get('/specialties', [PublicSpecialtiesController::class, 'index'])->name('api.v1.specialties.index');
        Route::get('/specialties/{idOrSlug}', [PublicSpecialtiesController::class, 'show'])->name('api.v1.specialties.show');
        Route::get('/settings/hero', [\App\Http\Controllers\Api\V1\PublicSettingsController::class, 'getHeroSettings'])->name('api.v1.settings.hero');

        // Public tenant listing for SaaS landing page
        Route::get('/tenants/public', function () {
            $tenants = \App\Models\Tenant::where('status', 'active')
                ->select('id', 'name', 'slug', 'plan', 'status', 'created_at')
                ->orderByDesc('created_at')
                ->limit(12)
                ->get();
            return response()->json(['data' => $tenants]);
        })->name('api.v1.tenants.public');

        // Get active tenant details for dynamic branding
        Route::get('/tenant/current', function () {
            $tenantManager = app(\App\Services\TenantManager::class);
            $tenant = $tenantManager->getTenant();
            
            if (!$tenant) {
                return response()->json(['data' => null]);
            }
            
            return response()->json([
                'data' => [
                    'id'              => $tenant->id,
                    'name'            => $tenant->name,
                    'slug'            => $tenant->slug,
                    'domain'          => $tenant->domain,
                    'logo_path'       => $tenant->logo_path,
                    'primary_color'   => $tenant->primary_color ?? '#7A0F1F',
                    'secondary_color' => $tenant->secondary_color ?? '#C8A14A',
                    'payment_methods' => $tenant->payment_methods,
                ]
            ]);
        })->name('api.v1.tenant.current');
    });

    Route::prefix('auth')->group(function (): void {
        Route::post('/login', LoginController::class)
            ->middleware(app()->isLocal() ? 'throttle:60,1' : 'throttle:5,1')
            ->name('api.v1.auth.login');

        Route::post('/register', RegisterController::class)
            ->middleware(app()->isLocal() ? 'throttle:60,1' : 'throttle:5,1')
            ->name('api.v1.auth.register');
            
        Route::post('/forgot-password', ForgotPasswordController::class)
            ->middleware('throttle:5,1')
            ->name('api.v1.auth.forgot-password');

        Route::post('/reset-password', ResetPasswordController::class)
            ->middleware('throttle:5,1')
            ->name('api.v1.auth.reset-password');

        Route::middleware(['auth:sanctum', 'tenant.verify'])->group(function (): void {
            Route::get('/me', MeController::class)->name('api.v1.auth.me');
            Route::post('/logout', LogoutController::class)->name('api.v1.auth.logout');
        });
    });

    Route::prefix('checkout')->middleware('throttle:20,1')->group(function (): void {
        Route::post('/register-purchase', RegisterPurchaseController::class)
            ->name('api.v1.checkout.register_purchase');
    });

    Route::post('/payments/mercadopago/webhook', \App\Http\Controllers\Api\V1\Payments\MercadoPagoWebhookController::class)
        ->name('api.v1.payments.mercadopago.webhook');

    // Rutas de datos (GET): límite alto para soportar refetch automático de dashboards
    Route::middleware(['auth:sanctum', 'tenant.verify', 'throttle:200,1'])->group(function () {
        Route::middleware('role:admin,superadmin')->group(function () {
            Route::get('/aula/admin-data', [\App\Http\Controllers\Api\V1\Aula\AdminDataController::class, 'index'])->name('api.v1.aula.admin-data');
            Route::get('/admin/ping', AdminPingController::class)->name('api.v1.admin.ping');
            Route::get('/payments/culqi/readiness', CulqiReadinessController::class)->name('api.v1.payments.culqi.readiness');
            Route::get('/admin/courses/{course}/participants', [AdminCoursesController::class, 'participants'])->name('api.v1.admin.courses.participants');
            Route::get('/admin/courses/{course}/enrollments', [AdminEnrollmentController::class, 'index'])->name('api.v1.admin.enrollments.index');
            Route::post('/admin/courses/{course}/enrollments', [AdminEnrollmentController::class, 'addUsers'])->name('api.v1.admin.enrollments.add');
            Route::delete('/admin/courses/{course}/enrollments/{user}', [AdminEnrollmentController::class, 'remove'])->name('api.v1.admin.enrollments.remove');
            Route::post('/admin/courses/{course}/enrollments/import', [AdminEnrollmentController::class, 'importExcel'])->name('api.v1.admin.enrollments.import');
            Route::post('/admin/courses/{course}/enrollments/preview', [AdminEnrollmentController::class, 'previewExcel'])->name('api.v1.admin.enrollments.preview');
            Route::get('/admin/courses/{course}/enrollments/search', [AdminEnrollmentController::class, 'searchUsers'])->name('api.v1.admin.enrollments.search');
            Route::post('/admin/courses/{course}/image', [AdminCoursesController::class, 'uploadImage'])->name('api.v1.admin.courses.image');
            Route::apiResource('/admin/courses', AdminCoursesController::class)->names('api.v1.admin.courses');
            Route::get('/admin/teachers/search', [AdminTeachersController::class, 'search'])->name('api.v1.admin.teachers.search');
            Route::post('/admin/teachers/{teacher}/photo', [AdminTeachersController::class, 'uploadPhoto'])->name('api.v1.admin.teachers.photo');
            Route::apiResource('/admin/teachers', AdminTeachersController::class)->names('api.v1.admin.teachers');
            Route::post('/admin/users/{user}/reset-password', [AdminUsersController::class, 'resetPassword'])->name('api.v1.admin.users.reset-password');
            Route::post('/admin/users/{email}/reset-by-email', [AdminUsersController::class, 'resetByEmail'])->name('api.v1.admin.users.reset-by-email');
            Route::get('/admin/users/available-roles', [AdminUsersController::class, 'availableRoles'])->name('api.v1.admin.users.available-roles');
            Route::apiResource('/admin/users', AdminUsersController::class)->names('api.v1.admin.users');
            Route::patch('/admin/users/{user}/role', [AdminUsersController::class, 'updateRole'])->name('api.v1.admin.users.update-role');
            Route::get('/admin/payments/history', [AdminPaymentsController::class, 'history'])->name('api.v1.admin.payments.history');
            Route::get('/admin/reports/summary', [AdminReportsController::class, 'summary'])->name('api.v1.admin.reports.summary');
            Route::get('/admin/attendance/sessions', [AdminAttendanceController::class, 'index'])->name('api.v1.admin.attendance.sessions');
            Route::post('/admin/attendance/sessions', [AdminAttendanceController::class, 'store'])->name('api.v1.admin.attendance.sessions.store');
            Route::post('/admin/attendance/sessions/{session}/open', [AdminAttendanceController::class, 'open'])->name('api.v1.admin.attendance.sessions.open');
            Route::post('/admin/attendance/sessions/{session}/close', [AdminAttendanceController::class, 'close'])->name('api.v1.admin.attendance.sessions.close');
            Route::delete('/admin/attendance/sessions/{session}', [AdminAttendanceController::class, 'destroy'])->name('api.v1.admin.attendance.sessions.destroy');
            Route::get('/admin/courses/{course}/units', [AdminMaterialsController::class, 'units'])->name('api.v1.admin.materials.units');
            Route::post('/admin/courses/{course}/units', [AdminMaterialsController::class, 'storeUnit'])->name('api.v1.admin.materials.units.store');
            Route::delete('/admin/units/{unit}', [AdminMaterialsController::class, 'destroyUnit'])->name('api.v1.admin.materials.units.destroy');
            Route::get('/admin/units/{unit}/sessions', [AdminMaterialsController::class, 'sessions'])->name('api.v1.admin.materials.sessions');
            Route::post('/admin/units/{unit}/sessions', [AdminMaterialsController::class, 'storeSession'])->name('api.v1.admin.materials.sessions.store');
            Route::delete('/admin/unit-sessions/{session}', [AdminMaterialsController::class, 'destroySession'])->name('api.v1.admin.materials.sessions.destroy');
            Route::get('/admin/sessions/{session}/materials', [AdminMaterialsController::class, 'materials'])->name('api.v1.admin.materials');
            Route::post('/admin/sessions/{session}/materials', [AdminMaterialsController::class, 'storeMaterial'])->name('api.v1.admin.materials.store');
            Route::delete('/admin/materials/{material}', [AdminMaterialsController::class, 'destroyMaterial'])->name('api.v1.admin.materials.destroy');
            Route::get('/admin/password-requests', [AdminPasswordRequestsController::class, 'index'])->name('api.v1.admin.password-requests');
            Route::post('/admin/password-requests', [AdminPasswordRequestsController::class, 'store'])->name('api.v1.admin.password-requests.store');
            Route::post('/admin/password-requests/{passwordRequest}/resolve', [AdminPasswordRequestsController::class, 'resolve'])->name('api.v1.admin.password-requests.resolve');
            Route::get('/admin/certificates', [AdminCertificatesController::class, 'index'])->name('api.v1.admin.certificates');
            Route::get('/admin/certificates/templates', [AdminCertificatesController::class, 'templates'])->name('api.v1.admin.certificates.templates');
            Route::post('/admin/certificates/template', [AdminCertificatesController::class, 'storeTemplate'])->name('api.v1.admin.certificates.template');
            Route::put('/admin/certificates/template/{template}', [AdminCertificatesController::class, 'updateTemplate'])->name('api.v1.admin.certificates.template.update');
            Route::post('/admin/certificates/preview', [AdminCertificatesController::class, 'preview'])->name('api.v1.admin.certificates.preview');
            Route::post('/admin/certificates/batch', [AdminCertificatesController::class, 'batch'])->name('api.v1.admin.certificates.batch');
            Route::post('/admin/certificates/{certificate}/revoke', [AdminCertificatesController::class, 'revoke'])->name('api.v1.admin.certificates.revoke');
            Route::post('/admin/certificates/{certificate}/restore', [AdminCertificatesController::class, 'restore'])->name('api.v1.admin.certificates.restore');
            Route::delete('/admin/certificates/{certificate}', [AdminCertificatesController::class, 'destroy'])->name('api.v1.admin.certificates.destroy');

            // Especialidades CRUD
            Route::post('/admin/specialties/reorder', [AdminSpecialtyController::class, 'reorder'])->name('api.v1.admin.specialties.reorder');
            Route::post('/admin/specialties/{specialty}/image', [AdminSpecialtyController::class, 'uploadImage'])->name('api.v1.admin.specialties.image');
            Route::post('/admin/specialties/{specialty}/brochure-pdf', [AdminSpecialtyController::class, 'uploadBrochurePdf'])->name('api.v1.admin.specialties.brochure-pdf');
            Route::apiResource('/admin/specialties', AdminSpecialtyController::class)->names('api.v1.admin.specialties');

            // Hero & Home Settings
            Route::put('/admin/settings/hero', [\App\Http\Controllers\Api\V1\Admin\AdminSettingsController::class, 'updateHeroSettings'])->name('api.v1.admin.settings.hero');
            Route::post('/admin/settings/hero/image', [\App\Http\Controllers\Api\V1\Admin\AdminSettingsController::class, 'uploadHeroBgImage'])->name('api.v1.admin.settings.hero.image');
            Route::put('/admin/settings/home-sections', [\App\Http\Controllers\Api\V1\Admin\AdminSettingsController::class, 'updateHomeSections'])->name('api.v1.admin.settings.home-sections');
            Route::post('/admin/settings/upload-file', [\App\Http\Controllers\Api\V1\Admin\AdminSettingsController::class, 'uploadSettingFile'])->name('api.v1.admin.settings.upload-file');
            Route::put('/admin/settings/landing-sections', [\App\Http\Controllers\Api\V1\Admin\AdminSettingsController::class, 'updateLandingSections'])->name('api.v1.admin.settings.landing-sections');
            
            // Tenant/Institution identity Settings
            Route::put('/admin/tenant', [\App\Http\Controllers\Api\V1\Admin\AdminSettingsController::class, 'updateTenantSettings'])->name('api.v1.admin.tenant.update');
        });

        Route::middleware('role:prof,superadmin')->group(function () {
            Route::get('/aula/professor-data', [\App\Http\Controllers\Api\V1\Aula\ProfessorDataController::class, 'index'])->name('api.v1.aula.professor-data');

            // Sprint 9 — Cursos del profesor
            Route::prefix('prof')->name('api.v1.prof.')->group(function () {
                Route::get('/courses', [\App\Http\Controllers\Api\V1\Professor\ProfessorCourseController::class, 'index'])->name('courses.index');
                Route::get('/courses/{courseId}', [\App\Http\Controllers\Api\V1\Professor\ProfessorCourseController::class, 'show'])->name('courses.show');
                Route::get('/courses/{courseId}/students', [\App\Http\Controllers\Api\V1\Professor\ProfessorCourseController::class, 'students'])->name('courses.students');

                // Sprint 12 — CRUD de cursos por el profesor
                Route::post('/courses', [\App\Http\Controllers\Api\V1\Professor\ProfessorCourseController::class, 'store'])->name('courses.store');
                Route::put('/courses/{courseId}', [\App\Http\Controllers\Api\V1\Professor\ProfessorCourseController::class, 'update'])->name('courses.update');
                Route::post('/courses/{courseId}/image', [\App\Http\Controllers\Api\V1\Professor\ProfessorCourseController::class, 'uploadImage'])->name('courses.image');

                // Certificados del curso
                Route::get('/courses/{courseId}/certificates/pending', [\App\Http\Controllers\Api\V1\Professor\ProfessorCertificateController::class, 'pending'])->name('certificates.pending');
                Route::get('/courses/{courseId}/certificates/issued', [\App\Http\Controllers\Api\V1\Professor\ProfessorCertificateController::class, 'issued'])->name('certificates.issued');
                Route::post('/courses/{courseId}/certificates/issue/{userId}', [\App\Http\Controllers\Api\V1\Professor\ProfessorCertificateController::class, 'issue'])->name('certificates.issue');
                Route::delete('/courses/{courseId}/certificates/{certificateId}', [\App\Http\Controllers\Api\V1\Professor\ProfessorCertificateController::class, 'destroy'])->name('certificates.destroy');

                // Asistencias y Progreso
                Route::get('/courses/{courseId}/attendance', [ProfessorAttendanceController::class, 'index'])->name('attendance.index');
                Route::post('/courses/{courseId}/attendance/sessions', [ProfessorAttendanceController::class, 'storeSession'])->name('attendance.sessions.store');
                Route::post('/courses/{courseId}/attendance/sessions/{sessionId}/record', [ProfessorAttendanceController::class, 'toggleRecord'])->name('attendance.record.toggle');

                // Autogestión de Perfil Público
                Route::get('/profile', [\App\Http\Controllers\Api\V1\Professor\ProfessorProfileController::class, 'show'])->name('profile.show');
                Route::put('/profile', [\App\Http\Controllers\Api\V1\Professor\ProfessorProfileController::class, 'update'])->name('profile.update');
                Route::post('/profile/photo', [\App\Http\Controllers\Api\V1\Professor\ProfessorProfileController::class, 'uploadPhoto'])->name('profile.photo');
            });
        });

        Route::middleware('role:superadmin')->group(function () {
            Route::get('/aula/superadmin-data', [\App\Http\Controllers\Api\V1\Aula\SuperadminDataController::class, 'index'])->name('api.v1.aula.superadmin-data');
            Route::get('/aula/superadmin-metrics', [\App\Http\Controllers\Api\V1\Aula\SuperadminMetricsController::class, 'index'])->name('api.v1.aula.superadmin-metrics');

            // Gestión de Inquilinos (SaaS Aulas)
            Route::get('/superadmin/tenants', [\App\Http\Controllers\Api\V1\Superadmin\TenantManagementController::class, 'index'])->name('api.v1.superadmin.tenants.index');
            Route::post('/superadmin/tenants', [\App\Http\Controllers\Api\V1\Superadmin\TenantManagementController::class, 'store'])->name('api.v1.superadmin.tenants.store');
            Route::post('/superadmin/tenants/upload-logo', [\App\Http\Controllers\Api\V1\Superadmin\TenantManagementController::class, 'uploadLogo'])->name('api.v1.superadmin.tenants.upload-logo');
            Route::get('/superadmin/tenants/{tenant}', [\App\Http\Controllers\Api\V1\Superadmin\TenantManagementController::class, 'show'])->name('api.v1.superadmin.tenants.show');
            Route::put('/superadmin/tenants/{tenant}', [\App\Http\Controllers\Api\V1\Superadmin\TenantManagementController::class, 'update'])->name('api.v1.superadmin.tenants.update');
            Route::delete('/superadmin/tenants/{tenant}', [\App\Http\Controllers\Api\V1\Superadmin\TenantManagementController::class, 'destroy'])->name('api.v1.superadmin.tenants.destroy');
            Route::post('/superadmin/tenants/{tenant}/toggle', [\App\Http\Controllers\Api\V1\Superadmin\TenantManagementController::class, 'toggleStatus'])->name('api.v1.superadmin.tenants.toggle');
        });
    });

    // Rutas de acción (POST/mutaciones): límite estricto para prevenir abuso
    Route::middleware(['auth:sanctum', 'tenant.verify', 'throttle:60,1'])->group(function () {
        Route::middleware('role:admin,superadmin')->group(function () {
            Route::post('/payments/{purchase}/status', \App\Http\Controllers\Api\V1\Payments\TransitionPurchaseStatusController::class)->name('api.v1.payments.transition');
            Route::post('/admin/purchases/{purchase}/shipping-status', [\App\Http\Controllers\Api\V1\Admin\AdminPaymentsController::class, 'updateShippingStatus'])->name('api.v1.admin.purchases.shipping-status');
        });
    });

    Route::middleware(['auth:sanctum', 'tenant.verify', 'role:prof,admin,superadmin'])->group(function (): void {
        Route::get('/prof/ping', ProfPingController::class)->name('api.v1.prof.ping');
    });

    // Verificación pública de certificados (rate-limited para prevenir fuerza bruta)
    Route::post('/certificates/verify', VerifyCertificateController::class)
        ->middleware('throttle:20,1')
        ->name('api.v1.certificates.verify');

    Route::middleware(['auth:sanctum', 'tenant.verify'])->group(function (): void {
        Route::get('/aula/access', AulaAccessController::class)->name('api.v1.aula.access');
        Route::get('/aula/student-data', [\App\Http\Controllers\Api\V1\Aula\StudentDataController::class, 'index'])->name('api.v1.aula.student-data');
        Route::get('/aula/my-courses', [\App\Http\Controllers\Api\V1\Aula\StudentDataController::class, 'myCourses'])->name('api.v1.aula.my-courses');
        Route::get('/aula/courses/{course}', [\App\Http\Controllers\Api\V1\Aula\StudentDataController::class, 'showCourse'])->name('api.v1.aula.courses.show');
        Route::post('/aula/purchases', [RegisterPurchaseController::class, 'storeForAuthenticatedUser'])->name('api.v1.aula.purchases.store');
        Route::get('/certificates/latest', LatestCertificateController::class)->name('api.v1.certificates.latest');
        
        // Progreso de contenido (asistencia asíncrona)
        Route::post('/aula/content/{item}/complete', [ContentProgressController::class, 'complete'])->name('api.v1.aula.content.complete');

        // Sprint 12 — Cambio de contraseña
        Route::put('/aula/change-password', \App\Http\Controllers\Api\V1\Aula\ChangePasswordController::class)->name('api.v1.aula.change-password');

        // Asistencia del estudiante
        Route::get('/aula/my-attendance', [\App\Http\Controllers\Api\V1\Aula\StudentAttendanceController::class, 'index'])->name('api.v1.aula.my-attendance');
    });

    // ─── Sprint 11: Módulos tipo Moodle (admin + profesor) ────────────────
    Route::middleware(['auth:sanctum', 'tenant.verify'])->group(function () {
        Route::prefix('aula')->name('api.v1.aula.modules.')->group(function () {
            // Módulos
            Route::get('/courses/{course}/modules', [ModuleManagementController::class, 'modules'])->name('index');
            Route::post('/courses/{course}/modules', [ModuleManagementController::class, 'storeModule'])->name('store');
            Route::put('/modules/{module}', [ModuleManagementController::class, 'updateModule'])->name('update');
            Route::delete('/modules/{module}', [ModuleManagementController::class, 'destroyModule'])->name('destroy');
            Route::post('/courses/{course}/modules/reorder', [ModuleManagementController::class, 'reorderModules'])->name('reorder');
            // Secciones
            Route::get('/modules/{module}/sections', [ModuleManagementController::class, 'sections'])->name('sections.index');
            Route::post('/modules/{module}/sections', [ModuleManagementController::class, 'storeSection'])->name('sections.store');
            Route::put('/sections/{section}', [ModuleManagementController::class, 'updateSection'])->name('sections.update');
            Route::delete('/sections/{section}', [ModuleManagementController::class, 'destroySection'])->name('sections.destroy');
            Route::post('/modules/{module}/sections/reorder', [ModuleManagementController::class, 'reorderSections'])->name('sections.reorder');
            // Items
            Route::get('/sections/{section}/items', [ModuleManagementController::class, 'items'])->name('items.index');
            Route::post('/sections/{section}/items', [ModuleManagementController::class, 'storeItem'])->name('items.store');
            Route::put('/items/{item}', [ModuleManagementController::class, 'updateItem'])->name('items.update');
            Route::delete('/items/{item}', [ModuleManagementController::class, 'destroyItem'])->name('items.destroy');
            Route::post('/sections/{section}/items/reorder', [ModuleManagementController::class, 'reorderItems'])->name('items.reorder');
        });

        // Cuestionarios
        Route::prefix('aula')->group(function () {
            Route::apiResource('/questionnaires', \App\Http\Controllers\Api\V1\Modules\QuestionnaireController::class)->except(['index']);
            Route::post('/questionnaires/{questionnaire}/submit', [\App\Http\Controllers\Api\V1\Modules\QuestionnaireController::class, 'submitAttempt'])->name('questionnaires.submit');
            Route::get('/questionnaires/{questionnaire}/my-attempts', [\App\Http\Controllers\Api\V1\Modules\QuestionnaireController::class, 'myAttempts'])->name('questionnaires.my-attempts');

            // Exámenes Sustitutorios
            Route::apiResource('/substitute-exams', \App\Http\Controllers\Api\V1\Modules\SubstituteExamController::class)->except(['index']);
            Route::post('/substitute-exams/{substituteExam}/submit', [\App\Http\Controllers\Api\V1\Modules\SubstituteExamController::class, 'submitAttempt'])->name('substitute-exams.submit');
            Route::get('/substitute-exams/{substituteExam}/eligibility', [\App\Http\Controllers\Api\V1\Modules\SubstituteExamController::class, 'eligibility'])->name('substitute-exams.eligibility');

            // Tareas
            Route::apiResource('assignments', AssignmentController::class);
            Route::post('assignments/{assignment}/submit', [AssignmentController::class, 'submit']);
            Route::post('assignments/{assignment}/submissions/{submission}/grade', [AssignmentController::class, 'grade']);
            Route::get('assignments/{assignment}/my-submission', [AssignmentController::class, 'mySubmission']);
        });
    });
});
