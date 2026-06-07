import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Clock, Loader } from 'lucide-react';

interface Attempt { id: number; user?: { name: string; email: string }; course?: { title: string }; score: number; passed: boolean; created_at: string; }

export default function AdminIntentos() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/api/v1/admin/exam-attempts')
      .then(r => setAttempts(r.data.data ?? r.data))
      .catch(() => setAttempts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2"><Clock className="w-6 h-6" /> Intentos de Examen</h1>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><Loader className="w-6 h-6 animate-spin text-secondary" /></div> : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b"><tr>{['Estudiante','Curso','Nota','Resultado','Fecha'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {attempts.map(a => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3"><div className="font-medium">{a.user?.name ?? '-'}</div><div className="text-xs text-slate-400">{a.user?.email}</div></td>
                  <td className="px-4 py-3 text-slate-600">{a.course?.title ?? '-'}</td>
                  <td className="px-4 py-3 font-bold">{a.score ?? '-'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${a.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{a.passed ? 'APROBADO' : 'DESAPROBADO'}</span></td>
                  <td className="px-4 py-3 text-xs text-slate-400">{new Date(a.created_at).toLocaleDateString('es-PE')}</td>
                </tr>
              ))}
              {attempts.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-slate-400">Sin intentos registrados</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
