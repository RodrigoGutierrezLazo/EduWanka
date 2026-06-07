import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../lib/apiClient';
import { getCurrentUser, getCurrentUserRole, clearAllAuthStorages } from '../lib/auth';
import {
  LayoutDashboard, Users, BookOpen, CreditCard, History,
  ClipboardCheck, FolderOpen, FileText, Clock, Award,
  KeyRound, BarChart2, LogOut, ChevronRight, GraduationCap,
  Video, User, Star, Activity, ChevronDown, Compass, Menu, X, Target, Landmark
} from 'lucide-react';

/* ─── Types ───────────────────────────────────────────────────────── */
type SubItem  = { name: string; path: string; icon: ReactNode };
type MenuItem = {
  name: string;
  icon: ReactNode;
  path?: string;          // undefined → collapsible group
  children?: SubItem[];
};
type MenuGroup = { label: string; items: MenuItem[] };

/* ─── Menus per role ────────────────────────────────────────────── */
const STUDENT_MENU: MenuGroup[] = [
  {
    label: 'PRINCIPAL',
    items: [
      { name: 'Dashboard',        path: '/aula',               icon: <LayoutDashboard className="w-4 h-4" /> },
      { name: 'Mis Cursos',       path: '/aula/cursos',        icon: <BookOpen         className="w-4 h-4" /> },
      { name: 'Explorar Cursos',   path: '/aula/explorar-cursos', icon: <Compass       className="w-4 h-4" /> },
      { name: 'Clases en Vivo',   path: '/aula/clases-envivo', icon: <Video            className="w-4 h-4" /> },
    ],
  },
  {
    label: 'CONTENIDO',
    items: [
      { name: 'Materiales',   path: '/aula/materiales',   icon: <FolderOpen className="w-4 h-4" /> },
    ],
  },
  {
    label: 'PROGRESO',
    items: [
      { name: 'Asistencia',       path: '/aula/asistencia',   icon: <ClipboardCheck className="w-4 h-4" /> },
      { name: 'Notas',            path: '/aula/notas',        icon: <Star           className="w-4 h-4" /> },
      { name: 'Mis Certificados', path: '/aula/certificados', icon: <Award          className="w-4 h-4" /> },
    ],
  },
  {
    label: 'CUENTA',
    items: [
      { name: 'Mis Pagos', path: '/aula/pagos',  icon: <CreditCard className="w-4 h-4" /> },
      { name: 'Mi Perfil', path: '/aula/perfil', icon: <User       className="w-4 h-4" /> },
    ],
  },
];

const PROF_MENU: MenuGroup[] = [
  {
    label: 'PRINCIPAL',
    items: [
      { name: 'Dashboard',    path: '/aula/prof',               icon: <LayoutDashboard className="w-4 h-4" /> },
      { name: 'Mis Cursos',   path: '/aula/prof/cursos',        icon: <BookOpen        className="w-4 h-4" /> },
      { name: 'Mis Alumnos',  path: '/aula/prof/alumnos',       icon: <Users           className="w-4 h-4" /> },
      { name: 'Certificados', path: '/aula/prof/certificados',  icon: <Award           className="w-4 h-4" /> },
      { name: 'Mi Perfil',    path: '/aula/prof/perfil',        icon: <User            className="w-4 h-4" /> },
    ],
  },
];

