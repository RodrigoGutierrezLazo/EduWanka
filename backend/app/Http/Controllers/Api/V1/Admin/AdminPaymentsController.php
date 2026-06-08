<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminPaymentsController extends Controller
{
    public function history(Request $request): JsonResponse
    {
        $query = Purchase::query()
            ->with(['user:id,name,email,dni,phone,city', 'course:id,title,code,price'])
            ->latest();

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($dateFrom = $request->query('date_from')) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo = $request->query('date_to')) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $paginated = $query->paginate(min((int) $request->query('per_page', 50), 200));

        $paginated->getCollection()->transform(function (Purchase $p) {
            return [
                'id' => $p->id,
                'user' => $p->user,
                'course' => $p->course,
                'amount' => $p->amount,
                'currency' => $p->currency,
                'status' => $p->status,
                'payment_method' => $p->payment_method,
                'payment_modality' => $p->payment_modality,
                'bank_entity' => $p->bank_entity,
                'operation_number' => $p->operation_number,
                'declared_amount' => $p->declared_amount,
                'receipt_path' => $p->receipt_path,
                'receipt_url' => $p->receipt_path ? route('api.v1.files.receipt', ['purchase' => $p->id], false) : null,
                'certificate_delivery' => $p->certificate_delivery,
                'delivery_company' => $p->delivery_company,
                'delivery_address' => $p->delivery_address,
                'shipping_status' => $p->shipping_status,
                'tracking_number' => $p->tracking_number,
                'next_course_interest' => $p->next_course_interest,
                'certification_institution' => $p->certification_institution,
                'accepted_terms_at' => $p->accepted_terms_at,
                'paid_at' => $p->paid_at,
                'created_at' => $p->created_at,
            ];
        });

        return response()->json($paginated);
    }

    public function updateShippingStatus(Request $request, Purchase $purchase): JsonResponse
    {
        $request->validate([
            'shipping_status' => 'required|string|in:pending,ready_for_pickup,shipped,delivered,digital_sent',
            'tracking_number' => 'nullable|string|max:120',
        ]);

        $purchase->update([
            'shipping_status' => $request->shipping_status,
            'tracking_number' => $request->tracking_number ?? $purchase->tracking_number,
        ]);

        return response()->json([
            'message'  => 'Estado de envío actualizado correctamente.',
            'purchase' => $purchase,
        ]);
    }
}
