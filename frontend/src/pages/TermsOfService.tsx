import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, Info, CheckCircle2, ChevronRight, FileSpreadsheet, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

export default function TermsOfService() {
  const points = [
    {
      title: "1. Aceptación de los Términos",
      desc: "Al inscribirse en cualquiera de los diplomados, programas de especialización o cursos libres ofrecidos por EduWanka, el estudiante acepta de manera expresa la totalidad de las cláusulas académicas y financieras detalladas en este documento. Es responsabilidad del participante revisar estos términos periódicamente."
    },
    {
      title: "2. Matrícula y Compromisos Financieros",
      desc: "La inscripción oficial se consolida tras el pago de la cuota de matrícula. El alumno se compromete a cumplir puntualmente con el pago de las mensualidades establecidas en el plan de cuotas seleccionado. La mora reiterada o el retraso de más de dos cuotas consecutivas podrá resultar en la suspensión temporal de los accesos al Aula Virtual hasta la regularización de la deuda."
    },
    {
      title: "3. Régimen Académico y Certificaciones",
      desc: "Para obtener la certificación oficial universitaria, el alumno debe cumplir con: a) Una asistencia mínima del 80% a las sesiones (en vivo o grabadas según la modalidad), b) Calificación aprobatoria mínima de catorce (14) en las evaluaciones o trabajos finales del programa. Los trámites de expedición de diplomas se coordinan directamente con las universidades en convenio (UNT u otras licenciadas por SUNEDU)."
    },
    {
      title: "4. Propiedad Intelectual",
      desc: "Todos los contenidos, grabaciones de clases, diapositivas, expedientes, pericias y materiales de estudio proporcionados a través del Aula Virtual son propiedad intelectual exclusiva de EduWanka o de sus docentes ponentes. Queda prohibida la reproducción parcial, total, distribución, comercialización o difusión pública de los materiales sin el consentimiento expreso y por escrito de la institución."
    },
    {
      title: "5. Cancelaciones y Políticas de Devolución",
      desc: "Las solicitudes de retiro formal de un programa deben presentarse por escrito ante la coordinación académica. En caso de retiro dentro de los primeros siete (7) días de iniciado el programa, se podrá solicitar la devolución del importe de las cuotas mensuales abonadas (restando los gastos administrativos de matrícula). Pasado este plazo, no habrá lugar a reembolsos."
    }
  ];

  return (
    <div className="pt-24 font-sans bg-surface min-h-screen pb-16">
      {/* Banner Superior / Hero */}
      <section className="bg-primary text-white py-16 px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-5 h-full pointer-events-none">
          <Scale className="w-96 h-full text-white" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest text-accent"
          >
            <Scale className="w-3.5 h-3.5" /> Marco Legal e Institucional
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-5xl font-sans font-extrabold uppercase tracking-wide"
          >
            Términos de <span className="text-accent italic">Servicio</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-serif text-slate-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed"
          >
            Conoce tus derechos, compromisos académicos y las directrices normativas aplicables a nuestra comunidad educativa.
          </motion.p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 mt-12 grid grid-cols-1 gap-8">
        
        {/* Callout Banner Destacado: Libro de Reclamaciones */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-secondary/30 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-soft relative overflow-hidden group"
        >
          {/* Decorative left bar */}
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-secondary" />
          
          <div className="space-y-3 flex-1">
            <span className="bg-secondary/15 border border-secondary/20 text-secondary text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-sm inline-block">
              Atención al Consumidor
            </span>
            <h3 className="text-lg md:text-xl font-sans font-extrabold text-primary uppercase tracking-wide leading-tight">
              ¿Tienes algún reclamo o queja sobre nuestros servicios?
            </h3>
            <p className="font-serif text-slate-550 text-xs md:text-sm leading-relaxed">
              En cumplimiento del Código de Protección y Defensa del Consumidor del Perú, ponemos a tu disposición el **Libro de Reclamaciones Virtual**. Todas tus solicitudes son procesadas dentro de los plazos legales vigentes.
            </p>
          </div>
          <div className="shrink-0 w-full md:w-auto">
            <Link 
              to="/reclamaciones"
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-secondary text-primary font-sans font-black text-xs uppercase tracking-widest px-6 py-4 rounded-xl shadow-md hover:shadow-lg hover:brightness-105 active:translate-y-0.5 transition-all duration-300"
            >
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              <span>Libro de Reclamaciones</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>

        {/* Términos de Servicio - Listado */}
        <div className="space-y-6">
          {points.map((point, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-white p-6 md:p-8 rounded-2xl border border-slate-150 shadow-sm space-y-3"
            >
              <h3 className="font-sans font-extrabold text-primary text-base md:text-lg uppercase tracking-wide flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
                {point.title}
              </h3>
              <p className="font-serif text-slate-600 text-sm md:text-base leading-relaxed pl-7">
                {point.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Footer legal disclaimer */}
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl text-center space-y-2">
          <p className="font-sans text-[10px] uppercase font-black text-slate-400 tracking-widest">Resolución Jurídica</p>
          <p className="font-serif text-xs text-slate-500 max-w-xl mx-auto">Cualquier discrepancia legal, arbitral o contractual que surja en la interpretación de los presentes términos de servicio será resuelta de buena fe o, en su defecto, sometida a los tribunales del Cercado de Lima.</p>
        </div>

      </div>
    </div>
  );
}
