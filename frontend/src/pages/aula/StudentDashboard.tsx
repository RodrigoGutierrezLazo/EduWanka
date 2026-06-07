import { useStudentData } from '@/hooks/useStudentData';
import { 
  BookOpen, GraduationCap, CheckCircle, FileText, 
  Loader, ArrowRight, PlayCircle, Trophy, Clock,
  Wallet, AlertCircle, ClipboardCheck, Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function StudentDashboard() {
  const { data, isLoading, error } = useStudentData();

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Loader className="animate-spin text-secondary w-12 h-12" />
      <p className="text-slate-400 font-black animate-pulse uppercase tracking-widest text-[10px]">Sincronizando aula virtual...</p>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 text-red-600 p-10 rounded-[3rem] border border-red-100 flex flex-col items-center gap-4 text-center">
      <AlertCircle className="w-12 h-12 text-red-400" />
      <div>
        <h3 className="font-black text-xl tracking-tight">Error de conexión</h3>
        <p className="text-sm font-medium mt-1">No pudimos cargar tu ecosistema de aprendizaje.</p>
      </div>
      <button onClick={() => window.location.reload()} className="mt-4 px-8 py-3 bg-red-600 text-white font-bold rounded-2xl">Reintentar</button>
    </div>
  );

  const validatedPurchases = data?.purchases?.filter((p: any) => p.status === 'validated' || p.status === 'paid') ?? [];
  const certificates = data?.certificates ?? [];
  const attendance = data?.attendance ?? [];

  return (
    <div className="space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Section Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-slate-900 p-10 md:p-14 rounded-[4rem] relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
        
        <div className="flex items-center gap-8 relative z-10">
          <div className="w-24 h-24 bg-gradient-to-br from-secondary to-orange-500 rounded-[2rem] flex items-center justify-center text-primary text-4xl font-black shadow-2xl rotate-3">
            {data?.user?.name?.[0]}
          </div>
          <div>
            <span className="text-secondary text-[10px] font-black uppercase tracking-[0.3em] mb-2 block">Bienvenido de vuelta</span>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">¡Hola, {data?.user?.name}!</h1>
            <p className="text-white/40 font-medium mt-2 text-lg">Es un excelente día para potenciar tus habilidades.</p>
          </div>
        </div>
        <div className="relative z-10">
          <Link to="/aula/cursos" className="bg-secondary text-white px-10 py-5 rounded-[2rem] font-black hover:scale-105 transition-all flex items-center gap-3 shadow-xl shadow-secondary/20 group">
            IR A MIS CURSOS <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Stats Grid con Estilo Premium */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          label="Cursos Activos" 
          value={validatedPurchases.length} 
          icon={<BookOpen className="w-7 h-7 text-blue-500" />}
          subtext="Acceso completo"
          color="bg-blue-50"
        />
        <StatCard 
          label="Certificados" 
          value={certificates.length} 
          icon={<Trophy className="w-7 h-7 text-secondary" />}
          subtext="Logros alcanzados"
          color="bg-orange-50"
        />
        <StatCard 
          label="Certificados" 
          value={certificates.length} 
          icon={<CheckCircle className="w-7 h-7 text-emerald-500" />}
          subtext="Obtenidos"
          color="bg-emerald-50"
        />
        <StatCard 
          label="Inversión" 
          value={`S/ ${(data?.stats?.total_spent || 0).toLocaleString()}`} 
          icon={<Wallet className="w-7 h-7 text-slate-600" />}
          subtext="Total educación"
          color="bg-slate-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-12">
          {/* Panel: Mis Cursos */}
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <PlayCircle className="w-6 h-6" />
                </div>
                Mis Cursos
              </h2>
              <Link to="/aula/explorar-cursos" className="text-secondary font-black text-xs uppercase tracking-widest hover:underline">Explorar mas cursos</Link>
            </div>

            {validatedPurchases.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {validatedPurchases.slice(0, 4).map((p: any) => (
                  <div key={p.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-soft hover:shadow-xl transition-all group flex flex-col">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                        {p.course?.image_url ? (
                          <img 
                            src={p.course.image_url.startsWith('http') ? p.course.image_url : `/storage/${p.course.image_url}`} 
                            alt={p.course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <BookOpen className="w-7 h-7 text-primary" />
                        )}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-secondary bg-secondary/10 px-4 py-1.5 rounded-full">
                        {p.course?.level || 'General'}
                      </span>
                    </div>
                    <h3 className="font-black text-xl text-slate-900 line-clamp-2 leading-tight group-hover:text-secondary transition-colors">{p.course?.title}</h3>
                    <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-50">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Estado</span>
                        <span className="text-xs font-bold text-slate-600">En progreso</span>
                      </div>
                      <Link 
                        to={`/aula/cursos/${p.course?.id}`} 
                        className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-secondary transition-all shadow-lg"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3.5rem] p-20 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <BookOpen className="w-10 h-10 text-slate-200" />
                </div>
                <p className="text-slate-400 font-bold text-xl">Aún no tienes cursos activos.</p>
                <p className="text-slate-400 mt-2 max-w-sm">Explora nuestra oferta académica y comienza a transformar tu carrera profesional.</p>
                <Link to="/aula/explorar-cursos" className="mt-8 px-10 py-4 bg-primary text-white font-black rounded-2xl hover:shadow-2xl transition-all uppercase tracking-widest text-xs">
                  Explorar Cursos
                </Link>
              </div>
            )}
          </section>

          {/* Panel: Mis Finanzas (Diferenciador Solicitado) */}
          <section className="bg-white rounded-[3.5rem] border border-slate-100 shadow-soft p-10 md:p-14 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full -mr-32 -mt-32 blur-3xl transition-all group-hover:scale-110" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                  <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
                    <Wallet className="w-6 h-6" />
                  </div>
                  Mis Finanzas
                </h2>
                <p className="text-slate-500 font-medium max-w-md">Resumen de tus inversiones y pagos pendientes en la plataforma.</p>
              </div>
              <div className="flex gap-4">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-center min-w-[140px]">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Invertido</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">S/ {(data?.stats?.total_spent || 0).toLocaleString()}</p>
                </div>
                <div className={`p-6 rounded-[2rem] border text-center min-w-[140px] ${data?.stats?.pending_payments > 0 ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'}`}>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pendientes</p>
                  <p className={`text-2xl font-black tracking-tight ${data?.stats?.pending_payments > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {data?.stats?.pending_payments || 0}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-12 overflow-x-auto relative z-10">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Curso</th>
                    <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                    <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data?.purchases?.slice(0, 3).map((p: any) => (
                    <tr key={p.id} className="group">
                      <td className="py-6 pr-4">
                        <p className="font-bold text-slate-800 text-sm">{p.course?.title}</p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">{new Date(p.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="py-6 px-4 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          p.status === 'validated' || p.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                        }`}>
                          {p.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-6 pl-4 text-right">
                        <span className="font-black text-slate-900 text-lg tracking-tighter">S/ {p.amount}</span>
                      </td>
                    </tr>
                  ))}
                  {(!data?.purchases || data.purchases.length === 0) && (
                    <tr>
                      <td colSpan={3} className="py-12 text-center italic text-slate-400 text-sm">No hay registros de pagos</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Link to="/aula/pagos" className="block mt-10 text-center py-4 bg-slate-50 rounded-2xl text-xs font-black text-slate-600 hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest">
              Gestionar todos mis pagos
            </Link>
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-12">
          {/* Panel: Boleta de Notas */}
          <section className="bg-white rounded-[3rem] border border-slate-100 shadow-soft p-10 space-y-8">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-4">
              <div className="p-2.5 bg-emerald-50 rounded-2xl text-emerald-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              Certificados
            </h2>
            
            <div className="space-y-6">
              {certificates.length > 0 ? (
                certificates.slice(0, 3).map((cert: any) => (
                  <div key={cert.id} className="flex items-center justify-between group">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800 line-clamp-1">{cert.course?.title || cert.course_code}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(cert.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg bg-emerald-50 text-emerald-600">
                      <Trophy className="w-5 h-5" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest italic">Aún no tienes certificados</p>
                </div>
              )}
            </div>
            <Link to="/aula/certificados" className="block w-full py-4 text-center bg-slate-50 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors">
              Ver todos mis certificados
            </Link>
          </section>

          {/* Panel: Asistencias */}
          <section className="bg-white rounded-[3rem] border border-slate-100 shadow-soft p-10 space-y-8">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-4 text-blue-600">
              <div className="p-2.5 bg-blue-50 rounded-2xl text-blue-600">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              Asistencias
            </h2>
            
            <div className="space-y-6">
              {attendance.length > 0 ? (
                attendance.map((record: any) => (
                  <div key={record.id} className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{record.session?.course?.title}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(record.session?.date).toLocaleDateString()}</p>
                    </div>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">
                      PRESENTE
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center space-y-4">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                    <ClipboardCheck className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest italic text-center">Sin registros de asistencia</p>
                </div>
              )}
            </div>
          </section>

          {/* Banner Certificados */}
          <div className="bg-gradient-to-br from-secondary to-orange-500 rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform duration-1000" />
            <Trophy className="w-12 h-12 mb-6 text-primary group-hover:rotate-12 transition-transform" />
            <h3 className="text-2xl font-black leading-tight tracking-tight">Certificaciones <br />Profesionales</h3>
            <p className="text-white/60 mt-4 text-sm font-medium">Valida tus conocimientos y potencia tu perfil profesional con certificados con respaldo institucional.</p>
            <Link to="/aula/certificados" className="inline-block mt-10 text-[10px] font-black uppercase tracking-[0.2em] bg-white text-primary px-10 py-4 rounded-2xl hover:shadow-2xl transition-all">
              VER MIS LOGROS
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, subtext, color }: any) {
  return (
    <div className="bg-white p-8 rounded-[3rem] shadow-soft border border-slate-100 group hover:border-secondary/20 transition-all hover:shadow-xl relative overflow-hidden">
      <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full ${color} opacity-30 group-hover:scale-150 transition-transform duration-700`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className={`p-4 rounded-2xl ${color} shadow-sm border border-white group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl">{subtext}</span>
        </div>
        <div>
          <p className="text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] mt-2">{label}</p>
        </div>
      </div>
    </div>
  );
}
