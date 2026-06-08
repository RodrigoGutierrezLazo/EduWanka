import { motion } from "motion/react";
import { Lock, Mail, User, Phone, MapPin, CreditCard, ArrowRight, GraduationCap, AlertCircle, CheckCircle } from "lucide-react";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient, ensureCsrfCookie } from "@/lib/apiClient";
import { clearAllAuthStorages, setActiveAuthSource } from "@/lib/auth";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    last_name: "",
    email: "",
    password: "",
    password_confirmation: "",
    dni: "",
    phone: "",
    city: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar coincidencia de contraseña
    if (formData.password !== formData.password_confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsLoading(true);

    try {
      clearAllAuthStorages();

      // Sanctum SPA: se requiere la cookie XSRF-TOKEN antes de POSTs de auth
      await ensureCsrfCookie();

      const { data: res } = await apiClient.post("/api/v1/auth/register", formData);

      const user = res.data;

      // Guardar sesión por defecto en sessionStorage (para proteger accesos)
      sessionStorage.setItem("eduwanka_user", JSON.stringify(user));
      // Fallback a localStorage para compatibilidad
      localStorage.setItem("eduwanka_user", JSON.stringify(user));
      setActiveAuthSource("session");

      setSuccess(true);
      setTimeout(() => {
        navigate("/aula");
      }, 1500);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.errors?.email?.[0] ??
        err?.response?.data?.errors?.dni?.[0] ??
        err?.response?.data?.errors?.password?.[0] ??
        "No se pudo completar el registro. Verifica los datos ingresados.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6 py-12">
      <div className="max-w-2xl w-full">
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
            <h1 className="font-display text-3xl font-extrabold text-primary mb-2">Crear Cuenta</h1>
            <p className="font-sans text-slate-500 text-center">Regístrate para comenzar tu formación en nuestra Aula Virtual</p>
          </div>

          {success ? (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-10"
            >
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="font-display text-2xl font-bold text-primary mb-2">¡Registro Exitoso!</h3>
              <p className="font-sans text-slate-500">Redirigiéndote al aula virtual...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-sans">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre */}
                <div>
                  <label className="block font-display text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Nombres
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Tu nombre"
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-secondary focus:bg-white p-4 pl-12 rounded-xl font-sans font-medium text-primary outline-none transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>

                {/* Apellidos */}
                <div>
                  <label className="block font-display text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Apellidos
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="last_name"
                      required
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="Tus apellidos"
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-secondary focus:bg-white p-4 pl-12 rounded-xl font-sans font-medium text-primary outline-none transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block font-display text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="correo@ejemplo.com"
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-secondary focus:bg-white p-4 pl-12 rounded-xl font-sans font-medium text-primary outline-none transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>

                {/* DNI */}
                <div>
                  <label className="block font-display text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                    DNI / Documento
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="dni"
                      required
                      value={formData.dni}
                      onChange={handleChange}
                      placeholder="Número de documento"
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-secondary focus:bg-white p-4 pl-12 rounded-xl font-sans font-medium text-primary outline-none transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block font-display text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Teléfono / Celular
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="987654321"
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-secondary focus:bg-white p-4 pl-12 rounded-xl font-sans font-medium text-primary outline-none transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>

                {/* Ciudad */}
                <div>
                  <label className="block font-display text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Ciudad
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Lima, Huancayo, etc."
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-secondary focus:bg-white p-4 pl-12 rounded-xl font-sans font-medium text-primary outline-none transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div>
                  <label className="block font-display text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-secondary focus:bg-white p-4 pl-12 rounded-xl font-sans font-medium text-primary outline-none transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>

                {/* Confirmar Contraseña */}
                <div>
                  <label className="block font-display text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      name="password_confirmation"
                      required
                      value={formData.password_confirmation}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-secondary focus:bg-white p-4 pl-12 rounded-xl font-sans font-medium text-primary outline-none transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-pill w-full bg-primary text-white flex items-center justify-center space-x-3 disabled:opacity-60 disabled:cursor-not-allowed mt-8"
              >
                <span>{isLoading ? "Creando Cuenta..." : "Registrarme"}</span>
                {!isLoading && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>
          )}

          <div className="mt-12 pt-8 border-t border-slate-50 text-center">
            <p className="font-serif text-slate-500 text-sm">
              ¿Ya tienes una cuenta? <br />
              <Link to="/login" className="text-secondary font-bold hover:text-primary transition-colors">Inicia sesión aquí</Link>
            </p>
          </div>
        </motion.div>

        <div className="mt-8 text-center text-slate-400 text-[10px] uppercase tracking-widest font-bold">
          © 2024 EduWanka • Institución de Alta Especialización
        </div>
      </div>
    </div>
  );
}
