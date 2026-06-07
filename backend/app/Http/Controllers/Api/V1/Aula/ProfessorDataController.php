<?php

namespace App\Http\Controllers\Api\V1\Aula;

use App\Http\Controllers\Controller;
use App\Models\Course;

use App\Models\Certificate;
use App\Models\Purchase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Sprint 9 — Dashboard del docente responsable.
 *
 * Devuelve únicamente estadísticas de los cursos donde
 * assigned_prof_id coincide con el usuario autenticado.
 */
class ProfessorDataController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $prof = $request->user();

        // Solo cursos asignados a este profesor
        $courses = Course::where('assigned_prof_id', $prof->id)
            ->withCount([
                'purchases as enrolled_count' => fn($q) => $q->whereIn('status', [
                    Purchase::STATUS_VALIDATED, Purchase::STATUS_PAID,
                ]),
                'certificates as certificates_count',
            ])
            ->get();

        $courseIds = $courses->pluck('id');

        // Certificados emitidos en cursos del profesor
        $recentCertificates = Certificate::whereIn('course_id', $courseIds)
            ->with(['user' => fn($q) => $q->select('id', 'name', 'last_name', 'email'), 'course'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        return response()->json([
            'user'                => $prof,
            'courses'             => $courses,
            'recent_attempts'     => [],
            'student_exams'       => [],
            'recent_certificates' => $recentCertificates,
            'stats'               => [
                'total_courses'      => $courses->count(),
                'total_enrolled'     => $courses->sum('enrolled_count'),
                'total_certificates' => $courses->sum('certificates_count'),
                'total_exams'        => 0,
                'passed_exams'       => 0,
                'avg_score'          => 0,
            ],
        ]);
    }
}
