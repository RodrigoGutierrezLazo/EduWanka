import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="text-center">
        <ShieldAlert className="w-24 h-24 text-red-500 mx-auto mb-6" />
        <h1 className="text-4xl font-extrabold text-primary mb-4 font-sans">Acceso Restringido</h1>
        <p className="text-slate-600 mb-8 font-serif max-w-md mx-auto text-lg">
          No tienes los permisos necesarios para acceder a esta página. Contacta al administrador si crees que esto es un error.
        </p>
        <Link to="/aula" className="inline-flex items-center px-8 py-3 bg-primary text-white font-bold rounded-full hover:bg-secondary transition-colors uppercase tracking-widest text-sm">
          Volver a mi panel
        </Link>
      </div>
    </div>
  );
}
