import React, { useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { logger } from '@/lib/logger';
import {
  Award, Loader, Download, FileUp, Eye, Save, Mail, Trash2,
  ShieldCheck, XCircle, Filter, Search, RotateCcw, Plus, UploadCloud, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();

interface Certificate {
  id: number;
  user?: { id: number; name: string; email?: string; dni?: string };
  course?: { id: number; title: string; code?: string };
  code?: string;
  certificate_code?: string;
  dni?: string;
  student_name?: string;
  grade?: string;
  score?: number;
  file_url?: string;
  file_path?: string;
  status?: string;
  is_revoked?: boolean;
  revoked_at?: string;
  revoked_reason?: string;
  created_at: string;
}
interface Template { id: number; name: string; fields?: Fields; template_url?: string; }
type FieldKey = 'name' | 'code' | 'grade';
type FieldBox = { page: number; x: number; y: number; width: number; fontSize: number; align: 'left' | 'center' | 'right' };
type Fields = Record<FieldKey, FieldBox> & { is_builder?: boolean; builder_settings?: any };
type PagePreview = { pageNumber: number; width: number; height: number };

const defaultFields: Fields = {
  name: { page: 1, x: 28, y: 104, width: 240, fontSize: 22, align: 'center' },
  code: { page: 2, x: 241, y: 155, width: 42, fontSize: 12, align: 'left' },
  grade: { page: 2, x: 241, y: 166, width: 42, fontSize: 12, align: 'left' },
};

const fieldLabels: Record<FieldKey, string> = { name: 'Nombre', code: 'Codigo', grade: 'Nota' };

export default function AdminCertificados() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'list' | 'editor' | 'batch'>('list');
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [fields, setFields] = useState<Fields>(defaultFields);
  const [activeField, setActiveField] = useState<FieldKey>('name');
  const [mmPerPx, setMmPerPx] = useState(25.4 / 72 / 1.25);
  const [previewUrl, setPreviewUrl] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [pagePreviews, setPagePreviews] = useState<PagePreview[]>([]);
  const [dragging, setDragging] = useState<{ key: FieldKey; page: number; offsetX: number; offsetY: number } | null>(null);
  const [courseFilter, setCourseFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [coursesList, setCoursesList] = useState<{ id: number; title: string }[]>([]);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Default Builder states
  const [isBuilderMode, setIsBuilderMode] = useState(false);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [builderSettings, setBuilderSettings] = useState({
    logo_path: '',
    logo_pos: { x: 123, y: 22, width: 50, height: 20 },
    header_text: 'CERTIFICADO DE PARTICIPACIÓN',
    header_pos: { x: 28, y: 55, width: 240, fontSize: 24, align: 'center' },
    body_text: 'Por haber completado satisfactoriamente las actividades académicas correspondientes.',
    body_pos: { x: 28, y: 125, width: 240, fontSize: 14, align: 'center' },
    signature_text_1: 'Director Académico',
    signature_pos_1: { x: 108, y: 175, width: 80, fontSize: 11, align: 'center' },
    signature_img_1: '',
    signature_img_pos_1: { x: 123, y: 148, width: 50, height: 22 },
    custom_rectangles: [] as Array<{ id: string; x: number; y: number; width: number; height: number; color: string; filled: boolean }>,
    custom_texts: [] as Array<{ id: string; x: number; y: number; width: number; fontSize: number; align: 'left' | 'center' | 'right'; text: string }>,
    custom_logos: [] as Array<{ id: string; x: number; y: number; width: number; height: number; logo_path: string }>,
  });
  const [activeBuilderElement, setActiveBuilderElement] = useState<string>('name');
  const [draggingBuilder, setDraggingBuilder] = useState<{ key: string; offsetX: number; offsetY: number } | null>(null);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDraggingImageZone, setIsDraggingImageZone] = useState(false);

  const getFullUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('/storage') || url.startsWith('blob:')) {
      return url;
    }
    return `/storage/${url.replace(/^\/+/, '')}`;
  };

  const handleUploadImage = async (file: File, field: 'logo' | 'signature') => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecciona una imagen válida (.png, .jpg, .jpeg, .webp).');
      return;
    }
    setIsUploadingImage(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'tenant_logos');
    try {
      const { data } = await apiClient.post('/api/v1/admin/settings/upload-file', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (data?.url) {
        if (field === 'logo') {
          setBuilderSettings(prev => ({ ...prev, logo_path: data.url }));
        } else {
          setBuilderSettings(prev => ({ ...prev, signature_img_1: data.url }));
        }
        toast.success('Imagen subida correctamente.');
      } else {
        toast.error('Error al subir la imagen.');
      }
    } catch (error: any) {
      logger.error(error);
      toast.error(error?.response?.data?.message || 'Error al subir la imagen.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const addCustomRectangle = () => {
    const newRect = {
      id: `rect_${Date.now()}`,
      x: 100,
      y: 100,
      width: 40,
      height: 15,
      color: tenantInfo?.primary_color ?? '#7A0F1F',
      filled: false
    };
    setBuilderSettings(prev => ({
      ...prev,
      custom_rectangles: [...(prev.custom_rectangles || []), newRect]
    }));
    setActiveBuilderElement(`rect_${newRect.id}`);
  };

  const addCustomText = () => {
    const newText = {
      id: `text_${Date.now()}`,
      x: 100,
      y: 100,
      width: 100,
      fontSize: 12,
      align: 'left' as const,
      text: 'Texto adicional...'
    };
    setBuilderSettings(prev => ({
      ...prev,
      custom_texts: [...(prev.custom_texts || []), newText]
    }));
    setActiveBuilderElement(`text_${newText.id}`);
  };

  const addCustomLogo = () => {
    const newLogo = {
      id: `logo_${Date.now()}`,
      x: 100,
      y: 100,
      width: 30,
      height: 15,
      logo_path: ''
    };
    setBuilderSettings(prev => ({
      ...prev,
      custom_logos: [...(prev.custom_logos || []), newLogo]
    }));
    setActiveBuilderElement(`logo_${newLogo.id}`);
  };

  const onBuilderMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingBuilder) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const xPx = Math.max(0, event.clientX - rect.left - draggingBuilder.offsetX);
    const yPx = Math.max(0, event.clientY - rect.top - draggingBuilder.offsetY);
    
    // Scale factor: 297mm / 750px (x-axis), 210mm / 530px (y-axis)
    const mmX = Math.round(xPx * (297 / 750) * 10) / 10;
    const mmY = Math.round(yPx * (210 / 530) * 10) / 10;
    
    const key = draggingBuilder.key;
    if (key === 'name' || key === 'code' || key === 'grade') {
      setFields(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          x: mmX,
          y: mmY,
        }
      }));
    } else if (key === 'logo' || key === 'header' || key === 'body' || key === 'signature_1' || key === 'signature_img_1') {
      setBuilderSettings(prev => {
        const posKey = key === 'logo' ? 'logo_pos' :
                       key === 'header' ? 'header_pos' :
                       key === 'body' ? 'body_pos' :
                       key === 'signature_1' ? 'signature_pos_1' :
                       key === 'signature_img_1' ? 'signature_img_pos_1' : '';
        if (!posKey) return prev;
        return {
          ...prev,
          [posKey]: {
            ...prev[posKey],
            x: mmX,
            y: mmY,
          }
        };
      });
    } else if (key.startsWith('rect_')) {
      const rectId = key.replace('rect_', '');
      setBuilderSettings(prev => ({
        ...prev,
        custom_rectangles: (prev.custom_rectangles || []).map(r => r.id === rectId ? { ...r, x: mmX, y: mmY } : r)
      }));
    } else if (key.startsWith('text_')) {
      const textId = key.replace('text_', '');
      setBuilderSettings(prev => ({
        ...prev,
        custom_texts: (prev.custom_texts || []).map(t => t.id === textId ? { ...t, x: mmX, y: mmY } : t)
      }));
    } else if (key.startsWith('logo_')) {
      const logoId = key.replace('logo_', '');
      setBuilderSettings(prev => ({
        ...prev,
        custom_logos: (prev.custom_logos || []).map(l => l.id === logoId ? { ...l, x: mmX, y: mmY } : l)
      }));
    }
  };

  const getBuilderElements = () => {
    const list = [
      { key: 'header', label: 'Título/Cabecera' },
      { key: 'body', label: 'Cuerpo del Texto' },
      { key: 'name', label: 'Nombre Alumno' },
      { key: 'code', label: 'Código Certificado' },
      { key: 'grade', label: 'Nota/Calificación' },
      { key: 'logo', label: 'Logotipo Principal' },
      { key: 'signature_img_1', label: 'Firma (Imagen)' },
      { key: 'signature_1', label: 'Firma (Texto Cargo)' },
    ];
    (builderSettings.custom_rectangles || []).forEach((r, idx) => {
      list.push({ key: `rect_${r.id}`, label: `Rectángulo Decorativo ${idx + 1}` });
    });
    (builderSettings.custom_texts || []).forEach((t, idx) => {
      list.push({ key: `text_${t.id}`, label: `Párrafo Adicional ${idx + 1}` });
    });
    (builderSettings.custom_logos || []).forEach((l, idx) => {
      list.push({ key: `logo_${l.id}`, label: `Logotipo Adicional ${idx + 1}` });
    });
    return list;
  };

  const renderElementSettings = () => {
    const key = activeBuilderElement;
    if (key === 'header' || key === 'body' || key === 'signature_1') {
      const isHeader = key === 'header';
      const isBody = key === 'body';
      const textVal = isHeader ? builderSettings.header_text : isBody ? builderSettings.body_text : builderSettings.signature_text_1;
      const pos = isHeader ? builderSettings.header_pos : isBody ? builderSettings.body_pos : builderSettings.signature_pos_1;
      
      const updateText = (text: string) => {
        setBuilderSettings(prev => ({
          ...prev,
          [isHeader ? 'header_text' : isBody ? 'body_text' : 'signature_text_1']: text
        }));
      };

      const updatePosProp = (prop: string, val: any) => {
        const posKey = isHeader ? 'header_pos' : isBody ? 'body_pos' : 'signature_pos_1';
        setBuilderSettings(prev => ({
          ...prev,
          [posKey]: {
            ...prev[posKey],
            [prop]: val
          }
        }));
      };

      return (
        <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Texto y Formato</p>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Contenido</label>
            {isBody ? (
              <textarea
                value={textVal}
                onChange={e => updateText(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm h-20"
              />
            ) : (
              <input
                type="text"
                value={textVal}
                onChange={e => updateText(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Letra (pt)
              <input
                type="number"
                value={pos.fontSize}
                onChange={e => updatePosProp('fontSize', Number(e.target.value))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Ancho (mm)
              <input
                type="number"
                value={pos.width}
                onChange={e => updatePosProp('width', Number(e.target.value))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Alineación</label>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => updatePosProp('align', a)}
                  className={`flex-1 py-1 rounded text-xs font-bold capitalize ${pos.align === a ? 'bg-secondary text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
                >
                  {a === 'left' ? 'Izq' : a === 'center' ? 'Centro' : 'Der'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Posición X (mm)
              <input
                type="number"
                value={pos.x}
                onChange={e => updatePosProp('x', Number(e.target.value))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Posición Y (mm)
              <input
                type="number"
                value={pos.y}
                onChange={e => updatePosProp('y', Number(e.target.value))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
          </div>
        </div>
      );
    }

    if (key === 'name' || key === 'code' || key === 'grade') {
      const fKey = key as FieldKey;
      const field = fields[fKey];
      
      const updateFieldProp = (prop: string, val: any) => {
        setFields(prev => ({
          ...prev,
          [fKey]: {
            ...prev[fKey],
            [prop]: val
          }
        }));
      };

      return (
        <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Campo Dinámico: {fieldLabels[fKey]}</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Letra (pt)
              <input
                type="number"
                value={field.fontSize}
                onChange={e => updateFieldProp('fontSize', Number(e.target.value))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Ancho (mm)
              <input
                type="number"
                value={field.width}
                onChange={e => updateFieldProp('width', Number(e.target.value))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Alineación</label>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => updateFieldProp('align', a)}
                  className={`flex-1 py-1 rounded text-xs font-bold capitalize ${field.align === a ? 'bg-secondary text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
                >
                  {a === 'left' ? 'Izq' : a === 'center' ? 'Centro' : 'Der'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Posición X (mm)
              <input
                type="number"
                value={field.x}
                onChange={e => updateFieldProp('x', Number(e.target.value))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Posición Y (mm)
              <input
                type="number"
                value={field.y}
                onChange={e => updateFieldProp('y', Number(e.target.value))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
          </div>
        </div>
      );
    }

    if (key === 'logo' || key === 'signature_img_1') {
      const isLogo = key === 'logo';
      const pos = isLogo ? builderSettings.logo_pos : builderSettings.signature_img_pos_1;
      
      const updatePosProp = (prop: string, val: any) => {
        const posKey = isLogo ? 'logo_pos' : 'signature_img_pos_1';
        setBuilderSettings(prev => ({
          ...prev,
          [posKey]: {
            ...prev[posKey],
            [prop]: val
          }
        }));
      };

      const activeImgUrl = isLogo
        ? (builderSettings.logo_path || tenantInfo?.logo_path)
        : builderSettings.signature_img_1;

      return (
        <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-left">
          <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Imagen: {isLogo ? 'Logotipo' : 'Firma'}</p>
          
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              Subir Imagen
            </label>
            
            <div
              onClick={() => imageFileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingImageZone(true);
              }}
              onDragLeave={() => setIsDraggingImageZone(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingImageZone(false);
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  handleUploadImage(file, isLogo ? 'logo' : 'signature');
                }
              }}
              className={`relative border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[110px] group overflow-hidden ${
                isDraggingImageZone
                  ? 'border-secondary bg-secondary/5 scale-[0.99] shadow-soft'
                  : activeImgUrl
                    ? 'border-slate-200 bg-white hover:border-secondary hover:bg-slate-50/50'
                    : 'border-slate-300 bg-slate-50 hover:border-secondary hover:bg-white'
              }`}
            >
              <input
                type="file"
                ref={imageFileInputRef}
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleUploadImage(file, isLogo ? 'logo' : 'signature');
                  }
                }}
                className="hidden"
              />

              {isUploadingImage && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                  <Loader2 className="w-5 h-5 animate-spin text-secondary mb-1" />
                  <span className="text-[9px] font-black text-secondary uppercase tracking-widest animate-pulse">Subiendo...</span>
                </div>
              )}

              {activeImgUrl ? (
                <div className="flex flex-col items-center gap-1.5 w-full">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <img
                      src={getFullUrl(activeImgUrl)}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-bold text-slate-800 leading-tight">Imagen Cargada</p>
                    <p className="text-[8px] text-green-600 font-bold mt-0.5">✓ Lista en la plantilla</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-slate-500 group-hover:text-slate-700">
                  <div className="p-1.5 bg-white rounded-lg border border-slate-100 shadow-sm transition-transform duration-300 group-hover:scale-105">
                    <UploadCloud className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-700 leading-tight">
                      Arrastra o haz clic
                    </p>
                    <p className="text-[8px] text-slate-400 mt-0.5">
                      PNG, JPG, JPEG, WEBP
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Ancho (mm)
              <input
                type="number"
                value={pos.width}
                onChange={e => updatePosProp('width', Number(e.target.value))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Alto (mm)
              <input
                type="number"
                value={pos.height}
                onChange={e => updatePosProp('height', Number(e.target.value))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Posición X (mm)
              <input
                type="number"
                value={pos.x}
                onChange={e => updatePosProp('x', Number(e.target.value))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Posición Y (mm)
              <input
                type="number"
                value={pos.y}
                onChange={e => updatePosProp('y', Number(e.target.value))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
          </div>
        </div>
      );
    }

    if (key.startsWith('rect_')) {
      const rectId = key.replace('rect_', '');
      const rectObj = (builderSettings.custom_rectangles || []).find(r => r.id === rectId);
      if (!rectObj) return null;

      const updateRectProp = (prop: string, val: any) => {
        setBuilderSettings(prev => ({
          ...prev,
          custom_rectangles: (prev.custom_rectangles || []).map(r => r.id === rectId ? { ...r, [prop]: val } : r)
        }));
      };

      const deleteRect = () => {
        setBuilderSettings(prev => ({
          ...prev,
          custom_rectangles: (prev.custom_rectangles || []).filter(r => r.id !== rectId)
        }));
        setActiveBuilderElement('name');
      };

      return (
        <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex justify-between items-center">
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Rectángulo Decorativo</p>
            <button type="button" onClick={deleteRect} className="text-red-500 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Ancho (mm)
              <input
                type="number"
                value={rectObj.width}
                onChange={e => updateRectProp('width', Number(e.target.value))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Alto (mm)
              <input
                type="number"
                value={rectObj.height}
                onChange={e => updateRectProp('height', Number(e.target.value))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Posición X (mm)
              <input
                type="number"
                value={rectObj.x}
                onChange={e => updateRectProp('x', Number(e.target.value))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Posición Y (mm)
              <input
                type="number"
                value={rectObj.y}
                onChange={e => updateRectProp('y', Number(e.target.value))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={rectObj.filled}
                onChange={e => updateRectProp('filled', e.target.checked)}
                className="rounded text-secondary focus:ring-secondary/20"
              />
              Relleno?
            </label>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Color:</span>
              <input
                type="color"
                value={rectObj.color}
                onChange={e => updateRectProp('color', e.target.value)}
                className="w-6 h-6 border-0 p-0 bg-transparent cursor-pointer rounded"
              />
            </div>
          </div>
        </div>
      );
    }

    if (key.startsWith('text_')) {
      const textId = key.replace('text_', '');
      const textObj = (builderSettings.custom_texts || []).find(t => t.id === textId);
      if (!textObj) return null;

      const updateTextProp = (prop: string, val: any) => {
        setBuilderSettings(prev => ({
          ...prev,
          custom_texts: (prev.custom_texts || []).map(t => t.id === textId ? { ...t, [prop]: val } : t)
        }));
      };

      const deleteText = () => {
        setBuilderSettings(prev => ({
          ...prev,
          custom_texts: (prev.custom_texts || []).filter(t => t.id !== textId)
        }));
        setActiveBuilderElement('name');
      };

      return (
        <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-left">
          <div className="flex justify-between items-center">
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Párrafo Adicional</p>
            <button type="button" onClick={deleteText} className="text-red-500 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Contenido de Texto</label>
            <textarea
              value={textObj.text}
              onChange={e => updateTextProp('text', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm h-20"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Letra (pt)
              <input
                type="number"
                value={textObj.fontSize}
                onChange={e => updateTextProp('fontSize', Number(e.target.value))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Ancho (mm)
              <input
                type="number"
                value={textObj.width}
                onChange={e => updateTextProp('width', Number(e.target.value))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Alineación</label>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => updateTextProp('align', a)}
                  className={`flex-1 py-1 rounded text-xs font-bold capitalize ${textObj.align === a ? 'bg-secondary text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
                >
                  {a === 'left' ? 'Izq' : a === 'center' ? 'Centro' : 'Der'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Posición X (mm)
              <input
                type="number"
                value={textObj.x}
                onChange={e => updateTextProp('x', Number(e.target.value))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Posición Y (mm)
              <input
                type="number"
                value={textObj.y}
                onChange={e => updateTextProp('y', Number(e.target.value))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
          </div>
        </div>
      );
    }

    if (key.startsWith('logo_')) {
      const logoId = key.replace('logo_', '');
      const logoObj = (builderSettings.custom_logos || []).find(l => l.id === logoId);
      if (!logoObj) return null;

      const updateLogoProp = (prop: string, val: any) => {
        setBuilderSettings(prev => ({
          ...prev,
          custom_logos: (prev.custom_logos || []).map(l => l.id === logoId ? { ...l, [prop]: val } : l)
        }));
      };

      const deleteLogo = () => {
        setBuilderSettings(prev => ({
          ...prev,
          custom_logos: (prev.custom_logos || []).filter(l => l.id !== logoId)
        }));
        setActiveBuilderElement('name');
      };

      const handleUploadCustomLogo = async (file: File) => {
        if (!file.type.startsWith('image/')) {
          toast.error('Por favor, selecciona una imagen válida (.png, .jpg, .jpeg, .webp).');
          return;
        }
        setIsUploadingImage(true);
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', 'tenant_logos');
        try {
          const { data } = await apiClient.post('/api/v1/admin/settings/upload-file', fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          if (data?.url) {
            updateLogoProp('logo_path', data.url);
            toast.success('Imagen subida correctamente.');
          } else {
            toast.error('Error al subir la imagen.');
          }
        } catch (error: any) {
          logger.error(error);
          toast.error(error?.response?.data?.message || 'Error al subir la imagen.');
        } finally {
          setIsUploadingImage(false);
        }
      };

      return (
        <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-left">
          <div className="flex justify-between items-center">
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Logotipo Adicional</p>
            <button type="button" onClick={deleteLogo} className="text-red-500 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              Subir Imagen
            </label>
            
            <div
              onClick={() => imageFileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingImageZone(true);
              }}
              onDragLeave={() => setIsDraggingImageZone(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingImageZone(false);
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  handleUploadCustomLogo(file);
                }
              }}
              className={`relative border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[110px] group overflow-hidden ${
                isDraggingImageZone
                  ? 'border-secondary bg-secondary/5 scale-[0.99] shadow-soft'
                  : logoObj.logo_path
                    ? 'border-slate-200 bg-white hover:border-secondary hover:bg-slate-50/50'
                    : 'border-slate-300 bg-slate-50 hover:border-secondary hover:bg-white'
              }`}
            >
              <input
                type="file"
                ref={imageFileInputRef}
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleUploadCustomLogo(file);
                  }
                }}
                className="hidden"
              />

              {isUploadingImage && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                  <Loader2 className="w-5 h-5 animate-spin text-secondary mb-1" />
                  <span className="text-[9px] font-black text-secondary uppercase tracking-widest animate-pulse">Subiendo...</span>
                </div>
              )}

              {logoObj.logo_path ? (
                <div className="flex flex-col items-center gap-1.5 w-full">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <img
                      src={getFullUrl(logoObj.logo_path)}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-bold text-slate-800 leading-tight">Imagen Cargada</p>
                    <p className="text-[8px] text-green-600 font-bold mt-0.5">✓ Lista en la plantilla</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-slate-500 group-hover:text-slate-700">
                  <div className="p-1.5 bg-white rounded-lg border border-slate-100 shadow-sm transition-transform duration-300 group-hover:scale-105">
                    <UploadCloud className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-700 leading-tight">
                      Arrastra o haz clic
                    </p>
                    <p className="text-[8px] text-slate-400 mt-0.5">
                      PNG, JPG, JPEG, WEBP
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Ancho (mm)
              <input
                type="number"
                value={logoObj.width}
                onChange={e => updateLogoProp('width', Number(e.target.value))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Alto (mm)
              <input
                type="number"
                value={logoObj.height}
                onChange={e => updateLogoProp('height', Number(e.target.value))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Posición X (mm)
              <input
                type="number"
                value={logoObj.x}
                onChange={e => updateLogoProp('x', Number(e.target.value))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Posición Y (mm)
              <input
                type="number"
                value={logoObj.y}
                onChange={e => updateLogoProp('y', Number(e.target.value))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
          </div>
        </div>
      );
    }

    return null;
  };

  useEffect(() => {
    apiClient.get('/api/v1/tenant/current')
      .then(({ data }) => setTenantInfo(data?.data ?? null))
      .catch(() => {});
  }, []);
  const templateBytesRef = useRef<ArrayBuffer | null>(null);
  const pageCanvasRefs = useRef<Record<number, HTMLCanvasElement | null>>({});
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  const load = async (filterCourseId?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('per_page', '200');
      if (filterCourseId) params.set('course_id', filterCourseId);
      const [certRes, tplRes] = await Promise.all([
        apiClient.get(`/api/v1/admin/certificates?${params.toString()}`),
        apiClient.get('/api/v1/admin/certificates/templates'),
      ]);
      setCerts(certRes.data.data ?? certRes.data);
      setTemplates(tplRes.data.data ?? tplRes.data);
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const res = await apiClient.get('/api/v1/admin/courses');
      setCoursesList((res.data.data ?? res.data).map((c: any) => ({ id: c.id, title: c.title })));
    } catch { /* ignore */ }
  };

  useEffect(() => { load(); loadCourses(); }, []);

  const handleCourseFilter = (val: string) => {
    setCourseFilter(val);
    load(val || undefined);
  };

  const deleteCert = async (id: number) => {
    if (!window.confirm('¿Eliminar este certificado permanentemente?')) return;
    setActionLoading(id);
    try {
      await apiClient.delete(`/api/v1/admin/certificates/${id}`);
      load(courseFilter || undefined);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar');
    } finally {
      setActionLoading(null);
    }
  };

  const revokeCert = async (id: number) => {
    const reason = window.prompt('Motivo de revocación (mínimo 5 caracteres):');
    if (!reason || reason.length < 5) return;
    setActionLoading(id);
    try {
      await apiClient.post(`/api/v1/admin/certificates/${id}/revoke`, { reason });
      load(courseFilter || undefined);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al revocar');
    } finally {
      setActionLoading(null);
    }
  };

  const restoreCert = async (id: number) => {
    if (!window.confirm('¿Restaurar este certificado?')) return;
    setActionLoading(id);
    try {
      await apiClient.post(`/api/v1/admin/certificates/${id}/restore`);
      load(courseFilter || undefined);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al restaurar');
    } finally {
      setActionLoading(null);
    }
  };

  const resendEmail = async (id: number) => {
    setActionLoading(id);
    try {
      alert('Funcionalidad de reenvío de correo próximamente disponible.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredCerts = certs.filter(c => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (c.student_name || c.user?.name || '').toLowerCase().includes(s)
      || (c.certificate_code || c.code || '').toLowerCase().includes(s)
      || (c.dni || c.user?.dni || '').toLowerCase().includes(s);
  });

  useEffect(() => {
    if (!templateFile) {
      templateBytesRef.current = null;
      setPagePreviews([]);
      return;
    }
    renderTemplate(templateFile);
  }, [templateFile]);

  const renderTemplate = async (file: File) => {
    const bytes = await file.arrayBuffer();
    templateBytesRef.current = bytes.slice(0);
    const pdf = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
    const scale = 1.25;
    const pages: PagePreview[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      pages.push({
        pageNumber,
        width: Math.round(viewport.width),
        height: Math.round(viewport.height),
      });
    }

    setMmPerPx(25.4 / 72 / scale);
    setPagePreviews(pages);
  };

  useEffect(() => {
    if (!templateBytesRef.current || pagePreviews.length === 0) return;

    let cancelled = false;

    const renderPages = async () => {
      const pdf = await pdfjsLib.getDocument({ data: templateBytesRef.current!.slice(0) }).promise;
      const scale = 1.25;

      for (const previewPage of pagePreviews) {
        if (cancelled) return;
        const canvas = pageCanvasRefs.current[previewPage.pageNumber];
        if (!canvas) continue;

        const page = await pdf.getPage(previewPage.pageNumber);
        const viewport = page.getViewport({ scale });
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        await page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport }).promise;
      }
    };

    renderPages();

    return () => {
      cancelled = true;
    };
  }, [pagePreviews]);

  const [loadingTemplate, setLoadingTemplate] = useState(false);

  const selectTemplate = async (id: string) => {
    setSelectedTemplateId(id);
    const template = templates.find(t => String(t.id) === id);
    if (!template) {
      setTemplateFile(null);
      templateBytesRef.current = null;
      setPagePreviews([]);
      setTemplateName('');
      setIsBuilderMode(false);
      return;
    }
    
    setTemplateName(template.name || '');

    if (template.fields) {
      setFields(template.fields);
      if (template.fields.is_builder) {
        setIsBuilderMode(true);
        if (template.fields.builder_settings) {
          setBuilderSettings(prev => ({
            ...prev,
            ...template.fields.builder_settings,
            custom_rectangles: template.fields.builder_settings.custom_rectangles || [],
            custom_texts: template.fields.builder_settings.custom_texts || [],
            custom_logos: template.fields.builder_settings.custom_logos || [],
          }));
        }
        setTemplateFile(null);
        setPagePreviews([]);
        return;
      }
    }
    
    setIsBuilderMode(false);

    if (template.template_url) {
      setLoadingTemplate(true);
      try {
        const resp = await fetch(template.template_url);
        const blob = await resp.blob();
        const file = new File([blob], `${template.name}.pdf`, { type: 'application/pdf' });
        setTemplateFile(file);
      } catch {
        setMessage('No se pudo cargar el PDF de la plantilla.');
      } finally {
        setLoadingTemplate(false);
      }
    }
  };

  const saveTemplate = async () => {
    if (!isBuilderMode && !templateFile) {
      setMessage('Selecciona una plantilla PDF antes de guardar.');
      return;
    }
    const finalName = templateName.trim() || `Plantilla ${new Date().toLocaleDateString('es-PE')}`;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', finalName);
      if (templateFile) {
        fd.append('template', templateFile);
      }
      
      const fieldsPayload = {
        ...fields,
        is_builder: isBuilderMode,
        builder_settings: isBuilderMode ? builderSettings : null,
      };
      fd.append('fields', JSON.stringify(fieldsPayload));

      if (selectedTemplateId) {
        fd.append('_method', 'PUT');
        const { data } = await apiClient.post(`/api/v1/admin/certificates/template/${selectedTemplateId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSelectedTemplateId(String(data.id));
        setTemplateName(data.name || finalName);
        setMessage('Plantilla actualizada correctamente.');
      } else {
        const { data } = await apiClient.post('/api/v1/admin/certificates/template', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSelectedTemplateId(String(data.id));
        setTemplateName(data.name || finalName);
        setMessage('Plantilla guardada correctamente.');
      }
      load();
    } catch {
      setMessage('No se pudo guardar la plantilla.');
    } finally {
      setSaving(false);
    }
  };

  const preview = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      if (selectedTemplateId) fd.append('template_id', selectedTemplateId);
      if (!selectedTemplateId && templateFile) fd.append('template', templateFile);
      
      const fieldsPayload = {
        ...fields,
        is_builder: isBuilderMode,
        builder_settings: isBuilderMode ? builderSettings : null,
      };
      fd.append('fields', JSON.stringify(fieldsPayload));
      fd.append('student_name', 'PARTICIPANTE DE PRUEBA');
      fd.append('dni', '00000000');
      fd.append('code', 'PREVIEW-001');
      fd.append('grade', '18');
      const { data } = await apiClient.post('/api/v1/admin/certificates/preview', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPreviewUrl(data.url);
      setMessage('Vista previa generada.');
    } catch {
      setMessage('No se pudo generar la vista previa.');
    } finally {
      setSaving(false);
    }
  };

  const generateBatch = async () => {
    if (!sourceFile) {
      setMessage('Selecciona un CSV o Excel.');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      if (selectedTemplateId) fd.append('template_id', selectedTemplateId);
      if (!selectedTemplateId && templateFile) fd.append('template', templateFile);
      
      const fieldsPayload = {
        ...fields,
        is_builder: isBuilderMode,
        builder_settings: isBuilderMode ? builderSettings : null,
      };
      fd.append('fields', JSON.stringify(fieldsPayload));
      fd.append('source', sourceFile);
      const { data } = await apiClient.post('/api/v1/admin/certificates/batch', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPreviewUrl(data.zip_url ?? '');
      setMessage(`Generados ${data.count} certificados.`);
      load();
    } catch {
      setMessage('No se pudo generar el lote.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: FieldKey, patch: Partial<FieldBox>) => {
    setFields(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const fieldStyle = (key: FieldKey) => ({
    left: `${fields[key].x / mmPerPx}px`,
    top: `${fields[key].y / mmPerPx}px`,
    width: `${fields[key].width / mmPerPx}px`,
    fontSize: `${Math.max(12, fields[key].fontSize)}px`,
  });

  const onPageMove = (event: React.MouseEvent<HTMLDivElement>, pageNumber: number) => {
    if (!dragging || dragging.page !== pageNumber) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const xPx = Math.max(0, event.clientX - rect.left - dragging.offsetX);
    const yPx = Math.max(0, event.clientY - rect.top - dragging.offsetY);
    updateField(dragging.key, {
      page: pageNumber,
      x: Math.round(xPx * mmPerPx * 10) / 10,
      y: Math.round(yPx * mmPerPx * 10) / 10,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-extrabold text-primary flex items-center gap-2"><Award className="w-5 sm:w-6 h-5 sm:h-6" /> Certificados</h1>
        <div className="flex gap-2 overflow-x-auto">
          {(['list','editor','batch'] as const).map(item => (
            <button key={item} onClick={() => setTab(item)} className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap ${tab === item ? 'bg-primary text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {item === 'list' ? 'Lista' : item === 'editor' ? 'Editor PDF' : 'Carga masiva'}
            </button>
          ))}
        </div>
      </div>

      {message && <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-4 py-3 text-sm">{message}</div>}

      {tab === 'list' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar alumno, código, DNI..."
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none min-w-[200px]"
              value={courseFilter}
              onChange={(e) => handleCourseFilter(e.target.value)}
            >
              <option value="">Todos los cursos</option>
              {coursesList.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {loading ? <div className="flex justify-center py-12"><Loader className="w-6 h-6 animate-spin text-secondary" /></div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Alumno</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">DNI</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Curso</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Código</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Nota</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                      <th className="px-4 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredCerts.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{c.student_name || c.user?.name || '-'}</p>
                          <p className="text-[10px] text-slate-400">{c.user?.email}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{c.dni || c.user?.dni || '-'}</td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{c.course?.title ?? '-'}</td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-secondary font-bold">{c.certificate_code || c.code || '-'}</span>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-700">{c.grade || c.score || '-'}</td>
                        <td className="px-4 py-3">
                          {c.is_revoked ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase">
                              <XCircle className="w-3 h-3" /> Revocado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase">
                              <ShieldCheck className="w-3 h-3" /> Activo
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString('es-PE') : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {c.file_url && (
                              <a href={c.file_url} target="_blank" rel="noreferrer" className="p-1.5 text-slate-400 hover:text-secondary transition-colors rounded" title="Descargar PDF">
                                <Download className="w-4 h-4" />
                              </a>
                            )}
                            <button onClick={() => resendEmail(c.id)} disabled={actionLoading === c.id} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors rounded" title="Reenviar correo">
                              <Mail className="w-4 h-4" />
                            </button>
                            {c.is_revoked ? (
                              <button onClick={() => restoreCert(c.id)} disabled={actionLoading === c.id} className="p-1.5 text-slate-400 hover:text-green-600 transition-colors rounded" title="Restaurar certificado">
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            ) : (
                              <button onClick={() => revokeCert(c.id)} disabled={actionLoading === c.id} className="p-1.5 text-slate-400 hover:text-orange-600 transition-colors rounded" title="Revocar certificado">
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => deleteCert(c.id)} disabled={actionLoading === c.id} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded" title="Eliminar permanentemente">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredCerts.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-slate-400">Sin certificados</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {(tab === 'editor' || tab === 'batch') && (
        <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Plantilla guardada</label>
              <div className="relative">
                <select value={selectedTemplateId} onChange={e => selectTemplate(e.target.value)} disabled={loadingTemplate} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm disabled:opacity-50">
                  <option value="">Usar PDF o Diseño Nuevo</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {loadingTemplate && <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-secondary" />}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Modo de Plantilla</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsBuilderMode(false)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${!isBuilderMode ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  Subir PDF Propio
                </button>
                <button
                  type="button"
                  onClick={() => setIsBuilderMode(true)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${isBuilderMode ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  Constructor Predet.
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre plantilla</label>
              <input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="Ej: Plantilla Diplomado 2026" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>

            {!isBuilderMode ? (
              <>
                <label className="flex items-center gap-2 border border-dashed border-slate-300 rounded-lg px-3 py-3 text-sm text-slate-600 cursor-pointer hover:bg-slate-50">
                  <FileUp className="w-4 h-4" />
                  <span>{templateFile ? templateFile.name : 'Subir PDF plantilla'}</span>
                  <input type="file" accept="application/pdf" onChange={e => setTemplateFile(e.target.files?.[0] ?? null)} className="hidden" />
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {Object.keys(fields).map(key => (
                    <button key={key} onClick={() => setActiveField(key as FieldKey)} className={`py-2 rounded-lg text-xs font-bold ${activeField === key ? 'bg-secondary text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {fieldLabels[key as FieldKey]}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {(['page','x','y','width','fontSize'] as const).map(prop => (
                    <label key={prop} className="text-xs font-bold text-slate-500 uppercase">
                      {prop}
                      <input
                        type="number"
                        min={prop === 'page' ? 1 : undefined}
                        max={prop === 'page' && pagePreviews.length > 0 ? pagePreviews.length : undefined}
                        value={fields[activeField][prop]}
                        onChange={e => updateField(activeField, { [prop]: Number(e.target.value) } as Partial<FieldBox>)}
                        className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </label>
                  ))}
                </div>
                <select value={fields[activeField].align} onChange={e => updateField(activeField, { align: e.target.value as FieldBox['align'] })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                  <option value="left">Izquierda</option>
                  <option value="center">Centro</option>
                  <option value="right">Derecha</option>
                </select>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Elemento a editar</label>
                  <select
                    value={activeBuilderElement}
                    onChange={e => setActiveBuilderElement(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none"
                  >
                    {getBuilderElements().map(el => (
                      <option key={el.key} value={el.key}>{el.label}</option>
                    ))}
                  </select>
                </div>

                {renderElementSettings()}

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={addCustomRectangle}
                    className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-slate-300 hover:border-slate-400 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-slate-400" /> Agregar Rectángulo Decorativo
                  </button>
                  <button
                    type="button"
                    onClick={addCustomText}
                    className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-slate-300 hover:border-slate-400 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-slate-400" /> Agregar Párrafo Adicional
                  </button>
                  <button
                    type="button"
                    onClick={addCustomLogo}
                    className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-slate-300 hover:border-slate-400 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-slate-400" /> Agregar Logotipo Adicional
                  </button>
                </div>
              </div>
            )}

            {tab === 'batch' && (
              <label className="flex items-center gap-2 border border-dashed border-slate-300 rounded-lg px-3 py-3 text-sm text-slate-600 cursor-pointer hover:bg-slate-50">
                <FileUp className="w-4 h-4" />
                <span>{sourceFile ? sourceFile.name : 'Subir CSV o Excel'}</span>
                <input type="file" accept=".csv,.txt,.xlsx,.xls" onChange={e => setSourceFile(e.target.files?.[0] ?? null)} className="hidden" />
              </label>
            )}

            <div className="grid grid-cols-1 gap-2">
              <button onClick={saveTemplate} disabled={saving || (!isBuilderMode && !templateFile)} className="flex items-center justify-center gap-2 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-bold disabled:opacity-50">
                <Save className="w-4 h-4" /> Guardar plantilla
              </button>
              <button onClick={preview} disabled={saving || (!isBuilderMode && !selectedTemplateId && !templateFile)} className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-lg text-sm font-bold disabled:opacity-50">
                <Eye className="w-4 h-4" /> Vista previa
              </button>
              {tab === 'batch' && (
                <button onClick={generateBatch} disabled={saving || !sourceFile || (!isBuilderMode && !selectedTemplateId && !templateFile)} className="flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-lg text-sm font-bold disabled:opacity-50">
                  <Download className="w-4 h-4" /> Generar lote
                </button>
              )}
            </div>

            {previewUrl && <a href={previewUrl} target="_blank" rel="noreferrer" className="block text-center text-secondary text-sm font-bold underline">Abrir resultado</a>}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 overflow-auto">
            <div className="min-w-[640px] space-y-5">
              {loadingTemplate && (
                <div className="flex min-h-[420px] items-center justify-center bg-slate-50 gap-3">
                  <Loader className="w-6 h-6 animate-spin text-secondary" />
                  <span className="text-slate-500 text-sm font-medium">Cargando plantilla...</span>
                </div>
              )}

              {isBuilderMode ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-400">
                    <span>Diseño Predeterminado (A4 Horizontal)</span>
                    <span>297mm x 210mm (750px x 530px)</span>
                  </div>
                  <div
                    onMouseMove={onBuilderMove}
                    onMouseUp={() => setDraggingBuilder(null)}
                    onMouseLeave={() => setDraggingBuilder(null)}
                    className="relative inline-block bg-white shadow-lg border border-slate-200 select-none overflow-hidden"
                    style={{ width: '750px', height: '530px' }}
                  >
                    {/* 1. Outer Border */}
                    <div 
                      className="absolute pointer-events-none"
                      style={{
                        left: '25.2px',
                        top: '25.2px',
                        width: '699.6px',
                        height: '479.6px',
                        border: `7.6px solid ${tenantInfo?.primary_color ?? '#7A0F1F'}`
                      }}
                    />
                    {/* 2. Inner Border */}
                    <div 
                      className="absolute pointer-events-none"
                      style={{
                        left: '35.3px',
                        top: '35.3px',
                        width: '679.4px',
                        height: '459.4px',
                        border: `3.8px solid ${tenantInfo?.secondary_color ?? '#C8A14A'}`
                      }}
                    />

                    {/* 3. Logo Element */}
                    <div
                      onMouseDown={e => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setDraggingBuilder({
                          key: 'logo',
                          offsetX: e.clientX - rect.left,
                          offsetY: e.clientY - rect.top
                        });
                        setActiveBuilderElement('logo');
                      }}
                      style={{
                        position: 'absolute',
                        left: `${builderSettings.logo_pos.x * 2.525}px`,
                        top: `${builderSettings.logo_pos.y * 2.525}px`,
                        width: `${builderSettings.logo_pos.width * 2.525}px`,
                        height: `${builderSettings.logo_pos.height * 2.525}px`,
                      }}
                      className={`cursor-move overflow-hidden border-2 ${activeBuilderElement === 'logo' ? 'border-secondary z-10' : 'border-slate-300 border-dashed'}`}
                    >
                      {builderSettings.logo_path || tenantInfo?.logo_path ? (
                        <img 
                          src={getFullUrl(builderSettings.logo_path || tenantInfo?.logo_path)} 
                          alt="Logo" 
                          className="w-full h-full object-contain pointer-events-none" 
                        />
                      ) : (
                        <span className="flex items-center justify-center w-full h-full text-[10px] text-slate-400 font-bold select-none bg-slate-50">Logo</span>
                      )}
                    </div>

                    {/* 4. Header Text */}
                    <div
                      onMouseDown={e => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setDraggingBuilder({
                          key: 'header',
                          offsetX: e.clientX - rect.left,
                          offsetY: e.clientY - rect.top
                        });
                        setActiveBuilderElement('header');
                      }}
                      style={{
                        position: 'absolute',
                        left: `${builderSettings.header_pos.x * 2.525}px`,
                        top: `${builderSettings.header_pos.y * 2.525}px`,
                        width: `${builderSettings.header_pos.width * 2.525}px`,
                        fontSize: `${builderSettings.header_pos.fontSize * 0.9}px`,
                        textAlign: builderSettings.header_pos.align as any,
                        color: tenantInfo?.primary_color ?? '#7A0F1F',
                      }}
                      className={`cursor-move p-1 font-bold border-2 leading-tight ${activeBuilderElement === 'header' ? 'border-secondary bg-white/80 z-10' : 'border-transparent hover:border-slate-200'}`}
                    >
                      {builderSettings.header_text}
                    </div>

                    {/* 5. Dynamic Field: Student Name */}
                    <div
                      onMouseDown={e => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setDraggingBuilder({
                          key: 'name',
                          offsetX: e.clientX - rect.left,
                          offsetY: e.clientY - rect.top
                        });
                        setActiveBuilderElement('name');
                      }}
                      style={{
                        position: 'absolute',
                        left: `${fields.name.x * 2.525}px`,
                        top: `${fields.name.y * 2.525}px`,
                        width: `${fields.name.width * 2.525}px`,
                        fontSize: `${fields.name.fontSize * 0.9}px`,
                        textAlign: fields.name.align as any,
                      }}
                      className={`cursor-move p-2 border-2 font-bold text-slate-900 leading-tight bg-slate-50/50 ${activeBuilderElement === 'name' ? 'border-secondary bg-white z-10' : 'border-primary/40'}`}
                    >
                      [Nombre del Alumno]
                    </div>

                    {/* 6. Body Text */}
                    <div
                      onMouseDown={e => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setDraggingBuilder({
                          key: 'body',
                          offsetX: e.clientX - rect.left,
                          offsetY: e.clientY - rect.top
                        });
                        setActiveBuilderElement('body');
                      }}
                      style={{
                        position: 'absolute',
                        left: `${builderSettings.body_pos.x * 2.525}px`,
                        top: `${builderSettings.body_pos.y * 2.525}px`,
                        width: `${builderSettings.body_pos.width * 2.525}px`,
                        fontSize: `${builderSettings.body_pos.fontSize * 0.9}px`,
                        textAlign: builderSettings.body_pos.align as any,
                      }}
                      className={`cursor-move p-1 text-slate-600 border-2 leading-relaxed whitespace-pre-line ${activeBuilderElement === 'body' ? 'border-secondary bg-white/80 z-10' : 'border-transparent hover:border-slate-200'}`}
                    >
                      {builderSettings.body_text}
                    </div>

                    {/* 7. Signature Image */}
                    <div
                      onMouseDown={e => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setDraggingBuilder({
                          key: 'signature_img_1',
                          offsetX: e.clientX - rect.left,
                          offsetY: e.clientY - rect.top
                        });
                        setActiveBuilderElement('signature_img_1');
                      }}
                      style={{
                        position: 'absolute',
                        left: `${builderSettings.signature_img_pos_1.x * 2.525}px`,
                        top: `${builderSettings.signature_img_pos_1.y * 2.525}px`,
                        width: `${builderSettings.signature_img_pos_1.width * 2.525}px`,
                        height: `${builderSettings.signature_img_pos_1.height * 2.525}px`,
                      }}
                      className={`cursor-move overflow-hidden border-2 ${activeBuilderElement === 'signature_img_1' ? 'border-secondary z-10' : 'border-slate-300 border-dashed'}`}
                    >
                      {builderSettings.signature_img_1 ? (
                        <img 
                          src={getFullUrl(builderSettings.signature_img_1)} 
                          alt="Firma" 
                          className="w-full h-full object-contain pointer-events-none" 
                        />
                      ) : (
                        <span className="flex items-center justify-center w-full h-full text-[10px] text-slate-400 font-bold select-none bg-slate-50">Firma (Imagen)</span>
                      )}
                    </div>

                    {/* 8. Signature Line & Text */}
                    <div
                      onMouseDown={e => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setDraggingBuilder({
                          key: 'signature_1',
                          offsetX: e.clientX - rect.left,
                          offsetY: e.clientY - rect.top
                        });
                        setActiveBuilderElement('signature_1');
                      }}
                      style={{
                        position: 'absolute',
                        left: `${builderSettings.signature_pos_1.x * 2.525}px`,
                        top: `${builderSettings.signature_pos_1.y * 2.525}px`,
                        width: `${builderSettings.signature_pos_1.width * 2.525}px`,
                        fontSize: `${builderSettings.signature_pos_1.fontSize * 0.9}px`,
                        textAlign: builderSettings.signature_pos_1.align as any,
                      }}
                      className={`cursor-move p-1 text-slate-700 border-2 font-medium leading-normal ${activeBuilderElement === 'signature_1' ? 'border-secondary bg-white/80 z-10' : 'border-transparent hover:border-slate-200'}`}
                    >
                      <div className="w-4/5 mx-auto border-t border-slate-400 mb-1 pointer-events-none" />
                      {builderSettings.signature_text_1}
                    </div>

                    {/* 9. Dynamic Field: Code */}
                    <div
                      onMouseDown={e => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setDraggingBuilder({
                          key: 'code',
                          offsetX: e.clientX - rect.left,
                          offsetY: e.clientY - rect.top
                        });
                        setActiveBuilderElement('code');
                      }}
                      style={{
                        position: 'absolute',
                        left: `${fields.code.x * 2.525}px`,
                        top: `${fields.code.y * 2.525}px`,
                        width: `${fields.code.width * 2.525}px`,
                        fontSize: `${fields.code.fontSize * 0.9}px`,
                        textAlign: fields.code.align as any,
                      }}
                      className={`cursor-move p-1 border-2 font-mono text-[11px] text-secondary bg-slate-50/50 ${activeBuilderElement === 'code' ? 'border-secondary bg-white z-10' : 'border-primary/40'}`}
                    >
                      Cód: [CÓDIGO]
                    </div>

                    {/* 10. Dynamic Field: Grade */}
                    <div
                      onMouseDown={e => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setDraggingBuilder({
                          key: 'grade',
                          offsetX: e.clientX - rect.left,
                          offsetY: e.clientY - rect.top
                        });
                        setActiveBuilderElement('grade');
                      }}
                      style={{
                        position: 'absolute',
                        left: `${fields.grade.x * 2.525}px`,
                        top: `${fields.grade.y * 2.525}px`,
                        width: `${fields.grade.width * 2.525}px`,
                        fontSize: `${fields.grade.fontSize * 0.9}px`,
                        textAlign: fields.grade.align as any,
                      }}
                      className={`cursor-move p-1 border-2 font-mono text-[11px] text-slate-700 bg-slate-50/50 ${activeBuilderElement === 'grade' ? 'border-secondary bg-white z-10' : 'border-primary/40'}`}
                    >
                      Nota: [NOTA]
                    </div>

                    {/* 11. Custom Rectangles */}
                    {(builderSettings.custom_rectangles || []).map(r => (
                      <div
                        key={r.id}
                        onMouseDown={e => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setDraggingBuilder({
                            key: `rect_${r.id}`,
                            offsetX: e.clientX - rect.left,
                            offsetY: e.clientY - rect.top
                          });
                          setActiveBuilderElement(`rect_${r.id}`);
                        }}
                        style={{
                          position: 'absolute',
                          left: `${r.x * 2.525}px`,
                          top: `${r.y * 2.525}px`,
                          width: `${r.width * 2.525}px`,
                          height: `${r.height * 2.525}px`,
                          border: `1px solid ${r.color || '#CCCCCC'}`,
                          backgroundColor: r.filled ? (r.color || '#CCCCCC') : 'transparent',
                        }}
                        className={`cursor-move ${activeBuilderElement === `rect_${r.id}` ? 'ring-2 ring-secondary z-10' : ''}`}
                      />
                    ))}

                    {/* 12. Custom Texts (Paragraphs) */}
                    {(builderSettings.custom_texts || []).map(t => (
                      <div
                        key={t.id}
                        onMouseDown={e => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setDraggingBuilder({
                            key: `text_${t.id}`,
                            offsetX: e.clientX - rect.left,
                            offsetY: e.clientY - rect.top
                          });
                          setActiveBuilderElement(`text_${t.id}`);
                        }}
                        style={{
                          position: 'absolute',
                          left: `${t.x * 2.525}px`,
                          top: `${t.y * 2.525}px`,
                          width: `${t.width * 2.525}px`,
                          fontSize: `${t.fontSize * 0.9}px`,
                          textAlign: t.align as any,
                          color: '#323232',
                        }}
                        className={`cursor-move p-1 border-2 leading-tight whitespace-pre-line ${activeBuilderElement === `text_${t.id}` ? 'border-secondary bg-white/80 z-10' : 'border-transparent hover:border-slate-200'}`}
                      >
                        {t.text || '(Vacío)'}
                      </div>
                    ))}

                    {/* 13. Custom Logos (Images) */}
                    {(builderSettings.custom_logos || []).map(l => (
                      <div
                        key={l.id}
                        onMouseDown={e => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setDraggingBuilder({
                            key: `logo_${l.id}`,
                            offsetX: e.clientX - rect.left,
                            offsetY: e.clientY - rect.top
                          });
                          setActiveBuilderElement(`logo_${l.id}`);
                        }}
                        style={{
                          position: 'absolute',
                          left: `${l.x * 2.525}px`,
                          top: `${l.y * 2.525}px`,
                          width: `${l.width * 2.525}px`,
                          height: `${l.height * 2.525}px`,
                        }}
                        className={`cursor-move overflow-hidden border-2 ${activeBuilderElement === `logo_${l.id}` ? 'border-secondary z-10' : 'border-slate-300 border-dashed'}`}
                      >
                        {l.logo_path ? (
                          <img
                            src={getFullUrl(l.logo_path)}
                            alt="Logo Adicional"
                            className="w-full h-full object-contain pointer-events-none"
                          />
                        ) : (
                          <span className="flex items-center justify-center w-full h-full text-[9px] text-slate-400 font-bold select-none bg-slate-50">Logo Adic.</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {!templateFile && !loadingTemplate && (
                    <div className="flex min-h-[420px] items-center justify-center bg-slate-100 text-slate-400 text-sm">
                      Sube una plantilla PDF o selecciona una guardada
                    </div>
                  )}

                  {templateFile && pagePreviews.map(page => (
                    <div key={page.pageNumber} className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-400">
                        <span>Pagina {page.pageNumber}</span>
                        <span>{page.width}px x {page.height}px</span>
                      </div>
                      <div
                        onMouseMove={event => onPageMove(event, page.pageNumber)}
                        onMouseUp={() => setDragging(null)}
                        onMouseLeave={() => setDragging(null)}
                        className="relative inline-block bg-slate-100 shadow-sm"
                      >
                        <canvas
                          ref={node => { pageCanvasRefs.current[page.pageNumber] = node; }}
                          className="block"
                        />
                        {(Object.keys(fields) as FieldKey[])
                          .filter(key => fields[key].page === page.pageNumber)
                          .map(key => (
                            <div
                              key={key}
                              onMouseDown={event => {
                                const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
                                setDragging({
                                  key,
                                  page: page.pageNumber,
                                  offsetX: event.clientX - rect.left,
                                  offsetY: event.clientY - rect.top,
                                });
                                setActiveField(key);
                              }}
                              style={fieldStyle(key)}
                              className={`absolute cursor-move border-2 px-2 py-1 bg-white/70 text-primary font-bold select-none ${activeField === key ? 'border-secondary' : 'border-primary/40'}`}
                            >
                              {fieldLabels[key]}
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
