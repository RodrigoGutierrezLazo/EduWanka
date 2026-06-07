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
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;
use setasign\Fpdi\Fpdi;
use ZipArchive;

class AdminCertificatesController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Certificate::query()->with(['user', 'course', 'revokedBy:id,name,email']);

        // Filtro opcional por estado de revocación
        $statusFilter = $request->query('revocation_status');
        if ($statusFilter === 'active') {
            $query->whereNull('revoked_at');
        } elseif ($statusFilter === 'revoked') {
            $query->whereNotNull('revoked_at');
        }

        // Filtro opcional por curso
        if ($request->filled('course_id')) {
            $query->where('course_id', $request->query('course_id'));
        }

        $certificates = $query->latest()->paginate((int) $request->query('per_page', 50));

        $certificates->getCollection()->transform(fn (Certificate $certificate) => $this->certificatePayload($certificate));

        return response()->json($certificates);
    }

    /**
     * Revoca un certificado existente.
     * El certificado no se elimina; queda marcado con revoked_at + motivo + autor.
     * La verificación pública lo rechazará automáticamente.
     */
    public function revoke(Request $request, Certificate $certificate): JsonResponse
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:500'],
        ]);

        if ($certificate->isRevoked()) {
            return response()->json([
                'message' => 'Este certificado ya estaba revocado.',
                'certificate' => $this->certificatePayload($certificate->fresh(['user', 'course', 'revokedBy:id,name,email'])),
            ], 409);
        }

        $certificate->update([
            'revoked_at' => now(),
            'revoked_reason' => $data['reason'],
            'revoked_by_user_id' => $request->user()?->id,
        ]);

        return response()->json([
            'message' => 'Certificado revocado correctamente.',
            'certificate' => $this->certificatePayload($certificate->fresh(['user', 'course', 'revokedBy:id,name,email'])),
        ]);
    }

    /**
     * Restaura un certificado previamente revocado.
     * Limpia revoked_at, revoked_reason y revoked_by_user_id.
     */
    public function restore(Request $request, Certificate $certificate): JsonResponse
    {
        if (!$certificate->isRevoked()) {
            return response()->json([
                'message' => 'Este certificado no está revocado.',
                'certificate' => $this->certificatePayload($certificate->fresh(['user', 'course'])),
            ], 409);
        }

        $certificate->update([
            'revoked_at' => null,
            'revoked_reason' => null,
            'revoked_by_user_id' => null,
        ]);

        return response()->json([
            'message' => 'Certificado restaurado correctamente.',
            'certificate' => $this->certificatePayload($certificate->fresh(['user', 'course'])),
        ]);
    }

    /**
     * Elimina permanentemente un certificado.
     */
    public function destroy(Request $request, Certificate $certificate): JsonResponse
    {
        // Delete the PDF file if exists
        if ($certificate->file_path && Storage::disk('public')->exists($certificate->file_path)) {
            Storage::disk('public')->delete($certificate->file_path);
        }

        $certificate->delete();

        return response()->json(['message' => 'Certificado eliminado permanentemente.']);
    }

    public function templates(): JsonResponse
    {
        $templates = CertificateTemplate::latest()->get()->map(fn (CertificateTemplate $t) => [
            'id' => $t->id,
            'name' => $t->name,
            'template_path' => $t->template_path,
            'template_url' => $t->template_path ? $this->publicStorageUrl($t->template_path) : null,
            'fields' => $t->fields,
            'created_at' => $t->created_at,
        ]);

        return response()->json(['data' => $templates]);
    }

    public function storeTemplate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'template' => ['nullable', 'file', 'mimes:pdf', 'max:20480'],
            'fields' => ['nullable'],
        ]);

        $fields = $this->decodeFields($request->input('fields'));
        $templatePath = $request->hasFile('template')
            ? $request->file('template')->store('certificate-templates', 'public')
            : null;

        $template = CertificateTemplate::create([
            'name' => $data['name'],
            'template_path' => $templatePath,
            'fields' => $fields,
            'created_by_user_id' => $request->user()?->id,
        ]);

        return response()->json($template, 201);
    }

    public function updateTemplate(Request $request, CertificateTemplate $template): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'template' => ['nullable', 'file', 'mimes:pdf', 'max:20480'],
            'fields' => ['nullable'],
        ]);

        $updateData = [];

        if (isset($data['name'])) {
            $updateData['name'] = $data['name'];
        }

        if ($request->hasFile('template')) {
            if ($template->template_path) {
                Storage::disk('public')->delete($template->template_path);
            }
            $updateData['template_path'] = $request->file('template')->store('certificate-templates', 'public');
        }

        $fields = $this->decodeFields($request->input('fields'));
        if (! empty($fields)) {
            $updateData['fields'] = $fields;
        }

        $template->update($updateData);

        return response()->json([
            'id' => $template->id,
            'name' => $template->name,
            'template_path' => $template->template_path,
            'template_url' => $template->template_path ? $this->publicStorageUrl($template->template_path) : null,
            'fields' => $template->fields,
        ]);
    }

    public function preview(Request $request): JsonResponse
    {
        // Quick cleanup: delete preview PDFs older than 1 hour
        $previewDir = 'certificate-previews';
        if (Storage::disk('public')->exists($previewDir)) {
            $threshold = now()->subHour()->getTimestamp();
            foreach (Storage::disk('public')->files($previewDir) as $file) {
                if (str_ends_with(strtolower($file), '.pdf') && Storage::disk('public')->lastModified($file) < $threshold) {
                    Storage::disk('public')->delete($file);
                }
            }
        }

        $data = $request->validate([
            'template_id' => ['nullable', 'integer', 'exists:certificate_templates,id'],
            'template' => ['nullable', 'file', 'mimes:pdf', 'max:20480'],
            'fields' => ['nullable'],
            'student_name' => ['nullable', 'string', 'max:255'],
            'dni' => ['nullable', 'string', 'max:30'],
            'code' => ['nullable', 'string', 'max:100'],
            'grade' => ['nullable', 'string', 'max:50'],
        ]);

        [$templatePath, $templateName, $fields] = $this->resolveTemplate($request, $data);
        $certificate = [
            'student_name' => mb_strtoupper($data['student_name'] ?? 'NOMBRE DE PRUEBA', 'UTF-8'),
            'dni' => $data['dni'] ?? '00000000',
            'code' => $data['code'] ?? 'PREVIEW-001',
            'grade' => $data['grade'] ?? '18',
        ];

        $outputPath = 'certificate-previews/preview_'.Str::random(16).'.pdf';
        $this->generatePdf($templatePath, $certificate, $fields, Storage::disk('public')->path($outputPath));

        return response()->json([
            'url' => $this->publicStorageUrl($outputPath),
            'preview' => [
                ...$certificate,
                'template_name' => $templateName,
            ],
        ]);
    }

    public function batch(Request $request): JsonResponse
    {
        $data = $request->validate([
            'template_id' => ['nullable', 'integer', 'exists:certificate_templates,id'],
            'template' => ['nullable', 'file', 'mimes:pdf', 'max:20480'],
            'fields' => ['nullable'],
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'course_code' => ['nullable', 'string', 'max:100'],
            'source' => ['required', 'file', 'mimes:csv,txt,xlsx,xls', 'max:20480'],
        ]);

        [$templatePath, $templateName, $fields] = $this->resolveTemplate($request, $data);
        $rows = $this->rowsFromSpreadsheet($request->file('source')->getRealPath());
        $course = ! empty($data['course_id']) ? Course::find($data['course_id']) : null;
        $batchId = 'batch_'.now()->format('Ymd_His').'_'.Str::lower(Str::random(6));
        $items = [];

        foreach ($rows as $index => $row) {
            if (empty($row['student_name']) || empty($row['dni'])) {
                continue;
            }

            $certificateData = [
                'student_name' => mb_strtoupper($row['student_name'], 'UTF-8'),
                'dni' => $row['dni'],
                'code' => $row['code'] ?: $this->nextCertificateCode($index + 1),
                'grade' => $row['grade'] ?: '-',
            ];

            $outputPath = 'certificates/'.$batchId.'/'.Str::slug($certificateData['code']).'.pdf';
            $this->generatePdf($templatePath, $certificateData, $fields, Storage::disk('public')->path($outputPath));

            $user = $this->resolveCertificateUser($certificateData);
            $score = $this->scoreFromGrade($certificateData['grade']);

            $certificate = Certificate::updateOrCreate(
                ['certificate_code' => $certificateData['code']],
                [
                    'user_id' => $user->id,
                    'exam_attempt_id' => null,
                    'course_id' => $course?->id,
                    'course_code' => $course?->code ?? $data['course_code'] ?? null,
                    'score' => $score,
                    'dni' => $certificateData['dni'],
                    'student_name' => $certificateData['student_name'],
                    'grade' => $certificateData['grade'],
                    'file_path' => $outputPath,
                    'status' => 'active',
                    'batch_id' => $batchId,
                    'template_name' => $templateName,
                    'source_filename' => $request->file('source')->getClientOriginalName(),
                ],
            );

            $items[] = $this->certificatePayload($certificate->fresh(['user', 'course']));
        }

        $zipPath = $this->zipCertificates($batchId, $items);

        return response()->json([
            'batch_id' => $batchId,
            'count' => count($items),
            'zip_url' => $zipPath ? $this->publicStorageUrl($zipPath) : null,
            'items' => $items,
        ], 201);
    }

    private function resolveTemplate(Request $request, array $data): array
    {
        $fields = $this->decodeFields($request->input('fields'));

        if (! empty($data['template_id'])) {
            $template = CertificateTemplate::findOrFail($data['template_id']);
            $path = $template->template_path ? Storage::disk('public')->path($template->template_path) : null;
            return [
                $path,
                $template->name,
                $fields ?: $template->fields ?: $this->defaultFields(),
            ];
        }

        if ($request->hasFile('template')) {
            $path = $request->file('template')->store('certificate-templates/tmp', 'public');
            return [
                Storage::disk('public')->path($path),
                $request->file('template')->getClientOriginalName(),
                $fields ?: $this->defaultFields(),
            ];
        }

        if ($fields && !empty($fields['is_builder'])) {
            return [
                null,
                $request->input('name') ?: 'Diseño Predeterminado',
                $fields,
            ];
        }

        abort(422, 'Debes enviar una plantilla PDF o seleccionar una plantilla guardada.');
    }

    private function decodeFields(mixed $fields): array
    {
        if (is_array($fields)) {
            return $fields;
        }

        if (is_string($fields) && trim($fields) !== '') {
            $decoded = json_decode($fields, true);
            return is_array($decoded) ? $decoded : $this->defaultFields();
        }

        return $this->defaultFields();
    }

    private function defaultFields(): array
    {
        return [
            'name' => ['page' => 1, 'x' => 28, 'y' => 104, 'width' => 240, 'fontSize' => 22, 'align' => 'center'],
            'code' => ['page' => 2, 'x' => 241, 'y' => 155, 'width' => 42, 'fontSize' => 12, 'align' => 'left'],
            'grade' => ['page' => 2, 'x' => 241, 'y' => 166, 'width' => 42, 'fontSize' => 12, 'align' => 'left'],
        ];
    }

    private function generatePdf(?string $templatePath, array $certificate, array $fields, string $outputPath): void
    {
        if (! is_dir(dirname($outputPath))) {
            mkdir(dirname($outputPath), 0775, true);
        }

        $pdf = new Fpdi();

        if ($templatePath) {
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
        } else {
            // Builder/Default Template Mode!
            // Always A4 Landscape (297mm x 210mm)
            $pdf->AddPage('L', 'A4');

            // Fetch tenant details for colors/logo
            $tenantManager = app(\App\Services\TenantManager::class);
            $tenant = $tenantManager->getTenant();

            $primaryColorHex = $tenant?->primary_color ?? '#7A0F1F';
            $secondaryColorHex = $tenant?->secondary_color ?? '#C8A14A';

            // Parse colors to RGB
            $pRGB = $this->hexToRgb($primaryColorHex);
            $sRGB = $this->hexToRgb($secondaryColorHex);

            // 1. Draw borders
            $pdf->SetDrawColor($pRGB[0], $pRGB[1], $pRGB[2]);
            $pdf->SetLineWidth(3);
            $pdf->Rect(10, 10, 277, 190);

            $pdf->SetDrawColor($sRGB[0], $sRGB[1], $sRGB[2]);
            $pdf->SetLineWidth(1.5);
            $pdf->Rect(14, 14, 269, 182);

            // 2. Draw custom logo
            $logoPath = $fields['builder_settings']['logo_path'] ?? $tenant?->logo_path ?? null;
            $localLogo = $this->resolveLocalPath($logoPath);
            if ($localLogo && file_exists($localLogo)) {
                $lPos = $fields['builder_settings']['logo_pos'] ?? ['x' => 123, 'y' => 22, 'width' => 50, 'height' => 20];
                $this->drawImageObjectContain($pdf, $localLogo, (float)$lPos['x'], (float)$lPos['y'], (float)$lPos['width'], (float)$lPos['height']);
            }

            // 3. Draw customizable texts
            $headerText = $fields['builder_settings']['header_text'] ?? 'CERTIFICADO DE PARTICIPACIÓN';
            $hPos = $fields['builder_settings']['header_pos'] ?? ['x' => 28, 'y' => 55, 'width' => 240, 'fontSize' => 24, 'align' => 'center'];
            $this->drawCustomText($pdf, $headerText, $hPos, $pRGB, 'B');

            $bodyText = $fields['builder_settings']['body_text'] ?? 'Por haber completado satisfactoriamente las actividades académicas correspondientes.';
            $bPos = $fields['builder_settings']['body_pos'] ?? ['x' => 28, 'y' => 125, 'width' => 240, 'fontSize' => 14, 'align' => 'center'];
            $this->drawCustomText($pdf, $bodyText, $bPos, [80, 80, 80]);

            $sigText = $fields['builder_settings']['signature_text_1'] ?? 'Director Académico';
            $sigPos = $fields['builder_settings']['signature_pos_1'] ?? ['x' => 110, 'y' => 175, 'width' => 80, 'fontSize' => 11, 'align' => 'center'];
            $this->drawCustomText($pdf, $sigText, $sigPos, [80, 80, 80]);

            $sigImg = $fields['builder_settings']['signature_img_1'] ?? null;
            $localSig = $this->resolveLocalPath($sigImg);
            if ($localSig && file_exists($localSig)) {
                $sigImgPos = $fields['builder_settings']['signature_img_pos_1'] ?? ['x' => 125, 'y' => 150, 'width' => 50, 'height' => 22];
                $this->drawImageObjectContain($pdf, $localSig, (float)$sigImgPos['x'], (float)$sigImgPos['y'], (float)$sigImgPos['width'], (float)$sigImgPos['height']);
            }

            // 3b. Draw additional custom logos/images
            $customLogos = $fields['builder_settings']['custom_logos'] ?? [];
            foreach ($customLogos as $cl) {
                $clPath = $cl['logo_path'] ?? null;
                $localCl = $this->resolveLocalPath($clPath);
                if ($localCl && file_exists($localCl)) {
                    $this->drawImageObjectContain($pdf, $localCl, (float)($cl['x'] ?? 50), (float)($cl['y'] ?? 50), (float)($cl['width'] ?? 30), (float)($cl['height'] ?? 15));
                }
            }

            // 4. Draw custom draggable rectangles
            $rects = $fields['builder_settings']['custom_rectangles'] ?? [];
            foreach ($rects as $r) {
                $rColor = $this->hexToRgb($r['color'] ?? '#CCCCCC');
                $pdf->SetDrawColor($rColor[0], $rColor[1], $rColor[2]);
                $pdf->SetLineWidth(0.5);
                $style = ($r['filled'] ?? false) ? 'F' : 'D';
                if ($style === 'F') {
                    $pdf->SetFillColor($rColor[0], $rColor[1], $rColor[2]);
                }
                $pdf->Rect((float)$r['x'], (float)$r['y'], (float)$r['width'], (float)$r['height'], $style);
            }

            // 4b. Draw custom draggable/editable texts (paragraphs)
            $customTexts = $fields['builder_settings']['custom_texts'] ?? [];
            foreach ($customTexts as $ct) {
                $ctPos = [
                    'x' => $ct['x'] ?? 50,
                    'y' => $ct['y'] ?? 100,
                    'width' => $ct['width'] ?? 100,
                    'fontSize' => $ct['fontSize'] ?? 12,
                    'align' => $ct['align'] ?? 'left'
                ];
                $this->drawCustomText($pdf, $ct['text'] ?? '', $ctPos, [50, 50, 50]);
            }

            // 5. Draw dynamic fields (page is always 1 for builder template)
            $this->drawField($pdf, $fields['name'] ?? ['page' => 1, 'x' => 28, 'y' => 90, 'width' => 240, 'fontSize' => 26, 'align' => 'center'], 1, $certificate['student_name'], 'B');
            $this->drawField($pdf, $fields['code'] ?? ['page' => 1, 'x' => 28, 'y' => 180, 'width' => 80, 'fontSize' => 10, 'align' => 'left'], 1, $certificate['code']);
            $this->drawField($pdf, $fields['grade'] ?? ['page' => 1, 'x' => 200, 'y' => 180, 'width' => 70, 'fontSize' => 10, 'align' => 'right'], 1, $certificate['grade']);
        }

        $pdf->Output('F', $outputPath);
    }

    private function hexToRgb(string $hex): array
    {
        $hex = ltrim($hex, '#');
        if (strlen($hex) === 6) {
            return [
                hexdec(substr($hex, 0, 2)),
                hexdec(substr($hex, 2, 2)),
                hexdec(substr($hex, 4, 2))
            ];
        }
        return [0, 0, 0];
    }

    private function resolveLocalPath(?string $urlPath): ?string
    {
        if (!$urlPath) return null;
        if (preg_match('#^https?://#', $urlPath)) {
            $parsed = parse_url($urlPath);
            $urlPath = $parsed['path'] ?? '';
        }
        $clean = ltrim(str_replace('/storage/', '', $urlPath), '/');
        $clean = ltrim(str_replace('storage/', '', $clean), '/');
        $fullPath = storage_path('app/public/' . $clean);
        if (file_exists($fullPath)) {
            return $fullPath;
        }
        return null;
    }

    private function drawImageObjectContain(Fpdi $pdf, string $path, float $x, float $y, float $w, float $h): void
    {
        if (!file_exists($path)) {
            return;
        }

        // Get original image size in pixels
        $info = getimagesize($path);
        if (!$info) {
            // Fallback to FPDF stretching if we cannot read size
            $pdf->Image($path, $x, $y, $w, $h);
            return;
        }

        $imgW = (float)$info[0];
        $imgH = (float)$info[1];
        if ($imgW <= 0 || $imgH <= 0) {
            $pdf->Image($path, $x, $y, $w, $h);
            return;
        }

        $imgAspect = $imgW / $imgH;
        $targetAspect = $w / $h;

        if ($imgAspect > $targetAspect) {
            // Image is wider than bounding box: fit to width
            $renderedW = $w;
            $renderedH = $w / $imgAspect;
            $xOffset = 0.0;
            $yOffset = ($h - $renderedH) / 2.0;
        } else {
            // Image is taller than bounding box (or same ratio): fit to height
            $renderedH = $h;
            $renderedW = $h * $imgAspect;
            $xOffset = ($w - $renderedW) / 2.0;
            $yOffset = 0.0;
        }

        $pdf->Image($path, $x + $xOffset, $y + $yOffset, $renderedW, $renderedH);
    }

    private function drawCustomText(Fpdi $pdf, string $text, array $pos, array $colorRGB, string $style = ''): void
    {
        $fontSize = max(6.0, (float) ($pos['fontSize'] ?? 12));
        $width = max(10.0, (float) ($pos['width'] ?? 50));
        $align = match (strtolower((string) ($pos['align'] ?? 'left'))) {
            'center' => 'C',
            'right' => 'R',
            default => 'L',
        };

        $pdf->SetFont('Arial', $style, $fontSize);
        $pdf->SetTextColor($colorRGB[0], $colorRGB[1], $colorRGB[2]);

        $convText = $this->pdfText($text);

        $pdf->SetXY((float) ($pos['x'] ?? 10), (float) ($pos['y'] ?? 10));
        if ($align === 'C' || $align === 'R' || strlen($convText) > 40) {
            $pdf->MultiCell($width, max(5.0, $fontSize * 0.5), $convText, 0, $align);
        } else {
            $pdf->Cell($width, max(5.0, $fontSize * 0.44), $convText, 0, 0, $align);
        }
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

    private function rowsFromSpreadsheet(string $path): array
    {
        $sheet = IOFactory::load($path)->getActiveSheet()->toArray();
        if ($sheet === []) {
            return [];
        }

        $headers = array_map(fn ($value) => Str::slug((string) $value, '_'), $sheet[0]);
        $hasNamedHeader = in_array('dni', $headers, true)
            || in_array('nombre', $headers, true)
            || in_array('student_name', $headers, true);
        $rows = $hasNamedHeader ? array_slice($sheet, 1) : $sheet;

        return collect($rows)
            ->map(function (array $row) use ($headers, $hasNamedHeader): array {
                if ($hasNamedHeader) {
                    $assoc = array_combine($headers, array_pad($row, count($headers), null)) ?: [];
                    return [
                        'student_name' => trim((string) ($assoc['student_name'] ?? $assoc['nombre'] ?? $assoc['name'] ?? '')),
                        'dni' => trim((string) ($assoc['dni'] ?? $assoc['documento'] ?? '')),
                        'code' => trim((string) ($assoc['code'] ?? $assoc['codigo'] ?? $assoc['codigo_certificado'] ?? '')),
                        'grade' => trim((string) ($assoc['grade'] ?? $assoc['nota'] ?? $assoc['calificacion'] ?? '')),
                    ];
                }

                return [
                    'student_name' => trim((string) ($row[0] ?? '')),
                    'dni' => trim((string) ($row[1] ?? '')),
                    'code' => trim((string) ($row[2] ?? '')),
                    'grade' => trim((string) ($row[3] ?? '')),
                ];
            })
            ->filter(fn (array $row) => $row['student_name'] !== '' && $row['dni'] !== '')
            ->values()
            ->all();
    }

    private function resolveCertificateUser(array $certificate): User
    {
        $email = Str::lower($certificate['dni']).'@certificados.eduwanka.local';

        return User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $certificate['student_name'],
                'password' => Hash::make(Str::random(20)),
                'role' => 'student',
                'dni' => $certificate['dni'],
            ],
        );
    }

    private function nextCertificateCode(int $position): string
    {
        return str_pad((string) $position, 3, '0', STR_PAD_LEFT).'-'.date('Y').'/EduWanka';
    }

    private function scoreFromGrade(string $grade): int
    {
        $numeric = (float) preg_replace('/[^0-9.]/', '', $grade);
        if ($numeric <= 20) {
            $numeric *= 5;
        }

        return (int) max(0, min(100, round($numeric)));
    }

    private function zipCertificates(string $batchId, array $items): ?string
    {
        if ($items === []) {
            return null;
        }

        $zipPath = 'certificates/'.$batchId.'.zip';
        $absoluteZipPath = Storage::disk('public')->path($zipPath);

        if (! is_dir(dirname($absoluteZipPath))) {
            mkdir(dirname($absoluteZipPath), 0775, true);
        }

        $zip = new ZipArchive();
        if ($zip->open($absoluteZipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            return null;
        }

        foreach ($items as $item) {
            if (! empty($item['file_path']) && Storage::disk('public')->exists($item['file_path'])) {
                $zip->addFile(Storage::disk('public')->path($item['file_path']), basename($item['file_path']));
            }
        }

        $zip->close();

        return $zipPath;
    }

    private function certificatePayload(Certificate $certificate): array
    {
        return [
            'id' => $certificate->id,
            'user' => $certificate->user,
            'course' => $certificate->course,
            'code' => $certificate->certificate_code,
            'certificate_code' => $certificate->certificate_code,
            'dni' => $certificate->dni,
            'student_name' => $certificate->student_name ?? $certificate->user?->name,
            'grade' => $certificate->grade,
            'score' => $certificate->score,
            'file_path' => $certificate->file_path,
            'file_url' => $certificate->file_path ? $this->publicStorageUrl($certificate->file_path) : null,
            'status' => $certificate->status,
            'is_revoked' => $certificate->isRevoked(),
            'revoked_at' => $certificate->revoked_at,
            'revoked_reason' => $certificate->revoked_reason,
            'revoked_by' => $certificate->revokedBy ? [
                'id' => $certificate->revokedBy->id,
                'name' => $certificate->revokedBy->name,
                'email' => $certificate->revokedBy->email,
            ] : null,
            'created_at' => $certificate->created_at,
        ];
    }

    private function publicStorageUrl(string $path): string
    {
        return '/storage/' . ltrim($path, '/');
    }

    private function pdfText(string $value): string
    {
        $converted = @iconv('UTF-8', 'windows-1252//TRANSLIT', $value);

        return $converted !== false ? $converted : $value;
    }
}
