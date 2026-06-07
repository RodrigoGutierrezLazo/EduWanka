<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\CertificateTemplate;
use App\Models\Course;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;
use setasign\Fpdi\Fpdi;
use ZipArchive;

/**
 * Importación masiva de certificados desde XLSX/CSV.
 *
 * Diseñado para certificados de cursos antiguos (anteriores al sistema actual)
 * cuyas inscripciones, pagos y notas no están en la base de datos.
 *
 * Flujo:
 *  1. POST /admin/certificates/bulk/preview
 *     - Sube archivo XLSX/CSV.
 *     - Detecta columnas automáticamente o pide mapeo manual.
 *     - Devuelve resumen con filas válidas, ignoradas y errores.
 *
 *  2. POST /admin/certificates/bulk/import
 *     - Confirma la importación con el mismo archivo y mapeo.
 *     - Genera PDF por fila (si hay plantilla).
 *     - Crea certificado en BD.
 *     - Crea usuario mínimo si no existe (basado en DNI).
 *     - Devuelve ZIP con todos los PDFs y resumen final.
 *
 * Reutiliza patrones de AdminEnrollmentController (parser de columnas) y
 * AdminCertificatesController (generación de PDF).
 */
class CertificateBulkImportController extends Controller
{
    private const REQUIRED_FIELDS = ['student_name', 'dni'];
    private const OPTIONAL_FIELDS = ['code', 'grade', 'course_title', 'issue_date'];

