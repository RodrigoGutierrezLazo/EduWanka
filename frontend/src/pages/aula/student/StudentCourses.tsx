import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Loader, BookOpen, Clock, BarChart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Course {
  id: number;
  code: string;
  title: string;
  image_url: string | null;
  level: string;
  duration_weeks: number;
}

export default function StudentCourses() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['my-courses'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/aula/my-courses');
      return response.data.data as Course[];
    }
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader className="animate-spin text-primary w-8 h-8" /></div>;
  if (error) return <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">Error al cargar tus cursos.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-primary">Mis Cursos</h1>
          <p className="text-slate-500">Aquí encontrarás todos los cursos en los que estás matriculado.</p>
        </div>
      </div>

      {!data || data.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700">Aún no tienes cursos activos</h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">
            Agrega un nuevo curso a tu cuenta o espera a que validemos tu pago.
          </p>
          <Link 
            to="/aula/explorar-cursos" 
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-bold mt-6 hover:bg-primary/90 transition-all"
          >
            Explorar Cursos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((course) => (
            <Link 
              key={course.id} 
              to={`/aula/cursos/${course.id}`}
              className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-soft hover:shadow-xl transition-all duration-300"
            >
              <div className="aspect-video relative overflow-hidden bg-slate-100">
                {course.image_url ? (
                  <img 
                    src={course.image_url.startsWith('http') ? course.image_url : `${import.meta.env.VITE_API_URL || ''}/storage/${course.image_url}`} 
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-slate-300" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 backdrop-blur-md text-primary text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                    {course.level}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2">{course.code}</p>
                <h3 className="text-lg font-extrabold text-slate-800 leading-tight group-hover:text-primary transition-colors">
                  {course.title}
                </h3>
                
                <div className="mt-6 flex items-center justify-between text-slate-500">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-secondary" />
                    <span className="text-xs font-bold">{course.duration_weeks} semanas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart className="w-4 h-4 text-secondary" />
                    <span className="text-xs font-bold capitalize">{course.level}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between group-hover:border-primary/10 transition-colors">
                  <span className="text-sm font-bold text-primary">Ingresar al aula</span>
                  <div className="bg-slate-50 p-2 rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
