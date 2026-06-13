import { motion } from "motion/react";
import {
  BookOpen, Users, Video, FolderOpen, ClipboardCheck,
  BarChart2, Award, Layers, ArrowRight, CheckCircle,
  Sparkles, Monitor, FileText, Star, Zap, Target,
  Search, Loader, GraduationCap
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { apiClient } from "../lib/apiClient";
import { hasActiveTenant } from "../lib/tenant";
import { logger } from "../lib/logger";
import Tilt3D from "../components/Tilt3D";

/* ═══════════════════════════════════════════════════════════════════
   COURSES SHOWCASE — SaaS Feature Page
   Explains how the course system works, implementation, and results.
   ═══════════════════════════════════════════════════════════════════ */

const CourseHero = () => {
  const float = (duration: number, distance: number, delay = 0) => ({
    animate: { y: [0, -distance, 0] },
    transition: { duration, delay, repeat: Infinity, ease: "easeInOut" as const },
  });

  return (
    <section className="relative bg-gradient-to-br from-[#1c1507] via-[#856524] to-[#2d220a] pt-40 pb-32 px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />
      <div className="absolute top-20 right-20 w-72 h-72 bg-white/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column: Text and Button */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.7 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-white text-[11px] font-black uppercase tracking-widest">
                Sistema de Cursos
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-white font-extrabold mb-6 tracking-tight leading-tight">
              Gestión de <span className="text-white italic">Cursos</span>
              <br />profesional y escalable
            </h1>
            <p className="font-sans text-lg lg:text-xl text-white/70 max-w-2xl leading-relaxed mb-8">
              Crea, organiza y vende cursos con módulos, materiales multimedia, cuestionarios automáticos y certificación integrada — todo desde un panel intuitivo.
            </p>
            <Link to="/crear-aula" className="inline-flex items-center gap-2 bg-white text-[#2a1d07] px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest shadow-lg shadow-white/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
              Crear Mi Primer Curso <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Right Column: 3D Course Viewer Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block relative"
          >
            <Tilt3D maxTilt={6}>
              <div className="relative" style={{ transformStyle: "preserve-3d" }}>
                {/* Main Classroom Viewer Mockup */}
                <motion.div
                  {...float(7, 10)}
                  className="bg-white/[0.08] backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl"
                >
                  {/* Mockup Header bar */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                    </div>
                    <div className="flex-1 h-6 bg-white/5 rounded-md flex items-center px-3">
                      <span className="text-[9px] text-white/30 font-medium">aula.miacademia.eduwanka.pe/cursos</span>
                    </div>
                  </div>

                  {/* Mockup Classroom Content */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black text-accent uppercase tracking-widest">Diplomado de Especialización</span>
                      <h4 className="text-white font-extrabold text-sm line-clamp-1 leading-snug">Gestión Pública y Modernización</h4>
                    </div>

                    {/* Progress indicator */}
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-white/60 font-semibold">Tu Progreso</span>
                        <span className="text-accent font-black">75% Completado</span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full w-3/4" />
                      </div>
                    </div>

                    {/* Class List items */}
                    <div className="space-y-2">
                      {[
                        { title: "Módulo 1: Estructura del Estado", active: false, done: true },
                        { title: "Módulo 2: Planificación Estratégica", active: false, done: true },
                        { title: "Módulo 3: Contrataciones del Estado", active: true, done: false },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                            item.active
                              ? "bg-accent/15 border-accent/40 text-white"
                              : "bg-white/[0.02] border-white/5 text-white/60"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                            item.done
                              ? "bg-accent/20 text-accent"
                              : item.active
                              ? "bg-accent text-[#1a0507]"
                              : "bg-white/10 text-white/40"
                          }`}>
                            {item.done ? "✓" : item.active ? "▶" : "○"}
                          </div>
                          <span className="truncate flex-1">{item.title}</span>
                          {item.active && (
                            <span className="text-[8px] bg-accent/20 text-accent font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                              En Vivo
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Floating card 1: Teacher Assigned */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="absolute -bottom-6 -left-10 max-w-[200px]"
                  style={{ z: 30, transformStyle: "preserve-3d" }}
                >
                  <motion.div
                    {...float(5, 7, 0.3)}
                    className="bg-white rounded-2xl shadow-2xl p-3.5 border border-slate-100 flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-black shrink-0">
                      DR
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-800 leading-tight">Dr. Carlos Mendoza</p>
                      <p className="text-[8px] text-slate-400 font-semibold mt-0.5">Docente Principal</p>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Floating card 2: Quiz Score / Grade */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="absolute -top-6 -right-6 max-w-[190px]"
                  style={{ z: 40, transformStyle: "preserve-3d" }}
                >
                  <motion.div
                    {...float(6, 8, 0.9)}
                    className="bg-white rounded-2xl shadow-2xl p-3.5 border border-slate-100 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 bg-accent/15 rounded-xl flex items-center justify-center shrink-0 text-accent">
                      <CheckCircle className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-800 leading-tight">Evaluación Final</p>
                      <p className="text-[9px] text-accent font-black mt-0.5">Aprobado · 18/20</p>
                    </div>
                  </motion.div>
                </motion.div>

              </div>
            </Tilt3D>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

const CourseFeatures = () => {
  const features = [
    { icon: <Layers className="w-6 h-6" />, title: "Módulos y Secciones", desc: "Organiza tu contenido en módulos tipo Moodle con secciones, items de contenido y progreso secuencial.", color: "bg-blue-50 text-blue-600" },
    { icon: <Video className="w-6 h-6" />, title: "Clases en Vivo", desc: "Integra videollamadas en vivo con enlace directo desde el aula virtual. Los alumnos acceden con un clic.", color: "bg-purple-50 text-purple-600" },
    { icon: <FolderOpen className="w-6 h-6" />, title: "Materiales Multimedia", desc: "Sube PDFs, videos, presentaciones y documentos. Organiza por unidades y sesiones con descarga controlada.", color: "bg-green-50 text-green-600" },
    { icon: <ClipboardCheck className="w-6 h-6" />, title: "Cuestionarios y Tareas", desc: "Crea evaluaciones con preguntas de opción múltiple, verdadero/falso y abiertas. Calificación automática.", color: "bg-orange-50 text-orange-600" },
    { icon: <Users className="w-6 h-6" />, title: "Asistencia Digital", desc: "Registra asistencia por sesión con códigos QR. Historial completo y reportes exportables.", color: "bg-indigo-50 text-indigo-600" },
    { icon: <Award className="w-6 h-6" />, title: "Certificación Automática", desc: "Genera certificados PDF con diseño personalizable, QR verificable y firma institucional al aprobar el curso.", color: "bg-accent/10 text-accent" },
  ];

  return (
    <section className="py-24 md:py-32 bg-[#F9F6F0] px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="font-display text-3xl md:text-5xl text-slate-900 font-extrabold mb-4 tracking-tight">
            ¿Qué incluye cada <span className="text-primary">curso</span>?
          </motion.h2>
          <p className="font-sans text-lg text-slate-500 max-w-2xl mx-auto">
            Cada aula viene equipada con herramientas profesionales para la enseñanza online.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl p-7 border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-400 group">
              <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                {f.icon}
              </div>
              <h3 className="font-sans text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
              <p className="font-sans text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CourseImplementation = () => (
  <section className="py-24 md:py-32 bg-white px-6 lg:px-8">
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-full text-primary text-[11px] font-black uppercase tracking-widest mb-6">
            <Target className="w-3.5 h-3.5" /> Implementación
          </div>
          <h2 className="font-display text-3xl md:text-4xl text-slate-900 font-extrabold mb-6 tracking-tight">
            De cero a publicado en <span className="text-primary italic">menos de 1 hora</span>
          </h2>
          <div className="space-y-6">
            {[
              { step: "1", title: "Crea el curso", desc: "Define título, categoría, precio, duración y sube una imagen de portada desde el panel admin." },
              { step: "2", title: "Agrega contenido", desc: "Organiza módulos con secciones, materiales PDF/video, cuestionarios y tareas evaluables." },
              { step: "3", title: "Configura certificados", desc: "Diseña tu plantilla de certificado con logo, firma digital y código QR de verificación." },
              { step: "4", title: "Publica y vende", desc: "Activa el curso y comparte el enlace. Los alumnos se matriculan y pagan directamente." },
            ].map((s, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-black shrink-0">{s.step}</div>
                <div>
                  <h4 className="font-sans font-bold text-slate-900 mb-1">{s.title}</h4>
                  <p className="font-sans text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <Tilt3D maxTilt={10} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-8 border border-slate-200">
          <div style={{ transformStyle: "preserve-3d" }}>
          {/* Mockup of course editor */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden"
            style={{ z: 30, transformStyle: "preserve-3d" }}
          >
            <div className="bg-primary px-5 py-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-white/80" />
              <span className="text-white text-sm font-bold">Editor de Curso</span>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1">
                  <div className="h-3 bg-slate-200 rounded w-3/4 mb-2" />
                  <div className="h-2 bg-slate-100 rounded w-1/2" />
                </div>
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8, type: "spring", stiffness: 300, damping: 15 }}
                  className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-1 rounded uppercase"
                >
                  Publicado
                </motion.span>
              </div>
              {["Módulo 1: Introducción", "Módulo 2: Marco Normativo", "Módulo 3: Casos Prácticos"].map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.18, duration: 0.45, ease: "easeOut" }}
                  className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Layers className="w-4 h-4 text-primary/50" />
                  <span className="text-xs font-medium text-slate-600 flex-1">{m}</span>
                  <span className="text-[9px] text-slate-400">{3 + i} items</span>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 1 }}
                className="flex items-center justify-between pt-3 border-t border-slate-100"
              >
                <span className="text-xs text-slate-400 font-medium">3 módulos · 12 secciones</span>
                <span className="text-xs font-black text-primary">S/ 450.00</span>
              </motion.div>
            </div>
          </motion.div>
          </div>
          </Tilt3D>
        </motion.div>
      </div>
    </div>
  </section>
);

const CourseResults = () => (
  <section className="py-24 md:py-32 bg-gradient-to-br from-[#1a0507] via-[#7A0F1F] to-[#2a0509] px-6 lg:px-8 relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
    <div className="absolute top-10 left-20 w-64 h-64 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

    <div className="max-w-7xl mx-auto relative z-10">
      <div className="text-center mb-16">
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="font-display text-3xl md:text-5xl text-white font-extrabold mb-6 tracking-tight">
          Resultados que <span className="text-accent italic">hablan</span>
        </motion.h2>
        <p className="font-sans text-lg text-white/50 max-w-xl mx-auto">
          Instituciones reales que transformaron su educación con EduWanka.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { metric: "+1,200", label: "Alumnos matriculados", desc: "En los primeros 3 meses de una institución promedio", icon: <Users className="w-5 h-5" /> },
          { metric: "S/ 85K+", label: "Ingresos generados", desc: "Promedio mensual de academias con plan Profesional", icon: <BarChart2 className="w-5 h-5" /> },
          { metric: "98%", label: "Tasa de satisfacción", desc: "De los administradores que usan la plataforma", icon: <Star className="w-5 h-5" /> },
        ].map((r, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className="bg-white/[0.06] backdrop-blur-sm rounded-2xl p-8 border border-white/10 text-center hover:bg-white/[0.1] transition-all">
            <div className="w-12 h-12 bg-accent/15 rounded-xl flex items-center justify-center mx-auto mb-5 text-accent">{r.icon}</div>
            <p className="text-4xl font-black text-white mb-2">{r.metric}</p>
            <p className="text-sm font-bold text-accent uppercase tracking-widest mb-2">{r.label}</p>
            <p className="text-xs text-white/40">{r.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-16">
        <Link to="/crear-aula" className="inline-flex items-center gap-2 bg-accent text-[#1a0507] px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest shadow-lg shadow-accent/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          Crear Mi Aula Ahora <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  </section>
);

const TenantCoursesList = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    apiClient.get('/api/v1/courses')
      .then(({ data }) => {
        const allCourses = data.data ?? data ?? [];
        setCourses(allCourses);
      })
      .catch(err => logger.error("Error loading courses:", err))
      .finally(() => setLoading(false));
  }, []);

  const resolveImgUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    if (url.startsWith('/storage')) return url;
    return `/storage/${url.replace(/^\/+/, '')}`;
  };

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (course.category && course.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#F9F6F0] pt-32 pb-24 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 border border-primary/10 rounded-full text-primary text-[11px] font-black uppercase tracking-widest mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Nuestros Programas
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-3xl md:text-5xl text-slate-900 font-extrabold mb-6 tracking-tight"
          >
            Explora nuestra <span className="text-primary">oferta académica</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-sans text-lg text-slate-500 max-w-2xl mx-auto mb-10"
          >
            Diplomados y cursos de alta especialización diseñados para potenciar tu perfil profesional.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="relative max-w-md mx-auto"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre de curso o categoría..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-primary p-4 pl-12 rounded-2xl font-sans font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 shadow-sm"
            />
          </motion.div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader className="w-10 h-10 animate-spin text-secondary mb-4" />
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Cargando programas...</span>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-12 max-w-xl mx-auto text-center shadow-soft">
            <div className="w-16 h-16 rounded-full bg-primary/5 border border-primary/10 text-slate-400 flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="font-sans font-bold text-slate-800 text-lg mb-2">No se encontraron cursos</h3>
            <p className="font-serif text-slate-500 text-sm">
              {searchQuery ? "Intenta buscando con palabras clave diferentes." : "Próximamente publicaremos nuevos programas académicos."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-lg border border-slate-200 bg-slate-950 group select-none hover:shadow-2xl transition-all duration-300"
              >
                <Link to={`/cursos/${course.slug || course.id}`} className="absolute inset-0 z-0 group/slide">
                  <div className="absolute inset-0 z-0">
                    {course.image_url ? (
                      <img
                        src={resolveImgUrl(course.image_url)}
                        alt=""
                        className="w-full h-full object-cover opacity-70 group-hover/slide:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-slate-900 opacity-60"></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20"></div>
                  </div>

                  <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover/slide:opacity-100 transition-opacity duration-300 z-10 pointer-events-none"></div>

                  <div className="absolute inset-0 flex flex-col justify-between p-5 z-15">
                    <div className="flex items-start justify-between gap-4">
                      <span className="bg-white/15 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded border border-white/10">
                        {course.category || 'General'}
                      </span>
                      <span className="bg-secondary text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded">
                        {course.type || 'CURSO OFICIAL'}
                      </span>
                    </div>

                    <div className="self-center my-auto flex flex-col items-center group/play opacity-0 group-hover/slide:opacity-100 transition-opacity duration-300">
                      <div className="w-12 h-12 rounded-full bg-secondary text-white flex items-center justify-center shadow-2xl group-hover/slide:bg-amber-500 group-hover/slide:scale-110 transition-all duration-300">
                        <GraduationCap className="w-5 h-5 fill-white translate-y-[-1px] translate-x-[0.5px]" />
                      </div>
                      <span className="text-white text-[9px] font-black uppercase tracking-widest mt-2.5 drop-shadow-md">
                        Ver Detalles
                      </span>
                    </div>

                    <div className="text-left space-y-1.5 mt-auto">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-secondary font-black uppercase tracking-widest">
                          Metodología Activa
                        </span>
                        {course.duration_weeks && (
                          <>
                            <span className="text-[9px] text-white/40">•</span>
                            <span className="text-[9px] text-white/70 font-bold uppercase tracking-wider">
                              {course.duration_weeks} SEMANAS
                            </span>
                          </>
                        )}
                      </div>
                      
                      <h3 className="text-white font-sans font-extrabold text-sm sm:text-base drop-shadow-md line-clamp-2 leading-snug group-hover/slide:text-secondary transition-colors">
                        {course.title}
                      </h3>

                      <div className="flex items-center justify-between pt-2 border-t border-white/15 mt-2">
                        <span className="text-xs font-black text-secondary tracking-wide">
                          {course.price_label || 'S/ 0.00'}
                        </span>
                        <span className="text-[9px] text-white font-extrabold flex items-center gap-1 group-hover/slide:underline">
                          Ver Detalles <ArrowRight className="w-3 h-3 translate-y-[0.5px] group-hover/slide:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function Courses() {
  const isTenant = hasActiveTenant();

  if (isTenant) {
    return <TenantCoursesList />;
  }

  return (
    <div>
      <CourseHero />
      <CourseFeatures />
      <CourseImplementation />
      <CourseResults />
    </div>
  );
}
