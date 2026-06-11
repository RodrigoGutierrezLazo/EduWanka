import { motion } from "motion/react";
import {
  Rocket,
  CheckCircle,
  XCircle,
  Loader,
  Building2,
  Globe,
  Award,
  CreditCard,
  Palette,
  ArrowRight,
  PartyPopper,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { apiClient, ensureCsrfCookie } from "../lib/apiClient";

/* ═══════════════════════════════════════════════════════════════════
   CREAR AULA — Alta self-service de instituciones (onboarding SaaS).
   Crea el tenant + usuario admin + trial de 30 días vía
   POST /api/v1/tenants/register, con verificación de subdominio en vivo.
   ═══════════════════════════════════════════════════════════════════ */

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);

type SlugStatus = "idle" | "checking" | "available" | "taken";

export default function CrearAula() {
  const [form, setForm] = useState({
    institution_name: "",
    slug: "",
    name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
  });
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [slugReason, setSlugReason] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ aulaUrl: string; tenantName: string; slug: string } | null>(null);

  const effectiveSlug = useMemo(
    () => (slugTouched ? form.slug : slugify(form.institution_name)),
    [slugTouched, form.slug, form.institution_name]
  );

  // Verificación en vivo del subdominio (debounce 450ms)
  useEffect(() => {
    if (!effectiveSlug || effectiveSlug.length < 3) {
      setSlugStatus("idle");
      setSlugReason(null);
      return;
    }
    setSlugStatus("checking");
    const t = setTimeout(() => {
      apiClient
        .get("/api/v1/tenants/check-slug", { params: { slug: effectiveSlug } })
        .then(({ data }) => {
          setSlugStatus(data.available ? "available" : "taken");
          setSlugReason(data.reason ?? null);
        })
        .catch(() => setSlugStatus("idle"));
    }, 450);
    return () => clearTimeout(t);
  }, [effectiveSlug]);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGeneralError(null);
    try {
      await ensureCsrfCookie();
      const { data } = await apiClient.post("/api/v1/tenants/register", {
        ...form,
        slug: effectiveSlug,
      });
      setSuccess({
        aulaUrl: data.data?.aula_url ?? "",
        tenantName: data.data?.tenant?.name ?? form.institution_name,
        slug: data.data?.tenant?.slug ?? effectiveSlug,
      });
    } catch (err: any) {
      if (err.response?.status === 422 && err.response.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setGeneralError(err.response?.data?.message ?? "No pudimos crear tu aula. Inténtalo de nuevo.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fieldError = (field: string) => errors[field]?.[0];

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0507] via-[#7A0F1F] to-[#2a0509] flex items-center justify-center px-6 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 12 }}
            className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <PartyPopper className="w-10 h-10 text-green-600" />
          </motion.div>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 mb-3">
            ¡{success.tenantName} ya tiene su aula!
          </h1>
          <p className="text-slate-500 mb-2">
            Tu periodo de prueba de <strong>30 días gratis</strong> ya está corriendo.
          </p>
          <p className="text-sm text-slate-400 mb-8">
            Tu aula vivirá en{" "}
            <span className="font-bold text-primary">{success.slug}.eduwanka.net.pe</span>
          </p>
          <div className="space-y-3">
            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-primary-dark transition-all"
            >
              Entrar a mi aula <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-slate-400">
              Inicia sesión con el correo y contraseña que registraste.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0507] via-[#7A0F1F] to-[#2a0509] pt-32 pb-20 px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />
      <div className="absolute top-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start relative z-10">
        {/* Left: pitch */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="lg:sticky lg:top-32"
        >
          <span className="inline-block px-4 py-1.5 bg-accent/15 border border-accent/30 rounded-full text-accent text-[11px] font-black uppercase tracking-widest mb-8">
            30 días gratis · Sin tarjeta
          </span>
          <h1 className="font-display text-4xl md:text-5xl text-white font-extrabold leading-tight tracking-tight mb-6">
            Tu institución merece su propia{" "}
            <span className="text-accent italic">aula virtual</span>
          </h1>
          <p className="text-lg text-white/60 leading-relaxed mb-10 max-w-md">
            En menos de un minuto tendrás tu subdominio, tu panel de administración
            y todo listo para crear tu primer curso.
          </p>
          <ul className="space-y-4">
            {[
              { icon: <Globe className="w-4 h-4" />, text: "Subdominio propio: tuacademia.eduwanka.net.pe" },
              { icon: <Palette className="w-4 h-4" />, text: "Tu logo y tus colores en toda la plataforma" },
              { icon: <CreditCard className="w-4 h-4" />, text: "Cobra por Yape, Plin, transferencia o MercadoPago" },
              { icon: <Award className="w-4 h-4" />, text: "Certificados PDF con código QR verificable" },
            ].map((b, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 text-white/80 text-sm font-medium"
              >
                <span className="w-9 h-9 bg-accent/15 rounded-xl flex items-center justify-center text-accent shrink-0">
                  {b.icon}
                </span>
                {b.text}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Right: form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="bg-white rounded-3xl shadow-2xl p-8 md:p-10"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 bg-primary/5 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-sans text-lg font-bold text-slate-900">Crea tu aula</h2>
              <p className="text-xs text-slate-400">Empieza tu prueba gratuita de 30 días</p>
            </div>
          </div>

          {generalError && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                Nombre de tu institución
              </label>
              <input
                type="text"
                required
                value={form.institution_name}
                onChange={set("institution_name")}
                placeholder="Academia San Marcos"
                className="w-full bg-slate-50 border border-slate-200 focus:border-primary rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-colors"
              />
              {fieldError("institution_name") && <p className="text-xs text-red-600 mt-1">{fieldError("institution_name")}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                Tu subdominio
              </label>
              <div className="flex items-center bg-slate-50 border border-slate-200 focus-within:border-primary rounded-xl overflow-hidden transition-colors">
                <input
                  type="text"
                  required
                  value={effectiveSlug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setForm((f) => ({ ...f, slug: slugify(e.target.value) }));
                  }}
                  placeholder="sanmarcos"
                  className="flex-1 bg-transparent px-4 py-3 text-sm font-bold text-primary outline-none min-w-0"
                />
                <span className="px-3 text-xs text-slate-400 font-medium shrink-0">.eduwanka.net.pe</span>
                <span className="pr-3 shrink-0">
                  {slugStatus === "checking" && <Loader className="w-4 h-4 text-slate-300 animate-spin" />}
                  {slugStatus === "available" && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {slugStatus === "taken" && <XCircle className="w-4 h-4 text-red-500" />}
                </span>
              </div>
              {slugStatus === "taken" && (
                <p className="text-xs text-red-600 mt-1">{slugReason ?? "Ese subdominio ya está en uso."}</p>
              )}
              {slugStatus === "available" && (
                <p className="text-xs text-green-600 mt-1">¡Disponible!</p>
              )}
              {fieldError("slug") && <p className="text-xs text-red-600 mt-1">{fieldError("slug")}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Tu nombre
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Rodrigo"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-primary rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-colors"
                />
                {fieldError("name") && <p className="text-xs text-red-600 mt-1">{fieldError("name")}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Apellidos
                </label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={set("last_name")}
                  placeholder="Gutiérrez"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-primary rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={set("email")}
                  placeholder="admin@tuacademia.pe"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-primary rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-colors"
                />
                {fieldError("email") && <p className="text-xs text-red-600 mt-1">{fieldError("email")}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Teléfono <span className="text-slate-300 normal-case">(opcional)</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="+51 999 999 999"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-primary rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={set("password")}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-primary rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-colors"
                />
                {fieldError("password") && <p className="text-xs text-red-600 mt-1">{fieldError("password")}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  required
                  value={form.password_confirmation}
                  onChange={set("password_confirmation")}
                  placeholder="Repite tu contraseña"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-primary rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || slugStatus === "taken"}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
            >
              {submitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" /> Creando tu aula...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" /> Crear mi aula gratis
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-slate-400 leading-relaxed">
              Al crear tu aula aceptas los{" "}
              <Link to="/terminos-servicio" className="text-primary font-bold hover:underline">Términos de Servicio</Link>{" "}
              y la{" "}
              <Link to="/politica-privacidad" className="text-primary font-bold hover:underline">Política de Privacidad</Link>.
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
