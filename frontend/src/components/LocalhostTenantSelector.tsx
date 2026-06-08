import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Check, X, ShieldAlert, Sparkles } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { clearAllAuthStorages, isAuthenticated } from '@/lib/auth';
import { getActiveTenantSlug } from '../lib/tenant';

interface Tenant {
  id: number;
  name: string;
  slug: string;
  plan: string;
}

export default function LocalhostTenantSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost');

  useEffect(() => {
    if (!isLocalhost) return;

    // Obtener el slug activo usando el helper común
    const slug = getActiveTenantSlug();
    setActiveSlug(slug);

    // Obtener los tenants de la API
    apiClient.get('/api/v1/tenants/public')
      .then(({ data }) => {
        const list = data.data ?? data ?? [];
        setTenants(list);
      })
      .catch(() => {
        // Fallback en caso de que la API falle o no tenga datos cargados
        setTenants([
          { id: 1, name: 'Academia Demo (Rojo)', slug: 'demo', plan: 'pro' },
          { id: 2, name: 'Instituto Azul', slug: 'azul', plan: 'professional' },
          { id: 3, name: 'Centro Verde', slug: 'verde', plan: 'starter' },
        ]);
      });
  }, [isLocalhost, hostname]);

  if (!isLocalhost) return null;

  const handleSelect = (slug: string | null) => {
    // Limpiar el perfil cacheado del aula previa para evitar mezclar usuarios
    // entre inquilinos. La cookie de sesión httpOnly queda aislada por host
    // (ej. azul.localhost vs localhost) y no requiere limpieza manual aquí.
    if (isAuthenticated()) {
      clearAllAuthStorages();
    }

    const port = window.location.port ? `:${window.location.port}` : '';

    if (slug) {
      localStorage.setItem('active_tenant_slug', slug);
      window.location.href = `http://${slug}.localhost${port}/`;
    } else {
      localStorage.removeItem('active_tenant_slug');
      window.location.href = `http://localhost${port}/`;
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-[9999] font-sans">
      {/* Botón Flotante principal */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-full shadow-2xl border border-slate-700/50 transition-colors"
      >
        <Layers className={`w-5 h-5 ${activeSlug ? 'text-accent' : 'text-slate-400'}`} />
        <span className="text-xs font-bold tracking-wider uppercase">
          {activeSlug ? `Aula: ${activeSlug}` : 'SaaS Principal'}
        </span>
        {activeSlug && (
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        )}
      </motion.button>

      {/* Menú Desplegable */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay para cerrar al hacer clic fuera */}
            <div 
              className="fixed inset-0 z-[-1]" 
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-16 left-0 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5 text-accent">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Entorno Local</span>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[10px] text-slate-400 mb-3">
                Selecciona un aula simulada. Al cambiar, se limpiará la sesión local para evitar conflictos de roles.
              </p>

              <div className="space-y-1.5">
                {/* Opción SaaS Principal */}
                <button
                  onClick={() => handleSelect(null)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-medium transition-all ${
                    !activeSlug
                      ? 'bg-primary/20 text-primary border border-primary/30 font-bold'
                      : 'text-slate-300 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <span>EduWanka SaaS (Principal)</span>
                  {!activeSlug && <Check className="w-4 h-4 text-primary" />}
                </button>

                {/* Lista de Aulas del SaaS */}
                {tenants.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelect(t.slug)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-medium transition-all ${
                      activeSlug === t.slug
                        ? 'bg-accent/20 text-accent border border-accent/30 font-bold'
                        : 'text-slate-300 hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{t.name}</div>
                      <div className="text-[9px] text-slate-500">{t.slug}.localhost</div>
                    </div>
                    {activeSlug === t.slug && <Check className="w-4 h-4 text-accent" />}
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex gap-2 items-start text-[9px] text-slate-500">
                <ShieldAlert className="w-4 h-4 shrink-0 text-slate-400" />
                <span>Navega a subdominios locales *.localhost para simular de forma exacta y teñir la cabecera, footer y botones.</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
