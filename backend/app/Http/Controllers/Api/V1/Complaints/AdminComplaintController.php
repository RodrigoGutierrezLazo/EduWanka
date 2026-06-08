<?php

namespace App\Http\Controllers\Api\V1\Complaints;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use App\Services\TenantManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Gestión del Libro de Reclamaciones por parte del admin de una institución.
 * Todas las consultas quedan acotadas al tenant en contexto (resuelto por
 * TenantManager + middleware tenant.verify), de modo que un admin del Tenant A
 * nunca ve ni modifica reclamos del Tenant B.
 */
class AdminComplaintController extends Controller
{
    private function tenantId(): ?int
    {
        return app(TenantManager::class)->getTenantId();
    }

    public function index(Request $request): JsonResponse
    {
        $query = Complaint::query()
            ->forTenant($this->tenantId())
            ->with(['course:id,title', 'user:id,name,email'])
            ->latest();

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('full_name', 'like', "%{$search}%")
                    ->orWhere('document_number', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate(min((int) $request->query('per_page', 20), 200)));
    }

    public function show(int $id): JsonResponse
    {
        $complaint = Complaint::query()
            ->forTenant($this->tenantId())
            ->with(['course:id,title', 'user:id,name,email', 'respondedBy:id,name'])
            ->findOrFail($id);

        return response()->json(['data' => $complaint]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $complaint = Complaint::query()
            ->forTenant($this->tenantId())
            ->findOrFail($id);

        $data = $request->validate([
            'status'   => ['sometimes', 'required', Rule::in(Complaint::STATUSES)],
            'response' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ]);

        if (array_key_exists('response', $data) && $data['response'] !== null && $data['response'] !== '') {
            $data['responded_by_user_id'] = $request->user()->id;
            $data['responded_at'] = now();
        }

        $complaint->update($data);

        return response()->json([
            'message' => 'Reclamo actualizado.',
            'data' => $complaint->fresh(['respondedBy:id,name']),
        ]);
    }
}
