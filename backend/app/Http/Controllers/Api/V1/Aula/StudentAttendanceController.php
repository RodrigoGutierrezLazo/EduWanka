<?php

namespace App\Http\Controllers\Api\V1\Aula;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\Purchase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentAttendanceController extends Controller
{
    /**
     * Devuelve la asistencia del estudiante autenticado,
     * agrupada por curso con resumen y detalle de sesiones.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Cursos en los que está inscrito (pagado/validado)
        $purchases = Purchase::where('user_id', $user->id)
            ->whereIn('status', [Purchase::STATUS_VALIDATED, Purchase::STATUS_PAID])
            ->with('course:id,title,code,image_url')
            ->get();

        $courseIds = $purchases->pluck('course_id')->filter()->unique();

        if ($courseIds->isEmpty()) {
            return response()->json(['data' => []]);
        }

        // Todas las sesiones de esos cursos
        $sessions = AttendanceSession::whereIn('course_id', $courseIds)
            ->orderBy('date', 'asc')
            ->get();

        // Registros del estudiante
        $records = AttendanceRecord::where('user_id', $user->id)
            ->whereIn('attendance_session_id', $sessions->pluck('id'))
            ->pluck('attendance_session_id')
            ->toArray();

        // Agrupar por curso
        $result = $courseIds->map(function ($courseId) use ($sessions, $records, $purchases) {
            $purchase = $purchases->firstWhere('course_id', $courseId);
            $courseSessions = $sessions->where('course_id', $courseId);
            $totalSessions = $courseSessions->count();
            $attendedSessions = $courseSessions->filter(fn ($s) => in_array($s->id, $records))->count();

            return [
                'course_id' => $courseId,
                'course_title' => $purchase?->course?->title ?? 'Curso',
                'course_code' => $purchase?->course?->code ?? '',
                'course_image' => $purchase?->course?->image_url ?? null,
                'total_sessions' => $totalSessions,
                'attended_sessions' => $attendedSessions,
                'percentage' => $totalSessions > 0 ? round(($attendedSessions / $totalSessions) * 100) : 0,
                'sessions' => $courseSessions->map(fn ($s) => [
                    'id' => $s->id,
                    'date' => $s->date?->format('Y-m-d'),
                    'start_time' => $s->start_time,
                    'end_time' => $s->end_time,
                    'attended' => in_array($s->id, $records),
                ])->values(),
            ];
        })->filter(fn ($c) => $c['total_sessions'] > 0)->values();

        return response()->json(['data' => $result]);
    }
}
