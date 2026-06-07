import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, animate, useInView } from "motion/react";
import { 
  ArrowRight, BookOpen, Award, Users, FileText, GraduationCap, Star, 
  Quote, ChevronRight, ChevronLeft, Film, Sparkles, Play, X, Shield, 
  Target, Landmark, Check, HelpCircle, Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import { apiClient } from "../lib/apiClient";
import { sanitizeHtml } from "../lib/sanitizeHtml";

interface Section {
  id: string;
  type: string;
  enabled: boolean;
  content: any;
}

const resolveImgUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  if (url.startsWith('/storage')) return url;
  return `/storage/${url.replace(/^\/+/, '')}`;
};

const renderTitle = (rawTitle: string) => {
  if (!rawTitle) return null;
  const regex = /\{([^}]+)\}/g;
  const parts = rawTitle.split(regex);
  if (parts.length === 1) return rawTitle;

  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <span key={index} className="text-secondary italic font-serif">
          {part}
        </span>
      );
    }
    return part;
  });
};

/* ═══════════════════════════════════════════════════════════════════
   1. HERO SECTION (PREMIUM DESIGN WITH ROTATING GEOMETRY)
   ═══════════════════════════════════════════════════════════════════ */
const HeroSection = ({ content }: { content: any }) => {
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    apiClient.get('/api/v1/courses')
      .then(({ data }) => {
        const allCourses = data.data ?? data ?? [];
        setRecentCourses(allCourses.slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading || recentCourses.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % recentCourses.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [loading, recentCourses]);

  return (
    <section className="relative min-h-[95vh] lg:min-h-screen flex items-center bg-[#FAF9F6] overflow-hidden pt-36 pb-28">
      {/* Premium Ambient Background */}
      <div className="absolute inset-0 z-0">
        <img
          src={resolveImgUrl(content.bg_url || '/storage/hero/hero_law_bg.png')}
          alt="Background"
          className="w-full h-full object-cover opacity-[0.08] filter sepia-[0.1]"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#FAF9F6] via-[#FAF9F6]/95 to-white"></div>
        {/* Soft Colored Orbs */}
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[100px] pointer-events-none" />
        
        {/* Radial Dot Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(var(--color-primary)_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03] pointer-events-none"></div>

        {/* Andean Geometric Accents (Rombos Rotados de Marca) */}
        <div className="absolute top-[20%] left-[5%] w-24 h-24 border border-primary/10 rotate-45 rounded-2xl pointer-events-none hidden md:block" />
        <div className="absolute bottom-[15%] right-[8%] w-32 h-32 border-2 border-secondary/10 rotate-45 rounded-3xl pointer-events-none hidden md:block" />
        <div className="absolute top-[35%] right-[40%] w-12 h-12 border border-primary/5 rotate-45 pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Hero Content Left */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-6 space-y-8 text-left"
          >
            <div className="inline-flex items-center gap-2.5 bg-primary/5 border border-primary/10 rounded-full px-4.5 py-1.5 shadow-sm">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="font-sans text-[10px] sm:text-xs font-black text-primary uppercase tracking-[0.2em]">
                {content.badge || 'Excelencia Académica'}
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-slate-900 leading-[1.08] font-extrabold tracking-tight">
              {renderTitle(content.title || 'Forjando el Futuro de los {Profesionales}')}
            </h1>

            <p className="font-sans text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
              {content.description || 'Institución líder dedicada a la formación continua, ofreciendo programas académicos de vanguardia.'}
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link 
                to="/cursos" 
                className="bg-primary text-white border border-primary hover:bg-primary-dark hover:-translate-y-0.5 transition-all duration-300 rounded-full shadow-lg hover:shadow-primary/20 uppercase text-[10px] sm:text-xs font-extrabold tracking-widest px-9 py-4.5 flex items-center gap-2 group"
              >
                Ver Cursos <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button 
                onClick={() => document.getElementById('programs')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-2 border-slate-200 text-slate-800 hover:border-primary hover:bg-primary/5 rounded-full uppercase text-[10px] sm:text-xs font-extrabold tracking-widest px-9 py-4.5 transition-all duration-300"
              >
                Conocer Más
              </button>
            </div>

            {/* Micro Stats Banner */}
            <div className="pt-6 border-t border-slate-100 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xl sm:text-2xl font-black text-primary">100%</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Virtual / Híbrido</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-primary">Reg.</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Minedu / Sunedu</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-primary">QR</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Firma Digital</p>
              </div>
            </div>
          </motion.div>

          {/* Hero Slider Right */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-6 w-full flex justify-center"
          >
            <div className="relative w-full aspect-[4/3] max-w-xl rounded-[2.5rem] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.08)] border-4 border-white bg-slate-900 group">
              {/* Outer Glow Reflection */}
              <div className="absolute inset-0 border border-white/20 rounded-[2.5rem] pointer-events-none z-20" />
              
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950">
                  <div className="w-12 h-12 animate-spin rounded-full border-4 border-t-secondary border-white/15 mb-3" />
                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.25em]">Cargando Plataforma...</span>
                </div>
              ) : recentCourses.length === 0 ? (
                <div className="absolute inset-0 flex flex-col justify-center items-center p-8 text-center text-white bg-gradient-to-br from-primary to-slate-950">
                  <GraduationCap className="w-20 h-20 opacity-30 mb-5 text-secondary animate-bounce" />
                  <h3 className="text-xl font-bold font-display">Próximas Convocatorias</h3>
                  <p className="text-xs text-white/60 mt-2 max-w-xs leading-relaxed">Estamos preparando nuevos cursos con altos estándares académicos.</p>
                </div>
              ) : (
                <div className="absolute inset-0 w-full h-full">
                  <AnimatePresence mode="wait">
                    {recentCourses.map((course, idx) => (
                      idx === activeSlide && (
                        <motion.div
                          key={course.id}
                          initial={{ opacity: 0, scale: 0.97 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.03 }}
                          transition={{ duration: 0.6 }}
                          className="absolute inset-0 w-full h-full flex flex-col justify-between p-6 sm:p-9 text-white"
                        >
                          {/* Course Background Image */}
                          <div className="absolute inset-0 z-0">
                            {course.image_url ? (
                              <img
                                src={resolveImgUrl(course.image_url)}
                                alt=""
                                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-[6000ms]"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary to-slate-950 opacity-80" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-955 via-slate-950/60 to-black/30" />
                          </div>

                          {/* Slider Header */}
                          <div className="relative z-10 flex items-start justify-between">
                            <span className="bg-white/10 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full border border-white/20">
                              {course.category || 'Destacado'}
                            </span>
                            <span className="bg-secondary text-slate-900 text-[9px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full flex items-center gap-1 shadow">
                              <Sparkles className="w-3 h-3" /> Nuevo
                            </span>
                          </div>

                          {/* Floating review card on slider */}
                          <div className="absolute right-6 top-20 z-10 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-2xl flex items-center gap-1.5 pointer-events-none shadow-lg">
                            <Star className="w-3.5 h-3.5 text-secondary fill-secondary" />
                            <span className="text-[10px] font-bold text-white">4.9 (1.2k+ alumnos)</span>
                          </div>

                          {/* Slider Content Footer */}
                          <div className="relative z-10 text-left space-y-3.5 mt-auto">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-secondary font-black uppercase tracking-widest bg-secondary/10 px-2 py-0.5 rounded">
                                Certificado Oficial
                              </span>
                              {course.duration_weeks && (
                                <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider">
                                  • {course.duration_weeks} Semanas
                                </span>
                              )}
                            </div>
                            
                            <h3 className="text-white font-sans font-extrabold text-xl sm:text-2xl lg:text-3xl leading-snug drop-shadow-md">
                              {course.title}
                            </h3>

                            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                              <div>
                                <p className="text-[8px] text-white/50 uppercase tracking-widest font-bold">Inversión Única</p>
                                <span className="text-lg sm:text-xl font-black text-secondary">
                                  {course.price_label || 'S/ 0.00'}
                                </span>
                              </div>
                              <Link 
                                to={`/cursos/${course.slug || course.id}`}
                                className="text-[10px] sm:text-xs text-white font-black flex items-center gap-1.5 hover:underline bg-white/15 px-4.5 py-2.5 rounded-full hover:bg-white/25 transition-all"
                              >
                                Ficha Técnica <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      )
                    ))}
                  </AnimatePresence>

                  {/* Navigation dots */}
                  {recentCourses.length > 1 && (
                    <div className="absolute bottom-5 right-6 z-20 flex gap-1.5">
                      {recentCourses.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveSlide(idx)}
                          className={`h-1.5 rounded-full transition-all duration-300 ${activeSlide === idx ? 'w-5 bg-secondary' : 'w-1.5 bg-white/40'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   2. BENEFITS SECTION (PREMIUM GLASSMORPHIC TILES)
   ═══════════════════════════════════════════════════════════════════ */
const BenefitsSection = ({ content }: { content: any }) => {
  const cards = content.cards || [];

  return (
    <section className="py-28 bg-white px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Radial Grid */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-[radial-gradient(rgba(122,15,31,0.03)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20 space-y-4">
          <span className="font-sans text-[10px] font-black text-secondary uppercase tracking-[0.25em] bg-secondary/15 px-3 py-1 rounded-full">
            Propuesta de Valor
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-slate-900 font-extrabold tracking-tight">
            {content.title || 'Una Plataforma Diseñada para tu Éxito'}
          </h2>
          <div className="h-0.5 w-16 bg-primary mx-auto mt-4 rounded-full"></div>
          <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            {content.subtitle || 'Todo lo que necesitas para tu desarrollo profesional.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {cards.map((card: any, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: idx * 0.15, duration: 0.6 }}
              className="bg-[#FAF9F6]/80 backdrop-blur-md p-8 lg:p-10 rounded-[2rem] border border-slate-100 hover:border-primary/20 hover:shadow-[0_20px_50px_rgba(122,15,31,0.06)] hover:-translate-y-2 transition-all duration-500 relative group overflow-hidden"
            >
              {/* Andean diamond subtle bg icon on hover */}
              <div className="absolute right-[-10%] bottom-[-10%] w-24 h-24 bg-primary/[0.01] rotate-45 group-hover:bg-primary/[0.02] group-hover:scale-125 transition-all duration-500 rounded-2xl" />

              <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-8 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                {idx === 0 ? <BookOpen className="w-6 h-6" /> : idx === 1 ? <Users className="w-6 h-6" /> : <Award className="w-6 h-6" />}
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 font-sans">{card.title}</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-sans">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   3. STATS SECTION (COUNTERS WITH PREMIUM DESIGN)
   ═══════════════════════════════════════════════════════════════════ */
const AnimatedCounter = ({ from, to, prefix = "", suffix = "" }: { from: number, to: number, prefix?: string, suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView && ref.current) {
      const controls = animate(from, to, {
        duration: 2.2,
        ease: "easeOut",
        onUpdate(value) {
          if (ref.current) {
            ref.current.textContent = prefix + Math.floor(value).toLocaleString() + suffix;
          }
        }
      });
      return () => controls.stop();
    }
  }, [inView, from, to, prefix, suffix]);

  return <span ref={ref}>{prefix}{from}{suffix}</span>;
};

const StatsSection = ({ content }: { content: any }) => {
  const stats = [
    { label: "Estudiantes", value: <AnimatedCounter from={0} to={parseInt(content.students_count || "5000")} prefix="+" />, icon: <Users className="w-5 h-5 text-secondary" /> },
    { label: "Cursos Activos", value: <AnimatedCounter from={0} to={parseInt(content.courses_count || "50")} prefix="+" />, icon: <FileText className="w-5 h-5 text-secondary" /> },
    { label: "Docentes Expertos", value: <AnimatedCounter from={0} to={parseInt(content.teachers_count || "25")} prefix="+" />, icon: <GraduationCap className="w-5 h-5 text-secondary" /> },
    { label: "Satisfacción", value: <AnimatedCounter from={0} to={parseInt(content.satisfaction_percent || "98")} suffix="%" />, icon: <Star className="w-5 h-5 text-secondary" /> }
  ];

  return (
    <section className="py-20 bg-[#FAF9F6] px-6 lg:px-8 border-y border-[#EAE3D2] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(rgba(122,15,31,0.015)_1px,transparent_1px)] [background-size:20px_20px]" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 divide-y-0 divide-[#EAE3D2]">
          {stats.map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="flex flex-col items-center text-center p-6 bg-white/40 backdrop-blur-sm border border-white/60 rounded-3xl shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                {stat.icon}
              </div>
              <span className="font-display text-4xl sm:text-5xl font-black text-primary mb-2">
                {stat.value}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] font-sans">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   4. MISSION & VISION (ASYMMETRIC GRAPHIC BOXES)
   ═══════════════════════════════════════════════════════════════════ */
const MissionVisionSection = ({ content }: { content: any }) => {
  const items = [
    { title: content.mision_title || "Misión", desc: content.mision_desc, icon: <Target className="w-6 h-6 text-primary" /> },
    { title: content.vision_title || "Visión", desc: content.vision_desc, icon: <Eye className="w-6 h-6 text-primary" /> },
    { title: content.valores_title || "Valores", desc: content.valores_desc, icon: <Shield className="w-6 h-6 text-primary" /> }
  ];

  return (
    <section className="py-28 bg-slate-50 px-6 lg:px-8 border-b border-slate-100 relative overflow-hidden">
      <div className="absolute left-[-5%] top-[10%] w-48 h-48 border border-slate-200/40 rotate-45 rounded-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20 space-y-4">
          <span className="font-sans text-[10px] font-black text-primary uppercase tracking-[0.25em] bg-primary/5 px-3 py-1 rounded-full">
            Identidad y Valores
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-slate-900 font-extrabold tracking-tight">
            {content.title || "Institución de Excelencia"}
          </h2>
          <div className="h-0.5 w-16 bg-secondary mx-auto mt-4"></div>
          {content.description && (
            <p className="text-slate-500 text-sm max-w-xl mx-auto leading-relaxed">
              {content.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {items.map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="bg-white p-8 lg:p-10 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden group"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 font-sans">{item.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   5. ACADEMIC PROGRAMS (PREMIUM DYNAMIC GRIDS)
   ═══════════════════════════════════════════════════════════════════ */
const ProgramsSection = ({ content }: { content: any }) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/api/v1/courses')
      .then(({ data }) => {
        const allCourses = data.data ?? data ?? [];
        setCourses(allCourses.slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="programs" className="py-28 bg-white px-6 lg:px-8 border-b border-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <span className="font-sans text-[10px] font-black text-secondary uppercase tracking-[0.25em] bg-secondary/15 px-3 py-1 rounded-full">
            Catálogo Vigente
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-slate-900 font-extrabold tracking-tight">
            {content.title || "Programas Académicos"}
          </h2>
          <div className="h-0.5 w-16 bg-primary mx-auto mt-4"></div>
          {content.subtitle && (
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              {content.subtitle}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 animate-spin rounded-full border-4 border-t-primary border-slate-200" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
            <GraduationCap className="w-14 h-14 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-xs italic">No hay programas disponibles en este momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {courses.map((course, idx) => (
              <motion.div 
                key={course.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500 flex flex-col group h-full"
              >
                <Link to={`/cursos/${course.slug || course.id}`} className="flex flex-col h-full">
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                    {course.image_url ? (
                      <img 
                        src={resolveImgUrl(course.image_url)} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-slate-950 flex items-center justify-center"><GraduationCap className="w-12 h-12 text-white/30" /></div>
                    )}
                    {/* Floating Label */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
                    <span className="absolute top-4 left-4 bg-white/10 backdrop-blur-md text-white border border-white/25 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                      {course.category || 'General'}
                    </span>
                  </div>

                  <div className="p-6 sm:p-8 text-left flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      <p className="text-[9px] text-secondary font-black uppercase tracking-widest bg-secondary/10 px-2 py-0.5 rounded w-fit">
                        {course.duration_weeks ? `${course.duration_weeks} Semanas` : 'Auto-Estudio'}
                      </p>
                      <h4 className="font-sans font-extrabold text-base sm:text-lg text-slate-800 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {course.title}
                      </h4>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-slate-50 mt-auto">
                      <div>
                        <p className="text-[8px] text-slate-400 uppercase tracking-widest font-bold">Inversión</p>
                        <span className="text-base font-black text-secondary">{course.price_label || 'S/ 0.00'}</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-primary flex items-center gap-1.5 hover:underline bg-primary/5 px-3.5 py-2 rounded-full">
                        Matricularse <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   6. SPECIALTIES SECTION (PREMIUM GRAPHICS)
   ═══════════════════════════════════════════════════════════════════ */
const SpecialtiesSection = ({ content }: { content: any }) => {
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/api/v1/specialties')
      .then(({ data }) => {
        setSpecialties((data.data ?? data ?? []).slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-28 bg-slate-50 px-6 lg:px-8 border-b border-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <span className="font-sans text-[10px] font-black text-primary uppercase tracking-[0.25em] bg-primary/5 px-3 py-1 rounded-full">
            Especialización
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-slate-900 font-extrabold tracking-tight">
            {content.title || "Especialidades y Rutas de Aprendizaje"}
          </h2>
          <div className="h-0.5 w-16 bg-secondary mx-auto mt-4"></div>
          {content.subtitle && (
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              {content.subtitle}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 animate-spin rounded-full border-4 border-t-primary border-slate-200" />
          </div>
        ) : specialties.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2rem] border border-dashed border-slate-200">
            <Landmark className="w-14 h-14 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-xs italic">No hay especialidades disponibles.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {specialties.map((spec, idx) => (
              <motion.div 
                key={spec.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500 flex flex-col group"
              >
                <div className="h-44 bg-slate-100 relative overflow-hidden">
                  {spec.image_url ? (
                    <img 
                      src={resolveImgUrl(spec.image_url)} 
                      alt="" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-primary/45">
                      <Landmark className="w-14 h-14" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                </div>
                <div className="p-8 text-left space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h4 className="font-sans font-extrabold text-base sm:text-lg text-slate-900 leading-snug group-hover:text-secondary transition-colors line-clamp-2">
                      {spec.name}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed font-sans">
                      {spec.description}
                    </p>
                  </div>
                  <Link 
                    to={`/especialidades/${spec.slug || spec.id}`} 
                    className="text-xs font-black text-secondary flex items-center gap-1 hover:underline pt-4 border-t border-slate-50 group/link mt-auto w-fit"
                  >
                    Ver Especialidad <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   7. TESTIMONIALS SECTION (WITH MODAL AND VIDEO PLAYER)
   ═══════════════════════════════════════════════════════════════════ */
const TestimonialsSection = ({ content }: { content: any }) => {
  const list = content.list || [];
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);

  if (list.length === 0) return null;

  return (
    <section className="py-28 bg-[#FAF9F6] px-6 lg:px-8 border-b border-[#EAE3D2] relative overflow-hidden">
      {/* Visual diamonds ornament */}
      <div className="absolute top-[10%] right-[5%] w-16 h-16 border border-slate-200 rotate-45 pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center space-y-10 relative z-10">
        <div className="space-y-4">
          <span className="font-sans text-[10px] font-black text-secondary uppercase tracking-[0.25em] bg-secondary/15 px-3 py-1 rounded-full">
            Testimonios
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-slate-900 font-extrabold tracking-tight">
            {content.title || "Lo que dicen nuestros estudiantes"}
          </h2>
          <div className="h-0.5 w-16 bg-primary mx-auto mt-4"></div>
          {content.subtitle && (
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              {content.subtitle}
            </p>
          )}
        </div>
        
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIdx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="bg-white p-8 sm:p-14 rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] space-y-8 text-left relative overflow-hidden"
            >
              {/* Giant quote decorator */}
              <Quote className="w-16 h-16 text-primary/[0.03] absolute top-8 left-8 pointer-events-none" />
              
              <p className="text-base sm:text-xl text-slate-700 italic leading-relaxed pt-2 font-serif relative z-10">
                "{list[activeIdx]?.quote}"
              </p>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-6 border-t border-slate-50 relative z-10">
                <div className="flex items-center gap-4">
                  {list[activeIdx]?.image_url ? (
                    <img 
                      src={list[activeIdx].image_url} 
                      alt={list[activeIdx].name} 
                      className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black uppercase text-sm">
                      {list[activeIdx]?.name?.[0] || 'A'}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-extrabold text-slate-900 font-sans">{list[activeIdx]?.name}</p>
                    <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider font-sans mt-0.5">{list[activeIdx]?.role}</p>
                  </div>
                </div>

                {list[activeIdx]?.video_url && (
                  <button 
                    onClick={() => setSelectedVideoUrl(list[activeIdx].video_url)}
                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white bg-slate-900 hover:bg-slate-800 px-5 py-3 rounded-full transition-all shadow-md shrink-0 self-start sm:self-auto group"
                  >
                    <Play className="w-3.5 h-3.5 text-secondary fill-secondary group-hover:scale-110 transition-transform" /> 
                    Ver Testimonio
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {list.length > 1 && (
          <div className="flex justify-center gap-2">
            {list.map((_: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveIdx(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${activeIdx === idx ? 'w-8 bg-secondary' : 'w-2 bg-slate-300'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Video Modal Overlay */}
      <AnimatePresence>
        {selectedVideoUrl && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-black rounded-3xl overflow-hidden max-w-3xl w-full aspect-video relative shadow-2xl border border-white/10"
            >
              <button 
                onClick={() => setSelectedVideoUrl(null)}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 z-10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <video 
                src={selectedVideoUrl} 
                controls 
                autoPlay 
                className="w-full h-full object-contain"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   8. CONVENIOS SECTION (INFINITE LINEAR SCROLL MARQUEE)
   ═══════════════════════════════════════════════════════════════════ */
const ConveniosSection = ({ content }: { content: any }) => {
  const logos = content.logos || [];

  if (logos.length === 0) return null;

  // Repeat logos to guarantee infinite scrolling width
  let repeatedLogos = [...logos];
  while (repeatedLogos.length < 12) {
    repeatedLogos = [...repeatedLogos, ...logos];
  }

  const getFullUrl = (filename: string) => {
    if (filename.startsWith('http') || filename.startsWith('blob:') || filename.startsWith('/storage')) {
      return filename;
    }
    return `/convenios/${filename}`;
  };

  return (
    <section className="py-24 bg-white overflow-hidden border-b border-slate-100">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-smooth {
          display: flex;
          width: max-content;
          animation: marquee 35s linear infinite;
        }
        .animate-marquee-smooth:hover {
          animation-play-state: paused;
        }
      `}} />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center mb-12 space-y-3">
        <span className="font-sans text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Respaldo Institucional</span>
        <h2 className="font-display text-xl sm:text-2xl text-slate-800 font-extrabold tracking-widest uppercase">
          NUESTROS AVALES Y CONVENIOS
        </h2>
        <div className="h-0.5 w-16 bg-secondary mx-auto mt-2.5 rounded-full"></div>
      </div>

      <div className="relative w-full overflow-hidden flex py-4">
        {/* Soft edge masking shadow */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />

        {/* Double-listed marquee wrapper */}
        <div className="animate-marquee-smooth gap-16 items-center">
          {repeatedLogos.concat(repeatedLogos).map((filename, index) => (
            <div key={index} className="flex items-center justify-center w-40 h-20 shrink-0 select-none px-4">
              <img
                src={getFullUrl(filename)}
                alt="Logo convenio"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLElement).style.display = 'none';
                }}
                className="max-w-full max-h-full object-contain filter grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300 cursor-pointer"
                draggable="false"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   9. FAQ SECTION (MODERN INTERACTIVE ACCORDIONS)
   ═══════════════════════════════════════════════════════════════════ */
const FaqItem = ({ faq }: { faq: any }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-[#FAF9F6]/50 border border-slate-100 hover:border-secondary/20 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 text-left font-extrabold text-slate-800 text-sm sm:text-base select-none transition-colors hover:text-primary"
      >
        <span className="font-sans leading-snug pr-4">{faq.question}</span>
        <div className={`p-1 bg-white border border-slate-100 rounded-full shrink-0 transition-transform duration-300 ${open ? 'rotate-90 text-secondary border-secondary/20 bg-secondary/5' : 'text-slate-400'}`}>
          <ChevronRight className="w-4 h-4" />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-6 pt-0 text-xs sm:text-sm text-slate-500 border-t border-slate-100/50 leading-relaxed font-sans bg-white/40">
              {faq.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FaqSection = ({ content }: { content: any }) => {
  const list = content.list || [];

  return (
    <section className="py-28 bg-white px-6 lg:px-8 border-b border-slate-100 relative">
      <div className="max-w-3xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <span className="font-sans text-[10px] font-black text-primary uppercase tracking-[0.25em] bg-primary/5 px-3 py-1 rounded-full">Dudas Frecuentes</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-slate-900 font-extrabold tracking-tight">
            {content.title || 'Preguntas Frecuentes'}
          </h2>
          <div className="h-0.5 w-16 bg-secondary mx-auto mt-4"></div>
          {content.subtitle && (
            <p className="text-slate-500 text-sm max-w-xl mx-auto leading-relaxed">
              {content.subtitle}
            </p>
          )}
        </div>

        {list.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs italic">No hay preguntas configuradas.</div>
        ) : (
          <div className="space-y-4 text-left">
            {list.map((faq: any, idx: number) => (
              <FaqItem key={idx} faq={faq} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   10. CTA SECTION (STUNNING HIGH-CONTRAST GRADIENT)
   ═══════════════════════════════════════════════════════════════════ */
const CtaSection = ({ content }: { content: any }) => {
  return (
    <section className="py-12 bg-white px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto bg-gradient-to-br from-primary-dark via-primary to-slate-950 text-white rounded-[3rem] px-8 py-20 sm:py-24 text-center relative overflow-hidden shadow-2xl">
        {/* Glow ambient blobs inside the CTA */}
        <div className="absolute top-[-50%] left-[-20%] w-[350px] h-[350px] bg-secondary/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-30%] right-[-10%] w-[400px] h-[400px] bg-slate-900/60 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-2xl mx-auto space-y-10 relative z-10">
          <div className="inline-flex items-center gap-1 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-secondary animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Convocatoria Abierta</span>
          </div>

          <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight">
            {content.title}
          </h2>
          
          <p className="text-white/70 text-sm sm:text-base leading-relaxed max-w-md mx-auto font-sans">
            {content.desc}
          </p>

          <div className="pt-4">
            <Link 
              to={content.btn_url || '/login'}
              className="inline-flex items-center gap-2 bg-secondary text-slate-900 px-10 py-4.5 rounded-full font-black text-xs sm:text-sm uppercase tracking-widest shadow-xl hover:bg-white hover:text-primary-dark hover:-translate-y-0.5 transition-all duration-300"
            >
              {content.btn_text || 'Empezar'} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   11. CUSTOM HTML SECTION
   ═══════════════════════════════════════════════════════════════════ */
const CustomHtmlSection = ({ content }: { content: any }) => {
  return (
    <section className="py-20 bg-white px-6 lg:px-8 border-b border-slate-100">
      <div className="max-w-7xl mx-auto">
        {content.title && (
          <div className="text-center mb-10 space-y-3">
            <h2 className="font-sans text-xl font-bold text-slate-800 uppercase tracking-widest">{content.title}</h2>
            <div className="h-0.5 w-12 bg-secondary mx-auto mt-2.5 rounded-full" />
          </div>
        )}
        <div 
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.html_content) }}
          className="mx-auto font-sans text-slate-600 leading-relaxed"
        />
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN HOMELEGACY RENDERER
   ═══════════════════════════════════════════════════════════════════ */
export default function HomeLegacy() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/api/v1/settings/hero')
      .then(({ data }) => {
        if (data.data?.home_landing_sections) {
          setSections(data.data.home_landing_sections);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6]">
        <div className="w-12 h-12 animate-spin rounded-full border-4 border-t-primary border-slate-200 mb-4" />
        <span className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">Cargando Academia...</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-white selection:bg-primary selection:text-white overflow-hidden">
      {sections.map(section => {
        if (!section.enabled) return null;

        switch (section.type) {
          case 'hero':
            return <HeroSection key={section.id} content={section.content} />;
          case 'benefits':
            return <BenefitsSection key={section.id} content={section.content} />;
          case 'stats':
            return <StatsSection key={section.id} content={section.content} />;
          case 'mission_vision':
            return <MissionVisionSection key={section.id} content={section.content} />;
          case 'programs':
            return <ProgramsSection key={section.id} content={section.content} />;
          case 'specialties':
            return <SpecialtiesSection key={section.id} content={section.content} />;
          case 'testimonials':
            return <TestimonialsSection key={section.id} content={section.content} />;
          case 'convenios':
            return <ConveniosSection key={section.id} content={section.content} />;
          case 'faq':
            return <FaqSection key={section.id} content={section.content} />;
          case 'cta':
            return <CtaSection key={section.id} content={section.content} />;
          case 'custom_html':
            return <CustomHtmlSection key={section.id} content={section.content} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
