import { useAdminData } from '@/hooks/useAdminData';
import { PaymentsTable } from '@/components/PaymentsTable';
import {
  CreditCard, Users, BookOpen, FileText, TrendingUp, Loader,
  GraduationCap, Award, CheckCircle, Clock, ShieldCheck,
  ArrowUpRight, BarChart2
} from 'lucide-react';
import React from 'react';

export function AdminDashboard() {
  const { data, isLoading, error } = useAdminData();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader className="w-10 h-10 animate-spin text-secondary" />
        <p className="text-slate-400 font-medium">Cargando panel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center">
        <p className="text-red-800 font-bold">Error: {(error as Error).message}</p>
      </div>
    );
  }

  const revenue = data?.revenue || 0;
  const totalEnrollments = (data?.validated_purchases || 0) + (data?.paid_purchases || 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary">Panel de Administración</h1>
          <p className="text-slate-500 mt-1 text-sm">Valida pagos, gestiona inscripciones y usuarios.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-100 shadow-sm self-start">
          <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sistema Activo</span>
        </div>
      </div>

      {/* Hero KPIs - gradient cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <GradientCard
          label="Pagos Pendientes"
          value={data?.pending_payments_count || 0}
          icon={<Clock className="w-6 h-6" />}
          gradient="from-amber-500 to-orange-600"
          iconBg="bg-white/20"
        />
        <GradientCard
          label="Total Usuarios"
          value={data?.total_users || 0}
          icon={<Users className="w-6 h-6" />}
          gradient="from-blue-500 to-indigo-600"
          iconBg="bg-white/20"
        />
        <GradientCard
          label="Cursos"
          value={data?.total_courses || 0}
          icon={<BookOpen className="w-6 h-6" />}
          gradient="from-violet-500 to-purple-600"
          iconBg="bg-white/20"
        />
        <GradientCard
          label="Ingresos Totales"
          value={`S/ ${Number(revenue).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
          icon={<TrendingUp className="w-6 h-6" />}
          gradient="from-emerald-500 to-green-600"
          iconBg="bg-white/20"
        />
      </div>

      {/* Secondary stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <InfoCard
          label="Admins"
          value={data?.total_admins || 0}
          icon={<ShieldCheck className="w-5 h-5 text-orange-500" />}
          bg="bg-orange-50"
          border="border-orange-100"
        />
        <InfoCard
          label="Docentes"
          value={data?.total_teachers || 0}
          icon={<GraduationCap className="w-5 h-5 text-purple-500" />}
          bg="bg-purple-50"
          border="border-purple-100"
        />
        <InfoCard
          label="Estudiantes"
          value={data?.total_students || 0}
          icon={<Users className="w-5 h-5 text-sky-500" />}
          bg="bg-sky-50"
          border="border-sky-100"
        />
        <InfoCard
          label="Certificados"
          value={data?.pending_certificates || 0}
          icon={<Award className="w-5 h-5 text-rose-500" />}
          bg="bg-rose-50"
          border="border-rose-100"
        />
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-2xl text-white">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Cursos Activos</p>
            <BookOpen className="w-4 h-4 text-secondary" />
          </div>
          <p className="text-3xl font-black">{data?.published_courses ?? data?.total_courses}</p>
          <p className="text-[10px] text-white/40 mt-1">de {data?.total_courses} creados</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-5 rounded-2xl border border-green-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-green-600 uppercase tracking-widest">Compras Validadas</p>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-3xl font-black text-green-700">{data?.validated_purchases}</p>
          <p className="text-[10px] text-green-500 mt-1">{totalEnrollments} matrículas efectivas</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Compras Pagadas</p>
            <CreditCard className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-black text-blue-700">{data?.paid_purchases}</p>
          <p className="text-[10px] text-blue-500 mt-1">confirmadas por el sistema</p>
        </div>
      </div>

      {/* Latest Users */}
      {data?.latest_users?.length ? (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="font-bold text-slate-800">Últimos usuarios registrados</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/60">
                <tr>
                  {['Nombre', 'Email', 'Rol'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.latest_users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {(user.name || '?')[0]}
                        </div>
                        <span className="font-bold text-slate-800">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-slate-500">{user.email}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest border ${
                        user.role === 'admin' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                        user.role === 'prof' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                        user.role === 'superadmin' ? 'bg-slate-800 text-white border-slate-700' :
                        'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* Pending Payments */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Validar Pagos Pendientes</h2>
        </div>
        {data?.pending_payments && (
          <PaymentsTable purchases={data.pending_payments} />
        )}
      </section>
    </div>
  );
}

/* ─── Sub-components ─── */

function GradientCard({ label, value, icon, gradient, iconBg }: {
  label: string; value: number | string; icon: React.ReactNode; gradient: string; iconBg: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} p-4 sm:p-5 rounded-2xl text-white shadow-lg relative overflow-hidden group`}>
      <div className="absolute -right-3 -top-3 w-20 h-20 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
      <div className="relative z-10">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
          {icon}
        </div>
        <p className="text-2xl sm:text-3xl font-black tracking-tight truncate">{value}</p>
        <p className="text-[10px] sm:text-xs font-bold text-white/70 uppercase tracking-widest mt-1">{label}</p>
      </div>
    </div>
  );
}

function InfoCard({ label, value, icon, bg, border }: {
  label: string; value: number | string; icon: React.ReactNode; bg: string; border: string;
}) {
  return (
    <div className={`${bg} ${border} border p-4 sm:p-5 rounded-2xl flex items-center justify-between gap-3`}>
      <div className="min-w-0">
        <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{value}</p>
        <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{label}</p>
      </div>
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
        {icon}
      </div>
    </div>
  );
}
