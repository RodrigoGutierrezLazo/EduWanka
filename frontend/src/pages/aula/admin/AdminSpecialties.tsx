import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';
import {
  Target, Plus, Search, Edit2, Trash2, X, Loader2, ImageOff,
  ArrowUp, ArrowDown, Save, XCircle, Laptop, Settings
} from 'lucide-react';
import { toast } from 'sonner';

interface Specialty {
  id: number;
  title: string;
  slug: string;
  description?: string;
  image_url?: string;
  type: string; // 'formacion' or 'derecho'
  order: number;
  custom_sections?: any;
}

const EMPTY_SECTIONS = {
  hero: { subtitle: '', video_title: '', badge: '' },
  indicators: { duration: '', hours: '', mode: '', accreditation: '' },
  presentation: { title: '', about: '', objective: '', roles: [] },
  methodology: { pillars: [], tools: [] },
  profile: { skills: [] },
  accreditations: { title: '', items: [] },
  syllabus: [],
  teachers: [],
  investment: { matricula_socios: '', matricula_publico: '', cuota_socios_antes: '', cuota_socios_despues: '', cuota_publico_antes: '', cuota_publico_despues: '' },
  payment_accounts: { titular: '', yape: '', whatsapp: '', accounts: [] }
};

/* ─── Robust Image Fallbacks ─────────────────────────────────────── */
function SpecialtyImage({ src, title }: { src?: string | null; title: string }) {
  const [imgError, setImgError] = useState(false);
  
  const resolveImgPath = (path?: string | null): string => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('/storage')) return path;
    return `/storage/${path}`;
  };

  if (!src || imgError) {
    return (
      <div className="w-10 h-6 bg-gradient-to-br from-primary to-slate-900 rounded flex items-center justify-center shrink-0 border border-slate-200 shadow-sm text-[10px] font-black text-secondary select-none">
        {title.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img 
      src={resolveImgPath(src)} 
      alt="" 
      onError={() => setImgError(true)}
      className="w-10 h-6 object-cover rounded border border-slate-200 shrink-0 shadow-sm animate-fadeIn" 
    />
  );
}

function SpecialtyPreviewImage({ src, title }: { src?: string | null; title: string }) {
  const [imgError, setImgError] = useState(false);
  
  const resolveImgPath = (path?: string | null): string => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('/storage') || path.startsWith('blob:')) return path;
    return `/storage/${path}`;
  };

  if (!src || imgError) {
    return (
      <div className="w-full h-28 bg-gradient-to-br from-primary to-slate-950 rounded-xl flex flex-col items-center justify-center border border-slate-200 text-slate-300 text-center p-4">
        <ImageOff className="w-6 h-6 text-secondary mb-1" />
        <span className="text-[11px] font-bold text-slate-200 max-w-[200px] truncate">{title || 'Sin Título'}</span>
        <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Sin imagen de portada</span>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm h-28 bg-slate-100">
      <img 
        src={resolveImgPath(src)} 
        alt="" 
        onError={() => setImgError(true)}
        className="w-full h-full object-cover animate-fadeIn" 
      />
      <div className="absolute inset-0 bg-black/35 flex items-end p-3">
        <span className="text-white font-bold text-xs shadow-sm truncate">{title || 'Vista Previa'}</span>
      </div>
    </div>
  );
}