const ADMIN_MENU: MenuGroup[] = [
  {
    label: 'PRINCIPAL',
    items: [
      { name: 'Dashboard', path: '/aula/admin',          icon: <LayoutDashboard className="w-4 h-4" /> },
      { name: 'Usuarios',  path: '/aula/admin/usuarios', icon: <Users           className="w-4 h-4" /> },
      { name: 'Cursos',    path: '/aula/admin/cursos',   icon: <BookOpen        className="w-4 h-4" /> },
      { name: 'Especialidades', path: '/aula/admin/especialidades', icon: <Target className="w-4 h-4" /> },
      { name: 'Docentes',  path: '/aula/admin/docentes', icon: <GraduationCap   className="w-4 h-4" /> },
      { name: 'Página de Inicio', path: '/aula/admin/inicio', icon: <Compass    className="w-4 h-4" /> },
    ],
  },
  {
    label: 'FINANZAS',
    items: [
      { name: 'Validar Pagos',   path: '/aula/admin/pagos',     icon: <CreditCard className="w-4 h-4" /> },
      { name: 'Cuentas de Pago', path: '/aula/admin/cuentas',   icon: <Landmark   className="w-4 h-4" /> },
      { name: 'Historial Pagos', path: '/aula/admin/historial', icon: <History    className="w-4 h-4" /> },
    ],
  },
  {
    label: 'ACADÉMICO',
    items: [
      { name: 'Asistencia',   path: '/aula/admin/asistencia',   icon: <ClipboardCheck className="w-4 h-4" /> },
      { name: 'Materiales',   path: '/aula/admin/materiales',   icon: <FolderOpen     className="w-4 h-4" /> },
      { name: 'Certificados', path: '/aula/admin/certificados', icon: <Award          className="w-4 h-4" /> },
    ],
  },
  {
    label: 'SISTEMA',
    items: [
      { name: 'Claves',   path: '/aula/admin/claves',   icon: <KeyRound  className="w-4 h-4" /> },
      { name: 'Reclamaciones', path: '/aula/admin/reclamaciones', icon: <FileText className="w-4 h-4" /> },
      { name: 'Reportes', path: '/aula/admin/reportes', icon: <BarChart2 className="w-4 h-4" /> },
    ],
  },
];

