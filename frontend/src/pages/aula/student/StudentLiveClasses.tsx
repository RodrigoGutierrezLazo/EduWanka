import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { motion } from 'motion/react';
import { 
  Video, Loader, ExternalLink, Calendar, Clock, Search, AlertCircle, 
  BookOpen, VideoOff, Tv, Laptop, CheckCircle 
} from 'lucide-react';

interface Course {
  id: number;
  code: string;
  title: string;
  image_url?: string | null;
  level?: string | null;
}

interface ContentItem {
  id: number;
  type: string;
  title: string;
  url?: string | null;
  path?: string | null;
  published: boolean;
  meta?: {
    start_time?: string;
    end_time?: string;
    description?: string;
  } | null;
}

interface Section {
  id: number;
  title: string;
  items: ContentItem[];
}

interface Module {
  id: number;
  title: string;
  sections: Section[];
}

interface CourseDetail {
  id: number;
  title: string;
  code: string;
  modules: Module[];
}

interface LiveClass {
  item: ContentItem;
  courseId: number;
  courseTitle: string;
  courseCode: string;
  moduleTitle: string;
  sectionTitle: string;
  platform: 'zoom' | 'meet' | 'teams' | 'other';
  startTime?: Date;
  endTime?: Date;
  isLiveNow: boolean;
  isUpcoming: boolean;
  isPast: boolean;
}

