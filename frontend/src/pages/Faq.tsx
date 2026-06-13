import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ChevronDown, Sparkles, MessageSquare, ShieldCheck, HeartHandshake, Search, Zap, Lock, CreditCard, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Tilt3D from '../components/Tilt3D';

interface FaqItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}

const FaqItem = ({ question, answer, isOpen, onClick }: FaqItemProps) => {
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between py-6 text-left transition-colors group"
      >
        <span className="font-sans font-bold text-slate-800 text-base md:text-lg group-hover:text-primary transition-colors pr-4">
          {question}
        </span>
        <div className={`w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-primary/5 transition-all duration-300 ${isOpen ? 'rotate-180 bg-primary/5 text-primary' : ''}`}>
          <ChevronDown className="w-4 h-4" />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="font-serif text-slate-500 text-sm md:text-base leading-relaxed pb-6 pr-6">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "¿Qué es EduWanka y cómo ayuda a mi institución?",
      answer: "EduWanka es una plataforma de software como servicio (SaaS) que te permite crear tu propia aula virtual totalmente personalizada bajo tu marca en pocos minutos. Proporcionamos todo lo que necesitas: un panel de control administrativo, gestión de cursos, carga de archivos, registro de asistencia con QR, exámenes automatizados, pasarelas de pago y emisión de certificados verificables con código QR."
    },
    {
      question: "¿Cómo funciona la prueba gratuita de 30 días?",
      answer: "Al registrarte en nuestro plan Starter, obtienes acceso completo a todas las herramientas de la plataforma de forma gratuita durante 30 días. No se requiere tarjeta de crédito para iniciar. Al finalizar el período, puedes elegir continuar en ese plan pagando la mensualidad o cambiarte a un plan superior acorde a tus necesidades."
    },
    {
      question: "¿Puedo usar mi propio dominio personalizado (ej: aula.miacademia.com)?",
      answer: "¡Sí, por supuesto! Aunque te proporcionamos un subdominio gratuito (ej: tuacademia.eduwanka.net.pe), en nuestro plan Profesional y Enterprise puedes configurar y enlazar tu propio dominio de forma totalmente transparente para que tus estudiantes nunca salgan de tu ecosistema de marca."
    },
    {
      question: "¿Cómo recibo los pagos de los cursos que vendo?",
      answer: "EduWanka incluye un módulo de pagos integrado donde tus alumnos pueden subir sus comprobantes de transferencias bancarias, depósitos, o billeteras digitales como Yape y Plin. Como administrador, podrás validar estas transacciones desde tu panel y dar acceso inmediato al curso. También ofrecemos integraciones directas con pasarelas de pago online en el plan Enterprise."
    },
    {
      question: "¿Cuál es el límite de alumnos y cursos en el plan Profesional?",
      answer: "El plan Profesional te permite crear cursos ilimitados y registrar hasta 300 alumnos activos por cada curso que publiques. Si tu institución requiere una capacidad mayor o alumnos ilimitados en todos tus programas, nuestro plan Enterprise es ideal para ti."
    },
    {
      question: "¿Los certificados emitidos son seguros y verificables?",
      answer: "Sí. Cada certificado emitido a través de EduWanka cuenta con un código QR único y una firma digital. Cualquier entidad pública o privada puede escanear el código QR para validar al instante la autenticidad del diploma en nuestro verificador público, garantizando la seguridad y evitando falsificaciones."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#1c1507] via-[#856524] to-[#2d220a] pt-40 pb-32 px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-white/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Column: Text */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.7 }}
              className="text-left"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-white text-[11px] font-black uppercase tracking-widest mb-6">
                <HelpCircle className="w-3.5 h-3.5" />
                Soporte y Respuestas
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-white font-extrabold mb-6 tracking-tight leading-tight">
                Preguntas <span className="text-white italic">Frecuentes</span>
              </h1>
              <p className="font-sans text-lg lg:text-xl text-white/70 max-w-2xl leading-relaxed">
                Encuentra respuestas rápidas sobre el funcionamiento de nuestra plataforma SaaS, planes, facturación y la creación de tu aula virtual.
              </p>
            </motion.div>

            {/* Right Column: 3D Help Center Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="hidden lg:block relative"
            >
              <Tilt3D maxTilt={6}>
                <div className="relative" style={{ transformStyle: "preserve-3d" }}>
                  {/* Help Desk Main Card */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
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
                        <span className="text-[9px] text-white/30 font-medium">soporte.eduwanka.net.pe</span>
                      </div>
                    </div>

                    {/* Support Center Title & Search */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h4 className="text-white font-extrabold text-sm">¿En qué podemos ayudarte hoy?</h4>
                        <p className="text-[9px] text-white/40">Busca en nuestra base de conocimientos</p>
                      </div>

                      {/* Search Bar Mockup */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                        <div className="w-full bg-white/5 border border-white/10 p-2.5 pl-9 rounded-xl text-xs text-white/30 text-left font-medium">
                          ¿Cómo configurar mi dominio?...
                        </div>
                      </div>

                      {/* Categories Grid */}
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        {[
                          { label: "Configurar Aula", icon: <Zap className="w-3.5 h-3.5" /> },
                          { label: "Medios de Pago", icon: <CreditCard className="w-3.5 h-3.5" /> },
                          { label: "Seguridad y Roles", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
                          { label: "Gestión Cursos", icon: <HelpCircle className="w-3.5 h-3.5" /> },
                        ].map((cat, idx) => (
                          <div key={idx} className="bg-white/[0.02] border border-white/5 p-2.5 rounded-xl flex items-center gap-2 text-[10px] font-bold text-white/60 hover:bg-white/5 hover:text-white transition-all">
                            <div className="text-accent">{cat.icon}</div>
                            <span className="truncate">{cat.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  {/* Floating card 1: Ticket Resolved status */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="absolute -bottom-6 -left-8 max-w-[190px]"
                    style={{ zIndex: 30, transformStyle: "preserve-3d" }}
                  >
                    <motion.div
                      animate={{ y: [0, -7, 0] }}
                      transition={{ duration: 5, delay: 0.3, repeat: Infinity, ease: "easeInOut" }}
                      className="bg-white rounded-2xl shadow-2xl p-3.5 border border-slate-100 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 bg-secondary/15 rounded-xl flex items-center justify-center shrink-0 text-secondary">
                        <CheckCircle className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-800 leading-tight">Ticket #1024</p>
                        <p className="text-[8px] text-secondary font-bold mt-0.5">Resuelto con éxito</p>
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Floating card 2: Chat support bubble */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1, duration: 0.5 }}
                    className="absolute -top-6 -right-6 max-w-[200px]"
                    style={{ zIndex: 40, transformStyle: "preserve-3d" }}
                  >
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 6, delay: 0.9, repeat: Infinity, ease: "easeInOut" }}
                      className="bg-white rounded-2xl shadow-2xl p-3.5 border border-slate-100 flex items-center gap-3"
                    >
                      <div className="w-7 h-7 bg-accent/20 rounded-full flex items-center justify-center shrink-0 text-accent font-black text-[10px]">
                        EW
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-800 leading-tight">Soporte EduWanka</p>
                        <p className="text-[8px] text-slate-400 font-medium mt-0.5">¿Dudas con la instalación?</p>
                      </div>
                    </motion.div>
                  </motion.div>

                </div>
              </Tilt3D>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Accordion List Section */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Box (Help desk style) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-soft">
                <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary mb-4">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="font-sans font-bold text-slate-800 text-base mb-2">¿Aún tienes dudas?</h3>
                <p className="font-serif text-slate-500 text-xs leading-relaxed mb-4">
                  Si no encontraste la respuesta que buscabas, nuestro equipo de soporte está listo para ayudarte en todo momento.
                </p>
                <Link 
                  to="/contacto"
                  className="inline-flex items-center gap-1 text-xs font-bold text-secondary uppercase tracking-wider hover:text-primary transition-colors"
                >
                  Contáctanos ahora <span className="text-sm">→</span>
                </Link>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-soft">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-sans font-bold text-slate-800 text-base mb-2">Seguridad y Respaldo</h3>
                <p className="font-serif text-slate-500 text-xs leading-relaxed">
                  Tus datos y los de tus alumnos están protegidos bajo protocolos SSL avanzados y copias de seguridad automáticas diarias.
                </p>
              </div>
            </div>

            {/* Right Box (Accordion) */}
            <div className="lg:col-span-8 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-soft">
              <div className="divide-y divide-slate-100">
                {faqs.map((faq, idx) => (
                  <FaqItem
                    key={idx}
                    question={faq.question}
                    answer={faq.answer}
                    isOpen={openIndex === idx}
                    onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Trust CTA Section */}
      <section className="py-20 bg-white border-t border-slate-100 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h2 className="font-display text-2xl md:text-4xl text-slate-900 font-extrabold mb-4">
            Empezar es completamente gratis
          </h2>
          <p className="font-sans text-slate-500 max-w-md mx-auto text-sm md:text-base mb-8 leading-relaxed">
            Obtén tu aula virtual activa hoy mismo con nuestra prueba sin costo de 30 días. Sin compromisos.
          </p>
          <Link 
            to="/login"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-full font-sans font-bold text-xs uppercase tracking-widest shadow-md hover:bg-primary-dark transition-all"
          >
            Comenzar Prueba Gratis <Sparkles className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
