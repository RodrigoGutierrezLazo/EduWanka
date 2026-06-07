import { motion } from "motion/react";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from "lucide-react";

export default function Contact() {
  return (
    <div className="pt-24">
      {/* Header */}
      <section className="bg-primary py-20 px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 h-full">
          <MessageSquare className="w-96 h-full text-white" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-sans text-4xl md:text-6xl text-white font-extrabold mb-6">
              Hablemos de tu <span className="text-accent italic">Futuro</span>
            </h1>
            <p className="font-serif text-xl text-slate-300 max-w-2xl leading-relaxed">
              Estamos aquí para resolver tus dudas y acompañarte en tu proceso de formación profesional.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-6 lg:px-8 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Info Column */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-12"
            >
              <div>
                <h2 className="font-sans text-3xl font-bold text-primary mb-6">Información de Contacto</h2>
                <p className="font-serif text-lg text-slate-600 leading-relaxed mb-8">
                  Visítanos en nuestras instalaciones o contáctanos por cualquiera de nuestros canales oficiales.
                </p>
              </div>

              <div className="space-y-8">
                {[
                  { icon: <MapPin className="w-6 h-6" />, title: "Sede Principal", content: ["Ca. Real 860, Huancayo, Peru"] },
                  { icon: <Mail className="w-6 h-6" />, title: "Correo Electrónico", content: ["contacto@eduwanka.edu.pe"] },
                  { icon: <Phone className="w-6 h-6" />, title: "Teléfonos", content: ["+51 971 707 389"] },
                  { icon: <Clock className="w-6 h-6" />, title: "Horario de Atención", content: ["Lun - Vie: 8:00 AM - 8:00 PM", "Sábados: 9:00 AM - 1:00 PM"] }
                ].map((item, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + idx * 0.1, duration: 0.5 }}
                    className="flex items-start space-x-6 group"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl shadow-soft flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-primary transition-all duration-300">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-sans font-bold text-primary text-lg mb-1">{item.title}</h4>
                      {item.content.map((line, lIdx) => (
                        <p key={lIdx} className="font-serif text-slate-500">{line}</p>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Form Column */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-10 rounded-2xl shadow-soft border border-slate-100"
            >
              <h3 className="font-sans text-2xl font-bold text-primary mb-8 text-center uppercase tracking-widest">Formulario de Consulta</h3>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nombre Completo</label>
                    <input type="text" className="w-full bg-slate-50 p-4 rounded-lg outline-none focus:ring-2 focus:ring-secondary transition-all font-sans" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Correo</label>
                    <input type="email" className="w-full bg-slate-50 p-4 rounded-lg outline-none focus:ring-2 focus:ring-secondary transition-all font-sans" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Asunto</label>
                  <select className="w-full bg-slate-50 p-4 rounded-lg outline-none focus:ring-2 focus:ring-secondary transition-all font-sans appearance-none">
                    <option>Información de Cursos</option>
                    <option>Proceso de Admisión</option>
                    <option>Becas y Financiamiento</option>
                    <option>Soporte Técnico</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mensaje</label>
                  <textarea rows={6} className="w-full bg-slate-50 p-4 rounded-lg outline-none focus:ring-2 focus:ring-secondary transition-all font-sans resize-none" required></textarea>
                </div>
                <button type="submit" className="w-full bg-primary text-white font-sans font-bold py-5 rounded-lg shadow-xl hover:shadow-2xl hover:bg-primary-container transition-all uppercase tracking-widest flex items-center justify-center space-x-3">
                  <Send className="w-5 h-5" />
                  <span>Enviar Mensaje</span>
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Redes Sociales Section (mockup styled) */}
      <section className="py-20 px-6 lg:px-8 bg-white border-t border-slate-100 relative overflow-hidden">
        <div className="max-w-xl mx-auto text-center space-y-8">
          <div className="space-y-3">
            <h2 className="font-sans text-2xl md:text-3xl font-extrabold text-[#072146] leading-tight">
              ¡Encuéntranos en nuestras redes sociales!
            </h2>
            <p className="font-sans text-xs sm:text-sm text-slate-500 font-bold tracking-wide">
              Dale click a los botones para ser redireccionado automáticamente
            </p>
          </div>

          <div className="flex flex-col gap-4 max-w-sm sm:max-w-md mx-auto">
            {[
              {
                name: "eduwanka.contactoción Profesional",
                url: "https://www.facebook.com/EduWanka",
                icon: (
                  <svg viewBox="0 0 24 24" className="w-8 h-8 fill-[#1877F2] shrink-0">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                )
              },
              {
                name: "EduWanka Cap. Profesional",
                url: "https://www.instagram.com/eduwankacapacita/",
                icon: (
                  <svg viewBox="0 0 24 24" className="w-8 h-8 shrink-0">
                    <defs>
                      <linearGradient id="insta-grad-high" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f58529" />
                        <stop offset="25%" stopColor="#dd2a7b" />
                        <stop offset="50%" stopColor="#8134af" />
                        <stop offset="100%" stopColor="#515bd4" />
                      </linearGradient>
                    </defs>
                    <rect width="24" height="24" rx="6" fill="url(#insta-grad-high)" />
                    <path fill="white" d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8.2c-1.77 0-3.2-1.43-3.2-3.2s1.43-3.2 3.2-3.2 3.2 1.43 3.2 3.2-1.43 3.2-3.2 3.2z" />
                    <path fill="white" d="M17.2 5H6.8C5.8 5 5 5.8 5 6.8v10.4C5 18.2 5.8 19 6.8 19h10.4c1 0 1.8-.8 1.8-1.8V6.8C19 5.8 18.2 5 17.2 5zm0.6 12.2c0 .3-.3.6-.6.6H6.8c-.3 0-.6-.3-.6-.6V6.8c0-.3.3-.6.6-.6h10.4c.3 0 .6.3.6.6v10.4z" />
                    <circle cx="16.5" cy="7.5" r="1.1" fill="white" />
                  </svg>
                )
              },
              {
                name: "eduwanka.contactoción",
                url: "https://www.tiktok.com/@eduwanka.contactocion",
                icon: (
                  <svg viewBox="0 0 24 24" className="w-8 h-8 shrink-0">
                    <circle cx="12" cy="12" r="12" fill="black" />
                    {/* Red shadow */}
                    <path fill="#FE2C55" d="M19.79 6.89a4.83 4.83 0 0 1-3.77-4.25V2.2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74l-.07-3.46a6.35 6.35 0 1 0 8.72 5.75V7.6a8.31 8.31 0 0 0 3.77.89V6.89z" />
                    {/* Cyan shadow */}
                    <path fill="#25F4EE" d="M19.39 6.49a4.83 4.83 0 0 1-3.77-4.25V1.8h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74l-.07-3.46a6.35 6.35 0 1 0 8.72 5.75V7.2a8.31 8.31 0 0 0 3.77.89V6.49z" />
                    {/* White main path */}
                    <path fill="white" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74l-.07-3.46a6.35 6.35 0 1 0 8.72 5.75V7.4a8.31 8.31 0 0 0 3.77.89V6.69z" />
                  </svg>
                )
              }
            ].map((social, idx) => (
              <motion.a
                key={idx}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-4 bg-white border border-[#072146] rounded-[1.5rem] px-6 py-4 hover:shadow-soft hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-left cursor-pointer shrink-0 select-none group"
              >
                <div className="shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {social.icon}
                </div>
                <span className="font-sans font-semibold text-sm sm:text-base text-[#072146] tracking-wide flex-grow">
                  {social.name}
                </span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
