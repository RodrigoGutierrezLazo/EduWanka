import React from 'react';
import { Video, Loader, ExternalLink, Calendar } from 'lucide-react';

export default function StudentLiveClasses() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Clases en Vivo</h1>
        <p className="text-slate-500 font-medium">Accede a tus sesiones programadas vía Zoom o Meet.</p>
      </div>

      <div className="bg-white rounded-[2rem] shadow-soft border border-slate-100 p-12 text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Video className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">No hay sesiones activas</h2>
        <p className="text-slate-500 font-medium leading-relaxed max-w-md mx-auto">
          Las clases en vivo aparecerán aquí 15 minutos antes de su inicio programado.
        </p>
      </div>
    </div>
  );
}