export default function StudentLiveClasses() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'upcoming' | 'past'>('all');

  // 1. Fetch courses the student is enrolled in
  const { data: courses, isLoading: LoadingCourses, error: coursesError } = useQuery<Course[]>({
    queryKey: ['my-courses'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/aula/my-courses');
      return response.data.data;
    }
  });

  // 2. Fetch details of all courses in parallel to collect live classes
  const { data: liveClasses, isLoading: loadingClasses, error: classesError } = useQuery<LiveClass[]>({
    queryKey: ['my-live-classes', courses?.map(c => c.id)],
    enabled: !!courses && courses.length > 0,
    queryFn: async () => {
      if (!courses) return [];
      
      const detailsPromises = courses.map(course => 
        apiClient.get(`/api/v1/aula/courses/${course.id}`)
          .then(res => res.data.data as CourseDetail)
          .catch(() => null)
      );

      const detailsResults = await Promise.all(detailsPromises);
      const allLiveClasses: LiveClass[] = [];
      const now = new Date();

      detailsResults.forEach((courseDetail) => {
        if (!courseDetail) return;

        (courseDetail.modules ?? []).forEach(module => {
          (module.sections ?? []).forEach(section => {
            (section.items ?? []).forEach(item => {
              // Capture both 'meet' type and items that look like live classes
              if (item.published && (item.type === 'meet' || (item.type === 'url' && (item.title.toLowerCase().includes('vivo') || item.title.toLowerCase().includes('zoom'))))) {
                
                // Determine platform
                const url = (item.url ?? '').toLowerCase();
                let platform: 'zoom' | 'meet' | 'teams' | 'other' = 'other';
                if (url.includes('zoom.us')) platform = 'zoom';
                else if (url.includes('meet.google.com')) platform = 'meet';
                else if (url.includes('teams.live.com') || url.includes('teams.microsoft.com')) platform = 'teams';

                // Parse timing from meta or estimate
                let startTime: Date | undefined;
                let endTime: Date | undefined;
                let isLiveNow = false;
                let isUpcoming = false;
                let isPast = false;

                if (item.meta?.start_time) {
                  startTime = new Date(item.meta.start_time);
                  endTime = item.meta.end_time 
                    ? new Date(item.meta.end_time) 
                    : new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours default

                  // Determine status
                  if (now >= startTime && now <= endTime) {
                    isLiveNow = true;
                  } else if (now < startTime) {
                    isUpcoming = true;
                  } else {
                    isPast = true;
                  }
                } else {
                  // Fallback: If no meta start time, let's check title keywords.
                  // Default to "upcoming" or "live" if title says "permanente"
                  const titleLower = item.title.toLowerCase();
                  if (titleLower.includes('grabación') || titleLower.includes('grabacion') || titleLower.includes('clase pasada')) {
                    isPast = true;
                  } else if (titleLower.includes('permanente') || titleLower.includes('libre')) {
                    // Permanent rooms are always available/upcoming
                    isUpcoming = true;
                  } else {
                    // Default to upcoming
                    isUpcoming = true;
                  }
                }

                allLiveClasses.push({
                  item,
                  courseId: courseDetail.id,
                  courseTitle: courseDetail.title,
                  courseCode: courseDetail.code,
                  moduleTitle: module.title,
                  sectionTitle: section.title,
                  platform,
                  startTime,
                  endTime,
                  isLiveNow,
                  isUpcoming,
                  isPast
                });
              }
            });
          });
        });
      });

      // Sort: Live now first, then upcoming by start time (closest first), then past (newest first), then unscheduled
      return allLiveClasses.sort((a, b) => {
        if (a.isLiveNow && !b.isLiveNow) return -1;
        if (!a.isLiveNow && b.isLiveNow) return 1;

        if (a.startTime && b.startTime) {
          if (a.isUpcoming && b.isUpcoming) {
            return a.startTime.getTime() - b.startTime.getTime();
          }
          if (a.isPast && b.isPast) {
            return b.startTime.getTime() - a.startTime.getTime();
          }
        }
        
        return a.item.title.localeCompare(b.item.title);
      });
    }
  });

  const isLoading = LoadingCourses || (!!courses && courses.length > 0 && loadingClasses);
  const error = coursesError || classesError;

  // Filter classes based on search, selected course, and active tab
  const filteredClasses = (liveClasses ?? []).filter(liveClass => {
    const matchesSearch = liveClass.item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          liveClass.courseTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = selectedCourseId === 'all' || liveClass.courseId.toString() === selectedCourseId;
    
    let matchesTab = true;
    if (activeTab === 'live') matchesTab = liveClass.isLiveNow;
    else if (activeTab === 'upcoming') matchesTab = liveClass.isUpcoming && !liveClass.isLiveNow;
    else if (activeTab === 'past') matchesTab = liveClass.isPast;

    return matchesSearch && matchesCourse && matchesTab;
  });

  const getPlatformLabel = (platform: string) => {
    switch(platform) {
      case 'zoom': return 'Zoom Meeting';
      case 'meet': return 'Google Meet';
      case 'teams': return 'Microsoft Teams';
      default: return 'Videoclase';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch(platform) {
      case 'zoom': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'meet': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'teams': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const formatMeetingTime = (start?: Date, end?: Date) => {
    if (!start) return 'Enlace permanente / Horario libre';
    
    const formattedStart = start.toLocaleString('es-PE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    if (!end) return formattedStart;

    const formattedEnd = end.toLocaleString('es-PE', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return `${formattedStart} - ${formattedEnd}`;
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Clases en Vivo y Videoconferencias</h1>
        <p className="text-slate-500 font-medium">Accede a tus sesiones programadas vía Zoom, Meet o Teams desde tus cursos matriculados.</p>
      </div>

      {/* Control Panel: Search & Filters */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar clase o curso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50/50 focus:bg-white rounded-2xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-slate-700"
            />
          </div>

          {/* Course Filter */}
          <div className="relative">
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50/50 rounded-2xl border border-slate-200 focus:border-primary outline-none transition-all font-semibold text-slate-700 appearance-none cursor-pointer"
            >
              <option value="all">Todos los cursos</option>
              {courses?.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {(['all', 'live', 'upcoming', 'past'] as const).map((tab) => {
            const labels = {
              all: 'Todas las clases',
              live: 'En Vivo Ahora 🔴',
              upcoming: 'Próximas Clases',
              past: 'Grabaciones / Pasadas'
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-xl text-sm font-bold border transition-all ${
                  activeTab === tab 
                    ? 'bg-primary border-primary text-white shadow-md shadow-primary/20' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-20 gap-3">
          <Loader className="animate-spin text-primary w-10 h-10" />
          <p className="text-slate-500 font-bold text-sm">Cargando videoconferencias...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-8 rounded-3xl border border-red-100 text-center flex flex-col items-center">
          <AlertCircle className="w-12 h-12 mb-4" />
          <h3 className="text-lg font-bold">Error al cargar las clases</h3>
          <p className="text-sm mt-1">No pudimos conectar con el servidor. Por favor reintenta.</p>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="bg-white rounded-[2rem] shadow-soft border border-slate-100 p-16 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <VideoOff className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">No se encontraron clases</h2>
          <p className="text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
            {activeTab === 'live' 
              ? 'No hay ninguna clase transmitiendo en vivo en este preciso momento. Vuelve más tarde.'
              : 'No hay videoconferencias programadas que coincidan con tu búsqueda.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredClasses.map((liveClass, idx) => (
            <motion.div
              key={liveClass.item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.4) }}
              className={`bg-white rounded-3xl border shadow-soft overflow-hidden transition-all flex flex-col justify-between ${
                liveClass.isLiveNow 
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20' 
                  : 'border-slate-100'
              }`}
            >
              {/* Header inside card */}
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2.5 py-1 rounded-lg">
                    {liveClass.courseCode}
                  </span>
                  
                  {liveClass.isLiveNow ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-black animate-pulse uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-white"></span>
                      EN VIVO
                    </span>
                  ) : liveClass.isPast ? (
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-black uppercase tracking-wider">
                      Sesión Finalizada
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-black uppercase tracking-wider">
                      Programada
                    </span>
                  )}
                </div>

                {/* Course and Title */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 truncate mb-1">{liveClass.courseTitle}</h4>
                  <h3 className="font-black text-slate-800 text-lg leading-snug hover:text-primary transition-colors">
                    {liveClass.item.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase mt-1">
                    {liveClass.moduleTitle} • {liveClass.sectionTitle}
                  </p>
                </div>

                {/* Date & Time details */}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{formatMeetingTime(liveClass.startTime, liveClass.endTime)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${getPlatformColor(liveClass.platform)}`}>
                      {getPlatformLabel(liveClass.platform)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button at footer of card */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <div className="text-[10px] text-slate-400 font-medium">
                  {liveClass.isLiveNow 
                    ? '¡La sesión ya empezó! Únete de inmediato.' 
                    : liveClass.isPast 
                      ? 'Esta sesión ha concluido. Si fue grabada, el link estará disponible.'
                      : 'El enlace se activará para unirse en la hora indicada.'}
                </div>
                
                <a
                  href={liveClass.item.url ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black shadow-sm transition-all shrink-0 ${
                    liveClass.isLiveNow
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-600/20 active:scale-95'
                      : liveClass.isPast
                        ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        : 'bg-primary text-white hover:bg-primary-dark hover:shadow-primary/20'
                  }`}
                >
                  {liveClass.isPast ? 'Ver Grabación' : 'Unirse a Clase'}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
