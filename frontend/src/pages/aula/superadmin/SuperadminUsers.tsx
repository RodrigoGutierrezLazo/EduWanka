import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { 
  Users, Search, Shield, ShieldAlert, UserPlus, 
  MoreVertical, Edit2, Trash2, Check, X, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

export default function SuperadminUsers() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: users, isLoading } = useQuery({
    queryKey: ['superadmin-all-users', search, selectedRole],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/admin/users', {
        params: {
          search: search || undefined,
          role: selectedRole !== 'all' ? selectedRole : undefined,
          per_page: 100,
        },
      });
      return (response.data.data ?? response.data) as any[];
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number, role: string }) => {
      return apiClient.patch(`/api/v1/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-all-users'] });
      toast.success('Rol actualizado correctamente');
    },
    onError: () => {
      toast.error('Error al actualizar el rol');
    }
  });

  const filteredUsers = users ?? [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-secondary" />
            Usuarios y Privilegios
          </h1>
          <p className="text-slate-500 mt-1">Gestión jerárquica de cuentas y roles del sistema.</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-soft flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o email..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-secondary/20 text-sm font-medium"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <select 
          className="px-6 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-secondary/20 text-sm font-bold text-slate-600"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          <option value="all">Todos los Roles</option>
          <option value="student">Estudiantes</option>
          <option value="prof">Profesores</option>
          <option value="admin">Administradores</option>
          <option value="superadmin">Super Admins</option>
        </select>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identidad</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol Actual</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones de Poder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={3} className="py-20 text-center text-slate-400 font-bold">Cargando usuarios...</td></tr>
              ) : filteredUsers?.map((user: any) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary font-black">
                        {user.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <select 
                        className="text-xs font-bold bg-slate-50 border-none rounded-xl px-3 py-2 focus:ring-1 focus:ring-secondary/20"
                        value={user.role}
                        onChange={(e) => updateRoleMutation.mutate({ userId: user.id, role: e.target.value })}
                        disabled={updateRoleMutation.isPending}
                      >
                        <option value="student">Hacer Estudiante</option>
                        <option value="prof">Hacer Profesor</option>
                        <option value="admin">Hacer Administrador</option>
                        <option value="superadmin">Hacer Superadmin</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const configs: any = {
    superadmin: { label: 'Super Admin', color: 'bg-slate-900 text-white', icon: <ShieldAlert className="w-3 h-3" /> },
    admin: { label: 'Admin', color: 'bg-blue-600 text-white', icon: <Shield className="w-3 h-3" /> },
    prof: { label: 'Docente', color: 'bg-secondary text-white', icon: <Edit2 className="w-3 h-3" /> },
    student: { label: 'Estudiante', color: 'bg-slate-100 text-slate-600', icon: <Users className="w-3 h-3" /> },
  };

  const config = configs[role] || configs.student;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
}
