/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import React, { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Loader } from 'lucide-react';
import { Toaster } from 'sonner';

// Public Pages
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import Home from "./pages/Home";
import HomeLegacy from "./pages/HomeLegacy";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import Certificates from "./pages/Certificates";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CrearAula from "./pages/CrearAula";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import EventDetail from "./pages/EventDetail";
import EspecialidadDetail from "./pages/especialidades/EspecialidadDetail";
import NotFoundPage from "./pages/NotFoundPage";
import { ForbiddenPage } from "./pages/ForbiddenPage";
import LocalhostTenantSelector from "./components/LocalhostTenantSelector";
import Faq from "./pages/Faq";
import { hasActiveTenant } from "./lib/tenant";
import { apiClient } from "./lib/apiClient";
import { getCurrentUserRole } from "./lib/auth";
import { logger } from "./lib/logger";

// Custom Assets
import wsBtn from "../assets/ws-btn.png";

// Checkout — lazy para evitar que pdfjs-dist se cargue en el bundle inicial
const Checkout = lazy(() => import("./pages/Checkout"));

// Protected Area (Aula Virtual)
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AulaLayout } from "./layouts/AulaLayout";
import { StudentDashboard } from "./pages/aula/StudentDashboard";
import { ProfessorDashboard } from "./pages/aula/ProfessorDashboard";
import { AdminDashboard } from "./pages/aula/AdminDashboard";
import { SuperadminDashboard } from "./pages/aula/SuperadminDashboard";

// Admin sub-pages: lazy-loaded para reducir el bundle principal.
// AdminCertificados arrastra pdfjs-dist (~2MB) — sólo se carga al entrar a esa ruta.
const AdminUsuarios    = lazy(() => import("./pages/aula/admin/AdminUsuarios"));
const AdminCursos      = lazy(() => import("./pages/aula/admin/AdminCursos"));
const AdminCourseEditor = lazy(() => import("./pages/aula/admin/AdminCourseEditor"));
const AdminSpecialties = lazy(() => import("./pages/aula/admin/AdminSpecialties"));
const AdminSpecialtyBrochureBuilder = lazy(() => import("./pages/aula/admin/AdminSpecialtyBrochureBuilder"));
const AdminDocentes    = lazy(() => import("./pages/aula/admin/AdminDocentes"));
const AdminInicio      = lazy(() => import("./pages/aula/admin/AdminInicio"));
const AdminCuentas     = lazy(() => import("./pages/aula/admin/AdminCuentas"));
const AdminPagos       = lazy(() => import("./pages/aula/admin/AdminPagos"));
const AdminHistorial   = lazy(() => import("./pages/aula/admin/AdminHistorial"));
const AdminAsistencia  = lazy(() => import("./pages/aula/admin/AdminAsistencia"));
const AdminMateriales  = lazy(() => import("./pages/aula/admin/AdminMateriales"));
const AdminCertificados = lazy(() => import("./pages/aula/admin/AdminCertificados"));
const AdminClaves      = lazy(() => import("./pages/aula/admin/AdminClaves"));
const AdminReportes    = lazy(() => import("./pages/aula/admin/AdminReportes"));
const AdminParticipantes = lazy(() => import("./pages/aula/admin/AdminParticipantes"));
const SuperadminUsers       = lazy(() => import("./pages/aula/superadmin/SuperadminUsers"));
const SuperadminRendimiento = lazy(() => import("./pages/aula/superadmin/SuperadminRendimiento"));
const SuperadminTenants     = lazy(() => import("./pages/aula/superadmin/TenantManagement"));

// Legal & Public Pages
const PrivacyPolicy      = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService     = lazy(() => import("./pages/TermsOfService"));
const Accreditations     = lazy(() => import("./pages/Accreditations"));
const TransparencyPortal = lazy(() => import("./pages/TransparencyPortal"));
const ComplaintsBook     = lazy(() => import("./pages/ComplaintsBook"));
const Noticias           = lazy(() => import("./pages/Noticias"));

// Admin Complaints Page
const AdminComplaints    = lazy(() => import("./pages/aula/admin/AdminComplaints"));

