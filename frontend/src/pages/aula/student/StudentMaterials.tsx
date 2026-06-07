import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { 
  FolderOpen, Loader, FileText, Download, AlertCircle, BookOpen, ChevronDown 
} from 'lucide-react';

interface Course {
  id: number;
  code: string;
  title: string;
  image_url?: string | null;
  level?: string | null;
  duration_weeks?: number;
}

interface ContentItem {
  id: number;
  type: string;
  title: string;
  url?: string | null;
  path?: string | null;
  published: boolean;
}

interface Section {
  id: number;
  title: string;
  items: ContentItem[];
}

interface Module {
  id: number;
  title: string;
  order: number;
  sections: Section[];
}

interface CourseDetail {
  id: number;
  title: string;
  modules: Module[];
}

// Subcomponent to render details of a course lazily
const CourseMaterialsList: React.FC<{ courseId: number }> = ({ courseId }) => {
  const { data: courseDetail, isLoading, error } = useQuery({
    queryKey: ['course-materials', courseId],
    queryFn: async (): Promise<CourseDetail> => {
      const response = await apiClient.get(`/api/v1/aula/courses/${courseId}`);
      return response.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader className="animate-spin text-secondary w-6 h-6" />
      </div>
    );
  }

  if (error || !courseDetail) {
    return (
      <div className="text-red-500 text-sm py-4 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        No se pudieron cargar los materiales de este curso.
      </div>
    );
  }

  // Extract all file/document items from modules and sections
  const files: { moduleTitle: string; sectionTitle: string; item: ContentItem }[] = [];
  
  (courseDetail.modules ?? []).forEach(module => {
    (module.sections ?? []).forEach(section => {
      (section.items ?? []).forEach(item => {
        if (item.published && (item.type === 'file' || item.type === 'document')) {
          files.push({
            moduleTitle: module.title,
            sectionTitle: section.title,
            item
          });
        }
      });
    });
  });

  if (files.length === 0) {
    return (
      <div className="text-slate-500 text-sm py-6 text-center italic bg-slate-50 rounded-2xl border border-slate-100">
        No hay archivos o lecturas registradas en este curso todavía.
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      {files.map(({ moduleTitle, sectionTitle, item }) => (
        <div 
          key={item.id}
          className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 transition-all group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-100 transition-colors shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-800 text-sm truncate">{item.title}</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                {moduleTitle} • {sectionTitle}
              </p>
            </div>
          </div>
          
          <a
            href={item.path ? `/storage/${item.path}` : (item.url ?? '#')}
            target="_blank" 
            rel="noopener noreferrer" 
            download
            className="flex items-center justify-center p-2.5 bg-white text-slate-600 hover:text-primary hover:bg-primary/10 rounded-xl border border-slate-200 transition-colors shrink-0 shadow-sm"
            title="Descargar material"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      ))}
    </div>
  );
};

// Course accordion component
const CourseAccordion: React.FC<{ course: Course; defaultOpen: boolean }> = ({ course, defaultOpen }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50/50 transition-colors text-left group"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{course.code}</span>
            <h3 className="font-black text-slate-800 text-base leading-tight truncate">{course.title}</h3>
          </div>
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="px-6 pb-6 border-t border-slate-100 pt-2 bg-white">
          <CourseMaterialsList courseId={course.id} />
        </div>
      )}
    </div>
  );
};

export default function StudentMaterials() {
  const { data: courses, isLoading, isError } = useQuery<Course[]>({
    queryKey: ['my-courses'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/aula/my-courses');
      return response.data.data;
    }
  });

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Materiales de Estudio</h1>
        <p className="text-slate-500 font-medium">Todos los recursos, PDFs y lecturas de tus cursos matriculados.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader className="animate-spin text-primary w-8 h-8" />
        </div>
      ) : isError ? (
        <div className="bg-red-50 text-red-600 p-8 rounded-3xl border border-red-100 text-center flex flex-col items-center">
          <AlertCircle className="w-12 h-12 mb-4" />
          <h3 className="text-lg font-bold">Error al cargar materiales</h3>
          <p className="text-sm mt-1">Por favor verifica tu conexión e intenta de nuevo.</p>
        </div>
      ) : !courses || courses.length === 0 ? (
        <div className="bg-white rounded-[2rem] shadow-soft border border-slate-100 p-12 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FolderOpen className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Sin cursos activos</h2>
          <p className="text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
            Aún no estás matriculado en ningún curso activo o aprobado para descargar materiales.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course, idx) => (
            <CourseAccordion key={course.id} course={course} defaultOpen={idx === 0} />
          ))}
        </div>
      )}
    </div>
  );
}
