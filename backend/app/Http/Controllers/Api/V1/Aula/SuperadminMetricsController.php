<?php

namespace App\Http\Controllers\Api\V1\Aula;

use App\Models\Certificate;
use App\Models\Course;

use App\Models\Purchase;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SuperadminMetricsController
{
    public function index(): JsonResponse
    {
        $tenantClass = \App\Models\Scopes\TenantScope::class;

        // ── Certificates ─────────────────────────────────────────────
        $totalCertificates = Certificate::withoutGlobalScope($tenantClass)->count();

        $certByStatus = Certificate::withoutGlobalScope($tenantClass)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status');

        $certByCourse = Certificate::withoutGlobalScope($tenantClass)
            ->selectRaw(
                'course_id, COUNT(*) as count, AVG(score) as avg_score'
            )
            ->with(['course' => function($q) use ($tenantClass) { $q->withoutGlobalScope($tenantClass); }])
            ->groupBy('course_id')
            ->orderByDesc('count')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'course_title' => $row->course?->title ?? $row->course_id,
                'count'        => (int) $row->count,
                'avg_score'    => $row->avg_score !== null ? round((float) $row->avg_score, 1) : null,
            ]);

        $monthExpression = DB::connection()->getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', created_at)"
            : 'DATE_FORMAT(created_at, "%Y-%m")';

        $certMonthlyTrend = Certificate::withoutGlobalScope($tenantClass)
            ->selectRaw(
                $monthExpression.' as month, COUNT(*) as count'
            )
            ->groupBy('month')
            ->orderBy('month')
            ->limit(12)
            ->get();


        // ── Platform ──────────────────────────────────────────────────
        $totalCourses     = Course::withoutGlobalScope($tenantClass)->count();
        $publishedCourses = Course::withoutGlobalScope($tenantClass)->where('is_published', true)->count();
        $totalEnrollments = Purchase::withoutGlobalScope($tenantClass)->whereIn('status', ['paid', 'validated'])->count();

        $topCourses = Purchase::withoutGlobalScope($tenantClass)->whereIn('status', ['paid', 'validated'])
            ->selectRaw('course_id, COUNT(*) as enrollments')
            ->with(['course' => function($q) use ($tenantClass) { $q->withoutGlobalScope($tenantClass); }])
            ->groupBy('course_id')
            ->orderByDesc('enrollments')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'title'       => $row->course?->title ?? $row->course_id,
                'enrollments' => (int) $row->enrollments,
            ]);

        $usersTrend = User::withoutGlobalScope($tenantClass)
            ->selectRaw(
                $monthExpression.' as month, COUNT(*) as count'
            )
            ->groupBy('month')
            ->orderBy('month')
            ->limit(12)
            ->get();

        $certificatesTrend = Certificate::withoutGlobalScope($tenantClass)
            ->selectRaw(
                $monthExpression.' as month, COUNT(*) as count'
            )
            ->groupBy('month')
            ->orderBy('month')
            ->limit(12)
            ->get();

        return response()->json([
            'certificates' => [
                'total'         => $totalCertificates,
                'by_status'     => $certByStatus,
                'by_course'     => $certByCourse,
                'monthly_trend' => $certMonthlyTrend,
            ],
            'exams' => [
                'total_attempts' => 0,
                'passed'         => 0,
                'pass_rate'      => 0,
                'avg_score'      => 0,
                'by_course'      => [],
            ],
            'platform' => [
                'total_courses'      => $totalCourses,
                'published_courses'  => $publishedCourses,
                'total_enrollments'  => $totalEnrollments,
                'top_courses'        => $topCourses,
                'users_trend'        => $usersTrend,
                'certificates_trend' => $certificatesTrend,
            ],
        ]);
    }
}