// Student sub-pages
const StudentCourses      = lazy(() => import("./pages/aula/student/StudentCourses"));
const StudentExploreCourses = lazy(() => import("./pages/aula/student/StudentExploreCourses"));
const StudentCoursePurchase = lazy(() => import("./pages/aula/student/StudentCoursePurchase"));
const StudentCourseDetail  = lazy(() => import("./pages/aula/student/StudentCourseDetail"));
const StudentPayments      = lazy(() => import("./pages/aula/student/StudentPayments"));
const StudentCertificates  = lazy(() => import("./pages/aula/student/StudentCertificates"));
const StudentGrades        = lazy(() => import("./pages/aula/student/StudentGrades"));
const StudentAttendance    = lazy(() => import("./pages/aula/student/StudentAttendance"));
const StudentMaterials     = lazy(() => import("./pages/aula/student/StudentMaterials"));
const StudentLiveClasses   = lazy(() => import("./pages/aula/student/StudentLiveClasses"));
const StudentProfile       = lazy(() => import("./pages/aula/student/StudentProfile"));

// Professor sub-pages
const ProfessorCourses      = lazy(() => import("./pages/aula/professor/ProfessorCourses"));
const ProfessorCourseDetail = lazy(() => import("./pages/aula/professor/ProfessorCourseDetail"));
const ProfessorStudents     = lazy(() => import("./pages/aula/professor/ProfessorStudents"));
const ProfessorCertificates = lazy(() => import("./pages/aula/professor/ProfessorCertificates"));
const ProfessorProfile      = lazy(() => import("./pages/aula/professor/ProfessorProfile"));
// Sprint 11 — Módulos
const ProfessorMateriales   = lazy(() => import("./pages/aula/professor/ProfessorMateriales"));
const StudentQuestionnaire  = lazy(() => import("./pages/aula/student/StudentQuestionnaire"));
const StudentAssignment     = lazy(() => import("./pages/aula/student/StudentAssignment"));
const QuestionnaireBuilder  = lazy(() => import("./pages/aula/admin/QuestionnaireBuilder"));

// Fallback de carga para rutas lazy
function LazyFallback() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader className="w-7 h-7 animate-spin text-secondary" />
    </div>
  );
}

// Wrapper que envuelve cada página lazy en Suspense
function L({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LazyFallback />}>{children}</Suspense>;
}

// React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Public Layout Wrapper
function PublicLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <div className="min-h-screen flex flex-col relative">
      {!isLoginPage && <Navbar />}
      <main className="flex-grow">
        {children}
      </main>
      {!isLoginPage && <Footer />}

      {/* Botón flotante de WhatsApp */}
      {!isLoginPage && (
        <a
          href="https://wa.me/51971707389"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center w-16 h-16 group"
          title="Contáctanos por WhatsApp"
        >
          {/* Pulsing effect ring */}
          <span className="absolute inset-1 rounded-full bg-[#25D366] opacity-35 animate-ping group-hover:animate-none pointer-events-none" />

          <img
            src={wsBtn}
            alt="WhatsApp"
            className="w-full h-full object-contain relative z-10"
          />
        </a>
      )}

    </div>
  );
}

function RootHome() {
  return hasActiveTenant() ? <HomeLegacy /> : <Home />;
}

/**
 * Redirects each role to its own home dashboard.
 * Prevents admins/profs from landing on the StudentDashboard at /aula.
 */
function RoleBasedDashboard() {
  const role = getCurrentUserRole() ?? 'student';
  if (role === 'admin' || role === 'superadmin') {
    return <Navigate to={`/aula/${role === 'superadmin' ? 'superadmin' : 'admin'}`} replace />;
  }
  if (role === 'prof') {
    return <Navigate to="/aula/prof" replace />;
  }
  return <StudentDashboard />;
}

function darkenColor(hex: string, percent: number): string {
  let num = parseInt(hex.replace("#",""), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) - amt,
      G = (num >> 8 & 0x00FF) - amt,
      B = (num & 0x0000FF) - amt;
  return "#" + (0x1000000 + (R<0?0:R>255?255:R)*0x10000 + (G<0?0:G>255?255:G)*0x100 + (B<0?0:B>255?255:B)).toString(16).slice(1);
}

