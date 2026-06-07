import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/apiClient';
import { getCurrentUser } from '../../../lib/auth';
import { 
  User, Mail, ShieldCheck, Key, Camera, Loader2, 
  GraduationCap, BookOpen, Award, Phone, Save, AlertCircle, CheckCircle2, Eye, EyeOff 
} from 'lucide-react';

interface TeacherProfile {
  id: number;
  name: string;
  title?: string | null;
  specialty?: string | null;
  bio?: string | null;
  credentials?: string | null;
  photo_url?: string | null;
  email?: string | null;
  phone?: string | null;
}

export default function ProfessorProfile() {
  const user = getCurrentUser();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    title: '',
    specialty: '',
    bio: '',
    credentials: '',
    phone: ''
  });

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
    setPwLoading(true); setPwError(''); setPwSuccess('');
    try {
      await apiClient.put('/api/v1/aula/change-password', pwForm);
      setPwSuccess('¡Contraseña actualizada exitosamente!');
      setPwForm({ current_password: '', new_password: '', new_password_confirmation: '' });
      setTimeout(() => { setPwSuccess(''); setShowPasswordForm(false); }, 3000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.errors?.current_password?.[0] || err?.response?.data?.errors?.new_password?.[0] || 'Error al cambiar la contraseña.';
      setPwError(msg);
    } finally {
      setPwLoading(false);
    }
  };

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get('/api/v1/prof/profile');
      const p = data.data;
      setProfile(p);
      setForm({
        title: p.title || '',
        specialty: p.specialty || '',
        bio: p.bio || '',
        credentials: p.credentials || '',
        phone: p.phone || ''
      });
    } catch (e: any) {
      if (e?.response?.status === 404) {
        setError('Tu cuenta aún no ha sido vinculada a un perfil público de docente. Contacta al administrador.');
      } else {
        setError('Error al cargar perfil público.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await apiClient.put('/api/v1/prof/profile', form);
      setSuccess('Perfil público actualizado correctamente.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error al actualizar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const { data } = await apiClient.post('/api/v1/prof/profile/photo', fd);
      setProfile(prev => prev ? { ...prev, photo_url: data.photo_url } : null);
      setSuccess('Foto de perfil actualizada.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error al subir foto.');
    } finally {
      setUploading(false);
    }
  };

  const resolveImg = (url?: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `/storage/${url.replace(/^\/+/, '')}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-12 h-12 text-secondary animate-spin" />
        <p className="text-slate-400 font-medium">Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Mi Perfil Docente</h1>
          <p className="text-slate-500 mt-2">Gestiona tu biografía y datos que aparecerán en la web pública.</p>
        </div>
        {profile && (
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-secondary text-white px-8 py-3 rounded-2xl font-bold hover:brightness-95 transition-all shadow-lg disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar Cambios
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-100 text-green-600 px-6 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium text-sm">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col - Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft p-8 text-center sticky top-8">
            <div className="relative w-40 h-40 mx-auto mb-6 group">
              <div className="w-full h-full rounded-[2.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 font-black text-4xl overflow-hidden relative">
                {resolveImg(profile?.photo_url) ? (
                  <img src={resolveImg(profile?.photo_url)!} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                ) : (
                  <User className="w-16 h-16" />
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-secondary animate-spin" />
                  </div>
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 p-3 bg-white rounded-2xl shadow-xl border border-slate-100 text-slate-400 hover:text-secondary transition-all cursor-pointer hover:scale-110 active:scale-95">
                <Camera className="w-6 h-6" />
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload(file);
                  }}
                />
              </label>
            </div>
            
            <h2 className="text-xl font-bold text-slate-900 mb-1">{profile?.title ? `${profile.title} ` : ''}{user?.name}</h2>
            <p className="text-slate-400 text-sm font-medium mb-6">{user?.email}</p>
            
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-full text-[10px] font-black uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4" />
                Acceso Verificado
              </div>
              {!profile && (
                <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Sin Perfil Público
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col - Form */}
        <div className="lg:col-span-2 space-y-8">
          {profile ? (
            <>
              {/* Información de Perfil Público */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft p-10">
                <h3 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-secondary" />
                  Información para la Web Pública
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Grado / Título</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Mg., Ph.D., Lic."
                      value={form.title}
                      onChange={e => setForm({...form, title: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-secondary/30 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Especialidad Principal</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Derecho Penal, Auditoría..."
                      value={form.specialty}
                      onChange={e => setForm({...form, specialty: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-secondary/30 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Credenciales Académicas</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Universidad Nacional Mayor de San Marcos"
                      value={form.credentials}
                      onChange={e => setForm({...form, credentials: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-secondary/30 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Biografía Profesional</label>
                    <textarea 
                      rows={5}
                      placeholder="Cuéntanos sobre tu trayectoria..."
                      value={form.bio}
                      onChange={e => setForm({...form, bio: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-700 focus:bg-white focus:border-secondary/30 outline-none transition-all resize-none"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Teléfono de Contacto</label>
                    <div className="relative">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={form.phone}
                        onChange={e => setForm({...form, phone: e.target.value})}
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-secondary/30 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft p-10 flex flex-col items-center text-center">
              <AlertCircle className="w-16 h-16 text-slate-200 mb-6" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Perfil No Vinculado</h3>
              <p className="text-slate-500 max-w-sm mb-8">
                Para gestionar tu perfil público, el administrador debe vincular tu cuenta de usuario al registro de docentes.
              </p>
              <button 
                onClick={loadProfile}
                className="text-secondary font-bold text-sm hover:underline"
              >
                Reintentar cargar
              </button>
            </div>
          )}

          {/* Información de Usuario (Read-only) */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft p-10">
            <h3 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-3">
              <User className="w-5 h-5 text-secondary" />
              Cuenta de Acceso
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre de Usuario</label>
                <div className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-500 flex items-center gap-3">
                  <User className="w-4 h-4" />
                  {user?.name}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Principal</label>
                <div className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-500 flex items-center gap-3">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-slate-100">
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
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400 font-medium italic max-w-md">
                    * El nombre y email de acceso son gestionados por administración para mantener la seguridad institucional.
                  </p>
                  <button onClick={() => setShowPasswordForm(true)} className="flex items-center gap-2 text-primary font-bold text-xs hover:text-secondary transition-colors">
                    <Key className="w-4 h-4" /> Cambiar Contraseña
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Contraseña Actual</label>
                    <div className="relative">
                      <input type={showCurrent ? 'text' : 'password'} value={pwForm.current_password} onChange={e => setPwForm({...pwForm, current_password: e.target.value})} required className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pr-12 text-sm font-medium outline-none focus:border-secondary/30 transition-all" placeholder="Tu contraseña actual" />
                      <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nueva Contraseña</label>
                    <div className="relative">
                      <input type={showNew ? 'text' : 'password'} value={pwForm.new_password} onChange={e => setPwForm({...pwForm, new_password: e.target.value})} required minLength={8} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pr-12 text-sm font-medium outline-none focus:border-secondary/30 transition-all" placeholder="Mínimo 8 caracteres" />
                      <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Confirmar Nueva Contraseña</label>
                    <input type="password" value={pwForm.new_password_confirmation} onChange={e => setPwForm({...pwForm, new_password_confirmation: e.target.value})} required minLength={8} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium outline-none focus:border-secondary/30 transition-all" placeholder="Repite la nueva contraseña" />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button type="submit" disabled={pwLoading} className="px-8 py-3 bg-secondary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:brightness-95 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md">
                      {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />} Guardar
                    </button>
                    <button type="button" onClick={() => { setShowPasswordForm(false); setPwError(''); setPwSuccess(''); }} className="px-6 py-3 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-slate-700 transition-colors">Cancelar</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
