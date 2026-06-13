import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Play,
  Pause,
  UserPlus,
  Palette,
  BookOpen,
  Rocket,
  Award,
  CheckCircle,
  Layers,
  QrCode,
  Bell,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

/* ═══════════════════════════════════════════════════════════════════
   DEMO SHOWCASE — "Video" animado del paso a paso de crear un aula.
   Walkthrough auto-reproducible con 5 escenas animadas dentro de un
   navegador simulado, con controles de reproducción y progreso.
   ═══════════════════════════════════════════════════════════════════ */

const SCENE_MS = 4500;

const typewriter = (delay: number) => ({
  initial: { width: "0%" },
  animate: { width: "100%" },
  transition: { delay, duration: 0.7, ease: "easeOut" as const },
});

const pop = (delay: number) => ({
  initial: { opacity: 0, scale: 0.6 },
  animate: { opacity: 1, scale: 1 },
  transition: { delay, type: "spring" as const, stiffness: 260, damping: 17 },
});

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.45, ease: "easeOut" as const },
});

/* ── Escena 1: Registro ──────────────────────────────────────────── */
const SceneRegistro = () => (
  <div className="h-full flex items-center justify-center p-6">
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
      <motion.p {...rise(0.1)} className="text-sm font-black text-slate-900 mb-1">
        Crea tu aula virtual
      </motion.p>
      <motion.p {...rise(0.2)} className="text-[11px] text-slate-400 mb-4">
        30 días gratis · sin tarjeta
      </motion.p>
      {[
        { label: "Institución", value: "Academia San Marcos", delay: 0.5 },
        { label: "Subdominio", value: "sanmarcos.eduwanka.net.pe", delay: 1.2 },
        { label: "Email", value: "admin@sanmarcos.pe", delay: 1.9 },
      ].map((f) => (
        <div key={f.label} className="mb-3">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{f.label}</p>
          <div className="h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 flex items-center overflow-hidden">
            <motion.span {...typewriter(f.delay)} className="text-[11px] font-medium text-slate-700 whitespace-nowrap overflow-hidden">
              {f.value}
            </motion.span>
          </div>
        </div>
      ))}
      <motion.div
        {...pop(2.8)}
        className="mt-4 bg-primary text-white text-center py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest"
      >
        <motion.span
          initial={{ opacity: 1 }}
          animate={{ opacity: [1, 0.6, 1] }}
          transition={{ delay: 3.4, duration: 0.4 }}
        >
          Crear Mi Aula →
        </motion.span>
      </motion.div>
      <motion.div {...pop(3.8)} className="mt-3 flex items-center justify-center gap-1.5 text-green-600">
        <CheckCircle className="w-3.5 h-3.5" />
        <span className="text-[10px] font-bold">¡Aula creada!</span>
      </motion.div>
    </div>
  </div>
);

