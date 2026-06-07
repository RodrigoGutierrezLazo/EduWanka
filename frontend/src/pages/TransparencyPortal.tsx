import React from 'react';
import { FileText, Download, Building, Users, Calendar, ArrowUpRight, BarChart } from 'lucide-react';
import { motion } from 'motion/react';

export default function TransparencyPortal() {
  const documents = [
    {
      title: "Estatutos Institucionales de EduWanka",
      category: "Constitución y Reglamentos",
      size: "2.4 MB",
      date: "Enero 2026",
      desc: "Documento oficial de fundación, fines educativos, organización orgánica y directrices de gobierno del instituto."
    },
    {
      title: "Reglamento Académico del Estudiante",
      category: "Académico",
      size: "1.8 MB",
      date: "Marzo 2026",
      desc: "Normas de permanencia, evaluación, escala de calificaciones, requisitos de egreso y directivas de disciplina."
    },
    {
      title: "Estados Financieros Anuales (Auditados)",
      category: "Finanzas",
      size: "4.1 MB",
      date: "Diciembre 2025",
      desc: "Reporte de ingresos, egresos, solvencia y plan de inversión tecnológica en infraestructura académica virtual."
    },
    {
      title: "Resoluciones de Convenios Universitarios",
      category: "Convenios",
      size: "3.2 MB",
      date: "Febrero 2026",
      desc: "Archivo completo de convenios vigentes para la co-organización y certificación universitaria autorizada."
    }
  ];

  const handleSimulatedDownload = (docName: string) => {
    alert(`Iniciando descarga simulada del documento: "${docName}"\nFormato: PDF compilado oficial de EduWanka.`);
  };

  return (
    <div className="pt-24 font-sans bg-surface min-h-screen pb-16">
      {/* Hero Header */}
      <section className="bg-primary text-white py-16 px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-5 h-full pointer-events-none">
          <Building className="w-96 h-full text-white" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest text-accent"
          >
            <Building className="w-3.5 h-3.5" /> Confianza y Gobierno
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-5xl font-sans font-extrabold uppercase tracking-wide"
          >
            Portal de <span className="text-accent italic">Transparencia</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-serif text-slate-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed"
          >
            Reforzamos nuestro compromiso ético y de calidad. Ponemos a disposición del público general y reguladores la información clave de nuestra gestión.
          </motion.p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 mt-12 space-y-12">
        
        {/* Statistical Overview Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Estudiantes Activos", value: "+1,200", desc: "Formación continua" },
            { label: "Diplomados Ejecutados", value: "34", desc: "A nivel nacional" },
            { label: "Convenios Universitarios", value: "3", desc: "Con aval oficial" },
            { label: "Índice de Graduación", value: "94.2%", desc: "Culminación exitosa" }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.08 }}
              className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm text-center space-y-1"
            >
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{stat.label}</p>
              <h4 className="text-2xl font-extrabold text-primary font-sans leading-none">{stat.value}</h4>
              <p className="text-[9px] text-secondary font-black uppercase tracking-widest">{stat.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Downloadable Documents Section */}
        <div className="space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="font-sans font-extrabold text-primary text-xl uppercase tracking-wide">
              Documentación y Resoluciones Oficiales
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">Haz clic en descargar para obtener copias verificadas en formato PDF de nuestros reglamentos y estados auditados.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {documents.map((doc, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-soft flex flex-col justify-between gap-4 group hover:border-secondary/35 transition-all duration-300"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="bg-secondary/15 text-secondary text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded shadow-sm">
                      {doc.category}
                    </span>
                    <span className="text-[10px] font-bold text-slate-450 font-sans flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {doc.date}
                    </span>
                  </div>
                  <h3 className="font-sans font-extrabold text-primary text-sm md:text-base leading-snug group-hover:text-secondary transition-colors">
                    {doc.title}
                  </h3>
                  <p className="font-serif text-slate-500 text-xs leading-relaxed line-clamp-2">
                    {doc.desc}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tamaño: {doc.size}</span>
                  <button
                    onClick={() => handleSimulatedDownload(doc.title)}
                    className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-secondary/20 text-primary border border-slate-200 hover:border-secondary/20 px-3.5 py-1.5 rounded-lg text-xs font-sans font-bold cursor-pointer transition"
                  >
                    <Download className="w-3.5 h-3.5 text-secondary shrink-0" />
                    Descargar PDF
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Transparency Commitment / Compliance */}
        <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center gap-6">
          <div className="w-14 h-14 bg-white border border-slate-150 rounded-2xl flex items-center justify-center shrink-0 text-secondary">
            <BarChart className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h4 className="font-sans font-extrabold text-primary text-base uppercase tracking-wide leading-none">Canal Ético y de Denuncias</h4>
            <p className="font-serif text-slate-550 text-xs md:text-sm leading-relaxed">
              EduWanka mantiene una política de tolerancia cero frente a actos de corrupción, sobornos o cobros no oficiales. Si detectas cualquier comportamiento indebido por parte de nuestro personal académico o de ventas, por favor denúncialo al canal de ética: **cumplimiento@eduwanka.edu.pe**. Tu identidad será 100% protegida.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
