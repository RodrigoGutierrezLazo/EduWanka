import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../../../lib/apiClient';
import {
  Award, CheckCircle, XCircle, Loader,
  Search, Download, Mail, Trash2,
  ShieldCheck, AlertTriangle, Filter
} from 'lucide-react';

interface IssuedCert {
  id: number;
  user?: { id: number; name: string; last_name?: string; email: string; dni?: string };
  certificate_code: string;
  dni: string;
  student_name: string;
  grade: string;
  score: number;
  status: string;
  is_revoked: boolean;
  revoked_at: string | null;
  revoked_reason: string | null;
  file_path: string | null;
  file_url: string | null;
  created_at: string;
}

interface PendingItem {
  id: number;
  user_id: number;
  score: number;
  user: { id: number; name: string; last_name?: string; email: string; dni?: string };
  payment_status?: string;
  exam_status?: string;
  is_certified?: boolean;
  exam_score?: number;
}

interface CourseOption {
  id: number;
  title: string;
  code?: string;
}

export default function ProfessorCertificates() {
  const { courseId } = useParams();
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourse, setSelectedCourse] = useState(courseId || '');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'issued' | 'pending'>('issued');

  // Issued certificates
  const [issuedCerts, setIssuedCerts] = useState<IssuedCert[]>([]);
  // Pending for emission
  const [pendingData, setPendingData] = useState<PendingItem[]>([]);
  const [pendingStats, setPendingStats] = useState<any>(null);

  const [emitting, setEmitting] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingEmail, setSendingEmail] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesRes = await apiClient.get('/api/v1/prof/courses');
        const courseList = coursesRes.data.data || [];
        setCourses(courseList);
        const cId = selectedCourse || courseList[0]?.id;
        if (cId) {
          setSelectedCourse(cId.toString());
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadData(selectedCourse);
    }
  }, [selectedCourse, tab]);

  const loadData = async (cId: string) => {
    setLoading(true);
    try {
      if (tab === 'issued') {
        const res = await apiClient.get(`/api/v1/prof/courses/${cId}/certificates/issued`);
        setIssuedCerts(res.data.data || []);
      } else {
        const res = await apiClient.get(`/api/v1/prof/courses/${cId}/certificates/pending`);
        setPendingData(res.data.data || []);
        setPendingStats(res.data.stats || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (newId: string) => {
    setSelectedCourse(newId);
  };

  const emitCertificate = async (studentId: number) => {
    if (!window.confirm('¿Confirmas que deseas emitir este certificado?')) return;
    setEmitting(studentId);
    try {
      await apiClient.post(`/api/v1/prof/courses/${selectedCourse}/certificates/issue/${studentId}`, {});
      loadData(selectedCourse);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al emitir certificado');
    } finally {
      setEmitting(null);
    }
  };

  const deleteCertificate = async (certId: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este certificado? Esta acción no se puede deshacer.')) return;
    setDeleting(certId);
    try {
      await apiClient.delete(`/api/v1/prof/courses/${selectedCourse}/certificates/${certId}`);
      loadData(selectedCourse);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar certificado');
    } finally {
      setDeleting(null);
    }
  };

  const resendEmail = async (certId: number) => {
    setSendingEmail(certId);
    try {
      // TODO: implement backend endpoint for email resend
      alert('Funcionalidad de reenvío de correo próximamente disponible.');
    } finally {
      setSendingEmail(null);
    }
  };

  const filteredIssued = issuedCerts.filter(c =>
    (c.student_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.certificate_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.dni || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPending = pendingData.filter(item =>
    (item.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-5 sm:w-6 h-5 sm:h-6 text-secondary" />
            Certificados del Curso
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Gestiona los certificados emitidos y emite nuevos para alumnos aprobados.</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar alumno, código, DNI..."
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none min-w-[200px]"
            value={selectedCourse}
            onChange={(e) => handleCourseChange(e.target.value)}
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 pb-0">
          <button
            onClick={() => setTab('issued')}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
              tab === 'issued'
                ? 'border-secondary text-secondary'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Emitidos ({issuedCerts.length})
          </button>
          <button
            onClick={() => setTab('pending')}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
              tab === 'pending'
                ? 'border-secondary text-secondary'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Pendientes
          </button>
        </div>
      </div>

      {/* Stats bar for pending tab */}
      {tab === 'pending' && pendingStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Matriculados', value: pendingStats.enrolled, color: 'bg-blue-50 text-blue-700' },
            { label: 'Aprobados', value: pendingStats.passed, color: 'bg-green-50 text-green-700' },
            { label: 'Certificados', value: pendingStats.certified, color: 'bg-purple-50 text-purple-700' },
            { label: 'Pendientes', value: pendingStats.pending, color: 'bg-orange-50 text-orange-700' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-xl px-4 py-3 text-center`}>
              <p className="text-2xl font-extrabold">{s.value ?? 0}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader className="w-7 h-7 animate-spin text-secondary" />
            </div>
          ) : tab === 'issued' ? (
            /* Issued certificates table */
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Alumno</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">DNI</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Código</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Nota</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                  <th className="px-4 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredIssued.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <Award className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-400 font-medium text-sm">No hay certificados emitidos en este curso.</p>
                    </td>
                  </tr>
                ) : filteredIssued.map(cert => (
                  <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {(cert.student_name || '?')[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{cert.student_name}</p>
                          <p className="text-[10px] text-slate-400">{cert.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{cert.dni || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-secondary font-bold">{cert.certificate_code}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-700">{cert.grade || cert.score}</td>
                    <td className="px-4 py-3">
                      {cert.is_revoked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase">
                          <XCircle className="w-3 h-3" /> Revocado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase">
                          <ShieldCheck className="w-3 h-3" /> Activo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {cert.created_at ? new Date(cert.created_at).toLocaleDateString('es-PE') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {cert.file_url && (
                          <a
                            href={cert.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 text-slate-400 hover:text-secondary transition-colors rounded-lg hover:bg-slate-50"
                            title="Descargar PDF"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => resendEmail(cert.id)}
                          disabled={sendingEmail === cert.id}
                          className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-slate-50"
                          title="Reenviar correo"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCertificate(cert.id)}
                          disabled={deleting === cert.id}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-slate-50"
                          title="Eliminar certificado"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            /* Pending certificates table */
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Alumno</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">DNI</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Nota</th>
                  <th className="px-4 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPending.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-16 text-center">
                      <CheckCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-400 font-medium text-sm">No hay alumnos pendientes de certificación.</p>
                    </td>
                  </tr>
                ) : filteredPending.map(item => (
                  <tr key={item.user?.id || item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {(item.user?.name || '?')[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{item.user?.name}</p>
                          <p className="text-[10px] text-slate-400">{item.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{item.user?.dni || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase">
                        <CheckCircle className="w-3 h-3" /> {item.score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => emitCertificate(item.user?.id || item.user_id)}
                        disabled={emitting === (item.user?.id || item.user_id)}
                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all bg-secondary text-white hover:bg-secondary/90 shadow-sm disabled:opacity-50"
                      >
                        {emitting === (item.user?.id || item.user_id) ? 'Emitiendo...' : 'Emitir Certificado'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