export default function AdminSpecialties() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'formacion' | 'derecho'>('formacion');
  const [search, setSearch] = useState('');
  
  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Specialty | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Basic Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('derecho');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search.trim()) params.search = search.trim();
      const { data } = await apiClient.get('/api/v1/admin/specialties', { params });
      setSpecialties(data.data ?? data);
    } catch (err) {
      toast.error('No se pudieron cargar las especialidades.');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setDescription('');
    setType('derecho');
    setImageUrl('');
    setImageFile(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (spec: Specialty) => {
    setEditing(spec);
    setTitle(spec.title);
    setDescription(spec.description ?? '');
    setType(spec.type);
    setImageUrl(spec.image_url ?? '');
    setImageFile(null);
    setError('');
    setShowModal(true);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    
    if (!title.trim()) {
      setError('El título es obligatorio.');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        title,
        description: description || null,
        image_url: imageUrl || null,
        type,
        custom_sections: type === 'formacion' ? (editing?.custom_sections ?? EMPTY_SECTIONS) : null
      };

      let saved: Specialty;
      if (editing) {
        const { data } = await apiClient.put(`/api/v1/admin/specialties/${editing.id}`, payload);
        saved = data.data ?? data;
        toast.success('Especialidad actualizada correctamente.');
      } else {
        const { data } = await apiClient.post('/api/v1/admin/specialties', payload);
        saved = data.data ?? data;
        toast.success('Especialidad creada correctamente.');
      }

      // If an image file was selected, upload it
      if (imageFile && saved.id) {
        setUploadingImage(true);
        const imgForm = new FormData();
        imgForm.append('image', imageFile);
        const { data: imgRes } = await apiClient.post(`/api/v1/admin/specialties/${saved.id}/image`, imgForm, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        saved = imgRes.specialty ?? saved;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['specialties'] }),
        queryClient.invalidateQueries({ queryKey: ['specialty'] }),
      ]);
      
      load();
      setShowModal(false);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Error al guardar la especialidad.');
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  const del = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta especialidad? Los cursos vinculados perderán su asignación.')) return;
    try {
      await apiClient.delete(`/api/v1/admin/specialties/${id}`);
      toast.success('Especialidad eliminada.');
      queryClient.invalidateQueries({ queryKey: ['specialties'] });
      load();
    } catch {
      toast.error('No se pudo eliminar la especialidad.');
    }
  };

  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    const list = specialties.filter(s => s.type === activeTab);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const newList = [...list];
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;

    // Build the complete reorder list
    const otherList = specialties.filter(s => s.type !== activeTab);
    const mergedList = activeTab === 'formacion' ? [...newList, ...otherList] : [...otherList, ...newList];

    // Optimistic UI update
    setSpecialties(mergedList);

    try {
      await apiClient.post('/api/v1/admin/specialties/reorder', {
        ids: newList.map(s => s.id)
      });
      queryClient.invalidateQueries({ queryKey: ['specialties'] });
      toast.success('Orden actualizado.');
    } catch {
      load(); // roll back on error
      toast.error('No se pudo reordenar.');
    }
  };

  const filtered = specialties.filter(s => s.type === activeTab);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-primary flex items-center gap-2">
            <Target className="w-5 sm:w-6 h-5 sm:h-6 text-secondary" /> Nuestras Especialidades
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {activeTab === 'formacion' 
              ? 'Gestiona los programas de formación académica y sus brochures del catálogo' 
              : 'Gestiona las especialidades de derecho y el catálogo de cursos'}
          </p>
        </div>
        <button 
          onClick={openCreate} 
          className="flex items-center justify-center gap-2 bg-secondary text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:brightness-95 transition self-start sm:self-auto shadow-soft"
        >
          <Plus className="w-4 h-4" /> Nueva Especialidad
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('formacion')}
          className={`px-6 py-3 font-sans text-sm font-bold border-b-2 transition-all ${
            activeTab === 'formacion' 
              ? 'border-secondary text-secondary' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Programas de Formación ({specialties.filter(s => s.type === 'formacion').length})
        </button>
        <button
          onClick={() => setActiveTab('derecho')}
          className={`px-6 py-3 font-sans text-sm font-bold border-b-2 transition-all ${
            activeTab === 'derecho' 
              ? 'border-secondary text-secondary' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Especialidades de Derecho ({specialties.filter(s => s.type === 'derecho').length})
        </button>
      </div>

      <>
        {/* Filter and Search */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex gap-3 items-center shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && load()}
                placeholder="Buscar especialidad..." 
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-secondary" 
              />
            </div>
            <button onClick={load} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
              Buscar
            </button>
          </div>

          {/* Listing Content */}
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-secondary" /></div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              No hay especialidades de este tipo registradas en el sistema.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-soft">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4 pl-6 w-20">Orden</th>
                    <th className="p-4">Especialidad</th>
                    <th className="p-4 hidden md:table-cell">Descripción</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4 pr-6 text-right w-[240px]">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans text-slate-600 text-sm">
                  {filtered.map((spec, index) => (
                    <tr key={spec.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => moveOrder(index, 'up')} 
                            disabled={index === 0}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-primary disabled:opacity-30"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => moveOrder(index, 'down')} 
                            disabled={index === filtered.length - 1}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-primary disabled:opacity-30"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-xs text-slate-400 ml-1">#{index + 1}</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-primary">
                        <div className="flex items-center gap-3">
                          <SpecialtyImage src={spec.image_url} title={spec.title} />
                          <span>{spec.title}</span>
                        </div>
                      </td>
                      <td className="p-4 max-w-xs truncate hidden md:table-cell text-slate-500 text-xs">
                        {spec.description || 'Sin descripción'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          spec.type === 'formacion' ? 'bg-secondary/15 text-secondary' : 'bg-primary/10 text-primary'
                        }`}>
                          {spec.type === 'formacion' ? 'Formación' : 'Curso de Derecho'}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right space-x-1">
                        {spec.type === 'formacion' ? (
                          <>
                            <button 
                              onClick={() => openEdit(spec)} 
                              className="inline-flex items-center gap-1 text-slate-600 hover:text-primary font-bold text-xs py-1.5 px-2 rounded hover:bg-slate-100 transition"
                              title="Editar Información Básica"
                            >
                              <Settings className="w-3.5 h-3.5" /> Info
                            </button>
                            <button 
                              onClick={() => navigate(`/aula/admin/especialidades/${spec.id}/brochure`)} 
                              className="inline-flex items-center gap-1 bg-secondary/10 hover:bg-secondary/20 text-secondary font-extrabold text-xs py-1.5 px-2.5 rounded transition shadow-sm"
                              title="Construir/Editar Secciones del Brochure"
                            >
                              <Laptop className="w-3.5 h-3.5" /> Brochure
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={() => openEdit(spec)} 
                            className="inline-flex items-center gap-1 text-slate-600 hover:text-primary font-bold text-xs py-1.5 px-2.5 rounded hover:bg-slate-100 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Editar
                          </button>
                        )}
                        <button 
                          onClick={() => del(spec.id)} 
                          className="inline-flex items-center gap-1 text-red-400 hover:text-red-650 font-bold text-xs py-1.5 px-2.5 rounded hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Borrar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>

      {/* Simplified Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-16 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4 mb-10 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-150">
              <div>
                <h2 className="font-bold text-lg text-primary">
                  {editing ? `Editar Especialidad: ${editing.title}` : 'Nueva Especialidad'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">Configure los parámetros informativos básicos de la especialidad</p>
              </div>
              <button onClick={() => setShowModal(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto font-sans">
              {error && (
                <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100 flex items-center gap-2">
                  <XCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Título */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Título de la Especialidad *</label>
                <input 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="Ej: Derecho Penal, Formación de Peritos..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-secondary bg-white" 
                />
              </div>

              {/* Tipo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tipo de Especialidad</label>
                <select 
                  value={type} 
                  onChange={e => setType(e.target.value)} 
                  disabled={!!editing}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-secondary bg-white"
                >
                  <option value="derecho">Curso de Derecho (Alberga cursos vinculados)</option>
                  <option value="formacion">Programa de Formación (Tiene Brochure Personalizado)</option>
                </select>
                {editing && (
                  <p className="text-[10px] text-slate-450 italic mt-0.5">El tipo no puede cambiarse tras la creación por compatibilidad.</p>
                )}
              </div>

              {/* Descripción */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Descripción General</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  rows={2}
                  placeholder="Escribe una breve descripción de esta especialidad para la cabecera del catálogo..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-secondary bg-white resize-none" 
                />
              </div>

              {/* Portada / Imagen */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Imagen de Portada (Fondo Hero)</label>
                  <span className="text-[9px] text-emerald-600 font-extrabold uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded w-fit">
                    Recomendación: 1200 x 675 px (Relación 16:9)
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Opción 1: Subir Archivo</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setImageFile(file);
                          setImageUrl(URL.createObjectURL(file));
                        }
                      }}
                      className="text-xs font-sans text-slate-500 border border-slate-200 bg-white p-2.5 rounded-xl w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Opción 2: URL de Imagen</span>
                    <input 
                      value={imageUrl.startsWith('blob:') ? '' : imageUrl} 
                      onChange={e => {
                        setImageUrl(e.target.value);
                        setImageFile(null);
                      }}
                      placeholder="specialties/arbitros_cover.png o http://..."
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-secondary bg-white" 
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Vista Previa de Cobertura</span>
                  <SpecialtyPreviewImage src={imageUrl} title={title} />
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex gap-3 p-6 border-t border-slate-150 bg-slate-50">
              <button 
                onClick={() => setShowModal(false)} 
                className="flex-1 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-white bg-transparent transition"
              >
                Cancelar
              </button>
              <button 
                onClick={save} 
                disabled={saving || uploadingImage} 
                className="flex-1 py-2 bg-secondary hover:brightness-95 text-white rounded-lg text-xs font-black disabled:opacity-60 transition shadow-soft flex items-center justify-center gap-2"
              >
                {(saving || uploadingImage) ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Guardando…</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-white" />
                    <span>{editing ? 'Guardar Cambios' : 'Crear Especialidad'}</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
