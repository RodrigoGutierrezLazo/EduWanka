import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import {
  Landmark, Plus, Loader2, Play, Power, Trash2, Edit3, Globe,
  Paintbrush, ShieldAlert, CheckCircle, ExternalLink, X, Settings
} from 'lucide-react';
import { toast } from 'sonner';

interface Tenant {
  id: number;
  name: string;
  slug: string;
  domain: string | null;
  logo_path: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  status: 'active' | 'suspended';
  created_at: string;
}

export default function TenantManagement() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    domain: '',
    logo_path: '',
    primary_color: '#0f1f3d',
    secondary_color: '#ffc107',
  });

  const [isUploading, setIsUploading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecciona una imagen válida.');
      return;
    }

    setIsUploading(true);
    try {
      const data = new FormData();
      data.append('file', file);

      const res = await apiClient.post('/api/v1/superadmin/tenants/upload-logo', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.url) {
        setFormData(prev => ({ ...prev, logo_path: res.data.url }));
        toast.success('Logotipo subido correctamente.');
      } else {
        toast.error('Error al subir el logotipo.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al subir el logotipo.');
    } finally {
      setIsUploading(false);
    }
  };

  // Query all tenants
  const { data: tenants, isLoading, error } = useQuery<Tenant[]>({
    queryKey: ['superadmin-tenants'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/superadmin/tenants');
      return res.data;
    }
  });

  // Create/Update tenant mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: number }) => {
      if (data.id) {
        return apiClient.put(`/api/v1/superadmin/tenants/${data.id}`, data);
      }
      return apiClient.post('/api/v1/superadmin/tenants', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-tenants'] });
      toast.success(editingTenant ? 'Institución actualizada' : 'Nueva institución registrada');
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al guardar los datos');
    }
  });

  // Toggle status mutation
  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiClient.post(`/api/v1/superadmin/tenants/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-tenants'] });
      toast.success('Estado del aula actualizado');
    },
    onError: () => {
      toast.error('Error al cambiar el estado');
    }
  });

  // Delete tenant mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiClient.delete(`/api/v1/superadmin/tenants/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-tenants'] });
      toast.success('Institución eliminada de la plataforma');
    },
    onError: () => {
      toast.error('Error al eliminar la institución');
    }
  });

  const openCreateModal = () => {
    setFormData({
      name: '',
      slug: '',
      domain: '',
      logo_path: '',
      primary_color: '#0f1f3d',
      secondary_color: '#ffc107',
    });
    setEditingTenant(null);
    setIsModalOpen(true);
  };

  const openEditModal = (tenant: Tenant) => {
    setFormData({
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain || '',
      logo_path: tenant.logo_path || '',
      primary_color: tenant.primary_color || '#0f1f3d',
      secondary_color: tenant.secondary_color || '#ffc107',
    });
    setEditingTenant(tenant);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTenant(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      toast.error('El nombre y el slug son obligatorios');
      return;
    }
    saveMutation.mutate(
      editingTenant ? { ...formData, id: editingTenant.id } : formData
    );
  };

  const handleSimulateTenant = (slug: string) => {
    localStorage.setItem('active_tenant_slug', slug);
    toast.success(`Simulando aula virtual: ${slug}`);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleClearSimulation = () => {
    localStorage.removeItem('active_tenant_slug');
    toast.success('Simulación desactivada. Retornando a default');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const activeSimulation = localStorage.getItem('active_tenant_slug');

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100">
              SaaS Engine
            </span>
            <span className="px-2.5 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
              Consola Global
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Gestión de <span className="text-accent italic">Aulas SaaS</span>
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Registra, personaliza y supervisa las diferentes instituciones virtuales activas en el sistema.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSimulation && (
            <button
              onClick={handleClearSimulation}
              className="px-4 py-2.5 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100 hover:bg-red-100 transition-colors"
            >
              Resetear Simulación ({activeSimulation})
            </button>
          )}
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl shadow-sm text-sm font-black transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Nueva Institución
          </button>
        </div>
      </div>

      {/* Main List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-slate-400 font-medium">Cargando catálogo de aulas virtuales...</p>
        </div>
      ) : error ? (
        <div className="p-10 bg-red-50 border border-red-100 rounded-[2rem] text-center">
          <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-700">Error de conexión</h3>
          <p className="text-red-500 mt-2 text-sm">{(error as any)?.message}</p>
        </div>
      ) : tenants?.length === 0 ? (
        <div className="p-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Landmark className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700">Sin Instituciones</h3>
          <p className="text-slate-400 mt-2 text-sm max-w-md mx-auto leading-relaxed">
            No hay aulas virtuales registradas en la plataforma SaaS. Registra una nueva institución para comenzar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants?.map((tenant) => (
            <div
              key={tenant.id}
              className={`bg-white rounded-3xl border ${
                activeSimulation === tenant.slug ? 'border-indigo-400 ring-2 ring-indigo-500/10' : 'border-slate-100'
              } shadow-soft hover:shadow-xl transition-all duration-300 p-6 flex flex-col justify-between relative overflow-hidden`}
            >
              {/* Active indicator */}
              {activeSimulation === tenant.slug && (
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl">
                  Simulado
                </div>
              )}

              {/* Card Header */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center border border-slate-100 overflow-hidden bg-slate-50 shrink-0"
                    style={{ backgroundColor: tenant.logo_path ? '#ffffff' : (tenant.primary_color || '#0f1f3d') }}
                  >
                    {tenant.logo_path ? (
                      <img 
                        src={tenant.logo_path.startsWith('http') ? tenant.logo_path : `/storage/${tenant.logo_path}`} 
                        alt={tenant.name} 
                        className="w-full h-full object-contain p-1" 
                      />
                    ) : (
                      <Landmark className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-slate-900 text-lg leading-tight truncate">{tenant.name}</h3>
                    <p className="text-xs text-slate-400 font-medium">Slug: {tenant.slug}</p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-50 pt-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium">Identificador:</span>
                    <span className="font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md">{tenant.slug}.eduwanka.pe</span>
                  </div>
                  {tenant.domain && (
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-medium">Dominio propio:</span>
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        {tenant.domain}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium">Estado:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        tenant.status === 'active'
                          ? 'bg-green-50 text-green-700 border border-green-100'
                          : 'bg-red-50 text-red-700 border border-red-100'
                      }`}
                    >
                      {tenant.status === 'active' ? 'Activo' : 'Suspendido'}
                    </span>
                  </div>
                </div>

                {/* Branding colors */}
                <div className="flex items-center gap-3 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Paintbrush className="w-3 h-3" /> Colores:
                  </span>
                  <div className="flex gap-1.5">
                    <span
                      className="w-5 h-5 rounded-full border border-slate-100 inline-block shadow-sm"
                      style={{ backgroundColor: tenant.primary_color || '#0f1f3d' }}
                      title="Color Primario"
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-slate-100 inline-block shadow-sm"
                      style={{ backgroundColor: tenant.secondary_color || '#ffc107' }}
                      title="Color Secundario"
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-8 pt-4 border-t border-slate-50 flex items-center gap-2">
                <button
                  onClick={() => handleSimulateTenant(tenant.slug)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-550 hover:bg-indigo-650 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all shadow-sm"
                >
                  <Play className="w-3.5 h-3.5" />
                  Simular Aula
                </button>
                <button
                  onClick={() => openEditModal(tenant)}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-slate-650 hover:text-slate-800 transition-colors"
                  title="Editar Aula"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => toggleMutation.mutate(tenant.id)}
                  className={`p-2.5 border rounded-xl transition-colors ${
                    tenant.status === 'active'
                      ? 'bg-orange-50 border-orange-100 text-orange-600 hover:bg-orange-100'
                      : 'bg-green-50 border-green-100 text-green-600 hover:bg-green-100'
                  }`}
                  title={tenant.status === 'active' ? 'Suspender Aula' : 'Activar Aula'}
                >
                  <Power className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('¿Estás seguro de que deseas eliminar esta aula virtual? Esto borrará el inquilino pero mantendrá los datos foráneos.')) {
                      deleteMutation.mutate(tenant.id);
                    }
                  }}
                  className="p-2.5 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl text-red-650 hover:text-red-800 transition-colors"
                  title="Eliminar Registro"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden border border-slate-100 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-indigo-600" />
                {editingTenant ? 'Editar Aula Virtual' : 'Registrar Nueva Aula'}
              </h2>
              <button onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nombre de la Institución</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Instituto de Formación EduWanka"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-bold text-sm text-slate-700"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Slug del Aula (Subdominio / Identificador)</label>
                <input
                  type="text"
                  required
                  disabled={!!editingTenant}
                  placeholder="Ej: eduwanka (solo minúsculas y números)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-bold text-sm text-slate-700 disabled:bg-slate-50 disabled:text-slate-400"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Dominio Personalizado (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: www.eduwanka.edu.pe"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-bold text-sm text-slate-700"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Logotipo de la Institución</label>
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    {formData.logo_path ? (
                      <img 
                        src={formData.logo_path.startsWith('http') || formData.logo_path.startsWith('/storage') ? formData.logo_path : `/storage/${formData.logo_path}`} 
                        alt="Logo Preview" 
                        className="w-full h-full object-contain p-1" 
                      />
                    ) : (
                      <Landmark className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-grow">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={isUploading}
                      className="text-xs font-medium text-slate-500 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-black file:uppercase file:bg-slate-900 file:text-white file:hover:bg-slate-800 file:cursor-pointer disabled:opacity-50 w-full"
                    />
                    {isUploading && <span className="text-[10px] text-indigo-650 font-bold block mt-1">Subiendo...</span>}
                  </div>
                  {formData.logo_path && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, logo_path: '' }))}
                      className="text-rose-500 hover:text-rose-700 text-xs font-bold uppercase shrink-0"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Color Primario</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-100"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    />
                    <input
                      type="text"
                      className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Color Secundario</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-100"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    />
                    <input
                      type="text"
                      className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-bold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-black rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saveMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingTenant ? 'Actualizar Aula' : 'Guardar Aula'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
