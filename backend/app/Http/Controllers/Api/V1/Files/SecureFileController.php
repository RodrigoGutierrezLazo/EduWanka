<?php

namespace App\Http\Controllers\Api\V1\Files;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Purchase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Hallazgo 2.5: los recibos de pago y los certificados se servían como archivos
 * estáticos públicos bajo `/storage/*`, accesibles por cualquiera que adivinara
 * (o filtrara) la ruta, sin ningún control de autenticación ni de tenant.
 *
 * Este controlador centraliza la entrega de esos archivos sensibles detrás de:
 *   - `auth:sanctum`  → exige sesión válida (cookie httpOnly del SPA),
 *   - `tenant.verify` → el usuario pertenece al tenant en contexto,
 *   - autorización por recurso → además del tenant (que ya acota el binding de
 *     ruta vía TenantScope), se valida que el solicitante sea staff
 *     (admin/superadmin) o el propio dueño del recurso.
 *
 * Nota de diseño: se optó por endpoints autenticados por cookie en lugar de
 * `URL::temporarySignedRoute` porque la arquitectura es multi-tenant por
 * subdominio (azul.localhost, verde.localhost, *.eduwanka.pe). Las URLs
 * firmadas de Laravel atan la firma al host exacto, por lo que se romperían al
 * generarse con `APP_URL` y consumirse desde un subdominio de tenant distinto.
 * La cookie de sesión, en cambio, está scoped a `*.dominio` y viaja sola en
 * navegación directa (nueva pestaña/descarga), cumpliendo el mismo objetivo de
 * forma más robusta en este escenario.
 */
class SecureFileController extends Controller
{
    /**
     * Descarga el comprobante de pago de una compra.
     * El binding de ruta ya queda acotado al tenant actual por el TenantScope
     * global de Purchase (una compra de otro tenant devuelve 404).
     */
    public function receipt(Request $request, Purchase $purchase): StreamedResponse
    {
        $user = $request->user();

        $isOwner = $purchase->user_id !== null && $purchase->user_id === $user->id;
        if (! $this->isStaff($user) && ! $isOwner) {
            abort(403, 'No autorizado para ver este comprobante.');
        }

        if (! $purchase->receipt_path) {
            abort(404, 'Esta compra no tiene comprobante adjunto.');
        }

        return $this->streamPrivateOrPublic($purchase->receipt_path);
    }

    /**
     * Descarga el PDF de un certificado.
     * El binding de ruta ya queda acotado al tenant actual por el TenantScope
     * global de Certificate.
     */
    public function certificate(Request $request, Certificate $certificate): StreamedResponse
    {
        $user = $request->user();

        $isOwner = $certificate->user_id !== null && $certificate->user_id === $user->id;
        if (! $this->isStaff($user) && ! $isOwner) {
            abort(403, 'No autorizado para ver este certificado.');
        }

        if (! $certificate->file_path) {
            abort(404, 'Este certificado no tiene archivo generado.');
        }

        return $this->streamPrivateOrPublic($certificate->file_path);
    }

    private function isStaff($user): bool
    {
        return $user !== null && in_array($user->role, ['admin', 'superadmin'], true);
    }

    /**
     * Sirve el archivo buscándolo primero en el disco privado `local` (donde se
     * guardan los archivos sensibles nuevos) y, como respaldo, en el disco
     * `public` (archivos heredados antes de esta corrección). Se entrega inline
     * para previsualización en el navegador.
     */
    private function streamPrivateOrPublic(string $path): StreamedResponse
    {
        $path = ltrim($path, '/');

        foreach (['local', 'public'] as $disk) {
            if (Storage::disk($disk)->exists($path)) {
                return Storage::disk($disk)->response($path, basename($path), [
                    'Content-Disposition' => 'inline; filename="' . basename($path) . '"',
                ]);
            }
        }

        abort(404, 'Archivo no encontrado.');
    }
}
