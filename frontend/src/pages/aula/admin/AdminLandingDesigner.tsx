import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { 
  Eye, EyeOff, ArrowUp, ArrowDown, Trash2, Plus, 
  Settings, Loader, Save, GripVertical, CheckCircle, HelpCircle, 
  Award, BookOpen, Star, Sparkles, MessageSquare, Image, ArrowRight,
  Info, Landmark, Target, Shield, Users, FileText, GraduationCap, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';

interface Section {
  id: string;
  type: string;
  enabled: boolean;
  content: any;
}

const sectionLabels: Record<string, string> = {
  hero: 'Hero / Cabecera Principal',
  benefits: 'Beneficios / Características',
  stats: 'Estadísticas / Impacto',
  mission_vision: 'Misión, Visión y Valores',
  programs: 'Programas Académicos (Cursos)',
  specialties: 'Especialidades',
  testimonials: 'Testimonios en Vídeo',
  convenios: 'Convenios y Socios',
  cta: 'Llamado a la Acción (CTA)',
  faq: 'Preguntas Frecuentes (FAQ)',
  custom_html: 'Contenido HTML / Texto Libre'
};

const defaultContent: Record<string, any> = {
  hero: {
    badge: 'Excelencia Académica',
    title: 'Forjando el Futuro de los {Profesionales}',
    description: 'Institución líder dedicada a la formación continua, ofreciendo programas académicos de vanguardia.',
    bg_url: '/storage/hero/hero_law_bg.png'
  },
  benefits: {
    title: 'Una Plataforma Diseñada para tu Éxito',
    subtitle: 'Todo lo que necesitas para tu desarrollo profesional.',
    cards: [
      { title: 'Gestión Avanzada', desc: 'Controla tus cursos, notas y asistencias desde un solo lugar.' },
      { title: 'Pagos en Línea', desc: 'Paga tus matrículas de forma fácil y segura mediante múltiples opciones.' },
      { title: 'Certificación Oficial', desc: 'Obtén certificados con código QR listos para verificar y descargar.' }
    ]
  },
  stats: {
    students_count: '5000',
    courses_count: '50',
    teachers_count: '25',
    satisfaction_percent: '98'
  },
  mission_vision: {
    title: 'Institución de Excelencia',
    description: 'Valores y pilares fundamentales que guían nuestro compromiso con la educación superior y el éxito profesional.',
    mision_title: 'Nuestra Misión',
    mision_desc: 'Formar profesionales altamente capacitados mediante educación de excelencia, metodologías innovadoras y un enfoque práctico.',
    vision_title: 'Nuestra Visión',
    vision_desc: 'Ser la institución líder en educación continua, reconocida por la calidad de nuestros programas.',
    valores_title: 'Nuestros Valores',
    valores_desc: 'Excelencia académica, integridad profesional, innovación constante y compromiso social.'
  },
  programs: {
    title: 'Programas Académicos',
    subtitle: 'Desarrolla tu potencial con nuestros programas estructurados para la excelencia.'
  },
  specialties: {
    title: 'Nuestras Especialidades',
    subtitle: 'Rutas formativas especializadas para destacar en el ámbito profesional.'
  },
  testimonials: {
    title: 'Lo que dicen nuestros estudiantes',
    subtitle: 'Testimonios reales de egresados que transformaron su futuro con nosotros.',
    list: [
      { name: 'Andrea Rivas', role: 'Egresada de Gestión', quote: 'EduWanka cambió mi perspectiva sobre el liderazgo. Los docentes comparten experiencias reales.', video_url: '' }
    ]
  },
  convenios: {
    logos: ['UNT.png']
  },
  cta: {
    title: '¿Listo para iniciar tu formación?',
    desc: 'Regístrate hoy y accede a una educación de primer nivel diseñada para el mundo real.',
    btn_text: 'Matricularse Ahora',
    btn_url: '/login'
  },
  faq: {
    title: 'Preguntas Frecuentes',
    subtitle: 'Resolvemos tus dudas principales sobre nuestros programas y metodología.',
    list: [
      { question: '¿Cómo obtengo mi certificado?', answer: 'Una vez culminado y aprobado el curso, el certificado se emite automáticamente con firma digital y código QR.' },
      { question: '¿Cuáles son las modalidades de pago?', answer: 'Aceptamos transferencias bancarias, Yape y Plin directos de cada institución.' }
    ]
  },
  custom_html: {
    title: 'Sección Informativa',
    html_content: '<div class="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-center"><p class="text-slate-600">Puedes escribir código HTML o texto enriquecido aquí.</p></div>'
  }
};

export default function AdminLandingDesigner() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showAddDropdown, setShowAddDropdown] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/api/v1/settings/hero');
      if (data.data?.home_landing_sections) {
        setSections(data.data.home_landing_sections);
        if (data.data.home_landing_sections.length > 0) {
          setActiveSectionId(data.data.home_landing_sections[0].id);
        }
      }
    } catch {
      setMessage('Error al cargar la estructura de la portada.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await apiClient.put('/api/v1/admin/settings/landing-sections', { sections });
      setMessage('Estructura de la portada guardada con éxito.');
      toast.success('Cambios guardados con éxito.');
    } catch {
      setMessage('Error al guardar la estructura de la portada.');
      toast.error('No se pudo guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= sections.length) return;

    setSections(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[nextIndex];
      copy[nextIndex] = temp;
      return copy;
    });
  };

  const deleteSection = (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta sección de la portada?')) return;
    setSections(prev => prev.filter(s => s.id !== id));
    if (activeSectionId === id) {
      setActiveSectionId(sections[0]?.id || null);
    }
  };

  const addSection = (type: string) => {
    const newId = `${type}_${Date.now()}`;
    const newSection: Section = {
      id: newId,
      type,
      enabled: true,
      content: JSON.parse(JSON.stringify(defaultContent[type] || { title: 'Nueva Sección', subtitle: 'Ajusta este texto' }))
    };
    setSections(prev => [...prev, newSection]);
    setActiveSectionId(newId);
    setShowAddDropdown(false);
    toast.success(`Sección "${sectionLabels[type] || type}" añadida.`);
  };

  const updateContentProp = (sectionId: string, prop: string, val: any) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        content: {
          ...s.content,
          [prop]: val
        }
      };
    }));
  };

  const updateCardProp = (sectionId: string, cardIndex: number, prop: string, val: any) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const cards = [...(s.content.cards || [])];
      cards[cardIndex] = { ...cards[cardIndex], [prop]: val };
      return { ...s, content: { ...s.content, cards } };
    }));
  };

  const updateListProp = (sectionId: string, itemIndex: number, prop: string, val: any) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const list = [...(s.content.list || [])];
      list[itemIndex] = { ...list[itemIndex], [prop]: val };
      return { ...s, content: { ...s.content, list } };
    }));
  };

  const removeListItem = (sectionId: string, itemIndex: number) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const list = (s.content.list || []).filter((_: any, idx: number) => idx !== itemIndex);
      return { ...s, content: { ...s.content, list } };
    }));
  };

  const addListItem = (sectionId: string, itemTemplate: any) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const list = [...(s.content.list || []), itemTemplate];
      return { ...s, content: { ...s.content, list } };
    }));
  };

  const uploadSectionBg = async (file: File, sectionId: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'tenant_logos');
    try {
      const { data } = await apiClient.post('/api/v1/admin/settings/upload-file', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateContentProp(sectionId, 'bg_url', data.url);
      setMessage('Imagen de fondo subida con éxito.');
      toast.success('Imagen subida correctamente.');
    } catch {
      setMessage('Error al subir la imagen.');
      toast.error('Error al subir el archivo.');
    }
  };

  const uploadConvenioLogo = async (file: File, sectionId: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'convenios');
    try {
      const { data } = await apiClient.post('/api/v1/admin/settings/upload-file', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSections(prev => prev.map(s => {
        if (s.id !== sectionId) return s;
        const currentLogos = s.content.logos || [];
        return {
          ...s,
          content: {
            ...s.content,
            logos: [...currentLogos, data.url]
          }
        };
      }));
      setMessage('Logo de convenio subido con éxito.');
      toast.success('Logo de convenio agregado.');
    } catch {
      setMessage('Error al subir el logo.');
      toast.error('Error al subir el archivo.');
    }
  };

  const activeSection = sections.find(s => s.id === activeSectionId);

  const renderActiveSectionForm = () => {
    if (!activeSection) return <p className="text-slate-400 text-xs italic">Selecciona una sección para configurarla</p>;

    const type = activeSection.type;
    const content = activeSection.content || {};

    if (type === 'hero') {
      return (
        <div className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Badge / Etiqueta Superior</label>
            <input 
              type="text" 
              value={content.badge || ''} 
              onChange={e => updateContentProp(activeSection.id, 'badge', e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" 
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Título del Hero (Destaca usando {"{texto}"})</label>
            <input 
              type="text" 
              value={content.title || ''} 
              onChange={e => updateContentProp(activeSection.id, 'title', e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" 
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Descripción</label>
            <textarea 
              value={content.description || ''} 
              onChange={e => updateContentProp(activeSection.id, 'description', e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm h-24" 
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Imagen de Fondo</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) uploadSectionBg(file, activeSection.id);
              }} 
              className="text-xs" 
            />
            {content.bg_url && (
              <p className="text-[10px] text-green-600 font-bold mt-1">✓ Fondo: {content.bg_url}</p>
            )}
          </div>
        </div>
      );
    }

    if (type === 'benefits') {
      return (
        <div className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Título de Sección</label>
            <input 
              type="text" 
              value={content.title || ''} 
              onChange={e => updateContentProp(activeSection.id, 'title', e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" 
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Subtítulo</label>
            <input 
              type="text" 
              value={content.subtitle || ''} 
              onChange={e => updateContentProp(activeSection.id, 'subtitle', e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" 
            />
          </div>
          
          <div className="space-y-3 pt-2">
            <p className="text-xs font-bold text-slate-700">Tarjetas de Beneficio (Max 3)</p>
            {(content.cards || []).map((card: any, idx: number) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <p className="text-[10px] font-black text-slate-400">TARJETA {idx + 1}</p>
                <input 
                  type="text" 
                  value={card.title || ''} 
                  placeholder="Título beneficio"
                  onChange={e => updateCardProp(activeSection.id, idx, 'title', e.target.value)} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs" 
                />
                <textarea 
                  value={card.desc || ''} 
                  placeholder="Descripción beneficio"
                  onChange={e => updateCardProp(activeSection.id, idx, 'desc', e.target.value)} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs h-16" 
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (type === 'stats') {
      return (
        <div className="space-y-4 text-left">
          <p className="text-xs text-slate-500">Métricas de impacto con contadores animados.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Estudiantes</label>
              <input 
                type="number" 
                value={content.students_count || ''} 
                onChange={e => updateContentProp(activeSection.id, 'students_count', e.target.value)} 
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cursos</label>
              <input 
                type="number" 
                value={content.courses_count || ''} 
                onChange={e => updateContentProp(activeSection.id, 'courses_count', e.target.value)} 
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Docentes</label>
              <input 
                type="number" 
                value={content.teachers_count || ''} 
                onChange={e => updateContentProp(activeSection.id, 'teachers_count', e.target.value)} 
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Satis. (%)</label>
              <input 
                type="number" 
                value={content.satisfaction_percent || ''} 
                onChange={e => updateContentProp(activeSection.id, 'satisfaction_percent', e.target.value)} 
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" 
              />
            </div>
          </div>
        </div>
      );
    }

    if (type === 'mission_vision') {
      return (
        <div className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Título Sección</label>
            <input 
              type="text" 
              value={content.title || ''} 
              onChange={e => updateContentProp(activeSection.id, 'title', e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" 
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Descripción General</label>
            <textarea 
              value={content.description || ''} 
              onChange={e => updateContentProp(activeSection.id, 'description', e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm h-16" 
            />
          </div>
          
          <div className="border-t border-slate-100 pt-3 space-y-3">
            <p className="text-xs font-bold text-slate-700">Misión</p>
            <input 
              type="text" 
              value={content.mision_title || ''} 
              onChange={e => updateContentProp(activeSection.id, 'mision_title', e.target.value)} 
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold" 
            />
            <textarea 
              value={content.mision_desc || ''} 
              onChange={e => updateContentProp(activeSection.id, 'mision_desc', e.target.value)} 
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs h-16" 
            />
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-3">
            <p className="text-xs font-bold text-slate-700">Visión</p>
            <input 
              type="text" 
              value={content.vision_title || ''} 
              onChange={e => updateContentProp(activeSection.id, 'vision_title', e.target.value)} 
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold" 
            />
            <textarea 
              value={content.vision_desc || ''} 
              onChange={e => updateContentProp(activeSection.id, 'vision_desc', e.target.value)} 
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs h-16" 
            />
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-3">
            <p className="text-xs font-bold text-slate-700">Valores</p>
            <input 
              type="text" 
              value={content.valores_title || ''} 
              onChange={e => updateContentProp(activeSection.id, 'valores_title', e.target.value)} 
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold" 
            />
            <textarea 
              value={content.valores_desc || ''} 
              onChange={e => updateContentProp(activeSection.id, 'valores_desc', e.target.value)} 
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs h-16" 
            />
          </div>
        </div>
      );
    }

    if (type === 'programs' || type === 'specialties') {
      return (
        <div className="space-y-4 text-left">
          <p className="text-xs text-slate-500">Muestra los cursos o especialidades del catálogo del aula de forma dinámica.</p>
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Título Sección</label>
            <input 
              type="text" 
              value={content.title || ''} 
              onChange={e => updateContentProp(activeSection.id, 'title', e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" 
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Subtítulo</label>
            <input 
              type="text" 
              value={content.subtitle || ''} 
              onChange={e => updateContentProp(activeSection.id, 'subtitle', e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" 
            />
          </div>
        </div>
      );
    }

    if (type === 'testimonials') {
      return (
        <div className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Título Sección</label>
            <input 
              type="text" 
              value={content.title || ''} 
              onChange={e => updateContentProp(activeSection.id, 'title', e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" 
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Subtítulo</label>
            <input 
              type="text" 
              value={content.subtitle || ''} 
              onChange={e => updateContentProp(activeSection.id, 'subtitle', e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" 
            />
          </div>
          
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold text-slate-700">Listado de Testimonios</p>
              <button 
                type="button" 
                onClick={() => addListItem(activeSection.id, { name: 'Nuevo Alumno', role: 'Estudiante', quote: 'Excelente experiencia...', image_url: '', video_url: '' })}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-1 rounded"
              >
                <Plus className="w-3 h-3" /> Agregar
              </button>
            </div>
            
            {(content.list || []).map((t: any, idx: number) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 relative">
                <button 
                  type="button" 
                  onClick={() => removeListItem(activeSection.id, idx)} 
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 animate-fadeIn"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <p className="text-[10px] font-black text-slate-400">TESTIMONIO {idx + 1}</p>
                <input 
                  type="text" 
                  value={t.name || ''} 
                  placeholder="Nombre"
                  onChange={e => updateListProp(activeSection.id, idx, 'name', e.target.value)} 
                  className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs" 
                />
                <input 
                  type="text" 
                  value={t.role || ''} 
                  placeholder="Rol/Cargo"
                  onChange={e => updateListProp(activeSection.id, idx, 'role', e.target.value)} 
                  className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs" 
                />
                <textarea 
                  value={t.quote || ''} 
                  placeholder="Cita"
                  onChange={e => updateListProp(activeSection.id, idx, 'quote', e.target.value)} 
                  className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs h-16" 
                />
                <input 
                  type="text" 
                  value={t.video_url || ''} 
                  placeholder="URL de Video (opcional)"
                  onChange={e => updateListProp(activeSection.id, idx, 'video_url', e.target.value)} 
                  className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs" 
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (type === 'convenios') {
      return (
        <div className="space-y-4 text-left">
          <p className="text-xs text-slate-500">Administra los logos de tus aliados o convenios académicos que se desplazan infinitamente en la portada.</p>
          
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Subir Nuevo Logo</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) uploadConvenioLogo(file, activeSection.id);
              }} 
              className="text-xs" 
            />
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2">
            <p className="text-xs font-bold text-slate-700">Logos Activos</p>
            <div className="grid grid-cols-2 gap-2">
              {(content.logos || []).map((logo: string, idx: number) => (
                <div key={idx} className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                  <img 
                    src={logo.startsWith('http') || logo.startsWith('/storage') ? logo : `/convenios/${logo}`} 
                    alt="logo" 
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    className="h-8 w-auto object-contain max-w-[80px]" 
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updatedLogos = (content.logos || []).filter((_: any, i: number) => i !== idx);
                      updateContentProp(activeSection.id, 'logos', updatedLogos);
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            {(content.logos || []).length === 0 && (
              <p className="text-[11px] text-slate-400 italic">No hay logos subidos. Se mostrarán los de EduWanka por defecto.</p>
            )}
          </div>
        </div>
      );
    }

    if (type === 'faq') {
      return (
        <div className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Título Sección</label>
            <input 
              type="text" 
              value={content.title || ''} 
              onChange={e => updateContentProp(activeSection.id, 'title', e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" 
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Subtítulo</label>
            <input 
              type="text" 
              value={content.subtitle || ''} 
              onChange={e => updateContentProp(activeSection.id, 'subtitle', e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" 
            />
          </div>
          
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold text-slate-700">Listado de Preguntas</p>
              <button 
                type="button" 
                onClick={() => addListItem(activeSection.id, { question: '¿Nueva Pregunta?', answer: 'Respuesta' })}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-1 rounded"
              >
                <Plus className="w-3 h-3" /> Agregar
              </button>
            </div>
            
            {(content.list || []).map((faq: any, idx: number) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 relative">
                <button 
                  type="button" 
                  onClick={() => removeListItem(activeSection.id, idx)} 
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <input 
                  type="text" 
                  value={faq.question || ''} 
                  placeholder="Pregunta"
                  onChange={e => updateListProp(activeSection.id, idx, 'question', e.target.value)} 
                  className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold" 
                />
                <textarea 
                  value={faq.answer || ''} 
                  placeholder="Respuesta"
                  onChange={e => updateListProp(activeSection.id, idx, 'answer', e.target.value)} 
                  className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs h-16" 
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (type === 'cta') {
      return (
        <div className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Título Llamativo</label>
            <input 
              type="text" 
              value={content.title || ''} 
              onChange={e => updateContentProp(activeSection.id, 'title', e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" 
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Descripción</label>
            <textarea 
              value={content.desc || ''} 
              onChange={e => updateContentProp(activeSection.id, 'desc', e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm h-20" 
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Texto del Botón</label>
              <input 
                type="text" 
                value={content.btn_text || ''} 
                onChange={e => updateContentProp(activeSection.id, 'btn_text', e.target.value)} 
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Enlace del Botón</label>
              <input 
                type="text" 
                value={content.btn_url || ''} 
                onChange={e => updateContentProp(activeSection.id, 'btn_url', e.target.value)} 
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" 
              />
            </div>
          </div>
        </div>
      );
    }

    if (type === 'custom_html') {
      return (
        <div className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Título Sección (opcional)</label>
            <input 
              type="text" 
              value={content.title || ''} 
              onChange={e => updateContentProp(activeSection.id, 'title', e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" 
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Contenido HTML / Texto Plano</label>
            <textarea 
              value={content.html_content || ''} 
              onChange={e => updateContentProp(activeSection.id, 'html_content', e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm h-56 font-mono text-xs" 
            />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div className="text-left">
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-secondary animate-pulse" /> Diseñador de Portada Modular
          </h2>
          <p className="text-xs text-slate-500 mt-1">Modifica el orden, estado y textos de las secciones visibles en el inicio público.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar Diseño
        </button>
      </div>

      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" /> {message}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader className="w-8 h-8 animate-spin text-secondary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
          {/* Secciones del Canvas */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estructura de Secciones</span>
              
              {/* Dropdown Menu for Section Additions */}
              <div className="relative">
                <button
                  onClick={() => setShowAddDropdown(!showAddDropdown)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar Sección <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {showAddDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-150 z-30 py-1.5 text-left animate-fadeIn">
                    <button onClick={() => addSection('benefits')} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Beneficios
                    </button>
                    <button onClick={() => addSection('stats')} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700">
                      <FileText className="w-3.5 h-3.5 text-slate-400" /> Estadísticas
                    </button>
                    <button onClick={() => addSection('mission_vision')} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700">
                      <Target className="w-3.5 h-3.5 text-slate-400" /> Misión, Visión
                    </button>
                    <button onClick={() => addSection('specialties')} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700">
                      <Landmark className="w-3.5 h-3.5 text-slate-400" /> Especialidades
                    </button>
                    <button onClick={() => addSection('testimonials')} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" /> Testimonios
                    </button>
                    <button onClick={() => addSection('convenios')} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700">
                      <Award className="w-3.5 h-3.5 text-slate-400" /> Convenios
                    </button>
                    <button onClick={() => addSection('faq')} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" /> FAQ (Preguntas)
                    </button>
                    <button onClick={() => addSection('cta')} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700">
                      <Sparkles className="w-3.5 h-3.5 text-slate-400" /> Llamado a Acción (CTA)
                    </button>
                    <button onClick={() => addSection('custom_html')} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700 border-t border-slate-50">
                      <Plus className="w-3.5 h-3.5 text-slate-400" /> Contenido HTML Libre
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2.5">
              {sections.map((section, idx) => (
                <div
                  key={section.id}
                  onClick={() => setActiveSectionId(section.id)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                    activeSectionId === section.id
                      ? 'border-secondary bg-secondary/[0.02] shadow-sm'
                      : 'border-slate-100 hover:border-slate-200 bg-slate-50/30'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {sectionLabels[section.type] || section.type}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">#{section.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSection(section.id); }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        section.enabled ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-50'
                      }`}
                      title={section.enabled ? 'Ocultar Sección' : 'Mostrar Sección'}
                    >
                      {section.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveSection(idx, 'up'); }}
                      disabled={idx === 0}
                      className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg disabled:opacity-30"
                      title="Subir"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveSection(idx, 'down'); }}
                      disabled={idx === sections.length - 1}
                      className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg disabled:opacity-30"
                      title="Bajar"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    {section.type !== 'hero' && section.type !== 'programs' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}
                        className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {sections.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No hay secciones configuradas. Agrega una nueva arriba.
                </div>
              )}
            </div>
          </div>

          {/* Formulario de Configuración Lateral */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 h-fit">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Settings className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-bold text-slate-700 uppercase">Configuración de Sección</span>
            </div>
            {renderActiveSectionForm()}
          </div>
        </div>
      )}
    </div>
  );
}
