import React from 'react';
import { Award, Landmark, GraduationCap, FileCheck, CheckCircle, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export default function Accreditations() {
  const partners = [
    {
      icon: <Landmark className="w-8 h-8" />,
      title: "Universidad Nacional de Trujillo",
      subtitle: "Convenio de Cooperación Académica",
      desc: "Nuestros diplomados de alta especialización cuentan con el respaldo de la Universidad Nacional de Trujillo (UNT), una de las universidades públicas más prestigiosas del país, licenciada por la SUNEDU.",
      badge: "Acreditación Universitaria Oficial",
      details: ["Emisión conjunta de diplomas", "Firma digital y registro en base oficial", "Suma de créditos académicos oficiales (24 créditos / 384 horas por módulo)"]
    },
    {
      icon: <GraduationCap className="w-8 h-8" />,
      title: "Respaldo y Licenciamiento SUNEDU",
      subtitle: "Cumplimiento del Plan Curricular Universitario",
      desc: "Toda nuestra currícula académica se adhiere rigurosamente al marco de créditos universitarios de posgrado, garantizando validez oficial total en el territorio nacional e idoneidad para concursos públicos.",
      badge: "Sólido Valor Curricular",
      details: ["Apto para concursos públicos (CAS / CAP)", "Válido para ascensos de carrera en el sector estatal", "Estructura académica de posgrado"]
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Colegios de Abogados y de Árbitros",
      subtitle: "Validación Gremial y Profesional",
      desc: "Los diplomados enfocados en arbitraje, conciliación y peritaje son convalidados y recomendados por importantes corporaciones gremiales jurídicas del norte y centro del país.",
      badge: "Respaldo Gremial Especializado",
      details: ["Habilitación para Registro de Árbitros en el MINJUS", "Reconocimiento por asociaciones de secretarios arbitrales", "Ponentes magistrales en activo gremial"]
    }
  ];

  return (
    <div className="pt-24 font-sans bg-surface min-h-screen pb-16">
      {/* Hero Banner */}
      <section className="bg-primary text-white py-16 px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-5 h-full pointer-events-none">
          <Award className="w-96 h-full text-white" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest text-accent"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Calidad de Excelencia
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-5xl font-sans font-extrabold uppercase tracking-wide"
          >
            Acreditaciones y <span className="text-accent italic">Respaldo</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-serif text-slate-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed"
          >
            Nuestros programas académicos están respaldados por convenios institucionales de alto nivel, garantizando el máximo valor a tu currículum profesional.
          </motion.p>
        </div>
      </section>

      {/* Grid of accreditations */}
      <div className="max-w-6xl mx-auto px-6 mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {partners.map((partner, pIdx) => (
            <motion.div
              key={pIdx}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: pIdx * 0.15, duration: 0.5 }}
              className="bg-white rounded-2xl border border-slate-150 p-6 md:p-8 flex flex-col justify-between shadow-sm hover:shadow-soft hover:border-secondary/30 transition-all duration-350 relative group"
            >
              <div className="space-y-5">
                {/* Icon box */}
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-primary transition-all duration-300">
                  {partner.icon}
                </div>
                
                <div className="space-y-2">
                  <span className="bg-secondary/10 text-secondary text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded inline-block">
                    {partner.badge}
                  </span>
                  <h3 className="font-sans font-extrabold text-primary text-lg leading-tight">
                    {partner.title}
                  </h3>
                  <p className="text-[10px] text-secondary font-black uppercase tracking-wider leading-none">
                    {partner.subtitle}
                  </p>
                </div>

                <p className="font-serif text-slate-550 text-xs md:text-sm leading-relaxed">
                  {partner.desc}
                </p>

                {/* Scope details */}
                <div className="border-t border-slate-100 pt-4 space-y-2.5">
                  <p className="text-[10px] font-sans font-black text-slate-400 uppercase tracking-widest">Alcance Académico</p>
                  <ul className="space-y-2">
                    {partner.details.map((detail, dIdx) => (
                      <li key={dIdx} className="flex items-start gap-2 text-xs text-slate-655 font-medium leading-tight">
                        <FileCheck className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Global ACCREDITATION seal */}
        <div className="mt-16 bg-primary rounded-2xl border border-white/10 p-8 md:p-12 text-center text-white space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-gradient from-secondary/10 to-transparent opacity-40 pointer-events-none" />
          
          <div className="max-w-2xl mx-auto space-y-4 relative z-10">
            <h3 className="font-sans font-extrabold text-lg md:text-2xl uppercase tracking-wide">
              ¿Cómo verificar el registro de tu certificación?
            </h3>
            <p className="font-serif text-xs md:text-sm text-slate-300 leading-relaxed">
              Todos los diplomas emitidos por EduWanka cuentan con un código QR único impreso en el anverso. Este código permite el acceso inmediato a nuestra base de datos institucional en vivo, confirmando la legitimidad del egresado, nota, módulo y fecha de emisión.
            </p>
            <div className="pt-4 flex flex-wrap gap-4 justify-center">
              <span className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-full text-xs font-sans font-semibold text-slate-200">
                <CheckCircle className="w-4 h-4 text-secondary" /> Base de Datos Oficial
              </span>
              <span className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-full text-xs font-sans font-semibold text-slate-200">
                <CheckCircle className="w-4 h-4 text-secondary" /> Firma Digital Homologada
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
