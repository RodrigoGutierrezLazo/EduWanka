<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Log;

class ForgotPasswordController extends Controller
{
    public function __invoke(Request $request)
    {
        $request->validate(['email' => 'required|email|exists:users,email'], [
            'email.exists' => 'No encontramos ninguna cuenta registrada con ese correo.'
        ]);

        try {
            // Esto creará el token en password_reset_tokens y disparará la notificación
            $status = Password::broker()->sendResetLink(
                $request->only('email')
            );

            if ($status === Password::RESET_LINK_SENT) {
                return response()->json([
                    'message' => 'Te hemos enviado el enlace de restablecimiento de contraseña por correo.'
                ]);
            }

            return response()->json([
                'message' => 'No pudimos procesar la solicitud. Verifica el correo.'
            ], 400);

        } catch (\Exception $e) {
            Log::error('Error al enviar correo de restablecimiento: ' . $e->getMessage());
            
            // Recuperar el usuario para generar el token manual y loguearlo
            $user = \App\Models\User::where('email', $request->email)->first();
            if ($user) {
                $token = Password::broker()->createToken($user);
                Log::info("TOKEN DE RESTABLECIMIENTO GENERADO (Log): {$token} para el correo {$request->email}");
                
                if (app()->isLocal() || config('app.debug')) {
                    return response()->json([
                        'message' => 'Simulación: Enlace generado (ver logs del backend).',
                        'token' => $token,
                        'email' => $request->email,
                    ]);
                }
            }

            return response()->json([
                'message' => 'La solicitud fue procesada, pero el servidor de correo no está disponible.'
            ]);
        }
    }
}
