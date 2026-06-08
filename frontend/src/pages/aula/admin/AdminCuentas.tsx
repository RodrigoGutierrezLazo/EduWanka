import React, { useEffect, useState, useRef } from 'react';
import { apiClient } from '../../../lib/apiClient';
import { logger } from '../../../lib/logger';
import {
  CreditCard, Landmark, Plus, Trash2, Loader2, UploadCloud, Film
} from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadZoneProps {
  label: string;
  recommendedResolution: string;
  accept: string;
  folder: 'testimonials_photos' | 'testimonials_videos' | 'convenios' | 'tenant_logos' | 'payment_logos';
  value: string;
  onChange: (url: string) => void;
  type: 'image' | 'video';
}

function FileUploadZone({
  label,
  recommendedResolution,
  accept,
  folder,
  value,
  onChange,
  type
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    if (type === 'image' && !file.type.startsWith('image/')) {
      toast.error('Por favor, selecciona una imagen válida.');
      return;
    }
    if (type === 'video' && !file.type.startsWith('video/')) {
      toast.error('Por favor, selecciona un video de formato mp4 u otro válido.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const { data } = await apiClient.post('/api/v1/admin/settings/upload-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data?.url) {
        onChange(data.url);
        toast.success('Archivo subido correctamente.');
      } else {
        toast.error('Error en la respuesta del servidor.');
      }
    } catch (error: any) {
      logger.error(error);
      toast.error(error?.response?.data?.message || 'Error al subir el archivo.');
    } finally {
      setIsUploading(false);
    }
  };

  const getFullUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('/storage') || url.startsWith('blob:')) {
      return url;
    }
    return `/storage/${url.replace(/^\/+/, '')}`;
  };

  const fullUrl = getFullUrl(value);

  return (
    <div className="space-y-1.5 font-sans text-left">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
        {label} <span className="text-secondary font-medium lowercase italic">{recommendedResolution}</span>
      </label>
      
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[140px] group overflow-hidden ${
          isDragging
            ? 'border-secondary bg-secondary/5 scale-[0.99] shadow-soft'
            : value 
              ? 'border-slate-200 bg-white hover:border-secondary hover:bg-slate-50/50' 
              : 'border-slate-300 bg-slate-50 hover:border-secondary hover:bg-white'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          className="hidden"
        />

        {isUploading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-10">
            <Loader2 className="w-8 h-8 animate-spin text-secondary mb-2" />
            <span className="text-[10px] font-black text-secondary uppercase tracking-widest animate-pulse">Subiendo archivo...</span>
          </div>
        )}

        {value ? (
          <div className="flex flex-col items-center gap-3 w-full">
            {type === 'image' && (
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-soft group-hover:scale-105 transition-transform duration-300">
                <img
                  src={fullUrl}
                  alt="QR Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="text-center w-full max-w-[200px]">
              <p className="text-[10px] font-bold text-slate-800 truncate leading-tight">
                Archivo Cargado
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                }}
                className="text-[9px] font-bold text-red-500 hover:text-red-700 mt-1 hover:underline"
              >
                Eliminar archivo
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-slate-700">
            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm transition-transform duration-300 group-hover:scale-105">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-700 leading-tight">
                Arrastra o haz clic para subir
              </p>
              <p className="text-[9px] text-slate-400 mt-1 max-w-[180px]">
                Soporta archivos de imagen (.png, .jpg, .jpeg) de hasta 5MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminCuentas() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [newBankLogo, setNewBankLogo] = useState('');

  useEffect(() => {
    fetchTenantInfo();
  }, []);

  const fetchTenantInfo = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/api/v1/tenant/current');
      if (data?.data) {
        setTenantInfo(data.data);
        setPaymentMethods(data.data.payment_methods || []);
      }
    } catch (error) {
      toast.error('Error al cargar la información institucional.');
    } finally {
      setLoading(false);
    }
  };

  const savePaymentMethods = async (methodsToSave: any[]) => {
    if (!tenantInfo) return;
    setSaving(true);
    try {
      await apiClient.put('/api/v1/admin/tenant', {
        name: tenantInfo.name,
        primary_color: tenantInfo.primary_color,
        secondary_color: tenantInfo.secondary_color,
        logo_path: tenantInfo.logo_path,
        payment_methods: methodsToSave
      });
      toast.success('Cuentas de pago actualizadas correctamente.');
      setPaymentMethods(methodsToSave);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al guardar las cuentas de pago.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 pb-5 text-left">
        <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
          <Landmark className="w-5 h-5 text-secondary" /> Cuentas de Recaudación (Pagos)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Administra las cuentas bancarias y billeteras móviles oficiales de tu aula para cobrar matrículas.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-soft space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Formulario para añadir cuenta */}
          <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-secondary text-left">
              Agregar Cuenta de Pago
            </h4>

            <div className="space-y-3">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre del Banco / Billetera *</label>
                <input
                  type="text"
                  id="new-bank-name"
                  placeholder="Ej: Yape, BCP, BBVA"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-secondary bg-white"
                />
              </div>
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Número de Cuenta / Celular *</label>
                <input
                  type="text"
                  id="new-bank-account"
                  placeholder="Ej: 999 888 777 o 193-..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-secondary bg-white"
                />
              </div>
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Titular de la Cuenta *</label>
                <input
                  type="text"
                  id="new-bank-holder"
                  placeholder="Ej: Mi Institución S.A.C."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-secondary bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <FileUploadZone
                  label="Imagen / QR de Pago (Opcional)"
                  recommendedResolution="(Recomendado: Imagen cuadrada, máx. 2MB)"
                  accept="image/*"
                  folder="payment_logos"
                  value={newBankLogo}
                  onChange={(url) => setNewBankLogo(url)}
                  type="image"
                />
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  const nameEl = document.getElementById('new-bank-name') as HTMLInputElement;
                  const accountEl = document.getElementById('new-bank-account') as HTMLInputElement;
                  const holderEl = document.getElementById('new-bank-holder') as HTMLInputElement;

                  const name = nameEl?.value.trim();
                  const account = accountEl?.value.trim();
                  const holder = holderEl?.value.trim();

                  if (!name || !account || !holder) {
                    toast.error('Por favor completa los campos obligatorios (*).');
                    return;
                  }

                  const newAccount = {
                    id: name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
                    name,
                    account,
                    holder,
                    logo_path: newBankLogo || null
                  };

                  const updated = [...paymentMethods, newAccount];
                  savePaymentMethods(updated);

                  // Limpiar formulario
                  if (nameEl) nameEl.value = '';
                  if (accountEl) accountEl.value = '';
                  if (holderEl) holderEl.value = '';
                  setNewBankLogo('');
                }}
                className="w-full py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Añadir a la Lista</span>
              </button>
            </div>
          </div>

          {/* Listado de cuentas */}
          <div className="lg:col-span-8 space-y-4 text-left">
            <h4 className="font-bold text-xs uppercase tracking-wider text-primary">
              Cuentas de Pago Configuradas ({paymentMethods.length})
            </h4>

            {paymentMethods.length === 0 ? (
              <div className="border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-400 bg-slate-50/50">
                <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-50 text-slate-400" />
                <p className="text-xs font-bold">No hay cuentas de pago configuradas.</p>
                <p className="text-[10px] mt-1">Los estudiantes verán las cuentas por defecto de la plataforma hasta que agregues las tuyas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-2">
                {paymentMethods.map((pm, idx) => (
                  <div key={pm.id || idx} className="relative group bg-white border border-slate-200 hover:border-secondary/35 rounded-2xl p-4 flex gap-4 items-start shadow-sm transition-all">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      {pm.logo_path ? (
                        <img
                          src={pm.logo_path.startsWith('http') || pm.logo_path.startsWith('/storage') || pm.logo_path.startsWith('blob:') ? pm.logo_path : `/storage/${pm.logo_path}`}
                          alt={pm.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <CreditCard className="w-6 h-6 text-slate-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h5 className="font-extrabold text-sm text-primary leading-tight truncate">{pm.name}</h5>
                      <p className="text-[11px] text-slate-500 font-medium mt-1">
                        Cuenta: <span className="font-mono font-bold text-slate-700">{pm.account}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        Titular: {pm.holder}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        const updated = paymentMethods.filter((_, i) => i !== idx);
                        savePaymentMethods(updated);
                        toast.info('Cuenta eliminada.');
                      }}
                      className="absolute top-3 right-3 p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border border-rose-200/50 disabled:opacity-50"
                      title="Quitar cuenta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
