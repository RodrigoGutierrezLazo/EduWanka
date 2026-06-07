import type { ContentType } from '@/lib/types';
import {
  Video, FileText, Video as MeetIcon, BookOpen, HelpCircle,
  RefreshCw, AlignLeft, Link, ClipboardList
} from 'lucide-react';

export interface ContentTypeMeta {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}

export const CONTENT_TYPE_META: Record<ContentType, ContentTypeMeta> = {
  video: {
    label: 'Video',
    description: 'YouTube, Google Drive o cualquier URL de video',
    icon: Video,
    color: 'text-red-500',
    bg: 'bg-red-50 hover:bg-red-100 border-red-100',
  },
  file: {
    label: 'Archivo',
    description: 'PDF, Word, PowerPoint, ZIP (máx. 50 MB)',
    icon: FileText,
    color: 'text-orange-500',
    bg: 'bg-orange-50 hover:bg-orange-100 border-orange-100',
  },
  meet: {
    label: 'Google Meet',
    description: 'Enlace a una clase sincrónica en vivo',
    icon: MeetIcon,
    color: 'text-green-600',
    bg: 'bg-green-50 hover:bg-green-100 border-green-100',
  },
  text: {
    label: 'Texto / HTML',
    description: 'Bloque de contenido enriquecido',
    icon: AlignLeft,
    color: 'text-slate-600',
    bg: 'bg-slate-50 hover:bg-slate-100 border-slate-100',
  },
  url: {
    label: 'Enlace externo',
    description: 'Dirección web de un recurso externo',
    icon: Link,
    color: 'text-blue-500',
    bg: 'bg-blue-50 hover:bg-blue-100 border-blue-100',
  },
  questionnaire: {
    label: 'Examen / Práctica',
    description: 'Examen en línea con preguntas de opción múltiple o V/F',
    icon: BookOpen,
    color: 'text-purple-600',
    bg: 'bg-purple-50 hover:bg-purple-100 border-purple-100',
  },
  substitute_exam: {
    label: 'Examen Sustitutorio',
    description: 'Solo disponible para estudiantes que reprobaron',
    icon: RefreshCw,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-100',
  },
  assignment: {
    label: 'Tarea',
    description: 'Entrega de trabajo con calificación manual',
    icon: ClipboardList,
    color: 'text-teal-600',
    bg: 'bg-teal-50 hover:bg-teal-100 border-teal-100',
  },
};
