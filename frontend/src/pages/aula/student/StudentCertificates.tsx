import React from 'react';
import { useStudentData } from '@/hooks/useStudentData';
import { 
  Award, Download, ExternalLink, 
  Search, Loader, FileCheck
} from 'lucide-react';

export default function StudentCertificates() {
  const { data, isLoading, error } = useStudentData();

  if (isLoading) return <div className="flex justify-center py-12"><Loader className="animate-spin text-primary w-8 h-8" /></div>;
  if (error) return <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">Error al cargar tus certificados.</div>;

  const certificates = data?.certificates || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Mis Certificados</h1>
        <p className="text-slate-500 font-medium">Visualiza y descarga tus logros académicos oficiales.</p>
      </div>

      {certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert: any) => (
            <div key={cert.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden group hover:border-primary/20 transition-all">
              <div className="aspect-[4/3] bg-slate-100 relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
                <Award className="w-20 h-20 text-primary/20 group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-4 right-4">
                  <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-600 shadow-sm flex items-center gap-1">
                    <FileCheck className="w-3 h-3" /> Verificado
                  </span>
                </div>
              </div>
              <div className="p-6">
                <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2">Certificado Oficial</p>
                <h3 className="font-bold text-slate-800 line-clamp-2 min-h-[3rem] mb-4">
                  {cert.course?.title}
                </h3>
                
                <div className="space-y-3 pt-4 border-t border-slate-50">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                    <span>Emitido:</span>
                    <span className="text-slate-700 font-bold">{new Date(cert.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                    <span>Código:</span>
                    <span className="text-slate-700 font-bold truncate max-w-[120px]">{cert.certificate_code}</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-lg transition-all">
                    <Download className="w-4 h-4" /> PDF
                  </button>
                  <button className="flex items-center justify-center gap-2 bg-slate-50 text-slate-600 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                    <ExternalLink className="w-4 h-4" /> Ver
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-16 text-center max-w-2xl mx-auto mt-12">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Award className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Aún no tienes certificados</h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            Completa tus cursos y aprueba los exámenes finales para obtener tu certificación oficial de EduWanka.
          </p>
          <div className="mt-8">
            <Search className="w-8 h-8 text-slate-100 mx-auto" />
          </div>
        </div>
      )}
    </div>
  );
}
