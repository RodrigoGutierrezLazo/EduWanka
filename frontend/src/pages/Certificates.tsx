import { motion } from "motion/react";
import {
  Award, ShieldCheck, QrCode, FileText, Palette,
  ArrowRight, CheckCircle, Download, Globe,
  Sparkles, Lock, Zap, Search, Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import React from "react";
import { apiClient } from "../lib/apiClient";
import { hasActiveTenant } from "../lib/tenant";

/* ═══════════════════════════════════════════════════════════════════
   CERTIFICATES SHOWCASE — SaaS Feature Page
   Explains the certification system, its implementation, and results.
   Also includes a live certificate verifier for social proof.
   ═══════════════════════════════════════════════════════════════════ */

const CertHero = () => (
  <section className="relative bg-gradient-to-br from-[#1a0507] via-[#7A0F1F] to-[#2a0509] pt-40 pb-24 px-6 lg:px-8 overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />
    <div className="absolute bottom-20 left-20 w-80 h-80 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

    <div className="max-w-7xl mx-auto relative z-10">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <div className="flex items-center gap-3 mb-6">
          <span className="px-4 py-1.5 bg-accent/15 border border-accent/30 rounded-full text-accent text-[11px] font-black uppercase tracking-widest">
            Sistema de Certificación
          </span>
        </div>
        <h1 className="font-display text-4xl md:text-6xl text-white font-extrabold mb-6 tracking-tight leading-tight">
          Certificados <span className="text-accent italic">verificables</span>
          <br />con un solo clic
        </h1>
        <p className="font-sans text-xl text-white/60 max-w-2xl leading-relaxed mb-8">
          Emite certificados oficiales con código QR, diseño personalizable y verificación pública instantánea. Garantiza la autenticidad de cada credencial académica.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link to="/login" className="inline-flex items-center gap-2 bg-accent text-[#1a0507] px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest shadow-lg shadow-accent/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
            Empezar a Certificar <Award className="w-4 h-4" />
          </Link>
          <a href="#verificador" className="inline-flex items-center gap-2 border-2 border-white/20 text-white px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest hover:bg-white/10 hover:border-white/30 transition-all duration-300">
            <Search className="w-4 h-4" /> Verificar Certificado
          </a>
        </div>
      </motion.div>
    </div>
  </section>
);

const CertFeatures = () => {
  const features = [
    { icon: <Palette className="w-6 h-6" />, title: "Diseño Personalizable", desc: "Elige entre plantillas profesionales o crea tu propio diseño con logo institucional, firma digital y colores de marca.", color: "bg-purple-50 text-purple-600" },
    { icon: <QrCode className="w-6 h-6" />, title: "Código QR Verificable", desc: "Cada certificado incluye un código QR único que permite la verificación pública instantánea desde cualquier dispositivo.", color: "bg-blue-50 text-blue-600" },
    { icon: <Lock className="w-6 h-6" />, title: "Anti-Falsificación", desc: "Código único alfanumérico vinculado a la base de datos. Imposible de duplicar o falsificar.", color: "bg-red-50 text-primary" },
    { icon: <Download className="w-6 h-6" />, title: "Descarga en PDF", desc: "Los alumnos descargan su certificado en PDF de alta calidad desde su panel, listo para imprimir o compartir.", color: "bg-green-50 text-green-600" },
    { icon: <Zap className="w-6 h-6" />, title: "Emisión Masiva", desc: "Genera certificados por lote para un curso completo. Un clic y todos los aprobados reciben su certificado.", color: "bg-accent/10 text-accent" },
    { icon: <Globe className="w-6 h-6" />, title: "Verificación Pública", desc: "Cualquier empleador o institución puede verificar la validez del certificado desde la web sin crear cuenta.", color: "bg-indigo-50 text-indigo-600" },
  ];

  return (
    <section className="py-24 md:py-32 bg-[#F9F6F0] px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="font-display text-3xl md:text-5xl text-slate-900 font-extrabold mb-4 tracking-tight">
            Características del <span className="text-primary">sistema</span>
          </motion.h2>
          <p className="font-sans text-lg text-slate-500 max-w-2xl mx-auto">
            Todo lo que necesitas para certificar con profesionalismo y seguridad.
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

const CertImplementation = () => (
  <section className="py-24 md:py-32 bg-white px-6 lg:px-8">
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Mockup certificate preview */}
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
          className="order-2 lg:order-1">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-8 border border-slate-200">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 relative overflow-hidden">
              {/* Decorative border */}
              <div className="absolute inset-2 border-2 border-primary/10 rounded-xl pointer-events-none" />
              <div className="absolute inset-3 border border-accent/20 rounded-lg pointer-events-none" />

              <div className="relative z-10 text-center space-y-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Award className="w-8 h-8 text-accent" />
                </div>
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">Certificado de Estudios</p>
                <h3 className="font-display text-xl font-bold text-primary">Diplomado en Gestión Pública</h3>
                <p className="text-sm text-slate-500">Otorgado a</p>
                <p className="font-display text-2xl font-bold text-slate-900 italic">María Torres Guzmán</p>
                <div className="flex items-center justify-center gap-6 pt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  <span>DNI: 12345678</span>
                  <span>•</span>
                  <span>Nota: 18/20</span>
                </div>
                <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                  <div className="text-left">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Código</p>
                    <p className="text-xs font-black text-primary">CERT-2026-A7X2</p>
                  </div>
                  <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
          className="order-1 lg:order-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-full text-primary text-[11px] font-black uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Proceso de certificación
          </div>
          <h2 className="font-display text-3xl md:text-4xl text-slate-900 font-extrabold mb-6 tracking-tight">
            De la evaluación al <span className="text-primary italic">certificado</span>
          </h2>
          <div className="space-y-5">
            {[
              { step: "1", title: "El alumno aprueba el curso", desc: "Completa los módulos, cuestionarios y tareas con la nota mínima requerida." },
              { step: "2", title: "El admin selecciona la plantilla", desc: "Elige o personaliza el diseño del certificado con logo, colores y firma." },
              { step: "3", title: "Emisión individual o masiva", desc: "Genera el certificado para un alumno o para todo el curso con un clic." },
              { step: "4", title: "Descarga y verificación", desc: "El alumno descarga su PDF. Cualquiera puede verificarlo con el código QR." },
            ].map((s, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-black shrink-0">{s.step}</div>
                <div>
                  <h4 className="font-sans font-bold text-slate-900 mb-1 text-sm">{s.title}</h4>
                  <p className="font-sans text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

/* Live Certificate Verifier */
const CertVerifier = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [certificateCode, setCertificateCode] = useState("");
  const [dniSearch, setDniSearch] = useState("");
  const [certificateData, setCertificateData] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setSearchError("");
    setCertificateData(null);

    try {
      const response = await apiClient.post('/api/v1/certificates/verify', {
        certificate_code: certificateCode,
        dni: dniSearch
      });
      if (response.data?.valid) {
        setCertificateData(response.data.data);
      } else {
        setSearchError(response.data.message || "Certificado no válido.");
      }
    } catch (error: any) {
      if (error.response?.status === 404) setSearchError("Certificado no encontrado o código inválido.");
      else if (error.response?.status === 410) setSearchError("Este certificado fue revocado o está inactivo.");
      else if (error.response?.status === 422) setSearchError(error.response?.data?.message || "El DNI no coincide.");
      else if (error.response?.status === 429) setSearchError("Demasiados intentos. Espera un momento.");
      else setSearchError("Ocurrió un error al verificar.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <section id="verificador" className="py-24 md:py-32 bg-white px-6 lg:px-8 border-t border-slate-100">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="font-display text-3xl md:text-4xl text-slate-900 font-extrabold mb-4 tracking-tight">
            <ShieldCheck className="w-8 h-8 text-green-600 inline-block mr-2 -mt-1" />
            Verificador Público
          </motion.h2>
          <p className="font-sans text-slate-500 max-w-lg mx-auto">
            {hasActiveTenant() 
              ? "¿Recibiste un certificado de nuestra institución? Verifica su autenticidad aquí."
              : "¿Recibiste un certificado de EduWanka? Verifica su autenticidad aquí."}
          </p>
        </div>

        <div className="bg-slate-50 rounded-3xl p-8 md:p-10 border border-slate-200">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">DNI del Alumno</label>
                <input type="text" placeholder="Ej: 12345678" required value={dniSearch} onChange={e => setDniSearch(e.target.value)}
                  className="w-full bg-white border-2 border-slate-200 focus:border-primary p-3.5 rounded-xl font-sans font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300 text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Código de Certificado</label>
                <input type="text" placeholder="Ej: CERT-2026-XXXX" required value={certificateCode} onChange={e => setCertificateCode(e.target.value)}
                  className="w-full bg-white border-2 border-slate-200 focus:border-primary p-3.5 rounded-xl font-sans font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300 text-sm" />
              </div>
            </div>

            {searchError && (
              <div className="p-3 bg-red-50 text-red-600 font-sans font-bold text-sm rounded-xl border border-red-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" /> {searchError}
              </div>
            )}

            <button type="submit" disabled={isSearching}
              className={`w-full bg-primary text-white font-black py-4 rounded-xl uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all ${isSearching ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-dark shadow-lg hover:shadow-xl'}`}>
              {isSearching ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> Buscando...</> : <><Search className="w-4 h-4" /> Verificar Certificado</>}
            </button>
          </form>

          {certificateData && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 bg-white p-6 rounded-2xl border border-green-200">
              <div className="flex items-center text-green-600 font-bold text-sm mb-4 gap-2">
                <CheckCircle className="w-5 h-5" /> Certificado Verificado
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Alumno</p><p className="font-bold text-slate-900">{certificateData.student_name}</p></div>
                <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Curso</p><p className="font-bold text-slate-900">{certificateData.course_title || certificateData.course_code}</p></div>
                <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Código</p><p className="font-bold text-primary">{certificateData.certificate_code}</p></div>
                <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Nota</p><p className="font-bold text-slate-900">{certificateData.grade || certificateData.score}</p></div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

const CertCTA = () => (
  <section className="py-20 bg-gradient-to-br from-[#1a0507] via-[#7A0F1F] to-[#2a0509] px-6 lg:px-8">
    <div className="max-w-3xl mx-auto text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <h2 className="font-display text-3xl md:text-4xl text-white font-extrabold mb-6 tracking-tight">
          Certifica con <span className="text-accent italic">confianza</span>
        </h2>
        <p className="text-white/50 mb-8 max-w-lg mx-auto">
          Tus certificados reflejan tu marca. Emítelos de forma segura, verificable y profesional.
        </p>
        <Link to="/login" className="inline-flex items-center gap-2 bg-accent text-[#1a0507] px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest shadow-lg shadow-accent/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          Comenzar Ahora <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </div>
  </section>
);

export default function Certificates() {
  const isTenant = hasActiveTenant();

  if (isTenant) {
    return (
      <div className="min-h-screen bg-[#F9F6F0] pt-32 pb-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <CertVerifier />
        </div>
      </div>
    );
  }

  return (
    <div>
      <CertHero />
      <CertFeatures />
      <CertImplementation />
      <CertVerifier />
      <CertCTA />
    </div>
  );
}
