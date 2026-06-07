import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';
import ListEditor from '../../../components/ListEditor';
import {
  Target, ArrowLeft, Save, Loader2, XCircle, Laptop,
  FileText, Layers, BookOpen, GraduationCap, DollarSign,
  ListPlus, XCircle as XCircleIcon, CheckCircle2, Upload,
  ChevronUp, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';

interface Specialty {
  id: number;
  title: string;
  slug: string;
  description?: string;
  image_url?: string;
  brochure_pdf_path?: string;
  type: string;
  custom_sections?: any;
}

const EMPTY_SECTIONS = {
  hero: { subtitle: '', video_title: '', badge: '' },
  indicators: { duration: '', hours: '', mode: '', accreditation: '' },
  presentation: { title: '', about: '', objective: '', roles: [] },
  methodology: { pillars: [], tools: [] },
  profile: { skills: [] },
  accreditations: { title: '', items: [] },
  syllabus: [],
  teachers: [],
  investment: { matricula_socios: '', matricula_publico: '', cuota_socios_antes: '', cuota_socios_despues: '', cuota_publico_antes: '', cuota_publico_despues: '', label_antes: '', label_despues: '' },
  payment_accounts: { titular: '', yape: '', whatsapp: '', accounts: [] }
};

export default function AdminSpecialtyBrochureBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [specialty, setSpecialty] = useState<Specialty | null>(null);
  const [customSections, setCustomSections] = useState<any>({ ...EMPTY_SECTIONS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [builderTab, setBuilderTab] = useState<'hero' | 'pres' | 'metod' | 'syllabus' | 'docentes' | 'pago'>('hero');
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [deletingPdf, setDeletingPdf] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);

  // Load specialty details
  useEffect(() => {
    const fetchSpecialty = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await apiClient.get(`/api/v1/admin/specialties/${id}`);
        const spec = data.data ?? data;
        
        if (spec.type !== 'formacion') {
          toast.error('Esta especialidad no es de tipo programa de formación.');
          navigate('/aula/admin/especialidades');
          return;
        }

        setSpecialty(spec);
        // Merge with empty sections to avoid undefined checks in inputs
        setCustomSections({
          ...EMPTY_SECTIONS,
          ...(spec.custom_sections || {}),
          hero: { ...EMPTY_SECTIONS.hero, ...(spec.custom_sections?.hero || {}) },
          indicators: { ...EMPTY_SECTIONS.indicators, ...(spec.custom_sections?.indicators || {}) },
          presentation: { ...EMPTY_SECTIONS.presentation, ...(spec.custom_sections?.presentation || {}) },
          methodology: { ...EMPTY_SECTIONS.methodology, ...(spec.custom_sections?.methodology || {}) },
          profile: { ...EMPTY_SECTIONS.profile, ...(spec.custom_sections?.profile || {}) },
          accreditations: { ...EMPTY_SECTIONS.accreditations, ...(spec.custom_sections?.accreditations || {}) },
          syllabus: spec.custom_sections?.syllabus || [],
          teachers: spec.custom_sections?.teachers || [],
          investment: { ...EMPTY_SECTIONS.investment, ...(spec.custom_sections?.investment || {}) },
          payment_accounts: { ...EMPTY_SECTIONS.payment_accounts, ...(spec.custom_sections?.payment_accounts || {}) }
        });
      } catch (err: any) {
        setError('No se pudo cargar el programa de formación. Verifica que exista.');
        toast.error('Error al cargar la especialidad');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchSpecialty();
  }, [id, navigate]);

  // Load available teachers for linking in Plana Docente
  useEffect(() => {
    if (builderTab === 'docentes') {
      const fetchTeachers = async () => {
        try {
          const { data } = await apiClient.get('/api/v1/admin/teachers');
          setAvailableTeachers(data.data ?? data ?? []);
        } catch (err) {
          console.error('Error fetching teachers for brochure', err);
        }
      };
      fetchTeachers();
    }
  }, [builderTab]);

  // Nested state updater
  const setCS = (value: any, path: string[]) => {
    setCustomSections((prev: any) => {
      const next = { ...prev };
      let current = next;
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) current[path[i]] = {};
        current[path[i]] = { ...current[path[i]] };
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return next;
    });
  };

  // Helper to reorder teachers in the Plana Docente brochure section
  const moveTeacher = (idx: number, direction: 'up' | 'down') => {
    const list = [...(customSections.teachers || [])];
    if (direction === 'up' && idx > 0) {
      const temp = list[idx];
      list[idx] = list[idx - 1];
      list[idx - 1] = temp;
      setCS(list, ['teachers']);
    } else if (direction === 'down' && idx < list.length - 1) {
      const temp = list[idx];
      list[idx] = list[idx + 1];
      list[idx + 1] = temp;
      setCS(list, ['teachers']);
    }
  };

  // Save updated custom_sections to database
  const handleSave = async () => {
    if (!id || !specialty) return;
    setSaving(true);
    setError('');

    try {
      const payload = {
        title: specialty.title,
        description: specialty.description,
        image_url: specialty.image_url,
        type: specialty.type,
        custom_sections: customSections
      };

      await apiClient.put(`/api/v1/admin/specialties/${id}`, payload);
      
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['specialties'] }),
        queryClient.invalidateQueries({ queryKey: ['specialty', id] }),
        queryClient.invalidateQueries({ queryKey: ['specialty', specialty.slug] }),
      ]);

      toast.success('Brochure guardado correctamente.');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al guardar los cambios en el brochure.');
      toast.error('Error al guardar el brochure');
    } finally {
      setSaving(false);
    }
  };

  const handlePdfUpload = async (file: File) => {
    setUploadingPdf(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const { data } = await apiClient.post(`/api/v1/admin/specialties/${id}/brochure-pdf`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const updatedSpec = data.specialty ?? data.data;
      if (updatedSpec) {
        setSpecialty(updatedSpec);
      }
      toast.success('Brochure PDF cargado correctamente.');
      queryClient.invalidateQueries({ queryKey: ['specialties'] });
      queryClient.invalidateQueries({ queryKey: ['specialty', id] });
      queryClient.invalidateQueries({ queryKey: ['specialty', specialty?.slug] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Error al subir el brochure PDF.');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handlePdfDelete = async () => {
    if (!specialty) return;
    if (!confirm('¿Estás seguro de eliminar el Brochure PDF de este programa?')) return;
    setDeletingPdf(true);
    try {
      const { data } = await apiClient.put(`/api/v1/admin/specialties/${id}`, {
        title: specialty.title,
        description: specialty.description,
        image_url: specialty.image_url,
        brochure_pdf_path: null,
        type: specialty.type,
        custom_sections: customSections
      });
      const updatedSpec = data.data ?? data;
      setSpecialty(updatedSpec);
      toast.success('Brochure PDF eliminado correctamente.');
      queryClient.invalidateQueries({ queryKey: ['specialties'] });
      queryClient.invalidateQueries({ queryKey: ['specialty', id] });
      queryClient.invalidateQueries({ queryKey: ['specialty', specialty?.slug] });
    } catch {
      toast.error('Error al eliminar el brochure PDF.');
    } finally {
      setDeletingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-secondary" />
        <p className="text-slate-500 font-medium text-sm">Cargando constructor de brochure...</p>
      </div>
    );
  }

  if (error && !specialty) {
    return (
      <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-100 max-w-2xl mx-auto my-12 text-center space-y-4">
        <XCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h3 className="font-bold text-lg">Error de Carga</h3>
        <p className="text-sm">{error}</p>
        <button 
          onClick={() => navigate('/aula/admin/especialidades')}
          className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-bold text-xs transition"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a Especialidades
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans pb-16">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <button 
            onClick={() => navigate('/aula/admin/especialidades')}
            className="group inline-flex items-center gap-1 text-slate-400 hover:text-primary text-xs font-bold transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" /> Volver a Especialidades
          </button>
          <h1 className="text-xl sm:text-2xl font-extrabold text-primary flex items-center gap-2">
            <Target className="w-5 sm:w-6 h-5 sm:h-6 text-secondary" /> 
            <span>Brochure Builder: <span className="text-secondary">{specialty?.title}</span></span>
          </h1>
          <p className="text-slate-500 text-xs">Crea y edita de forma dinámica las secciones visuales y académicas de este programa oficial</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/aula/admin/especialidades')}
            className="px-4 py-2.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 transition"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-secondary hover:brightness-95 disabled:opacity-60 text-white px-5 py-2.5 rounded-lg text-xs font-black shadow-soft transition"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Guardando cambios…</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-white" />
                <span>Guardar Brochure</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100 flex items-center gap-2">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Builder Tabs and Forms Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Side: Navigation Tabs Sidebar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-soft space-y-1.5 lg:sticky lg:top-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">Secciones del Brochure</h3>
          {[
            { id: 'hero', label: '1. Hero & Stats', icon: <Laptop className="w-4 h-4" /> },
            { id: 'pres', label: '2. Presentación & Objetivos', icon: <FileText className="w-4 h-4" /> },
            { id: 'metod', label: '3. Metodología & Herramientas', icon: <Layers className="w-4 h-4" /> },
            { id: 'syllabus', label: '4. Malla Curricular', icon: <BookOpen className="w-4 h-4" /> },
            { id: 'docentes', label: '5. Plana Docente', icon: <GraduationCap className="w-4 h-4" /> },
            { id: 'pago', label: '6. Inversión & Inscripción', icon: <DollarSign className="w-4 h-4" /> }
          ].map((tab: any) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setBuilderTab(tab.id)}
              className={`w-full flex items-start text-left gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all ${
                builderTab === tab.id 
                  ? 'bg-primary text-white shadow-soft' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <span className={builderTab === tab.id ? 'text-secondary' : 'text-slate-400'}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right Side: Tab Panel Content Form */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 shadow-soft space-y-6 min-h-[50vh]">
          
          {/* Sub-tab 1: Hero & Stats */}
          {builderTab === 'hero' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="font-bold text-base text-primary">Sección Hero & Indicadores Clave</h2>
                <p className="text-slate-400 text-xs mt-0.5">Define los textos de introducción principal y los indicadores que se muestran en tarjetas de resumen rápido.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Etiqueta Resaltada (Badge)</label>
                  <input 
                    value={customSections.hero?.badge || ''} 
                    onChange={e => setCS(e.target.value, ['hero', 'badge'])}
                    placeholder="Ej: Área de Estudio · Programa Oficial"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary bg-white transition-colors" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Subtítulo Descriptivo (Hero)</label>
                  <input 
                    value={customSections.hero?.subtitle || ''} 
                    onChange={e => setCS(e.target.value, ['hero', 'subtitle'])}
                    placeholder="Ej: Arbitraje Privado y Contrataciones del Estado"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary bg-white transition-colors" 
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Título de Video / Miniatura del Brochure</label>
                  <input 
                    value={customSections.hero?.video_title || ''} 
                    onChange={e => setCS(e.target.value, ['hero', 'video_title'])}
                    placeholder="Ej: Simulación de Tribunal Arbitral de EduWanka"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary bg-white transition-colors" 
                  />
                </div>

                {/* Indicators Block */}
                <div className="col-span-2 pt-6 border-t border-slate-100">
                  <h3 className="text-xs font-extrabold text-primary uppercase tracking-wider mb-4">4 Tarjetas de Indicadores Académicos</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-150">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">1. Duración del Programa</label>
                      <input 
                        value={customSections.indicators?.duration || ''} 
                        onChange={e => setCS(e.target.value, ['indicators', 'duration'])}
                        placeholder="Ej: 7 Meses"
                        className="w-full border border-slate-250 bg-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-secondary font-bold" 
                      />
                    </div>
                    <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-150">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">2. Horas Académicas Totales</label>
                      <input 
                        value={customSections.indicators?.hours || ''} 
                        onChange={e => setCS(e.target.value, ['indicators', 'hours'])}
                        placeholder="Ej: 1152 Académicas"
                        className="w-full border border-slate-250 bg-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-secondary font-bold" 
                      />
                    </div>
                    <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-150">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">3. Modalidad</label>
                      <input 
                        value={customSections.indicators?.mode || ''} 
                        onChange={e => setCS(e.target.value, ['indicators', 'mode'])}
                        placeholder="Ej: Virtual en vivo"
                        className="w-full border border-slate-250 bg-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-secondary font-bold" 
                      />
                    </div>
                    <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-150">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">4. Acreditación / Respaldo</label>
                      <input 
                        value={customSections.indicators?.accreditation || ''} 
                        onChange={e => setCS(e.target.value, ['indicators', 'accreditation'])}
                        placeholder="Ej: SUNEDU / UNT"
                        className="w-full border border-slate-250 bg-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-secondary font-bold" 
                      />
                    </div>
                  </div>
                </div>

                {/* PDF Brochure Upload Field */}
                <div className="col-span-2 pt-6 border-t border-slate-100 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
                      Archivo de Brochure en PDF (Opcional)
                    </label>
                    <span className="text-[9px] text-primary font-extrabold uppercase tracking-widest bg-primary/10 border border-primary/10 px-2 py-0.5 rounded w-fit">
                      El botón de descarga aparecerá automáticamente si se sube
                    </span>
                  </div>

                  {specialty?.brochure_pdf_path ? (
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-red-50 text-red-650 rounded-lg shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-700 block truncate">
                            {specialty.brochure_pdf_path.split('/').pop()}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                            Archivo PDF Cargado
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a 
                          href={specialty.brochure_pdf_path.startsWith('http') || specialty.brochure_pdf_path.startsWith('/storage') ? specialty.brochure_pdf_path : `/storage/${specialty.brochure_pdf_path}`}
                          target="_blank" 
                          rel="noreferrer" 
                          className="bg-primary hover:bg-primary-container text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
                        >
                          Ver PDF
                        </a>
                        <button 
                          type="button"
                          onClick={handlePdfDelete}
                          disabled={deletingPdf}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-3.5 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50"
                        >
                          {deletingPdf ? 'Borrando...' : 'Eliminar'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type === 'application/pdf') {
                          handlePdfUpload(file);
                        } else if (file) {
                          toast.error('Solo se permiten archivos PDF.');
                        }
                      }}
                      className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${
                        isDragging 
                          ? 'border-secondary bg-secondary/5 scale-[1.01]' 
                          : 'border-slate-200 hover:border-secondary bg-white'
                      }`}
                    >
                      {uploadingPdf ? (
                        <div className="flex flex-col items-center justify-center py-4 gap-2">
                          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
                          <span className="text-xs font-bold text-slate-450 uppercase tracking-widest animate-pulse">Subiendo Brochure PDF...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                          <FileText className={`w-8 h-8 transition-colors ${isDragging ? 'text-secondary' : 'text-slate-350'}`} />
                          <div className="flex text-xs text-slate-600">
                            <label className="relative cursor-pointer rounded-md font-bold text-secondary hover:text-secondary-container focus-within:outline-none pointer-events-auto">
                              <span>Sube un archivo PDF</span>
                              <input 
                                type="file" 
                                accept="application/pdf"
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) handlePdfUpload(file);
                                }}
                                className="sr-only" 
                              />
                            </label>
                            <p className="pl-1">o arrastra y suelta aquí</p>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PDF hasta 20 MB</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 2: Presentación & Objetivos */}
          {builderTab === 'pres' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="font-bold text-base text-primary">Presentación, Metas y Destrezas</h2>
                <p className="text-slate-400 text-xs mt-0.5">Establece la narrativa del diplomado, los objetivos principales, los roles de egreso y las destrezas a desarrollar.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Título de la Sección de Presentación</label>
                  <input 
                    value={customSections.presentation?.title || ''} 
                    onChange={e => setCS(e.target.value, ['presentation', 'title'])}
                    placeholder="Ej: Sobre el Diplomado"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Cuerpo de Texto de Presentación</label>
                  <textarea 
                    value={customSections.presentation?.about || ''} 
                    onChange={e => setCS(e.target.value, ['presentation', 'about'])}
                    rows={6}
                    placeholder="Escribe en varios párrafos el texto de presentación completo de la especialización..."
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-secondary resize-none" 
                  />
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Objetivo General</label>
                  <textarea 
                    value={customSections.presentation?.objective || ''} 
                    onChange={e => setCS(e.target.value, ['presentation', 'objective'])}
                    rows={3}
                    placeholder="Ej: Formar especialistas competentes con dominio procedimental de la práctica del diplomado..."
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-secondary resize-none" 
                  />
                </div>

                {/* Roles de Egresado - Reusable List Editor */}
                <div className="border-t border-slate-100 pt-6">
                  <ListEditor 
                    label="Roles en los que intervendrá el egresado"
                    items={customSections.presentation?.roles || []}
                    onChange={v => setCS(v, ['presentation', 'roles'])}
                  />
                </div>

                {/* Perfil de Egresado (Habilidades) - Reusable List Editor */}
                <div className="border-t border-slate-100 pt-6">
                  <ListEditor 
                    label="Perfil de egreso (Habilidades y destrezas a desarrollar)"
                    items={customSections.profile?.skills || []}
                    onChange={v => setCS(v, ['profile', 'skills'])}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 3: Metodología & Herramientas */}
          {builderTab === 'metod' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="font-bold text-base text-primary">Metodología, Herramientas y Certificaciones</h2>
                <p className="text-slate-400 text-xs mt-0.5">Configura los 3 pilares de estudio, las 3 herramientas entregadas en la especialización y las 3 acreditaciones oficiales.</p>
              </div>

              {/* 3 Pillars Editor */}
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold text-primary uppercase tracking-wider">Los 3 Pilares Metodológicos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[0, 1, 2].map((idx) => {
                    const pillars = customSections.methodology?.pillars || [];
                    const p = pillars[idx] || { title: '', desc: '' };
                    return (
                      <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Pilar {idx + 1}</span>
                        <input 
                          value={p.title || ''} 
                          onChange={e => {
                            const n = [...pillars];
                            n[idx] = { ...p, title: e.target.value };
                            setCS(n, ['methodology', 'pillars']);
                          }}
                          placeholder="Título del Pilar"
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-secondary font-bold" 
                        />
                        <textarea 
                          value={p.desc || ''} 
                          onChange={e => {
                            const n = [...pillars];
                            n[idx] = { ...p, desc: e.target.value };
                            setCS(n, ['methodology', 'pillars']);
                          }}
                          rows={3}
                          placeholder="Breve descripción del pilar..."
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-secondary resize-none" 
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Herramientas Entregadas */}
              <div className="space-y-4 border-t border-slate-100 pt-6">
                <h3 className="text-xs font-extrabold text-primary uppercase tracking-wider">Las 3 Herramientas Prácticas Entregadas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[0, 1, 2].map((idx) => {
                    const tools = customSections.methodology?.tools || [];
                    const t = tools[idx] || { title: '', desc: '', items: [] };
                    return (
                      <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Herramienta {idx + 1}</span>
                        <input 
                          value={t.title || ''} 
                          onChange={e => {
                            const n = [...tools];
                            n[idx] = { ...t, title: e.target.value };
                            setCS(n, ['methodology', 'tools']);
                          }}
                          placeholder="Ej: Expediente madre"
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-secondary font-bold" 
                        />
                        <input 
                          value={t.desc || ''} 
                          onChange={e => {
                            const n = [...tools];
                            n[idx] = { ...t, desc: e.target.value };
                            setCS(n, ['methodology', 'tools']);
                          }}
                          placeholder="Descripción resumida"
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-secondary" 
                        />
                        
                        <ListEditor 
                          label="Items y Contenidos Clave"
                          items={t.items || []}
                          onChange={v => {
                            const n = [...tools];
                            n[idx] = { ...t, items: v };
                            setCS(n, ['methodology', 'tools']);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Certificaciones y Acreditaciones */}
              <div className="space-y-4 border-t border-slate-100 pt-6">
                <h3 className="text-xs font-extrabold text-primary uppercase tracking-wider">Acreditaciones y Respaldo Académico (3 Certificaciones)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[0, 1, 2].map((idx) => {
                    const accItems = customSections.accreditations?.items || [];
                    const item = accItems[idx] || { title: '', desc: '', badge: '' };
                    return (
                      <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Certificación {idx + 1}</span>
                        <input 
                          value={item.title || ''} 
                          onChange={e => {
                            const n = [...accItems];
                            n[idx] = { ...item, title: e.target.value };
                            setCS(n, ['accreditations', 'items']);
                          }}
                          placeholder="Título del Certificado"
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-secondary font-bold" 
                        />
                        <textarea 
                          value={item.desc || ''} 
                          onChange={e => {
                            const n = [...accItems];
                            n[idx] = { ...item, desc: e.target.value };
                            setCS(n, ['accreditations', 'items']);
                          }}
                          rows={3}
                          placeholder="Descripción de alcance o validez..."
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-secondary resize-none" 
                        />
                        <input 
                          value={item.badge || ''} 
                          onChange={e => {
                            const n = [...accItems];
                            n[idx] = { ...item, badge: e.target.value };
                            setCS(n, ['accreditations', 'items']);
                          }}
                          placeholder="Etiqueta llamativa (+ Registro...)"
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-secondary" 
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 4: Malla Curricular (Módulos) */}
          {builderTab === 'syllabus' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-base text-primary">Malla Curricular / Sílabo por Módulos</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Define los contenidos programáticos del diplomado organizados en módulos secuenciales.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const list = customSections.syllabus || [];
                    const newModule = { number: list.length + 1, title: '', topics: [], taller: '' };
                    setCS([...list, newModule], ['syllabus']);
                    toast.success('Módulo añadido');
                  }}
                  className="flex items-center gap-1 bg-secondary text-white text-xs font-bold px-3 py-2 rounded-lg shadow-soft hover:brightness-95 transition"
                >
                  <ListPlus className="w-3.5 h-3.5" /> Añadir Módulo
                </button>
              </div>

              {/* Modules List Builder */}
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {(customSections.syllabus || []).map((mod: any, mIdx: number) => (
                  <div key={mIdx} className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-4 relative">
                    <button
                      type="button"
                      onClick={() => {
                        const list = customSections.syllabus.filter((_: any, i: number) => i !== mIdx);
                        // Reindex numbers
                        const listWithNumbers = list.map((item: any, idx: number) => ({ ...item, number: idx + 1 }));
                        setCS(listWithNumbers, ['syllabus']);
                        toast.error('Módulo removido');
                      }}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                      title="Eliminar Módulo"
                    >
                      <XCircleIcon className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-center">
                      <div className="sm:col-span-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Módulo</span>
                        <span className="font-extrabold text-primary font-sans text-sm">Módulo {mIdx + 1}</span>
                      </div>
                      <div className="sm:col-span-5 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Título del Módulo</label>
                        <input 
                          value={mod.title || ''} 
                          onChange={e => {
                            const list = [...customSections.syllabus];
                            list[mIdx] = { ...mod, title: e.target.value };
                            setCS(list, ['syllabus']);
                          }}
                          placeholder="Ej: Fundamentos del Proceso Arbitral..."
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-secondary" 
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Taller / Análisis de Casos (Badge inferior)</label>
                      <input 
                        value={mod.taller || ''} 
                        onChange={e => {
                          const list = [...customSections.syllabus];
                          list[mIdx] = { ...mod, taller: e.target.value };
                          setCS(list, ['syllabus']);
                        }}
                        placeholder="Ej: Taller Práctico: Redacción de cláusulas..."
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-secondary" 
                      />
                    </div>

                    <ListEditor 
                      label="Temas y Puntos Clave del Módulo"
                      items={mod.topics || []}
                      onChange={v => {
                        const list = [...customSections.syllabus];
                        list[mIdx] = { ...mod, topics: v };
                        setCS(list, ['syllabus']);
                      }}
                    />
                  </div>
                ))}

                {(customSections.syllabus || []).length === 0 && (
                  <div className="text-center py-12 text-slate-400 italic text-sm">
                    No has agregado ningún módulo a la malla curricular. Clic en "Añadir Módulo" para iniciar.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-tab 5: Plana Docente */}
          {builderTab === 'docentes' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h2 className="font-bold text-base text-primary">Plana Docente Seleccionada</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Elige los docentes previamente creados en la pestaña general para que figuren en este programa y define su orden de aparición.</p>
                </div>
                
                {/* Selector para añadir docente */}
                <div className="flex items-center gap-2">
                  <select
                    onChange={e => {
                      const docId = e.target.value;
                      if (!docId) return;
                      const selected = availableTeachers.find(t => t.id === parseInt(docId));
                      if (selected) {
                        const list = [...(customSections.teachers || [])];
                        // Evitar duplicados
                        const nameFormatted = (selected.title ? selected.title + ' ' : '') + selected.name;
                        if (list.some((t: any) => t.name === nameFormatted)) {
                          toast.error('Este docente ya está agregado a la plana de este programa.');
                        } else {
                          const newDocente = {
                            name: nameFormatted,
                            specialty: selected.specialty || '',
                            credentials: selected.credentials || '',
                            bio: selected.bio || '',
                            image: selected.photo_url || ''
                          };
                          setCS([...list, newDocente], ['teachers']);
                          toast.success(`${selected.name} añadido con éxito.`);
                        }
                      }
                      e.target.value = ''; // Reset select
                    }}
                    className="text-xs font-bold text-slate-700 bg-secondary/15 border border-secondary/25 rounded-xl px-4 py-2.5 focus:outline-none focus:border-secondary cursor-pointer hover:bg-secondary/25 transition shadow-sm"
                  >
                    <option value="">+ Vincular y Añadir Docente...</option>
                    {availableTeachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.title ? `${t.title} ` : ''}{t.name} ({t.specialty || 'Sin especialidad'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Teachers List Editor (No input fields, purely sortable/removable) */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {(customSections.teachers || []).map((teacher: any, tIdx: number) => (
                  <div key={tIdx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative group hover:shadow-soft transition-all duration-300">
                    
                    {/* Detalles del Docente */}
                    <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                      {/* Avatar preview */}
                      <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 bg-slate-100 border border-slate-200 flex items-center justify-center relative shadow-sm">
                        {teacher.image ? (
                          <img 
                            src={teacher.image.startsWith('http') || teacher.image.startsWith('/storage') ? teacher.image : `/storage/${teacher.image.replace(/^\/+/, '')}`} 
                            alt={teacher.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <GraduationCap className="w-6 h-6 text-slate-350" />
                        )}
                      </div>
                      
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-sans font-extrabold text-primary text-sm leading-tight">
                            {teacher.name}
                          </h4>
                          <span className="bg-secondary/15 border border-secondary/15 text-secondary text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm">
                            N° {tIdx + 1}
                          </span>
                        </div>
                        
                        {teacher.specialty && (
                          <p className="text-[10px] text-secondary font-black uppercase tracking-wider leading-none">
                            {teacher.specialty}
                          </p>
                        )}
                        {teacher.credentials && (
                          <p className="text-[10px] text-slate-400 font-bold leading-normal truncate max-w-xl">
                            {teacher.credentials}
                          </p>
                        )}
                        {teacher.bio && (
                          <p className="text-[10px] text-slate-500 italic font-medium leading-normal line-clamp-1 max-w-xl mt-0.5">
                            "{teacher.bio}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Acciones y Controles de Ordenamiento */}
                    <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0 bg-slate-50 border border-slate-150 p-2 rounded-xl">
                      {/* Mover Arriba */}
                      <button
                        type="button"
                        onClick={() => moveTeacher(tIdx, 'up')}
                        disabled={tIdx === 0}
                        className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-primary hover:bg-slate-100 transition disabled:opacity-30 disabled:pointer-events-none"
                        title="Mover arriba"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      
                      {/* Mover Abajo */}
                      <button
                        type="button"
                        onClick={() => moveTeacher(tIdx, 'down')}
                        disabled={tIdx === (customSections.teachers || []).length - 1}
                        className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-primary hover:bg-slate-100 transition disabled:opacity-30 disabled:pointer-events-none"
                        title="Mover abajo"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      <div className="h-5 w-[1px] bg-slate-200 mx-1"></div>

                      {/* Quitar */}
                      <button
                        type="button"
                        onClick={() => {
                          const list = customSections.teachers.filter((_: any, i: number) => i !== tIdx);
                          setCS(list, ['teachers']);
                          toast.error('Docente removido del programa');
                        }}
                        className="p-2 rounded-lg bg-red-50 border border-red-100 text-red-500 hover:text-red-700 hover:bg-red-100 transition"
                        title="Quitar docente del programa"
                      >
                        <XCircleIcon className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                ))}

                {(customSections.teachers || []).length === 0 && (
                  <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200 border-dashed text-slate-400 italic text-sm">
                    <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-500" />
                    <span>No hay docentes vinculados a este programa de formación.</span>
                    <p className="text-[10px] text-slate-400 mt-1.5 not-italic font-bold uppercase tracking-widest">Utiliza el selector superior para vincular docentes registrados</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-tab 6: Inversión & Inscripción */}
          {builderTab === 'pago' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="font-bold text-base text-primary">Inversión, QR Yape y Cuentas de Recaudación</h2>
                <p className="text-slate-400 text-xs mt-0.5">Gestiona las tarifas diferidas de socios y público general, los datos de contacto y la lista de cuentas de abono bancario.</p>
              </div>

              {/* Fechas de Vencimiento / Etiquetas */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-4 animate-fadeIn">
                <h3 className="text-xs font-extrabold text-primary uppercase tracking-wider">Fechas límites de cuotas (Personalizable)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Texto fecha anticipada (Inscripción Anticipada)</label>
                    <input 
                      value={customSections.investment?.label_antes || ''} 
                      onChange={e => setCS(e.target.value, ['investment', 'label_antes'])}
                      placeholder="Ej: Hasta el 10 de junio"
                      className="w-full border border-slate-250 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-secondary font-bold" 
                    />
                  </div>
                  <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Texto fecha regular (Precio Regular)</label>
                    <input 
                      value={customSections.investment?.label_despues || ''} 
                      onChange={e => setCS(e.target.value, ['investment', 'label_despues'])}
                      placeholder="Ej: Desde el 11 de junio"
                      className="w-full border border-slate-250 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-secondary font-bold" 
                    />
                  </div>
                </div>
              </div>

              {/* Cost Cards */}
              <div className="space-y-3 animate-fadeIn">
                <h3 className="text-xs font-extrabold text-primary uppercase tracking-wider">Tarifas del Programa</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-150">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Matrícula Socios</label>
                    <input 
                      value={customSections.investment?.matricula_socios || ''} 
                      onChange={e => setCS(e.target.value, ['investment', 'matricula_socios'])}
                      placeholder="Ej: S/ 285.00"
                      className="w-full border border-slate-250 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none font-bold" 
                    />
                  </div>
                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-150">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cuota Socios ({customSections.investment?.label_antes || 'Antes del 10'})</label>
                    <input 
                      value={customSections.investment?.cuota_socios_antes || ''} 
                      onChange={e => setCS(e.target.value, ['investment', 'cuota_socios_antes'])}
                      placeholder="Ej: S/ 550.00"
                      className="w-full border border-slate-250 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none font-bold" 
                    />
                  </div>
                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-150">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cuota Socios ({customSections.investment?.label_despues || 'Después del 10'})</label>
                    <input 
                      value={customSections.investment?.cuota_socios_despues || ''} 
                      onChange={e => setCS(e.target.value, ['investment', 'cuota_socios_despues'])}
                      placeholder="Ej: S/ 650.00"
                      className="w-full border border-slate-250 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none font-bold" 
                    />
                  </div>
                  
                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-150">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Matrícula General</label>
                    <input 
                      value={customSections.investment?.matricula_publico || ''} 
                      onChange={e => setCS(e.target.value, ['investment', 'matricula_publico'])}
                      placeholder="Ej: S/ 295.00"
                      className="w-full border border-slate-250 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none font-bold" 
                    />
                  </div>
                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-150">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cuota General ({customSections.investment?.label_antes || 'Antes del 10'})</label>
                    <input 
                      value={customSections.investment?.cuota_publico_antes || ''} 
                      onChange={e => setCS(e.target.value, ['investment', 'cuota_publico_antes'])}
                      placeholder="Ej: S/ 590.00"
                      className="w-full border border-slate-250 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none font-bold" 
                    />
                  </div>
                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-150">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cuota General ({customSections.investment?.label_despues || 'Después del 10'})</label>
                    <input 
                      value={customSections.investment?.cuota_publico_despues || ''} 
                      onChange={e => setCS(e.target.value, ['investment', 'cuota_publico_despues'])}
                      placeholder="Ej: S/ 695.00"
                      className="w-full border border-slate-250 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none font-bold" 
                    />
                  </div>
                </div>
              </div>

              {/* Payment details */}
              <div className="space-y-4 border-t border-slate-100 pt-6 animate-fadeIn">
                <h3 className="text-xs font-extrabold text-primary uppercase tracking-wider">Datos Principales de Cobro</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Titular de las Cuentas</label>
                    <input 
                      value={customSections.payment_accounts?.titular || ''} 
                      onChange={e => setCS(e.target.value, ['payment_accounts', 'titular'])}
                      placeholder="Lennin Patrick Gonzales Villanueva"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-secondary" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Número Yape Recaudador</label>
                    <input 
                      value={customSections.payment_accounts?.yape || ''} 
                      onChange={e => setCS(e.target.value, ['payment_accounts', 'yape'])}
                      placeholder="970 054 014"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-secondary" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp de Asesora (Informes)</label>
                    <input 
                      value={customSections.payment_accounts?.whatsapp || ''} 
                      onChange={e => setCS(e.target.value, ['payment_accounts', 'whatsapp'])}
                      placeholder="971 707 389"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-secondary" 
                    />
                  </div>
                </div>
              </div>

              {/* Bank accounts sub-list */}
              <div className="space-y-3 border-t border-slate-100 pt-6 animate-fadeIn">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-extrabold text-primary uppercase tracking-wider">Cuentas Bancarias Autorizadas</h3>
                  <button
                    type="button"
                    onClick={() => {
                      const list = customSections.payment_accounts?.accounts || [];
                      const newAccount = { bank: '', acc: '', cci: '' };
                      setCS([...list, newAccount], ['payment_accounts', 'accounts']);
                      toast.success('Cuenta añadida');
                    }}
                    className="flex items-center gap-1 bg-secondary text-white text-[10px] font-bold px-2 py-1 rounded shadow-soft hover:brightness-95 transition"
                  >
                    <ListPlus className="w-3 h-3" /> Añadir Cuenta
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
                  {(customSections.payment_accounts?.accounts || []).map((cta: any, cIdx: number) => (
                    <div key={cIdx} className="bg-slate-50 p-4 rounded-xl border border-slate-150 relative space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          const list = customSections.payment_accounts.accounts.filter((_: any, i: number) => i !== cIdx);
                          setCS(list, ['payment_accounts', 'accounts']);
                          toast.error('Cuenta removida');
                        }}
                        className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"
                        title="Eliminar Cuenta"
                      >
                        <XCircleIcon className="w-3.5 h-3.5" />
                      </button>
                      
                      <div className="grid grid-cols-1 gap-2 pr-4">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">Entidad Financiera</label>
                          <input 
                            value={cta.bank || ''} 
                            onChange={e => {
                              const list = [...customSections.payment_accounts.accounts];
                              list[cIdx] = { ...cta, bank: e.target.value };
                              setCS(list, ['payment_accounts', 'accounts']);
                            }}
                            placeholder="Ej: Banco Interbank"
                            className="w-full border border-slate-200 rounded px-2.5 py-1 text-xs bg-white focus:outline-none focus:border-secondary font-bold" 
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">Número de Cuenta</label>
                          <input 
                            value={cta.acc || ''} 
                            onChange={e => {
                              const list = [...customSections.payment_accounts.accounts];
                              list[cIdx] = { ...cta, acc: e.target.value };
                              setCS(list, ['payment_accounts', 'accounts']);
                            }}
                            placeholder="Ej: 8983446602618"
                            className="w-full border border-slate-200 rounded px-2.5 py-1 text-xs bg-white focus:outline-none focus:border-secondary font-mono" 
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">Código Interbancario (CCI)</label>
                          <input 
                            value={cta.cci || ''} 
                            onChange={e => {
                              const list = [...customSections.payment_accounts.accounts];
                              list[cIdx] = { ...cta, cci: e.target.value };
                              setCS(list, ['payment_accounts', 'accounts']);
                            }}
                            placeholder="Ej: CCI: 00389801344660261841"
                            className="w-full border border-slate-200 rounded px-2.5 py-1 text-xs bg-white focus:outline-none focus:border-secondary font-mono" 
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {(customSections.payment_accounts?.accounts || []).length === 0 && (
                    <div className="col-span-2 text-center py-6 text-slate-400 italic text-xs">
                      No has añadido ninguna cuenta bancaria de recaudación.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
