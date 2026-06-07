import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Calendar, Loader, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface AttendanceSession {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  attended: boolean;
}

interface CourseAttendance {
  course_id: number;
  course_title: string;
  course_code: string;
  course_image: string | null;
  total_sessions: number;
  attended_sessions: number;
  percentage: number;
  sessions: AttendanceSession[];
}

const fmtDate = (d: string) => {
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return d; }
};

const fmtTime = (t: string | null) => t?.substring(0, 5) ?? '';

export default function StudentAttendance() {
  const [data, setData] = useState<CourseAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get('/api/v1/aula/my-attendance');
        setData(res.data.data ?? []);
      } catch (e: any) {
        setError(e?.response?.data?.message ?? 'Error al cargar la asistencia');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleExpand = (courseId: number) => {
    setExpandedCourse(prev => prev === courseId ? null : courseId);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader className="animate-spin text-secondary w-10 h-10 mb-4" />
        <p className="text-slate-500 font-medium">Cargando asistencia...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Mi Asistencia</h1>
        <p className="text-slate-500 font-medium mt-1">Registro de asistencia a sesiones de clase por curso.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-2xl border border-red-100">{error}</div>
      )}

      {data.length === 0 ? (
        <div className="bg-white rounded-[2rem] shadow-soft border border-slate-100 p-12 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">No hay registros de asistencia</h2>
          <p className="text-slate-500 font-medium leading-relaxed max-w-md mx-auto">
            Aún no se han creado sesiones de asistencia en tus cursos. Tu docente registrará la asistencia próximamente.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {data.map(course => {
            const isExpanded = expandedCourse === course.course_id;
            const pctColor = course.percentage >= 80 ? 'text-green-600 bg-green-50'
              : course.percentage >= 50 ? 'text-amber-600 bg-amber-50'
              : 'text-red-600 bg-red-50';
            const barColor = course.percentage >= 80 ? 'bg-green-500'
              : course.percentage >= 50 ? 'bg-amber-500'
              : 'bg-red-500';

            return (
              <div key={course.course_id} className="bg-white rounded-[2rem] border border-slate-100 shadow-soft overflow-hidden transition-all duration-300">
                {/* Course Header */}
                <button
                  onClick={() => toggleExpand(course.course_id)}
                  className="w-full flex items-center gap-5 p-6 text-left hover:bg-slate-50/50 transition-colors"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-7 h-7 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-lg leading-tight truncate">{course.course_title}</h3>
                    {course.course_code && (
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{course.course_code}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-slate-400 font-bold uppercase">Asistencia</p>
                      <p className="text-sm font-bold text-slate-700">
                        {course.attended_sessions} / {course.total_sessions} sesiones
                      </p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-xl text-sm font-black ${pctColor}`}>
                      {course.percentage}%
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Progress bar */}
                <div className="px-6 pb-2">
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${course.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Sessions Detail */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="border-t border-slate-100 pt-4">
                      {course.sessions.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">Sin sesiones registradas.</p>
                      ) : (
                        <div className="space-y-2">
                          {course.sessions.map(session => (
                            <div
                              key={session.id}
                              className={`flex items-center gap-4 p-4 rounded-2xl transition-colors ${
                                session.attended
                                  ? 'bg-green-50/70 border border-green-100'
                                  : 'bg-slate-50/70 border border-slate-100'
                              }`}
                            >
                              {session.attended ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                              ) : (
                                <XCircle className="w-5 h-5 text-slate-300 flex-shrink-0" />
                              )}

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 capitalize">
                                  {fmtDate(session.date)}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  {fmtTime(session.start_time)} – {fmtTime(session.end_time)}
                                </div>
                              </div>

                              <span className={`text-xs font-bold px-3 py-1 rounded-lg ${
                                session.attended
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-slate-100 text-slate-500'
                              }`}>
                                {session.attended ? 'Presente' : 'Ausente'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
