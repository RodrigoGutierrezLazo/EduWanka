import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import {
  BookOpen, Plus, Search, Edit2, Trash2, Users, Loader, ImageOff,
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

const resolveImg = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('/storage')) return url;
  return `/storage/${url.replace(/^\/+/, '')}`;
};

const isPublished = (value: any): boolean => value === true || value === 1 || value === '1' || value === 'true';

export default function AdminCursos() {
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pubOnly, setPubOnly] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (search.trim()) params.search = search.trim();
      if (pubOnly) params.published = 1;
      const { data } = await apiClient.get('/api/v1/admin/courses', { params });
      setCourses(data.data ?? data);
    } catch (err) {
      toast.error('No se pudieron cargar los cursos.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { const t = setTimeout(() => load(), 200); return () => clearTimeout(t); }, [pubOnly]);

  const del = async (id: number) => {
    if (!confirm('¿Borrar este curso y sus datos?')) return;
    try {
      await apiClient.delete(`/api/v1/admin/courses/${id}`);
      toast.success('Curso eliminado.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['public-courses'] }),
        queryClient.invalidateQueries({ queryKey: ['public-course'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-courses'] }),
      ]);
      load();
    } catch (err) {
      toast.error('No se pudo eliminar el curso.');
    }
  };

  const filtered = courses.filter(c => {
    const q = search.toLowerCase();
    return (!q || c.title.toLowerCase().includes(q) || (c.code ?? '').toLowerCase().includes(q))
        && (!pubOnly || isPublished(c.is_published));
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-primary flex items-center gap-2">
            <BookOpen className="w-5 sm:w-6 h-5 sm:h-6 text-secondary" /> Administrar Cursos
          </h1>
          <p className="text-slate-500 text-sm mt-1">{courses.length} cursos en total</p>
        </div>
        <button 
          onClick={() => nav('/aula/admin/cursos/nuevo')} 
          className="flex items-center justify-center gap-2 bg-secondary text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:brightness-95 transition self-start sm:self-auto shadow-soft"
        >
          <Plus className="w-4 h-4" /> Nuevo curso
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex gap-3 flex-wrap items-center shadow-sm">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && load()}
            placeholder="Buscar por título, código o especialidad…" 
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-secondary" 
          />
        </div>
        <button onClick={load} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">Buscar</button>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none font-bold">
          <input type="checkbox" checked={pubOnly} onChange={e => setPubOnly(e.target.checked)} className="accent-secondary" />
          Solo publicados
        </label>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader className="w-7 h-7 animate-spin text-secondary" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filtered.map(c => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow shadow-soft flex flex-col justify-between h-full">
              <div>
                <div className="h-36 bg-slate-100 relative overflow-hidden">
                  {resolveImg(c.image_url) ? (
                    <img src={resolveImg(c.image_url)!} alt={c.title} className="w-full h-full object-cover animate-fadeIn" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-350 bg-slate-50"><ImageOff className="w-10 h-10" /></div>
                  )}
                  <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase shadow-sm ${isPublished(c.is_published) ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'}`}>
                    {isPublished(c.is_published) ? 'Publicado' : 'Borrador'}
                  </span>
                  {c.type && c.type !== 'Curso' && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-primary text-secondary shadow-sm">{c.type}</span>
                  )}
                </div>
                <div className="p-4 space-y-1">
                  <h3 className="font-extrabold text-slate-800 text-sm leading-snug tracking-tight hover:text-primary transition-colors">{c.title}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{c.code && `${c.code} · `}{c.level}{c.hours ? ` · ${c.hours}h` : ''}</p>
                  {c.specialty && (
                    <span className="inline-block text-[9px] font-black uppercase bg-secondary/15 text-secondary px-2 py-0.5 rounded mt-1">
                      {c.specialty}
                    </span>
                  )}
                  {c.teacher_name && <p className="text-xs text-slate-500 font-medium pt-1.5">{c.teacher_name}</p>}
                </div>
              </div>
              
              <div className="p-4 pt-0 space-y-3">
                <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase">Inversión</span>
                  <p className="text-sm font-extrabold text-primary">S/ {Number(c.price).toFixed(2)}</p>
                </div>
                
                <div className="flex gap-2 text-xs font-semibold justify-between border-t border-slate-50 pt-2.5">
                  <button onClick={() => nav(`/aula/admin/cursos/${c.id}/participantes`)} className="flex items-center gap-1 text-slate-500 hover:text-primary transition-colors py-1 px-2 hover:bg-slate-50 rounded" title="Alumnos inscritos">
                    <Users className="w-3.5 h-3.5" /> <span className="font-bold">{c.participants_count ?? 0}</span>
                  </button>
                  <button onClick={() => nav(`/aula/admin/cursos/${c.id}/editar`)} className="flex items-center gap-1 text-slate-500 hover:text-secondary transition-colors py-1 px-2 hover:bg-slate-50 rounded">
                    <Edit2 className="w-3.5 h-3.5" /> <span className="font-bold">Editar</span>
                  </button>
                  <button onClick={() => del(c.id)} className="flex items-center gap-1 text-red-400 hover:text-red-655 transition-colors py-1 px-2 hover:bg-red-50 rounded">
                    <Trash2 className="w-3.5 h-3.5" /> <span className="font-bold">Borrar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="col-span-full text-center py-16 text-slate-400 italic bg-white rounded-xl border border-slate-200 shadow-sm">No hay cursos creados que coincidan con la búsqueda</div>}
        </div>
      )}
    </div>
  );
}
