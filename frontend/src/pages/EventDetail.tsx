import { motion } from "motion/react";
import { Calendar, MapPin, Clock, ArrowLeft, Share2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";

export default function EventDetail() {
  const { id } = useParams();

  // This is a placeholder. In a real app, you'd fetch event data by ID.
  const event = {
    title: "Webinar: El Futuro del Derecho Digital",
    date: "15 de Mayo, 2024",
    time: "18:00 - 20:00",
    location: "Plataforma Zoom (Online)",
    description: "Únete a nosotros en una exploración profunda sobre cómo la inteligencia artificial y las tecnologías descentralizadas están transformando el panorama legal contemporáneo. Contaremos con expertos internacionales que compartirán su visión sobre los desafíos regulatorios y las nuevas oportunidades para los profesionales del derecho.",
    speaker: "Dr. Roberto García",
    speakerRole: "Experto en Ciberderecho",
    image: "https://images.unsplash.com/photo-1591115765373-520b7a21769b?auto=format&fit=crop&q=80&w=1200"
  };

  return (
    <div className="pt-24 pb-32 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center text-secondary font-sans text-sm font-bold uppercase tracking-widest mb-12 hover:text-primary transition-colors group">
          <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver al Inicio
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl overflow-hidden shadow-soft border border-slate-100"
        >
          <div className="h-64 md:h-96 relative">
            <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-8 left-8 right-8 text-white">
              <span className="bg-secondary text-white font-sans text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">
                Webinar Gratuito
              </span>
              <h1 className="font-sans text-3xl md:text-5xl font-extrabold leading-tight">
                {event.title}
              </h1>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha</p>
                  <p className="font-sans font-bold text-primary">{event.date}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hora</p>
                  <p className="font-sans font-bold text-primary">{event.time}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ubicación</p>
                  <p className="font-sans font-bold text-primary">{event.location}</p>
                </div>
              </div>
            </div>

            <div className="prose prose-slate max-w-none mb-12">
              <h3 className="font-sans text-2xl font-bold text-primary mb-6">Detalles del Evento</h3>
              <p className="font-serif text-lg text-slate-600 leading-relaxed">
                {event.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between p-8 bg-slate-50 rounded-2xl border border-slate-100 gap-6">
              <div className="flex items-center space-x-4 w-full sm:w-auto">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-secondary/30">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150" alt={event.speaker} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-sans font-bold text-primary">{event.speaker}</p>
                  <p className="text-xs text-slate-500 font-medium">{event.speakerRole}</p>
                </div>
              </div>
              <div className="flex space-x-4 w-full sm:w-auto">
                <button className="flex-grow sm:flex-grow-0 bg-primary text-white font-sans font-bold px-8 py-4 rounded-lg uppercase tracking-widest text-xs hover:shadow-lg transition-all">
                  Reservar Cupo
                </button>
                <button className="p-4 bg-white text-slate-400 border border-slate-200 rounded-lg hover:text-secondary transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
