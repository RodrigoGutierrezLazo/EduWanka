import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { getCurrentUser } from '@/lib/auth';
import { Users, Plus, Search, Edit2, KeyRound, Trash2, X, Loader, ShieldAlert, CheckCircle, Mail, Phone, Calendar } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  dni?: string;
  phone?: string;
  last_name?: string;
  city?: string;
  academic_condition?: string;
  role: string;
  created_at: string;
  photo_url?: string | null;
}

const ROLES = ['student', 'prof', 'admin', 'superadmin'];
const ROLE_RANK: Record<string, number> = { student: 0, prof: 1, admin: 2, superadmin: 3 };
const ROLE_LABELS: Record<string, string> = { student: 'ESTUDIANTE', prof: 'DOCENTE', admin: 'ADMIN', superadmin: 'SUPERADMIN' };
const ROLE_COLORS: Record<string, string> = {
  student:    'bg-blue-50 text-blue-600',
  prof:       'bg-purple-50 text-purple-600',
  admin:      'bg-orange-50 text-orange-600',
  superadmin: 'bg-red-50 text-red-600',
};

export default function AdminUsuarios() {
  const [activeTab, setActiveTab] = useState<'usuarios' | 'solicitudes'>('usuarios');
  const [users, setUsers]         = useState<User[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<User | null>(null);
  const [form, setForm]           = useState({ name: '', last_name: '', email: '', password: '', role: 'student', dni: '', phone: '', city: '', academic_condition: '' });
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [resetMsg, setResetMsg]   = useState('');
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id ?? null;
  const currentUserRole = currentUser?.role ?? 'admin';
  const [allowedRoles, setAllowedRoles] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search)     params.search = search;
      if (roleFilter) params.role   = roleFilter;
      const { data } = await apiClient.get('/api/v1/admin/users', { params });
      setUsers(data.data ?? data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    apiClient.get('/api/v1/admin/users/available-roles').then(r => setAllowedRoles(r.data.roles ?? [])).catch(() => {});
  }, []);

  // Recargar cuando cambia el filtro de rol
  useEffect(() => {
    const t = setTimeout(() => load(), 200);
    return () => clearTimeout(t);
  }, [roleFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', last_name: '', email: '', password: '', role: 'student', dni: '', phone: '', city: '', academic_condition: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({ 
      name: u.name, 
      last_name: u.last_name ?? '',
      email: u.email, 
      password: '', 
      role: u.role, 
      dni: u.dni ?? '', 
      phone: u.phone ?? '',
      city: u.city ?? '',
      academic_condition: u.academic_condition ?? ''
    });
    setError('');
    setShowModal(true);
  };

  const validateForm = (): string | null => {
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.\-,]+$/;
    const dniRegex = /^[a-zA-Z0-9]+$/;
    const phoneRegex = /^[0-9+\s\-()]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.name.trim()) return 'El nombre es obligatorio.';
    if (!nameRegex.test(form.name)) return 'El nombre solo puede contener letras, espacios, puntos y guiones.';
    if (form.last_name && !nameRegex.test(form.last_name)) return 'Los apellidos solo pueden contener letras, espacios, puntos y guiones.';
    if (!form.email.trim()) return 'El correo electrónico es obligatorio.';
    if (!emailRegex.test(form.email)) return 'Ingrese un correo electrónico válido.';
    if (!editing && !form.password) return 'La contraseña es obligatoria.';
    if (form.password && form.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (form.dni && !dniRegex.test(form.dni)) return 'El DNI solo puede contener letras y números.';
    if (form.phone && !phoneRegex.test(form.phone)) return 'El teléfono solo puede contener números, +, espacios, guiones y paréntesis.';
    return null;
  };

  const save = async () => {
    setSaving(true); setError('');
    const validationError = validateForm();
    if (validationError) { setError(validationError); setSaving(false); return; }
    try {
      if (editing) {
        await apiClient.put(`/api/v1/admin/users/${editing.id}`, form);
      } else {
        await apiClient.post('/api/v1/admin/users', form);
      }
      setShowModal(false);
      load();
    } catch (e: any) {
      const errors = e?.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        const list = Object.entries(errors).map(([, msgs]) => (msgs as string[])[0]).join(' ');
        setError(list);
      } else {
        setError(e?.response?.data?.message ?? 'Error al guardar');
      }
    } finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm('¿Borrar este usuario?')) return;
    await apiClient.delete(`/api/v1/admin/users/${id}`);
    load();
  };

  const resetPassword = async (id: number) => {
    const { data } = await apiClient.post(`/api/v1/admin/users/${id}/reset-password`);
    setResetMsg(`Nueva contraseña: ${data.password}`);
    setTimeout(() => setResetMsg(''), 8000);
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
        && (!roleFilter || u.role === roleFilter);
  });

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 mb-6">
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors ${activeTab === 'usuarios' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Gestión de Usuarios
        </button>
        <button
          onClick={() => setActiveTab('solicitudes')}
          className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors ${activeTab === 'solicitudes' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Solicitudes de Contraseña
        </button>
      </div>

      {activeTab === 'solicitudes' ? (
        <PasswordRequestsTab />
      ) : (
      <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-primary flex items-center gap-2">
            <Users className="w-5 sm:w-6 h-5 sm:h-6" /> Participantes
          </h1>
          <p className="text-slate-500 text-sm mt-1">{users.length} usuarios registrados</p>
        </div>
        <button onClick={openCreate} className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Nuevo
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load()}
            placeholder="Buscar por nombre o email..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-secondary"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-secondary"
        >
          <option value="">Todos</option>
          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
        <button onClick={load} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
          Buscar
        </button>
      </div>

      {resetMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-lg font-mono">
          {resetMsg}
        </div>
      )}

      {/* Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
          <Loader className="w-8 h-8 animate-spin text-secondary mb-3" />
          <p className="text-slate-400 font-medium text-sm">Cargando usuarios...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-100">
          <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-1">Sin resultados</h3>
          <p className="text-slate-400 text-sm">No se encontraron usuarios con esos filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(u => (
            <div key={u.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <div className="p-5">
                {/* Avatar + Name + Role */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary font-black text-lg flex-shrink-0">
                    {(u.name?.[0] || 'U').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{u.name} {u.last_name || ''}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${ROLE_COLORS[u.role] ?? 'bg-slate-100 text-slate-600'}`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </div>
                </div>

                {/* Info rows */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    <span className="truncate">{u.email}</span>
                  </div>
                  {u.dni && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="w-3.5 h-3.5 text-[9px] font-black text-slate-300 flex-shrink-0 text-center">DNI</span>
                      <span>{u.dni}</span>
                    </div>
                  )}
                  {u.phone && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Phone className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                      <span>{u.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    <span>{new Date(u.created_at).toLocaleDateString('es-PE')}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-1.5 pt-3 border-t border-slate-50">
                  {/* Solo mostrar Editar/Clave si es uno mismo o de rango inferior */}
                  {(u.id === currentUserId || (ROLE_RANK[u.role] ?? 0) < (ROLE_RANK[currentUserRole] ?? 0)) ? (
                    <>
                      <button onClick={() => openEdit(u)} title="Editar" className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                        <Edit2 className="w-3.5 h-3.5" /> Editar
                      </button>
                      <button onClick={() => resetPassword(u.id)} title="Reset contraseña" className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                        <KeyRound className="w-3.5 h-3.5" /> Clave
                      </button>
                    </>
                  ) : (
                    <span className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-slate-300">
                      <ShieldAlert className="w-3.5 h-3.5" /> Rango superior
                    </span>
                  )}
                  {u.id !== currentUserId && (ROLE_RANK[u.role] ?? 0) < (ROLE_RANK[currentUserRole] ?? 0) && (
                    <button onClick={() => del(u.id)} title="Borrar" className="flex items-center justify-center p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg text-primary">{editing ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Nombres', key: 'name',  type: 'text' },
                  { label: 'Apellidos', key: 'last_name',  type: 'text' },
                  { label: 'Email',           key: 'email', type: 'email' },
                  { label: 'Contraseña',      key: 'password', type: 'password', placeholder: editing ? '(vacío = no cambiar)' : '' },
                  { label: 'DNI',             key: 'dni',   type: 'text' },
                  { label: 'Teléfono',        key: 'phone', type: 'text' },
                  { label: 'Ciudad',          key: 'city', type: 'text' },
                  { label: 'Condición Académica', key: 'academic_condition', type: 'text' },
                ].map(f => (
                  <div key={f.key} className={f.key === 'email' || f.key === 'password' ? 'col-span-2' : 'col-span-1'}>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">{f.label}</label>
                    <input
                      type={f.type}
                      value={(form as any)[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-secondary"
                    />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Rol</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-secondary"
                  >
                    {(allowedRoles.length > 0 ? allowedRoles : ROLES).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
              </div>
            </div>
            {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">
                Cancelar
              </button>
              <button onClick={save} disabled={saving} className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-bold disabled:opacity-60">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}

function PasswordRequestsTab() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/api/v1/admin/password-requests?status=pending');
      setRequests(data.data ?? data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { loadRequests(); }, []);

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    if (!confirm(`¿Estás seguro de ${action === 'approve' ? 'aprobar y generar nueva contraseña' : 'rechazar'} esta solicitud?`)) return;
    
    setActionLoading(id);
    try {
      await apiClient.post(`/api/v1/admin/password-requests/${id}/resolve`, { action });
      loadRequests();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Ocurrió un error');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader className="w-6 h-6 animate-spin text-secondary" /></div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-orange-500" />
        <div>
          <h3 className="font-bold text-slate-800">Solicitudes Pendientes</h3>
          <p className="text-xs text-slate-500">Los usuarios que olvidaron su contraseña aparecerán aquí para tu aprobación manual.</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Usuario / Email</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Fecha de Solicitud</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.map(r => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">{r.user?.name || 'Desconocido'}</div>
                  <div className="text-slate-500 text-xs">{r.email}</div>
                </td>
                <td className="px-4 py-3 text-slate-500 text-sm">
                  {new Date(r.created_at).toLocaleString('es-PE')}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button 
                    disabled={actionLoading === r.id}
                    onClick={() => handleAction(r.id, 'reject')}
                    className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                  <button 
                    disabled={actionLoading === r.id}
                    onClick={() => handleAction(r.id, 'approve')}
                    className="px-3 py-1.5 text-xs font-bold bg-secondary hover:bg-secondary/90 text-white rounded-md disabled:opacity-50"
                  >
                    {actionLoading === r.id ? 'Aprobando...' : 'Aprobar'}
                  </button>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan={3} className="text-center py-10 text-slate-400">No hay solicitudes pendientes.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
