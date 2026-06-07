<?php

namespace App\Http\Controllers\Api\V1\Professor;

use App\Http\Controllers\Controller;
use App\Models\AttendanceSession;
use App\Models\AttendanceRecord;
use App\Models\Course;
use App\Models\Purchase;
use App\Models\ContentProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfessorAttendanceController extends Controller
{
    /**
     * Obtener las sesiones de asistencia del curso y el progreso de los estudiantes (síncrono y asíncrono).
     */
    public function index(Request $request, int $courseId): JsonResponse
    {
        $prof = $request->user();

        // Verificar que el curso pertenece al profesor
        $course = Course::where('id', $courseId)
            ->where('assigned_prof_id', $prof->id)
            ->firstOrFail();

        // 1. Obtener sesiones de asistencia (Síncronas)
        $sessions = AttendanceSession::where('course_id', $courseId)
            ->with('records')
            ->orderBy('date', 'desc')
            ->get();

        // 2. Obtener la lista de estudiantes inscritos
        $purchases = Purchase::where('course_id', $courseId)
            ->whereIn('status', [Purchase::STATUS_VALIDATED, Purchase::STATUS_PAID])
            ->with('user')
            ->get();

        // 3. Obtener el progreso de videos (Asíncrono)
        // Para esto necesitamos saber cuántos videos hay en el curso
        $totalVideos = \App\Models\ContentItem::where('type', 'video')
            ->whereHas('section', function($q) use ($courseId) {
                $q->whereHas('module', function($q2) use ($courseId) {
                    $q2->where('course_id', $courseId);
                });
            })->count();

        // Mapear estudiantes con su asistencia a sesiones y progreso de videos
        $students = $purchases->map(function ($purchase) use ($sessions, $totalVideos, $courseId) {
            $user = $purchase->user;
            
            // Asistencia Síncrona
            $attendedSessions = $sessions->filter(function($session) use ($user) {
                return $session->records->contains('user_id', $user->id);
            })->count();

            // Progreso Asíncrono (Videos)
            $videosWatched = ContentProgress::where('user_id', $user->id)
                ->whereHas('contentItem', function($q) use ($courseId) {
                    $q->where('type', 'video')->whereHas('section', function($q2) use ($courseId) {
                        $q2->whereHas('module', function($q3) use ($courseId) {
                            $q3->where('course_id', $courseId);
                        });
                    });
                })->count();

            return [
                'user_id' => $user->id,
                'name' => $user->name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'attended_sessions' => $attendedSessions,
                'videos_watched' => $videosWatched,
                'total_videos' => $totalVideos,
                'records' => $sessions->mapWithKeys(function($session) use ($user) {
                    return [$session->id => $session->records->contains('user_id', $user->id)];
                })
            ];
        });

        return response()->json([
            'sessions' => $sessions,
            'students' => $students,
            'total_videos' => $totalVideos,
        ]);
    }

    /**
     * Crear una nueva sesión de asistencia.
     */
    public function storeSession(Request $request, int $courseId): JsonResponse
    {
        $request->validate([
            'date' => 'required|date',
            'start_time' => 'required',
            'end_time' => 'required',
        ]);

        $prof = $request->user();

        // Verificar que el curso pertenece al profesor
        $course = Course::where('id', $courseId)
            ->where('assigned_prof_id', $prof->id)
            ->firstOrFail();

        $sessionDate = $request->date;
        $courseStart = $course->start_date ? $course->start_date->format('Y-m-d') : null;
        $courseEnd = $course->end_date ? $course->end_date->format('Y-m-d') : null;
        if ($courseStart && $sessionDate < $courseStart) {
            return response()->json([
                'message' => 'La fecha de la sesión no puede ser anterior a la fecha de inicio del curso ('.$courseStart.').',
                'errors' => ['date' => ['La fecha debe ser posterior o igual a la fecha de inicio del curso.']],
            ], 422);
        }
        if ($courseEnd && $sessionDate > $courseEnd) {
            return response()->json([
                'message' => 'La fecha de la sesión no puede ser posterior a la fecha de fin del curso ('.$courseEnd.').',
                'errors' => ['date' => ['La fecha debe ser anterior o igual a la fecha de fin del curso.']],
            ], 422);
        }

        $session = AttendanceSession::create([
            'course_id' => $course->id,
            'date' => $request->date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'status' => 'closed',
            'access_code' => strtoupper(\Str::random(6)),
        ]);

        return response()->json(['message' => 'Sesión creada exitosamente', 'data' => $session]);
    }

    /**
     * Alternar asistencia de un estudiante en una sesión.
     */
    public function toggleRecord(Request $request, int $courseId, int $sessionId): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'attended' => 'required|boolean',
        ]);

        $prof = $request->user();

        // Verificar que el curso pertenece al profesor
        Course::where('id', $courseId)
            ->where('assigned_prof_id', $prof->id)
            ->firstOrFail();

        $session = AttendanceSession::where('course_id', $courseId)->findOrFail($sessionId);

        if ($request->attended) {
            $record = AttendanceRecord::firstOrCreate([
                'attendance_session_id' => $session->id,
                'user_id' => $request->user_id,
            ], [
                'registered_at' => now(),
            ]);
            return response()->json(['message' => 'Asistencia marcada.']);
        } else {
            AttendanceRecord::where('attendance_session_id', $session->id)
                ->where('user_id', $request->user_id)
                ->delete();
            return response()->json(['message' => 'Falta marcada.']);
        }
    }
}
