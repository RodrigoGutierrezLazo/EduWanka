import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { 
  LayoutDashboard, BookOpen, Users, Award, 
  ChevronRight, TrendingUp, Calendar, Loader,
  AlertCircle, FileText
} from 'lucide-react';

export function ProfessorDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get('/api/v1/aula/professor-data');
        setData(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al conectar con el servidor');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader className="w-12 h-12 animate-spin text-secondary mb-4" />
        <p className="text-slate-500 font-medium">Sincronizando tus métricas docentes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 p-8 rounded-[2.5rem] flex flex-col items-center text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-xl font-bold text-red-800">Error de Conexión</h3>
        <p className="text-red-600 max-w-md mx-auto mt-2">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 px-8 py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Header */}
      <div className="relative bg-primary rounded-[3rem] p-10 md:p-14 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-black text-white uppercase tracking-[0.2em] mb-6">
            <LayoutDashboard className="w-3.5 h-3.5 text-secondary" />
            Panel Docente v2.0
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
            Hola, <span className="text-secondary">Prof. {data?.user?.name}</span>
          </h1>
          <p className="text-white/60 mt-4 text-lg font-medium max-w-xl">
            Bienvenido a tu centro de control académico. Gestiona tus cursos, alumnos y certificaciones desde un solo lugar.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<BookOpen className="w-6 h-6" />} 
          label="Cursos Asignados" 
          value={data?.stats?.total_courses || 0} 
          color="bg-blue-500" 
        />
        <StatCard 
          icon={<Users className="w-6 h-6" />} 
          label="Alumnos Totales" 
          value={data?.stats?.total_students || 0} 
          color="bg-secondary" 
        />
        <StatCard 
          icon={<FileText className="w-6 h-6" />} 
          label="Exámenes Creados" 
          value={data?.stats?.total_exams || 0} 
          color="bg-purple-500" 
        />
        <StatCard 
          icon={<Award className="w-6 h-6" />} 
          label="Certificados Emitidos" 
          value={data?.stats?.total_certificates || 0} 
          color="bg-green-500" 
        />
      </div>

      {/* Main Grid: Courses & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Active Courses */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <BookOpen className="w-7 h-7 text-secondary" />
              Tus Cursos Asignados
            </h2>
            <Link to="/aula/prof/cursos" className="text-sm font-bold text-secondary hover:underline">Ver todos →</Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data?.courses?.slice(0, 4).map((course: any) => (
              <div key={course.id} className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-soft p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                   <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary font-bold">
                     {course.code || 'C'}
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Matrícula</p>
                     <p className="text-sm font-bold text-slate-900">{course.enrolled_count || 0} Alumnos</p>
                   </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-6 group-hover:text-secondary transition-colors line-clamp-2 leading-tight">
                  {course.title}
                </h3>
                <div className="mt-auto">
                  <Link 
                    to={`/aula/prof/cursos/${course.id}`}
                    className="w-full py-4 bg-slate-50 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-slate-600 hover:bg-secondary hover:text-white transition-all group/btn"
                  >
                    Gestionar
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
            {(!data?.courses || data.courses.length === 0) && (
              <div className="col-span-2 bg-white rounded-[2.5rem] p-12 text-center border border-dashed border-slate-200">
                <p className="text-slate-400 font-medium">No tienes cursos asignados actualmente.</p>
              </div>
            )}
          </div>
        </div>

        {/* Shortcuts & Actions */}
        <div className="space-y-10">
           <div className="space-y-6">
             <h2 className="text-2xl font-black text-slate-900">Acciones Rápidas</h2>
             <div className="grid grid-cols-1 gap-4">
                <QuickAction 
                  icon={<Users className="w-5 h-5" />} 
                  label="Lista de Alumnos" 
                  to="/aula/prof/alumnos" 
                  color="text-blue-500"
                />
                <QuickAction 
                  icon={<Award className="w-5 h-5" />} 
                  label="Emitir Certificados" 
                  to="/aula/prof/certificados" 
                  color="text-green-500"
                />
                <QuickAction 
                  icon={<Calendar className="w-5 h-5" />} 
                  label="Gestionar Asistencia" 
                  to="/aula/prof/asistencia" 
                  color="text-orange-500"
                />
             </div>
           </div>

           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <TrendingUp className="w-10 h-10 text-secondary mb-4" />
                <h3 className="text-xl font-bold mb-2">Resumen Semanal</h3>
                <p className="text-white/40 text-sm mb-6">Tus cursos han tenido un incremento del 12% en actividad esta semana.</p>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-secondary w-2/3" />
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-soft hover:shadow-lg transition-all duration-300">
      <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-${color.split('-')[1]}-200`}>
        {icon}
      </div>
      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-3xl font-black text-slate-900">{value}</h3>
    </div>
  );
}

function QuickAction({ icon, label, to, color }: any) {
  return (
    <Link 
      to={to} 
      className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-soft hover:shadow-md hover:border-secondary/20 transition-all group"
    >
      <div className="flex items-center gap-4">
        <div className={`${color} group-hover:scale-110 transition-transform`}>{icon}</div>
        <span className="font-bold text-slate-700">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
    </Link>
  );
}
