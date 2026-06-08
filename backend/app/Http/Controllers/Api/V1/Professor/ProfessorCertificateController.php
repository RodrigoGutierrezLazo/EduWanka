<?php

namespace App\Http\Controllers\Api\V1\Professor;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\CertificateTemplate;
use App\Models\QuestionnaireAttempt;
use App\Models\Purchase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use setasign\Fpdi\Fpdi;

/**
 * Sprint 9 → Sprint 12 — Emisión de certificados por el docente responsable.
 *
 * Migrado de ExamAttempt (legacy, tabla eliminada) a QuestionnaireAttempt.
 * Solo el profesor designado (assigned_prof_id) puede emitir certificados
 * para su curso.
 */
class ProfessorCertificateController extends Controller
{
    /** Verifica que el curso le pertenece al profesor autenticado. */
    private function authorizedCourse(Request $request, int $courseId): Course
    {
        return Course::where('id', $courseId)
            ->where('assigned_prof_id', $request->user()->id)
            ->firstOrFail();
    }

    /**
     * Lista alumnos que aprobaron pero aún no tienen certificado emitido.
     * Solo para cursos asignados al profesor autenticado.
     */
    public function pending(Request $request, int $courseId): JsonResponse
    {
        $course = $this->authorizedCourse($request, $courseId);

        // Alumnos matriculados y con pago válido
        $enrolledUserIds = Purchase::where('course_id', $courseId)
            ->whereIn('status', [Purchase::STATUS_VALIDATED, Purchase::STATUS_PAID])
            ->pluck('user_id');

        // Buscar intentos aprobados en cuestionarios del curso
        $passedAttempts = QuestionnaireAttempt::whereIn('user_id', $enrolledUserIds)
            ->whereHas('questionnaire', fn ($q) => $q->where('course_id', $courseId))
            ->where('score', '>=', 14)
            ->with(['user' => fn($q) => $q->select('id', 'name', 'last_name', 'email', 'dni')])
            ->orderByDesc('score')
            ->get()
            ->unique('user_id');

        // Filtrar quienes ya tienen certificado
        $alreadyCertified = Certificate::where('course_id', $courseId)
            ->where('status', 'active')
            ->pluck('user_id')
            ->toArray();

        $pending = $passedAttempts->filter(
            fn($attempt) => !in_array($attempt->user_id, $alreadyCertified)
        )->values();

        return response()->json([
            'data'   => $pending,
            'course' => $course->only(['id', 'title', 'code']),
            'stats'  => [
                'enrolled'    => $enrolledUserIds->count(),
                'passed'      => $passedAttempts->count(),
                'certified'   => count($alreadyCertified),
                'pending'     => $pending->count(),
            ],
        ]);
    }

    /**
     * Emite un certificado para un alumno que aprobó.
     * Valida que el profesor sea el responsable del curso.
     */
    public function issue(Request $request, int $courseId, int $userId): JsonResponse
    {
        $course = $this->authorizedCourse($request, $courseId);

        // Verificar compra válida
        $hasPurchase = Purchase::where('user_id', $userId)
            ->where('course_id', $courseId)
            ->whereIn('status', [Purchase::STATUS_VALIDATED, Purchase::STATUS_PAID])
            ->exists();

        if (!$hasPurchase) {
            return response()->json(['message' => 'El alumno no tiene una inscripción válida en este curso.'], 403);
        }

        // Verificar que aprobó (cuestionarios del curso)
        $bestAttempt = QuestionnaireAttempt::where('user_id', $userId)
            ->whereHas('questionnaire', fn ($q) => $q->where('course_id', $courseId))
            ->where('score', '>=', 14)
            ->orderByDesc('score')
            ->first();

        if (!$bestAttempt) {
            return response()->json(['message' => 'El alumno no tiene evaluaciones aprobadas en este curso.'], 422);
        }

        // Verificar que no ya tenga certificado activo
        $existing = Certificate::where('user_id', $userId)
            ->where('course_id', $courseId)
            ->where('status', 'active')
            ->first();

        if ($existing) {
            return response()->json([
                'message'     => 'Este alumno ya tiene un certificado activo para este curso.',
                'certificate' => $existing,
            ], 409);
        }

        // Emitir certificado
        $code = strtoupper($course->code)
            . '-' . str_pad((string) $userId, 4, '0', STR_PAD_LEFT)
            . '-' . date('Y');

        $student = $bestAttempt->user()->select('id', 'name', 'last_name', 'email', 'dni')->first();

        $certificate = Certificate::create([
            'user_id'          => $userId,
            'exam_attempt_id'  => null,
            'course_id'        => $courseId,
            'course_code'      => $course->code,
            'score'            => $bestAttempt->score,
            'certificate_code' => $code,
            'dni'              => $student->dni,
            'student_name'     => trim($student->name . ' ' . $student->last_name),
            'grade'            => (string) $bestAttempt->score,
            'status'           => 'active',
            'notes'            => 'Emitido por docente responsable: ' . $request->user()->name,
        ]);

        // Intentar generar PDF usando template del curso o el primero disponible
        try {
            $template = $course->certificateTemplate ?? CertificateTemplate::first();
            if ($template && Storage::disk('public')->exists($template->template_path)) {
                $filePath = $this->generatePdfForCertificate($certificate, $template);
                $certificate->update(['file_path' => $filePath]);
            }
        } catch (\Exception $e) {
            // Log error but don't fail the certificate issuance
            \Log::warning('Certificate PDF generation failed: ' . $e->getMessage());
        }

        return response()->json([
            'message'     => 'Certificado emitido exitosamente.',
            'certificate' => $certificate->load(['user', 'course']),
        ], 201);
    }

