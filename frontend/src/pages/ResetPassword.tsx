import { motion } from "motion/react";
import { Lock, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiClient } from "@/lib/apiClient";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [formData, setFormData] = useState({
    token: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token") || "";
    const email = searchParams.get("email") || "";
    setFormData((prev) => ({ ...prev, token, email }));
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.password_confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (!formData.token || !formData.email) {
      setError("El enlace de restablecimiento es inválido o le faltan parámetros.");
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post("/api/v1/auth/reset-password", formData);
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
        "Ocurrió un error al restablecer la contraseña. El enlace podría haber expirado."
      );
    } finally {
      setIsLoading(false);
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
            <div className="bg-secondary/10 p-4 rounded-2xl mb-6">
              <Lock className="w-10 h-10 text-secondary" />
            </div>
            <h1 className="font-display text-2xl font-extrabold text-primary mb-2 text-center">Nueva Contraseña</h1>
            <p className="font-sans text-slate-500 text-center text-sm">Crea una nueva contraseña segura para ingresar a tu cuenta.</p>
          </div>

          {success ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="font-display text-xl font-bold text-primary mb-2">¡Contraseña Actualizada!</h3>
              <p className="font-sans text-slate-500">Redirigiéndote al inicio de sesión...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-sans">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Email (Hidden or Read-only) */}
              <div>
                <label className="block font-display text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                  Tu Correo
                </label>
                <input
                  type="email"
                  readOnly
                  disabled
                  value={formData.email}
                  className="w-full bg-slate-100 border-2 border-transparent p-4 rounded-xl font-sans font-medium text-slate-500 outline-none cursor-not-allowed"
                />
              </div>

              {/* Nueva Contraseña */}
              <div>
                <label className="block font-display text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                  Nueva Contraseña
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

              <button
                type="submit"
                disabled={isLoading}
                className="btn-pill w-full bg-primary text-white flex items-center justify-center space-x-3 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>{isLoading ? "Actualizando..." : "Restablecer Contraseña"}</span>
                {!isLoading && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
