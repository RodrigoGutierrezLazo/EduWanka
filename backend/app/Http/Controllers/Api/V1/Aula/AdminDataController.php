<?php

namespace App\Http\Controllers\Api\V1\Aula;

use App\Models\Purchase;
use App\Models\User;
use App\Models\Certificate;
use App\Models\Course;
use Illuminate\Http\JsonResponse;

class AdminDataController
{
    public function index(): JsonResponse
    {
        // Datos para el dashboard del admin
        $pendingPayments = Purchase::where('status', 'pending_validation')
            ->with(['user', 'course'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (Purchase $purchase) => [
                ...$purchase->toArray(),
                'user' => $purchase->user,
                'course' => $purchase->course,
                'receipt_url' => $purchase->receipt_path
                    ? route('api.v1.files.receipt', ['purchase' => $purchase->id], false)
                    : null,
            ]);

        $totalUsers = User::count();
        $totalCourses = Course::count();
        $publishedCourses = Course::where('is_published', true)->count();
        $byRole = User::selectRaw('role, count(*) as total')
            ->groupBy('role')
            ->pluck('total', 'role');
        $validatedPurchases = Purchase::where('status', 'validated')->count();
        $paidPurchases = Purchase::where('status', 'paid')->count();
        $enrollmentsToday = Purchase::whereIn('status', ['validated', 'paid'])
            ->whereDate('created_at', now()->toDateString())
            ->count();

        $pendingCertificates = Certificate::count();

        return response()->json([
            'pending_payments' => $pendingPayments,
            'pending_payments_count' => $pendingPayments->count(),
            'total_users' => $totalUsers,
            'total_admins' => (int) ($byRole['admin'] ?? 0),
            'total_teachers' => (int) ($byRole['prof'] ?? 0),
            'total_students' => (int) ($byRole['student'] ?? 0),
            'total_courses' => $totalCourses,
            'published_courses' => $publishedCourses,
            'enrollments_today' => $enrollmentsToday,
            'validated_purchases' => $validatedPurchases,
            'paid_purchases' => $paidPurchases,
            'pending_certificates' => $pendingCertificates,
            'latest_users' => User::latest()->limit(10)->get(),
            'revenue' => Purchase::whereIn('status', ['paid', 'validated'])
                ->sum('amount'),
        ]);
    }
}
