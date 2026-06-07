import { motion } from "motion/react";
import { Search, Calendar, Clock, ChevronRight, MessageSquare, Newspaper } from "lucide-react";
import { useState } from "react";

export default function Noticias() {
  const [activeCategory, setActiveCategory] = useState<string>("Todos");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["Todos", "Académicas", "Institucionales", "Noticias Legales"];

  const newsItems = [
    {
      id: 1,
      title: "EduWanka expande convenios académicos con la Universidad Nacional de Trujillo (UNT)",
      category: "Institucionales",
      description: "Consolidando su liderazgo educativo en la región centro, EduWanka suscribe un nuevo convenio de cooperación académica que respalda y certifica nuestros diplomados de posgrado.",
      date: "26 May 2026",
      readTime: "4 min lectura",
      imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: 2,
      title: "Inicio exitoso del Diplomado de Derecho Procesal Penal y Litigación Oral",
      category: "Académicas",
      description: "Con la participación activa de magistrados de la Corte Superior y destacados juristas del país, se dio inicio a las sesiones teóricas y talleres de simulación de audiencias.",
      date: "14 May 2026",
      readTime: "3 min lectura",
      imageUrl: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: 3,
      title: "Mejoras en el Aula Virtual: Nueva sección de Acreditaciones y Convenios",
      category: "Académicas",
      description: "En línea con nuestro compromiso de transparencia y excelencia digital, implementamos nuevas herramientas interactivas y descargas de sílabas oficiales en la plataforma estudiantil.",
      date: "02 May 2026",
      readTime: "2 min lectura",
      imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600",
    }
  ];

  const handleShowAlert = (title: string) => {
    alert(`La nota completa "${title}" está siendo redactada por nuestro equipo editorial.\nEstará publicada oficialmente en nuestro boletín muy pronto.`);
  };

  return (
    <div className="pt-24 pb-32">
      {/* Header */}
      <section className="bg-primary py-20 px-6 lg:px-8 overflow-hidden relative">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1200"
            alt="Newspaper"
            className="w-full h-full object-cover opacity-20 filter grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent"></div>
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center space-x-2 text-accent mb-3">
              <Newspaper className="w-5 h-5" />
              <span className="font-sans text-xs sm:text-sm font-black uppercase tracking-[0.2em]">Actualidad Académica</span>
            </div>
            <h1 className="font-sans text-4xl md:text-6xl text-white font-extrabold mb-6">
              Noticias <span className="text-accent italic">& Eventos</span>
            </h1>
            <p className="font-serif text-xl text-slate-300 max-w-2xl leading-relaxed">
              Mantente al día con los últimos acontecimientos, logros institucionales, convenios y novedades del entorno profesional de EduWanka.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="bg-white border-b border-slate-100 sticky top-16 z-30 shadow-sm py-6 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                  activeCategory === cat ? "bg-secondary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-secondary transition-colors" />
            <input
              type="text"
              placeholder="Buscar noticia..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-50 border-none rounded-full pl-12 pr-6 py-3 text-sm font-medium focus:ring-2 focus:ring-secondary focus:bg-white transition-all w-full md:w-80 outline-none shadow-inner"
            />
          </div>
        </div>
      </section>

      {/* News Grid */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {newsItems.map(item => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              key={item.id}
              className="bg-white rounded-xl overflow-hidden shadow-soft hover:shadow-hover border border-slate-100 flex flex-col group transition-all duration-500"
            >
              {/* Image Container */}
              <div className="h-52 relative overflow-hidden bg-slate-100">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 bg-primary/90 backdrop-blur-sm text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-lg">
                  {item.category}
                </div>
              </div>

              {/* Text Container */}
              <div className="p-8 pt-6 flex flex-col flex-grow justify-between">
                <div>
                  <div className="flex items-center space-x-4 text-xs text-slate-400 font-bold mb-4">
                    <div className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-secondary" />
                      {item.date}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-secondary" />
                      {item.readTime}
                    </div>
                  </div>

                  <h3 
                    onClick={() => handleShowAlert(item.title)}
                    className="font-display text-xl font-bold text-primary mb-3 leading-tight hover:text-secondary cursor-pointer transition-colors line-clamp-2"
                  >
                    {item.title}
                  </h3>

                  <p className="font-serif text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3">
                    {item.description}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-50 flex items-center justify-between mt-auto">
                  <button
                    onClick={() => handleShowAlert(item.title)}
                    className="text-xs font-bold uppercase tracking-widest text-primary hover:text-secondary transition-colors flex items-center group/btn"
                  >
                    <span>Leer Nota Completa</span>
                    <ChevronRight className="w-3 h-3 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
