import { motion } from "motion/react";
import { Lock, Mail, ArrowRight, GraduationCap, AlertCircle, X, CheckCircle } from "lucide-react";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient, ensureCsrfCookie } from "@/lib/apiClient";
import { clearAllAuthStorages, setActiveAuthSource, isAuthenticated, getCurrentUserRole } from "@/lib/auth";

const ROLE_ROUTES: Record<string, string> = {
  student: "/aula",
  prof: "/aula/prof",
  admin: "/aula/admin",
  superadmin: "/aula/superadmin",
};

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si ya está autenticado, redirigir al aula directamente
  React.useEffect(() => {
    if (isAuthenticated()) {
      const role = getCurrentUserRole();
      navigate(role ? (ROLE_ROUTES[role] ?? "/aula") : "/aula", { replace: true });
    }
  }, [navigate]);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [forgotMessage, setForgotMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      clearAllAuthStorages();

      // Sanctum SPA: se requiere la cookie XSRF-TOKEN antes de POSTs de auth
      await ensureCsrfCookie();

      const { data: res } = await apiClient.post("/api/v1/auth/login", {
        email,
        password,
        remember: rememberMe,
      });

      const user = res.data;
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("eduwanka_user", JSON.stringify(user));
      if (!rememberMe) {
        localStorage.setItem("eduwanka_user", JSON.stringify(user));
      }
      setActiveAuthSource(rememberMe ? "local" : "session");

      navigate(ROLE_ROUTES[user.role] ?? "/aula");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        "No se pudo conectar al servidor. Verifica tu conexión.";
      setError(msg === "Invalid credentials" ? "Credenciales incorrectas." : msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotStatus("loading");
    setForgotMessage("");

    try {
      const { data } = await apiClient.post("/api/v1/auth/forgot-password", {
        email: forgotEmail,
      });
      setForgotStatus("success");
      setForgotMessage(data.message || "Solicitud enviada correctamente.");
    } catch (err: any) {
      setForgotStatus("error");
      setForgotMessage(
        err?.response?.data?.message || err?.response?.data?.errors?.email?.[0] || "No se pudo enviar la solicitud. Verifica el correo."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6 py-12">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 md:p-12 rounded-2xl shadow-soft border border-slate-100"
        >
          <div className="mb-10 flex flex-col items-center">
            <Link to="/" className="self-start mb-6 flex items-center text-slate-400 hover:text-secondary transition-colors font-sans text-sm font-bold group">
              <ArrowRight className="w-4 h-4 mr-2 rotate-180 group-hover:-translate-x-1 transition-transform" />
              Volver al inicio
            </Link>
            <div className="bg-secondary/10 p-4 rounded-2xl mb-6">
              <GraduationCap className="w-10 h-10 text-secondary" />
            </div>
            <h1 className="font-display text-3xl font-extrabold text-primary mb-2">Bienvenido</h1>
            <p className="font-sans text-slate-500">Ingresa tus credenciales para acceder</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-sans">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block font-display text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@ejemplo.com"
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-secondary focus:bg-white p-4 pl-12 rounded-xl font-sans font-medium text-primary outline-none transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="block font-display text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Contraseña
                </label>
                <Link 
                  to="/forgot-password"
                  className="text-[10px] font-bold text-secondary uppercase tracking-widest hover:text-primary transition-colors">
                  ¿Olvidaste tu clave?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-secondary focus:bg-white p-4 pl-12 rounded-xl font-sans font-medium text-primary outline-none transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 px-1">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="accent-secondary h-4 w-4"
              />
              <label htmlFor="remember" className="text-sm font-sans text-slate-500">Recordar mi sesión</label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-pill w-full bg-primary text-white flex items-center justify-center space-x-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>{isLoading ? "Verificando..." : "Entrar al Aula"}</span>
              {!isLoading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-slate-50 text-center">
            <p className="font-serif text-slate-500 text-sm">
              ¿No tienes una cuenta? <br />
              <Link to="/registro" className="text-secondary font-bold hover:text-primary transition-colors">Regístrate aquí</Link>
              <span className="text-slate-300 mx-2">•</span>
              <Link to="/cursos" className="text-slate-400 hover:text-primary transition-colors text-xs">Explorar cursos</Link>
            </p>
          </div>
        </motion.div>

        <div className="mt-8 text-center text-slate-400 text-[10px] uppercase tracking-widest font-bold">
          © 2024 EduWanka • Institución de Alta Especialización
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-sm w-full relative shadow-2xl"
          >
            <button 
              onClick={() => {
                setShowForgotModal(false);
                setForgotStatus("idle");
                setForgotEmail("");
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6 text-center">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-secondary" />
              </div>
              <h2 className="font-display text-xl font-bold text-primary mb-2">Restablecer Contraseña</h2>
              <p className="text-sm text-slate-500 font-sans">
                Ingresa tu correo y un administrador revisará tu solicitud para generar una nueva clave.
              </p>
            </div>

            {forgotStatus === "success" ? (
              <div className="text-center">
                <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-start gap-3 text-sm font-sans mb-6">
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-left">{forgotMessage}</p>
                </div>
                <button 
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotStatus("idle");
                  }}
                  className="btn-pill w-full bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                {forgotStatus === "error" && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-xl flex items-center gap-2 text-sm font-sans">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{forgotMessage}</span>
                  </div>
                )}
                <div>
                  <label className="block font-display text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="email@ejemplo.com"
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-secondary focus:bg-white p-3 rounded-xl font-sans font-medium text-primary outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotStatus === "loading" || !forgotEmail}
                  className="btn-pill w-full bg-primary text-white flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {forgotStatus === "loading" ? "Enviando..." : "Enviar Solicitud"}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