// All admin sub-items reused inside the collapsible Panel Admin dropdown
const ADMIN_CHILDREN: SubItem[] = [
  { name: 'Dashboard Admin',  path: '/aula/admin',                icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
  { name: 'Usuarios',         path: '/aula/admin/usuarios',       icon: <Users           className="w-3.5 h-3.5" /> },
  { name: 'Cursos',           path: '/aula/admin/cursos',         icon: <BookOpen        className="w-3.5 h-3.5" /> },
  { name: 'Especialidades',   path: '/aula/admin/especialidades', icon: <Target          className="w-3.5 h-3.5" /> },
  { name: 'Docentes',         path: '/aula/admin/docentes',       icon: <GraduationCap   className="w-3.5 h-3.5" /> },
  { name: 'Página de Inicio', path: '/aula/admin/inicio',         icon: <Compass         className="w-3.5 h-3.5" /> },
  { name: 'Validar Pagos',    path: '/aula/admin/pagos',          icon: <CreditCard      className="w-3.5 h-3.5" /> },
  { name: 'Cuentas de Pago',  path: '/aula/admin/cuentas',        icon: <Landmark        className="w-3.5 h-3.5" /> },
  { name: 'Historial Pagos',  path: '/aula/admin/historial',      icon: <History         className="w-3.5 h-3.5" /> },
  { name: 'Asistencia',       path: '/aula/admin/asistencia',     icon: <ClipboardCheck  className="w-3.5 h-3.5" /> },
  { name: 'Materiales',       path: '/aula/admin/materiales',     icon: <FolderOpen      className="w-3.5 h-3.5" /> },
  { name: 'Certificados',     path: '/aula/admin/certificados',   icon: <Award           className="w-3.5 h-3.5" /> },
  { name: 'Claves',           path: '/aula/admin/claves',         icon: <KeyRound        className="w-3.5 h-3.5" /> },
  { name: 'Reclamaciones',    path: '/aula/admin/reclamaciones',  icon: <FileText        className="w-3.5 h-3.5" /> },
  { name: 'Reportes',         path: '/aula/admin/reportes',       icon: <BarChart2       className="w-3.5 h-3.5" /> },
];

const SUPERADMIN_MENU: MenuGroup[] = [
  {
    label: 'PRINCIPAL',
    items: [
      { name: 'Dashboard Global', path: '/aula/superadmin',           icon: <LayoutDashboard className="w-4 h-4" /> },
      { name: 'Gestión de Aulas',  path: '/aula/superadmin/aulas',     icon: <Landmark className="w-4 h-4" /> },
      { name: 'Usuarios y Roles', path: '/aula/superadmin/usuarios',  icon: <Users            className="w-4 h-4" /> },
    ],
  },
  {
    label: 'ANÁLISIS',
    items: [
      { name: 'Rendimiento', path: '/aula/superadmin/rendimiento', icon: <Activity className="w-4 h-4" /> },
    ],
  },
  {
    label: 'ADMINISTRACIÓN',
    items: [
      {
        name: 'Panel Admin',
        icon: <GraduationCap className="w-4 h-4" />,
        // no path → collapsible
        children: ADMIN_CHILDREN,
      },
    ],
  },
];

const ROLE_MENUS: Record<string, MenuGroup[]> = {
  student:    STUDENT_MENU,
  prof:       PROF_MENU,
  admin:      ADMIN_MENU,
  superadmin: SUPERADMIN_MENU,
};

const ROLE_LABEL: Record<string, string> = {
  student:    'Estudiante',
  prof:       'Docente',
  admin:      'Administrador',
  superadmin: 'Super Admin',
};

/* ─── Component ─────────────────────────────────────────────────── */
export function AulaLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [hasAulaAccess, setHasAulaAccess]       = useState(false);
  const [sidebarOpen, setSidebarOpen]            = useState(false);
  const [tenantInfo, setTenantInfo]             = useState<any>(null);

  useEffect(() => {
    apiClient.get('/api/v1/tenant/current')
      .then(({ data }) => {
        setTenantInfo(data.data ?? data);
      })
      .catch(() => {});
  }, []);

  // Track which collapsible menu items are open (keyed by item name)
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    // Auto-expand Panel Admin if current route is under /aula/admin
    return location.pathname.startsWith('/aula/admin')
      ? new Set(['Panel Admin'])
      : new Set();
  });

  const role       = getCurrentUserRole() ?? 'student';
  const user       = getCurrentUser();
  const menuGroups = ROLE_MENUS[role] ?? STUDENT_MENU;
  const canUseStudentCatalog =
    role === 'student' &&
    (location.pathname === '/aula/explorar-cursos' ||
      location.pathname.startsWith('/aula/comprar/') ||
      location.pathname === '/aula/pagos');

  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      try {
        await apiClient.get('/api/v1/aula/access');
        if (isMounted) setHasAulaAccess(true);
      } catch (err: any) {
        if (!isMounted) return;
        if (err?.response?.status === 401) {
          clearAllAuthStorages();
          navigate('/login', { replace: true });
          return;
        }
        setHasAulaAccess(false);
      } finally {
        if (isMounted) setIsCheckingAccess(false);
      }
    };
    check();
    return () => { isMounted = false; };
  }, [navigate]);

  // Auto-expand Panel Admin when navigating into /aula/admin
  useEffect(() => {
    if (location.pathname.startsWith('/aula/admin')) {
      setOpenGroups(prev => new Set([...prev, 'Panel Admin']));
    }
  }, [location.pathname]);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const toggleGroup = (name: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const handleLogout = async () => {
    try { await apiClient.post('/api/v1/auth/logout'); } catch { /* ignore */ }
    clearAllAuthStorages();
    navigate('/login');
  };

  /* ── Sidebar content (shared between mobile overlay and desktop fixed) ── */
  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="px-4 py-4 border-b border-white/15 flex items-center gap-3">
        {tenantInfo?.logo_path ? (
          <img 
            src={tenantInfo.logo_path.startsWith('http') ? tenantInfo.logo_path : `/storage/${tenantInfo.logo_path}`} 
            alt={tenantInfo.name} 
            className="h-8 w-auto object-contain brightness-0 invert" 
          />
        ) : (
          <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center shrink-0">
            <GraduationCap className="w-4 h-4 text-accent" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-tight truncate">
            {tenantInfo?.name ?? 'EduWanka'}
          </p>
          <p className="text-[10px] text-white/40 leading-tight">Aula Virtual</p>
        </div>
        {/* Close button — mobile only */}
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-white/40 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role badge */}
      <div className="px-4 py-2.5 border-b border-white/15">
        <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-accent">
          <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
          {ROLE_LABEL[role]}
        </span>
        {user?.name && (
          <p className="text-xs text-white/50 mt-0.5 truncate">{user.name}</p>
        )}
      </div>

      {/* Nav */}
      <nav className="aula-sidebar-scrollbar-red flex-1 px-2 py-3 overflow-y-auto space-y-4">
        {menuGroups.map((group) => (
          <div key={group.label}>
            <p className="px-2 mb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-white/25">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                // ── Collapsible item (has children, no path) ──────
                if (item.children) {
                  const isOpen = openGroups.has(item.name);
                  const hasActiveChild = item.children.some(c =>
                    location.pathname === c.path ||
                    (c.path !== '/aula/admin' && location.pathname.startsWith(c.path))
                  );
                  return (
                    <li key={item.name}>
                      <button
                        onClick={() => toggleGroup(item.name)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all text-left
                          ${hasActiveChild
                            ? 'bg-white/10 text-white'
                            : 'text-white/60 hover:text-white hover:bg-white/8'
                          }`}
                      >
                        <span className="shrink-0">{item.icon}</span>
                        <span className="flex-1">{item.name}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {/* Sub-items */}
                      {isOpen && (
                        <ul className="mt-0.5 ml-3 pl-3 border-l border-white/10 space-y-0.5">
                          {item.children.map((child) => (
                            <li key={child.path}>
                              <NavLink
                                to={child.path}
                                end={child.path === '/aula/admin'}
                                className={({ isActive }) =>
                                  `flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-all
                                  ${isActive
                                    ? 'bg-white/20 text-white border border-white/10'
                                    : 'text-white/50 hover:text-white hover:bg-white/10'
                                  }`
                                }
                              >
                                <span className="shrink-0">{child.icon}</span>
                                <span>{child.name}</span>
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                }

                // ── Regular nav link ──────────────────────────────
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path!}
                      end={
                        item.path === '/aula' ||
                        item.path === '/aula/prof' ||
                        item.path === '/aula/admin' ||
                        item.path === '/aula/superadmin'
                      }
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all
                        ${isActive
                          ? 'bg-white/20 text-white shadow-sm border border-white/15'
                          : 'text-white/60 hover:text-white hover:bg-white/10'
                        }`
                      }
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span>{item.name}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-white/15 space-y-0.5">
        <a
          href="/"
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-white/40 hover:text-white hover:bg-white/8 transition-all"
        >
          <ChevronRight className="w-4 h-4 rotate-180 shrink-0" />
          Volver a la Web
        </a>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/15 hover:text-red-300 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Salir
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ── Mobile overlay ───────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside 
        style={{
          background: 'linear-gradient(to bottom, var(--color-primary), var(--color-primary-dark), #1a0306)'
        }}
        className={`
          fixed inset-y-0 left-0 z-50 w-64 text-white flex flex-col shadow-2xl
          transform transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0 lg:w-60 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {sidebarContent}
      </aside>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top bar */}
        <header className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900">
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-slate-700 text-sm hidden sm:block">Portal Académico — {ROLE_LABEL[role]}</h2>
            <h2 className="font-bold text-slate-700 text-sm sm:hidden">{ROLE_LABEL[role]}</h2>
          </div>
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold uppercase">
            {user?.name?.[0] ?? role[0]}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {isCheckingAccess ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary" />
              </div>
            ) : hasAulaAccess || canUseStudentCatalog ? (
              <Outlet />
            ) : (
              <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-12 text-center border border-slate-100 max-w-xl mx-auto mt-8 sm:mt-12">
                <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-5" />
                <h2 className="text-xl font-bold text-primary mb-2">Acceso en Verificación</h2>
                <p className="text-slate-500 mb-6 text-sm leading-relaxed">
                  Tu inscripción o pago está siendo validado. Una vez confirmado, tendrás acceso total.
                </p>
                <Link
                  to="/aula/explorar-cursos"
                  className="inline-flex items-center px-6 py-2.5 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-colors text-sm"
                >
                  Explorar cursos
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