/* ── Escena 2: Marca ─────────────────────────────────────────────── */
const SceneMarca = () => (
  <div className="h-full flex items-center justify-center p-6 gap-6">
    <div className="w-44 shrink-0">
      <motion.div {...rise(0.2)} className="bg-white rounded-2xl shadow-xl border border-slate-100 p-4 mb-3">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Logo</p>
        <motion.div {...pop(0.7)} className="h-14 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center">
          <Upload className="w-4 h-4 text-slate-300" />
        </motion.div>
      </motion.div>
      <motion.div {...rise(0.4)} className="bg-white rounded-2xl shadow-xl border border-slate-100 p-4">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Colores</p>
        <div className="flex gap-2">
          {["#7A0F1F", "#C8A14A", "#1E3A8A", "#065F46"].map((c, i) => (
            <motion.span
              key={c}
              {...pop(1 + i * 0.15)}
              className={`w-7 h-7 rounded-full border-2 ${i === 0 ? "border-slate-800 scale-110" : "border-white"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </motion.div>
    </div>
    <motion.div {...rise(0.6)} className="flex-1 max-w-xs bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
      <motion.div
        initial={{ backgroundColor: "#64748B" }}
        animate={{ backgroundColor: "#7A0F1F" }}
        transition={{ delay: 2, duration: 0.8 }}
        className="px-4 py-3"
      >
        <motion.p {...pop(2.4)} className="text-white text-[11px] font-black">Academia San Marcos</motion.p>
      </motion.div>
      <div className="p-4 space-y-2">
        <div className="h-2.5 bg-slate-100 rounded w-3/4" />
        <div className="h-2.5 bg-slate-100 rounded w-1/2" />
        <motion.div
          initial={{ backgroundColor: "#E2E8F0" }}
          animate={{ backgroundColor: "#C8A14A" }}
          transition={{ delay: 2.8, duration: 0.6 }}
          className="h-7 rounded-lg w-28 mt-3"
        />
      </div>
      <motion.p {...pop(3.5)} className="text-center text-[10px] font-bold text-green-600 pb-3 flex items-center justify-center gap-1">
        <CheckCircle className="w-3 h-3" /> Tu marca aplicada
      </motion.p>
    </motion.div>
  </div>
);

/* ── Escena 3: Curso ─────────────────────────────────────────────── */
const SceneCurso = () => (
  <div className="h-full flex items-center justify-center p-6">
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="bg-primary px-4 py-2.5 flex items-center gap-2">
        <BookOpen className="w-3.5 h-3.5 text-white/80" />
        <span className="text-white text-[11px] font-bold">Nuevo Curso</span>
      </div>
      <div className="p-4">
        <div className="h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 flex items-center overflow-hidden mb-3">
          <motion.span {...typewriter(0.4)} className="text-[11px] font-bold text-slate-800 whitespace-nowrap overflow-hidden">
            Diplomado en Derecho Digital
          </motion.span>
        </div>
        {["Módulo 1: Introducción", "Módulo 2: Marco Normativo", "Módulo 3: Casos Prácticos"].map((m, i) => (
          <motion.div
            key={m}
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.3 + i * 0.5, duration: 0.4, ease: "easeOut" }}
            className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 rounded-lg mb-2"
          >
            <Layers className="w-3.5 h-3.5 text-primary/50" />
            <span className="text-[11px] font-medium text-slate-600 flex-1">{m}</span>
            <motion.span {...pop(1.6 + i * 0.5)} className="text-green-500">
              <CheckCircle className="w-3.5 h-3.5" />
            </motion.span>
          </motion.div>
        ))}
        <motion.div {...rise(3.2)} className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-[10px] text-slate-400 font-medium">3 módulos · 12 secciones</span>
          <span className="text-[11px] font-black text-primary">S/ 450.00</span>
        </motion.div>
      </div>
    </div>
  </div>
);

/* ── Escena 4: Publicar y vender ─────────────────────────────────── */
const ScenePublicar = () => (
  <div className="h-full flex items-center justify-center p-6">
    <div className="relative w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[12px] font-black text-slate-900">Diplomado en Derecho Digital</p>
            <p className="text-[10px] text-slate-400">S/ 450.00 · 3 módulos</p>
          </div>
          {/* Toggle publicar */}
          <motion.div
            initial={{ backgroundColor: "#E2E8F0" }}
            animate={{ backgroundColor: "#16A34A" }}
            transition={{ delay: 1, duration: 0.4 }}
            className="w-12 h-6 rounded-full relative shrink-0"
          >
            <motion.span
              initial={{ x: 2 }}
              animate={{ x: 26 }}
              transition={{ delay: 1, type: "spring", stiffness: 400, damping: 25 }}
              className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow"
            />
          </motion.div>
        </div>
        <motion.span {...pop(1.5)} className="inline-block text-[9px] font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-full uppercase tracking-widest">
          Publicado
        </motion.span>
        <div className="mt-4 space-y-2">
          {[
            { name: "María Quispe", amount: "S/ 450.00", delay: 2.2 },
            { name: "Jorge Mendoza", amount: "S/ 450.00", delay: 3 },
          ].map((p) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: p.delay, type: "spring", stiffness: 200, damping: 20 }}
              className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-3 py-2.5"
            >
              <span className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <Bell className="w-3.5 h-3.5 text-green-600" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-slate-800 truncate">Nueva matrícula — {p.name}</p>
                <p className="text-[9px] text-slate-400">Pago vía Yape</p>
              </div>
              <span className="text-[11px] font-black text-green-600">{p.amount}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ── Escena 5: Certificar ────────────────────────────────────────── */
const SceneCertificar = () => (
  <div className="h-full flex items-center justify-center p-6">
    <motion.div
      initial={{ opacity: 0, rotateY: -70 }}
      animate={{ opacity: 1, rotateY: 0 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-accent/40 p-6 relative"
      style={{ perspective: 800 }}
    >
      <div className="absolute inset-2 border border-accent/20 rounded-xl pointer-events-none" />
      <motion.div {...pop(0.6)} className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
        <Award className="w-6 h-6 text-accent" />
      </motion.div>
      <motion.p {...rise(0.9)} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
        Certificado Oficial
      </motion.p>
      <motion.p {...rise(1.1)} className="text-center font-display text-lg font-extrabold text-slate-900 mb-1">
        María Quispe Huamán
      </motion.p>
      <motion.p {...rise(1.3)} className="text-center text-[11px] text-slate-500 mb-4">
        Diplomado en Derecho Digital · 120 horas
      </motion.p>
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <motion.div {...rise(1.7)}>
          <div className="h-2 w-20 bg-slate-200 rounded mb-1.5" />
          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Firma Digital</p>
        </motion.div>
        <motion.div {...pop(2.2)} className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center">
          <QrCode className="w-7 h-7 text-white" />
        </motion.div>
      </div>
      <motion.p {...pop(3)} className="mt-4 text-center text-[10px] font-bold text-green-600 flex items-center justify-center gap-1">
        <CheckCircle className="w-3 h-3" /> Verificable en línea con código QR
      </motion.p>
    </motion.div>
  </div>
);

const SCENES = [
  { id: 0, label: "Regístrate", icon: <UserPlus className="w-3.5 h-3.5" />, url: "eduwanka.net.pe/crear-aula", component: <SceneRegistro /> },
  { id: 1, label: "Tu marca", icon: <Palette className="w-3.5 h-3.5" />, url: "sanmarcos.eduwanka.net.pe/admin/marca", component: <SceneMarca /> },
  { id: 2, label: "Crea tu curso", icon: <BookOpen className="w-3.5 h-3.5" />, url: "sanmarcos.eduwanka.net.pe/admin/cursos", component: <SceneCurso /> },
  { id: 3, label: "Publica y vende", icon: <Rocket className="w-3.5 h-3.5" />, url: "sanmarcos.eduwanka.net.pe/cursos", component: <ScenePublicar /> },
  { id: 4, label: "Certifica", icon: <Award className="w-3.5 h-3.5" />, url: "sanmarcos.eduwanka.net.pe/certificados", component: <SceneCertificar /> },
];

export default function DemoShowcase() {
  const reduceMotion = useReducedMotion();
  const [scene, setScene] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          setPlaying(!reduceMotion);
        } else {
          setIsInView(false);
          setPlaying(false);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [reduceMotion]);

  useEffect(() => {
    if (!playing || !isInView || reduceMotion) return;
    const t = setTimeout(() => setScene((s) => (s + 1) % SCENES.length), SCENE_MS);
    return () => clearTimeout(t);
  }, [playing, scene, reduceMotion, isInView]);

  const current = SCENES[scene];

  return (
    <section ref={sectionRef} id="demo" className="py-24 md:py-32 bg-gradient-to-br from-[#1a0507] via-[#7A0F1F] to-[#2a0509] px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />
      <div className="absolute top-10 left-1/4 w-72 h-72 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/15 border border-accent/30 rounded-full text-accent text-[11px] font-black uppercase tracking-widest mb-6"
          >
            <Play className="w-3.5 h-3.5" />
            Demo en 25 segundos
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl md:text-5xl text-white font-extrabold mb-4 tracking-tight"
          >
            Mira cómo nace <span className="text-accent italic">un aula</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-sans text-lg text-white/50 max-w-xl mx-auto"
          >
            Del registro al primer certificado emitido: el recorrido completo, en vivo.
          </motion.p>
        </div>

        {/* Player */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white/[0.06] backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/10">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
              <span className="w-3 h-3 rounded-full bg-green-400/80" />
            </div>
            <div className="flex-1 h-7 bg-white/5 rounded-lg flex items-center px-3 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.span
                  key={current.url}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="text-[10px] text-white/40 font-medium truncate"
                >
                  {current.url}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* Stage */}
          <div className="relative h-[340px] sm:h-[380px] bg-gradient-to-br from-[#F9F6F0] to-[#efe9dd]">
            <AnimatePresence mode="wait">
              <motion.div
                key={scene}
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0"
              >
                {current.component}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="px-5 py-4 border-t border-white/10">
            {/* Progress */}
            <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-4">
              <motion.div
                key={`${scene}-${playing}`}
                initial={{ width: "0%" }}
                animate={{ width: playing && !reduceMotion ? "100%" : "0%" }}
                transition={{ duration: SCENE_MS / 1000, ease: "linear" }}
                className="h-full bg-gradient-to-r from-accent/70 to-accent rounded-full"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? "Pausar demo" : "Reproducir demo"}
                className="w-10 h-10 rounded-full bg-accent text-[#1a0507] flex items-center justify-center hover:scale-105 transition-transform shrink-0"
              >
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-[1px]" />}
              </button>
              <div className="flex flex-wrap gap-2 flex-1">
                {SCENES.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => { setScene(i); setPlaying(true); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                      i === scene
                        ? "bg-accent text-[#1a0507]"
                        : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 border border-white/10"
                    }`}
                  >
                    {s.icon}
                    <span className="hidden sm:inline">{s.label}</span>
                    <span className="sm:hidden">{i + 1}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link
            to="/crear-aula"
            className="inline-flex items-center gap-2 bg-accent text-[#1a0507] px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest shadow-lg shadow-accent/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            <Rocket className="w-4 h-4" />
            Crear mi aula ahora — gratis 30 días
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
