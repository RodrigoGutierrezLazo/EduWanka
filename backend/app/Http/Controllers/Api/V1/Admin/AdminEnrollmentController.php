<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Purchase;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;

class AdminEnrollmentController extends Controller
{
    /**
     * Listar participantes inscritos en un curso.
     * Devuelve usuarios con purchase validated/paid.
     */
    public function index(Course $course): JsonResponse
    {
        $participants = $course->purchases()
            ->with('user:id,name,email,dni,phone')
            ->whereIn('status', ['validated', 'paid'])
            ->latest()
            ->get()
            ->map(fn (Purchase $p) => [
                'id'           => $p->user->id,
                'name'         => $p->user->name,
                'email'        => $p->user->email,
                'dni'          => $p->user->dni ?? null,
                'phone'        => $p->user->phone ?? null,
                'city'         => $p->user->city ?? null,
                'academic_condition' => $p->user->academic_condition ?? null,
                'certification_institution' => $p->user->certification_institution ?? null,
                'enrolled_at'  => $p->created_at->toIso8601String(),
                'method'       => $p->payment_method,
                'purchase_id'  => $p->id,
                
                // Extra purchase info
                'payment_modality' => $p->payment_modality,
                'bank_entity' => $p->bank_entity,
                'operation_number' => $p->operation_number,
                'declared_amount' => $p->declared_amount,
                'certificate_delivery' => $p->certificate_delivery,
                'delivery_company' => $p->delivery_company,
                'delivery_address' => $p->delivery_address,
                'next_course_interest' => $p->next_course_interest,
                'receipt_url' => $p->receipt_path ? route('api.v1.files.receipt', ['purchase' => $p->id], false) : null,
            ]);

        return response()->json(['data' => $participants, 'total' => $participants->count()]);
    }

    /**
     * Inscribir usuarios por IDs (selección manual).
     * Idempotente: si ya está inscrito se omite.
     */
    public function addUsers(Request $request, Course $course): JsonResponse
    {
        $request->validate([
            'user_ids'   => ['required', 'array', 'min:1'],
            'user_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $enrolled = 0;
        $skipped  = 0;

        foreach ($request->input('user_ids') as $userId) {
            $exists = $course->purchases()
                ->where('user_id', $userId)
                ->whereIn('status', ['validated', 'paid'])
                ->exists();

            if ($exists) {
                $skipped++;
                continue;
            }

            Purchase::create([
                'user_id'        => $userId,
                'course_id'      => $course->id,
                'course_code'    => $course->code,
                'amount'         => 0,
                'currency'       => 'PEN',
                'payment_method' => 'admin_enrollment',
                'status'         => 'validated',
                'idempotency_key' => 'enroll-' . $course->id . '-' . $userId . '-' . now()->timestamp,
            ]);
            $enrolled++;
        }

        return response()->json([
            'message'  => "Inscripción completada: {$enrolled} agregados, {$skipped} ya inscritos.",
            'enrolled' => $enrolled,
            'skipped'  => $skipped,
        ]);
    }

    /**
     * Quitar un participante del curso.
     */
    public function remove(Course $course, User $user): JsonResponse
    {
        $deleted = $course->purchases()
            ->where('user_id', $user->id)
            ->whereIn('status', ['validated', 'paid'])
            ->update(['status' => 'removed']);

        if ($deleted === 0) {
            return response()->json(['message' => 'El usuario no estaba inscrito en este curso.'], 404);
        }

        return response()->json(['message' => 'Participante removido correctamente.']);
    }

    /**
     * Paso 1 — Previsualizar el archivo Excel/CSV.
     *
     * Acepta opcionalmente column_map (JSON) para mapeo manual:
     *   { "email": "G", "name": "C", "dni": "F" }
     *
     * Si la auto-detección falla y no hay column_map,
     * retorna needs_mapping=true + available_columns para que el frontend
     * muestre el selector de columnas.
     */
    public function previewExcel(Request $request, Course $course): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:5120'],
            'column_map' => ['nullable', 'string'],
        ]);

        // Mapeo manual del frontend (si lo envía)
        $manualMap = $this->manualColumnMapFromRequest($request);

        $parsed = $this->parseExcelFile($request->file('file'), $course, $manualMap);

        if (isset($parsed['needs_mapping'])) {
            // Retornar las columnas disponibles para que el frontend muestre el mapper
            return response()->json($parsed);
        }

        if (isset($parsed['error'])) {
            return response()->json(['message' => $parsed['error']], 422);
        }

