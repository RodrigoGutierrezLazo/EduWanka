import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../../../lib/apiClient';
import { 
  BookOpen, Users, Award, ChevronRight, Loader, AlertCircle, 
  Plus, Edit2, Search, X, ListPlus, XCircle, Calendar, ImageOff
} from 'lucide-react';
import { CourseImageUploader } from '../../../components/admin/CourseImageUploader';

/* ─── Types ─────────────────────────────────────────────────────── */
interface Course {
  id: number; title: string; code?: string; type?: string; specialty?: string;
  description?: string; syllabus?: string[]; requirements?: string[];
  price: number; duration_weeks: number; start_date?: string; end_date?: string;
  hours?: number | null; level?: string; image_url?: string; teacher_name?: string;
  teacher_id?: number | null; is_published: boolean; created_at: string;
  enrolled_count?: number; certificates_count?: number; questionnaire_attempts_count?: number;
}

type FormState = {
  title: string; code: string; type: string; specialty: string;
  description: string; syllabus: string[]; requirements: string[];
  price: number; duration_weeks: number; start_date: string; end_date: string;
  hours: number | null; level: string; image_url: string;
  teacher_name: string; teacher_id: number | null;
  is_published: boolean;
};

const LEVELS = ['básico', 'intermedio', 'avanzado'];
const TYPES = ['Curso', 'Diplomado', 'Especialidad', 'Programa'];

const EMPTY: FormState = {
  title: '', code: '', type: 'Curso', specialty: '', description: '',
  syllabus: [], requirements: [], price: 0, duration_weeks: 8,
  start_date: '', end_date: '', hours: null, level: 'intermedio',
  image_url: '', teacher_name: '', teacher_id: null,
  is_published: true,
};

const resolveImg = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('/storage')) return url;
  return `/storage/${url.replace(/^\/+/, '')}`;
};

const isPublished = (value: any): boolean => value === true || value === 1 || value === '1' || value === 'true';

