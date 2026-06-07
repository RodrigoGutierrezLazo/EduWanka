import { motion } from "motion/react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Clock, BookOpen, Star, CheckCircle2, User, ArrowLeft,
  Calendar, Award, Lock, ChevronDown, HelpCircle, ImageOff, Loader2,
  GraduationCap,
} from "lucide-react";
import { useState } from "react";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import { getCurrentUserRole, isAuthenticated } from "../lib/auth";

/* ─── Types ─────────────────────────────────────────────────────── */
interface TeacherProfile {
  id: number; name: string; title?: string | null; specialty?: string | null;
  bio?: string | null; credentials?: string | null; photo_url?: string | null;
}

interface PublicCourse {
  id: number; slug?: string | null; title: string; code?: string | null;
  type?: string; specialty?: string | null; description?: string | null;
  syllabus?: string[]; requirements?: string[]; price: number; price_label: string;
  duration_weeks: number; start_date?: string | null; end_date?: string | null;
  hours?: number | null; level?: string | null; category: string;
  image_url?: string | null; teacher_name?: string | null;
  main_teacher?: TeacherProfile | null; teachers?: TeacherProfile[];
}

/* ─── Helpers ───────────────────────────────────────────────────── */
const resolveImg = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('/storage')) return url;
  return `/storage/${url.replace(/^\/+/, '')}`;
};

const fmtDate = (d?: string | null) => {
  if (!d) return null;
  return new Date(d + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
};

/* ─── FAQ ───────────────────────────────────────────────────────── */
interface FAQItemProps { question: string; answer: string; }
const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full py-6 flex items-center justify-between text-left group">
        <div className="flex items-center">
          <HelpCircle className={`w-5 h-5 mr-4 transition-colors ${isOpen ? "text-secondary" : "text-slate-300 group-hover:text-secondary"}`} />
          <span className="font-sans font-bold text-lg text-primary">{question}</span>
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-secondary" : ""}`} />
      </button>
      <motion.div initial={false} animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }} className="overflow-hidden">
        <p className="font-serif text-slate-600 pb-6 pl-9 leading-relaxed">{answer}</p>
      </motion.div>
    </div>
  );
};

const DEFAULT_FAQS = [
  { question: "¿Cómo me inscribo en el curso?", answer: "Haz clic en 'Inscribirme Ahora' y completa el proceso de pago. Una vez validado tu pago, recibirás acceso inmediato al aula virtual." },
  { question: "¿Recibo un certificado al finalizar?", answer: "Sí, al aprobar el examen final recibirás un certificado oficial EduWanka verificable digitalmente." },
  { question: "¿Por cuánto tiempo tengo acceso al material?", answer: "Tienes acceso de por vida a todo el material del curso una vez inscrito." },
];

