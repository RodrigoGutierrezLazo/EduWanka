import React, { useState } from 'react';
import { Shield, Eye, Lock, RefreshCw, FileText, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PolicySection {
  id: string;
  icon: React.ReactNode;
  title: string;
  content: string[];
}

export default function PrivacyPolicy() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>('general');

  const sections: PolicySection[] = [
    {
      id: 'general',
      icon: <Shield className="w-5 h-5" />,
      title: '1. Compromiso General de Privacidad',
      content: [
        'En EduWanka (Instituto Nacional de Alta Especialización Profesional), valoramos profundamente la confianza que depositas en nosotros al compartir tus datos personales. Nuestro compromiso con tu privacidad se rige por la Ley N° 29733 (Ley de Protección de Datos Personales de la República del Perú) y su reglamento.',
        'Esta Política de Privacidad describe cómo recopilamos, almacenamos, procesamos y protegemos la información personal que nos proporcionas al registrarte en nuestros diplomados, navegar en nuestro sitio web o utilizar el Aula Virtual.',
        'Nos aseguramos de emplear altos estándares de seguridad tecnológica y organizativa para evitar el tratamiento no autorizado, la pérdida, alteración o filtración de tu información.'
      ]
    },
    {
      id: 'collection',
      icon: <Eye className="w-5 h-5" />,
      title: '2. Información que Recopilamos',
      content: [
        'Para brindarte una experiencia académica de excelencia y emitir las acreditaciones oficiales correspondientes, recopilamos los siguientes datos personales:',
        '• Identificación básica: Nombre completo, número de DNI o pasaporte, fecha de nacimiento y género.',
        '• Datos de contacto: Correo electrónico personal e institucional, número de celular/teléfono y dirección de domicilio.',
        '• Información académica y profesional: Profesión, institución de egreso, currículum vitae y especialidad de interés.',
        '• Datos financieros de pago: Comprobantes de transferencia, depósitos bancarios o transacciones a través de billeteras digitales (como Yape/Plin) necesarios para la convalidación de tus cuotas académicas.'
      ]
    },
    {
      id: 'use',
      icon: <RefreshCw className="w-5 h-5" />,
      title: '3. Finalidad del Tratamiento de Datos',
      content: [
        'Tus datos personales serán tratados exclusivamente para las siguientes finalidades académicas y administrativas:',
        '• Matrícula y registro en los programas académicos, cursos de posgrado y diplomados seleccionados.',
        '• Gestión del Aula Virtual, incluyendo la habilitación de accesos, soporte técnico de usuarios y el registro de tu asistencia, calificaciones y entregas de tareas.',
        '• Tramitación, impresión e incorporación oficial de tus certificados universitarios ante los registros y registros de convenios correspondientes (UNT, SUNEDU, etc.).',
        '• Envío de comunicaciones académicas, alertas de clases en vivo y notificaciones de cobranza o estados de cuenta.',
        '• Envío facultativo y consentido de promociones comerciales, lanzamientos de nuevos cursos de especialización y boletines jurídicos de EduWanka.'
      ]
    },
    {
      id: 'rights',
      icon: <Lock className="w-5 h-5" />,
      title: '4. Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)',
      content: [
        'Como titular de tus datos personales, tienes el pleno derecho constitucional de ejercer tus derechos ARCO en cualquier momento:',
        '• Acceso: Solicitar información sobre qué datos personales tuyos poseemos en nuestros registros.',
        '• Rectificación: Exigir la actualización o corrección de tus datos si son erróneos, incompletos o están desactualizados.',
        '• Cancelación: Solicitar la supresión de tus datos de nuestros sistemas cuando consideres que ya no son necesarios para los fines que fueron recopilados.',
        '• Oposición: Negarte al uso de tus datos personales para fines específicos (por ejemplo, comunicaciones promocionales de mercadeo).',
        'Para ejercer cualquiera de estos derechos, puedes enviar una solicitud formal por escrito a nuestro correo oficial: legal@eduwanka.edu.pe, adjuntando una copia digital de tu DNI. Responderemos tu requerimiento dentro del plazo establecido por la normativa peruana.'
      ]
    },
    {
      id: 'sharing',
      icon: <FileText className="w-5 h-5" />,
      title: '5. Transferencia de Datos a Terceros',
      content: [
        'EduWanka no vende ni alquila tus datos personales bajo ninguna circunstancia. Tus datos solo se compartirán con terceros en los siguientes escenarios estrictamente necesarios:',
        '• Universidades e Instituciones Certificadoras: Para la correcta emisión y registro de las acreditaciones universitarias de los diplomados.',
        '• Proveedores Tecnológicos Clave: Proveedores de hosting de servidores, infraestructura de pasarela de pago o servicios de mensajería automatizada académica que cumplan con la Ley N° 29733.',
        '• Mandato Legal: En cumplimiento de resoluciones judiciales, requerimientos de la SUNEDU, Indecopi, Fiscalía de la Nación u órganos regulatorios del Estado que lo exijan formalmente.'
      ]
    }
  ];

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.content.some(para => para.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="pt-24 font-sans bg-surface min-h-screen pb-16">
      {/* Premium Hero Banner */}
      <section className="bg-primary text-white py-16 px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-5 h-full pointer-events-none">
          <Shield className="w-96 h-full text-white" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest text-accent"
          >
            <Shield className="w-3.5 h-3.5" /> Seguridad e Integridad
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-5xl font-sans font-extrabold uppercase tracking-wide"
          >
            Política de <span className="text-accent italic">Privacidad</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-serif text-slate-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed"
          >
            En cumplimiento con la Ley de Protección de Datos Personales N° 29733 de la República del Perú. Tu tranquilidad y confidencialidad son nuestra prioridad.
          </motion.p>
        </div>
      </section>

      {/* Main Layout Container */}
      <div className="max-w-4xl mx-auto px-6 mt-12">
        
        {/* Real-time Search Box */}
        <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-4 mb-8 flex items-center justify-between gap-4">
          <input 
            type="text" 
            placeholder="Buscar palabras clave en la política (ej. ARCO, DNI, cookies...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs text-primary bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition font-medium"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="text-xs text-slate-400 hover:text-primary font-bold uppercase transition shrink-0"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Content Section */}
        <div className="space-y-4">
          {filteredSections.map((section) => {
            const isOpen = activeSection === section.id;
            return (
              <motion.div
                key={section.id}
                layout
                className={`bg-white rounded-2xl border transition-all duration-300 ${
                  isOpen ? 'border-secondary/40 shadow-soft' : 'border-slate-150 shadow-sm hover:border-slate-300'
                }`}
              >
                {/* Header click bar */}
                <button
                  type="button"
                  onClick={() => setActiveSection(isOpen ? null : section.id)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                      isOpen ? 'bg-secondary text-primary' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {section.icon}
                    </div>
                    <h3 className="font-sans font-extrabold text-sm md:text-base text-primary uppercase tracking-wide">
                      {section.title}
                    </h3>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-secondary' : ''
                  }`} />
                </button>

                {/* Animated content list */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-1 border-t border-slate-100 space-y-4 font-serif text-slate-600 text-sm md:text-base leading-relaxed">
                        {section.content.map((paragraph, pIdx) => (
                          <p key={pIdx}>{paragraph}</p>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {filteredSections.length === 0 && (
            <div className="text-center py-16 bg-slate-50 border border-slate-200 border-dashed rounded-2xl text-slate-400">
              No se encontraron coincidencias para tu búsqueda. Intenta con términos generales.
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-12 bg-secondary/5 rounded-2xl border border-secondary/15 p-6 text-center space-y-3">
          <p className="font-sans text-[10px] uppercase font-black text-secondary tracking-widest leading-none">Última Actualización</p>
          <p className="font-serif text-xs text-slate-500">Esta Política de Privacidad fue modificada y entró en vigencia el 1 de enero de 2026. Nos reservamos el derecho de modificarla para adaptarla a nuevos decretos legislativos.</p>
        </div>

      </div>
    </div>
  );
}
