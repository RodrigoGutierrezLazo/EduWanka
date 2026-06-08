<?php

namespace App\Http\Controllers\Api\V1\Complaints;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Vista del superadmin de EduWanka sobre el Libro de Reclamaciones:
 *   - scope=general → libro general de la plataforma (tenant_id = NULL).
 *   - scope=all     → vista consolidada de todos los tenants + el general.
 * Por defecto, 'general'.
 */
class SuperadminComplaintController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $scope = $request->query('scope', 'general');

        $query = Complaint::query()
            ->with(['tenant:id,name,slug', 'course:id,title', 'user:id,name,email'])
            ->latest();

        if ($scope === 'general') {
            $query->general();
        }
        // scope=all → sin filtro de tenant.

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        return response()->json($query->paginate(min((int) $request->query('per_page', 20), 200)));
    }
}
