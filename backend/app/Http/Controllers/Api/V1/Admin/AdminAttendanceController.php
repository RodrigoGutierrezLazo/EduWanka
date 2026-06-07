<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AttendanceSession;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminAttendanceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
        ]);

        $query = AttendanceSession::query()
            ->with('course')
            ->withCount('records')
            ->orderByDesc('date')
            ->orderByDesc('start_time');

        if (! empty($data['course_id'])) {
            $query->where('course_id', $data['course_id']);
        }

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'status' => ['sometimes', Rule::in(['open', 'closed'])],
        ], [
            'end_time.after'      => 'La hora de fin debe ser posterior a la hora de inicio.',
        ]);

        // Validar que la fecha esté dentro del periodo del curso
        $course = Course::find($data['course_id']);
        if ($course) {
            $sessionDate = $data['date'];
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
        }

        $data['status'] = $data['status'] ?? 'closed';

        return response()->json(AttendanceSession::create($data), 201);
    }

    public function open(AttendanceSession $session): JsonResponse
    {
        $session->update([
            'status' => 'open',
            'access_code' => strtoupper(Str::random(6)),
        ]);

        return response()->json($session->fresh());
    }

    public function close(AttendanceSession $session): JsonResponse
    {
        $session->update(['status' => 'closed']);

        return response()->json($session->fresh());
    }

    public function destroy(AttendanceSession $session): JsonResponse
    {
        $session->delete();

        return response()->json(['message' => 'Sesion eliminada']);
    }
}
