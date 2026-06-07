import React from 'react';
import { FolderOpen, Loader, FileText, Download } from 'lucide-react';

export default function StudentMaterials() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Materiales de Estudio</h1>
        <p className="text-slate-500 font-medium">Todos los recursos, PDFs y lecturas de tus cursos.</p>
      </div>

      <div className="bg-white rounded-[2rem] shadow-soft border border-slate-100 p-12 text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <FolderOpen className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Central de Materiales</h2>
        <p className="text-slate-500 font-medium leading-relaxed max-w-md mx-auto">
          Aquí podrás encontrar todos los archivos de tus cursos matriculados de forma centralizada.
        </p>
        <p className="text-xs text-slate-400 mt-4 italic font-bold uppercase tracking-widest">Módulo en construcción para el Sprint 9</p>
      </div>
    </div>
  );
}