        return response()->json($parsed);
    }

    /**
     * Paso 2 — Confirmar la importación.
     * Acepta opcionalmente column_map para mapeo manual.
     */
    public function importExcel(Request $request, Course $course): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:5120'],
            'column_map' => ['nullable', 'string'],
        ]);

        $manualMap = $this->manualColumnMapFromRequest($request);

        $parsed = $this->parseExcelFile($request->file('file'), $course, $manualMap);

        if (isset($parsed['needs_mapping']) || isset($parsed['error'])) {
            return response()->json(['message' => $parsed['error'] ?? 'Mapeo de columnas requerido.'], 422);
        }

        $enrolled = 0;
        $createdUsers = 0;

        foreach ($parsed['rows'] as $row) {
            if ($row['status'] === 'error' || $row['status'] === 'skip') {
                continue;
            }

            $user = null;

            if ($row['status'] === 'new_user') {
                $tempPassword = Str::random(8);
                $user = User::create([
                    'name'     => $row['name'] ?: explode('@', $row['email'])[0],
                    'email'    => $row['email'],
                    'password' => Hash::make($tempPassword),
                    'role'     => 'student',
                    'dni'      => $row['dni'] ?: null,
                ]);
                $createdUsers++;
            } else {
                $user = User::where('email', $row['email'])->first();
                if (!$user && !empty($row['dni'])) {
                    $user = User::where('dni', $row['dni'])->first();
                }
            }

            if (!$user) continue;

            $alreadyEnrolled = $course->purchases()
                ->where('user_id', $user->id)
                ->whereIn('status', ['validated', 'paid'])
                ->exists();

            if ($alreadyEnrolled) continue;

            Purchase::create([
                'user_id'         => $user->id,
                'course_id'       => $course->id,
                'course_code'     => $course->code,
                'amount'          => 0,
                'currency'        => 'PEN',
                'payment_method'  => 'admin_enrollment',
                'status'          => 'validated',
                'idempotency_key' => 'excel-' . $course->id . '-' . $user->id . '-' . now()->timestamp,
            ]);
            $enrolled++;
        }

        return response()->json([
            'message'       => "Importación completada: {$enrolled} inscritos, {$createdUsers} usuarios nuevos.",
            'enrolled'      => $enrolled,
            'created_users' => $createdUsers,
        ]);
    }

    /**
     * Buscar usuarios disponibles para inscribir.
     */
    public function searchUsers(Request $request, Course $course): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));
        if (strlen($q) < 2) {
            return response()->json(['data' => []]);
        }

        $enrolledIds = $course->purchases()
            ->whereIn('status', ['validated', 'paid'])
            ->pluck('user_id')
            ->toArray();

        $users = User::query()
            ->where(function ($query) use ($q) {
                $query->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")
                    ->orWhere('dni', 'like', "%{$q}%");
            })
            ->whereNotIn('id', $enrolledIds)
            ->limit(15)
            ->get(['id', 'name', 'email', 'dni']);

        return response()->json(['data' => $users]);
    }

    // ── Helpers ──────────────────────────────────────────────────────

    /**
     * Parsea un archivo Excel/CSV y devuelve un resumen.
     *
     * @param $manualMap  Mapeo manual de columnas: ['email' => 'G', 'name' => 'C', ...]
     *                    Si es null, se usa auto-detección.
     */
    private function parseExcelFile($file, Course $course, ?array $manualMap = null): array
    {
        $spreadsheet = IOFactory::load($file->getPathname());
        $sheet = $spreadsheet->getActiveSheet();
        $rawRows = $sheet->toArray(null, true, true, true);

        $header = array_shift($rawRows);
        if (!$header) {
            return ['error' => 'El archivo está vacío.'];
        }

        // Usar mapeo manual o auto-detectar
        $availableColumns = $this->availableColumns($header);

        if ($manualMap !== null) {
            $headerMap = $this->validManualMap($manualMap, $header);

            if (!isset($headerMap['email'])) {
                return [
                    'needs_mapping'     => true,
                    'available_columns' => $availableColumns,
                    'message'           => 'Selecciona una columna valida para email.',
                ];
            }

            if (count(array_unique(array_values($headerMap))) !== count($headerMap)) {
                return ['error' => 'Cada dato del mapeo debe usar una columna distinta.'];
            }
        } else {
            $headerMap = $this->mapHeaders($header);
        }

        // Si no hay columna email → pedir mapeo manual
        if (!isset($headerMap['email'])) {
            // Construir lista de columnas disponibles con letra + nombre
            return [
                'needs_mapping'     => true,
                'available_columns' => $availableColumns,
                'message'           => 'No se detectaron automáticamente las columnas. Asigna manualmente qué columna corresponde a cada campo.',
            ];
        }

        // ── Procesar filas ───────────────────────────
        $enrolledEmails = $course->purchases()
            ->with('user:id,email')
            ->whereIn('status', ['validated', 'paid'])
            ->get()
            ->pluck('user.email')
            ->filter()
            ->map(fn ($e) => mb_strtolower($e))
            ->toArray();

        $rows = [];
        $summary = [
            'total_rows'       => 0,
            'will_enroll'      => 0,
            'will_create'      => 0,
            'already_enrolled' => 0,
            'errors'           => 0,
        ];

        foreach ($rawRows as $rowNum => $row) {
            $email = trim($row[$headerMap['email']] ?? '');
            $name  = trim($row[$headerMap['name'] ?? ''] ?? '');
            $dni   = trim($row[$headerMap['dni'] ?? ''] ?? '');

            if (empty($email)) continue;

            $summary['total_rows']++;

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $rows[] = [
                    'row' => $rowNum, 'email' => $email, 'name' => $name, 'dni' => $dni,
                    'status' => 'error', 'reason' => 'Email inválido',
                ];
                $summary['errors']++;
                continue;
            }

            if (in_array(mb_strtolower($email), $enrolledEmails)) {
                $rows[] = [
                    'row' => $rowNum, 'email' => $email, 'name' => $name, 'dni' => $dni,
                    'status' => 'skip', 'reason' => 'Ya inscrito en este curso',
                ];
                $summary['already_enrolled']++;
                continue;
            }

            $user = User::where('email', $email)->first();
            if (!$user && !empty($dni)) {
                $user = User::where('dni', $dni)->first();
            }

            if ($user) {
                $rows[] = [
                    'row' => $rowNum, 'email' => $email, 'name' => $user->name,
                    'dni' => $user->dni ?? $dni, 'status' => 'existing_user',
                    'reason' => 'Usuario existente — se inscribirá',
                ];
                $summary['will_enroll']++;
            } else {
                $rows[] = [
                    'row' => $rowNum, 'email' => $email,
                    'name' => $name ?: explode('@', $email)[0],
                    'dni' => $dni, 'status' => 'new_user',
                    'reason' => 'Usuario nuevo — se creará e inscribirá',
                ];
                $summary['will_enroll']++;
                $summary['will_create']++;
            }
        }

        return [
            'summary'       => $summary,
            'rows'          => $rows,
            'columns_found' => array_keys($headerMap),
        ];
    }

    /**
     * Normaliza el mapeo manual enviado por el frontend.
     */
    private function manualColumnMapFromRequest(Request $request): ?array
    {
        if (!$request->filled('column_map')) {
            return null;
        }

        $decoded = json_decode((string) $request->input('column_map'), true);
        if (!is_array($decoded)) {
            return [];
        }

        $map = [];
        foreach (['email', 'name', 'dni'] as $field) {
            if (!isset($decoded[$field]) || !is_string($decoded[$field])) {
                continue;
            }

            $column = mb_strtoupper(trim($decoded[$field]));
            if ($column !== '' && preg_match('/^[A-Z]{1,3}$/', $column)) {
                $map[$field] = $column;
            }
        }

        return $map;
    }

    private function validManualMap(array $manualMap, array $header): array
    {
        $map = [];
        foreach (['email', 'name', 'dni'] as $field) {
            $column = $manualMap[$field] ?? null;
            if (is_string($column) && array_key_exists($column, $header)) {
                $map[$field] = $column;
            }
        }

        return $map;
    }

    private function availableColumns(array $header): array
    {
        $columns = [];
        foreach ($header as $col => $label) {
            $labelClean = trim((string) ($label ?? ''));
            $columns[] = [
                'key'   => (string) $col,
                'label' => $labelClean !== '' ? $labelClean : "Columna {$col}",
            ];
        }

        return $columns;
    }

    /**
     * Mapear headers automaticamente.
     * Soporta variantes comunes en espanol e ingles.
     */
    private function mapHeaders(array $header): array
    {
        $map = [];
        foreach ($header as $col => $label) {
            $label = mb_strtolower(trim($label ?? ''));
            if (in_array($label, ['email', 'correo', 'e-mail', 'mail'])) {
                $map['email'] = $col;
            } elseif (in_array($label, ['nombre', 'name', 'nombre completo', 'fullname', 'full_name'])) {
                $map['name'] = $col;
            } elseif (in_array($label, ['dni', 'codigo', 'code', 'código', 'documento'])) {
                $map['dni'] = $col;
            }
        }
        return $map;
    }
}
