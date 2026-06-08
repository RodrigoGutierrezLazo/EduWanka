<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use App\Models\PurchaseStatusAudit;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AdminReportsController extends Controller
{
    public function summary(): JsonResponse
    {
        $revenueStatuses = [Purchase::STATUS_VALIDATED, Purchase::STATUS_PAID];

        // --- Counts & total revenue ---
        $statusCounts = Purchase::query()
            ->select('status', DB::raw('COUNT(*) as cnt'), DB::raw('COALESCE(SUM(amount), 0) as total'))
            ->groupBy('status')
            ->pluck('cnt', 'status')
            ->toArray();

        $totalRevenue = (float) Purchase::whereIn('status', $revenueStatuses)->sum('amount');
        $paidCount = (int) ($statusCounts[Purchase::STATUS_PAID] ?? 0);
        $pendingCount = (int) ($statusCounts[Purchase::STATUS_PENDING_VALIDATION] ?? 0);
        $validatedCount = (int) ($statusCounts[Purchase::STATUS_VALIDATED] ?? 0);
        $rejectedCount = (int) ($statusCounts[Purchase::STATUS_REJECTED] ?? 0);

        // --- By course ---
        $byCourse = Purchase::query()
            ->join('courses', 'purchases.course_id', '=', 'courses.id')
            ->whereIn('purchases.status', $revenueStatuses)
            ->select(
                'courses.title',
                DB::raw('SUM(purchases.amount) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('courses.id', 'courses.title')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'title' => $row->title,
                'total' => (float) $row->total,
                'count' => (int) $row->count,
            ]);

        // --- By bank entity ---
        $byEntityRaw = Purchase::query()
            ->whereIn('status', $revenueStatuses)
            ->whereNotNull('bank_entity')
            ->where('bank_entity', '!=', '')
            ->select(
                'bank_entity',
                DB::raw('SUM(amount) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('bank_entity')
            ->orderByDesc('total')
            ->get();

        $entityGrandTotal = $byEntityRaw->sum('total');
        $byEntity = $byEntityRaw->map(fn ($row) => [
            'entity' => $row->bank_entity,
            'total' => (float) $row->total,
            'count' => (int) $row->count,
            'percentage' => $entityGrandTotal > 0
                ? round(((float) $row->total / $entityGrandTotal) * 100, 2)
                : 0.0,
        ]);

        // --- Monthly trend (last 12 months) ---
        $monthlyTrend = Purchase::query()
            ->whereIn('status', $revenueStatuses)
            ->where('created_at', '>=', now()->subMonths(12)->startOfMonth())
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
                DB::raw('SUM(amount) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn ($row) => [
                'month' => $row->month,
                'total' => (float) $row->total,
                'count' => (int) $row->count,
            ]);

        // --- Recent validated/paid purchases with audit trail ---
        $recentPurchases = Purchase::query()
            ->with(['user:id,name,email', 'course:id,title'])
            ->whereIn('status', $revenueStatuses)
            ->latest()
            ->limit(20)
            ->get();

        $purchaseIds = $recentPurchases->pluck('id');

        // Fetch the audit entries that show who authorized each purchase
        $auditsByPurchase = PurchaseStatusAudit::query()
            ->with('changedByUser:id,name,email')
            ->whereIn('purchase_id', $purchaseIds)
            ->whereIn('to_status', $revenueStatuses)
            ->orderByDesc('created_at')
            ->get()
            ->groupBy('purchase_id');

        $recentValidated = $recentPurchases->map(function (Purchase $purchase) use ($auditsByPurchase) {
            $audit = $auditsByPurchase->get($purchase->id)?->first();
            $authorizer = $audit?->changedByUser;

            return [
                'id' => $purchase->id,
                'user_name' => $purchase->user?->name,
                'course_title' => $purchase->course?->title,
                'amount' => (float) $purchase->amount,
                'bank_entity' => $purchase->bank_entity,
                'operation_number' => $purchase->operation_number,
                'receipt_url' => $purchase->receipt_path
                    ? route('api.v1.files.receipt', ['purchase' => $purchase->id], false)
                    : null,
                'status' => $purchase->status,
                'validated_at' => $audit?->created_at,
                'authorized_by' => $authorizer ? [
                    'id' => $authorizer->id,
                    'name' => $authorizer->name,
                    'email' => $authorizer->email,
                ] : null,
            ];
        });

        // --- Payment methods breakdown ---
        $paymentMethods = Purchase::query()
            ->whereIn('status', $revenueStatuses)
            ->whereNotNull('payment_method')
            ->where('payment_method', '!=', '')
            ->select(
                'payment_method as method',
                DB::raw('SUM(amount) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('payment_method')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'method' => $row->method,
                'total' => (float) $row->total,
                'count' => (int) $row->count,
            ]);

        return response()->json([
            'total_revenue' => $totalRevenue,
            'paid_count' => $paidCount,
            'pending_count' => $pendingCount,
            'validated_count' => $validatedCount,
            'rejected_count' => $rejectedCount,
            'by_course' => $byCourse,
            'by_entity' => $byEntity,
            'monthly_trend' => $monthlyTrend,
            'recent_validated' => $recentValidated,
            'payment_methods' => $paymentMethods,
        ]);
    }
}