    /** Vista previa del archivo: detecta columnas, valida filas. */
    public function preview(Request $request): JsonResponse
    {
        $request->validate([
            'source'      => ['required', 'file', 'mimes:csv,txt,xlsx,xls', 'max:20480'],
            'column_map'  => ['nullable', 'string'],
            'course_id'   => ['nullable', 'integer', 'exists:courses,id'],
            'course_code' => ['nullable', 'string', 'max:100'],
        ]);

        try {
            $spreadsheet = IOFactory::load($request->file('source')->getPathname());
            $sheet = $spreadsheet->getActiveSheet();
            $rawRows = $sheet->toArray(null, true, true, true);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'No se pudo leer el archivo: ' . $e->getMessage(),
            ], 422);
        }

        if (count($rawRows) < 2) {
            return response()->json([
                'message' => 'El archivo debe tener al menos un encabezado y una fila de datos.',
            ], 422);
        }

        $header = array_shift($rawRows);
        $columnMapInput = $request->input('column_map');

        // Si llega un mapeo manual, usarlo; si no, intentar auto-detección
        if ($columnMapInput) {
            $headerMap = $this->validManualMap(json_decode($columnMapInput, true) ?: [], $header);
        } else {
            $headerMap = $this->mapHeaders($header);
        }

        // Verificar que tenemos las columnas requeridas
        $missing = array_diff(self::REQUIRED_FIELDS, array_keys($headerMap));
        if (!empty($missing)) {
            return response()->json([
                'needs_mapping'    => true,
                'available_columns' => $this->buildAvailableColumns($header),
                'detected_map'     => $headerMap,
                'missing_required' => array_values($missing),
                'message'          => 'No se pudieron detectar todas las columnas necesarias. Asigna las columnas manualmente.',
            ]);
        }

        // Procesar filas y generar resumen
        $rows = [];
        $valid = 0;
        $errors = 0;
        $duplicates = 0;
        $existingCodes = Certificate::whereIn('certificate_code', $this->extractCodes($rawRows, $headerMap))
            ->pluck('certificate_code')
            ->toArray();

        foreach ($rawRows as $rowNum => $row) {
            $studentName = trim((string) ($row[$headerMap['student_name']] ?? ''));
            $dni         = trim((string) ($row[$headerMap['dni']] ?? ''));
            $code        = isset($headerMap['code']) ? trim((string) ($row[$headerMap['code']] ?? '')) : '';
            $grade       = isset($headerMap['grade']) ? trim((string) ($row[$headerMap['grade']] ?? '')) : '';
            $issueDate   = isset($headerMap['issue_date']) ? trim((string) ($row[$headerMap['issue_date']] ?? '')) : '';
            $courseTitle = isset($headerMap['course_title']) ? trim((string) ($row[$headerMap['course_title']] ?? '')) : '';

            // Saltar filas vacías
            if ($studentName === '' && $dni === '' && $code === '') {
                continue;
            }

            $status = 'new';
            $error = null;

            if ($studentName === '') {
                $status = 'error';
                $error = 'Falta nombre del estudiante.';
                $errors++;
            } elseif ($dni === '') {
                $status = 'error';
                $error = 'Falta DNI.';
                $errors++;
            } elseif ($code !== '' && in_array($code, $existingCodes, true)) {
                $status = 'duplicate';
                $error = 'Ya existe un certificado con este código.';
                $duplicates++;
            } else {
                $valid++;
            }

            $rows[] = [
                'row'          => (int) $rowNum,
                'student_name' => $studentName,
                'dni'          => $dni,
                'code'         => $code,
                'grade'        => $grade,
                'issue_date'   => $issueDate,
                'course_title' => $courseTitle,
                'status'       => $status,
                'error'        => $error,
            ];
        }

        return response()->json([
            'needs_mapping' => false,
            'detected_map'  => $headerMap,
            'available_columns' => $this->buildAvailableColumns($header),
            'summary'       => [
                'total'      => count($rows),
                'valid'      => $valid,
                'errors'     => $errors,
                'duplicates' => $duplicates,
            ],
            'rows'          => array_slice($rows, 0, 50), // Solo primeras 50 para preview
            'rows_total'    => count($rows),
        ]);
    }

    /** Ejecuta la importación: crea certificados, genera PDFs y un ZIP. */
    public function import(Request $request): JsonResponse
    {
        $data = $request->validate([
            'source'       => ['required', 'file', 'mimes:csv,txt,xlsx,xls', 'max:20480'],
            'column_map'   => ['nullable', 'string'],
            'template_id'  => ['nullable', 'integer', 'exists:certificate_templates,id'],
            'course_id'    => ['nullable', 'integer', 'exists:courses,id'],
            'course_code'  => ['nullable', 'string', 'max:100'],
        ]);

        try {
            $spreadsheet = IOFactory::load($request->file('source')->getPathname());
            $sheet = $spreadsheet->getActiveSheet();
            $rawRows = $sheet->toArray(null, true, true, true);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'No se pudo leer el archivo: ' . $e->getMessage(),
            ], 422);
        }

        $header = array_shift($rawRows);
        $columnMapInput = $request->input('column_map');

        if ($columnMapInput) {
            $headerMap = $this->validManualMap(json_decode($columnMapInput, true) ?: [], $header);
        } else {
            $headerMap = $this->mapHeaders($header);
        }

        $missing = array_diff(self::REQUIRED_FIELDS, array_keys($headerMap));
        if (!empty($missing)) {
            return response()->json([
                'message' => 'Faltan columnas requeridas: ' . implode(', ', $missing),
                'missing_required' => array_values($missing),
            ], 422);
        }

        // Resolver plantilla (si se proporcionó) y curso
        $template = !empty($data['template_id'])
            ? CertificateTemplate::find($data['template_id'])
            : null;
        $course = !empty($data['course_id']) ? Course::find($data['course_id']) : null;
        if (!$template && $course) {
            $course->loadMissing('certificateTemplate');
            $template = $course->certificateTemplate;
        }

        $batchId = 'bulk_' . now()->format('Ymd_His') . '_' . Str::lower(Str::random(6));
        $sourceFilename = $request->file('source')->getClientOriginalName();

        $created = 0;
        $skipped = 0;
        $errors = [];
        $items = [];

        foreach ($rawRows as $rowNum => $row) {
            $studentName = trim((string) ($row[$headerMap['student_name']] ?? ''));
            $dni         = trim((string) ($row[$headerMap['dni']] ?? ''));
            $code        = isset($headerMap['code']) ? trim((string) ($row[$headerMap['code']] ?? '')) : '';
            $grade       = isset($headerMap['grade']) ? trim((string) ($row[$headerMap['grade']] ?? '')) : '';

            // Saltar filas vacías
            if ($studentName === '' && $dni === '' && $code === '') {
                continue;
            }

            if ($studentName === '' || $dni === '') {
                $errors[] = ['row' => (int) $rowNum, 'message' => 'Falta nombre o DNI'];
                $skipped++;
                continue;
            }

            // Generar código si no viene
            if ($code === '') {
                $code = $this->generateCode((int) $rowNum);
            }

            // Validar duplicado por código
            if (Certificate::where('certificate_code', $code)->exists()) {
                $errors[] = ['row' => (int) $rowNum, 'message' => "Código duplicado: $code"];
                $skipped++;
                continue;
            }

            // Resolver/crear usuario mínimo basado en DNI
            $user = $this->resolveUser($dni, $studentName);

            // Generar PDF si hay plantilla
            $filePath = null;
            if ($template) {
                try {
                    $filePath = $this->generatePdfForRow(
                        $template,
                        $batchId,
                        $code,
                        mb_strtoupper($studentName, 'UTF-8'),
                        $grade !== '' ? $grade : '-'
                    );
                } catch (\Exception $e) {
                    Log::warning('certificate.bulk.pdf_failed', [
                        'row' => $rowNum,
                        'error' => $e->getMessage(),
                    ]);
                    // Continuamos: el certificado se crea aunque falle el PDF
                }
            }

            $certificate = Certificate::create([
                'user_id'           => $user->id,
                'exam_attempt_id'   => null,
                'course_id'         => $course?->id,
                'course_code'       => $course?->code ?? $data['course_code'] ?? null,
                'score'             => $this->scoreFromGrade($grade),
                'certificate_code'  => $code,
                'dni'               => $dni,
                'student_name'      => mb_strtoupper($studentName, 'UTF-8'),
                'grade'             => $grade !== '' ? $grade : null,
                'file_path'         => $filePath,
                'status'            => 'active',
                'batch_id'          => $batchId,
                'template_name'     => $template?->name,
                'source_filename'   => $sourceFilename,
                'notes'             => 'Importado masivamente desde XLSX',
            ]);

            $items[] = [
                'id'               => $certificate->id,
                'certificate_code' => $code,
                'student_name'     => $certificate->student_name,
                'dni'              => $dni,
                'file_path'        => $filePath,
                'file_url'         => $filePath ? '/storage/' . ltrim($filePath, '/') : null,
            ];
            $created++;
        }

        // Generar ZIP con todos los PDFs
        $zipPath = $this->zipCertificates($batchId, $items);

        return response()->json([
            'batch_id'   => $batchId,
            'summary'    => [
                'created' => $created,
                'skipped' => $skipped,
                'errors'  => count($errors),
            ],
            'zip_url'    => $zipPath ? '/storage/' . ltrim($zipPath, '/') : null,
            'items'      => $items,
            'errors'     => $errors,
        ], 201);
    }

    // ─── Helpers privados ──────────────────────────────────────────────

    /** Auto-detección por nombre de columna en el encabezado. */
    private function mapHeaders(array $header): array
    {
        $map = [];
        foreach ($header as $col => $label) {
            $normalized = mb_strtolower(trim((string) $label));
            if (in_array($normalized, ['nombre', 'name', 'nombre completo', 'fullname', 'full_name', 'student_name', 'estudiante', 'alumno'])) {
                $map['student_name'] = $col;
            } elseif (in_array($normalized, ['dni', 'documento', 'doc', 'identificacion', 'identificación'])) {
                $map['dni'] = $col;
            } elseif (in_array($normalized, ['codigo', 'code', 'código', 'codigo_certificado', 'cert_code'])) {
                $map['code'] = $col;
            } elseif (in_array($normalized, ['nota', 'grade', 'calificacion', 'calificación', 'score'])) {
                $map['grade'] = $col;
            } elseif (in_array($normalized, ['curso', 'course', 'course_title', 'titulo_curso', 'título_curso'])) {
                $map['course_title'] = $col;
            } elseif (in_array($normalized, ['fecha', 'date', 'issue_date', 'fecha_emision', 'fecha_emisión'])) {
                $map['issue_date'] = $col;
            }
        }
        return $map;
    }

    /** Valida que el mapeo manual envíe columnas que existen en el archivo. */
    private function validManualMap(array $manualMap, array $header): array
    {
        $validKeys = array_merge(self::REQUIRED_FIELDS, self::OPTIONAL_FIELDS);
        $availableCols = array_keys($header);
        $result = [];
        foreach ($manualMap as $field => $col) {
            if (in_array($field, $validKeys, true) && in_array($col, $availableCols, true)) {
                $result[$field] = $col;
            }
        }
        return $result;
    }

    /** Devuelve [{letter: 'A', label: 'Nombre'}, ...] para el frontend. */
    private function buildAvailableColumns(array $header): array
    {
        $columns = [];
        foreach ($header as $col => $label) {
            $columns[] = [
                'letter' => $col,
                'label'  => trim((string) $label),
            ];
        }
        return $columns;
    }

    /** Recolecta códigos no vacíos para detectar duplicados rápidamente. */
    private function extractCodes(array $rows, array $headerMap): array
    {
        if (!isset($headerMap['code'])) {
            return [];
        }
        $codes = [];
        foreach ($rows as $row) {
            $c = trim((string) ($row[$headerMap['code']] ?? ''));
            if ($c !== '') {
                $codes[] = $c;
            }
        }
        return $codes;
    }

    /** Crea o recupera un usuario mínimo basándose en DNI. */
    private function resolveUser(string $dni, string $name): User
    {
        // Intento 1: por DNI exacto
        $user = User::where('dni', $dni)->first();
        if ($user) {
            return $user;
        }

        // Intento 2: por email "fake" único basado en DNI
        $email = Str::lower($dni) . '@certificados.eduwanka.local';
        return User::firstOrCreate(
            ['email' => $email],
            [
                'name'     => $name,
                'password' => Hash::make(Str::random(20)),
                'role'     => 'student',
                'dni'      => $dni,
            ]
        );
    }

    /** Genera código autogenerado tipo "001-2026/EduWanka". */
    private function generateCode(int $position): string
    {
        return str_pad((string) $position, 4, '0', STR_PAD_LEFT) . '-' . date('Y') . '/IMPORT';
    }

    /** Convierte una nota textual o numérica a score 0-100. */
    private function scoreFromGrade(string $grade): ?int
    {
        if ($grade === '' || $grade === '-') {
            return null;
        }
        $numeric = (float) preg_replace('/[^0-9.]/', '', $grade);
        if ($numeric <= 0) {
            return null;
        }
        if ($numeric <= 20) {
            $numeric *= 5; // escala vigesimal → centesimal
        }
        return (int) max(0, min(100, round($numeric)));
    }

    /** Genera un PDF para una fila usando la plantilla. */
    private function generatePdfForRow(CertificateTemplate $template, string $batchId, string $code, string $studentName, string $grade): string
    {
        $templatePath = Storage::disk('public')->path($template->template_path);
        if (!file_exists($templatePath)) {
            throw new \RuntimeException("Plantilla no encontrada en disco: {$template->template_path}");
        }

        $fields = $template->fields ?: [
            'name'  => ['page' => 1, 'x' => 28, 'y' => 104, 'width' => 240, 'fontSize' => 22, 'align' => 'center'],
            'code'  => ['page' => 2, 'x' => 241, 'y' => 155, 'width' => 42, 'fontSize' => 12, 'align' => 'left'],
            'grade' => ['page' => 2, 'x' => 241, 'y' => 166, 'width' => 42, 'fontSize' => 12, 'align' => 'left'],
        ];

        $outputPath = 'certificates/' . $batchId . '/' . Str::slug($code) . '.pdf';
        $absolutePath = Storage::disk('public')->path($outputPath);

        if (!is_dir(dirname($absolutePath))) {
            mkdir(dirname($absolutePath), 0775, true);
        }

        $pdf = new Fpdi();
        $pageCount = $pdf->setSourceFile($templatePath);

        for ($pageNumber = 1; $pageNumber <= $pageCount; $pageNumber++) {
            $templatePage = $pdf->importPage($pageNumber);
            $size = $pdf->getTemplateSize($templatePage);
            $orientation = ($size['width'] ?? 0) > ($size['height'] ?? 0) ? 'L' : 'P';

            $pdf->AddPage($orientation, [$size['width'], $size['height']]);
            $pdf->useTemplate($templatePage, 0, 0, $size['width'], $size['height']);

            $this->drawField($pdf, $fields['name'] ?? [], $pageNumber, $studentName, 'B');
            $this->drawField($pdf, $fields['code'] ?? [], $pageNumber, $code);
            $this->drawField($pdf, $fields['grade'] ?? [], $pageNumber, $grade);
        }

        $pdf->Output('F', $absolutePath);

        return $outputPath;
    }

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

    private function pdfText(string $value): string
    {
        $converted = @iconv('UTF-8', 'windows-1252//TRANSLIT', $value);
        return $converted !== false ? $converted : $value;
    }

    /** Empaqueta los PDFs generados en un ZIP descargable. */
    private function zipCertificates(string $batchId, array $items): ?string
    {
        $items = array_filter($items, fn ($it) => !empty($it['file_path']));
        if (empty($items)) {
            return null;
        }

        $zipPath = 'certificates/' . $batchId . '.zip';
        $absoluteZipPath = Storage::disk('public')->path($zipPath);

        if (!is_dir(dirname($absoluteZipPath))) {
            mkdir(dirname($absoluteZipPath), 0775, true);
        }

        $zip = new ZipArchive();
        if ($zip->open($absoluteZipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            return null;
        }

        foreach ($items as $item) {
            if (!empty($item['file_path']) && Storage::disk('public')->exists($item['file_path'])) {
                $zip->addFile(
                    Storage::disk('public')->path($item['file_path']),
                    basename($item['file_path'])
                );
            }
        }

        $zip->close();
        return $zipPath;
    }
}
