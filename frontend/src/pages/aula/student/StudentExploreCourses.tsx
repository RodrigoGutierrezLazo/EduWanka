import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, BookOpen, CheckCircle2, Clock, CreditCard, ImageOff,
  Loader, Search, ShieldCheck,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

interface PublicCourse {
  id: number;
  slug?: string | null;
  title: string;
  code?: string | null;
  description?: string | null;
  price: number;
  price_label: string;
  duration_weeks: number;
  level?: string | null;
  category: string;
  image_url?: string | null;
  teacher_name?: string | null;
}

interface Purchase {
  id: number;
  status: string;
  course?: { id: number; title?: string } | null;
}

const activePurchaseStatuses = new Set(['pending_validation', 'pending_payment', 'validated', 'paid']);
const approvedStatuses = new Set(['validated', 'paid']);

const resolveImg = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('/storage')) return url;
  return `/storage/${url.replace(/^\/+/, '')}`;
};

export default function StudentExploreCourses() {
  const [search, setSearch] = useState('');

  const { data: courses = [], isLoading: loadingCourses, isError } = useQuery<PublicCourse[]>({
    queryKey: ['aula-public-courses'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/v1/courses');
      return data.data ?? [];
    },
    refetchOnWindowFocus: true,
  });

  const { data: studentData } = useQuery<{ purchases?: Purchase[] }>({
    queryKey: ['student-data-for-catalog'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/v1/aula/student-data');
      return data;
    },
  });

  const purchasesByCourseId = useMemo(() => {
    const map = new Map<number, Purchase>();
    (studentData?.purchases ?? []).forEach((purchase) => {
      const courseId = purchase.course?.id;
      if (courseId && activePurchaseStatuses.has(purchase.status)) {
        map.set(courseId, purchase);
      }
    });
    return map;
  }, [studentData?.purchases]);

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(course => (
      course.title.toLowerCase().includes(q)
      || (course.code ?? '').toLowerCase().includes(q)
      || (course.teacher_name ?? '').toLowerCase().includes(q)
    ));
  }, [courses, search]);

  if (loadingCourses) {
    return (
      <div className="flex justify-center py-16">
        <Loader className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-6">
        No pudimos cargar el catalogo de cursos. Intenta nuevamente en unos minutos.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-secondary mb-2">
            Aula virtual
          </p>
          <h1 className="text-3xl font-extrabold text-primary">Explorar Cursos</h1>
          <p className="text-slate-500 max-w-2xl mt-1">
            Agrega nuevos cursos a tu cuenta sin salir del aula ni volver a registrarte.
          </p>
        </div>
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Buscar por curso, codigo o docente"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-secondary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoPill icon={<ShieldCheck className="w-5 h-5" />} title="Cuenta conservada" text="La compra queda vinculada a tu usuario actual." />
        <InfoPill icon={<CreditCard className="w-5 h-5" />} title="Pago por validar" text="Sube tu comprobante del nuevo curso." />
        <InfoPill icon={<CheckCircle2 className="w-5 h-5" />} title="Sin reinscripcion" text="Solo confirmas certificacion, pago e interes futuro." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredCourses.map((course) => {
          const purchase = purchasesByCourseId.get(course.id);
          const hasApprovedAccess = purchase && approvedStatuses.has(purchase.status);
          const imageUrl = resolveImg(course.image_url);

          return (
            <div key={course.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
              <div className="h-44 bg-slate-100 relative overflow-hidden">
                {imageUrl ? (
                  <img src={imageUrl} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ImageOff className="w-12 h-12" />
                  </div>
                )}
                <span className="absolute top-3 left-3 bg-primary/90 text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded">
                  {course.category}
                </span>
                {purchase && (
                  <span className="absolute top-3 right-3 bg-white text-primary text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded shadow">
                    {hasApprovedAccess ? 'Activo' : 'En validacion'}
                  </span>
                )}
              </div>

              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-[10px] font-black text-secondary uppercase tracking-[0.18em]">
                    {course.code ?? 'Curso'}
                  </p>
                  <p className="text-lg font-black text-primary">{course.price_label}</p>
                </div>
                <h2 className="text-lg font-extrabold text-slate-900 leading-tight line-clamp-2">
                  {course.title}
                </h2>
                <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                  {course.description ?? 'Programa profesional disponible para agregar a tu cuenta.'}
                </p>

                <div className="mt-5 flex items-center justify-between text-xs font-bold text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-secondary" />
                    {course.duration_weeks} semanas
                  </span>
                  <span className="inline-flex items-center gap-1.5 capitalize">
                    <BookOpen className="w-4 h-4 text-secondary" />
                    {course.level ?? 'general'}
                  </span>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-100">
                  {hasApprovedAccess ? (
                    <Link
                      to={`/aula/cursos/${course.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary/90"
                    >
                      Ir al aula <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : purchase ? (
                    <Link
                      to="/aula/pagos"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 hover:bg-amber-100"
                    >
                      Ver estado del pago
                    </Link>
                  ) : (
                    <Link
                      to={`/aula/comprar/${course.slug ?? course.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-3 text-sm font-bold text-primary hover:brightness-95"
                    >
                      Comprar para mi cuenta <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCourses.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500">
          No encontramos cursos con ese criterio.
        </div>
      )}
    </div>
  );
}

function InfoPill({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-bold text-primary text-sm">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{text}</p>
      </div>
    </div>
  );
}