/* ─── Reusable List Editor ──────────────────────────────────────── */
function ListEditor({ label, items, onChange }: { label: string; items: string[]; onChange: (v: string[]) => void }) {
  const add = () => onChange([...items, '']);
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i: number, v: string) => { const n = [...items]; n[i] = v; onChange(n); };
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</label>
        <button type="button" onClick={add} className="flex items-center gap-1 text-xs font-bold text-secondary hover:text-secondary/80">
          <ListPlus className="w-3.5 h-3.5" /> Añadir
        </button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 mb-1.5">
          <span className="text-xs text-slate-400 pt-2.5 w-5 text-right flex-shrink-0">{i + 1}.</span>
          <input value={item} onChange={e => update(i, e.target.value)}
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-secondary" />
          <button type="button" onClick={() => remove(i)} className="text-slate-300 hover:text-red-500 flex-shrink-0">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      ))}
      {items.length === 0 && <p className="text-xs text-slate-300 italic">Sin elementos. Clic en "Añadir" para agregar.</p>}
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────────── */
export default function ProfessorCourses() {
  const nav = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/v1/prof/courses');
      setCourses(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los cursos asignados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setPendingImageFile(null);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (c: Course) => {
    setEditing(c);
    setPendingImageFile(null);
    setForm({
      title: c.title, code: c.code ?? '', type: c.type ?? 'Curso', specialty: c.specialty ?? '',
      description: c.description ?? '', syllabus: c.syllabus ?? [], requirements: c.requirements ?? [],
      price: c.price, duration_weeks: c.duration_weeks, start_date: c.start_date?.slice(0, 10) ?? '',
      end_date: c.end_date?.slice(0, 10) ?? '',
      hours: c.hours && c.hours > 0 ? c.hours : null,
      level: c.level ?? 'intermedio',
      image_url: c.image_url ?? '', teacher_name: c.teacher_name ?? '',
      teacher_id: c.teacher_id ?? null,
      is_published: isPublished(c.is_published),
    });
    setFormError(''); setShowModal(true);
  };

  const save = async () => {
    setSaving(true); setFormError('');
    try {
      const payload: Record<string, any> = {
        title: form.title,
        code: form.code || null,
        type: form.type || 'Curso',
        specialty: form.specialty || null,
        description: form.description || null,
        price: Number(form.price) || 0,
        duration_weeks: Number(form.duration_weeks) || 1,
        level: form.level || null,
        image_url: form.image_url || null,
        teacher_name: form.teacher_name || null,
        teacher_id: form.teacher_id || null,
        is_published: Boolean(form.is_published),
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        syllabus: (form.syllabus ?? []).filter(s => s.trim()),
        requirements: (form.requirements ?? []).filter(r => r.trim()),
      };

      if (form.hours && Number(form.hours) > 0) {
        payload.hours = Number(form.hours);
      }

      if (editing) {
        await apiClient.put(`/api/v1/prof/courses/${editing.id}`, payload);
        setShowModal(false);
      } else {
        const { data } = await apiClient.post('/api/v1/prof/courses', payload);
        let saved = data.data ?? data;

        if (pendingImageFile && saved?.id) {
          const imageForm = new FormData();
          imageForm.append('image', pendingImageFile);
          await apiClient.post(
            `/api/v1/prof/courses/${saved.id}/image`,
            imageForm,
            { headers: { 'Content-Type': 'multipart/form-data' } },
          );
        }

        setPendingImageFile(null);
        setForm({ ...EMPTY });
        setShowModal(false);
      }
      load();
    } catch (e: any) {
      const errors = e?.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        const list = Object.entries(errors)
          .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
          .join(' | ');
        setFormError(list);
      } else {
        setFormError(e?.response?.data?.message ?? 'Error al guardar');
      }
    } finally { setSaving(false); }
  };

  const f = (v: any, k: string) => setForm(p => ({ ...p, [k]: v }));

  const filtered = courses.filter(c => {
    const q = search.toLowerCase();
    return (!q || c.title.toLowerCase().includes(q) || (c.code ?? '').toLowerCase().includes(q));
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader className="w-10 h-10 animate-spin text-secondary mb-4" />
        <p className="text-slate-500 font-medium">Cargando tus cursos asignados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 p-6 rounded-2xl flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-red-800">Error de conexión</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Mis Cursos</h1>
          <p className="text-slate-500 mt-2 max-w-2xl">
            Gestiona el contenido, alumnos y certificaciones de los cursos que tienes bajo tu responsabilidad.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar…"
              className="pl-9 pr-3 py-2.5 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-secondary w-48" />
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-secondary text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-secondary/90 transition shadow-soft">
            <Plus className="w-4 h-4" /> Nuevo Curso
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            {search ? 'No se encontraron cursos' : 'No tienes cursos asignados'}
          </h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">
            {search ? 'Prueba con otros términos de búsqueda.' : 'Crea un nuevo curso o contacta al administrador para que te asigne uno.'}
          </p>
          {!search && (
            <button onClick={openCreate} className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-white font-bold rounded-2xl hover:bg-secondary/90 transition">
              <Plus className="w-4 h-4" /> Crear mi primer curso
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course) => (
            <div 
              key={course.id} 
              className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              <div className="h-32 bg-primary relative overflow-hidden">
                {resolveImg(course.image_url) ? (
                  <img 
                    src={resolveImg(course.image_url)!} 
                    alt={course.title}
                    className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                    <ImageOff className="w-10 h-10 text-white/20" />
                  </div>
                )}
                <div className="absolute top-4 left-6 flex gap-2">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                    {course.code || 'SIN CÓDIGO'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isPublished(course.is_published) ? 'bg-green-500/80 text-white' : 'bg-slate-400/80 text-white'}`}>
                    {isPublished(course.is_published) ? 'Publicado' : 'Borrador'}
                  </span>
                </div>
                <button
                  onClick={() => openEdit(course)}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-slate-900 leading-tight mb-4 group-hover:text-secondary transition-colors line-clamp-2">
                  {course.title}
                </h3>
                
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-900">{course.enrolled_count || 0}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Alumnos</p>
                  </div>
                  <div className="text-center border-x border-slate-100">
                    <p className="text-sm font-bold text-slate-900">{course.questionnaire_attempts_count || 0}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Evaluaciones</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-900">{course.certificates_count || 0}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Certs</p>
                  </div>
                </div>
                
                <div className="mt-auto space-y-3">
                  <Link 
                    to={`/aula/prof/cursos/${course.id}`}
                    className="w-full py-4 bg-slate-50 hover:bg-secondary hover:text-white rounded-2xl flex items-center justify-center gap-2 font-bold text-slate-600 transition-all text-sm group/btn"
                  >
                    Gestionar Curso
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                  
                  <div className="flex gap-2">
                    <Link 
                      to={`/aula/prof/cursos/${course.id}/alumnos`}
                      className="flex-1 py-3 border border-slate-100 hover:border-secondary/30 hover:bg-secondary/5 rounded-2xl flex items-center justify-center gap-2 font-bold text-slate-500 hover:text-secondary transition-all text-[11px]"
                    >
                      <Users className="w-3.5 h-3.5" />
                      Alumnos
                    </Link>
                    <Link 
                      to={`/aula/prof/cursos/${course.id}/certificados`}
                      className="flex-1 py-3 border border-slate-100 hover:border-secondary/30 hover:bg-secondary/5 rounded-2xl flex items-center justify-center gap-2 font-bold text-slate-500 hover:text-secondary transition-all text-[11px]"
                    >
                      <Award className="w-3.5 h-3.5" />
                      Certificar
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Modal — Course Form ────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-8 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 mb-10">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-bold text-lg text-primary">{editing ? 'Editar Curso' : 'Nuevo Curso'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {formError && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100">{formError}</div>}

              {/* Row 1: Título + Tipo */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Título *</label>
                  <input value={form.title} onChange={e => f(e.target.value, 'title')}
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-secondary" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tipo</label>
                  <select value={form.type} onChange={e => f(e.target.value, 'type')}
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-secondary">
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2: Código + Especialidad + Nivel */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Código / Resolución</label>
                  <input value={form.code} onChange={e => f(e.target.value, 'code')} placeholder="DER-001"
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-secondary" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Especialidad / Área</label>
                  <input value={form.specialty} onChange={e => f(e.target.value, 'specialty')} placeholder="Derecho Penal"
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-secondary" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nivel</label>
                  <select value={form.level} onChange={e => f(e.target.value, 'level')}
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-secondary">
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 3: Precio + Duración + Horas */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Precio (S/)</label>
                  <input type="number" value={form.price} onChange={e => f(Number(e.target.value), 'price')}
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-secondary" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Duración (semanas)</label>
                  <input type="number" value={form.duration_weeks} onChange={e => f(Number(e.target.value), 'duration_weeks')}
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-secondary" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Horas académicas</label>
                  <input type="number" value={form.hours || ''} onChange={e => f(Number(e.target.value) || null, 'hours')} placeholder="120"
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-secondary" />
                </div>
              </div>

              {/* Row 4: Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide"><Calendar className="w-3 h-3 inline mr-1" />Fecha de inicio</label>
                  <input type="date" value={form.start_date || ''} onChange={e => f(e.target.value, 'start_date')}
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-secondary" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide"><Calendar className="w-3 h-3 inline mr-1" />Fecha de fin</label>
                  <input type="date" value={form.end_date || ''} onChange={e => f(e.target.value, 'end_date')}
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-secondary" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Descripción</label>
                <textarea value={form.description} onChange={e => f(e.target.value, 'description')} rows={3}
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-secondary resize-none" />
              </div>

              {/* Syllabus */}
              <ListEditor label="Temario / Sílabo" items={form.syllabus ?? []} onChange={v => f(v, 'syllabus')} />

              {/* Requirements */}
              <ListEditor label="Requisitos" items={form.requirements ?? []} onChange={v => f(v, 'requirements')} />

              {/* Image Uploader */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Imagen de portada</label>
                <CourseImageUploader
                  courseId={editing?.id}
                  currentImageUrl={resolveImg(form.image_url)}
                  onPendingFile={setPendingImageFile}
                  onUploaded={(path) => {
                    f(path, 'image_url');
                    if (editing?.id && path) load();
                  }}
                />
              </div>

              {/* Published */}
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-slate-700">
                    {form.is_published ? 'Publicado' : 'Oculto'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {form.is_published
                      ? 'Visible en la página pública de cursos.'
                      : 'No se mostrará en el catálogo público.'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.is_published}
                  onClick={() => f(!form.is_published, 'is_published')}
                  className={`relative h-7 w-12 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/60 focus:ring-offset-2 ${
                    form.is_published ? 'bg-secondary' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      form.is_published ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">Cancelar</button>
              <button onClick={save} disabled={saving} className="flex-1 py-2.5 bg-secondary text-white rounded-lg text-sm font-bold disabled:opacity-60 hover:brightness-95 transition">
                {saving ? 'Guardando…' : editing ? 'Guardar Cambios' : 'Crear Curso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
