<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LogoutController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        // Igual que en Login/Register: solo tocamos la sesión si Sanctum
        // realmente arrancó una para esta petición (reconocida como del SPA
        // vía Origin/Referer en SANCTUM_STATEFUL_DOMAINS). Si no, `session()`
        // lanzaría `RuntimeException: Session store not set on request.`
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'message' => 'Logged out',
        ]);
    }
}
