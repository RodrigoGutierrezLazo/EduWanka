import { motion, useInView } from "motion/react";
import {
  ArrowRight,
  GraduationCap,
  Shield,
  Users,
  CreditCard,
  Award,
  BarChart2,
  Palette,
  Zap,
  CheckCircle,
  ChevronRight,
  Sparkles,
  Globe,
  Rocket,
  BookOpen,
  Play,
  Star,
  Building2,
  Landmark
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { apiClient } from "../lib/apiClient";

/* ═══════════════════════════════════════════════════════════════════
   HERO — Full-width dark section with main CTA
   ═══════════════════════════════════════════════════════════════════ */
const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-[#1a0507] via-[#7A0F1F] to-[#2a0509]">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/20 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.02] rounded-full" />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full pt-32 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <span className="px-4 py-1.5 bg-accent/15 border border-accent/30 rounded-full text-accent text-[11px] font-black uppercase tracking-widest">
                Plataforma SaaS Educativa
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white font-extrabold leading-[1.1] tracking-tight mb-8">
              Crea tu{" "}
              <span className="text-accent italic">Aula Virtual</span>
              <br />en minutos
            </h1>

            <p className="text-lg sm:text-xl text-white/60 max-w-lg leading-relaxed mb-10 font-sans">
              La plataforma más completa para instituciones educativas.
              Gestiona cursos, pagos, certificados y más — todo bajo tu propia marca.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-accent text-[#1a0507] px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/35 hover:-translate-y-0.5 transition-all duration-300"
              >
                <Rocket className="w-4 h-4" />
                Empieza Gratis
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center gap-2 border-2 border-white/20 text-white px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest hover:bg-white/10 hover:border-white/30 transition-all duration-300"
              >
                <Play className="w-4 h-4" />
                Ver Demo
              </a>
            </div>

            {/* Social proof mini */}
            <div className="mt-12 flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-9 h-9 rounded-full bg-gradient-to-br from-accent/40 to-primary/60 border-2 border-[#1a0507] flex items-center justify-center text-white text-[10px] font-bold">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-white/80 text-sm font-bold">+50 instituciones confían en nosotros</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-3 h-3 text-accent fill-accent" />
                  ))}
                  <span className="text-white/40 text-xs ml-1 font-medium">4.9/5</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Visual mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:block"
          >
            <div className="relative">
              {/* Floating dashboard mockup */}
              <div className="bg-white/[0.08] backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl">
                {/* Mockup header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-400/80" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
                    <span className="w-3 h-3 rounded-full bg-green-400/80" />
                  </div>
                  <div className="flex-1 h-7 bg-white/5 rounded-lg flex items-center px-3">
                    <span className="text-[10px] text-white/30 font-medium">tuacademia.eduwanka.net.pe</span>
                  </div>
                </div>
                {/* Mockup content */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "Estudiantes", value: "1,247", color: "from-blue-500/20 to-blue-600/10" },
                    { label: "Ingresos", value: "S/ 45,320", color: "from-green-500/20 to-green-600/10" },
                    { label: "Cursos", value: "24", color: "from-purple-500/20 to-purple-600/10" },
                  ].map((card, i) => (
                    <div key={i} className={`bg-gradient-to-br ${card.color} rounded-xl p-4 border border-white/5`}>
                      <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">{card.label}</p>
                      <p className="text-white font-black text-lg mt-1">{card.value}</p>
                    </div>
                  ))}
                </div>
                {/* Mockup chart bars */}
                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                  <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest mb-3">Ingresos Mensuales</p>
                  <div className="flex items-end gap-2 h-20">
                    {[35, 50, 42, 68, 55, 78, 65, 85, 72, 90, 82, 95].map((h, i) => (
                      <div key={i} className="flex-1 bg-gradient-to-t from-accent/60 to-accent/20 rounded-t-sm transition-all hover:from-accent/80 hover:to-accent/40"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating notification card */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="absolute -bottom-4 -left-8 bg-white rounded-2xl shadow-2xl p-4 border border-slate-100 max-w-[220px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Pago Validado</p>
                    <p className="text-[10px] text-slate-400">S/ 350.00 — hace 2min</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating certificate card */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.3, duration: 0.5 }}
                className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-2xl p-4 border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Certificado Emitido</p>
                    <p className="text-[10px] text-slate-400">Diplomado en Derecho</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom wave/gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#F9F6F0] to-transparent" />
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   BENEFITS — Grid of feature cards
   ═══════════════════════════════════════════════════════════════════ */
const Benefits = () => {
  const features = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Gestión de Cursos",
      description: "Crea, edita y organiza tus cursos con módulos, materiales, cuestionarios y tareas. Todo desde un panel intuitivo.",
      color: "bg-blue-50 text-blue-600",
      accent: "from-blue-500 to-cyan-500"
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Pagos Integrados",
      description: "Recibe pagos por transferencia, Yape, Plin o depósito. Validación automática y seguimiento completo de ingresos.",
      color: "bg-green-50 text-green-600",
      accent: "from-green-500 to-emerald-500"
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Certificados Automáticos",
      description: "Genera certificados PDF con código QR verificable. Diseño personalizable con tu logo y firma institucional.",
      color: "bg-purple-50 text-purple-600",
      accent: "from-purple-500 to-pink-500"
    },
    {
      icon: <Palette className="w-6 h-6" />,
      title: "Tu Marca, Tu Identidad",
      description: "Personaliza colores, logos y contenido. Cada aula tiene su propio subdominio y su propia landing de cursos.",
      color: "bg-accent/10 text-accent",
      accent: "from-amber-500 to-yellow-500"
    },
    {
      icon: <BarChart2 className="w-6 h-6" />,
      title: "Reportes y Analítica",
      description: "Dashboard en tiempo real con métricas financieras, rendimiento académico y auditoría de transacciones.",
      color: "bg-indigo-50 text-indigo-600",
      accent: "from-indigo-500 to-violet-500"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Multi-Rol y Seguridad",
      description: "Roles de Estudiante, Docente, Admin y Superadmin con permisos granulares y autenticación segura.",
      color: "bg-red-50 text-primary",
      accent: "from-red-500 to-rose-500"
    }
  ];

  return (
    <section className="py-24 md:py-32 bg-[#F9F6F0] px-6 lg:px-8 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/3 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 border border-primary/10 rounded-full text-primary text-[11px] font-black uppercase tracking-widest mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Todo lo que necesitas
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl md:text-5xl text-slate-900 font-extrabold mb-6 tracking-tight"
          >
            Una plataforma completa para
            <br />
            <span className="text-primary">tu institución educativa</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-sans text-lg text-slate-500 max-w-2xl mx-auto"
          >
            Herramientas profesionales para gestionar tu academia online de principio a fin.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08, duration: 0.5 }}
              className="bg-white p-8 rounded-3xl border border-slate-100 hover:border-slate-200/60 hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-500 relative group overflow-hidden"
            >
              {/* Top accent line */}
              <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${feature.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="font-sans text-xl font-bold text-slate-900 mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
              <p className="font-sans text-slate-500 leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   HOW IT WORKS — 3 Steps
   ═══════════════════════════════════════════════════════════════════ */
const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Regístrate Gratis",
      description: "Crea tu cuenta en menos de 30 segundos. Sin tarjeta de crédito, sin compromisos. Empieza a explorar la plataforma.",
      icon: <Users className="w-8 h-8" />
    },
    {
      number: "02",
      title: "Configura tu Aula",
      description: "Personaliza tu espacio con tu logo, colores y dominio. Agrega cursos, materiales y configura tus métodos de pago.",
      icon: <Palette className="w-8 h-8" />
    },
    {
      number: "03",
      title: "Vende y Certifica",
      description: "Publica tus cursos, recibe pagos automatizados y emite certificados oficiales con código QR verificable.",
      icon: <Rocket className="w-8 h-8" />
    }
  ];

  return (
    <section id="como-funciona" className="py-24 md:py-32 bg-white px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl md:text-5xl text-slate-900 font-extrabold mb-6 tracking-tight"
          >
            ¿Cómo <span className="text-primary italic">funciona</span>?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-sans text-lg text-slate-500 max-w-xl mx-auto"
          >
            En tres simples pasos tendrás tu aula virtual lista para vender cursos.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-24 left-[16.67%] right-[16.67%] h-[2px] bg-gradient-to-r from-primary/20 via-accent/30 to-primary/20" />

          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15, duration: 0.6 }}
              className="flex flex-col items-center text-center relative"
            >
              {/* Step number circle */}
              <div className="relative mb-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-[#5a0c17] flex items-center justify-center text-white shadow-xl shadow-primary/20">
                  {step.icon}
                </div>
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-accent text-[#1a0507] rounded-full flex items-center justify-center text-xs font-black shadow-lg">
                  {step.number}
                </span>
              </div>
              <h3 className="font-sans text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
              <p className="font-sans text-slate-500 leading-relaxed text-sm max-w-xs">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   PRICING — Plan cards
   ═══════════════════════════════════════════════════════════════════ */
const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      price: "Gratis",
      period: "",
      description: "Prueba la plataforma por 30 días sin costo.",
      features: [
        "1 curso activo",
        "Hasta 30 estudiantes",
        "Prueba gratuita de 30 días",
        "Certificados básicos",
        "Pagos manuales",
        "Soporte por email"
      ],
      cta: "Probar 30 Días Gratis",
      highlighted: false,
      color: "border-slate-200"
    },
    {
      name: "Profesional",
      price: "S/ 149",
      period: "/mes",
      description: "Para instituciones en crecimiento.",
      features: [
        "Cursos ilimitados",
        "Hasta 300 alumnos por curso",
        "Certificados con QR",
        "Pagos automáticos",
        "Subdominio personalizado",
        "Reportes avanzados",
        "Soporte prioritario"
      ],
      cta: "Comenzar Ahora",
      highlighted: true,
      color: "border-primary"
    },
    {
      name: "Enterprise",
      price: "Contactar",
      period: "",
      description: "Solución a medida para grandes instituciones.",
      features: [
        "Todo en Profesional",
        "Alumnos ilimitados por curso",
        "Dominio propio",
        "API personalizada",
        "Integración LMS",
        "Capacitación dedicada",
        "SLA garantizado"
      ],
      cta: "Contactar Ventas",
      highlighted: false,
      color: "border-slate-200"
    }
  ];

  return (
    <section className="py-24 md:py-32 bg-[#F9F6F0] px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/10 to-transparent" />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl md:text-5xl text-slate-900 font-extrabold mb-6 tracking-tight"
          >
            Planes para cada <span className="text-primary">necesidad</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-sans text-lg text-slate-500 max-w-xl mx-auto"
          >
            Sin costos ocultos. Escala cuando tu institución crezca.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className={`relative bg-white rounded-3xl border-2 ${plan.color} p-8 flex flex-col transition-all duration-500 hover:-translate-y-1 hover:shadow-xl ${plan.highlighted ? 'shadow-xl shadow-primary/10 scale-[1.02]' : 'shadow-sm'}`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                    Más Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-sans text-lg font-bold text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-slate-400 text-sm">{plan.description}</p>
              </div>

              <div className="mb-8">
                <span className="text-4xl font-black text-slate-900 tracking-tight">{plan.price}</span>
                {plan.period && <span className="text-slate-400 font-medium text-sm">{plan.period}</span>}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, fi) => (
                  <li key={fi} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CheckCircle className={`w-4 h-4 shrink-0 ${plan.highlighted ? 'text-primary' : 'text-accent'}`} />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                to="/login"
                className={`w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-widest text-center transition-all duration-300 block ${
                  plan.highlighted
                    ? 'bg-primary text-white hover:bg-primary-dark shadow-lg hover:shadow-xl'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   ACTIVE TENANTS — Showcase of running classrooms
   ═══════════════════════════════════════════════════════════════════ */
const ActiveTenants = () => {
  const [tenants, setTenants] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/api/v1/tenants/public')
      .then(({ data }) => {
        const list = data.data ?? data ?? [];
        setTenants(list.slice(0, 6));
      })
      .catch(() => {
        // Fallback demo data
        setTenants([
          { id: 1, name: "Academia Demo", slug: "demo", plan: "pro", status: "active" },
          { id: 2, name: "Instituto Jurídico Peruano", slug: "ijp", plan: "professional", status: "active" },
          { id: 3, name: "Centro de Capacitación RRHH", slug: "rrhh", plan: "starter", status: "active" },
        ]);
      });
  }, []);

  if (tenants.length === 0) return null;

  const planColors: Record<string, string> = {
    starter: "bg-slate-100 text-slate-600",
    pro: "bg-accent/10 text-accent",
    professional: "bg-primary/10 text-primary",
    enterprise: "bg-purple-100 text-purple-700",
    free: "bg-green-50 text-green-600",
  };

  return (
    <section className="py-24 md:py-32 bg-white px-6 lg:px-8 border-t border-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl md:text-5xl text-slate-900 font-extrabold mb-6 tracking-tight"
          >
            Aulas <span className="text-primary italic">activas</span> en la plataforma
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-sans text-lg text-slate-500 max-w-xl mx-auto"
          >
            Instituciones que ya confían en EduWanka para su gestión educativa.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {tenants.map((tenant, idx) => (
            <motion.div
              key={tenant.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-lg hover:border-slate-200 transition-all duration-300 group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 truncate">{tenant.name}</h4>
                  <p className="text-xs text-slate-400 font-medium">{tenant.slug}.eduwanka.net.pe</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${planColors[tenant.plan] || 'bg-slate-100 text-slate-500'}`}>
                  {tenant.plan}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]" />
                  Activa
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   FINAL CTA — Call to action banner
   ═══════════════════════════════════════════════════════════════════ */
const FinalCTA = () => {
  return (
    <section className="py-24 md:py-32 bg-gradient-to-br from-[#1a0507] via-[#7A0F1F] to-[#2a0509] px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-20 w-64 h-64 bg-accent/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 left-20 w-80 h-80 bg-white/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="w-16 h-16 bg-accent/15 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <GraduationCap className="w-8 h-8 text-accent" />
          </div>

          <h2 className="font-display text-3xl md:text-5xl text-white font-extrabold mb-6 tracking-tight">
            ¿Listo para transformar
            <br />
            <span className="text-accent italic">tu educación</span>?
          </h2>

          <p className="text-lg text-white/50 max-w-lg mx-auto mb-10 font-sans">
            Únete a las instituciones que ya están creciendo con EduWanka.
            Tu aula virtual te espera.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-accent text-[#1a0507] px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/35 hover:-translate-y-0.5 transition-all duration-300"
            >
              Crear Mi Aula Ahora
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contacto"
              className="inline-flex items-center gap-2 border-2 border-white/20 text-white px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest hover:bg-white/10 hover:border-white/30 transition-all duration-300"
            >
              Hablar con Ventas
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   HOME — Main exported component
   ═══════════════════════════════════════════════════════════════════ */
export default function Home() {
  return (
    <>
      <Hero />
      <Benefits />
      <HowItWorks />
      <Pricing />
      <ActiveTenants />
      <FinalCTA />
    </>
  );
}
