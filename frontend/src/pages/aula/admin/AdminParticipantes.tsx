import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/apiClient';
import {
  ArrowLeft, Search, UserPlus, Loader2, Upload, FileSpreadsheet,
  Users, UserCheck, AlertCircle, CheckCircle2, ShieldCheck, XCircle,
  UserX, UserCog, SkipForward,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────── */
interface Participant {
  id: number; name: string; email: string;
  dni?: string | null; phone?: string | null;
  city?: string | null; academic_condition?: string | null; certification_institution?: string | null;
  enrolled_at: string; method: string; purchase_id: number;
  payment_modality?: string | null; bank_entity?: string | null; operation_number?: string | null;
  declared_amount?: number | null; certificate_delivery?: string | null;
  delivery_company?: string | null; delivery_address?: string | null;
  next_course_interest?: string | null; receipt_url?: string | null;
}

interface SearchResult { id: number; name: string; email: string; dni?: string | null; }

interface PreviewRow {
  row: number; email: string; name: string; dni: string;
  status: 'existing_user' | 'new_user' | 'skip' | 'error';
  reason: string;
}

interface PreviewData {
  summary: {
    total_rows: number; will_enroll: number; will_create: number;
    already_enrolled: number; errors: number;
  };
  rows: PreviewRow[];
  columns_found: string[];
}

interface ConfirmResult { message: string; enrolled: number; created_users: number; }

type ColumnField = 'email' | 'name' | 'dni';
type ColumnMap = Partial<Record<ColumnField, string>>;
type ColumnAssignments = Record<string, ColumnField | ''>;

interface AvailableColumn { key: string; label: string; }

interface MappingData {
  needs_mapping: true;
  available_columns: AvailableColumn[];
  message?: string;
}

const COLUMN_FIELD_OPTIONS: { value: ColumnField; label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'name', label: 'Nombre' },
  { value: 'dni', label: 'DNI' },
];

