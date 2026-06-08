import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { logger } from '@/lib/logger';
import ListEditor from '@/components/ListEditor';
import { CourseImageUploader } from '@/components/admin/CourseImageUploader';
import {
  BookOpen, ArrowLeft, Save, Loader2, XCircle, Search, 
  GraduationCap, Calendar, Award, CheckCircle2, Plus, ImageOff
} from 'lucide-react';
import { toast } from 'sonner';

interface TeacherMini { 
  id: number; 
  name: string; 
  title?: string | null; 
  specialty?: string | null; 
  photo_url?: string | null; 
}

interface Course {
  id: number; 
  title: string; 
  code?: string; 
  type?: string; 
  specialty?: string;
  specialty_id?: number | null;
  description?: string; 
  syllabus?: string[]; 
  requirements?: string[];
  price: number; 
  duration_weeks: number; 
  start_date?: string; 
  end_date?: string;
  hours?: number | null; 
  level?: string; 
  image_url?: string; 
  teacher_name?: string;
  teacher_id?: number | null; 
  main_teacher?: TeacherMini | null;
  teachers?: TeacherMini[]; 
  is_published: boolean; 
  created_at: string;
  participants_count?: number;
  assigned_prof_id?: number | null;
  assigned_prof?: { id: number; name: string } | null;
  certificate_template_id?: number | null;
}

interface CertTemplate { id: number; name: string; }

type FormState = Omit<Course, 'id' | 'created_at' | 'participants_count' | 'main_teacher' | 'teachers' | 'hours'> & {
  teacher_ids: number[];
  hours: number | null;
  certificate_template_id: number | null;
};

const LEVELS = ['básico', 'intermedio', 'avanzado'];
const TYPES = ['Curso', 'Diplomado', 'Especialidad', 'Programa'];

const EMPTY: FormState = {
  title: '', code: '', type: 'Curso', specialty: '', specialty_id: null, description: '',
  syllabus: [], requirements: [], price: 0, duration_weeks: 8,
  start_date: '', end_date: '', hours: null, level: 'intermedio',
  image_url: '', teacher_name: '', teacher_id: null, teacher_ids: [],
  is_published: true,
  assigned_prof_id: null,
  certificate_template_id: null,
};

const resolveImg = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('/storage')) return url;
  return `/storage/${url.replace(/^\/+/, '')}`;
};

const isPublished = (value: any): boolean => value === true || value === 1 || value === '1' || value === 'true';

