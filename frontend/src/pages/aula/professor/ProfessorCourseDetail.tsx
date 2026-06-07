/**
 * ProfessorCourseDetail — Sprint 12 Phase 2
 *
 * Full course management view for professors, using the same
 * module/section/item architecture as the admin panel.
 * All CRUD operations (modules, sections, content items) are
 * fully functional, calling the shared /api/v1/aula/ endpoints.
 */
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';
import type { CourseModule, ModuleSection, ContentItem, ContentType } from '../../../lib/types';
import { ModuleTree } from '../../../features/modules/ModuleTree';
import { AddContentModal } from '../../../features/modules/AddContentModal';
import { ContentItemRow } from '../../../features/modules/ContentItemRow';
import { CONTENT_FORM_MAP } from '../../../features/modules/ContentForms';
import { CONTENT_TYPE_META } from '../../../features/modules/contentTypeMeta';
import {
  Loader, AlertCircle, BookOpen, Users, Award, FileText,
  Plus, ChevronRight, X, Layers
} from 'lucide-react';

/* ── Side Panel ──────────────────────────────────────────────── */
const SidePanel: React.FC<{
  isOpen: boolean; title: string; subtitle?: string;
  onClose: () => void; children: React.ReactNode;
}> = ({ isOpen, title, subtitle, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-black text-slate-800">{title}</h3>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
};

/* ── Simple Name Form ────────────────────────────────────────── */
const SimpleForm: React.FC<{
  label: string; placeholder: string; initial?: string;
  onSubmit: (value: string) => void; loading?: boolean;
}> = ({ label, placeholder, initial = '', onSubmit, loading }) => {
  const [value, setValue] = useState(initial);
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(value); }} className="space-y-4">
      <div>
        <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5">{label}</label>
        <input
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm"
          value={value} onChange={e => setValue(e.target.value)} placeholder={placeholder} required
        />
      </div>
      <button type="submit" disabled={loading}
        className="w-full py-3 bg-primary text-white font-black uppercase text-sm tracking-widest rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md">
        {loading ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  );
};

/* ── Resolve Image ───────────────────────────────────────────── */
const resolveImg = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('/storage')) return url;
  return `/storage/${url.replace(/^\/+/, '')}`;
};

