<?php

namespace App\Http\Controllers\Api\V1\Learning;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Verificación pública de certificados.
 *
 * Endurecimiento de seguridad:
 * - Acepta búsqueda por código (obligatorio).
 * - Si se proporciona DNI, valida que coincida con el registro.
 * - Rechaza certificados revocados o inactivos (HTTP 410 Gone).
 * - Limita el ratio de peticiones (rate limit a nivel de ruta: 20/min).
 * - Registra intentos para auditoría.
 */
class VerifyCertificateController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $data = $request->validate([
            'certificate_code' => ['required', 'string', 'max:100'],
            'dni'              => ['required', 'string', 'max:30'],
        ]);

        $code = trim($data['certificate_code']);
        $dni  = trim($data['dni']);

        $certificate = Certificate::with(['user:id,name,email,dni', 'course:id,title,code'])
            ->where('certificate_code', $code)
            ->first();

        // Log para auditoría - útil para detectar fuerza bruta
        Log::info('certificate.verify.attempt', [
            'code'    => $code,
            'has_dni' => $dni !== null && $dni !== '',
            'ip'      => $request->ip(),
            'found'   => $certificate !== null,
        ]);

        if (!$certificate) {
            return response()->json([
                'valid'   => false,
                'message' => 'Certificado no encontrado o código inválido.',
            ], 404);
        }

        // Validar estado: certificado revocado o inactivo no es válido
        if ($certificate->isRevoked() || $certificate->status !== 'active') {
            return response()->json([
                'valid'      => false,
                'message'    => 'Este certificado fue revocado o está inactivo.',
                'status'     => $certificate->status,
                'revoked_at' => $certificate->revoked_at?->toIso8601String(),
            ], 410); // 410 Gone - apropiado para recurso revocado
        }

        // DNI obligatorio: debe coincidir con el registro del certificado
        $certDni = trim((string) ($certificate->dni ?? $certificate->user?->dni ?? ''));
        if ($certDni === '' || strcasecmp($certDni, $dni) !== 0) {
            return response()->json([
                'valid'   => false,
                'message' => 'El DNI no coincide con los datos del certificado.',
            ], 422);
        }

        return response()->json([
            'valid' => true,
            'data'  => [
                'student_name'     => $certificate->student_name ?? $certificate->user?->name,
                'course_code'      => $certificate->course_code ?? $certificate->course?->code,
                'course_title'     => $certificate->course?->title,
                'certificate_code' => $certificate->certificate_code,
                'score'            => $certificate->score,
                'grade'            => $certificate->grade,
                'issue_date'       => $certificate->created_at?->toIso8601String(),
                'status'           => $certificate->status,
                'verified_at'      => now()->toIso8601String(),
                'institution'      => 'EduWanka',
            ],
        ]);
    }
}
