import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { ClipboardCheck, Plus, Lock, Unlock, Trash2, Loader, X } from 'lucide-react';

interface Course { id: number; title: string; }
interface Session { id: number; course_id: number; date: string; start_time: string; end_time: string; status: string; access_code?: string; }

export default function AdminAsistencia() {
  const [courses, setCourses]     = useState<Course[]>([]);
  const [sessions, setSessions]   = useState<Session[]>([]);
  const [courseId, setCourseId]   = useState<number | ''>('');
  const [loading, setLoading]     = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState({ date: '', start_time: '', end_time: '' });
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    apiClient.get('/api/v1/admin/courses').then(r => { const list = r.data.data ?? r.data; setCourses(list); if (list.length) setCourseId(list[0].id); }).catch(() => {});
  }, []);

  const load = async () => {
    if (!courseId) return;
    setLoading(true);
    try { const { data } = await apiClient.get('/api/v1/admin/attendance/sessions', { params: { course_id: courseId } }); setSessions(data); }
    catch { /* ignore */ } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [courseId]);

  const create = async () => {
    setError('');
    if (!form.date) { setError('La fecha es obligatoria.'); return; }
    if (!form.start_time) { setError('La hora de inicio es obligatoria.'); return; }
    if (!form.end_time) { setError('La hora de fin es obligatoria.'); return; }
    if (form.end_time <= form.start_time) { setError('La hora de fin debe ser posterior a la hora de inicio.'); return; }
    setSaving(true);
    try {
      await apiClient.post('/api/v1/admin/attendance/sessions', { ...form, course_id: courseId });
      setShowModal(false); setError(''); load();
    } catch (e: any) {
      const errors = e?.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        const list = Object.entries(errors).map(([, msgs]) => (msgs as string[])[0]).join(' ');
        setError(list);
      } else {
        setError(e?.response?.data?.message ?? 'Error al crear la sesión.');
      }
    } finally { setSaving(false); }
  };

  const toggle = async (s: Session) => {
    const action = s.status === 'open' ? 'close' : 'open';
    await apiClient.post(`/api/v1/admin/attendance/sessions/${s.id}/${action}`);
    load();
  };

  const del = async (id: number) => {
    if (!confirm('¿Borrar esta sesión?')) return;
    await apiClient.delete(`/api/v1/admin/attendance/sessions/${id}`);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2"><ClipboardCheck className="w-6 h-6" /> Asistencia</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Nueva Sesión
        </button>
      </div>

      {/* Selector de curso */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
        <label className="text-sm font-medium text-slate-600">Curso:</label>
        <select value={courseId} onChange={e => setCourseId(Number(e.target.value))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-secondary flex-1 max-w-xs">
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <button onClick={load} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200">Refrescar</button>
      </div>

      {/* Tabla de sesiones */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><Loader className="w-6 h-6 animate-spin text-secondary" /></div> : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b"><tr>{['Fecha','Horario','Ventana (Entrada/Salida)','Estado','Código','Acciones'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.map(s => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-800">{new Date(s.date.substring(0, 10) + 'T00:00:00').toLocaleDateString('es-PE',{day:'2-digit',month:'2-digit',year:'numeric'})}</td>
                  <td className="px-4 py-3 text-slate-600">{s.start_time} - {s.end_time}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{s.start_time} → {s.start_time}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${s.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {s.status === 'open' ? 'ABIERTA' : 'CERRADA'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-secondary font-mono">{s.access_code || 'Sin código'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggle(s)}
                        title={s.status === 'open' ? 'Cerrar sesión' : 'Abrir sesión (genera código)'}
                        className={`p-2 rounded-lg transition-colors ${s.status === 'open' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                      >
                        {s.status === 'open' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                      <button onClick={() => del(s.id)} title="Borrar" className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-slate-400">No hay sesiones para este curso</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal nueva sesión */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg text-primary">Nueva Sesión</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-100">{error}</div>}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Fecha</label>
                <input type="date" value={form.date} min={new Date().toISOString().split('T')[0]} onChange={e => setForm(p => ({...p, date: e.target.value}))} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-secondary" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Hora inicio</label>
                <input type="time" value={form.start_time} onChange={e => setForm(p => ({...p, start_time: e.target.value}))} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-secondary" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Hora fin</label>
                <input type="time" value={form.end_time} onChange={e => setForm(p => ({...p, end_time: e.target.value}))} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-secondary" />
                {form.start_time && form.end_time && form.end_time <= form.start_time && (
                  <p className="text-red-500 text-xs mt-1">La hora de fin debe ser posterior a la hora de inicio.</p>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-medium">Cancelar</button>
              <button onClick={create} disabled={saving} className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-bold disabled:opacity-60">
                {saving ? 'Guardando...' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