    /** Generates PDF for a certificate using a template. */
    private function generatePdfForCertificate(Certificate $certificate, CertificateTemplate $template): string
    {
        $templatePath = Storage::disk('public')->path($template->template_path);
        $fields = $template->fields ?? $this->defaultFields();

        $outputPath = 'certificates/' . $certificate->courseCode . '/' . Str::slug($certificate->certificate_code) . '.pdf';
        $fullPath = Storage::disk('public')->path($outputPath);

        if (!is_dir(dirname($fullPath))) {
            mkdir(dirname($fullPath), 0775, true);
        }

        $this->generatePdf($templatePath, [
            'student_name' => $certificate->student_name,
            'code'         => $certificate->certificate_code,
            'grade'        => $certificate->grade,
        ], $fields, $fullPath);

        return $outputPath;
    }

    /** Generates PDF from template. */
    private function generatePdf(string $templatePath, array $certificate, array $fields, string $outputPath): void
    {
        $pdf = new Fpdi();
        $pageCount = $pdf->setSourceFile($templatePath);

        for ($pageNumber = 1; $pageNumber <= $pageCount; $pageNumber++) {
            $templatePage = $pdf->importPage($pageNumber);
            $size = $pdf->getTemplateSize($templatePage);
            $orientation = ($size['width'] ?? 0) > ($size['height'] ?? 0) ? 'L' : 'P';

            $pdf->AddPage($orientation, [$size['width'], $size['height']]);
            $pdf->useTemplate($templatePage, 0, 0, $size['width'], $size['height']);

            $this->drawField($pdf, $fields['name'] ?? [], $pageNumber, $certificate['student_name'], 'B');
            $this->drawField($pdf, $fields['code'] ?? [], $pageNumber, $certificate['code']);
            $this->drawField($pdf, $fields['grade'] ?? [], $pageNumber, $certificate['grade']);
        }

        $pdf->Output('F', $outputPath);
    }

    /** Draws a text field on the PDF. */
    private function drawField(Fpdi $pdf, array $field, int $pageNumber, string $value, string $style = ''): void
    {
        if (($field['page'] ?? 1) !== $pageNumber) {
            return;
        }

        $fontSize = max(6.0, (float) ($field['fontSize'] ?? 12));
        $width = max(10.0, (float) ($field['width'] ?? 50));
        $align = match (strtolower((string) ($field['align'] ?? 'left'))) {
            'center' => 'C',
            'right' => 'R',
            default => 'L',
        };

        $text = $this->pdfText($value);
        $pdf->SetFont('Arial', $style, $fontSize);
        $pdf->SetTextColor(15, 42, 33);

        while ($fontSize > 6.0 && $pdf->GetStringWidth($text) > $width) {
            $fontSize -= 0.5;
            $pdf->SetFont('Arial', $style, $fontSize);
        }

        $pdf->SetXY((float) ($field['x'] ?? 10), (float) ($field['y'] ?? 10));
        $pdf->Cell($width, max(5.0, $fontSize * 0.44), $text, 0, 0, $align);
    }

    /** Converts text to PDF-compatible encoding. */
    private function pdfText(string $value): string
    {
        $converted = @iconv('UTF-8', 'windows-1252//TRANSLIT', $value);
        return $converted !== false ? $converted : $value;
    }

    /**
     * Lista certificados ya emitidos para un curso del profesor.
     * Devuelve todos los certificados (activos y revocados).
     */
    public function issued(Request $request, int $courseId): JsonResponse
    {
        $course = $this->authorizedCourse($request, $courseId);

        $certificates = Certificate::with(['user:id,name,last_name,email,dni'])
            ->where('course_id', $courseId)
            ->latest()
            ->get()
            ->map(fn (Certificate $cert) => [
                'id'               => $cert->id,
                'user'             => $cert->user,
                'certificate_code' => $cert->certificate_code,
                'dni'              => $cert->dni ?? $cert->user?->dni,
                'student_name'     => $cert->student_name ?? $cert->user?->name,
                'grade'            => $cert->grade,
                'score'            => $cert->score,
                'status'           => $cert->status,
                'is_revoked'       => $cert->isRevoked(),
                'revoked_at'       => $cert->revoked_at,
                'revoked_reason'   => $cert->revoked_reason,
                'file_path'        => $cert->file_path,
                'file_url'         => $cert->file_path ? route('api.v1.files.certificate', ['certificate' => $cert->id], false) : null,
                'created_at'       => $cert->created_at,
            ]);

        return response()->json([
            'data'   => $certificates,
            'course' => $course->only(['id', 'title', 'code']),
        ]);
    }

    /**
     * Elimina un certificado emitido por el profesor.
     * Solo puede eliminar certificados de sus propios cursos.
     */
    public function destroy(Request $request, int $courseId, int $certificateId): JsonResponse
    {
        $this->authorizedCourse($request, $courseId);

        $certificate = Certificate::where('id', $certificateId)
            ->where('course_id', $courseId)
            ->firstOrFail();

        // Delete the PDF file if exists
        if ($certificate->file_path && Storage::disk('public')->exists($certificate->file_path)) {
            Storage::disk('public')->delete($certificate->file_path);
        }

        $certificate->delete();

        return response()->json(['message' => 'Certificado eliminado correctamente.']);
    }

    /** Default certificate fields. */
    private function defaultFields(): array
    {
        return [
            'name' => ['page' => 1, 'x' => 28, 'y' => 104, 'width' => 240, 'fontSize' => 22, 'align' => 'center'],
            'code' => ['page' => 2, 'x' => 241, 'y' => 155, 'width' => 42, 'fontSize' => 12, 'align' => 'left'],
            'grade' => ['page' => 2, 'x' => 241, 'y' => 166, 'width' => 42, 'fontSize' => 12, 'align' => 'left'],
        ];
    }
}
