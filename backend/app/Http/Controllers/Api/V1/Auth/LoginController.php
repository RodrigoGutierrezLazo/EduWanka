<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LoginController extends Controller
{
    /**
     * Handle the incoming request.
     *
     * Autentica mediante sesión (cookie httpOnly de Sanctum/SPA) en lugar de
     * emitir un token de API legible por JavaScript, para evitar robo de
     * credenciales por XSS.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes', 'boolean'],
        ]);

        $remember = (bool) ($credentials['remember'] ?? false);

        if (! Auth::guard('web')->attempt([
            'email' => $credentials['email'],
            'password' => $credentials['password'],
        ], $remember)) {
            return response()->json([
                'message' => 'Invalid credentials',
            ], 401);
        }

        // Sanctum solo arranca una sesión cuando `EnsureFrontendRequestsAreStateful`
        // reconoce la petición como proveniente del SPA (Origin/Referer en
        // `SANCTUM_STATEFUL_DOMAINS`). Si un cliente no-navegador (script,
        // healthcheck, dominio mal configurado) llega hasta aquí sin sesión,
        // regenerar lanzaría `RuntimeException: Session store not set on
        // request.`; nos limitamos a regenerar cuando realmente hay sesión que
        // proteger contra fijación, evitando un 500 por una petición atípica.
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        /** @var User $user */
        $user = Auth::guard('web')->user();

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }
}
