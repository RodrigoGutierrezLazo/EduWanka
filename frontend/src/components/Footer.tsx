import { Facebook, Instagram, ChevronRight, Mail, Phone, MapPin } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { hasActiveTenant } from "../lib/tenant";
import { apiClient } from "../lib/apiClient";

export const Footer = () => {
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const location = useLocation();
  const isTenant = hasActiveTenant();

  useEffect(() => {
    if (isTenant) {
      apiClient.get('/api/v1/tenant/current')
        .then(({ data }) => {
          setTenantInfo(data.data ?? data);
        })
        .catch(() => {});
    } else {
      setTenantInfo(null);
    }
  }, [isTenant, location.pathname]);

  return (
    <footer className="bg-primary text-white pt-12 pb-8 px-6 lg:px-8 border-t-4 border-secondary">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-10">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3 group shrink-0" aria-label="EduWanka">
              {tenantInfo?.logo_path ? (
                <img 
                  src={tenantInfo.logo_path.startsWith('http') ? tenantInfo.logo_path : `/storage/${tenantInfo.logo_path}`} 
                  alt={tenantInfo.name} 
                  className="h-12 w-auto object-contain brightness-0 invert" 
                />
              ) : (
                <img 
                  src={`${import.meta.env.BASE_URL}logo_eduwanka.png`} 
                  alt="EduWanka Logo" 
                  className="h-12 w-auto object-contain brightness-0 invert" 
                />
              )}
              {isTenant && tenantInfo && (
                <span className="font-sans font-black text-xs sm:text-sm text-white tracking-wider uppercase border-l border-white/20 pl-3">
                  {tenantInfo.name}
                </span>
              )}
            </Link>
            <p className="font-sans text-xs text-slate-300 leading-relaxed max-w-xs">
              Plataforma educativa digital enfocada en cursos, formación virtual y certificación institucional con raíces culturales andinas.
            </p>
            <div className="flex space-x-3">
              {[
                { icon: <Facebook className="w-4 h-4" />, path: "https://www.facebook.com/eduwanka" },
                { icon: <Instagram className="w-4 h-4" />, path: "https://www.instagram.com/eduwanka" },
                { 
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.94-1.74a7.99 7.99 0 0 1-1.25-1.5v6.52c-.07 2.32-.97 4.67-2.71 6.22-1.74 1.56-4.21 2.45-6.52 2.49-2.31.04-4.73-.78-6.38-2.39C.38 18.06-.39 15.42-.4 12.87c0-2.55.77-5.18 2.41-7.1 1.64-1.92 4.16-2.88 6.64-2.81 1.34.04 2.66.45 3.77 1.2.11-1.38.11-2.76.11-4.14z"/>
                    </svg>
                  ), 
                  path: "https://www.tiktok.com/@eduwanka" 
                }
              ].map((social, idx) => (
                <a key={idx} href={social.path} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-secondary hover:border-secondary transition-all">
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-sans font-bold text-base mb-4 uppercase tracking-widest text-accent">Navegación</h4>
            <ul className="space-y-2 font-sans font-semibold text-xs">
              {[
                { name: "Inicio", path: "/" },
                { name: "Cursos", path: "/cursos" },
                { name: "Certificados", path: "/certificados" },
                { name: "Contacto", path: "/contacto" }
              ].map((item) => (
                <li key={item.name}>
                  <Link to={item.path} className="text-slate-300 hover:text-accent flex items-center group">
                    <ChevronRight className="w-3 h-3 mr-1.5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-sans font-bold text-base mb-4 uppercase tracking-widest text-accent">Legal</h4>
            <ul className="space-y-2 font-sans font-semibold text-xs">
              {[
                { name: "Política de Privacidad", path: "/politica-privacidad" },
                { name: "Términos de Servicio", path: "/terminos-servicio" },
                { name: "Acreditaciones", path: "/acreditaciones" },
                { name: "Portal de Transparencia", path: "/transparencia" }
              ].map((item) => (
                <li key={item.name}>
                  <Link to={item.path} className="text-slate-300 hover:text-accent block transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-sans font-bold text-base mb-4 uppercase tracking-widest text-accent">Contacto</h4>
            <ul className="space-y-3 font-sans text-xs font-medium">
              <li className="flex items-start space-x-3">
                <Mail className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">contacto@eduwanka.edu.pe</span>
              </li>
              <li className="flex items-start space-x-3">
                <Phone className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">+51 971 707 389</span>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">Ca. Real 860, Huancayo, Peru</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 text-center">
          <p className="font-sans text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest">
            © 2026 EduWanka. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
