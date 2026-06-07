import React, { useState } from 'react';
import { User, Shield, Key, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { apiClient } from '@/lib/apiClient';

export default function StudentProfile() {
  const user = getCurrentUser();

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwLoading(true);
    setPwError('');
    setPwSuccess('');
    try {
      await apiClient.put('/api/v1/aula/change-password', pwForm);
      setPwSuccess('¡Contraseña actualizada exitosamente!');
      setPwForm({ current_password: '', new_password: '', new_password_confirmation: '' });
      setTimeout(() => { setPwSuccess(''); setShowPasswordForm(false); }, 3000);
    } catch (err: any) {
      const msg = err?.response?.data?.message
        || err?.response?.data?.errors?.current_password?.[0]
        || err?.response?.data?.errors?.new_password?.[0]
        || 'Error al cambiar la contraseña.';
      setPwError(msg);
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Mi Perfil</h1>
        <p className="text-slate-500 font-medium">Gestiona tu información personal y configuración de cuenta.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-soft border border-slate-100 text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-4 text-primary text-4xl font-black">
              {user?.name?.[0]}
            </div>
            <h3 className="font-bold text-slate-800">{user?.name} {user?.last_name}</h3>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">Estudiante</p>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-soft border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Datos Personales
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nombres</label>
                  <input type="text" defaultValue={user?.name} disabled className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium outline-none opacity-60 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Apellidos</label>
                  <input type="text" defaultValue={user?.last_name || '—'} disabled className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium outline-none opacity-60 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">DNI</label>
                  <input type="text" defaultValue={user?.dni || '—'} disabled className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium outline-none opacity-60 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Teléfono</label>
                  <input type="text" defaultValue={user?.phone || '—'} disabled className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium outline-none opacity-60 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Correo Electrónico</label>
                  <input type="email" defaultValue={user?.email} disabled className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium outline-none opacity-60 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Ciudad</label>
                  <input type="text" defaultValue={user?.city || '—'} disabled className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium outline-none opacity-60 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Condición Académica</label>
                  <input type="text" defaultValue={user?.academic_condition || '—'} disabled className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium outline-none opacity-60 cursor-not-allowed" />
                </div>
              </div>
              
              <p className="text-xs text-slate-400 italic mt-4">
                * Para modificar estos datos, por favor comunícate con soporte de EduWanka.
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-soft border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-secondary" /> Seguridad
            </h3>

            {pwSuccess && (
              <div className="mb-4 bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" /> {pwSuccess}
              </div>
            )}
            {pwError && (
              <div className="mb-4 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium animate-in fade-in">
                <AlertCircle className="w-4 h-4" /> {pwError}
              </div>
            )}

            {!showPasswordForm ? (
              <>
                <p className="text-sm text-slate-500 mb-6">Cambia tu contraseña periódicamente para mantener tu cuenta segura.</p>
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="text-xs font-black uppercase tracking-widest text-secondary bg-secondary/10 px-6 py-3 rounded-xl hover:bg-secondary hover:text-white transition-all flex items-center gap-2"
                >
                  <Key className="w-4 h-4" /> Cambiar Contraseña
                </button>
              </>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Contraseña Actual</label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={pwForm.current_password}
                      onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pr-12 text-sm font-medium outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all"
                      placeholder="Tu contraseña actual"
                    />
                    <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nueva Contraseña</label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={pwForm.new_password}
                      onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })}
                      required
                      minLength={8}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pr-12 text-sm font-medium outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all"
                      placeholder="Mínimo 8 caracteres"
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    value={pwForm.new_password_confirmation}
                    onChange={e => setPwForm({ ...pwForm, new_password_confirmation: e.target.value })}
                    required
                    minLength={8}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all"
                    placeholder="Repite la nueva contraseña"
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={pwLoading}
                    className="px-8 py-3 bg-secondary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:brightness-95 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md"
                  >
                    {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowPasswordForm(false); setPwError(''); setPwSuccess(''); }}
                    className="px-6 py-3 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