export default function App() {
  useEffect(() => {
    // Dominio raíz del SaaS (sin tenant activo): branding de la plataforma,
    // sin consultar /tenant/current. El backend siempre responde con un
    // tenant por defecto como fallback, y aplicarlo aquí hacía que la landing
    // SaaS mostrara el título/colores de un aula (incidente 2026-06-10).
    if (!hasActiveTenant()) {
      const root = document.documentElement;
      root.style.setProperty('--color-primary', '#7A0F1F');
      root.style.setProperty('--color-primary-dark', '#64101C');
      root.style.setProperty('--color-secondary', '#3E3D2A');
      root.style.setProperty('--color-accent', '#C8A14A');
      document.title = 'EduWanka | Plataforma Educativa';
      return;
    }

    apiClient.get('/api/v1/tenant/current')
      .then(({ data }) => {
        const tenant = data.data ?? data;
        if (tenant && tenant.primary_color && tenant.secondary_color) {
          const root = document.documentElement;
          root.style.setProperty('--color-primary', tenant.primary_color);
          root.style.setProperty('--color-primary-dark', darkenColor(tenant.primary_color, 15));
          root.style.setProperty('--color-secondary', tenant.secondary_color);
          root.style.setProperty('--color-accent', tenant.secondary_color);
          document.title = `${tenant.name} | Aula Virtual`;

          // Store theme variables in localStorage for instant retrieval on next visit
          try {
            const cacheKey = 'tenant_colors_' + window.location.hostname;
            localStorage.setItem(cacheKey, JSON.stringify({
              primary_color: tenant.primary_color,
              primary_color_dark: darkenColor(tenant.primary_color, 15),
              secondary_color: tenant.secondary_color,
              name: tenant.name,
            }));
          } catch (e) {
            logger.warn('Unable to cache tenant colors', e);
          }
        } else {
          // Defaults
          const root = document.documentElement;
          root.style.setProperty('--color-primary', '#7A0F1F');
          root.style.setProperty('--color-primary-dark', '#64101C');
          root.style.setProperty('--color-secondary', '#3E3D2A');
          root.style.setProperty('--color-accent', '#C8A14A');
          document.title = 'EduWanka | Plataforma Educativa';
        }
      })
      .catch(() => {
        const root = document.documentElement;
        root.style.setProperty('--color-primary', '#7A0F1F');
        root.style.setProperty('--color-primary-dark', '#64101C');
        root.style.setProperty('--color-secondary', '#3E3D2A');
        root.style.setProperty('--color-accent', '#C8A14A');
      });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors />
      <Router>
        <ScrollToTop />
        <LocalhostTenantSelector />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout><RootHome /></PublicLayout>} />
          <Route path="/cursos" element={<PublicLayout><Courses /></PublicLayout>} />
          <Route path="/cursos/:id" element={<PublicLayout><CourseDetail /></PublicLayout>} />
          <Route path="/checkout/:id" element={<PublicLayout><L><Checkout /></L></PublicLayout>} />
          <Route path="/certificados" element={<PublicLayout><Certificates /></PublicLayout>} />
          <Route path="/faq" element={<PublicLayout><Faq /></PublicLayout>} />
          <Route path="/contacto" element={<PublicLayout><Contact /></PublicLayout>} />
          <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
          <Route path="/registro" element={<PublicLayout><Register /></PublicLayout>} />
          <Route path="/crear-aula" element={<PublicLayout><CrearAula /></PublicLayout>} />
          <Route path="/forgot-password" element={<PublicLayout><ForgotPassword /></PublicLayout>} />
          <Route path="/reset-password" element={<PublicLayout><ResetPassword /></PublicLayout>} />
          <Route path="/eventos/:id" element={<PublicLayout><EventDetail /></PublicLayout>} />
          <Route path="/especialidades/:id" element={<PublicLayout><EspecialidadDetail /></PublicLayout>} />
          <Route path="/politica-privacidad" element={<PublicLayout><L><PrivacyPolicy /></L></PublicLayout>} />
          <Route path="/terminos-servicio" element={<PublicLayout><L><TermsOfService /></L></PublicLayout>} />
          <Route path="/acreditaciones" element={<PublicLayout><L><Accreditations /></L></PublicLayout>} />
          <Route path="/transparencia" element={<PublicLayout><L><TransparencyPortal /></L></PublicLayout>} />
          <Route path="/reclamaciones" element={<PublicLayout><L><ComplaintsBook /></L></PublicLayout>} />
          <Route path="/noticias" element={<PublicLayout><L><Noticias /></L></PublicLayout>} />
          
          {/* Protected Routes (Aula Virtual) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/aula" element={<AulaLayout />}>
              {/* Role-based index: redirects admin/prof to their own section */}
              <Route index element={<RoleBasedDashboard />} />
              <Route path="cursos" element={<L><StudentCourses /></L>} />
              <Route path="explorar-cursos" element={<L><StudentExploreCourses /></L>} />
              <Route path="comprar/:id" element={<L><StudentCoursePurchase /></L>} />
              <Route path="cursos/:courseId" element={<L><StudentCourseDetail /></L>} />
              {/* Sprint 11 */}
              <Route path="cuestionario/:questionnaireId" element={<L><StudentQuestionnaire /></L>} />
              <Route path="tarea/:assignmentId" element={<L><StudentAssignment /></L>} />
              <Route path="pagos" element={<L><StudentPayments /></L>} />
              <Route path="certificados" element={<L><StudentCertificates /></L>} />
              <Route path="notas" element={<L><StudentGrades /></L>} />
              <Route path="asistencia" element={<L><StudentAttendance /></L>} />
              <Route path="materiales" element={<L><StudentMaterials /></L>} />
              <Route path="clases-envivo" element={<L><StudentLiveClasses /></L>} />
              <Route path="perfil" element={<L><StudentProfile /></L>} />
              <Route path="questionnaire-builder/:type/:id" element={<L><QuestionnaireBuilder /></L>} />
              
              {/* Professor */}
              <Route element={<ProtectedRoute allowedRoles={['prof', 'admin', 'superadmin']} />}>
                <Route path="prof">
                  <Route index element={<ProfessorDashboard />} />
                  <Route path="cursos"           element={<L><ProfessorCourses /></L>} />
                  <Route path="cursos/:courseId" element={<L><ProfessorCourseDetail /></L>} />
                  <Route path="cursos/:courseId/alumnos"       element={<L><ProfessorStudents /></L>} />
                  <Route path="cursos/:courseId/certificados"  element={<L><ProfessorCertificates /></L>} />
                  <Route path="alumnos"          element={<L><ProfessorStudents /></L>} />
                  <Route path="certificados"     element={<L><ProfessorCertificates /></L>} />
                  {/* Sprint 11 */}
                  <Route path="materiales/:courseId" element={<L><ProfessorMateriales /></L>} />
                  <Route path="perfil"           element={<L><ProfessorProfile /></L>} />
                </Route>
              </Route>
              
              {/* Admin */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin']} />}>
                <Route path="admin">
                  <Route index element={<AdminDashboard />} />
                  <Route path="usuarios"     element={<L><AdminUsuarios /></L>} />
                  <Route path="cursos"       element={<L><AdminCursos /></L>} />
                  <Route path="cursos/nuevo" element={<L><AdminCourseEditor /></L>} />
                  <Route path="cursos/:id/editar" element={<L><AdminCourseEditor /></L>} />
                  <Route path="especialidades" element={<L><AdminSpecialties /></L>} />
                  <Route path="especialidades/:id/brochure" element={<L><AdminSpecialtyBrochureBuilder /></L>} />
                  <Route path="cursos/:courseId/participantes" element={<L><AdminParticipantes /></L>} />
                  <Route path="docentes"     element={<L><AdminDocentes /></L>} />
                  <Route path="inicio"       element={<L><AdminInicio /></L>} />
                  <Route path="pagos"        element={<L><AdminPagos /></L>} />
                  <Route path="cuentas"      element={<L><AdminCuentas /></L>} />
                  <Route path="historial"    element={<L><AdminHistorial /></L>} />
                  <Route path="asistencia"   element={<L><AdminAsistencia /></L>} />
                  <Route path="materiales"   element={<L><AdminMateriales /></L>} />
                  {/* Sprint 11: ruta con courseId */}
                  <Route path="materiales/:courseId" element={<L><AdminMateriales /></L>} />
                  <Route path="certificados" element={<L><AdminCertificados /></L>} />
                   <Route path="claves"       element={<L><AdminClaves /></L>} />
                  <Route path="reclamaciones" element={<L><AdminComplaints /></L>} />
                  <Route path="reportes"     element={<L><AdminReportes /></L>} />
                </Route>
              </Route>
              
              {/* Super Admin */}
              <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
                <Route path="superadmin">
                  <Route index element={<SuperadminDashboard />} />
                  <Route path="usuarios"     element={<L><SuperadminUsers /></L>} />
                  <Route path="rendimiento"  element={<L><SuperadminRendimiento /></L>} />
                  <Route path="aulas"        element={<L><SuperadminTenants /></L>} />
                </Route>
              </Route>
            </Route>
          </Route>

          {/* Error Pages */}
          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}
