import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { KeyRound, Loader, CheckCircle } from 'lucide-react';

interface PasswordRequest { id: number; user?: { name: string; email: string }; created_at: string; status: string; }

export default function AdminClaves() {
  const [requests, setRequests] = useState<PasswordRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [msg, setMsg]           = useState('');

  const load = () => {
    setLoading(true);
    apiClient.get('/api/v1/admin/password-requests').then(r => setRequests(r.data.data ?? r.data)).catch(() => setRequests([])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const resolve = async (req: PasswordRequest) => {
    if (!req.user?.email) return;
    try {
      const { data } = await apiClient.post(`/api/v1/admin/users/${encodeURIComponent(req.user.email)}/reset-by-email`);
      setMsg(`Nueva contraseña para ${req.user.name}: ${data.password}`);
      setTimeout(() => setMsg(''), 10000);
      // Marcar la solicitud como resuelta en backend
      await apiClient.post(`/api/v1/admin/password-requests/${req.id}/resolve`).catch(() => {});
      load();
    } catch { setMsg('Error al generar contraseña'); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2"><KeyRound className="w-6 h-6" /> Solicitudes de Contraseña</h1>
      {msg && <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm font-mono">{msg}</div>}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><Loader className="w-6 h-6 animate-spin text-secondary" /></div> : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b"><tr>{['Usuario','Email','Fecha','Acción'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{r.user?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{r.user?.email ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString('es-PE')}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => resolve(r)} className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-100">
                      <CheckCircle className="w-3.5 h-3.5" /> Generar nueva clave
                    </button>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-slate-400">Sin solicitudes pendientes</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
