import React from 'react';
import { useSystemMetrics } from '@/hooks/useSystemMetrics';
import {
  Award, FileText, TrendingUp, BookOpen, Loader2, Activity,
  Users, CheckCircle, XCircle, BarChart2, ArrowRight, Zap,
  Shield, Clock, Globe
} from 'lucide-react';

export default function SuperadminRendimiento() {
  const { data, isLoading, error } = useSystemMetrics();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-12 h-12 text-secondary animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">Calculando métricas del sistema...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 bg-red-50 border border-red-100 rounded-[2rem] text-center">
        <Activity className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-red-700">Error al cargar métricas</h3>
        <p className="text-red-500 mt-2 text-sm">{(error as any)?.message}</p>
      </div>
    );
  }

  const certs = data!.certificates;
  const exams = data!.exams;
  const platform = data!.platform;

  const maxCertCount = Math.max(...certs.by_course.map(c => c.count), 1);
  const maxEnrollment = Math.max(...platform.top_courses.map(c => c.enrollments), 1);
  const maxTrend = Math.max(
    ...certs.monthly_trend.map(t => t.count),
    ...platform.users_trend.map(t => t.count),
    1
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
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
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Rendimiento <span className="text-accent italic">del Sistema</span>
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Métricas de evolución, certificaciones académicas y desempeño global de la plataforma.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm self-start">
          <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse shadow-[0_0_8px_rgba(255,193,7,0.5)]" />
          <span className="text-xs font-black text-slate-700 uppercase tracking-widest">En Tiempo Real</span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <MetricCard
          label="Certificados Emitidos"
          value={certs.total}
          icon={<Award className="w-6 h-6 text-purple-600" />}
          color="bg-purple-50"
          subtext="Total acumulado"
        />
        <MetricCard
          label="Intentos de Examen"
          value={exams.total_attempts}
          icon={<FileText className="w-6 h-6 text-blue-600" />}
          color="bg-blue-50"
          subtext={`${exams.passed} aprobados`}
        />
        <MetricCard
          label="Tasa de Aprobación"
          value={`${exams.pass_rate}%`}
          icon={<TrendingUp className="w-6 h-6 text-green-600" />}
          color="bg-green-50"
          subtext={`Prom. puntaje: ${exams.avg_score ?? '—'}`}
        />
        <MetricCard
          label="Cursos Publicados"
          value={`${platform.published_courses} / ${platform.total_courses}`}
          icon={<BookOpen className="w-6 h-6 text-orange-600" />}
          color="bg-orange-50"
          subtext={`${platform.total_enrollments} matrículas validadas`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Left column: 2/3 width */}
        <div className="xl:col-span-2 space-y-10">

          {/* Certificados por Curso */}
          <section className="bg-white rounded-[3rem] border border-slate-100 shadow-soft overflow-hidden">
            <SectionHeader
              icon={<Award className="w-7 h-7" />}
              title="Certificados por Curso"
              subtitle="Distribución de certificados emitidos y nota promedio"
            />
            <div className="p-8 space-y-5">
              {certs.by_course.length === 0 ? (
                <EmptyState icon={<Award className="w-12 h-12" />} text="No hay certificados generados aún" />
              ) : certs.by_course.map((row, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-700 truncate max-w-[60%]">{row.course_title}</span>
                    <div className="flex items-center gap-4 shrink-0">
                      {row.avg_score !== null && (
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Prom: {row.avg_score}
                        </span>
                      )}
                      <span className="font-black text-slate-900 text-base">{row.count}</span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                      style={{ width: `${(row.count / maxCertCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Desempeño de Exámenes */}
          <section className="bg-white rounded-[3rem] border border-slate-100 shadow-soft overflow-hidden">
            <SectionHeader
              icon={<FileText className="w-7 h-7" />}
              title="Desempeño por Exámenes"
              subtitle="Intentos, aprobados y tasa por curso"
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[640px]">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Curso</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Intentos</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Aprobados</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tasa</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Prom.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {exams.by_course.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-slate-400 font-bold">
                        No hay intentos de examen registrados
                      </td>
                    </tr>
                  ) : exams.by_course.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <span className="font-bold text-slate-800 text-sm">{row.course_title}</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="font-black text-slate-900">{row.total_attempts}</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="font-black text-green-600">{row.passed}</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <PassRateBadge rate={row.pass_rate} />
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="text-sm font-bold text-slate-600">
                          {row.avg_score !== null ? `${row.avg_score}` : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </div>

        {/* Right column: 1/3 width */}
        <div className="space-y-10">

          {/* Top Cursos por Matrícula */}
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-soft">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-4">
              <div className="p-2 bg-secondary/10 rounded-xl">
                <BarChart2 className="w-5 h-5 text-secondary" />
              </div>
              Top Cursos
            </h3>
            {platform.top_courses.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">Sin datos</p>
            ) : (
              <div className="space-y-5">
                {platform.top_courses.map((course, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700 truncate">{course.title}</p>
                      <div className="h-1.5 bg-slate-50 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-secondary rounded-full transition-all duration-1000"
                          style={{ width: `${(course.enrollments / maxEnrollment) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-black text-slate-900 shrink-0">{course.enrollments}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tendencia Mensual — Certificados vs Usuarios */}
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-soft">
            <h3 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-4 text-secondary">
              <div className="p-2 bg-secondary/10 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              Tendencia Mensual
            </h3>
            <div className="flex items-center gap-6 mb-6 mt-2">
              <span className="flex items-center gap-1.5 text-[10px] font-black text-purple-500 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                Certificados
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                Usuarios
              </span>
            </div>
            <TrendChart
              certTrend={certs.monthly_trend}
              usersTrend={platform.users_trend}
              max={maxTrend}
            />
          </div>

          {/* Estado de Certificados */}
          <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl shadow-slate-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full -mr-20 -mt-20 blur-3xl transition-all group-hover:scale-150 duration-700" />
            <h3 className="text-xl font-bold mb-8 flex items-center gap-4 relative z-10">
              <Award className="w-5 h-5 text-secondary" />
              Estado de Certs.
            </h3>
            <div className="grid grid-cols-2 gap-4 relative z-10">
              {Object.entries(certs.by_status).length === 0 ? (
                <p className="col-span-2 text-white/40 text-sm text-center py-2">Sin datos</p>
              ) : Object.entries(certs.by_status).map(([status, count]) => (
                <div key={status} className="bg-white/5 p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">{status}</p>
                  <p className="text-3xl font-black tracking-tighter">{count as number}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Evolución vs Sistema Legado */}
      <section className="bg-white rounded-[3rem] border border-slate-100 shadow-soft overflow-hidden">
        <SectionHeader
          icon={<Zap className="w-7 h-7" />}
          title="Evolución vs Sistema Legado"
          subtitle="Comparativa de capacidades: plataforma EduWanka digital vs proceso manual anterior"
        />
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <EvolutionCard
            icon={<Award className="w-6 h-6 text-purple-600" />}
            color="bg-purple-50"
            title="Certificados Digitales"
            legacy="Limitado al papel, proceso manual de días"
            current="Emisión automática, descarga inmediata en PDF"
          />
          <EvolutionCard
            icon={<Shield className="w-6 h-6 text-blue-600" />}
            color="bg-blue-50"
            title="Control de Acceso"
            legacy="Sin distinción de roles ni permisos granulares"
            current="4 roles con ámbitos definidos: Estudiante, Docente, Admin, Superadmin"
          />
          <EvolutionCard
            icon={<Globe className="w-6 h-6 text-green-600" />}
            color="bg-green-50"
            title="Auditoría Financiera"
            legacy="Registro manual en hojas de cálculo"
            current="Trazabilidad en tiempo real por banco, modalidad y estado"
          />
          <EvolutionCard
            icon={<Clock className="w-6 h-6 text-orange-600" />}
            color="bg-orange-50"
            title="Tiempo de Emisión"
            legacy="Días o semanas con proceso burocrático"
            current="Minutos tras validación de pago y aprobación del examen"
          />
        </div>
        <div className="mx-8 mb-8 p-6 bg-slate-900 text-white rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Resumen de Impacto</p>
            <p className="font-bold text-lg">
              <span className="text-secondary">{certs.total}</span> certificados digitales emitidos ·{' '}
              <span className="text-secondary">{platform.total_enrollments}</span> matrículas gestionadas ·{' '}
              <span className="text-secondary">{exams.pass_rate}%</span> de tasa de aprobación global
            </p>
          </div>
          <div className="flex items-center gap-2 text-secondary shrink-0 font-black text-sm uppercase tracking-widest">
            <Zap className="w-4 h-4" />
            Sistema Operativo
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────── */

function MetricCard({ label, value, icon, color, subtext }: {
  label: string; value: string | number; icon: React.ReactNode;
  color: string; subtext?: string;
}) {
  return (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-soft hover:shadow-xl transition-all group overflow-hidden relative">
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${color} opacity-20 group-hover:scale-150 transition-transform duration-700`} />
      <div className="relative z-10">
        <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-white`}>
          {icon}
        </div>
        <p className="text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] mt-2">{label}</p>
        {subtext && (
          <span className="mt-5 inline-block text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="p-8 md:p-10 border-b border-slate-50 flex items-center gap-5 bg-slate-50/20">
      <div className="w-14 h-14 bg-white rounded-2xl shadow-md border border-slate-100 flex items-center justify-center text-secondary">
        {icon}
      </div>
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
        <p className="text-sm text-slate-400 font-medium">{subtitle}</p>
      </div>
    </div>
  );
}

function PassRateBadge({ rate }: { rate: number }) {
  const style =
    rate >= 70 ? 'bg-green-50 text-green-700 border-green-100' :
    rate >= 50 ? 'bg-orange-50 text-orange-700 border-orange-100' :
                 'bg-red-50 text-red-700 border-red-100';
  return (
    <span className={`px-3 py-1 text-[10px] font-black rounded-xl uppercase tracking-widest border ${style}`}>
      {rate}%
    </span>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="py-12 text-center">
      <div className="text-slate-200 mx-auto mb-4 opacity-50 flex justify-center">{icon}</div>
      <p className="text-slate-400 font-bold">{text}</p>
    </div>
  );
}

function TrendChart({
  certTrend,
  usersTrend,
  max,
}: {
  certTrend: { month: string; count: number }[];
  usersTrend: { month: string; count: number }[];
  max: number;
}) {
  const allMonths = Array.from(
    new Set([...certTrend.map(t => t.month), ...usersTrend.map(t => t.month)])
  ).sort().slice(-8);

  const certMap = Object.fromEntries(certTrend.map(t => [t.month, t.count]));
  const userMap = Object.fromEntries(usersTrend.map(t => [t.month, t.count]));

  if (allMonths.length === 0) {
    return <p className="text-slate-400 text-sm text-center py-4">Sin datos de tendencia</p>;
  }

  return (
    <div className="flex items-end justify-between h-32 gap-2 mt-4 px-1">
      {allMonths.map((month) => {
        const cCount = certMap[month] ?? 0;
        const uCount = userMap[month] ?? 0;
        return (
          <div key={month} className="flex-1 flex flex-col items-center gap-1 h-full group">
            <div className="w-full flex items-end gap-0.5 h-full">
              <div
                className="flex-1 bg-purple-200 group-hover:bg-purple-500 rounded-t-lg transition-all duration-500"
                style={{ height: `${(cCount / max) * 100}%` }}
                title={`Certificados: ${cCount}`}
              />
              <div
                className="flex-1 bg-blue-200 group-hover:bg-blue-400 rounded-t-lg transition-all duration-500"
                style={{ height: `${(uCount / max) * 100}%` }}
                title={`Usuarios: ${uCount}`}
              />
            </div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
              {month.split('-')[1]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function EvolutionCard({
  icon, color, title, legacy, current
}: {
  icon: React.ReactNode; color: string; title: string; legacy: string; current: string;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-100 overflow-hidden">
      <div className={`p-5 ${color} flex items-center gap-3`}>
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
          {icon}
        </div>
        <p className="text-sm font-black text-slate-800">{title}</p>
      </div>
      <div className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500 font-medium leading-relaxed">{legacy}</p>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-700 font-bold leading-relaxed">{current}</p>
        </div>
      </div>
    </div>
  );
}