/* ─── Teacher Picker (visual grid) ──────────────────────────────── */
function TeacherPicker({ selectedIds, onChange }: { selectedIds: number[]; onChange: (ids: number[]) => void }) {
  const [allTeachers, setAllTeachers] = useState<TeacherMini[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    setLoading(true);
    apiClient.get('/api/v1/admin/teachers', { params: { per_page: 100 } })
      .then(({ data }) => setAllTeachers(data.data ?? []))
      .catch((err) => logger.error("Error loading teachers picker:", err))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const filtered = allTeachers.filter(t => {
    if (!q.trim()) return true;
    const term = q.toLowerCase();
    return t.name.toLowerCase().includes(term)
      || (t.specialty ?? '').toLowerCase().includes(term)
      || (t.title ?? '').toLowerCase().includes(term);
  });

  return (
    <div className="space-y-3">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
        <GraduationCap className="w-4 h-4 inline mr-1 text-slate-400" />
        Docentes del curso
        {selectedIds.length > 0 && (
          <span className="ml-2 text-secondary font-black">({selectedIds.length} seleccionado{selectedIds.length > 1 ? 's' : ''})</span>
        )}
      </label>

      {allTeachers.length > 6 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            value={q} 
            onChange={e => setQ(e.target.value)} 
            placeholder="Filtrar docentes por nombre o especialidad…"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-secondary" 
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-secondary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          {allTeachers.length === 0
            ? <span>No hay docentes creados en el sistema. <a href="/aula/admin/docentes" className="text-secondary font-bold underline">Crear docentes →</a></span>
            : 'Sin resultados que coincidan con la búsqueda'
          }
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
          {filtered.map(t => {
            const isSelected = selectedIds.includes(t.id);
            return (
              <button 
                key={t.id} 
                type="button" 
                onClick={() => toggle(t.id)}
                className={`flex items-center gap-3 p-2.5 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-secondary bg-secondary/5 shadow-sm'
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                }`}
              >
                <div className={`w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border-2 flex items-center justify-center ${
                  isSelected ? 'border-secondary' : 'border-slate-200'
                } bg-slate-150`}>
                  {resolveImg(t.photo_url) ? (
                    <img src={resolveImg(t.photo_url)!} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">
                      {t.name.split(' ').slice(0, 2).map(w => w[0]).join('')}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold truncate ${isSelected ? 'text-primary' : 'text-slate-700'}`}>
                    {t.title ? `${t.title} ` : ''}{t.name}
                  </p>
                  {t.specialty && (
                    <p className="text-[10px] text-slate-400 truncate">{t.specialty}</p>
                  )}
                </div>
                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Main Course Editor Component ───────────────────────────────── */
export default function AdminCourseEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormState>({ ...EMPTY });
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);

  // Pickers and lists state
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [professors, setProfessors] = useState<any[]>([]);
  const [certTemplates, setCertTemplates] = useState<CertTemplate[]>([]);

  // Quick Specialty Modal State
  const [showQuickSpecialtyModal, setShowQuickSpecialtyModal] = useState(false);
  const [quickSpecialtyTitle, setQuickSpecialtyTitle] = useState('');
  const [quickSpecialtySaving, setQuickSpecialtySaving] = useState(false);

  const fetchSpecialties = async () => {
    try {
      const { data } = await apiClient.get('/api/v1/admin/specialties');
      setSpecialties(data.data ?? data ?? []);
    } catch (err) {
      logger.error("Error fetching specialties in Course Editor:", err);
    }
  };

  const fetchProfessors = async () => {
    try {
      const { data } = await apiClient.get('/api/v1/admin/users', { params: { role: 'prof' } });
      setProfessors(data.data ?? []);
    } catch (err) {
      logger.error("Error fetching professors in Course Editor:", err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data } = await apiClient.get('/api/v1/admin/certificates/templates');
      setCertTemplates(data.data ?? data ?? []);
    } catch (err) {
      logger.error("Error fetching templates in Course Editor:", err);
    }
  };

  // Load course details for editing
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError('');
      try {
        await Promise.all([
          fetchSpecialties(),
          fetchProfessors(),
          fetchTemplates()
        ]);

        if (id) {
          const { data } = await apiClient.get(`/api/v1/admin/courses/${id}`);
          const c = data.data ?? data;
          setForm({
            title: c.title,
            code: c.code ?? '',
            type: c.type ?? 'Curso',
            specialty: c.specialty ?? '',
            specialty_id: c.specialty_id ?? null,
            description: c.description ?? '',
            syllabus: c.syllabus ?? [],
            requirements: c.requirements ?? [],
            price: c.price,
            duration_weeks: c.duration_weeks,
            start_date: c.start_date?.slice(0, 10) ?? '',
            end_date: c.end_date?.slice(0, 10) ?? '',
            hours: c.hours && c.hours > 0 ? c.hours : null,
            level: c.level ?? 'intermedio',
            image_url: c.image_url ?? '',
            teacher_name: c.teacher_name ?? '',
            teacher_id: c.teacher_id ?? null,
            teacher_ids: (c.teachers ?? []).map((t: any) => t.id),
            is_published: isPublished(c.is_published),
            assigned_prof_id: c.assigned_prof_id ?? null,
            certificate_template_id: c.certificate_template_id ?? null,
          });
        }
      } catch (err: any) {
        setError('No se pudo inicializar los datos del editor de cursos.');
        toast.error('Error de inicialización');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [id]);

  const f = (v: any, k: string) => setForm(p => ({ ...p, [k]: v }));

  const validateForm = (): string | null => {
    const titleRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,\-:;()\/]+$/;
    const codeRegex = /^[a-zA-Z0-9\-\/]+$/;
    if (!form.title.trim()) return 'El título del curso es obligatorio.';
    if (!titleRegex.test(form.title)) return 'El título solo puede contener letras, números, espacios y signos de puntuación básicos.';
    if (form.code && !codeRegex.test(form.code)) return 'El código solo puede contener letras, números, barras y guiones.';
    if (form.specialty && !titleRegex.test(form.specialty)) return 'El nombre de la especialidad asociada tiene caracteres inválidos.';
    if (Number(form.price) > 999999.99) return 'El precio no puede ser mayor a S/ 999,999.99.';
    if (Number(form.price) < 0) return 'El precio no puede ser negativo.';
    if (form.start_date && form.end_date && form.end_date < form.start_date) return 'La fecha de finalización debe ser igual o posterior a la fecha de inicio.';
    return null;
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setSaving(false);
      toast.error('Verifica los datos del formulario');
      return;
    }

    try {
      const payload: Record<string, any> = {
        title: form.title,
        code: form.code || null,
        type: form.type || 'Curso',
        specialty: form.specialty || null,
        specialty_id: form.specialty_id,
        description: form.description || null,
        price: Number(form.price) || 0,
        duration_weeks: Number(form.duration_weeks) || 1,
        level: form.level || null,
        image_url: form.image_url || null,
        teacher_name: form.teacher_name || null,
        teacher_id: form.teacher_id || null,
        teacher_ids: form.teacher_ids ?? [],
        is_published: Boolean(form.is_published),
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        syllabus: (form.syllabus ?? []).filter(s => s.trim()),
        requirements: (form.requirements ?? []).filter(r => r.trim()),
        assigned_prof_id: form.assigned_prof_id,
        certificate_template_id: form.certificate_template_id,
      };

      if (form.hours && Number(form.hours) > 0) {
        payload.hours = Number(form.hours);
      }

      let saved: Course;
      if (id) {
        const { data } = await apiClient.put(`/api/v1/admin/courses/${id}`, payload);
        saved = data.data ?? data;
        
        if (pendingImageFile) {
          const imageForm = new FormData();
          imageForm.append('image', pendingImageFile);
          const imageResponse = await apiClient.post(
            `/api/v1/admin/courses/${id}/image`,
            imageForm,
            { headers: { 'Content-Type': 'multipart/form-data' } },
          );
          saved = {
            ...saved,
            ...(imageResponse.data.course ?? {}),
            image_url: imageResponse.data.path ?? saved.image_url,
          };
        }
        
        toast.success('Curso actualizado correctamente.');
      } else {
        const { data } = await apiClient.post('/api/v1/admin/courses', payload);
        saved = data.data ?? data;

        if (pendingImageFile && saved?.id) {
          const imageForm = new FormData();
          imageForm.append('image', pendingImageFile);
          const imageResponse = await apiClient.post(
            `/api/v1/admin/courses/${saved.id}/image`,
            imageForm,
            { headers: { 'Content-Type': 'multipart/form-data' } },
          );
          saved = {
            ...saved,
            ...(imageResponse.data.course ?? {}),
            image_url: imageResponse.data.path ?? saved.image_url,
          };
        }
        
        toast.success('Curso creado correctamente.');
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['public-courses'] }),
        queryClient.invalidateQueries({ queryKey: ['public-course'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-courses'] }),
      ]);

      navigate('/aula/admin/cursos');
    } catch (e: any) {
      const errors = e?.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        const list = Object.entries(errors)
          .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
          .join(' | ');
        setError(list);
      } else {
        setError(e?.response?.data?.message ?? 'Error al guardar los cambios del curso.');
      }
      toast.error('Error al guardar el curso');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickSpecialtySave = async () => {
    if (!quickSpecialtyTitle.trim()) return;
    setQuickSpecialtySaving(true);
    try {
      const payload = {
        title: quickSpecialtyTitle.trim(),
        type: 'derecho',
        description: `Especialidad en ${quickSpecialtyTitle.trim()}`,
      };
      const { data } = await apiClient.post('/api/v1/admin/specialties', payload);
      const saved = data.data ?? data;
      setSpecialties(prev => [...prev, saved]);
      setForm(prev => ({
        ...prev,
        specialty_id: saved.id,
        specialty: saved.title,
      }));
      setShowQuickSpecialtyModal(false);
      toast.success('Especialidad creada y seleccionada.');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al crear la especialidad');
    } finally {
      setQuickSpecialtySaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-secondary" />
        <p className="text-slate-500 font-medium text-sm">Cargando editor del curso...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans pb-16">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <button 
            onClick={() => navigate('/aula/admin/cursos')}
            className="group inline-flex items-center gap-1 text-slate-400 hover:text-primary text-xs font-bold transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" /> Volver a Cursos
          </button>
          <h1 className="text-xl sm:text-2xl font-extrabold text-primary flex items-center gap-2">
            <BookOpen className="w-5 sm:w-6 h-5 sm:h-6 text-secondary" /> 
            <span>{id ? 'Editar Curso' : 'Nuevo Curso'}</span>
          </h1>
          <p className="text-slate-500 text-xs">Configure todos los parámetros académicos, docentes, horarios, precios y temario del curso</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/aula/admin/cursos')}
            className="px-4 py-2.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 transition"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-secondary hover:brightness-95 disabled:opacity-60 text-white px-5 py-2.5 rounded-lg text-xs font-black shadow-soft transition"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Guardando…</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-white" />
                <span>{id ? 'Guardar Cambios' : 'Crear Curso'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100 flex items-center gap-2">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Course Form Body Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Form Blocks: Info General + Malla */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Información General */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft space-y-5">
            <h3 className="font-extrabold text-sm text-primary border-b border-slate-100 pb-2.5 uppercase tracking-wider">
              1. Información General del Curso
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Título del Curso *</label>
                <input 
                  value={form.title} 
                  onChange={e => f(e.target.value, 'title')}
                  placeholder="Ej: Curso de Alta Especialización en Derecho Civil..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary bg-white transition-colors" 
                />
              </div>
              <div className="col-span-3 sm:col-span-1 space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tipo</label>
                <select 
                  value={form.type} 
                  onChange={e => f(e.target.value, 'type')}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-secondary bg-white cursor-pointer"
                >
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 sm:col-span-1 space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Código / Resolución</label>
                <input 
                  value={form.code} 
                  onChange={e => f(e.target.value, 'code')} 
                  placeholder="Ej: DER-001"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary" 
                />
              </div>

              {/* SELECT DE ESPECIALIDADES */}
              <div className="col-span-3 sm:col-span-1 space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Especialidad / Área</label>
                <div className="flex gap-2 items-center">
                  <select
                    value={form.specialty_id || ''}
                    onChange={e => {
                      const val = Number(e.target.value) || null;
                      const selected = specialties.find(s => s.id === val);
                      f(val, 'specialty_id');
                      f(selected ? selected.title : '', 'specialty');
                    }}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-secondary bg-white cursor-pointer"
                  >
                    <option value="">-- Sin especialización --</option>
                    {specialties.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({s.type === 'formacion' ? 'Formación' : 'Curso'})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => { setQuickSpecialtyTitle(''); setShowQuickSpecialtyModal(true); }}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 text-sm font-bold transition shrink-0 shadow-sm"
                    title="Crear Nueva Especialidad Rápida"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="col-span-3 sm:col-span-1 space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nivel</label>
                <select 
                  value={form.level} 
                  onChange={e => f(e.target.value, 'level')}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-secondary bg-white cursor-pointer"
                >
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Descripción General</label>
              <textarea 
                value={form.description} 
                onChange={e => f(e.target.value, 'description')} 
                rows={3}
                placeholder="Escribe la descripción e introducción del curso..."
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary resize-none" 
              />
            </div>
          </div>

          {/* Card 2: Plan de Estudios (Syllabus & Requisitos) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft space-y-6">
            <h3 className="font-extrabold text-sm text-primary border-b border-slate-100 pb-2.5 uppercase tracking-wider">
              2. Plan de Estudios & Contenidos
            </h3>
            
            <div className="space-y-6">
              <ListEditor 
                label="Temario / Sílabo del Curso" 
                items={form.syllabus ?? []} 
                onChange={v => f(v, 'syllabus')} 
              />

              <div className="border-t border-slate-100 pt-6">
                <ListEditor 
                  label="Requisitos de Inscripción" 
                  items={form.requirements ?? []} 
                  onChange={v => f(v, 'requirements')} 
                />
              </div>
            </div>
          </div>

          {/* Card 3: Selección de Plana Docente */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft">
            <h3 className="font-extrabold text-sm text-primary border-b border-slate-100 pb-2.5 uppercase tracking-wider mb-5">
              3. Plana Docente del Curso
            </h3>
            <TeacherPicker selectedIds={form.teacher_ids} onChange={ids => f(ids, 'teacher_ids')} />
          </div>

        </div>

        {/* Right Form Blocks: Fechas + Precios + Fotos + Config */}
        <div className="space-y-6">
          
          {/* Card 4: Costos & Fechas */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft space-y-4">
            <h3 className="font-extrabold text-sm text-primary border-b border-slate-100 pb-2.5 uppercase tracking-wider">
              4. Fechas & Costos
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Precio del Curso (S/)</label>
              <input 
                type="number" 
                value={form.price} 
                onChange={e => f(Number(e.target.value), 'price')} 
                min={0} 
                max={999999.99} 
                step="0.01"
                placeholder="0.00"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary font-bold text-slate-700" 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Semanas</label>
                <input 
                  type="number" 
                  value={form.duration_weeks} 
                  onChange={e => f(Number(e.target.value), 'duration_weeks')}
                  placeholder="8"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary font-bold text-slate-700" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Horas Académicas</label>
                <input 
                  type="number" 
                  value={form.hours || ''} 
                  onChange={e => f(Number(e.target.value) || null, 'hours')} 
                  placeholder="120"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary font-bold text-slate-700" 
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
                <Calendar className="w-3.5 h-3.5 inline mr-1 text-slate-400" /> Fecha de inicio
              </label>
              <input 
                type="date" 
                value={form.start_date || ''} 
                onChange={e => f(e.target.value, 'start_date')}
                className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-secondary bg-white" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
                <Calendar className="w-3.5 h-3.5 inline mr-1 text-slate-400" /> Fecha de finalización
              </label>
              <input 
                type="date" 
                value={form.end_date || ''} 
                onChange={e => f(e.target.value, 'end_date')}
                className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-secondary bg-white" 
              />
            </div>
          </div>

          {/* Card 5: Portada del Curso */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <h3 className="font-extrabold text-sm text-primary uppercase tracking-wider">
                5. Imagen de Portada
              </h3>
              <span className="text-[9px] text-emerald-600 font-extrabold uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded w-fit">
                Recomendación: 1200 x 675 px (Relación 16:9)
              </span>
            </div>
            
            <div className="space-y-3">
              <CourseImageUploader
                courseId={id ? Number(id) : undefined}
                currentImageUrl={resolveImg(form.image_url)}
                onPendingFile={setPendingImageFile}
                onUploaded={(path) => {
                  f(path, 'image_url');
                  if (id) {
                    toast.success('Imagen cargada correctamente.');
                    queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
                  }
                }}
              />
            </div>
          </div>

          {/* Card 6: Asignación Académica & Certificados */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft space-y-5">
            <h3 className="font-extrabold text-sm text-primary border-b border-slate-100 pb-2.5 uppercase tracking-wider">
              6. Control y Asignación
            </h3>

            {/* Docente Responsable */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
                Docente Responsable (Aula Virtual)
              </label>
              <select 
                value={form.assigned_prof_id || ''} 
                onChange={e => f(Number(e.target.value) || null, 'assigned_prof_id')}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-secondary bg-white cursor-pointer"
              >
                <option value="">-- Sin asignar (Solo Admin) --</option>
                {professors.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 italic leading-snug">
                El profesor asignado podrá ver el curso y gestionar sus módulos en su panel personal.
              </p>
            </div>

            {/* Plantilla de Certificado */}
            <div className="space-y-1.5 pt-3 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
                <Award className="w-4 h-4 inline mr-1 text-slate-400" /> Plantilla de Certificado
              </label>
              <select
                value={form.certificate_template_id || ''}
                onChange={e => f(Number(e.target.value) || null, 'certificate_template_id')}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-secondary bg-white cursor-pointer"
              >
                <option value="">-- Sin plantilla asignada --</option>
                {certTemplates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 italic leading-snug">
                Los diplomas que los alumnos descarguen para este curso usarán esta plantilla PDF.
              </p>
            </div>

            {/* Estado Publicado Switch */}
            <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 pt-3 border-t border-slate-100 animate-fadeIn">
              <div>
                <p className="text-xs font-bold text-slate-700">
                  {form.is_published ? 'Estado: Publicado' : 'Estado: Borrador'}
                </p>
                <p className="text-[10px] text-slate-400 leading-snug mt-0.5">
                  {form.is_published
                    ? 'Visible públicamente en la web.'
                    : 'Guardado como borrador privado.'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={!!form.is_published}
                onClick={() => f(!form.is_published, 'is_published')}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                  form.is_published ? 'bg-secondary' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    form.is_published ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* QUICK SPECIALTY MODAL */}
      {showQuickSpecialtyModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-base text-primary flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-secondary" />
                Nueva Especialidad
              </h3>
              <button onClick={() => setShowQuickSpecialtyModal(false)}>
                <XCircle className="w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Crea una categoría de cursos de forma rápida. Al guardarla, se seleccionará automáticamente en este curso y podrás editar sus detalles (imagen, descripción completa) más tarde en la sección de Especialidades.
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Título de Especialidad / Área *</label>
                <input
                  type="text"
                  value={quickSpecialtyTitle}
                  onChange={e => setQuickSpecialtyTitle(e.target.value)}
                  placeholder="Ej. Derecho Civil, Derecho Laboral"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowQuickSpecialtyModal(false)}
                className="flex-grow py-2 border border-slate-200 rounded-lg text-xs font-bold hover:bg-white text-slate-500 transition bg-transparent"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleQuickSpecialtySave}
                disabled={quickSpecialtySaving || !quickSpecialtyTitle.trim()}
                className="flex-grow py-2 bg-secondary text-white rounded-lg text-xs font-bold disabled:opacity-60 hover:brightness-95 transition"
              >
                {quickSpecialtySaving ? 'Guardando…' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
