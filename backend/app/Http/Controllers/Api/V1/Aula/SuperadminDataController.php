<?php

namespace App\Http\Controllers\Api\V1\Aula;

use App\Models\User;
use App\Models\Course;
use App\Models\Purchase;
use App\Models\Certificate;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SuperadminDataController
{
    public function index(): JsonResponse
    {
        $tenantClass = \App\Models\Scopes\TenantScope::class;
        
        $totalUsers = User::withoutGlobalScope($tenantClass)->count();
        $studentCount = User::withoutGlobalScope($tenantClass)->where('role', 'student')->count();
        $professorCount = User::withoutGlobalScope($tenantClass)->where('role', 'prof')->count();

        $totalCourses = Course::withoutGlobalScope($tenantClass)->count();
        $totalPurchases = Purchase::withoutGlobalScope($tenantClass)->count();
        
        // Ingresos Reales (Pagados o Validados)
        $totalRevenue = Purchase::withoutGlobalScope($tenantClass)
            ->whereIn('status', [Purchase::STATUS_PAID, Purchase::STATUS_VALIDATED])
            ->sum('amount');
            
        // Balance Pendiente (Por validar o por pagar)
        $pendingRevenue = Purchase::withoutGlobalScope($tenantClass)
            ->whereIn('status', [Purchase::STATUS_PENDING_VALIDATION, Purchase::STATUS_PENDING_PAYMENT])
            ->sum('amount');

        $totalCertificates = Certificate::withoutGlobalScope($tenantClass)->count();

        $recentUsers = User::withoutGlobalScope($tenantClass)->latest()->limit(5)->get();
        $recentCourses = Course::withoutGlobalScope($tenantClass)->latest()->limit(5)->get();
        
        // Compras con todo el detalle para el Superadmin
        $recentPurchases = Purchase::withoutGlobalScope($tenantClass)
            ->with([
                'user' => function($q) use ($tenantClass) { $q->withoutGlobalScope($tenantClass); },
                'course' => function($q) use ($tenantClass) { $q->withoutGlobalScope($tenantClass); }
            ])
            ->latest()
            ->limit(15)
            ->get();

        $purchasesByStatus = Purchase::withoutGlobalScope($tenantClass)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status');

        // Métricas Financieras Fuertes
        $revenueByMethod = Purchase::withoutGlobalScope($tenantClass)
            ->whereIn('status', [Purchase::STATUS_PAID, Purchase::STATUS_VALIDATED])
            ->selectRaw('payment_method, SUM(amount) as total')
            ->groupBy('payment_method')
            ->get();

        $revenueByEntity = Purchase::withoutGlobalScope($tenantClass)
            ->whereIn('status', [Purchase::STATUS_PAID, Purchase::STATUS_VALIDATED])
            ->selectRaw('bank_entity, SUM(amount) as total')
            ->groupBy('bank_entity')
            ->get();

        // Tendencia mensual (últimos 6 meses)
        $monthExpression = DB::connection()->getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', created_at)"
            : 'DATE_FORMAT(created_at, "%Y-%m")';

        $revenueTrend = Purchase::withoutGlobalScope($tenantClass)
            ->whereIn('status', [Purchase::STATUS_PAID, Purchase::STATUS_VALIDATED])
            ->selectRaw($monthExpression.' as month, SUM(amount) as total')
            ->groupBy('month')
            ->orderBy('month')
            ->limit(6)
            ->get();

        // Métricas de Inquilinos (Aulas SaaS)
        $totalTenants = \App\Models\Tenant::count();
        $activeTenants = \App\Models\Tenant::where('status', 'active')->count();

        return response()->json([
            'summary' => [
                'total_users'        => $totalUsers,
                'students'           => $studentCount,
                'professors'         => $professorCount,
                'total_courses'      => $totalCourses,
                'total_purchases'    => $totalPurchases,
                'total_revenue'      => (float) $totalRevenue,
                'pending_revenue'    => (float) $pendingRevenue,
                'total_certificates' => $totalCertificates,
                'total_tenants'      => $totalTenants,
                'active_tenants'     => $activeTenants,
            ],
            'recent_users'        => $recentUsers,
            'recent_courses'      => $recentCourses,
            'recent_purchases'    => $recentPurchases,
            'purchases_by_status' => $purchasesByStatus,
            'financials' => [
                'by_method' => $revenueByMethod,
                'by_entity' => $revenueByEntity,
                'trend'     => $revenueTrend,
            ],
        ]);
    }
}
