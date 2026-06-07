import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, Target, CheckCircle2, Users, BookOpen, 
  GraduationCap, ChevronRight, Star, Clock, Gavel, 
  Award, DollarSign, Calendar, ChevronDown, Check,
  HelpCircle, Phone, FileText, Shield, Laptop, 
  Zap, Users2, Send, CreditCard, ChevronUp, Loader2, ImageOff
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/apiClient";

/* ─── Helpers ───────────────────────────────────────────────────── */
const resolveImg = (url?: string | null): string | null => {
  if (!url) return null;

  // Map missing seeder local cover images to high-quality public unsplash images
  if (url.includes('arbitros_cover.png')) {
    return "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1200";
  }
  if (url.includes('peritos_cover.png')) {
    return "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=1200";
  }
  if (url.includes('conciliadores_cover.png')) {
    return "https://images.unsplash.com/photo-1521791136064-7986c295944b?auto=format&fit=crop&q=80&w=1200";
  }

  if (url.startsWith('http') || url.startsWith('/storage')) return url;
  return `/storage/${url.replace(/^\/+/, '')}`;
};

const SECTIONS = [
  { id: "presentacion", label: "Presentación" },
  { id: "metodologia", label: "Metodología & Herramientas" },
  { id: "perfil", label: "Perfil del Egresado" },
  { id: "acreditaciones", label: "Acreditaciones" },
  { id: "temario", label: "Malla Curricular" },
  { id: "docentes", label: "Plana Docente" },
  { id: "inversion", label: "Inversión" },
  { id: "inscripcion", label: "Inscripción" }
];

