import React from 'react';
import { Link } from 'react-router-dom';
import { useSuperadminData } from '@/hooks/useSuperadminData';
import {
  Users, BookOpen, Award, Loader2,
  Wallet, Landmark, Receipt, ArrowUpRight,
  Activity, Clock, CreditCard, KeyRound,
  BarChart2, ClipboardCheck, FileText, GraduationCap,
  ChevronRight, FolderOpen, ShieldCheck, TrendingUp,
  CheckCircle, AlertCircle, XCircle, HelpCircle
} from 'lucide-react';

export function SuperadminDashboard() {
  const { data, isLoading, error } = useSuperadminData();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-12 h-12 text-secondary animate-spin" />
        <p className="text-slate-400 font-medium">Analizando métricas globales...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 bg-red-50 border border-red-100 rounded-2xl text-center">
        <Activity className="w-8 h-8 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-red-700">Error de Conexión</h3>
        <p className="text-red-500 mt-2 text-sm">{error.message}</p>
      </div>
    );
  }

  // Effective revenue = paid + validated
  const effectiveRevenue =
    (data?.purchases_by_status?.['paid'] || 0) +
    (data?.purchases_by_status?.['validated'] || 0);
  const effectivenessRatio =
    data?.summary.total_purchases
      ? Math.round((effectiveRevenue / data.summary.total_purchases) * 100)
      : 0;

  return (
    <div className="space-y-6 sm:space-y-8 pb-20">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest rounded-full border border-secondary/20">
              Consola Maestra
            </span>
            <span className="px-2.5 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
              Super Admin
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Balance <span className="text-accent italic">Financiero</span>
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Control total del ecosistema EduWanka — métricas en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm self-start">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Sistemas OK</span>
        </div>
      </div>

      {/* ── KPIs ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Ingresos Reales"
          value={`S/ ${(data?.summary.total_revenue || 0).toLocaleString()}`}
          icon={<Wallet className="w-5 h-5 text-green-600" />}
          bg="bg-green-50"
          note={`${effectivenessRatio}% efectividad`}
          notePositive={effectivenessRatio >= 50}
        />
        <KpiCard
          label="Balance Pendiente"
          value={`S/ ${(data?.summary.pending_revenue || 0).toLocaleString()}`}
          icon={<Clock className="w-5 h-5 text-orange-500" />}
          bg="bg-orange-50"
          note="Por validar o pagar"
        />
        <KpiCard
          label="Aulas Registradas"
          value={(data as any)?.summary.total_tenants || 0}
          icon={<Landmark className="w-5 h-5 text-indigo-600" />}
          bg="bg-indigo-50"
          note={`${(data as any)?.summary.active_tenants || 0} activas`}
        />
        <KpiCard
          label="Usuarios"
          value={data?.summary.total_users || 0}
          icon={<Users className="w-5 h-5 text-blue-600" />}
          bg="bg-blue-50"
          note={`${data?.summary.students || 0} estudiantes`}
        />
        <KpiCard
          label="Certificados"
          value={data?.summary.total_certificates || 0}
          icon={<Award className="w-5 h-5 text-purple-600" />}
          bg="bg-purple-50"
          note="Emitidos en el aula"
        />
      </div>
      {/* ── Financial Intelligence ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Distribución por Entidad */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Distribución por Entidad</h3>
              <p className="text-xs text-slate-400 font-medium">Ingresos validados por banco/método</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {data?.financials.by_entity.map((ent: any) => (
              <div key={ent.bank_entity} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-700">{ent.bank_entity || 'Otro'}</span>
                  <span className="font-black text-slate-900">S/ {ent.total.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                    style={{ width: `${(ent.total / (data.summary.total_revenue || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {(!data?.financials.by_entity || data.financials.by_entity.length === 0) && (
              <p className="text-center py-8 text-slate-400 text-sm italic">Sin datos de entidades aún</p>
            )}
          </div>
        </div>

        {/* Tendencia Mensual */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Tendencia de Ingresos</h3>
              <p className="text-xs text-slate-400 font-medium">Crecimiento mensual acumulado</p>
            </div>
          </div>

          <div className="flex items-end justify-between h-40 gap-2 px-2">
            {data?.financials.trend.map((t: any, i: number) => {
              const max = Math.max(...data.financials.trend.map((m: any) => m.total), 1);
              const height = (t.total / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="relative w-full flex items-end justify-center h-full">
                    <div 
                      className="w-full max-w-[32px] bg-slate-100 group-hover:bg-secondary/20 rounded-t-lg transition-all duration-500 relative"
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        S/ {t.total.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate w-full text-center">
                    {t.month}
                  </span>
                </div>
              );
            })}
            {(!data?.financials.trend || data.financials.trend.length === 0) && (
              <p className="w-full text-center py-16 text-slate-400 text-sm italic">Esperando más data mensual...</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Main grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Auditoría de Pagos ─────────── (2/3) */}
        <section className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-50 flex items-center gap-4">
            <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Auditoría de Pagos</h2>
              <p className="text-xs text-slate-400 font-medium">Últimas 15 transacciones con detalle completo</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead className="bg-slate-50/60">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Participante / Curso</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entidad</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.recent_purchases?.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 text-sm leading-snug">
                        {p.user?.name} {p.user?.last_name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 italic truncate max-w-[220px]">
                        {p.course?.title}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Landmark className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        <span className="text-xs font-bold text-slate-600 truncate">
                          {p.bank_entity || p.payment_method || 'Online'}
                        </span>
                      </div>
                      {p.operation_number && (
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">OP: {p.operation_number}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-base font-black text-slate-900 tracking-tight">
                        S/ {(p.amount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(!data?.recent_purchases || data.recent_purchases.length === 0) && (
            <div className="py-16 text-center">
              <Receipt className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-bold text-sm">No hay transacciones registradas</p>
            </div>
          )}
        </section>

        {/* ── Right column ──────────────── (1/3) */}
        <div className="space-y-6">

          {/* Acciones Rápidas */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-secondary" />
              Acciones Rápidas
            </h3>
            <div className="space-y-1.5">
              <QuickAction to="/aula/superadmin/aulas"    icon={<Landmark      className="w-4 h-4" />} label="Gestión de Aulas SaaS" color="text-indigo-600 bg-indigo-50" />
              <QuickAction to="/aula/superadmin/usuarios" icon={<Users       className="w-4 h-4" />} label="Gestionar Usuarios" color="text-blue-600 bg-blue-50" />
              <QuickAction to="/aula/superadmin/rendimiento" icon={<BarChart2 className="w-4 h-4" />} label="Ver Rendimiento" color="text-slate-700 bg-slate-100" />
              <QuickAction to="/aula/admin/pagos"       icon={<CreditCard    className="w-4 h-4" />} label="Validar Pagos (Demo)" color="text-green-600 bg-green-50" />
              <QuickAction to="/aula/admin/cursos"      icon={<BookOpen      className="w-4 h-4" />} label="Gestionar Cursos (Demo)" color="text-orange-600 bg-orange-50" />
              <QuickAction to="/aula/admin/reportes"   icon={<FileText       className="w-4 h-4" />} label="Reportes (Demo)" color="text-slate-700 bg-slate-100" />
            </div>
          </div>

          {/* Distribución de Usuarios */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-secondary" />
              Distribución de Usuarios
            </h3>
            <div className="space-y-3">
              <UserRoleRow
                label="Estudiantes"
                count={data?.summary.students || 0}
                total={data?.summary.total_users || 1}
                color="bg-blue-500"
              />
              <UserRoleRow
                label="Docentes"
                count={data?.summary.professors || 0}
                total={data?.summary.total_users || 1}
                color="bg-secondary"
              />
              <UserRoleRow
                label="Admins + Superadmins"
                count={
                  (data?.summary.total_users || 0) -
                  (data?.summary.students || 0) -
                  (data?.summary.professors || 0)
                }
                total={data?.summary.total_users || 1}
                color="bg-slate-700"
              />
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Total registrados</span>
              <span className="text-xl font-black text-slate-900">{data?.summary.total_users || 0}</span>
            </div>
          </div>

          {/* Estado de Transacciones */}
          <div className="bg-slate-900 rounded-2xl p-5 text-white">
            <h3 className="text-sm font-black mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-secondary" />
              Estado de Transacciones
            </h3>
            <div className="space-y-2">
              {Object.entries(data?.purchases_by_status || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <StatusDot status={status} />
                    <span className="text-xs font-medium text-white/60 capitalize">
                      {status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="text-sm font-black">{count as number}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                Efectividad
              </span>
              <span className={`text-xl font-black ${effectivenessRatio >= 50 ? 'text-secondary' : 'text-orange-400'}`}>
                {effectivenessRatio}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ────────────────────────────────────────────── */

function KpiCard({ label, value, icon, bg, note, notePositive }: {
  label: string; value: string | number; icon: React.ReactNode;
  bg: string; note?: string; notePositive?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{label}</p>
      {note && (
        <p className={`text-[10px] font-bold mt-2 ${notePositive === false ? 'text-orange-500' : notePositive ? 'text-green-600' : 'text-slate-400'}`}>
          {note}
        </p>
      )}
    </div>
  );
}

function QuickAction({ to, icon, label, color }: {
  to: string; icon: React.ReactNode; label: string; color: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
    >
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </span>
      <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors flex-1">
        {label}
      </span>
      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
    </Link>
  );
}

function UserRoleRow({ label, count, total, color }: {
  label: string; count: number; total: number; color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-black text-slate-900">{count} <span className="text-slate-300 font-normal">({pct}%)</span></span>
      </div>
      <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    paid: 'bg-green-500',
    validated: 'bg-emerald-400',
    pending_validation: 'bg-orange-400',
    pending_payment: 'bg-blue-400',
    rejected: 'bg-red-500',
  };
  return (
    <span className={`w-2 h-2 rounded-full shrink-0 ${colors[status] ?? 'bg-slate-400'}`} />
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid:               'bg-green-50 text-green-700 border-green-100',
    validated:          'bg-emerald-50 text-emerald-700 border-emerald-100',
    pending_validation: 'bg-orange-50 text-orange-700 border-orange-100',
    pending_payment:    'bg-blue-50 text-blue-700 border-blue-100',
    rejected:           'bg-red-50 text-red-700 border-red-100',
  };
  return (
    <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest border ${styles[status] ?? 'bg-slate-50 text-slate-400 border-slate-100'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
