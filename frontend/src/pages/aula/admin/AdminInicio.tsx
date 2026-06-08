import React, { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/apiClient';
import { logger } from '../../../lib/logger';
import {
  Compass, Save, Loader2, ImageOff, Laptop, HelpCircle,
  Shield, Eye, Target, Users, FileText, GraduationCap, Star, Video,
  UploadCloud, Trash2, Film, Link2, Palette
} from 'lucide-react';
import { toast } from 'sonner';
import AdminLandingDesigner from './AdminLandingDesigner';

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
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
    <div className="space-y-1.5 font-sans">
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
            {type === 'image' ? (
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-soft group-hover:scale-105 transition-transform duration-300">
                <img
                  src={fullUrl}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="relative w-20 h-28 rounded-lg overflow-hidden border border-slate-200 bg-slate-950 shadow-soft group-hover:scale-105 transition-transform duration-300">
                <video
                  src={fullUrl}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  loop
                  onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                  onMouseOut={(e) => {
                    const video = e.target as HTMLVideoElement;
                    video.pause();
                    video.currentTime = 0;
                  }}
                />
                <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                  <Film className="w-5 h-5 text-white/80" />
                </div>
                <div className="absolute bottom-1 right-1 bg-black/70 px-1 rounded text-[7px] text-white font-bold tracking-widest uppercase">
                  9:16
                </div>
              </div>
            )}

            <div className="text-center w-full max-w-[200px]">
              <p className="text-[10px] font-bold text-slate-800 truncate leading-tight">
                {value.split('/').pop()}
              </p>
              <p className="text-[8px] text-slate-400 truncate mt-0.5 max-w-full">
                {value}
              </p>
            </div>

            <button
              type="button"
              onClick={clearFile}
              className="inline-flex items-center gap-1.5 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/50 px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all shadow-sm"
            >
              <Trash2 className="w-3 h-3" />
              <span>Eliminar</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 p-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-secondary/10 group-hover:text-secondary transition-all duration-300">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-700 leading-tight">
                Arrastra o haz clic para subir
              </p>
              <p className="text-[9px] text-slate-400 mt-1 max-w-[180px]">
                Soporta archivos {type === 'image' ? 'de imagen (.png, .jpg)' : 'de video (.mp4)'} de hasta 50MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminInicio() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'hero' | 'mision' | 'testimonials' | 'stats' | 'convenios' | 'brand' | 'landing'>('hero');

  // Hero Settings Form State
  const [heroBadge, setHeroBadge] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroDescription, setHeroDescription] = useState('');
  const [heroBgUrl, setHeroBgUrl] = useState('');
  const [heroBgFile, setHeroBgFile] = useState<File | null>(null);

  // Misión, Visión y Valores Form State
  const [mvTitle, setMvTitle] = useState('');
  const [mvDescription, setMvDescription] = useState('');
  const [misionTitle, setMisionTitle] = useState('');
  const [misionDesc, setMisionDesc] = useState('');
  const [visionTitle, setVisionTitle] = useState('');
  const [visionDesc, setVisionDesc] = useState('');
  const [valoresTitle, setValoresTitle] = useState('');
  const [valoresDesc, setValoresDesc] = useState('');

  // Testimonios de Video Form State (TikTok)
  const [testimonial1, setTestimonial1] = useState<any>({ name: '', role: '', quote: '', image_url: '', video_url: '' });
  const [testimonial2, setTestimonial2] = useState<any>({ name: '', role: '', quote: '', image_url: '', video_url: '' });
  const [testimonial3, setTestimonial3] = useState<any>({ name: '', role: '', quote: '', image_url: '', video_url: '' });

  // Cifras (ImpactStats) Form State
  const [statsStudents, setStatsStudents] = useState('');
  const [statsCourses, setStatsCourses] = useState('');
  const [statsTeachers, setStatsTeachers] = useState('');
  const [statsSatisfaction, setStatsSatisfaction] = useState('');

  // Convenios Form State
  const [conveniosEnabled, setConveniosEnabled] = useState(true);
  const [conveniosLogos, setConveniosLogos] = useState<string[]>([]);
  const [newLogoUrl, setNewLogoUrl] = useState('');

  // Identidad de Marca Form State
  const [brandName, setBrandName] = useState('');
  const [brandPrimary, setBrandPrimary] = useState('#7A0F1F');
  const [brandSecondary, setBrandSecondary] = useState('#C8A14A');
  const [brandLogoPath, setBrandLogoPath] = useState('');

  const loadAllSettings = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/api/v1/settings/hero');
      if (data?.data) {
        // Hero
        setHeroBadge(data.data.hero_badge || '');
        setHeroTitle(data.data.hero_title || '');
        setHeroDescription(data.data.hero_description || '');
        setHeroBgUrl(data.data.hero_bg_url || '');

        // Misión, Visión, Valores
        const mv = data.data.home_mission_vision_values || {};
        setMvTitle(mv.title || '');
        setMvDescription(mv.description || '');
        setMisionTitle(mv.mision_title || '');
        setMisionDesc(mv.mision_desc || '');
        setVisionTitle(mv.vision_title || '');
        setVisionDesc(mv.vision_desc || '');
        setValoresTitle(mv.valores_title || '');
        setValoresDesc(mv.valores_desc || '');

        // Testimonios
        const tList = data.data.home_testimonials || [];
        setTestimonial1(tList[0] || { name: '', role: '', quote: '', image_url: '', video_url: '' });
        setTestimonial2(tList[1] || { name: '', role: '', quote: '', image_url: '', video_url: '' });
        setTestimonial3(tList[2] || { name: '', role: '', quote: '', image_url: '', video_url: '' });

        // Cifras
        const stats = data.data.home_impact_stats || {};
        setStatsStudents(stats.students_count || '');
        setStatsCourses(stats.courses_count || '');
        setStatsTeachers(stats.teachers_count || '');
        setStatsSatisfaction(stats.satisfaction_percent || '');

        // Convenios
        setConveniosEnabled(data.data.home_convenios_enabled !== false);
        setConveniosLogos(data.data.home_convenios_logos || []);
      }
    } catch {
      toast.error('No se pudieron cargar las configuraciones de la Página de Inicio.');
    }

    try {
      const { data: tenantRes } = await apiClient.get('/api/v1/tenant/current');
      if (tenantRes?.data) {
        setBrandName(tenantRes.data.name || '');
        setBrandPrimary(tenantRes.data.primary_color || '#7A0F1F');
        setBrandSecondary(tenantRes.data.secondary_color || '#C8A14A');
        setBrandLogoPath(tenantRes.data.logo_path || '');
      }
    } catch (err) {
      logger.error("Error loading tenant details in admin settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllSettings();
  }, []);

  const saveHero = async () => {
    setSaving(true);
    try {
      const textRes = await apiClient.put('/api/v1/admin/settings/hero', {
        hero_badge: heroBadge,
        hero_title: heroTitle,
        hero_description: heroDescription,
      });

      if (heroBgFile) {
        const form = new FormData();
        form.append('image', heroBgFile);
        const imgRes = await apiClient.post('/api/v1/admin/settings/hero/image', form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (imgRes.data?.hero_bg_url) {
          setHeroBgUrl(imgRes.data.hero_bg_url);
          setHeroBgFile(null);
        }
      } else if (textRes.data?.data?.hero_bg_url) {
        setHeroBgUrl(textRes.data.data.hero_bg_url);
      }

      toast.success('Configuración del Hero guardada correctamente.');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al guardar el Hero.');
    } finally {
      setSaving(false);
    }
  };

  const saveHomeSections = async (section: 'mision' | 'testimonials' | 'stats' | 'convenios') => {
    setSaving(true);
    try {
      const payload: any = {};
      
      if (section === 'mision') {
        payload.home_mission_vision_values = {
          title: mvTitle,
          description: mvDescription,
          mision_title: misionTitle,
          mision_desc: misionDesc,
          vision_title: visionTitle,
          vision_desc: visionDesc,
          valores_title: valoresTitle,
          valores_desc: valoresDesc
        };
      } else if (section === 'testimonials') {
        payload.home_testimonials = [
          testimonial1,
          testimonial2,
          testimonial3
        ];
      } else if (section === 'stats') {
        payload.home_impact_stats = {
          students_count: statsStudents,
          courses_count: statsCourses,
          teachers_count: statsTeachers,
          satisfaction_percent: statsSatisfaction
        };
      } else if (section === 'convenios') {
        payload.home_convenios_enabled = conveniosEnabled;
        payload.home_convenios_logos = conveniosLogos;
      }

      await apiClient.put('/api/v1/admin/settings/home-sections', payload);
      toast.success('Configuración de sección guardada correctamente.');
      loadAllSettings();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al guardar la sección.');
    } finally {
      setSaving(false);
    }
  };

  const darkenColor = (hex: string, percent: number): string => {
    let num = parseInt(hex.replace("#",""), 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) - amt,
        G = (num >> 8 & 0x00FF) - amt,
        B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R<0?0:R>255?255:R)*0x10000 + (G<0?0:G>255?255:G)*0x105 + (B<0?0:B>255?255:B)).toString(16).slice(1);
  };

  const saveBrandBranding = async () => {
    setSaving(true);
    try {
      await apiClient.put('/api/v1/admin/tenant', {
        name: brandName,
        primary_color: brandPrimary,
        secondary_color: brandSecondary,
        logo_path: brandLogoPath
      });
      
      toast.success('Identidad de Marca del aula guardada correctamente.');
      
      // Aplicar colores dinámicamente en caliente en la SPA
      const root = document.documentElement;
      root.style.setProperty('--color-primary', brandPrimary);
      root.style.setProperty('--color-primary-dark', darkenColor(brandPrimary, 15));
      root.style.setProperty('--color-secondary', brandSecondary);
      root.style.setProperty('--color-accent', brandSecondary);
      document.title = `${brandName} | Aula Virtual`;
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al guardar la Identidad de Marca.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-soft">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-primary uppercase tracking-wider">Página de Inicio</h1>
            <p className="text-slate-400 text-xs mt-1">Configura las distintas secciones de la pantalla de inicio de la web pública de EduWanka.</p>
          </div>
        </div>
      </div>

      {/* Tabs bar */}
      <div className="flex border border-slate-200 bg-white p-2 rounded-2xl shadow-soft gap-2 overflow-x-auto">
        {[
          { id: 'hero', label: 'Portada (Hero)', icon: <Laptop className="w-4 h-4" /> },
          { id: 'landing', label: 'Diseño de Portada', icon: <Compass className="w-4 h-4" /> },
          { id: 'mision', label: 'Misión y Visión', icon: <Target className="w-4 h-4" /> },
          { id: 'testimonials', label: 'Testimonios TikTok', icon: <Video className="w-4 h-4" /> },
          { id: 'stats', label: 'Cifras de Impacto', icon: <Star className="w-4 h-4" /> },
          { id: 'convenios', label: 'Convenios', icon: <Link2 className="w-4 h-4" /> },
          { id: 'brand', label: 'Identidad de Marca', icon: <Palette className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSettingsTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shrink-0 transition-all ${
              activeSettingsTab === tab.id
                ? 'bg-secondary text-white shadow-soft'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-200 rounded-2xl shadow-soft">
          <Loader2 className="w-10 h-10 animate-spin text-secondary mb-3" />
          <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Cargando Configuración...</span>
        </div>
      ) : (
        <div className="w-full">
          {/* TAB 1: HERO */}
          {activeSettingsTab === 'hero' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-soft space-y-6">
                <div>
                  <h3 className="font-bold text-lg text-primary">Configuración de Portada (Hero)</h3>
                  <p className="text-xs text-slate-500 mt-1">Modifica los mensajes de impacto inicial que ven las visitas.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Insignia Superior (Badge)</label>
                    <input
                      value={heroBadge}
                      onChange={(e) => setHeroBadge(e.target.value)}
                      placeholder="Ej: EXCELENCIA ACADÉMICA"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-secondary bg-white font-medium shadow-inner"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Título Principal</label>
                      <span className="text-[10px] text-slate-400">
                        Usa <code className="bg-slate-100 px-1.5 py-0.5 rounded text-secondary font-black">{"{texto}"}</code> para resaltar palabras en amarillo
                      </span>
                    </div>
                    <input
                      value={heroTitle}
                      onChange={(e) => setHeroTitle(e.target.value)}
                      placeholder="Ej: Forjando el Futuro de los {Profesionales}"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-secondary bg-white font-medium shadow-inner"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Descripción General</label>
                    <textarea
                      value={heroDescription}
                      onChange={(e) => setHeroDescription(e.target.value)}
                      rows={5}
                      placeholder="Escribe el texto de presentación institucional..."
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-secondary bg-white resize-none font-medium shadow-inner"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    onClick={saveHero}
                    disabled={saving}
                    className="inline-flex items-center gap-2 bg-secondary hover:brightness-95 text-white px-8 py-3.5 rounded-xl font-black text-sm disabled:opacity-60 transition shadow-lg shadow-secondary/15"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Save className="w-4 h-4 text-white" />
                    )}
                    <span>Guardar Cambios</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-primary text-sm uppercase tracking-wider">Imagen de Fondo</h3>
                    <span className="text-[9px] text-emerald-600 font-extrabold uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded shadow-sm">
                      16:9 Recomendada
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Opción A: Subir Archivo</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setHeroBgFile(file);
                            setHeroBgUrl(URL.createObjectURL(file));
                          }
                        }}
                        className="text-xs font-sans text-slate-500 border border-slate-200 bg-white p-2 rounded-xl w-full cursor-pointer focus:outline-none"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Opción B: URL de Imagen</span>
                      <input 
                        value={heroBgUrl.startsWith('blob:') ? '' : heroBgUrl} 
                        onChange={e => {
                          setHeroBgUrl(e.target.value);
                          setHeroBgFile(null);
                        }}
                        placeholder="/storage/hero/hero_law_bg.png o http://..."
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-secondary bg-white font-medium shadow-inner" 
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft space-y-4">
                  <h3 className="font-bold text-primary text-sm uppercase tracking-wider border-b border-slate-100 pb-3">Vista Previa</h3>
                  
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md h-52 bg-slate-900">
                    {heroBgUrl ? (
                      <img 
                        src={heroBgUrl.startsWith('blob:') || heroBgUrl.startsWith('http') || heroBgUrl.startsWith('/storage') ? heroBgUrl : `/storage/${heroBgUrl.replace(/^\/+/, '')}`} 
                        alt="Background Preview" 
                        className="w-full h-full object-cover opacity-35 filter brightness-[0.9]" 
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                        <ImageOff className="w-8 h-8 mb-2" />
                        <span className="text-xs">Sin imagen seleccionada</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent flex flex-col justify-end p-6 text-white font-sans pointer-events-none">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="h-[1.5px] w-4 bg-secondary rounded-full"></div>
                        <span className="text-[8px] font-black uppercase text-secondary tracking-widest">{heroBadge || 'EXCELENCIA ACADÉMICA'}</span>
                      </div>
                      
                      <h4 className="font-bold text-sm sm:text-base leading-tight">
                        {heroTitle ? heroTitle.split(/\{([^}]+)\}/g).map((part, index) => {
                          if (index % 2 === 1) {
                            return <span key={index} className="text-accent italic">{part}</span>;
                          }
                          return part;
                        }) : 'Forjando el Futuro de los Profesionales'}
                      </h4>

                      <p className="text-[8px] sm:text-[9px] text-white line-clamp-2 mt-1 max-w-[280px] leading-normal opacity-90">
                        {heroDescription || 'Descripción institucional redactada...'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MISIÓN Y VISIÓN (Institución de Excelencia) */}
          {activeSettingsTab === 'mision' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-soft space-y-6">
              <div>
                <h3 className="font-bold text-lg text-primary">Configuración de Institución de Excelencia</h3>
                <p className="text-xs text-slate-500 mt-1">Administra los lemas, la descripción general y los tres pilares de Misión, Visión y Valores corporativos.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                {/* Cabecera de la Sección */}
                <div className="space-y-4 md:col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-150">
                  <span className="text-xs font-bold text-secondary uppercase tracking-widest block">Encabezado de Sección</span>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Título de Sección</label>
                    <input
                      value={mvTitle}
                      onChange={(e) => setMvTitle(e.target.value)}
                      placeholder="Ej: Institución de Excelencia"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-secondary bg-white font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Descripción General de Sección</label>
                    <textarea
                      value={mvDescription}
                      onChange={(e) => setMvDescription(e.target.value)}
                      rows={2}
                      placeholder="Escribe una pequeña descripción introductoria..."
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-secondary bg-white font-medium resize-none"
                    />
                  </div>
                </div>

                {/* Misión */}
                <div className="space-y-3 bg-blue-50/20 p-6 rounded-2xl border border-blue-100 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2 text-blue-600">
                    <Target className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider">Pilar 1: Misión</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Título de Misión</label>
                    <input
                      value={misionTitle}
                      onChange={(e) => setMisionTitle(e.target.value)}
                      placeholder="Nuestra Misión"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-secondary bg-white font-medium"
                    />
                  </div>
                  <div className="space-y-1.5 mt-2 flex-grow">
                    <label className="text-xs font-bold text-slate-500 uppercase">Descripción de Misión</label>
                    <textarea
                      value={misionDesc}
                      onChange={(e) => setMisionDesc(e.target.value)}
                      rows={4}
                      placeholder="Detalla la misión académica corporativa..."
                      className="w-full h-[120px] px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-secondary bg-white font-medium resize-none"
                    />
                  </div>
                </div>

                {/* Visión */}
                <div className="space-y-3 bg-purple-50/20 p-6 rounded-2xl border border-purple-100 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2 text-purple-600">
                    <Eye className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider">Pilar 2: Visión</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Título de Visión</label>
                    <input
                      value={visionTitle}
                      onChange={(e) => setVisionTitle(e.target.value)}
                      placeholder="Nuestra Visión"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-secondary bg-white font-medium"
                    />
                  </div>
                  <div className="space-y-1.5 mt-2 flex-grow">
                    <label className="text-xs font-bold text-slate-500 uppercase">Descripción de Visión</label>
                    <textarea
                      value={visionDesc}
                      onChange={(e) => setVisionDesc(e.target.value)}
                      rows={4}
                      placeholder="Detalla la visión institucional..."
                      className="w-full h-[120px] px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-secondary bg-white font-medium resize-none"
                    />
                  </div>
                </div>

                {/* Valores */}
                <div className="space-y-3 bg-emerald-50/20 p-6 rounded-2xl border border-emerald-100 flex flex-col justify-between md:col-span-2">
                  <div className="flex items-center gap-2 mb-2 text-emerald-600">
                    <Shield className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider">Pilar 3: Valores Corporativos</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5 md:col-span-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Título de Valores</label>
                      <input
                        value={valoresTitle}
                        onChange={(e) => setValoresTitle(e.target.value)}
                        placeholder="Nuestros Valores"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-secondary bg-white font-medium"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2 flex-grow">
                      <label className="text-xs font-bold text-slate-500 uppercase">Descripción de Valores</label>
                      <textarea
                        value={valoresDesc}
                        onChange={(e) => setValoresDesc(e.target.value)}
                        rows={2}
                        placeholder="Detalla los valores que sustentan la excelencia superior..."
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-secondary bg-white font-medium resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={() => saveHomeSections('mision')}
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-secondary hover:brightness-95 text-white px-8 py-3.5 rounded-xl font-black text-sm disabled:opacity-60 transition shadow-lg shadow-secondary/15"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Save className="w-4 h-4 text-white" />
                  )}
                  <span>Guardar Misión y Visión</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: TESTIMONIOS TIKTOK (Videos Verticales) */}
          {activeSettingsTab === 'testimonials' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-soft space-y-6">
              <div>
                <h3 className="font-bold text-lg text-primary">Testimonios de Video Verticales (Estilo TikTok)</h3>
                <p className="text-xs text-slate-500 mt-1">Configura los tres testimonios destacados en video vertical en la página de inicio. Modifica nombres, avatares, citas y la URL del archivo de video (.mp4) de cada estudiante.</p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                
                {/* Testimonio 1 */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-secondary">
                    <Video className="w-5 h-5 shrink-0" />
                    <span className="font-bold text-sm uppercase tracking-wider">Testimonio 1</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre Completo</label>
                      <input 
                        value={testimonial1.name || ''} 
                        onChange={e => setTestimonial1({...testimonial1, name: e.target.value})}
                        placeholder="Ej: Andrea Rivas"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-secondary bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Cargo / Especialidad</label>
                      <input 
                        value={testimonial1.role || ''} 
                        onChange={e => setTestimonial1({...testimonial1, role: e.target.value})}
                        placeholder="Ej: Egresada de Derecho"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-secondary bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Resumen del Comentario</label>
                      <textarea 
                        value={testimonial1.quote || ''} 
                        onChange={e => setTestimonial1({...testimonial1, quote: e.target.value})}
                        rows={3}
                        placeholder="Escribe el comentario corto..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-secondary bg-white resize-none"
                      />
                    </div>
                    
                    <FileUploadZone
                      label="Foto del Avatar"
                      recommendedResolution="(Recomendado: 150x150 px, Relación 1:1)"
                      accept="image/*"
                      folder="testimonials_photos"
                      value={testimonial1.image_url || ''}
                      onChange={url => setTestimonial1({...testimonial1, image_url: url})}
                      type="image"
                    />
                    
                    <FileUploadZone
                      label="Video Vertical (.mp4)"
                      recommendedResolution="(Recomendado: 1080x1920 px, Relación 9:16)"
                      accept="video/mp4,video/*"
                      folder="testimonials_videos"
                      value={testimonial1.video_url || ''}
                      onChange={url => setTestimonial1({...testimonial1, video_url: url})}
                      type="video"
                    />
                  </div>
                </div>

                {/* Testimonio 2 */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-secondary">
                    <Video className="w-5 h-5 shrink-0" />
                    <span className="font-bold text-sm uppercase tracking-wider">Testimonio 2</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre Completo</label>
                      <input 
                        value={testimonial2.name || ''} 
                        onChange={e => setTestimonial2({...testimonial2, name: e.target.value})}
                        placeholder="Ej: Javier López"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-secondary bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Cargo / Especialidad</label>
                      <input 
                        value={testimonial2.role || ''} 
                        onChange={e => setTestimonial2({...testimonial2, role: e.target.value})}
                        placeholder="Ej: Alumno de Tecnología"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-secondary bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Resumen del Comentario</label>
                      <textarea 
                        value={testimonial2.quote || ''} 
                        onChange={e => setTestimonial2({...testimonial2, quote: e.target.value})}
                        rows={3}
                        placeholder="Escribe el comentario corto..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-secondary bg-white resize-none"
                      />
                    </div>
                    
                    <FileUploadZone
                      label="Foto del Avatar"
                      recommendedResolution="(Recomendado: 150x150 px, Relación 1:1)"
                      accept="image/*"
                      folder="testimonials_photos"
                      value={testimonial2.image_url || ''}
                      onChange={url => setTestimonial2({...testimonial2, image_url: url})}
                      type="image"
                    />
                    
                    <FileUploadZone
                      label="Video Vertical (.mp4)"
                      recommendedResolution="(Recomendado: 1080x1920 px, Relación 9:16)"
                      accept="video/mp4,video/*"
                      folder="testimonials_videos"
                      value={testimonial2.video_url || ''}
                      onChange={url => setTestimonial2({...testimonial2, video_url: url})}
                      type="video"
                    />
                  </div>
                </div>

                {/* Testimonio 3 */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-secondary">
                    <Video className="w-5 h-5 shrink-0" />
                    <span className="font-bold text-sm uppercase tracking-wider">Testimonio 3</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre Completo</label>
                      <input 
                        value={testimonial3.name || ''} 
                        onChange={e => setTestimonial3({...testimonial3, name: e.target.value})}
                        placeholder="Ej: Sofía Martínez"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-secondary bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Cargo / Especialidad</label>
                      <input 
                        value={testimonial3.role || ''} 
                        onChange={e => setTestimonial3({...testimonial3, role: e.target.value})}
                        placeholder="Ej: Alumna de Derecho"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-secondary bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Resumen del Comentario</label>
                      <textarea 
                        value={testimonial3.quote || ''} 
                        onChange={e => setTestimonial3({...testimonial3, quote: e.target.value})}
                        rows={3}
                        placeholder="Escribe el comentario corto..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-secondary bg-white resize-none"
                      />
                    </div>
                    
                    <FileUploadZone
                      label="Foto del Avatar"
                      recommendedResolution="(Recomendado: 150x150 px, Relación 1:1)"
                      accept="image/*"
                      folder="testimonials_photos"
                      value={testimonial3.image_url || ''}
                      onChange={url => setTestimonial3({...testimonial3, image_url: url})}
                      type="image"
                    />
                    
                    <FileUploadZone
                      label="Video Vertical (.mp4)"
                      recommendedResolution="(Recomendado: 1080x1920 px, Relación 9:16)"
                      accept="video/mp4,video/*"
                      folder="testimonials_videos"
                      value={testimonial3.video_url || ''}
                      onChange={url => setTestimonial3({...testimonial3, video_url: url})}
                      type="video"
                    />
                  </div>
                </div>

              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={() => saveHomeSections('testimonials')}
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-secondary hover:brightness-95 text-white px-8 py-3.5 rounded-xl font-black text-sm disabled:opacity-60 transition shadow-lg shadow-secondary/15"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Save className="w-4 h-4 text-white" />
                  )}
                  <span>Guardar Testimonios de Video</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: CIFRAS DE IMPACTO (ImpactStats) */}
          {activeSettingsTab === 'stats' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-soft space-y-6">
              <div>
                <h3 className="font-bold text-lg text-primary">Edición de Cifras de Impacto (Estadísticas)</h3>
                <p className="text-xs text-slate-500 mt-1">Configura las cifras y porcentajes que sustentan el impacto académico de EduWanka en la última sección (Cierre de página anterior al footer).</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-slate-100">
                
                {/* Estudiantes */}
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-3 flex flex-col justify-between shadow-soft">
                  <div className="flex items-center gap-2.5 text-secondary">
                    <Users className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider">Estudiantes</span>
                  </div>
                  <div className="space-y-1.5 flex-grow mt-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Cantidad de Estudiantes</label>
                    <input
                      type="number"
                      value={statsStudents}
                      onChange={(e) => setStatsStudents(e.target.value)}
                      placeholder="Ej: 5000"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-primary focus:outline-none focus:border-secondary bg-white"
                    />
                    <p className="text-[9px] text-slate-400 mt-0.5">Se mostrará en la web con el prefijo "+" (Ej: +5,000).</p>
                  </div>
                </div>

                {/* Cursos */}
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-3 flex flex-col justify-between shadow-soft">
                  <div className="flex items-center gap-2.5 text-secondary">
                    <FileText className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider">Cursos Activos</span>
                  </div>
                  <div className="space-y-1.5 flex-grow mt-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Cantidad de Cursos</label>
                    <input
                      type="number"
                      value={statsCourses}
                      onChange={(e) => setStatsCourses(e.target.value)}
                      placeholder="Ej: 50"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-primary focus:outline-none focus:border-secondary bg-white"
                    />
                    <p className="text-[9px] text-slate-400 mt-0.5">Se mostrará en la web con el prefijo "+" (Ej: +50).</p>
                  </div>
                </div>

                {/* Docentes */}
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-3 flex flex-col justify-between shadow-soft">
                  <div className="flex items-center gap-2.5 text-secondary">
                    <GraduationCap className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider">Docentes Expertos</span>
                  </div>
                  <div className="space-y-1.5 flex-grow mt-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Docentes Totales</label>
                    <input
                      type="number"
                      value={statsTeachers}
                      onChange={(e) => setStatsTeachers(e.target.value)}
                      placeholder="Ej: 25"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-primary focus:outline-none focus:border-secondary bg-white"
                    />
                    <p className="text-[9px] text-slate-400 mt-0.5">Se mostrará en la web con el prefijo "+" (Ej: +25).</p>
                  </div>
                </div>

                {/* Satisfacción */}
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-3 flex flex-col justify-between shadow-soft">
                  <div className="flex items-center gap-2.5 text-secondary">
                    <Star className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider">Satisfacción</span>
                  </div>
                  <div className="space-y-1.5 flex-grow mt-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Porcentaje (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={statsSatisfaction}
                      onChange={(e) => setStatsSatisfaction(e.target.value)}
                      placeholder="Ej: 98"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-primary focus:outline-none focus:border-secondary bg-white"
                    />
                    <p className="text-[9px] text-slate-400 mt-0.5">Se mostrará en la web con el sufijo "%" (Ej: 98%).</p>
                  </div>
                </div>

              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={() => saveHomeSections('stats')}
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-secondary hover:brightness-95 text-white px-8 py-3.5 rounded-xl font-black text-sm disabled:opacity-60 transition shadow-lg shadow-secondary/15"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Save className="w-4 h-4 text-white" />
                  )}
                  <span>Guardar Cifras de Impacto</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: CONVENIOS */}
          {activeSettingsTab === 'convenios' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-soft space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-lg text-primary">Convenios y Acreditación Académica</h3>
                  <p className="text-xs text-slate-500 mt-1">Configura los logotipos de convenios universitarios y gremiales de EduWanka en el carrusel de la página de inicio.</p>
                </div>
                
                {/* Switch to enable/disable section */}
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wide">Sección Activa</span>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={conveniosEnabled}
                      onChange={(e) => setConveniosEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
                {/* Upload zone */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                    <span className="text-xs font-black text-secondary uppercase tracking-widest block mb-4">Añadir Nuevo Logotipo</span>
                    <FileUploadZone
                      label="Subir Imagen de Convenio"
                      recommendedResolution="(Formatos recomendados: PNG transparente o JPG)"
                      accept="image/*"
                      folder="convenios"
                      value={newLogoUrl}
                      onChange={(url) => {
                        if (url) {
                          setConveniosLogos([...conveniosLogos, url]);
                          setNewLogoUrl('');
                          toast.success('Logotipo cargado exitosamente. No olvides guardar.');
                        }
                      }}
                      type="image"
                    />
                  </div>
                </div>

                {/* Logos Grid */}
                <div className="lg:col-span-8 space-y-4">
                  <span className="text-xs font-black text-primary uppercase tracking-widest block mb-2">Logotipos en Carrusel ({conveniosLogos.length})</span>
                  
                  {conveniosLogos.length === 0 ? (
                    <div className="border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-400">
                      <ImageOff className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-bold">No hay logotipos configurados.</p>
                      <p className="text-[10px] mt-1">Sube logotipos de universidades o colegios profesionales en la zona lateral.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2 aula-sidebar-scrollbar">
                      {conveniosLogos.map((logo, index) => (
                        <div key={index} className="relative group bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center h-28 hover:border-secondary/35 transition-all select-none">
                          <img
                            src={logo.startsWith('http') || logo.startsWith('/storage') || logo.startsWith('blob:') ? logo : `/convenios/${logo}`}
                            alt={`Convenio ${index}`}
                            className="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                            draggable="false"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setConveniosLogos(conveniosLogos.filter((_, i) => i !== index));
                              toast.info('Logotipo temporalmente removido. Guarda para publicar los cambios.');
                            }}
                            className="absolute -top-2 -right-2 p-1.5 bg-rose-100 hover:bg-rose-200 border border-rose-300 text-rose-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            title="Quitar convenio"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-slate-100">
                <button
                  onClick={() => saveHomeSections('convenios')}
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-secondary hover:brightness-95 text-white px-8 py-3.5 rounded-xl font-black text-sm disabled:opacity-60 transition shadow-lg shadow-secondary/15"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Save className="w-4 h-4 text-white" />
                  )}
                  <span>Guardar Convenios</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: BRAND (Identidad de Marca) */}
          {activeSettingsTab === 'brand' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-soft space-y-6">
                <div>
                  <h3 className="font-bold text-lg text-primary">Identidad de Marca y Colores</h3>
                  <p className="text-xs text-slate-500 mt-1">Configura los colores corporativos y el nombre que identifican a tu institución.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nombre de la Institución</label>
                    <input
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Ej: Instituto Azul"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-secondary bg-white font-medium shadow-inner"
                    />
                  </div>

                  {/* Logotipo de la Institución */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
                    <FileUploadZone
                      label="Logotipo de la Institución"
                      recommendedResolution="(Recomendado: Imagen horizontal transparente, PNG o SVG, máx. 2MB)"
                      accept="image/*"
                      folder="tenant_logos"
                      value={brandLogoPath}
                      onChange={(url) => setBrandLogoPath(url)}
                      type="image"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Color Primario */}
                    <div className="space-y-1.5 p-4 bg-slate-50 rounded-2xl border border-slate-150">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Color Primario</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={brandPrimary}
                          onChange={(e) => setBrandPrimary(e.target.value)}
                          className="w-12 h-12 rounded-lg cursor-pointer border border-slate-200"
                        />
                        <input
                          type="text"
                          value={brandPrimary}
                          onChange={(e) => setBrandPrimary(e.target.value)}
                          placeholder="#7A0F1F"
                          className="flex-grow px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:outline-none focus:border-secondary bg-white"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-2">Usado en sidebars, botones principales y fondos institucionales.</span>
                    </div>

                    {/* Color Secundario / Acento */}
                    <div className="space-y-1.5 p-4 bg-slate-50 rounded-2xl border border-slate-150">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Color de Acento</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={brandSecondary}
                          onChange={(e) => setBrandSecondary(e.target.value)}
                          className="w-12 h-12 rounded-lg cursor-pointer border border-slate-200"
                        />
                        <input
                          type="text"
                          value={brandSecondary}
                          onChange={(e) => setBrandSecondary(e.target.value)}
                          placeholder="#C8A14A"
                          className="flex-grow px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:outline-none focus:border-secondary bg-white"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-2">Usado en insignias (badges), hovers de navegación y elementos de resalte.</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    onClick={saveBrandBranding}
                    disabled={saving}
                    className="inline-flex items-center gap-2 bg-secondary hover:brightness-95 text-white px-8 py-3.5 rounded-xl font-black text-sm disabled:opacity-60 transition shadow-lg shadow-secondary/15"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Save className="w-4 h-4 text-white" />
                    )}
                    <span>Guardar Identidad</span>
                  </button>
                </div>
              </div>

              {/* Vista Previa del Sidebar */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft space-y-4">
                  <h3 className="font-bold text-primary text-sm uppercase tracking-wider border-b border-slate-100 pb-3">Vista Previa de Barra Lateral</h3>
                  
                  <div 
                    style={{ background: `linear-gradient(to bottom, ${brandPrimary}, ${darkenColor(brandPrimary, 40)})` }}
                    className="rounded-2xl overflow-hidden border border-slate-200 shadow-md h-[320px] p-6 text-white font-sans flex flex-col justify-between"
                  >
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                        {brandLogoPath ? (
                          <img 
                            src={brandLogoPath.startsWith('http') || brandLogoPath.startsWith('/storage') || brandLogoPath.startsWith('blob:') ? brandLogoPath : `/storage/${brandLogoPath}`} 
                            alt={brandName} 
                            className="h-8 w-auto object-contain brightness-0 invert" 
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-xs">
                            {brandName ? brandName.substring(0, 2).toUpperCase() : 'EW'}
                          </div>
                        )}
                        <span className="font-bold text-sm truncate">{brandName || 'Tu Institución'}</span>
                      </div>

                      <div className="space-y-2">
                        <div 
                          style={{ backgroundColor: brandSecondary }}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-[#1a0507]"
                        >
                          <div className="w-4 h-4 bg-[#1a0507]/20 rounded-full" />
                          <span>Panel de Inicio</span>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors text-white/70">
                          <div className="w-4 h-4 bg-white/20 rounded-full" />
                          <span>Mis Cursos</span>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors text-white/70">
                          <div className="w-4 h-4 bg-white/20 rounded-full" />
                          <span>Materiales</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-white/40 text-center border-t border-white/10 pt-4">
                      © 2026 {brandName || 'EduWanka'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}



          {/* TAB 8: DISEÑO DE PORTADA MODULAR */}
          {activeSettingsTab === 'landing' && (
            <AdminLandingDesigner />
          )}

        </div>
      )}
    </div>
  );
}
