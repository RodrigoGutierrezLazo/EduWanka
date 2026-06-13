import { motion } from "motion/react";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, CheckCircle } from "lucide-react";
import Tilt3D from "../components/Tilt3D";

export default function Contact() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <section className="relative bg-gradient-to-br from-[#1a0507] via-[#7A0F1F] to-[#2a0509] pt-40 pb-32 px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Column: Text */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.7 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="px-4 py-1.5 bg-accent/15 border border-accent/30 rounded-full text-accent text-[11px] font-black uppercase tracking-widest">
                  Contacto Directo
                </span>
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-white font-extrabold mb-6 tracking-tight leading-tight">
                Hablemos de tu <span className="text-accent italic">Futuro</span>
              </h1>
              <p className="font-sans text-lg lg:text-xl text-white/60 max-w-2xl leading-relaxed">
                Estamos aquí para resolver tus dudas y acompañarte en tu proceso de formación profesional.
              </p>
            </motion.div>

            {/* Right Column: 3D Contact Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="hidden lg:block relative"
            >
              <Tilt3D maxTilt={6}>
                <div className="relative" style={{ transformStyle: "preserve-3d" }}>
                  {/* Contact Desk Main Card */}
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
                        <span className="text-[9px] text-white/30 font-medium">eduwanka.pe/contacto</span>
                      </div>
                    </div>

                    {/* Support Channels layout */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h4 className="text-white font-extrabold text-sm">¿Cómo prefieres comunicarte?</h4>
                        <p className="text-[9px] text-white/40">Canales oficiales de atención rápida</p>
                      </div>

                      {/* Mockup inbox items */}
                      <div className="space-y-2">
                        {[
                          { label: "WhatsApp Directo", desc: "+51 971 707 389", active: true, icon: <Phone className="w-4 h-4" /> },
                          { label: "Correo Soporte", desc: "contacto@eduwanka.edu.pe", active: false, icon: <Mail className="w-4 h-4" /> },
                        ].map((item, idx) => (
                          <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold ${
                            item.active
                              ? "bg-accent/15 border-accent/40 text-white"
                              : "bg-white/[0.02] border-white/5 text-white/60"
                          }`}>
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${item.active ? "bg-accent text-[#1a0507]" : "bg-white/10 text-white/40"}`}>
                              {item.icon}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="font-bold">{item.label}</p>
                              <p className="text-[9px] opacity-75 truncate">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  {/* Floating card 1: Ticket sent badge */}
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
                      <div className="w-8 h-8 bg-accent/15 rounded-xl flex items-center justify-center shrink-0 text-accent">
                        <CheckCircle className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-800 leading-tight">Consulta Enviada</p>
                        <p className="text-[8px] text-accent font-bold mt-0.5">Te responderemos pronto</p>
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Floating card 2: Chat Support Active badge */}
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
                      <div className="w-7 h-7 bg-accent/20 rounded-full flex items-center justify-center shrink-0 text-accent">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-800 leading-tight">Atención 24/7</p>
                        <p className="text-[8px] text-slate-400 font-semibold mt-0.5">Soporte Activo</p>
                      </div>
                    </motion.div>
                  </motion.div>

                </div>
              </Tilt3D>
            </motion.div>

          </div>
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


    </div>
  );
}
