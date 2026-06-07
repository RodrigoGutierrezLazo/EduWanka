import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/apiClient';
import {
  Plus, Search, Pencil, Trash2, Upload, X, Star, User as UserIcon,
  GraduationCap, Mail, Phone, Loader2, ImageOff,
} from 'lucide-react';

interface Teacher {
  id: number;
  name: string;
  title?: string | null;
  specialty?: string | null;
  bio?: string | null;
  credentials?: string | null;
  photo_url?: string | null;
  email?: string | null;
  phone?: string | null;
  is_featured: boolean;
  display_order: number;
  user_id?: number | null;
}

const EMPTY: Omit<Teacher, 'id'> = {
  name: '', title: '', specialty: '', bio: '', credentials: '',
  photo_url: '', email: '', phone: '', is_featured: false, display_order: 0,
  user_id: null,
};

const TITLES = ['', 'Dr.', 'Dra.', 'Mg.', 'Lic.', 'Ing.', 'Abog.', 'Prof.'];

const resolveImg = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `/storage/${url.replace(/^\/+/, '')}`;
};

export default function AdminDocentes() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [profAccounts, setProfAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState<Omit<Teacher, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/api/v1/admin/teachers', { params: search.trim() ? { search: search.trim() } : {} });
      setTeachers(data.data ?? data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const loadProfAccounts = async () => {
    try {
      const { data } = await apiClient.get('/api/v1/admin/users', { params: { role: 'prof', per_page: 1000 } });
      setProfAccounts(data.data ?? data);
    } catch { /* ignore */ }
  };

  useEffect(() => { load(); loadProfAccounts(); }, []);

  useEffect(() => {
    const t = setTimeout(() => load(), 300);
    return () => clearTimeout(t);
  }, [search]);

  const openCreate = () => {
    setEditing(null); setForm({ ...EMPTY }); setError('');
    setPendingFile(null); setPendingPreview(null);
    setShowModal(true);
  };

  const openEdit = (t: Teacher) => {
    setEditing(t);
    setForm({
      name: t.name, title: t.title ?? '', specialty: t.specialty ?? '',
      bio: t.bio ?? '', credentials: t.credentials ?? '',
      photo_url: t.photo_url ?? '', email: t.email ?? '', phone: t.phone ?? '',
      is_featured: t.is_featured, display_order: t.display_order,
      user_id: t.user_id ?? null,
    });
    setError('');
    setPendingFile(null); setPendingPreview(null);
    setShowModal(true);
  };

  const validateForm = (): string | null => {
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.\-]+$/;
    const textRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,\-:;()\/]+$/;
    const phoneRegex = /^[0-9+\s\-()]+$/;
    if (!form.name.trim()) return 'El nombre es obligatorio.';
    if (!nameRegex.test(form.name)) return 'El nombre solo puede contener letras, espacios, puntos y guiones.';
    if (form.specialty && !textRegex.test(form.specialty)) return 'La especialidad contiene caracteres no válidos.';
    if (form.credentials && !textRegex.test(form.credentials)) return 'Las credenciales contienen caracteres no válidos.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'El email no tiene un formato válido.';
    if (form.phone && !phoneRegex.test(form.phone)) return 'El teléfono solo puede contener números, +, espacios, guiones y paréntesis.';
    return null;
  };

  const save = async () => {
    setSaving(true); setError('');
    const validationError = validateForm();
    if (validationError) { setError(validationError); setSaving(false); return; }
    try {
      if (editing) {
        await apiClient.put(`/api/v1/admin/teachers/${editing.id}`, form);
        setShowModal(false);
      } else {
        const { data } = await apiClient.post('/api/v1/admin/teachers', form);
        const created = data.data ?? data;
        // Auto-upload pending photo after creation
        if (pendingFile && created.id) {
          const fd = new FormData();
          fd.append('photo', pendingFile);
          await apiClient.post(`/api/v1/admin/teachers/${created.id}/photo`, fd);
          setPendingFile(null); setPendingPreview(null);
        }
        setEditing(created);
        setShowModal(false);
      }
      load();
    } catch (e: any) {
      const errors = e?.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        setError(Object.values(errors).flat().join(' '));
      } else {
        setError(e?.response?.data?.message ?? 'Error al guardar');
      }
    } finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm('¿Borrar este docente?')) return;
    await apiClient.delete(`/api/v1/admin/teachers/${id}`);
    load();
  };

  const uploadPhoto = async (file: File) => {
    if (!editing) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const { data } = await apiClient.post(`/api/v1/admin/teachers/${editing.id}/photo`, fd);
      setForm(f => ({ ...f, photo_url: data.path ?? data.photo_url }));
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Error al subir foto');
    } finally { setUploading(false); }
  };

  const onChange = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary font-sans">Docentes</h1>
          <p className="text-slate-500 text-sm mt-1">Gestiona el cuerpo docente y sus perfiles públicos</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-secondary text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:brightness-95 transition">
          <Plus className="w-4 h-4" /> Nuevo Docente
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-secondary/40 focus:border-secondary outline-none text-sm"
          placeholder="Buscar por nombre, especialidad…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div>
      ) : teachers.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <UserIcon className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="font-bold">No hay docentes registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {teachers.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
              {/* Photo */}
              <div className="h-48 bg-slate-100 relative overflow-hidden">
                {resolveImg(t.photo_url) ? (
                  <img src={resolveImg(t.photo_url)!} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserIcon className="w-16 h-16 text-slate-300" />
                  </div>
                )}
                {t.is_featured && (
                  <div className="absolute top-2 right-2 bg-secondary text-white rounded-full p-1.5" title="Destacado">
                    <Star className="w-3 h-3 fill-current" />
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="p-4">
                <h3 className="font-bold text-primary text-sm">{t.title ? `${t.title} ` : ''}{t.name}</h3>
                {t.specialty && <p className="text-[10px] uppercase tracking-widest text-secondary font-bold mt-1">{t.specialty}</p>}
                {t.credentials && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{t.credentials}</p>}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(t)} className="flex-1 flex items-center justify-center gap-1 text-xs font-bold text-primary bg-slate-50 py-2 rounded hover:bg-slate-100 transition">
                    <Pencil className="w-3 h-3" /> Editar
                  </button>
                  <button onClick={() => del(t.id)} className="flex items-center justify-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-3 py-2 rounded hover:bg-red-100 transition">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 mb-10">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-primary">{editing ? 'Editar Docente' : 'Nuevo Docente'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100">{error}</div>}

              {/* Photo upload — always visible */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center flex-shrink-0 relative group">
                  {(pendingPreview || resolveImg(form.photo_url)) ? (
                    <img src={pendingPreview ?? resolveImg(form.photo_url)!} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-8 h-8 text-slate-300" />
                  )}
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                    <Upload className="w-5 h-5 text-white" />
                    <input type="file" accept="image/*" className="hidden" disabled={uploading}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (editing) {
                          uploadPhoto(file);
                        } else {
                          setPendingFile(file);
                          setPendingPreview(URL.createObjectURL(file));
                        }
                        e.target.value = '';
                      }} />
                  </label>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-primary bg-slate-50 px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-100 transition">
                    <Upload className="w-4 h-4" /> {uploading ? 'Subiendo…' : 'Subir foto'}
                    <input type="file" accept="image/*" className="hidden" disabled={uploading}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (editing) {
                          uploadPhoto(file);
                        } else {
                          setPendingFile(file);
                          setPendingPreview(URL.createObjectURL(file));
                        }
                        e.target.value = '';
                      }} />
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1">JPG, PNG, WebP. Máx 5MB</p>
                  {pendingFile && !editing && (
                    <p className="text-[10px] text-secondary font-bold mt-1">📷 Foto lista — se subirá al guardar</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Título</label>
                  <select className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-secondary/40 outline-none"
                    value={form.title ?? ''} onChange={e => onChange('title', e.target.value)}>
                    {TITLES.map(t => <option key={t} value={t}>{t || '(Sin título)'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre Completo *</label>
                  <input className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-secondary/40 outline-none"
                    value={form.name} onChange={e => onChange('name', e.target.value)} placeholder="Carlos Mendoza Quispe" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Especialidad</label>
                  <input className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-secondary/40 outline-none"
                    value={form.specialty ?? ''} onChange={e => onChange('specialty', e.target.value)} placeholder="Derecho Penal" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Credenciales</label>
                  <input className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-secondary/40 outline-none"
                    value={form.credentials ?? ''} onChange={e => onChange('credentials', e.target.value)} placeholder="Ph.D. en Derecho, UNMSM" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Biografía</label>
                <textarea rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-secondary/40 outline-none resize-none"
                  value={form.bio ?? ''} onChange={e => onChange('bio', e.target.value)} placeholder="Breve biografía profesional…" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1"><Mail className="w-3 h-3 inline mr-1" />Email</label>
                  <input type="email" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-secondary/40 outline-none"
                    value={form.email ?? ''} onChange={e => onChange('email', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1"><Phone className="w-3 h-3 inline mr-1" />Teléfono</label>
                  <input className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-secondary/40 outline-none"
                    value={form.phone ?? ''} onChange={e => onChange('phone', e.target.value)} />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={e => onChange('is_featured', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-secondary focus:ring-secondary" />
                  <span className="text-sm font-medium text-primary"><Star className="w-3 h-3 inline text-secondary mr-1" />Destacado en Home</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-500">Orden:</label>
                  <input type="number" min={0} className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-center"
                    value={form.display_order} onChange={e => onChange('display_order', parseInt(e.target.value) || 0)} />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cuenta de Usuario (Rol Profesor)</label>
                <select className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-secondary/40 outline-none"
                  value={form.user_id ?? ''} onChange={e => onChange('user_id', e.target.value ? parseInt(e.target.value) : null)}>
                  <option value="">(No vinculado a cuenta de Aula Virtual)</option>
                  {profAccounts.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Vincula este perfil público con su cuenta de acceso al aula virtual para permitir la autogestión.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition">Cancelar</button>
              <button onClick={save} disabled={saving}
                className="px-6 py-2.5 rounded-lg text-sm font-bold bg-secondary text-white hover:brightness-95 transition disabled:opacity-50">
                {saving ? 'Guardando…' : editing ? 'Guardar Cambios' : 'Crear Docente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
