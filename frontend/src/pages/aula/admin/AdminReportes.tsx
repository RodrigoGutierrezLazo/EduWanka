import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import {
  BarChart2, Loader, Download, Landmark, TrendingUp,
  Receipt, ShieldCheck, CreditCard, FileText, Eye,
  Users, PieChart, Calendar
} from 'lucide-react';

interface EntityData { entity: string; total: number; count: number; percentage: number; }
interface MonthlyData { month: string; total: number; count: number; }
interface CourseData { title: string; total: number; count: number; }
interface PaymentMethod { method: string; total: number; count: number; }
interface ValidatedPayment {
  id: number; user_name: string; course_title: string; amount: number;
  bank_entity: string; operation_number: string; receipt_url: string | null;
  status: string; validated_at: string;
  authorized_by: { id: number; name: string; email: string } | null;
}
interface Report {
  total_revenue: number; paid_count: number; pending_count: number;
  validated_count: number; rejected_count: number;
  by_course: CourseData[]; by_entity: EntityData[];
  monthly_trend: MonthlyData[]; recent_validated: ValidatedPayment[];
  payment_methods: PaymentMethod[];
}

const ENTITY_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-orange-500', 'bg-pink-500',
];

export default function AdminReportes() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'audit' | 'entities'>('overview');

  useEffect(() => {
    apiClient.get('/api/v1/admin/reports/summary')
      .then(r => setReport(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => `S/ ${Number(n ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;

  const exportExcel = () => {
    if (!report) return;
    const sheets: string[] = [];

    // Sheet 1: Summary
    sheets.push('=== RESUMEN FINANCIERO ===');
    sheets.push(`Ingresos Totales,${report.total_revenue}`);
    sheets.push(`Pagos Confirmados,${report.paid_count}`);
    sheets.push(`Validados,${report.validated_count}`);
    sheets.push(`Pendientes,${report.pending_count}`);
    sheets.push(`Rechazados,${report.rejected_count}`);
    sheets.push('');

    // Sheet 2: By course
    sheets.push('=== INGRESOS POR CURSO ===');
    sheets.push('Curso,Ingresos,Matriculas');
    (report.by_course ?? []).forEach(c => sheets.push(`"${c.title}",${c.total},${c.count}`));
    sheets.push('');

    // Sheet 3: By entity
    sheets.push('=== INGRESOS POR ENTIDAD ===');
    sheets.push('Entidad,Ingresos,Transacciones,Porcentaje');
    (report.by_entity ?? []).forEach(e => sheets.push(`"${e.entity}",${e.total},${e.count},${e.percentage}%`));
    sheets.push('');

    // Sheet 4: Monthly trend
    sheets.push('=== TENDENCIA MENSUAL ===');
    sheets.push('Mes,Ingresos,Transacciones');
    (report.monthly_trend ?? []).forEach(m => sheets.push(`${m.month},${m.total},${m.count}`));
    sheets.push('');

    // Sheet 5: Audit trail
    sheets.push('=== AUDITORIA DE PAGOS VALIDADOS ===');
    sheets.push('ID,Alumno,Curso,Monto,Entidad,Operacion,Estado,Fecha,Autorizado Por');
    (report.recent_validated ?? []).forEach(p =>
      sheets.push(`${p.id},"${p.user_name}","${p.course_title}",${p.amount},"${p.bank_entity}","${p.operation_number}",${p.status},${p.validated_at},"${p.authorized_by?.name || 'Sistema'}"`)
    );

    const csv = sheets.join('\n');
    const bom = '﻿';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([bom + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `reporte_financiero_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest rounded-full border border-secondary/20">
              Análisis
            </span>
            <span className="px-2.5 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full">
              Financiero
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-primary flex items-center gap-2">
            <BarChart2 className="w-5 sm:w-6 h-5 sm:h-6" /> Reportes Financieros
          </h1>
        </div>
        <button
          onClick={exportExcel}
          disabled={!report}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> Exportar para Auditoría
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {([
          { key: 'overview', label: 'Resumen', icon: <PieChart className="w-3.5 h-3.5" /> },
          { key: 'entities', label: 'Por Entidad', icon: <Landmark className="w-3.5 h-3.5" /> },
          { key: 'audit', label: 'Auditoría', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
              tab === t.key
                ? 'border-secondary text-secondary'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader className="w-8 h-8 animate-spin text-secondary" />
        </div>
      ) : !report ? (
        <p className="text-slate-400 text-center py-10">No se pudo cargar el reporte.</p>
      ) : (
        <>
          {/* ═══ OVERVIEW TAB ═══ */}
          {tab === 'overview' && (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label: 'Ingresos Totales', value: fmt(report.total_revenue), gradient: 'from-emerald-500 to-green-600', icon: <TrendingUp className="w-5 h-5" /> },
                  { label: 'Pagos Confirmados', value: report.paid_count + report.validated_count, gradient: 'from-blue-500 to-indigo-600', icon: <CreditCard className="w-5 h-5" /> },
                  { label: 'Pendientes', value: report.pending_count, gradient: 'from-amber-500 to-orange-600', icon: <Receipt className="w-5 h-5" /> },
                  { label: 'Rechazados', value: report.rejected_count, gradient: 'from-rose-500 to-red-600', icon: <FileText className="w-5 h-5" /> },
                ].map(k => (
                  <div key={k.label} className={`bg-gradient-to-br ${k.gradient} rounded-2xl p-4 sm:p-5 text-white shadow-lg relative overflow-hidden`}>
                    <div className="absolute -right-2 -top-2 w-16 h-16 bg-white/10 rounded-full" />
                    <div className="relative z-10">
                      <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center mb-3">{k.icon}</div>
                      <p className="text-2xl sm:text-3xl font-black">{k.value}</p>
                      <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">{k.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Entity Pie Chart */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">Distribución por Entidad</h3>
                      <p className="text-xs text-slate-400">Ingresos confirmados por banco</p>
                    </div>
                  </div>

                  {(report.by_entity?.length ?? 0) === 0 ? (
                    <p className="text-center py-10 text-slate-400 text-sm italic">Sin datos de entidades</p>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      {/* Donut chart */}
                      <div className="relative w-40 h-40 shrink-0">
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                          {report.by_entity.reduce((acc, ent, i) => {
                            const offset = acc.offset;
                            const dash = ent.percentage;
                            acc.elements.push(
                              <circle
                                key={ent.entity}
                                cx="18" cy="18" r="14"
                                fill="none"
                                stroke={['#3b82f6','#10b981','#8b5cf6','#f59e0b','#f43f5e','#06b6d4','#f97316','#ec4899'][i % 8]}
                                strokeWidth="4"
                                strokeDasharray={`${dash} ${100 - dash}`}
                                strokeDashoffset={`${-offset}`}
                                className="transition-all duration-700"
                              />
                            );
                            acc.offset += dash;
                            return acc;
                          }, { elements: [] as React.ReactNode[], offset: 0 }).elements}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <p className="text-lg font-black text-slate-900">{report.by_entity.length}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Entidades</p>
                        </div>
                      </div>
                      {/* Legend */}
                      <div className="flex-1 space-y-2 w-full">
                        {report.by_entity.map((ent, i) => (
                          <div key={ent.entity} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full shrink-0 ${ENTITY_COLORS[i % ENTITY_COLORS.length]}`} />
                              <span className="text-sm font-bold text-slate-700 truncate">{ent.entity || 'Otro'}</span>
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              <span className="text-sm font-black text-slate-900">{fmt(ent.total)}</span>
                              <span className="text-[10px] text-slate-400 ml-1">({ent.percentage}%)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Monthly Trend */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">Tendencia Mensual</h3>
                      <p className="text-xs text-slate-400">Ingresos por mes (últimos 12 meses)</p>
                    </div>
                  </div>

                  {(report.monthly_trend?.length ?? 0) === 0 ? (
                    <p className="text-center py-10 text-slate-400 text-sm italic">Sin datos mensuales</p>
                  ) : (
                    <div className="flex items-end justify-between h-48 gap-1.5 px-1">
                      {report.monthly_trend.map((m, i) => {
                        const max = Math.max(...report.monthly_trend.map(t => t.total), 1);
                        const h = Math.max(4, (m.total / max) * 100);
                        const monthLabel = m.month.split('-')[1] || m.month;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group h-full">
                            <div className="relative w-full flex items-end justify-center h-full">
                              <div
                                className="w-full max-w-[28px] bg-emerald-100 group-hover:bg-emerald-500 rounded-t-lg transition-all duration-500 relative cursor-pointer"
                                style={{ height: `${h}%` }}
                              >
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                  {fmt(m.total)} ({m.count})
                                </div>
                              </div>
                            </div>
                            <span className="text-[9px] font-black text-slate-400 uppercase">
                              {monthLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* By Course Table */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
                  <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center text-secondary">
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-800">Ingresos por Curso</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50/60">
                      <tr>
                        <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Curso</th>
                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingresos</th>
                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Matrículas</th>
                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">% del Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(report.by_course ?? []).map((c, i) => {
                        const pct = report.total_revenue > 0 ? Math.round((c.total / report.total_revenue) * 100) : 0;
                        return (
                          <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-3 font-bold text-slate-800">{c.title}</td>
                            <td className="px-4 py-3 text-green-700 font-black">{fmt(c.total)}</td>
                            <td className="px-4 py-3 text-slate-600 font-bold">{c.count}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[80px]">
                                  <div className="h-full bg-secondary rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-xs font-bold text-slate-500">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {!(report.by_course?.length) && (
                        <tr><td colSpan={4} className="text-center py-10 text-slate-400">Sin datos</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══ ENTITIES TAB ═══ */}
          {tab === 'entities' && (
            <div className="space-y-6">
              {/* Entity breakdown bars */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
                  <Landmark className="w-5 h-5 text-blue-600" />
                  Desglose por Entidad Bancaria
                </h3>
                {(report.by_entity?.length ?? 0) === 0 ? (
                  <p className="text-center py-10 text-slate-400 italic">Sin datos</p>
                ) : (
                  <div className="space-y-5">
                    {report.by_entity.map((ent, i) => (
                      <div key={ent.entity} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`w-4 h-4 rounded ${ENTITY_COLORS[i % ENTITY_COLORS.length]}`} />
                            <span className="font-bold text-slate-700">{ent.entity || 'Otro'}</span>
                            <span className="text-xs text-slate-400">({ent.count} transacciones)</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-black text-slate-900">{fmt(ent.total)}</span>
                            <span className="px-2 py-0.5 text-[10px] font-black bg-slate-100 text-slate-600 rounded-full">{ent.percentage}%</span>
                          </div>
                        </div>
                        <div className="h-3 bg-slate-50 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${ENTITY_COLORS[i % ENTITY_COLORS.length]}`}
                            style={{ width: `${ent.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Methods */}
              {(report.payment_methods?.length ?? 0) > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-violet-600" />
                    Métodos de Pago
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {report.payment_methods.map((pm, i) => (
                      <div key={pm.method} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{pm.method || 'Online'}</p>
                        <p className="text-xl font-black text-slate-900">{fmt(pm.total)}</p>
                        <p className="text-xs text-slate-500 mt-1">{pm.count} transacciones</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ AUDIT TAB ═══ */}
          {tab === 'audit' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Auditoría de Pagos Validados</h3>
                    <p className="text-xs text-slate-400">Detalle de quién autorizó cada pago con comprobante</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[900px]">
                    <thead className="bg-slate-50/60">
                      <tr>
                        {['Alumno / Curso', 'Monto', 'Entidad', 'Operación', 'Comprobante', 'Autorizado por', 'Fecha'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(report.recent_validated ?? []).map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-800 text-sm">{p.user_name}</p>
                            <p className="text-[10px] text-slate-400 italic truncate max-w-[180px]">{p.course_title}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-base font-black text-slate-900">{fmt(p.amount)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <Landmark className="w-3 h-3 text-slate-300" />
                              <span className="text-xs font-bold text-slate-600">{p.bank_entity || '-'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.operation_number || '-'}</td>
                          <td className="px-4 py-3">
                            {p.receipt_url ? (
                              <a
                                href={p.receipt_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-bold text-secondary hover:underline"
                              >
                                <Eye className="w-3.5 h-3.5" /> Ver
                              </a>
                            ) : (
                              <span className="text-xs text-slate-300">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {p.authorized_by ? (
                              <div>
                                <p className="text-xs font-bold text-slate-700">{p.authorized_by.name}</p>
                                <p className="text-[10px] text-slate-400">{p.authorized_by.email}</p>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Sistema</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">
                            {p.validated_at ? new Date(p.validated_at).toLocaleDateString('es-PE') : '-'}
                          </td>
                        </tr>
                      ))}
                      {!(report.recent_validated?.length) && (
                        <tr><td colSpan={7} className="text-center py-10 text-slate-400">Sin pagos validados</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
