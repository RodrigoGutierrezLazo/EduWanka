<?php

namespace App\Http\Controllers\Api\V1\Aula;

use App\Models\Course;
use App\Models\Purchase;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentDataController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $purchases = $user->purchases()->with('course')->get();
        
        // Calcular estadísticas financieras
        $totalSpent = $purchases->whereIn('status', ['paid', 'validated'])->sum('amount');
        $pendingPayments = $purchases->whereIn('status', ['pending_payment', 'pending_validation'])->count();

        return response()->json([
            'user' => $user,
            'purchases' => $purchases,
            'certificates' => $user->certificates()->with('course')->get(),
            'questionnaire_attempts' => $user->questionnaireAttempts()
                ->with(['questionnaire.course'])
                ->latest()
                ->get()
                ->map(fn ($a) => [
                    'id' => $a->id,
                    'score' => $a->score,
                    'course_id' => $a->questionnaire?->course_id,
                    'course' => $a->questionnaire?->course,
                    'created_at' => $a->created_at,
                ]),
            'attendance' => $user->attendanceRecords()->with('session.course')->latest()->limit(5)->get(),
            'stats' => [
                'total_spent' => $totalSpent,
                'pending_payments' => $pendingPayments,
            ]
        ]);
    }

    /** Lista solo los cursos que el estudiante ya tiene pagados/validados. */
    public function myCourses(Request $request): JsonResponse
    {
        $user = $request->user();
        $purchases = $user->purchases()
            ->whereIn('status', [Purchase::STATUS_VALIDATED, Purchase::STATUS_PAID])
            ->with(['course' => function ($query) {
                $query->select('id', 'code', 'title', 'image_url', 'level', 'duration_weeks');
            }])
            ->get();

        $courses = $purchases->map(fn ($p) => $p->course)->filter()->values();

        return response()->json([
            'data' => $courses
        ]);
    }

    /** Detalle de un curso específico para el estudiante (si tiene acceso). */
    public function showCourse(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $course = Course::with(['modules.sections.items'])->findOrFail($id);

        // Verificar si el usuario tiene una compra validada para este curso
        $hasAccess = $user->purchases()
            ->where('course_code', $course->code)
            ->whereIn('status', [Purchase::STATUS_VALIDATED, Purchase::STATUS_PAID])
            ->exists();

        if (!$hasAccess) {
            return response()->json(['message' => 'No tienes acceso a este curso.'], 403);
        }

        return response()->json([
            'data' => $course
        ]);
    }
}
