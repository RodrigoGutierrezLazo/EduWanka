<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\TenantManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class RegisterController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $tenantManager = app(TenantManager::class);

        if (!$tenantManager->hasTenant()) {
            return response()->json([
                'message' => 'El contexto de la institución es requerido.'
            ], 400);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'dni' => ['required', 'string', 'max:20', 'unique:users,dni'],
            'phone' => ['required', 'string', 'max:20'],
            'city' => ['nullable', 'string', 'max:255'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'last_name' => $data['last_name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => 'student',
            'dni' => $data['dni'],
            'phone' => $data['phone'],
            'city' => $data['city'] ?? null,
            'tenant_id' => $tenantManager->getTenantId(),
        ]);

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'token' => $token,
            ],
        ], 201);
    }
}
