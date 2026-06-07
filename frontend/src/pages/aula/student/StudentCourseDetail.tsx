import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { CourseModule, ContentItem } from '@/lib/types';
import { CONTENT_TYPE_META } from '@/features/modules/contentTypeMeta';
import {
  Loader, BookOpen, ChevronRight, AlertCircle, CheckCircle,
  HelpCircle, ChevronDown, ExternalLink, Download, Play
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Exam { id: number; title: string; description: string; }
interface CourseDetail {
  id: number;
  code: string;
  title: string;
  modules: CourseModule[];
  exams: Exam[];
}

// ─── Video Embed Helper ───────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

// ─── Content Item Renderer ───────────────────────────────────────────────────

const ContentRenderer: React.FC<{ item: ContentItem; courseId: string | undefined }> = ({ item, courseId }) => {
  const meta = CONTENT_TYPE_META[item.type];
  const Icon = meta.icon;

  const baseUrl = (item.url ?? '');

  useEffect(() => {
    // Registra el progreso cuando el estudiante visualiza el contenido
    apiClient.post(`/api/v1/aula/content/${item.id}/complete`).catch(() => {});
  }, [item.id]);

  switch (item.type) {
    case 'video': {
      const ytId = extractYouTubeId(baseUrl);
      if (ytId) {
        return (
          <div className="mt-3 rounded-2xl overflow-hidden aspect-video bg-black shadow-lg">
            <iframe
              src={`https://www.youtube.com/embed/${ytId}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }
      return (
        <a href={baseUrl} target="_blank" rel="noopener noreferrer"
          className="mt-2 flex items-center gap-2 text-sm text-primary font-bold hover:underline">
          <Play className="w-4 h-4" /> Ver video
        </a>
      );
    }

    case 'file':
      return (
        <a
          href={item.path ? `/storage/${item.path}` : baseUrl}
          target="_blank" rel="noopener noreferrer" download
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-sm font-bold hover:bg-orange-100 transition-colors border border-orange-100"
        >
          <Download className="w-4 h-4" /> Descargar archivo
        </a>
      );

    case 'meet':
      return (
        <a href={baseUrl} target="_blank" rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors shadow-md">
          <ExternalLink className="w-4 h-4" /> Unirse a clase Meet
        </a>
      );

    case 'url':
      return (
        <a href={baseUrl} target="_blank" rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-2 text-sm text-primary font-bold hover:underline">
          <ExternalLink className="w-4 h-4" /> Abrir enlace
        </a>
      );

    case 'text':
      return (
        <div
          className="mt-3 prose prose-sm max-w-none text-slate-700 bg-slate-50 rounded-2xl p-4 border border-slate-100"
          dangerouslySetInnerHTML={{ __html: item.body_html ?? '' }}
        />
      );



    case 'questionnaire':
      return (
        <Link
          to={`/aula/cuestionario/${item.referenced_id}`}
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-md"
        >
          <HelpCircle className="w-4 h-4" /> Iniciar Cuestionario
        </Link>
      );

    case 'substitute_exam':
      return (
        <div className="mt-2 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
          <p className="text-sm text-yellow-800 font-bold">⚠️ Examen Sustitutorio</p>
          <p className="text-xs text-yellow-600 mt-1">
            Solo disponible si reprobaste el examen original. Consulta con tu docente.
          </p>
        </div>
      );

    case 'assignment':
      return (
        <Link
          to={`/aula/tarea/${item.referenced_id}`}
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-colors shadow-md"
        >
          <CheckCircle className="w-4 h-4" /> Ir a la Tarea
        </Link>
      );

    default:
      return null;
  }
};

// ─── Accordion Module ─────────────────────────────────────────────────────────

const ModuleAccordion: React.FC<{ module: CourseModule; defaultOpen?: boolean; courseId: string | undefined }> = ({
  module, defaultOpen = false, courseId
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
      {/* Module Header */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center gap-4 px-6 py-5 text-left hover:bg-slate-50 transition-colors group"
      >
        <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors flex-shrink-0">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-slate-800 text-base">
            Módulo {module.order}: {module.title}
          </h3>
          {module.description && (
            <p className="text-sm text-slate-500 mt-0.5 truncate">{module.description}</p>
          )}
        </div>
        <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-bold flex-shrink-0">
          {module.sections.reduce((acc, s) => acc + s.items.length, 0)} contenidos
        </span>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Sections & Items */}
      {isOpen && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {module.sections.sort((a, b) => a.order - b.order).map(section => (
            <div key={section.id} className="px-6 py-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                {section.title}
              </h4>
              <div className="space-y-3">
                {section.items.filter(i => i.published).sort((a, b) => a.order - b.order).map(item => {
                  const meta = CONTENT_TYPE_META[item.type];
                  const Icon = meta.icon;
                  return (
                    <div key={item.id} className="group">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-slate-50 flex-shrink-0 ${meta.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-800">{item.title}</p>
                          <p className={`text-xs font-semibold ${meta.color}`}>{meta.label}</p>
                        </div>
                      </div>
                      <div className="ml-12">
                        <ContentRenderer item={item} courseId={courseId} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentCourseDetail() {
  const { courseId } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['course-detail', courseId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/aula/courses/${courseId}`);
      return response.data.data as CourseDetail;
    }
  });

  if (isLoading) return (
    <div className="flex justify-center py-12">
      <Loader className="animate-spin text-primary w-8 h-8" />
    </div>
  );

  if (error || !data) {
    return (
      <div className="bg-red-50 text-red-600 p-8 rounded-3xl border border-red-100 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <h3 className="text-xl font-bold">Acceso denegado o curso no encontrado</h3>
        <p className="mt-2">Verifica que tu pago haya sido validado para acceder a este curso.</p>
        <Link to="/aula/cursos" className="inline-block mt-6 text-primary font-bold underline">Volver a mis cursos</Link>
      </div>
    );
  }

  const totalItems = data.modules?.reduce((acc, m) =>
    acc + m.sections.reduce((sa, s) => sa + s.items.filter(i => i.published).length, 0), 0) ?? 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-primary p-8 md:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-white/60 text-xs font-black uppercase tracking-[0.2em] mb-4">
            <Link to="/aula/cursos" className="hover:text-white transition-colors">Mis Cursos</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">{data.code}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black leading-tight max-w-3xl">{data.title}</h1>
          <div className="mt-6 flex items-center gap-4 text-white/70 text-sm">
            <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> {data.modules?.length ?? 0} módulos</span>
            <span>·</span>
            <span>{totalItems} contenidos</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Modules Accordion */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <BookOpen className="text-secondary" /> Contenido del Curso
          </h2>

          {!data.modules || data.modules.length === 0 ? (
            <div className="bg-slate-50 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
              <p className="text-slate-500 font-bold">El contenido aún no ha sido cargado por el docente.</p>
            </div>
          ) : (
            data.modules.sort((a, b) => a.order - b.order).map((module, idx) => (
              <ModuleAccordion key={module.id} module={module} defaultOpen={idx === 0} courseId={courseId} />
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Exámenes */}
          {data.exams && data.exams.length > 0 && (
            <div className="bg-white rounded-[2rem] shadow-soft border border-slate-100 p-8">
              <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                <HelpCircle className="text-secondary" /> Evaluaciones
              </h3>
              <div className="space-y-4">
                {data.exams.map((exam) => (
                  <div key={exam.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/20 transition-all group">
                    <h4 className="font-bold text-slate-800 group-hover:text-primary transition-colors">{exam.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{exam.description}</p>
                    <Link
                      to={`/aula/examenes/${exam.id}`}
                      className="w-full mt-4 bg-white text-primary text-xs font-black uppercase tracking-widest py-3 rounded-xl border border-primary/20 hover:bg-primary hover:text-white transition-all shadow-sm flex items-center justify-center"
                    >
                      Rendir Examen
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certificado hint */}
          <div className="bg-secondary/10 rounded-[2rem] p-8 border border-secondary/20">
            <CheckCircle className="text-secondary w-10 h-10 mb-4" />
            <h3 className="text-lg font-black text-secondary leading-tight">¿Listo para certificarte?</h3>
            <p className="text-sm text-secondary/80 mt-2">
              Al finalizar todos los módulos y aprobar tus exámenes, podrás descargar tu certificado digital automáticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
