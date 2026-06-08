<?php

namespace App\Http\Controllers\Api\V1\Complaints;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreComplaintRequest;
use App\Models\Complaint;
use App\Services\TenantManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Endpoints públicos del Libro de Reclamaciones (sin auth: el acceso es libre
 * por ley). El ámbito (tenant_id) lo determina el servidor a partir del origen
 * de la solicitud (TenantManager, resuelto por el subdominio/host), NUNCA por
 * un campo del cuerpo, para evitar que un usuario asigne su reclamo a otra
 * institución.
 */
class ComplaintController extends Controller
{
    /**
     * Registrar un reclamo/queja. Devuelve el folio público de seguimiento.
     */
    public function store(StoreComplaintRequest $request): JsonResponse
    {
        $tenantManager = app(TenantManager::class);
        $tenantId = $tenantManager->getTenantId(); // null = libro general de EduWanka

        $data = $request->validated();

        $complaint = DB::transaction(function () use ($data, $tenantId, $request) {
            // Bloqueo para evitar folios duplicados ante envíos concurrentes.
            return Complaint::create([
                'code'             => Complaint::generateCode($tenantId),
                'tenant_id'        => $tenantId,
                'course_id'        => $data['course_id'] ?? null,
                'user_id'          => $request->user()?->id,
                'type'             => $data['type'],
                'full_name'        => $data['full_name'],
                'document_type'    => $data['document_type'] ?? 'DNI',
                'document_number'  => $data['document_number'],
                'email'            => $data['email'],
                'phone'            => $data['phone'] ?? null,
                'address'          => $data['address'] ?? null,
                'is_minor'         => $data['is_minor'] ?? false,
                'guardian_name'    => $data['guardian_name'] ?? null,
                'guardian_document_number' => $data['guardian_document_number'] ?? null,
                'claimed_item'      => $data['claimed_item'],
                'claimed_item_type' => $data['claimed_item_type'] ?? 'servicio',
                'claimed_amount'    => $data['claimed_amount'] ?? null,
                'detail'            => $data['detail'],
                'consumer_request'  => $data['consumer_request'],
                'status'            => 'recibido',
                'ip_address'        => $request->ip(),
                'user_agent'        => $request->userAgent(),
            ]);
        });

        return response()->json([
            'message' => 'Reclamo registrado correctamente.',
            'data' => [
                'code'       => $complaint->code,
                'status'     => $complaint->status,
                'created_at' => $complaint->created_at->toIso8601String(),
            ],
        ], 201);
    }

    /**
     * Consultar el estado de un reclamo por su folio público. Expone solo datos
     * de seguimiento, nunca información de otros reclamantes.
     */
    public function track(Request $request, string $code): JsonResponse
    {
        $tenantManager = app(TenantManager::class);

        // Acotar al ámbito del origen: en un subdominio de tenant solo se ven
        // sus folios; en el dominio raíz, los del libro general.
        $complaint = Complaint::query()
            ->where('code', $code)
            ->when($tenantManager->hasTenant(), fn ($q) => $q->where('tenant_id', $tenantManager->getTenantId()))
            ->when(! $tenantManager->hasTenant(), fn ($q) => $q->whereNull('tenant_id'))
            ->first();

        if (! $complaint) {
            return response()->json(['message' => 'No se encontró un reclamo con ese folio.'], 404);
        }

        return response()->json([
            'data' => [
                'code'         => $complaint->code,
                'type'         => $complaint->type,
                'status'       => $complaint->status,
                'claimed_item' => $complaint->claimed_item,
                'response'     => $complaint->response,
                'created_at'   => $complaint->created_at->toIso8601String(),
                'responded_at' => $complaint->responded_at?->toIso8601String(),
            ],
        ]);
    }
}
