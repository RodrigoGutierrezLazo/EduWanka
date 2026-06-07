<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class PasswordResetRequestController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email'
        ], [
            'email.exists' => 'No encontramos ninguna cuenta con ese correo.'
        ]);

        $user = \App\Models\User::where('email', $request->email)->first();

        // Check if there is already a pending request
        $existingRequest = \App\Models\PasswordRequest::where('email', $request->email)
            ->where('status', 'pending')
            ->first();

        if ($existingRequest) {
            return response()->json([
                'message' => 'Ya tienes una solicitud pendiente. Por favor espera a que el administrador la apruebe.'
            ], 400);
        }

        \App\Models\PasswordRequest::create([
            'user_id' => $user->id,
            'email' => $request->email,
            'status' => 'pending'
        ]);

        return response()->json([
            'message' => 'Solicitud enviada correctamente. El administrador te enviará tu nueva contraseña al correo.'
        ]);
    }
}