export default function EspecialidadDetail() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<string>("presentacion");
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({ 1: true });
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSticky, setIsSticky] = useState<boolean>(false);

  const navRef = useRef<HTMLDivElement>(null);
  const tabContainerRef = useRef<HTMLDivElement>(null);

  // Fetch dynamic specialty data
  const { data: responseData, isLoading, isError } = useQuery({
    queryKey: ["specialty", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await apiClient.get(`/api/v1/specialties/${encodeURIComponent(id)}`);
      return data.data;
    },
    enabled: !!id,
  });

  // Monitor sticky nav positions and active sections on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) {
        if (window.scrollY > 400) {
          setIsSticky(true);
        } else {
          setIsSticky(false);
        }
      }

      // Check active section
      const scrollPos = window.scrollY + 140;
      for (const section of SECTIONS) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveTab(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [responseData]);

  // Auto-scroll sub-nav bar horizontally to keep active tab centered/visible
  useEffect(() => {
    if (!activeTab || !tabContainerRef.current) return;
    const container = tabContainerRef.current;
    const activeBtn = container.querySelector(`button[data-sec-id="${activeTab}"]`) as HTMLElement;
    if (activeBtn) {
      const scrollLeft = activeBtn.offsetLeft - (container.clientWidth / 2) + (activeBtn.clientWidth / 2);
      container.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth'
      });
    }
  }, [activeTab]);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const yOffset = -90; // sticky navbar offset
      const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveTab(sectionId);
    }
  };

  const toggleModule = (moduleNum: number) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleNum]: !prev[moduleNum]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 py-20 gap-4">
        <Loader2 className="w-12 h-12 text-secondary animate-spin" />
        <p className="text-slate-400 font-medium">Cargando especialidad...</p>
      </div>
    );
  }

  if (isError || !responseData) {
    return (
      <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Link 
            to="/" 
            className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-primary transition-colors mb-12 uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Inicio
          </Link>
          
          <div className="bg-white rounded-2xl shadow-soft p-10 md:p-16 border border-slate-100 flex flex-col items-center">
            <Target className="w-16 h-16 text-slate-300 mb-6" />
            <h1 className="font-display text-3xl md:text-5xl font-extrabold text-primary mb-6 capitalize">
              No Encontrado
            </h1>
            <div className="h-1 w-20 bg-secondary mb-8"></div>
            <p className="font-sans text-xl text-slate-600 mb-4 font-bold">
              Especialidad No Encontrada
            </p>
            <p className="text-slate-500 max-w-lg mx-auto">
              La especialidad que buscas no existe o se encuentra actualmente en mantenimiento.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const specialty = responseData;

  // ── Render 1: Especialidades de Derecho (Grid of Courses) ────────
  if (specialty.type === 'derecho') {
    const coursesList = specialty.courses ?? [];
    return (
      <div className="min-h-screen bg-surface">
        {/* Category Hero */}
        <section className="relative text-white pt-32 pb-24 px-6 lg:px-8 overflow-hidden bg-primary shadow-inner">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-15 z-0" 
            style={{ backgroundImage: `url('${resolveImg(specialty.image_url) ?? '/arbitrage_bg.png'}')` }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/95 to-primary/60 z-0"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent z-0"></div>
          
          <div className="max-w-7xl mx-auto relative z-10 space-y-6">
            <div>
              <Link 
                to="/" 
                className="inline-flex items-center text-xs font-bold text-slate-300 hover:text-white transition-all uppercase tracking-widest bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-2 text-secondary" /> Volver a Inicio
              </Link>
            </div>

            <div className="inline-flex items-center gap-2 bg-secondary/20 backdrop-blur-md text-secondary border border-secondary/35 px-4.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
              Derecho & Ciencias Jurídicas
            </div>

            <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tight leading-tight uppercase">
              {specialty.title}
            </h1>
            <p className="font-serif text-lg text-slate-300 max-w-3xl leading-relaxed">
              {specialty.description ?? 'Explora nuestro catálogo de diplomados y cursos de actualización profesional en esta especialidad.'}
            </p>
          </div>
        </section>

        {/* Courses Listing Block */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="space-y-6">
            <h2 className="font-sans text-2xl font-black text-primary flex items-center gap-3">
              <span className="w-1.5 h-7 bg-secondary rounded-full"></span>
              Diplomados y Cursos Disponibles
            </h2>
            <p className="font-serif text-slate-500 text-sm">Actualización profesional continua a cargo de juristas destacados.</p>
            <div className="h-[2px] w-20 bg-secondary/30 mb-10"></div>
          </div>

          {coursesList.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-soft max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                <BookOpen className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="font-sans text-xl font-bold text-slate-800 mb-2">Próximos lanzamientos</h3>
              <p className="font-serif text-slate-500 leading-relaxed mb-8">
                Estamos preparando nuevos diplomados y programas para esta especialidad. Déjanos tus datos de contacto para avisarte en cuanto se abran las inscripciones.
              </p>
              <Link to="/contacto" className="btn-pill bg-secondary text-white inline-block uppercase text-xs font-black tracking-widest px-8 py-4">
                Solicitar Información
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {coursesList.map((course: any) => (
                <div key={course.id} className="group bg-white rounded-[2.5rem] border border-slate-150 shadow-soft overflow-hidden hover:shadow-hover transition-all duration-500 flex flex-col">
                  {/* Image Header */}
                  <div className="h-44 bg-slate-100 relative overflow-hidden shrink-0">
                    {resolveImg(course.image_url) ? (
                      <img 
                        src={resolveImg(course.image_url)!} 
                        alt={course.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                        <ImageOff className="w-12 h-12 text-white/20" />
                      </div>
                    )}
                    
                    <span className="absolute top-4 left-4 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase tracking-wider">
                      {course.code ?? 'OFICIAL'}
                    </span>
                    
                    {course.type && (
                      <span className="absolute top-4 right-4 px-3 py-1 bg-secondary text-white text-[9px] font-black uppercase tracking-wider rounded">
                        {course.type}
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-secondary" /> {course.duration_weeks} sem</span>
                        {course.hours && <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-secondary" /> {course.hours}h</span>}
                      </div>

                      <h3 className="font-sans text-base font-extrabold text-primary group-hover:text-secondary transition-colors line-clamp-2 leading-tight">
                        {course.title}
                      </h3>
                      
                      {course.teacher_name && (
                        <p className="text-xs text-slate-500 font-sans line-clamp-1">
                          Docente: <strong>{course.teacher_name}</strong>
                        </p>
                      )}
                    </div>

                    <div className="pt-6 border-t border-slate-50 mt-6 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Inversión</p>
                        <p className="font-sans text-base font-black text-primary">{course.price_label}</p>
                      </div>
                      
                      <Link 
                        to={`/cursos/${course.slug ?? course.id}`}
                        className="p-3 rounded-full bg-slate-50 text-primary border border-slate-200/60 hover:bg-secondary hover:text-white hover:border-secondary transition-all shrink-0 flex items-center justify-center"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  // ── Render 2: Especialidades de Formación (Brochure Page) ────────
  const data = specialty.custom_sections ?? {};

  // Extract variables with default fallback to avoid missing properties errors
  const hero = data.hero ?? {};
  const indicators = data.indicators ?? {};
  const presentation = data.presentation ?? {};
  const methodology = data.methodology ?? {};
  const profile = data.profile ?? {};
  const accreditations = data.accreditations ?? {};
  const syllabus = data.syllabus ?? [];
  const teachers = data.teachers ?? [];
  const investment = data.investment ?? {};
  const paymentAccounts = data.payment_accounts ?? {};
  const bankAccountsList = paymentAccounts.accounts ?? [];

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Hero Section (High contrast, Premium aesthetics) ────────── */}
      <section className="relative text-white pt-28 pb-36 px-6 lg:px-8 overflow-hidden bg-primary shadow-inner">
        <div 
          className="absolute inset-0 bg-cover bg-center transform scale-100 hover:scale-105 transition-transform duration-10000 ease-out opacity-25 z-0" 
          style={{ backgroundImage: `url('${resolveImg(specialty.image_url) ?? '/arbitrage_bg.png'}')` }}
        ></div>
        
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/95 to-primary/40 z-0"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent z-0"></div>
        <div className="absolute inset-0 backdrop-blur-[2px] z-0"></div>
        
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-secondary/10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-secondary/5 blur-3xl"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-8">
            <Link 
              to="/" 
              className="inline-flex items-center text-xs font-bold text-slate-300 hover:text-white transition-all uppercase tracking-widest bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 hover:border-white/20 shadow-lg"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-2 text-secondary" /> Volver a Inicio
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Heading and info */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 bg-secondary/20 backdrop-blur-md text-secondary border border-secondary/35 px-4.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-md">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                {hero.badge ?? 'Área de Estudio · Programa Oficial'}
              </div>
              
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black leading-tight tracking-tight drop-shadow-md">
                {specialty.title.split(" ").slice(0, 2).join(" ")} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-amber-500">
                  {specialty.title.split(" ").slice(2).join(" ") || 'ESPECIALIZADO'}
                </span>
              </h1>
              
              <p className="font-sans text-xl md:text-2xl text-slate-200 font-bold max-w-2xl drop-shadow-sm">
                {hero.subtitle ?? 'Programa de alta especialización teórica y forense.'}
              </p>
              
              <div className="flex flex-wrap gap-3">
                <span className="bg-white/10 text-white text-[10px] uppercase font-bold tracking-widest px-4 py-2 rounded-sm border border-white/15">
                  Teórico
                </span>
                <span className="bg-white/10 text-white text-[10px] uppercase font-bold tracking-widest px-4 py-2 rounded-sm border border-white/15">
                  Práctico
                </span>
                <span className="bg-white/10 text-white text-[10px] uppercase font-bold tracking-widest px-4 py-2 rounded-sm border border-white/15">
                  Inmersivo
                </span>
              </div>

              <div className="pt-4 flex flex-wrap gap-4">
                <button 
                  onClick={() => scrollToSection("inscripcion")}
                  className="btn-pill bg-secondary text-white border border-secondary hover:bg-secondary/90 transition-colors shadow-lg hover:shadow-xl uppercase text-xs font-extrabold tracking-widest px-8 py-4"
                >
                  Inscribirme Ahora
                </button>
                {specialty.brochure_pdf_path && (
                  <a 
                    href={specialty.brochure_pdf_path.startsWith('http') || specialty.brochure_pdf_path.startsWith('/storage') ? specialty.brochure_pdf_path : `/storage/${specialty.brochure_pdf_path}`}
                    target="_blank" 
                    rel="noreferrer"
                    className="btn-pill bg-white/10 hover:bg-white text-white hover:text-primary border border-white/20 transition-colors uppercase text-xs font-extrabold tracking-widest px-8 py-4 flex items-center justify-center gap-2 shadow-lg"
                  >
                    <FileText className="w-4 h-4 text-secondary" /> Descargar Brochure
                  </a>
                )}
                <a 
                  href={`https://wa.me/51${paymentAccounts.whatsapp ?? '971707389'}?text=Hola,%20deseo%20asesoría%20sobre%20el%20Programa%20de%20${encodeURIComponent(specialty.title)}.`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn-pill border-2 border-white/30 text-white hover:bg-white hover:text-primary backdrop-blur-sm shadow-none uppercase text-xs font-extrabold tracking-widest px-8 py-4 transition-all"
                >
                  Hablar con Asesor
                </a>
              </div>
            </div>

            {/* Right Column: Video/Showcase mock */}
            <div className="lg:col-span-5 relative">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-video lg:aspect-video rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 bg-slate-900 group"
              >
                <img 
                  src={resolveImg(specialty.image_url) ?? '/arbitrage_bg.png'} 
                  alt={specialty.title} 
                  className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700" 
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-between p-6">
                  <div className="self-end bg-secondary text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded shadow-md">
                    Doble Certificación
                  </div>

                  <div className="self-center my-auto flex flex-col items-center cursor-pointer group/play">
                    <div className="w-16 h-16 rounded-full bg-secondary text-white flex items-center justify-center shadow-2xl group-hover/play:bg-amber-500 group-hover/play:scale-110 transition-all duration-300">
                      <Gavel className="w-7 h-7 fill-white translate-y-[-1px] translate-x-[1px]" />
                    </div>
                    <span className="text-white text-xs font-bold uppercase tracking-widest mt-3 drop-shadow-md group-hover/play:text-secondary transition-colors">
                      {hero.video_title ?? 'Introducción al Programa'}
                    </span>
                  </div>

                  <div className="text-left space-y-1">
                    <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Metodología Activa</p>
                    <h3 className="text-white font-sans font-extrabold text-sm sm:text-base drop-shadow-md">
                      Simulación Permanente y Casos Forenses
                    </h3>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick Stats Grid ────────────────────────────────────────── */}
      <section className="relative z-20 -mt-16 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-soft border border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 overflow-hidden">
          
          <div className="p-6 md:p-8 flex items-center gap-4 hover:bg-slate-50 transition-colors border-b sm:border-b lg:border-b-0 sm:border-r border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="font-sans text-xs font-bold text-slate-400 uppercase tracking-widest">Duración</p>
              <h4 className="font-sans text-lg font-extrabold text-primary">{indicators.duration ?? '7 Meses'}</h4>
            </div>
          </div>

          <div className="p-6 md:p-8 flex items-center gap-4 hover:bg-slate-50 transition-colors border-b sm:border-b lg:border-b-0 lg:border-r border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="font-sans text-xs font-bold text-slate-400 uppercase tracking-widest">Horas Lectivas</p>
              <h4 className="font-sans text-lg font-extrabold text-primary">{indicators.hours ?? '1152 Horas'}</h4>
            </div>
          </div>

          <div className="p-6 md:p-8 flex items-center gap-4 hover:bg-slate-50 transition-colors border-b sm:border-b-0 sm:border-r lg:border-r border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <p className="font-sans text-xs font-bold text-slate-400 uppercase tracking-widest">Modalidad</p>
              <h4 className="font-sans text-lg font-extrabold text-primary">{indicators.mode ?? 'Virtual en vivo'}</h4>
            </div>
          </div>

          <div className="p-6 md:p-8 flex items-center gap-4 hover:bg-slate-50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="font-sans text-xs font-bold text-slate-400 uppercase tracking-widest">Acreditación</p>
              <h4 className="font-sans text-base md:text-sm lg:text-base font-extrabold text-primary">{indicators.accreditation ?? 'SUNEDU / UNT'}</h4>
            </div>
          </div>

        </div>
      </section>

      {/* ── Sticky Sub-Navigation ─────────────────────────────────── */}
      <div 
        ref={navRef}
        className={`w-full z-40 transition-all duration-300 ${
          isSticky 
            ? "sticky top-20 bg-primary/95 backdrop-blur-md shadow-lg py-3" 
            : "relative bg-white border-b border-slate-100 py-3 mt-12"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div 
            ref={tabContainerRef}
            className="flex items-center overflow-x-auto gap-1 md:gap-2 eduwanka-scrollbar py-2"
          >
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                data-sec-id={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`px-4 py-2 text-xs md:text-sm font-bold uppercase tracking-wider rounded-full transition-all shrink-0 ${
                  activeTab === sec.id
                    ? isSticky 
                      ? "bg-secondary text-white shadow-md" 
                      : "bg-primary text-white shadow-md"
                    : isSticky 
                      ? "text-slate-300 hover:text-white hover:bg-white/5" 
                      : "text-slate-500 hover:text-primary hover:bg-slate-100"
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Structured Content (2-Column Grid Layout) ──────────── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-12 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* ───────────────── LEFT COLUMN ───────────────── */}
          <div className="lg:col-span-8 space-y-16">
            
            {/* Section 1: Presentación & Objetivos */}
            <section id="presentacion" className="scroll-mt-36 bg-white p-8 md:p-10 rounded-2xl shadow-soft border border-slate-100 space-y-8">
              <div className="space-y-4">
                <h2 className="font-display text-2xl md:text-3xl font-black text-primary flex items-center gap-3">
                  <span className="w-1.5 h-8 bg-secondary rounded-full"></span>
                  {presentation.title ?? 'Sobre el Diplomado'}
                </h2>
                <div className="h-[2px] w-20 bg-secondary/30"></div>
              </div>

              <div className="font-serif text-lg text-slate-600 leading-relaxed whitespace-pre-line space-y-6">
                {presentation.about ?? 'Programa diseñado con rigor científico y metodológico para potenciar tus competencias profesionales en el ámbito forense y corporativo.'}
              </div>

              {/* General Objectives */}
              <div className="mt-10 bg-slate-50 rounded-xl p-6 md:p-8 border border-slate-100">
                <h3 className="font-display text-lg font-black text-primary mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-secondary" /> OBJETIVO GENERAL
                </h3>
                <p className="font-serif text-slate-600 mb-6 leading-relaxed">
                  {presentation.objective ?? 'Formar profesionales competentes con dominio integral de las herramientas metodológicas y procedimentales de esta área.'}
                </p>
                
                {presentation.roles && presentation.roles.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {presentation.roles.map((rol: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                        <div className="w-7 h-7 rounded-full bg-secondary/15 flex items-center justify-center text-secondary shrink-0 font-bold text-xs">
                          {idx + 1}
                        </div>
                        <span className="font-sans text-sm font-bold text-primary">{rol}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Section 2: Metodología & Herramientas */}
            <section id="metodologia" className="scroll-mt-36 space-y-8">
              <div className="space-y-4">
                <h2 className="font-display text-2xl md:text-3xl font-black text-primary flex items-center gap-3">
                  <span className="w-1.5 h-8 bg-secondary rounded-full"></span>
                  Metodología y Herramientas Académicas
                </h2>
                <p className="font-serif text-slate-500 text-sm">Enfoque pedagógico activo enfocado en simulaciones y resolución de casuísticas forenses.</p>
                <div className="h-[2px] w-20 bg-secondary/30"></div>
              </div>

              {/* 3 Pillars of Methodology */}
              {methodology.pillars && methodology.pillars.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {methodology.pillars.map((col: any, idx: number) => {
                    const icons = [<FileText key={1} className="w-6 h-6 text-white" />, <Zap key={2} className="w-6 h-6 text-white" />, <Users key={3} className="w-6 h-6 text-white" />];
                    const bgColors = ["bg-primary", "bg-secondary", "bg-emerald-600"];
                    return (
                      <div key={idx} className="bg-white rounded-xl p-6 shadow-soft border border-slate-100 space-y-4 hover:shadow-hover transition-all duration-300">
                        <div className={`w-12 h-12 rounded-lg ${bgColors[idx % 3]} flex items-center justify-center shadow-md`}>
                          {icons[idx % 3]}
                        </div>
                        <h3 className="font-sans text-base font-bold text-primary">{col.title}</h3>
                        <p className="font-serif text-slate-600 text-sm leading-relaxed">{col.desc}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Herramientas Entregadas en Cards */}
              {methodology.tools && methodology.tools.length > 0 && (
                <div className="bg-white p-8 md:p-10 rounded-2xl shadow-soft border border-slate-100 space-y-6">
                  <h3 className="font-display text-xl font-bold text-primary flex items-center gap-3">
                    <Award className="w-5 h-5 text-secondary" />
                    Entrega de Herramientas Reales
                  </h3>
                  <p className="font-serif text-slate-500 text-sm">Materiales y metodologías diseñadas para la simulación constante.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    {methodology.tools.map((tool: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 rounded-xl p-6 border border-slate-100 hover:border-secondary/20 transition-all">
                        <div className="bg-secondary/10 text-secondary px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded w-fit mb-4">
                          Herramienta {idx + 1}
                        </div>
                        <h4 className="font-sans font-bold text-primary text-base mb-2">{tool.title}</h4>
                        <p className="font-serif text-slate-500 text-xs leading-relaxed mb-4">{tool.desc}</p>
                        {tool.items && (
                          <ul className="space-y-1.5 text-xs text-slate-600 font-sans">
                            {tool.items.map((item: string, iIndex: number) => (
                              <li key={iIndex} className="flex items-center gap-2">
                                <Check className="w-3.5 h-3.5 text-secondary shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Section 3: Perfil del Egresado */}
            <section id="perfil" className="scroll-mt-36 bg-white p-8 md:p-10 rounded-2xl shadow-soft border border-slate-100 space-y-6">
              <div className="space-y-4">
                <h2 className="font-display text-2xl md:text-3xl font-black text-primary flex items-center gap-3">
                  <span className="w-1.5 h-8 bg-secondary rounded-full"></span>
                  Perfil del Egresado
                </h2>
                <div className="h-[2px] w-20 bg-secondary/30"></div>
              </div>
              
              <p className="font-serif text-slate-500 text-sm">Habilidades específicas desarrolladas y listas para implementarse en el ejercicio profesional:</p>

              {profile.skills && profile.skills.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  {profile.skills.map((habilidad: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-secondary/5 transition-colors">
                      <CheckCircle2 className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                      <span className="font-sans text-xs sm:text-sm font-bold text-slate-700">{habilidad}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Section 4: Acreditaciones Oficiales */}
            <section id="acreditaciones" className="scroll-mt-36 space-y-8">
              <div className="space-y-4">
                <h2 className="font-display text-2xl md:text-3xl font-black text-primary flex items-center gap-3">
                  <span className="w-1.5 h-8 bg-secondary rounded-full"></span>
                  {accreditations.title ?? 'Acreditaciones y Respaldo Académico'}
                </h2>
                <div className="h-[2px] w-20 bg-secondary/30"></div>
              </div>

              {accreditations.items && accreditations.items.length > 0 && (
                <div className="space-y-6">
                  {accreditations.items.map((accItem: any, idx: number) => {
                    const icons = [
                      <Shield key={1} className="w-8 h-8 text-secondary" />,
                      <Gavel key={2} className="w-8 h-8 text-secondary" />,
                      <GraduationCap key={3} className="w-8 h-8 text-white" />
                    ];

                    const isUniversityCard = idx === 2 || accItem.title.toLowerCase().includes("universitaria");

                    if (isUniversityCard) {
                      return (
                        <div key={idx} className="bg-primary text-white rounded-2xl p-8 shadow-xl relative overflow-hidden space-y-6">
                          <div className="absolute right-0 bottom-0 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>

                          <div className="flex flex-col md:flex-row gap-6 items-center relative z-10">
                            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                              <GraduationCap className="w-8 h-8 text-secondary" />
                            </div>
                            <div className="text-center md:text-left space-y-1 flex-grow">
                              <h3 className="font-sans text-lg font-extrabold text-white">{accItem.title}</h3>
                              <p className="font-sans text-secondary text-xs font-bold uppercase tracking-widest">
                                Universidad Licenciada por SUNEDU
                              </p>
                            </div>
                          </div>

                          <p className="font-serif text-slate-300 text-sm leading-relaxed relative z-10">
                            {accItem.desc}
                          </p>

                          <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 md:p-6 border border-white/10 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                            <div>
                              <h4 className="text-secondary font-sans text-xs font-black uppercase tracking-wider mb-1">PROGRAMA 1</h4>
                              <p className="font-sans text-sm font-bold text-white">Especialización de Área</p>
                              <p className="text-[10px] text-slate-400">24 Créditos · 384 horas</p>
                            </div>
                            <div>
                              <h4 className="text-secondary font-sans text-xs font-black uppercase tracking-wider mb-1">PROGRAMA 2</h4>
                              <p className="font-sans text-sm font-bold text-white">Actualización de Leyes</p>
                              <p className="text-[10px] text-slate-400">24 Créditos · 384 horas</p>
                            </div>
                            <div>
                              <h4 className="text-secondary font-sans text-xs font-black uppercase tracking-wider mb-1">PROGRAMA 3</h4>
                              <p className="font-sans text-sm font-bold text-white">Estrategia y Procedimiento</p>
                              <p className="text-[10px] text-slate-400">24 Créditos · 384 horas</p>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                            <p className="font-sans text-[10px] text-slate-400 font-bold uppercase tracking-widest">Acreditado por:</p>
                            <div className="flex flex-wrap items-center gap-6 bg-white/10 backdrop-blur-md px-6 py-3 rounded-xl border border-white/10">
                              <div className="h-10 flex items-center justify-center shrink-0">
                                <img 
                                  src="/convenios/UNT.png" 
                                  alt="Universidad Nacional de Trujillo" 
                                  className="h-full object-contain brightness-0 invert opacity-90"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={idx} className="bg-white rounded-2xl p-6 md:p-8 shadow-soft border border-slate-100 flex flex-col md:flex-row gap-6 items-center">
                        <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                          {icons[idx % 2]}
                        </div>
                        <div className="space-y-2 text-center md:text-left flex-grow">
                          <h3 className="font-sans text-lg font-extrabold text-primary">{accItem.title}</h3>
                          <p className="font-serif text-slate-600 text-sm leading-relaxed">
                            {accItem.desc}
                          </p>
                          {accItem.badge && (
                            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded">
                              {accItem.badge}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Section 5: Malla Curricular */}
            <section id="temario" className="scroll-mt-36 space-y-8">
              <div className="space-y-4">
                <h2 className="font-display text-2xl md:text-3xl font-black text-primary flex items-center gap-3">
                  <span className="w-1.5 h-8 bg-secondary rounded-full"></span>
                  Malla Curricular del Diplomado
                </h2>
                <p className="font-serif text-slate-500 text-sm">
                  Módulos de especialización interactivos estructurados para consolidar la teoría y la práctica jurídica.
                </p>
                <div className="h-[2px] w-20 bg-secondary/30"></div>
              </div>

              {/* Accordions */}
              <div className="space-y-4">
                {syllabus.map((mod: any) => {
                  const isOpen = expandedModules[mod.number] || false;
                  return (
                    <div 
                      key={mod.number} 
                      className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all duration-300 ${
                        isOpen ? "border-secondary ring-1 ring-secondary/30" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <button
                        onClick={() => toggleModule(mod.number)}
                        className="w-full px-6 py-5 flex items-center justify-between text-left group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors shrink-0 ${
                            isOpen ? "bg-secondary text-white" : "bg-slate-100 text-slate-400 group-hover:bg-secondary/10 group-hover:text-secondary"
                          }`}>
                            M{mod.number}
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block mb-0.5">Módulo {mod.number}</span>
                            <h3 className="font-sans text-sm sm:text-base font-bold text-primary">{mod.title}</h3>
                          </div>
                        </div>
                        
                        <div className="shrink-0 ml-4">
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-secondary" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-secondary transition-colors" />
                          )}
                        </div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="px-6 pb-6 pt-2 border-t border-slate-50 space-y-4">
                              <ul className="space-y-3 font-sans text-xs sm:text-sm text-slate-600 pl-4 list-disc marker:text-secondary">
                                {mod.topics.map((topic: string, index: number) => (
                                  <li key={index} className="leading-relaxed pl-1">
                                    {topic}
                                  </li>
                                ))}
                              </ul>

                              {mod.taller && (
                                <div className="mt-4 bg-secondary/5 rounded-lg p-4 border border-secondary/20 flex items-start gap-3">
                                  <Award className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                                  <div>
                                    <h4 className="font-sans text-xs font-black uppercase tracking-widest text-secondary mb-0.5">Talleres & Casos Aplicados</h4>
                                    <p className="font-serif text-slate-700 text-xs sm:text-sm font-semibold">{mod.taller}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Section 6: Plana Docente */}
            <section id="docentes" className="scroll-mt-36 space-y-8">
              <div className="space-y-4">
                <h2 className="font-display text-2xl md:text-3xl font-black text-primary flex items-center gap-3">
                  <span className="w-1.5 h-8 bg-secondary rounded-full"></span>
                  Cuerpo Docente de Excelencia
                </h2>
                <div className="h-[2px] w-20 bg-secondary/30"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {teachers.map((teacher: any, index: number) => (
                  <div 
                    key={index}
                    className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100 flex flex-col items-center sm:items-start text-center sm:text-left space-y-4 group hover:shadow-hover hover:border-secondary/20 transition-all duration-300"
                  >
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                      <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 bg-slate-200 border-2 border-secondary shadow-md">
                        <img 
                          src={resolveImg(teacher.image) ?? '/arbitrage_bg.png'} 
                          alt={teacher.name} 
                          className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-500" 
                        />
                      </div>
                      <div>
                        <h3 className="font-sans text-base font-extrabold text-primary">{teacher.name}</h3>
                        <p className="text-[10px] text-secondary font-black uppercase tracking-widest mt-0.5">{teacher.specialty}</p>
                        <p className="text-[10px] text-slate-400 font-sans mt-1">{teacher.credentials}</p>
                      </div>
                    </div>
                    <p className="font-serif text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-50 pt-3">
                      {teacher.bio}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 7: Inversión */}
            <section id="inversion" className="scroll-mt-36 bg-white p-8 md:p-10 rounded-2xl shadow-soft border border-slate-100 space-y-8">
              <div className="space-y-4">
                <h2 className="font-display text-2xl md:text-3xl font-black text-primary flex items-center gap-3">
                  <span className="w-1.5 h-8 bg-secondary rounded-full"></span>
                  Inversión del Diplomado
                </h2>
                <div className="h-[2px] w-20 bg-secondary/30"></div>
              </div>

              <p className="font-serif text-slate-500 text-sm">
                Ofrecemos planes de inversión flexibles con tarifas preferenciales para matriculados anticipados:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Socios Card */}
                <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="bg-secondary/10 text-secondary text-xs font-black uppercase tracking-widest px-3 py-1 rounded w-fit">
                    Tarifa Preferencial Socios
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 font-bold uppercase block tracking-wider">Matrícula</span>
                    <h3 className="font-sans text-3xl font-extrabold text-primary">{investment.matricula_socios ?? 'S/ 285.00'}</h3>
                  </div>

                  <div className="border-t border-slate-200/50 pt-4 space-y-3">
                    <span className="text-xs text-slate-400 font-bold uppercase block tracking-wider">Mensualidad (3 Cuotas)</span>
                    
                    <div className="bg-white p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Inscripción Anticipada</p>
                        <p className="text-xs font-sans font-bold text-slate-600">{investment.label_antes || 'Hasta el 10 de junio'}</p>
                      </div>
                      <p className="font-sans text-lg font-extrabold text-primary">{investment.cuota_socios_antes ?? 'S/ 550.00'} <span className="text-xs font-medium text-slate-400">/cuota</span></p>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Precio Regular</p>
                        <p className="text-xs font-sans font-bold text-slate-600">{investment.label_despues || 'Desde el 11 de junio'}</p>
                      </div>
                      <p className="font-sans text-lg font-extrabold text-slate-500">{investment.cuota_socios_despues ?? 'S/ 650.00'} <span className="text-xs font-medium text-slate-400">/cuota</span></p>
                    </div>
                  </div>
                  
                  <p className="text-[9px] text-slate-400 italic text-center">*Las cuotas mensuales se abonan los días 22 de los primeros tres meses.*</p>
                </div>

                {/* Public General Card */}
                <div className="border-2 border-primary/10 bg-white rounded-2xl p-6 shadow-md space-y-4 relative">
                  <div className="bg-primary text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded w-fit">
                    Tarifa Público General
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 font-bold uppercase block tracking-wider">Matrícula</span>
                    <h3 className="font-sans text-3xl font-extrabold text-primary">{investment.matricula_publico ?? 'S/ 295.00'}</h3>
                  </div>

                  <div className="border-t border-slate-200/50 pt-4 space-y-3">
                    <span className="text-xs text-slate-400 font-bold uppercase block tracking-wider">Mensualidad (3 Cuotas)</span>
                    
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Inscripción Anticipada</p>
                        <p className="text-xs font-sans font-bold text-slate-600">{investment.label_antes || 'Hasta el 10 de junio'}</p>
                      </div>
                      <p className="font-sans text-lg font-extrabold text-primary">{investment.cuota_publico_antes ?? 'S/ 590.00'} <span className="text-xs font-medium text-slate-400">/cuota</span></p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Precio Regular</p>
                        <p className="text-xs font-sans font-bold text-slate-600">{investment.label_despues || 'Desde el 11 de junio'}</p>
                      </div>
                      <p className="font-sans text-lg font-extrabold text-slate-500">{investment.cuota_publico_despues ?? 'S/ 695.00'} <span className="text-xs font-medium text-slate-400">/cuota</span></p>
                    </div>
                  </div>
                  
                  <p className="text-[9px] text-slate-400 italic text-center">*Las cuotas mensuales se abonan los días 22 de los primeros tres meses.*</p>
                </div>

              </div>

              {/* Discounts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-emerald-800 text-sm">Tarifa Pago al Contado (-10%)</h4>
                    <p className="font-serif text-emerald-700 text-xs mt-1">
                      Obtén un <strong>10% de descuento directo</strong> sobre el total de tus cuotas si realizas el abono completo en una sola armada antes de iniciar.
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <Users2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-amber-800 text-sm">Descuento Corporativo (-5%)</h4>
                    <p className="font-serif text-amber-700 text-xs mt-1">
                      Inscribe a tu equipo y obtén un <strong>5% de descuento mensual</strong> en las cuotas de cada participante (mínimo 2 personas).
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 8: Pasos para la Inscripción */}
            <section id="inscripcion" className="scroll-mt-36 bg-white p-8 md:p-10 rounded-2xl shadow-soft border border-slate-100 space-y-8">
              <div className="space-y-4">
                <h2 className="font-display text-2xl md:text-3xl font-black text-primary flex items-center gap-3">
                  <span className="w-1.5 h-8 bg-secondary rounded-full"></span>
                  Pasos para la Inscripción
                </h2>
                <div className="h-[2px] w-20 bg-secondary/30"></div>
              </div>

              {/* Flow Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                <div className="space-y-3 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-secondary text-white font-display font-black text-lg flex items-center justify-center shadow-lg">
                    1
                  </div>
                  <h3 className="font-sans font-bold text-primary text-base">DEPÓSITO</h3>
                  <p className="font-serif text-slate-500 text-xs leading-relaxed">
                    Realiza la transferencia bancaria o depósito a cualquiera de las cuentas recaudadoras oficiales.
                  </p>
                </div>

                <div className="space-y-3 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-secondary text-white font-display font-black text-lg flex items-center justify-center shadow-lg">
                    2
                  </div>
                  <h3 className="font-sans font-bold text-primary text-base">ENVIAR COMPROBANTE</h3>
                  <p className="font-serif text-slate-500 text-xs leading-relaxed">
                    Envía la foto de tu voucher o captura de transferencia al WhatsApp de informes de nuestra asesora.
                  </p>
                </div>

                <div className="space-y-3 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-secondary text-white font-display font-black text-lg flex items-center justify-center shadow-lg">
                    3
                  </div>
                  <h3 className="font-sans font-bold text-primary text-base">RELLENAR FICHA</h3>
                  <p className="font-serif text-slate-500 text-xs leading-relaxed">
                    Completa la ficha digital proporcionada e inicia clases en nuestra Aula Virtual de inmediato.
                  </p>
                </div>
              </div>

              {/* Bank accounts */}
              <div className="bg-slate-50 rounded-xl p-6 md:p-8 border border-slate-100 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="font-sans font-bold text-primary text-base">Cuentas Recaudadoras Oficiales</h4>
                    <p className="font-sans text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                      Titular: {paymentAccounts.titular ?? 'Lennin Patrick Gonzales Villanueva'}
                    </p>
                  </div>
                  <div className="bg-secondary/15 text-secondary px-3 py-1.5 rounded font-sans text-xs font-bold border border-secondary/25">
                    Depósitos 100% Seguros
                  </div>
                </div>

                {bankAccountsList.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {bankAccountsList.map((cta: any, idx: number) => (
                      <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:border-secondary/35 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-sans font-extrabold text-sm text-primary">{cta.bank}</span>
                          <button 
                            onClick={() => copyToClipboard(cta.acc)}
                            className="text-[10px] text-slate-400 hover:text-secondary uppercase font-black tracking-widest"
                          >
                            Copiar Cuenta
                          </button>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="font-mono text-sm text-slate-700 font-bold select-all bg-slate-50 px-2 py-1 rounded w-fit border border-slate-100">{cta.acc}</p>
                          {cta.cci && <p className="font-mono text-[10px] text-slate-400">{cta.cci}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Yape */}
                <div className="bg-primary text-white rounded-xl p-6 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="space-y-1 text-center sm:text-left">
                    <div className="bg-secondary text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded w-fit mx-auto sm:mx-0 shadow-md">
                      Yape al Instante
                    </div>
                    <h4 className="font-sans font-bold text-white text-base">¿Prefieres pagar con Yape?</h4>
                    <p className="font-sans text-xs text-slate-400">Escanea el código o digita el número recaudador directamente.</p>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md px-6 py-4 rounded-xl border border-white/10 shrink-0">
                    <CreditCard className="w-8 h-8 text-secondary shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Número Recaudador</p>
                      <p className="font-mono text-base font-extrabold text-secondary select-all">{paymentAccounts.yape ?? '970 054 014'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-secondary/10 rounded-xl border border-secondary/20 gap-4">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-primary text-sm">¿Ya tienes tu comprobante de pago?</h4>
                    <p className="font-serif text-slate-500 text-xs sm:text-sm">Envíalo a nuestra central de informes para validar tu matrícula.</p>
                  </div>
                </div>

                <a 
                  href={`https://wa.me/51${paymentAccounts.whatsapp ?? '971707389'}?text=Hola,%20adjunto%20comprobante%20de%20pago%20para%20el%20Diplomado%20de%20${encodeURIComponent(specialty.title)}.`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn-pill bg-emerald-600 text-white hover:bg-emerald-500 transition-colors uppercase text-xs font-extrabold tracking-widest px-6 py-3 flex items-center gap-2 shrink-0 shadow-lg"
                >
                  <Send className="w-4 h-4 text-white" /> Enviar por WhatsApp
                </a>
              </div>
            </section>

          </div>

          {/* ──────────────── RIGHT COLUMN (Floating Card) ──────────── */}
          <div className="lg:col-span-4 sticky space-y-8" style={{ top: '180px' }}>
            
            <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
              <div className="bg-primary p-6 text-white text-center space-y-2 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-xl"></div>
                <p className="text-secondary font-sans text-xs font-black uppercase tracking-widest relative z-10">DIPLOMADO PREMIUM</p>
                <h3 className="text-2xl font-sans font-black text-white relative z-10">Inscripción Abierta</h3>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                
                <div className="text-center space-y-1">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Precio de Matrícula Regular</p>
                  <h2 className="text-4xl font-sans font-black text-primary">{investment.matricula_publico ?? 'S/ 295.00'}</h2>
                  <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mt-1">
                    Socios: {investment.matricula_socios ?? 'S/ 285.00'}
                  </p>
                </div>

                <div className="divide-y divide-slate-100 text-xs font-sans text-slate-600">
                  <div className="py-3 flex justify-between">
                    <span className="font-medium text-slate-400">Próximo Inicio</span>
                    <span className="font-bold text-primary">Junio 2026</span>
                  </div>
                  <div className="py-3 flex justify-between">
                    <span className="font-medium text-slate-400">Duración</span>
                    <span className="font-bold text-primary">{indicators.duration ?? '7 Meses'}</span>
                  </div>
                  <div className="py-3 flex justify-between">
                    <span className="font-medium text-slate-400">Acreditación Doble</span>
                    <span className="font-bold text-secondary">SUNEDU / UNT</span>
                  </div>
                  <div className="py-3 flex justify-between">
                    <span className="font-medium text-slate-400">Horas Totales</span>
                    <span className="font-bold text-primary">{indicators.hours ?? '1152 Horas'}</span>
                  </div>
                </div>

                <button 
                  onClick={() => scrollToSection("inscripcion")}
                  className="w-full bg-secondary text-white font-sans font-black py-4.5 rounded-xl shadow-lg hover:shadow-xl hover:bg-secondary/90 transition-all uppercase tracking-widest text-xs"
                >
                  Inscribirme Ahora
                </button>

                <a 
                  href={`https://wa.me/51${paymentAccounts.whatsapp ?? '971707389'}?text=Hola,%20deseo%20matricularme%20en%20el%20Diplomado%20de%20${encodeURIComponent(specialty.title)}.`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full bg-slate-50 text-primary border border-slate-200/80 font-sans font-bold py-3.5 rounded-xl hover:bg-slate-100 transition-colors uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5 text-secondary" /> Matrícula por WhatsApp
                </a>

              </div>
            </div>

            {/* Help coordination */}
            <div className="bg-primary text-white p-8 rounded-2xl relative overflow-hidden shadow-xl space-y-4">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
              <h4 className="font-sans font-bold text-base text-white">¿Necesitas asesoría académica?</h4>
              <p className="font-serif text-slate-400 text-xs sm:text-sm leading-relaxed">
                Nuestros coordinadores académicos están en línea para resolver tus preguntas sobre el plan de estudios, las becas institucionales y los convenios profesionales.
              </p>
              <a 
                href={`https://wa.me/51${paymentAccounts.whatsapp ?? '971707389'}?text=Hola,%20solicito%20asesoría%20sobre%20el%20Diplomado%20de%20${encodeURIComponent(specialty.title)}.`} 
                target="_blank" 
                rel="noreferrer"
                className="text-secondary hover:text-amber-400 font-sans font-bold text-xs uppercase tracking-widest border-b-2 border-secondary hover:border-amber-400 pb-0.5 inline-block transition-colors"
              >
                HABLAR CON COORDINADORA
              </a>
            </div>

          </div>

        </div>
      </div>

      {/* Floating Copy Notification */}
      <AnimatePresence>
        {isCopied && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-primary border border-secondary/50 text-white px-6 py-3.5 rounded-xl shadow-2xl z-50 text-xs font-bold uppercase tracking-widest flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
            Número de cuenta copiado al portapapeles
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