/* ─── Main Component ────────────────────────────────────────────── */
export default function CourseDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const { data: course, isLoading, isError } = useQuery<PublicCourse | null>({
    queryKey: ["public-course", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await apiClient.get(`/api/v1/courses/${encodeURIComponent(id)}`);
      return (data.data ?? null) as PublicCourse | null;
    },
    enabled: !!id,
    refetchOnWindowFocus: true,
  });
  const userRole = getCurrentUserRole();
  const shouldUseAulaPurchase = isAuthenticated() && userRole === 'student';
  const isStaffRole = isAuthenticated() && (userRole === 'admin' || userRole === 'superadmin' || userRole === 'prof');

  // Check if student already has an active purchase for this course
  const { data: studentData } = useQuery<{ purchases?: { status: string; course?: { id: number } | null }[] }>({
    queryKey: ['student-purchase-check', course?.id],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/v1/aula/student-data');
      return data;
    },
    enabled: shouldUseAulaPurchase && !!course,
  });

  if (isLoading) {
    return (
      <div className="pt-40 text-center px-6 h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-secondary" />
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="pt-40 text-center px-6 h-screen">
        <h1 className="text-4xl font-bold text-primary mb-4">Curso no encontrado</h1>
        <Link to="/cursos" className="text-secondary font-bold flex items-center justify-center">
          <ArrowLeft className="mr-2 w-4 h-4" /> Volver al catálogo
        </Link>
      </div>
    );
  }

  const syllabus = course.syllabus ?? [];
  const requirements = course.requirements ?? [];
  const teachers = course.teachers ?? [];
  const mainTeacher = course.main_teacher;
  const faqs = DEFAULT_FAQS;

  const existingPurchase = (studentData?.purchases ?? []).find(
    p => p.course?.id === course?.id && ['pending_validation', 'pending_payment', 'validated', 'paid'].includes(p.status)
  );
  const isApproved = existingPurchase && ['validated', 'paid'].includes(existingPurchase.status);
  const isPending = existingPurchase && ['pending_validation', 'pending_payment'].includes(existingPurchase.status);

  return (
    <div className="pt-24 pb-32">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="bg-primary pt-16 pb-32 px-6 lg:px-8 relative overflow-hidden">
        {course.image_url && (
          <div className="absolute inset-0 z-0 opacity-10">
            <img src={resolveImg(course.image_url)!} alt="" className="w-full h-full object-cover blur-xl scale-110" />
          </div>
        )}

        <div className="max-w-7xl mx-auto relative z-10">
          <Link to="/cursos" className="text-secondary font-bold flex items-center mb-8 hover:translate-x-[-4px] transition-transform">
            <ArrowLeft className="mr-2 w-4 h-4" /> Catálogo de Cursos
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="inline-block bg-secondary/20 text-secondary text-[10px] uppercase tracking-[0.2em] font-bold px-4 py-2 rounded-sm">
                  {course.type ?? 'Curso'} {course.code && `· ${course.code}`}
                </span>
                {course.specialty && (
                  <span className="inline-block bg-white/10 text-white/70 text-[10px] uppercase tracking-[0.2em] font-bold px-4 py-2 rounded-sm">
                    {course.specialty}
                  </span>
                )}
              </div>
              <h1 className="font-sans text-4xl md:text-6xl text-white font-extrabold mb-6 leading-tight">
                {course.title}
              </h1>
              <div className="flex flex-wrap gap-6 text-slate-300 text-sm font-medium mb-10">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-secondary fill-secondary mr-2" />
                  Programa Oficial
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-secondary mr-2" />
                  {course.duration_weeks} semanas
                </div>
                {course.hours && (
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 text-secondary mr-2" />
                    {course.hours} horas
                  </div>
                )}
                <div className="flex items-center">
                  <GraduationCap className="w-4 h-4 text-secondary mr-2" />
                  {course.level ?? 'general'}
                </div>
              </div>

              {/* Teacher card in hero */}
              {(mainTeacher || course.teacher_name) && (
                <div className="flex items-center bg-white/5 backdrop-blur-md p-4 rounded-lg border border-white/10 w-fit">
                  <div className="w-12 h-12 rounded-full overflow-hidden mr-4 border-2 border-secondary bg-slate-200 flex items-center justify-center flex-shrink-0">
                    {mainTeacher?.photo_url ? (
                      <img src={resolveImg(mainTeacher.photo_url)!} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-primary font-bold text-sm">
                        {(mainTeacher?.name ?? course.teacher_name ?? '').split(' ').slice(0, 2).map(p => p[0]).join('')}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Docente Principal</p>
                    <p className="text-white font-bold">
                      {mainTeacher?.title ? `${mainTeacher.title} ` : ''}{mainTeacher?.name ?? course.teacher_name}
                    </p>
                    {mainTeacher?.specialty && <p className="text-xs text-secondary">{mainTeacher.specialty}</p>}
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-video rounded-xl overflow-hidden shadow-2xl border-4 border-white/10 bg-slate-200">
              {course.image_url ? (
                <img src={resolveImg(course.image_url)!} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <ImageOff className="w-20 h-20" />
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Content ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 -mt-20 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            {/* Sobre este curso + ¿Qué aprenderás? */}
            <div className="bg-white p-10 rounded-xl shadow-soft border border-slate-100">
              <h2 className="font-sans text-3xl font-bold text-primary mb-6">Sobre este curso</h2>
              <p className="font-serif text-lg text-slate-600 leading-relaxed mb-8">
                {course.description ?? 'Programa diseñado por expertos para potenciar tu carrera profesional.'}
              </p>

              {syllabus.length > 0 && (
                <>
                  <h3 className="font-sans text-xl font-bold text-primary mb-6">¿Qué aprenderás?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {syllabus.map((item, idx) => (
                      <div key={idx} className="flex items-start bg-slate-50 p-4 rounded-lg group hover:bg-secondary/10 transition-colors">
                        <CheckCircle2 className="w-5 h-5 text-secondary mr-3 mt-1 flex-shrink-0" />
                        <span className="font-serif text-slate-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {requirements.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-sans text-xl font-bold text-primary mb-4">Requisitos</h3>
                  <ul className="space-y-2">
                    {requirements.map((r, idx) => (
                      <li key={idx} className="flex items-start text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 mr-3 flex-shrink-0" />
                        <span className="font-serif">{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Estructura del programa */}
            {syllabus.length > 0 && (
              <div className="bg-white p-10 rounded-xl shadow-soft border border-slate-100">
                <h2 className="font-sans text-2xl font-bold text-primary mb-8">Estructura del programa</h2>
                <div className="space-y-3">
                  {syllabus.map((item, idx) => {
                    const isFirst = idx === 0;
                    return (
                      <motion.div key={idx}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                          isFirst ? 'border-secondary bg-secondary/5 shadow-sm' : 'border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            isFirst ? 'bg-secondary text-white' : 'border-2 border-slate-200 text-slate-400'
                          }`}>
                            {idx + 1}
                          </div>
                          <span className={`font-medium ${isFirst ? 'text-primary font-bold' : 'text-slate-600'}`}>{item}</span>
                        </div>
                        <Lock className={`w-4 h-4 flex-shrink-0 ${isFirst ? 'text-secondary' : 'text-slate-300'}`} />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Docentes del curso */}
            {teachers.length > 0 && (
              <div className="bg-white p-10 rounded-xl shadow-soft border border-slate-100">
                <h2 className="font-sans text-2xl font-bold text-primary mb-8">Cuerpo Docente</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {teachers.map(t => (
                    <div key={t.id} className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 hover:bg-secondary/5 transition-colors">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 border-2 border-secondary/30 flex items-center justify-center flex-shrink-0">
                        {t.photo_url ? (
                          <img src={resolveImg(t.photo_url)!} alt={t.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-primary">{t.title ? `${t.title} ` : ''}{t.name}</p>
                        {t.specialty && <p className="text-[10px] uppercase tracking-widest text-secondary font-bold mt-0.5">{t.specialty}</p>}
                        {t.credentials && <p className="text-xs text-slate-400 mt-1">{t.credentials}</p>}
                        {t.bio && <p className="text-sm text-slate-500 mt-2 line-clamp-2 font-serif">{t.bio}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQs */}
            <div className="bg-white p-10 rounded-xl shadow-soft border border-slate-100">
              <h2 className="font-sans text-2xl font-bold text-primary mb-8">Preguntas Frecuentes</h2>
              <div className="divide-y divide-slate-100">
                {faqs.map((faq, idx) => <FAQItem key={idx} question={faq.question} answer={faq.answer} />)}
              </div>
            </div>
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────── */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-xl shadow-soft border border-slate-100">
              <div className="text-center mb-8">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Inversión del programa</p>
                <h3 className="text-4xl font-extrabold text-primary font-sans">{course.price_label}</h3>
              </div>

              <div className="space-y-4 mb-8">
                {course.start_date && (
                  <div className="flex items-center text-sm font-medium text-slate-600 bg-slate-50 p-3 rounded">
                    <Calendar className="w-4 h-4 text-secondary mr-3" />
                    Inicio: {fmtDate(course.start_date)}
                  </div>
                )}
                <div className="flex items-center text-sm font-medium text-slate-600 bg-slate-50 p-3 rounded">
                  <Clock className="w-4 h-4 text-secondary mr-3" />
                  Duración: {course.duration_weeks} semanas{course.hours ? ` (${course.hours}h)` : ''}
                </div>
                <div className="flex items-center text-sm font-medium text-slate-600 bg-slate-50 p-3 rounded">
                  <Award className="w-4 h-4 text-secondary mr-3" />
                  Certificación Oficial EduWanka
                </div>
                <div className="flex items-center text-sm font-medium text-slate-600 bg-slate-50 p-3 rounded">
                  <User className="w-4 h-4 text-secondary mr-3" />
                  Acceso de Por Vida
                </div>
              </div>

              {isStaffRole ? (
                <div className="w-full bg-amber-50 border-2 border-amber-200 rounded-xl p-5 text-center space-y-2">
                  <p className="text-amber-800 font-bold text-sm">
                    🔒 Estás logueado como {userRole === 'admin' ? 'Administrador' : userRole === 'superadmin' ? 'Super Admin' : 'Profesor'}
                  </p>
                  <p className="text-amber-600 text-xs">
                    No puedes inscribirte a cursos desde esta cuenta. Solo puedes ver el formulario como referencia.
                  </p>
                  <button
                    onClick={() => nav(`/checkout/${course.slug ?? course.id}`)}
                    className="mt-2 w-full bg-amber-100 text-amber-800 font-sans font-bold py-3 rounded-lg hover:bg-amber-200 transition-all text-sm"
                  >
                    Ver formulario de inscripción (solo lectura)
                  </button>
                </div>
              ) : existingPurchase ? (
                <div className="space-y-3">
                  {isApproved ? (
                    <>
                      <div className="w-full bg-green-50 border-2 border-green-200 rounded-xl p-5 text-center space-y-2">
                        <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto" />
                        <p className="text-green-800 font-bold text-sm">Ya estás inscrito en este curso</p>
                        <p className="text-green-600 text-xs">Tu pago fue aprobado. Accede al contenido desde tu aula virtual.</p>
                      </div>
                      <button
                        onClick={() => nav('/aula/cursos')}
                        className="w-full bg-primary text-white font-sans font-bold py-4 rounded-sm shadow-xl hover:shadow-2xl transition-all uppercase tracking-widest"
                      >
                        Ir al Aula Virtual
                      </button>
                    </>
                  ) : (
                    <div className="w-full bg-amber-50 border-2 border-amber-200 rounded-xl p-5 text-center space-y-2">
                      <p className="text-amber-800 font-bold text-sm">📋 Compra en proceso de validación</p>
                      <p className="text-amber-600 text-xs">
                        Ya registraste tu pago para este curso. El equipo administrativo está revisando tu comprobante.
                      </p>
                      <button
                        onClick={() => nav('/aula/pagos')}
                        className="mt-2 w-full bg-amber-100 text-amber-800 font-sans font-bold py-3 rounded-lg hover:bg-amber-200 transition-all text-sm"
                      >
                        Ver estado de mi pago
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button
                    onClick={() => nav(shouldUseAulaPurchase ? `/aula/comprar/${course.slug ?? course.id}` : `/checkout/${course.slug ?? course.id}`)}
                    className="w-full bg-secondary text-white font-sans font-bold py-5 rounded-sm shadow-xl hover:shadow-2xl transition-all uppercase tracking-widest mb-4"
                  >
                    Inscribirme Ahora
                  </button>
                  <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-tighter">
                    Garantía de satisfacción de 30 días
                  </p>
                </>
              )}
            </div>

            <div className="bg-primary p-8 rounded-xl text-white">
              <h4 className="font-sans font-bold mb-4">¿Necesitas ayuda?</h4>
              <p className="text-slate-400 text-sm mb-6 font-serif">Nuestros asesores académicos están listos para resolver tus dudas.</p>
              <Link to="/contacto" className="text-secondary font-bold text-sm border-b border-secondary pb-1 uppercase tracking-widest">
                Hablar con un asesor
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
