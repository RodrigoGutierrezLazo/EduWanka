import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="text-center">
        <FileQuestion className="w-24 h-24 text-slate-300 mx-auto mb-6" />
        <h1 className="text-4xl font-extrabold text-primary mb-4 font-sans">404 - Página no encontrada</h1>
        <p className="text-slate-600 mb-8 font-serif max-w-md mx-auto text-lg">
          Lo sentimos, no pudimos encontrar la página que estás buscando.
        </p>
        <Link to="/" className="inline-flex items-center px-8 py-3 bg-primary text-white font-bold rounded-full hover:bg-secondary transition-colors uppercase tracking-widest text-sm">
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
