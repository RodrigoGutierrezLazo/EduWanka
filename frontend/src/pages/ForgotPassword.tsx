import { motion } from "motion/react";
import { Mail, ArrowRight, Lock, AlertCircle, CheckCircle } from "lucide-react";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "@/lib/apiClient";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data } = await apiClient.post("/api/v1/auth/forgot-password", { email });
      setSuccess(true);
      setMessage(data.message || "Te hemos enviado un enlace para restablecer tu contraseña.");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        "No pudimos procesar tu solicitud. Revisa el correo ingresado."
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
            <Link to="/login" className="self-start mb-6 flex items-center text-slate-400 hover:text-secondary transition-colors font-sans text-sm font-bold group">
              <ArrowRight className="w-4 h-4 mr-2 rotate-180 group-hover:-translate-x-1 transition-transform" />
              Volver al Login
            </Link>
            <div className="bg-secondary/10 p-4 rounded-2xl mb-6">
              <Lock className="w-10 h-10 text-secondary" />
            </div>
            <h1 className="font-display text-2xl font-extrabold text-primary mb-2 text-center">¿Olvidaste tu contraseña?</h1>
            <p className="font-sans text-slate-500 text-center text-sm">Ingresa tu correo y te enviaremos las instrucciones para restablecer tu clave.</p>
          </div>

          {success ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6 text-center"
            >
              <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-start gap-3 text-sm font-sans">
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="font-bold">Solicitud procesada</p>
                  <p>{message}</p>
                </div>
              </div>

              <Link
                to="/login"
                className="btn-pill w-full bg-primary text-white flex items-center justify-center"
              >
                Volver al inicio de sesión
              </Link>
            </motion.div>
          ) : (
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
                    placeholder="correo@ejemplo.com"
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-secondary focus:bg-white p-4 pl-12 rounded-xl font-sans font-medium text-primary outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-pill w-full bg-primary text-white flex items-center justify-center space-x-3 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>{isLoading ? "Enviando..." : "Enviar Enlace"}</span>
                {!isLoading && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
