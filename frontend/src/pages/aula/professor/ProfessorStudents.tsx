import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../../../lib/apiClient';
import { logger } from '../../../lib/logger';
import { 
  Users, Search, Loader, 
  ChevronRight, Calendar, Star, FileVideo
} from 'lucide-react';

export default function ProfessorStudents() {
  const { courseId } = useParams();
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState(courseId || '');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [totalVideos, setTotalVideos] = useState(0);
  const [viewMode, setViewMode] = useState<'cards' | 'attendance'>('cards');
  const [newSessionData, setNewSessionData] = useState({ date: '', start_time: '', end_time: '' });
  const [creatingSession, setCreatingSession] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const coursesRes = await apiClient.get('/api/v1/prof/courses');
        setCourses(coursesRes.data.data);
        const cId = selectedCourse || coursesRes.data.data[0]?.id;
        if (cId) {
          setSelectedCourse(cId.toString());
          const studentsRes = await apiClient.get(`/api/v1/prof/courses/${cId}/attendance`);
          setStudents(studentsRes.data.students || []);
          setSessions(studentsRes.data.sessions || []);
          setTotalVideos(studentsRes.data.total_videos || 0);
        }
      } catch (err: any) {
        logger.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId]);

  const handleCourseChange = async (newId: string) => {
    setSelectedCourse(newId);
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/v1/prof/courses/${newId}/attendance`);
      setStudents(response.data.students || []);
      setSessions(response.data.sessions || []);
      setTotalVideos(response.data.total_videos || 0);
    } catch (err) {
      logger.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSession = async () => {
    if (!newSessionData.date || !newSessionData.start_time || !newSessionData.end_time) return;
    setCreatingSession(true);
    try {
      await apiClient.post(`/api/v1/prof/courses/${selectedCourse}/attendance/sessions`, newSessionData);
      setNewSessionData({ date: '', start_time: '', end_time: '' });
      // Refresh
      const response = await apiClient.get(`/api/v1/prof/courses/${selectedCourse}/attendance`);
      setStudents(response.data.students || []);
      setSessions(response.data.sessions || []);
    } catch (err) {
      logger.error(err);
    } finally {
      setCreatingSession(false);
    }
  };

  const handleToggleAttendance = async (studentId: number, sessionId: number, attended: boolean) => {
    try {
      // Optimistic update
      setStudents(students.map(s => {
        if (s.user_id === studentId) {
          const newRecords = { ...s.records, [sessionId]: attended };
          const newAttendedCount = Object.values(newRecords).filter(Boolean).length;
          return {
            ...s,
            records: newRecords,
            attended_sessions: newAttendedCount,
          };
        }
        return s;
      }));
      await apiClient.post(`/api/v1/prof/courses/${selectedCourse}/attendance/sessions/${sessionId}/record`, {
        user_id: studentId,
        attended
      });
    } catch (err) {
      logger.error(err);
      // Revert on error
      const response = await apiClient.get(`/api/v1/prof/courses/${selectedCourse}/attendance`);
      setStudents(response.data.students || []);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Seguimiento de Alumnos</h1>
          <p className="text-slate-500 mt-2">Monitorea el progreso, asistencia y calificaciones de tus estudiantes.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o correo..."
              className="pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 shadow-soft w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button 
              onClick={() => setViewMode('cards')}
              className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${viewMode === 'cards' ? 'bg-white shadow-sm text-secondary' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Tarjetas
            </button>
            <button 
              onClick={() => setViewMode('attendance')}
              className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${viewMode === 'attendance' ? 'bg-white shadow-sm text-secondary' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Asistencia
            </button>
          </div>
          <select 
            className="px-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none shadow-soft min-w-[200px]"
            value={selectedCourse}
            onChange={(e) => handleCourseChange(e.target.value)}
          >
            <option value="" disabled>Seleccionar curso...</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-soft">
          <Loader className="w-10 h-10 animate-spin text-secondary mb-4" />
          <p className="text-slate-500 font-medium">Cargando lista de alumnos...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-16 text-center border border-slate-100 shadow-soft">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-slate-200" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No se encontraron alumnos</h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            {searchTerm ? 'Prueba con otros términos de búsqueda.' : 'No hay alumnos matriculados en este curso todavía.'}
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <div key={student.user_id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary font-black text-xl">
                    {student.name?.[0] || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{student.name}</h3>
                    <p className="text-xs text-slate-400 font-medium truncate">{student.email}</p>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-bold">
                       Activo
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-center">
                       <Calendar className="w-4 h-4 text-slate-400 mb-1" />
                       <span className="text-[10px] font-bold text-slate-400 uppercase">Clases en Vivo</span>
                       <span className="text-xs font-bold text-slate-900">{student.attended_sessions} / {sessions.length}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-center">
                       <Star className="w-4 h-4 text-slate-400 mb-1" />
                       <span className="text-[10px] font-bold text-slate-400 uppercase">Videos Vistos</span>
                       <span className="text-xs font-bold text-slate-900">{student.videos_watched} / {totalVideos}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button className="w-full py-4 bg-primary text-white rounded-2xl text-xs font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                    Ver Expediente Completo
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden">
          <div className="mb-6 flex flex-col sm:flex-row items-end gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Fecha</label>
                <input type="date" className="w-full p-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-secondary" value={newSessionData.date} onChange={e => setNewSessionData({...newSessionData, date: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Hora Inicio</label>
                <input type="time" className="w-full p-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-secondary" value={newSessionData.start_time} onChange={e => setNewSessionData({...newSessionData, start_time: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Hora Fin</label>
                <input type="time" className="w-full p-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-secondary" value={newSessionData.end_time} onChange={e => setNewSessionData({...newSessionData, end_time: e.target.value})} />
              </div>
            </div>
            <button 
              onClick={handleCreateSession}
              disabled={creatingSession}
              className="px-6 py-2 bg-secondary text-white rounded-xl font-bold text-sm h-[42px] shrink-0"
            >
              + Crear Sesión
            </button>
          </div>

          <div className="overflow-x-auto aula-sidebar-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="p-4 font-bold text-slate-400">Alumno</th>
                  {sessions.map(sess => (
                    <th key={sess.id} className="p-4 font-bold text-slate-400 text-center">
                      <div className="text-xs">{new Date(sess.date.substring(0, 10) + 'T00:00:00').toLocaleDateString('es-PE')}</div>
                      <div className="text-[10px] font-medium">{sess.start_time?.substring(0,5)}</div>
                    </th>
                  ))}
                  <th className="p-4 font-bold text-slate-400 text-center">% Live</th>
                  <th className="p-4 font-bold text-slate-400 text-center">Asíncrono</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStudents.map(student => (
                  <tr key={student.user_id} className="hover:bg-slate-50/50">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{student.name} {student.last_name}</div>
                      <div className="text-xs text-slate-400">{student.email}</div>
                    </td>
                    {sessions.map(sess => (
                      <td key={sess.id} className="p-4 text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 accent-secondary rounded"
                          checked={!!student.records?.[sess.id]}
                          onChange={(e) => handleToggleAttendance(student.user_id, sess.id, e.target.checked)}
                        />
                      </td>
                    ))}
                    <td className="p-4 text-center font-bold text-slate-700">
                       {sessions.length > 0 ? Math.round((student.attended_sessions / sessions.length) * 100) : 0}%
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">
                        <FileVideo className="w-3 h-3" />
                        {student.videos_watched}/{totalVideos}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