/* ── Main Component ──────────────────────────────────────────── */
export default function ProfessorCourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const qKey = ['prof-modules', courseId];

  // UI state
  const [activeModule, setActiveModule] = useState<CourseModule | null>(null);
  const [activeSection, setActiveSection] = useState<ModuleSection | null>(null);
  const [showAddContent, setShowAddContent] = useState(false);
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [showAddModule, setShowAddModule] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [pendingModuleForSection, setPendingModuleForSection] = useState<CourseModule | null>(null);

  // ── Fetch course info ───────────────────────────────────────
  const { data: course, isLoading: courseLoading, error: courseError } = useQuery({
    queryKey: ['prof-course-detail', courseId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/v1/prof/courses/${courseId}`);
      return res.data.data;
    },
    enabled: !!courseId,
  });

  // ── Fetch modules ───────────────────────────────────────────
  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: qKey,
    queryFn: async () => {
      const res = await apiClient.get(`/api/v1/aula/courses/${courseId}/modules`);
      return res.data.data as CourseModule[];
    },
    enabled: !!courseId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qKey });

  // ── Mutations ───────────────────────────────────────────────
  const addModuleMut = useMutation({
    mutationFn: (title: string) =>
      apiClient.post(`/api/v1/aula/courses/${courseId}/modules`, { title }),
    onSuccess: () => { invalidate(); setShowAddModule(false); },
  });

  const editModuleMut = useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) =>
      apiClient.put(`/api/v1/aula/modules/${id}`, { title }),
    onSuccess: () => { invalidate(); setEditingModule(null); },
  });

  const deleteModuleMut = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/api/v1/aula/modules/${id}`),
    onSuccess: () => { invalidate(); setActiveModule(null); setActiveSection(null); },
  });

  const addSectionMut = useMutation({
    mutationFn: ({ moduleId, title }: { moduleId: number; title: string }) =>
      apiClient.post(`/api/v1/aula/modules/${moduleId}/sections`, { title }),
    onSuccess: () => { invalidate(); setShowAddSection(false); },
  });

  const deleteSectionMut = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/api/v1/aula/sections/${id}`),
    onSuccess: () => { invalidate(); setActiveSection(null); },
  });

  const addItemMut = useMutation({
    mutationFn: ({ sectionId, data }: { sectionId: number; data: FormData | Record<string, unknown> }) => {
      const isFormData = data instanceof FormData;
      data = isFormData ? data : { ...data, type: selectedType };
      return apiClient.post(`/api/v1/aula/sections/${sectionId}/items`, data, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
      });
    },
    onSuccess: () => { invalidate(); setSelectedType(null); setShowAddContent(false); },
  });

  const editItemMut = useMutation({
    mutationFn: ({ itemId, data }: { itemId: number; data: FormData | Record<string, unknown> }) => {
      const isFormData = data instanceof FormData;
      if (isFormData) {
        data.append('_method', 'PUT');
        return apiClient.post(`/api/v1/aula/items/${itemId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      return apiClient.put(`/api/v1/aula/items/${itemId}`, data);
    },
    onSuccess: () => { invalidate(); setEditingItem(null); },
  });

  const deleteItemMut = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/api/v1/aula/items/${id}`),
    onSuccess: () => invalidate(),
  });

  const togglePublishMut = useMutation({
    mutationFn: ({ id, published }: { id: number; published: boolean }) =>
      apiClient.put(`/api/v1/aula/items/${id}`, { published }),
    onSuccess: () => invalidate(),
  });

  // ── Computed ────────────────────────────────────────────────
  const freshModule = modules.find(m => m.id === activeModule?.id) ?? null;
  const freshSection = freshModule?.sections.find(s => s.id === activeSection?.id) ?? null;

  const handleAddItem = (data: FormData | Record<string, unknown>) => {
    if (!freshSection) return;
    addItemMut.mutate({ sectionId: freshSection.id, data });
  };

  const ContentFormComponent = selectedType ? CONTENT_FORM_MAP[selectedType] : null;
  const EditFormComponent = editingItem ? CONTENT_FORM_MAP[editingItem.type] : null;

  const isLoading = courseLoading || modulesLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader className="w-10 h-10 animate-spin text-secondary mb-4" />
        <p className="text-slate-500 font-medium">Cargando detalles del curso...</p>
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="bg-red-50 border border-red-100 p-6 rounded-2xl text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-red-800">Acceso denegado</h3>
        <p className="text-red-600 mt-2 mb-6">El curso no existe o no te pertenece.</p>
        <Link to="/aula/prof/cursos" className="px-6 py-2 bg-primary text-white rounded-full font-bold">
          Volver a mis cursos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* ── Course Header ──────────────────────────────────────── */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden">
        <div className="h-48 bg-primary relative">
          {course.image_url && (
            <img
              src={resolveImg(course.image_url) || ''}
              className="w-full h-full object-cover opacity-50" alt=""
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-primary to-transparent" />
          <div className="absolute bottom-8 left-8 right-8">
            <Link to="/aula/prof/cursos" className="text-white/60 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-2 transition-colors">
              <ChevronRight className="w-3 h-3 rotate-180" /> Mis Cursos
            </Link>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-white leading-tight">{course.title}</h1>
                <p className="text-white/70 font-medium mt-1">{course.code} • {course.type}</p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to={`/aula/prof/cursos/${courseId}/alumnos`}
                  className="px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white text-xs font-bold hover:bg-white/20 transition-all flex items-center gap-2"
                >
                  <Users className="w-4 h-4" /> Ver Alumnos
                </Link>
                <Link
                  to={`/aula/prof/cursos/${courseId}/certificados`}
                  className="px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white text-xs font-bold hover:bg-white/20 transition-all flex items-center gap-2"
                >
                  <Award className="w-4 h-4" /> Certificados
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Module Management (same as Admin) ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[600px]">
        {/* LEFT: Module Tree */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-soft p-4 sticky top-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 px-2">Estructura</h2>
            <ModuleTree
              modules={modules}
              activeModuleId={freshModule?.id}
              activeSectionId={freshSection?.id}
              onSelectModule={m => { setActiveModule(m); setActiveSection(null); }}
              onSelectSection={(s, m) => { setActiveModule(m); setActiveSection(s); }}
              onAddModule={() => setShowAddModule(true)}
              onAddSection={m => { setPendingModuleForSection(m); setShowAddSection(true); }}
              onEditModule={m => setEditingModule(m)}
              onDeleteModule={m => {
                if (confirm(`¿Eliminar el módulo "${m.title}" y todo su contenido?`)) {
                  deleteModuleMut.mutate(m.id);
                }
              }}
              onDeleteSection={s => {
                if (confirm(`¿Eliminar la sección "${s.title}"?`)) {
                  deleteSectionMut.mutate(s.id);
                }
              }}
            />
          </div>
        </div>

        {/* RIGHT: Content Panel */}
        <div className="lg:col-span-3">
          {!freshSection ? (
            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-black text-slate-400">
                {modules.length === 0
                  ? 'Comienza creando tu primer módulo'
                  : 'Selecciona una sección para gestionar su contenido'}
              </h3>
              <p className="text-sm text-slate-400 mt-2">
                {modules.length === 0
                  ? 'Usa el botón "Agregar Módulo" en el panel izquierdo.'
                  : 'O crea una nueva sección dentro de un módulo.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
              {/* Section Header */}
              <div className="px-8 py-5 bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-primary mb-0.5">
                    {freshModule?.title}
                  </p>
                  <h2 className="text-xl font-black text-slate-800">{freshSection.title}</h2>
                </div>
                <button
                  onClick={() => setShowAddContent(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-black text-sm rounded-xl hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
                >
                  <Plus className="w-4 h-4" /> Añadir contenido
                </button>
              </div>

              {/* Items List */}
              <div className="p-6 space-y-2">
                {freshSection.items.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold text-sm">Esta sección aún no tiene contenido.</p>
                    <p className="text-slate-400 text-xs mt-1">Haz clic en "Añadir contenido" para comenzar.</p>
                  </div>
                ) : (
                  [...freshSection.items].sort((a, b) => a.order - b.order).map(item => (
                    <ContentItemRow
                      key={item.id}
                      item={item}
                      onEdit={setEditingItem}
                      onDelete={i => {
                        if (confirm(`¿Eliminar "${i.title}"?`)) deleteItemMut.mutate(i.id);
                      }}
                      onTogglePublish={i => togglePublishMut.mutate({ id: i.id, published: !i.published })}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────── */}

      {/* Add Module */}
      <SidePanel isOpen={showAddModule} title="Nuevo Módulo" onClose={() => setShowAddModule(false)}>
        <SimpleForm
          label="Nombre del Módulo" placeholder="Ej: Módulo 1 — Fundamentos"
          onSubmit={addModuleMut.mutate} loading={addModuleMut.isPending}
        />
      </SidePanel>

      {/* Edit Module */}
      <SidePanel isOpen={!!editingModule} title="Editar Módulo" onClose={() => setEditingModule(null)}>
        {editingModule && (
          <SimpleForm
            label="Nombre del Módulo" placeholder="Nombre del módulo"
            initial={editingModule.title}
            onSubmit={title => editModuleMut.mutate({ id: editingModule.id, title })}
            loading={editModuleMut.isPending}
          />
        )}
      </SidePanel>

      {/* Add Section */}
      <SidePanel isOpen={showAddSection} title="Nueva Sección" subtitle={pendingModuleForSection?.title} onClose={() => setShowAddSection(false)}>
        {pendingModuleForSection && (
          <SimpleForm
            label="Nombre de la Sección" placeholder="Ej: Sesión 1 — Conceptos Básicos"
            onSubmit={title => addSectionMut.mutate({ moduleId: pendingModuleForSection.id, title })}
            loading={addSectionMut.isPending}
          />
        )}
      </SidePanel>

      {/* Add Content Modal (type picker) */}
      <AddContentModal
        isOpen={showAddContent}
        onClose={() => setShowAddContent(false)}
        onSelectType={(type) => { setSelectedType(type); setShowAddContent(false); }}
      />

      {/* Content Form Panel */}
      <SidePanel
        isOpen={!!selectedType}
        title={selectedType ? `Añadir ${CONTENT_TYPE_META[selectedType].label}` : ''}
        subtitle={freshSection?.title}
        onClose={() => setSelectedType(null)}
      >
        {selectedType && ContentFormComponent && (
          <ContentFormComponent
            onSubmit={handleAddItem}
            loading={addItemMut.isPending}
          />
        )}
      </SidePanel>

      {/* Edit Item Panel */}
      <SidePanel
        isOpen={!!editingItem}
        title={editingItem ? `Editar ${CONTENT_TYPE_META[editingItem.type].label}` : ''}
        onClose={() => setEditingItem(null)}
      >
        {editingItem && EditFormComponent && (
          <EditFormComponent
            initial={editingItem}
            onSubmit={data => editItemMut.mutate({ itemId: editingItem.id, data: data as Record<string, unknown> })}
            loading={editItemMut.isPending}
          />
        )}
      </SidePanel>
    </div>
  );
}