export default function AdminParticipantes() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [courseName, setCourseName] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Search
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);

  // Excel — two-step flow
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [mappingData, setMappingData] = useState<MappingData | null>(null);
  const [columnAssignments, setColumnAssignments] = useState<ColumnAssignments>({});
  const [columnMap, setColumnMap] = useState<ColumnMap | null>(null);
  const [mappingError, setMappingError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmResult, setConfirmResult] = useState<ConfirmResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Removing
  const [removing, setRemoving] = useState<number | null>(null);

  // Detail Modal
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  /* ─── Load Data ─────────────────────────────────────── */
  const loadParticipants = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/api/v1/admin/courses/${courseId}/enrollments`);
      setParticipants(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [courseId]);

  const loadCourseName = useCallback(async () => {
    if (!courseId) return;
    try {
      const { data } = await apiClient.get(`/api/v1/admin/courses/${courseId}`);
      setCourseName(data.title ?? '');
    } catch { /* ignore */ }
  }, [courseId]);

  useEffect(() => { loadParticipants(); loadCourseName(); }, [loadParticipants, loadCourseName]);

  /* ─── Search ────────────────────────────────────────── */
  const doSearch = useCallback(async (term: string) => {
    if (term.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const { data } = await apiClient.get(`/api/v1/admin/courses/${courseId}/enrollments/search`, { params: { q: term } });
      setSearchResults(data.data ?? []);
    } catch { /* ignore */ }
    finally { setSearching(false); }
  }, [courseId]);

  useEffect(() => {
    const t = setTimeout(() => doSearch(searchQ), 300);
    return () => clearTimeout(t);
  }, [searchQ, doSearch]);

  /* ─── Add User ──────────────────────────────────────── */
  const addUser = async (userId: number) => {
    setAdding(userId);
    try {
      await apiClient.post(`/api/v1/admin/courses/${courseId}/enrollments`, { user_ids: [userId] });
      setSearchResults(r => r.filter(u => u.id !== userId));
      loadParticipants();
    } catch { /* ignore */ }
    finally { setAdding(null); }
  };

  /* ─── Remove User ───────────────────────────────────── */
  const removeUser = async (userId: number) => {
    if (!confirm('¿Quitar a este participante del curso?')) return;
    setRemoving(userId);
    try {
      await apiClient.delete(`/api/v1/admin/courses/${courseId}/enrollments/${userId}`);
      loadParticipants();
    } catch { /* ignore */ }
    finally { setRemoving(null); }
  };

  /* ─── Excel Step 1: Preview ─────────────────────────── */
  const selectedColumnMap = useMemo<ColumnMap>(() => (
    (Object.entries(columnAssignments) as [string, ColumnField | ''][]).reduce<ColumnMap>((map, [columnKey, field]) => {
      if (field) map[field] = columnKey;
      return map;
    }, {})
  ), [columnAssignments]);

  const canApplyMapping = Boolean(selectedColumnMap.email);

  const setColumnEnabled = (columnKey: string, enabled: boolean) => {
    setColumnAssignments(current => {
      if (enabled) {
        return { ...current, [columnKey]: current[columnKey] ?? '' };
      }

      const { [columnKey]: _removed, ...next } = current;
      return next;
    });
    setMappingError(null);
  };

  const assignColumnField = (columnKey: string, field: ColumnField | '') => {
    setColumnAssignments(current => {
      const next = (Object.entries(current) as [string, ColumnField | ''][]).reduce<ColumnAssignments>((map, [key, value]) => {
        map[key] = field && value === field && key !== columnKey ? '' : value;
        return map;
      }, {});

      return { ...next, [columnKey]: field };
    });
    setMappingError(null);
  };

  const handlePreview = async (file: File, manualMap?: ColumnMap) => {
    if (!courseId) return;
    setPreviewing(true);
    setPreviewData(null);
    setPreviewError(null);
    setConfirmResult(null);
    setPendingFile(file);
    setMappingError(null);

    if (!manualMap) {
      setMappingData(null);
      setColumnAssignments({});
      setColumnMap(null);
    } else {
      setColumnMap(manualMap);
    }

    try {
      const fd = new FormData();
      fd.append('file', file);
      if (manualMap) {
        fd.append('column_map', JSON.stringify(manualMap));
      }
      const { data } = await apiClient.post(
        `/api/v1/admin/courses/${courseId}/enrollments/preview`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );

      if (data?.needs_mapping) {
        setMappingData({
          needs_mapping: true,
          available_columns: data.available_columns ?? [],
          message: data.message,
        });
        setColumnMap(null);
        return;
      }

      setMappingData(null);
      setPreviewData(data);
    } catch (e: any) {
      const errorData = e?.response?.data;
      if (errorData?.needs_mapping) {
        setMappingData({
          needs_mapping: true,
          available_columns: errorData.available_columns ?? [],
          message: errorData.message,
        });
        setPreviewError(null);
        return;
      }

      setPreviewError(errorData?.message ?? 'Error al analizar el archivo.');
      if (!manualMap) setPendingFile(null);
    } finally { setPreviewing(false); }
  };

  /* ─── Excel Step 2: Confirm ─────────────────────────── */
  const handleApplyMapping = () => {
    if (!pendingFile) {
      setMappingError('Vuelve a cargar el archivo para continuar.');
      return;
    }

    if (!selectedColumnMap.email) {
      setMappingError('Selecciona la columna que contiene el email.');
      return;
    }

    handlePreview(pendingFile, selectedColumnMap);
  };

  const handleConfirm = async () => {
    if (!courseId || !pendingFile) return;
    setConfirming(true);
    try {
      const fd = new FormData();
      fd.append('file', pendingFile);
      if (columnMap?.email) {
        fd.append('column_map', JSON.stringify(columnMap));
      }
      const { data } = await apiClient.post(
        `/api/v1/admin/courses/${courseId}/enrollments/import`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      setConfirmResult(data);
      setPreviewData(null);
      setPendingFile(null);
      setColumnMap(null);
      setMappingData(null);
      setColumnAssignments({});
      loadParticipants();
    } catch (e: any) {
      setPreviewError(e?.response?.data?.message ?? 'Error al importar.');
    } finally { setConfirming(false); }
  };

  /* ─── Excel Cancel ──────────────────────────────────── */
  const cancelPreview = () => {
    setPreviewData(null);
    setPendingFile(null);
    setPreviewError(null);
    setMappingData(null);
    setColumnAssignments({});
    setColumnMap(null);
    setMappingError(null);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handlePreview(file);
  };

  const pickFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handlePreview(file);
    };
    input.click();
  };

  /* ─── Status helpers ────────────────────────────────── */
  const statusIcon = (s: PreviewRow['status']) => {
    switch (s) {
      case 'existing_user': return <UserCheck className="w-3.5 h-3.5 text-green-500" />;
      case 'new_user':      return <UserCog className="w-3.5 h-3.5 text-blue-500" />;
      case 'skip':          return <SkipForward className="w-3.5 h-3.5 text-slate-400" />;
      case 'error':         return <XCircle className="w-3.5 h-3.5 text-red-500" />;
    }
  };

  const statusLabel = (s: PreviewRow['status']) => {
    switch (s) {
      case 'existing_user': return 'Inscribir';
      case 'new_user':      return 'Crear + Inscribir';
      case 'skip':          return 'Omitir';
      case 'error':         return 'Error';
    }
  };

  const statusColor = (s: PreviewRow['status']) => {
    switch (s) {
      case 'existing_user': return 'bg-green-50 text-green-700';
      case 'new_user':      return 'bg-blue-50 text-blue-700';
      case 'skip':          return 'bg-slate-50 text-slate-500';
      case 'error':         return 'bg-red-50 text-red-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/aula/admin/cursos')}
          className="p-2 rounded-lg hover:bg-slate-100 transition text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-primary font-sans">Participantes</h1>
          {courseName && <p className="text-sm text-slate-500 mt-0.5">{courseName}</p>}
        </div>
        <div className="ml-auto bg-secondary/10 text-primary font-bold text-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <Users className="w-4 h-4" /> {total} inscrito{total !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* LEFT — Enrolled list */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-bold text-primary text-sm uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-green-500" /> Inscritos
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-secondary" /></div>
          ) : participants.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-bold">Sin participantes</p>
              <p className="text-xs mt-1">Usa el buscador o carga un Excel para inscribir alumnos.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-[520px] overflow-y-auto">
              {participants.map(p => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition group">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-primary truncate">{p.name}</p>
                    <p className="text-xs text-slate-400 truncate">{p.email}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {p.method === 'admin_enrollment' && (
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">Manual</span>
                    )}
                    <button onClick={() => setSelectedParticipant(p)}
                      className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-200 transition">
                      Detalle
                    </button>
                    <button onClick={() => removeUser(p.id)} disabled={removing === p.id}
                      className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 transition disabled:opacity-50">
                      {removing === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Quitar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — Search + Import */}
        <div className="lg:col-span-2 space-y-5">

          {/* Search users */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="p-5 border-b border-slate-100">
              <h2 className="font-bold text-primary text-sm uppercase tracking-wider flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-secondary" /> Buscar usuarios
              </h2>
            </div>
            <div className="p-5">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  placeholder="Nombre, email o DNI…"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-secondary" />
                {searching && <Loader2 className="w-4 h-4 animate-spin text-secondary absolute right-3 top-3" />}
              </div>

              {searchResults.length > 0 && (
                <div className="mt-3 divide-y divide-slate-50 max-h-60 overflow-y-auto border border-slate-100 rounded-lg">
                  {searchResults.map(u => (
                    <div key={u.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-slate-50">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-primary truncate">{u.name}</p>
                        <p className="text-xs text-slate-400 truncate">{u.email}</p>
                      </div>
                      <button onClick={() => addUser(u.id)} disabled={adding === u.id}
                        className="text-xs font-bold text-white bg-green-500 px-3 py-1.5 rounded-lg hover:bg-green-600 transition disabled:opacity-50 flex-shrink-0">
                        {adding === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Agregar'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {searchQ.length >= 2 && searchResults.length === 0 && !searching && (
                <p className="text-xs text-slate-400 mt-3 text-center">Sin resultados.</p>
              )}
            </div>
          </div>

          {/* Excel import — two-step */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="p-5 border-b border-slate-100">
              <h2 className="font-bold text-primary text-sm uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-green-600" /> Inscripción masiva (Excel)
              </h2>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-500">
                Sube un Excel con columna <strong>email</strong>, <strong>nombre</strong> y opcionalmente <strong>dni</strong>.
                El sistema analizará el archivo antes de inscribir.
              </p>

              {/* Drop zone — only show if no preview active */}
              {!previewData && !confirmResult && !mappingData && (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={pickFile}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${
                    dragOver ? 'border-secondary bg-secondary/5' : 'border-slate-200 hover:border-secondary'
                  }`}
                >
                  {previewing ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-secondary" />
                      <p className="text-xs text-slate-500 font-medium">Analizando archivo…</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                      <p className="text-xs font-medium text-slate-500">
                        Arrastra un archivo o <span className="text-secondary font-bold">haz click</span>
                      </p>
                      <p className="text-[10px] text-slate-300 mt-1">.xlsx, .xls, .csv · máx. 5MB</p>
                    </>
                  )}
                </div>
              )}

              {/* Preview error */}
              {previewError && (
                <div className="rounded-lg p-4 text-xs bg-red-50 border border-red-200 space-y-2">
                  <p className="font-bold flex items-center gap-1.5 text-red-700">
                    <AlertCircle className="w-3.5 h-3.5" /> {previewError}
                  </p>
                  <button onClick={cancelPreview} className="text-red-400 hover:text-red-600 underline text-[10px]">
                    Intentar de nuevo
                  </button>
                </div>
              )}

              {/* ── Preview Table ──────────────────────── */}
              {mappingData && (
                <div className="rounded-lg p-4 text-xs bg-amber-50 border border-amber-200 space-y-3">
                  <div className="flex items-start gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-primary">Mapear columnas del archivo</p>
                      <p className="text-slate-600 mt-0.5">
                        {mappingData.message ?? 'Marca las columnas que usaras y elige que dato rellenan.'}
                      </p>
                      <p className="text-[10px] text-amber-700 mt-1">
                        Email es obligatorio. Nombre y DNI son opcionales.
                      </p>
                    </div>
                  </div>

                  {mappingData.available_columns.length === 0 ? (
                    <p className="rounded-md border border-amber-200 bg-white/70 p-3 text-amber-700">
                      No se encontraron encabezados en la primera fila del archivo.
                    </p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                      {mappingData.available_columns.map(column => {
                        const checked = Object.prototype.hasOwnProperty.call(columnAssignments, column.key);
                        return (
                          <div
                            key={column.key}
                            className={`grid grid-cols-[auto,minmax(0,1fr)] sm:grid-cols-[auto,minmax(0,1fr),8.5rem] gap-2 items-center rounded-lg border p-2 transition ${
                              checked ? 'bg-white border-amber-300' : 'bg-white/60 border-amber-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={e => setColumnEnabled(column.key, e.target.checked)}
                              className="h-4 w-4 rounded border-amber-300 text-secondary focus:ring-secondary"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-primary truncate">
                                Columna {column.key}
                              </p>
                              <p className="text-[11px] text-slate-500 break-words">
                                {column.label || `Columna ${column.key}`}
                              </p>
                            </div>
                            <select
                              disabled={!checked}
                              value={columnAssignments[column.key] ?? ''}
                              onChange={e => assignColumnField(column.key, e.target.value as ColumnField | '')}
                              className="col-span-2 sm:col-span-1 w-full rounded-md border border-amber-200 bg-white px-2 py-1.5 text-[11px] font-bold text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300 focus:outline-none focus:border-secondary"
                            >
                              <option value="">No usar</option>
                              {COLUMN_FIELD_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {mappingError && (
                    <p className="flex items-center gap-1.5 text-red-600 font-bold">
                      <AlertCircle className="w-3.5 h-3.5" /> {mappingError}
                    </p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button onClick={cancelPreview}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-amber-200 text-xs font-bold text-slate-600 hover:bg-white transition">
                      Cancelar
                    </button>
                    <button onClick={handleApplyMapping} disabled={previewing || !canApplyMapping}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-secondary text-white text-xs font-bold hover:bg-secondary/90 transition disabled:opacity-50 flex items-center justify-center gap-2">
                      {previewing ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analizando...</>
                      ) : (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> Analizar con mapeo</>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {previewData && (
                <div className="space-y-3">
                  {/* Summary banner */}
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-xs font-bold text-primary mb-3 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-secondary" /> Resumen del archivo
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                        <span>Total filas: <strong>{previewData.summary.total_rows}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <span>Se inscribirán: <strong className="text-green-700">{previewData.summary.will_enroll}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span>Usuarios nuevos: <strong className="text-blue-700">{previewData.summary.will_create}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span>Ya inscritos: <strong>{previewData.summary.already_enrolled}</strong></span>
                      </div>
                      {previewData.summary.errors > 0 && (
                        <div className="flex items-center gap-2 col-span-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                          <span className="text-red-600">Errores: <strong>{previewData.summary.errors}</strong></span>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">
                      Columnas detectadas: {previewData.columns_found.join(', ')}
                    </p>
                  </div>

                  {/* Row-by-row table */}
                  <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-lg divide-y divide-slate-50">
                    {previewData.rows.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 text-xs">
                        {statusIcon(r.status)}
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-slate-700 truncate block">{r.email}</span>
                          {r.name && <span className="text-slate-400 truncate block">{r.name}</span>}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${statusColor(r.status)}`}>
                          {statusLabel(r.status)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-1">
                    <button onClick={cancelPreview}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
                      Cancelar
                    </button>
                    <button onClick={handleConfirm} disabled={confirming || previewData.summary.will_enroll === 0}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
                      {confirming ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Procesando…</>
                      ) : (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> Confirmar subida ({previewData.summary.will_enroll})</>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Confirm Result ─────────────────────── */}
              {confirmResult && (
                <div className="rounded-lg p-4 text-xs bg-green-50 border border-green-200 space-y-2">
                  <p className="font-bold flex items-center gap-1.5 text-green-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {confirmResult.message}
                  </p>
                  <div className="flex gap-4 text-slate-600">
                    <span>✅ Inscritos: <strong>{confirmResult.enrolled}</strong></span>
                    <span>🆕 Usuarios creados: <strong>{confirmResult.created_users}</strong></span>
                  </div>
                  <button onClick={() => setConfirmResult(null)} className="text-slate-400 hover:text-slate-600 underline text-[10px]">
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Participant Detail Modal */}
      {selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedParticipant(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-secondary" /> Detalles de Inscripción
              </h3>
              <button onClick={() => setSelectedParticipant(null)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
              <div className="space-y-6">
                
                {/* Personal Info */}
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">Datos Personales</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                    <div><p className="text-[11px] text-slate-500 mb-0.5">Nombre Completo</p><p className="text-sm font-semibold text-primary">{selectedParticipant.name}</p></div>
                    <div><p className="text-[11px] text-slate-500 mb-0.5">Correo Electrónico</p><p className="text-sm font-semibold text-primary">{selectedParticipant.email}</p></div>
                    <div><p className="text-[11px] text-slate-500 mb-0.5">DNI / Documento</p><p className="text-sm font-semibold text-primary">{selectedParticipant.dni || 'No registrado'}</p></div>
                    <div><p className="text-[11px] text-slate-500 mb-0.5">Teléfono</p><p className="text-sm font-semibold text-primary">{selectedParticipant.phone || 'No registrado'}</p></div>
                    <div><p className="text-[11px] text-slate-500 mb-0.5">Ciudad de Residencia</p><p className="text-sm font-semibold text-primary">{selectedParticipant.city || 'No registrado'}</p></div>
                  </div>
                </div>

                {/* Academic Profile */}
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">Perfil Académico</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                    <div><p className="text-[11px] text-slate-500 mb-0.5">Condición Académica</p><p className="text-sm font-semibold text-primary capitalize">{selectedParticipant.academic_condition?.replace('_', ' ') || 'No registrado'}</p></div>
                    <div><p className="text-[11px] text-slate-500 mb-0.5">Institución para Certificación</p><p className="text-sm font-semibold text-primary">{selectedParticipant.certification_institution || 'No registrado'}</p></div>
                    <div className="md:col-span-2"><p className="text-[11px] text-slate-500 mb-0.5">Interés en Próximos Cursos</p><p className="text-sm font-semibold text-primary">{selectedParticipant.next_course_interest || 'No registrado'}</p></div>
                  </div>
                </div>

                {/* Payment & Delivery */}
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">Detalles de Pago y Certificación</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                    <div><p className="text-[11px] text-slate-500 mb-0.5">Modalidad de Pago</p><p className="text-sm font-semibold text-primary capitalize">{selectedParticipant.payment_modality?.replace('_', ' ') || selectedParticipant.method || 'No registrado'}</p></div>
                    <div><p className="text-[11px] text-slate-500 mb-0.5">Entidad Bancaria</p><p className="text-sm font-semibold text-primary capitalize">{selectedParticipant.bank_entity?.replace('_', ' ') || 'No registrado'}</p></div>
                    <div><p className="text-[11px] text-slate-500 mb-0.5">Nº de Operación</p><p className="text-sm font-semibold text-primary font-mono">{selectedParticipant.operation_number || 'No registrado'}</p></div>
                    <div><p className="text-[11px] text-slate-500 mb-0.5">Monto Declarado</p><p className="text-sm font-semibold text-green-600">S/ {selectedParticipant.declared_amount ? Number(selectedParticipant.declared_amount).toFixed(2) : '0.00'}</p></div>
                    
                    <div className="md:col-span-2 mt-2 pt-4 border-t border-slate-50">
                      <p className="text-[11px] text-slate-500 mb-0.5">Tipo de Entrega de Certificado</p>
                      <p className="text-sm font-semibold text-primary capitalize">{selectedParticipant.certificate_delivery === 'physical' ? 'Físico' : selectedParticipant.certificate_delivery === 'digital' ? 'Digital' : 'No registrado'}</p>
                    </div>

                    {selectedParticipant.certificate_delivery === 'physical' && (
                      <>
                        <div><p className="text-[11px] text-slate-500 mb-0.5">Agencia de Envío</p><p className="text-sm font-semibold text-primary capitalize">{selectedParticipant.delivery_company || 'No registrado'}</p></div>
                        <div><p className="text-[11px] text-slate-500 mb-0.5">Dirección / Sede</p><p className="text-sm font-semibold text-primary">{selectedParticipant.delivery_address || 'No registrado'}</p></div>
                      </>
                    )}

                    {selectedParticipant.receipt_url && (
                      <div className="md:col-span-2 mt-2 pt-4 border-t border-slate-50">
                        <a href={selectedParticipant.receipt_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-secondary/10 text-secondary hover:bg-secondary/20 px-4 py-2 rounded-lg text-sm font-bold transition">
                          <CheckCircle2 className="w-4 h-4" /> Ver Comprobante Subido
                        </a>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
              <button onClick={() => setSelectedParticipant(null)} className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold text-sm rounded-lg hover:bg-slate-200 transition">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
