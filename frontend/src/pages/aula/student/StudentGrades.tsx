import React from 'react';
import { useStudentData } from '@/hooks/useStudentData';
import { 
  Trophy, GraduationCap, ClipboardList, 
  CheckCircle2, XCircle, Loader, Search
} from 'lucide-react';

export default function StudentGrades() {
  const { data, isLoading, error } = useStudentData();

  if (isLoading) return <div className="flex justify-center py-12"><Loader className="animate-spin text-primary w-8 h-8" /></div>;
  if (error) return <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">Error al cargar tus notas.</div>;

  const exams = data?.questionnaire_attempts || [];
  
  // Agrupar por curso para calcular promedios (simplificado: tomamos la mejor nota por curso)
  const gradesByCourse = exams.reduce((acc: any, exam: any) => {
    const courseId = exam.course_id;
    if (!acc[courseId] || exam.score > acc[courseId].score) {
      acc[courseId] = exam;
    }
    return acc;
  }, {});

  const courseList = Object.values(gradesByCourse);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Boleta de Notas</h1>
        <p className="text-slate-500 font-medium">Consulta tus calificaciones y estado académico por curso.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-soft border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cursos Finalizados</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-black text-slate-800">{courseList.length}</p>
            <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-soft border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Promedio General</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-black text-slate-800">
              {courseList.length > 0 
                ? (Number(courseList.reduce((acc: number, c: any) => acc + Number(c.score || 0), 0)) / courseList.length).toFixed(1)
                : '--'
              }
            </p>
            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl">
              <Trophy className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-soft border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Exámenes Realizados</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-black text-slate-800">{exams.length}</p>
            <div className="p-3 bg-purple-50 text-purple-500 rounded-2xl">
              <ClipboardList className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Grades Table */}
      <div className="bg-white rounded-[2rem] shadow-soft border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Calificaciones Detalladas</h3>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar curso..." 
              className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Código</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asignatura</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Nota / Promedio</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {courseList.length > 0 ? (
                courseList.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black text-secondary bg-secondary/10 px-3 py-1 rounded-full uppercase tracking-widest">
                        {item.course?.code || 'CURSO'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800">{item.course?.title}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xl font-black ${item.score >= 14 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {item.score.toString().padStart(2, '0')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.score >= 14 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest">
                          <CheckCircle2 className="w-3 h-3" /> Aprobado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded-full text-[10px] font-black uppercase tracking-widest">
                          <XCircle className="w-3 h-3" /> Desaprobado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-primary hover:text-white transition-all">
                        <Search className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                    No tienes cursos con evaluaciones registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
