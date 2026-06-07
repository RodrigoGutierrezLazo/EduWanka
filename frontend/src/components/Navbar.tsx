import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { isAuthenticated, getCurrentUserRole } from "../lib/auth";
import { hasActiveTenant } from "../lib/tenant";
import { apiClient } from "../lib/apiClient";

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  const isTenant = hasActiveTenant();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
  }, [isTenant, location.pathname]); // volver a comprobar al cambiar de ruta por si acaso

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMenuOpen]);

  const ROLE_ROUTES: Record<string, string> = {
    student: "/aula",
    prof: "/aula/prof",
    admin: "/aula/admin",
    superadmin: "/aula/superadmin",
  };
  const loggedIn = isAuthenticated();
  const role = getCurrentUserRole();
  const aulaLink = loggedIn && role ? (ROLE_ROUTES[role] ?? "/aula") : "/login";
  const aulaLabel = loggedIn ? "IR AL AULA" : "INGRESO AL AULA";

  const menuItems = isTenant
    ? [
        { name: "Inicio", path: "/" },
        { name: "Cursos", path: "/cursos" },
        { name: "Certificados", path: "/certificados" },
        { name: "Noticias", path: "/noticias" },
        { name: "Contacto", path: "/contacto" }
      ]
    : [
        { name: "Inicio", path: "/" },
        { name: "Cursos", path: "/cursos" },
        { name: "Certificados", path: "/certificados" },
        { name: "FAQ", path: "/faq" },
        { name: "Contacto", path: "/contacto" }
      ];

  const menuVariants = {
    closed: {
      opacity: 0,
      y: "-100%",
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.05,
        staggerDirection: -1,
        when: "afterChildren" as const
      }
    },
    opened: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    closed: { opacity: 0, y: 20, filter: "blur(10px)" },
    opened: { 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)",
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number]
      }
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md shadow-sm py-5 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 z-50 group shrink-0" aria-label="EduWanka">
          {tenantInfo?.logo_path ? (
            <img 
              src={tenantInfo.logo_path.startsWith('http') ? tenantInfo.logo_path : `/storage/${tenantInfo.logo_path}`} 
              alt={tenantInfo.name} 
              className="h-12 w-auto object-contain transition-transform group-hover:scale-105" 
            />
          ) : (
            <img 
              src={`${import.meta.env.BASE_URL}logo_eduwanka.png`} 
              alt="EduWanka Logo" 
              className="h-12 w-auto object-contain transition-transform group-hover:scale-105" 
            />
          )}
          {isTenant && tenantInfo && (
            <span className="font-sans font-black text-xs sm:text-sm text-primary tracking-wider uppercase border-l border-slate-200 pl-3">
              {tenantInfo.name}
            </span>
          )}
        </Link>

        {/* Desktop Links */}
        <div className="hidden xl:flex items-center space-x-5 lg:space-x-6">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={(e) => {
                if (item.path.startsWith("/#")) {
                  e.preventDefault();
                  alert(`La sección de "${item.name}" estará disponible próximamente.\n¡Estamos trabajando para brindarte el mejor contenido!`);
                }
              }}
              className={`text-[13px] font-bold tracking-wide transition-all border-b-2 ${
                location.pathname === item.path 
                  ? "text-secondary border-secondary" 
                  : "text-primary border-transparent hover:text-secondary"
              } pb-1`}
            >
              {item.name}
            </Link>
          ))}
          <Link
            to={aulaLink}
            className="btn-pill bg-primary text-white text-[10px] px-6 py-3 shrink-0"
          >
            {aulaLabel}
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="xl:hidden z-50 p-2 text-primary"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle Navigation"
        >
          {isMenuOpen ? (
            <X className="w-8 h-8" />
          ) : (
            <Menu className="w-8 h-8" />
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial="closed"
            animate="opened"
            exit="closed"
            variants={menuVariants}
            className="fixed inset-0 min-h-screen bg-white z-40 xl:hidden flex flex-col pt-32 px-10"
          >
            <div className="flex flex-col space-y-8">
              {menuItems.map((item) => (
                <motion.div variants={itemVariants} key={item.name}>
                  <Link 
                    to={item.path} 
                    onClick={(e) => {
                      if (item.path.startsWith("/#")) {
                        e.preventDefault();
                        alert(`La sección de "${item.name}" estará disponible próximamente.\n¡Estamos trabajando para brindarte el mejor contenido!`);
                      } else {
                        setIsMenuOpen(false);
                      }
                    }}
                    className="text-primary font-sans font-bold text-4xl hover:text-secondary transition-colors"
                  >
                    {item.name}
                  </Link>
                </motion.div>
              ))}
            </div>
            
            <motion.div 
              variants={itemVariants}
              className="mt-16 space-y-8"
            >
              <div className="h-[1px] bg-slate-100 w-full" />
              <Link
                to={aulaLink}
                onClick={() => setIsMenuOpen(false)}
                className="block w-full bg-primary text-white font-sans font-bold py-6 rounded-sm uppercase tracking-widest text-sm shadow-xl text-center"
              >
                {loggedIn ? "Ir al aula" : "Ingreso al aula"}
              </Link>
              
              <div className="flex space-x-6 text-primary/60">
                <Facebook className="w-6 h-6" />
                <Twitter className="w-6 h-6" />
                <Instagram className="w-6 h-6" />
                <Linkedin className="w-6 h-6" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
