<?php

namespace App\Http\Controllers\Api\V1\Superadmin;

use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class TenantManagementController
{
    public function index(): JsonResponse
    {
        // El superadmin del SaaS quiere ver todos los inquilinos
        // Usamos sin el global scope si lo hubiera, pero Tenants no tiene BelongsToTenant.
        $tenants = Tenant::orderBy('created_at', 'desc')->get();
        return response()->json($tenants);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:tenants,slug',
            'domain' => 'nullable|string|max:255|unique:tenants,domain',
            'logo_path' => 'nullable|string|max:255',
            'primary_color' => 'nullable|string|max:7',
            'secondary_color' => 'nullable|string|max:7',
            'status' => 'nullable|string|in:active,suspended',
        ]);

        $tenant = Tenant::create($validated);

        return response()->json([
            'message' => 'Institution created successfully.',
            'tenant' => $tenant
        ], 210); // Laravel standard or 201 Created
    }

    public function show(Tenant $tenant): JsonResponse
    {
        return response()->json($tenant);
    }

    public function update(Request $request, Tenant $tenant): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'slug' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('tenants', 'slug')->ignore($tenant->id),
            ],
            'domain' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('tenants', 'domain')->ignore($tenant->id),
            ],
            'logo_path' => 'nullable|string|max:255',
            'primary_color' => 'nullable|string|max:7',
            'secondary_color' => 'nullable|string|max:7',
            'status' => 'sometimes|required|string|in:active,suspended',
        ]);

        $tenant->update($validated);

        return response()->json([
            'message' => 'Institution updated successfully.',
            'tenant' => $tenant
        ]);
    }

    public function destroy(Tenant $tenant): JsonResponse
    {
        $tenant->delete();

        return response()->json([
            'message' => 'Institution deleted successfully.'
        ]);
    }

    public function toggleStatus(Tenant $tenant): JsonResponse
    {
        $tenant->status = $tenant->status === 'active' ? 'suspended' : 'active';
        $tenant->save();

        return response()->json([
            'message' => "Institution status changed to {$tenant->status}.",
            'tenant' => $tenant
        ]);
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension());
        $filename = 'tenant-logo-' . now()->format('YmdHis') . '-' . Str::random(5) . '.' . $extension;
        $path = $file->storeAs('tenants/logos', $filename, 'public');

        $fullUrl = '/storage/' . ltrim($path, '/');

        return response()->json([
            'message' => 'Logo uploaded successfully.',
            'url'     => $fullUrl,
        ]);
    }
}
