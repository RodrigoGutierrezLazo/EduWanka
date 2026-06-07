import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { CourseModule, ModuleSection, ContentItem, ContentType } from '@/lib/types';
import { ModuleTree } from '@/features/modules/ModuleTree';
import { AddContentModal } from '@/features/modules/AddContentModal';
import { ContentItemRow } from '@/features/modules/ContentItemRow';
import { CONTENT_FORM_MAP } from '@/features/modules/ContentForms';
import { CONTENT_TYPE_META } from '@/features/modules/contentTypeMeta';
import { Loader, Plus, BookOpen, Layers, AlertCircle, X, ChevronRight } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CourseDetail {
  id: number;
  title: string;
  code: string;
  modules: CourseModule[];
}

// ─── Modal Wrapper ───────────────────────────────────────────────────────────

const SidePanel: React.FC<{
  isOpen: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
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

// ─── Simple Form ─────────────────────────────────────────────────────────────

const SimpleForm: React.FC<{
  label: string;
  placeholder: string;
  initial?: string;
  onSubmit: (value: string) => void;
  loading?: boolean;
}> = ({ label, placeholder, initial = '', onSubmit, loading }) => {
  const [value, setValue] = useState(initial);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(value); }} className="space-y-4">
      <div>
        <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5">{label}</label>
        <input
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={placeholder}
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-primary text-white font-black uppercase text-sm tracking-widest rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md"
      >
        {loading ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  );
};

// ─── Course Selector (when no courseId in URL) ─────────────────────────────

interface CourseSummary { 
  id: number; 
  title: string; 
  code: string; 
  image_url?: string;
  type?: string;
  level?: string;
}

const resolveImg = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('/storage')) return url;
  return `/storage/${url.replace(/^\/+/, '')}`;
};

function CourseSelector({ onSelect }: { onSelect: (id: number) => void }) {
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['admin-courses-list'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/admin/courses?per_page=100');
      return (res.data.data ?? res.data) as CourseSummary[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <Layers className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800">Gestor de Materiales</h1>
          <p className="text-sm text-slate-500">Selecciona un curso para gestionar sus módulos</p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-soft">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400 font-bold">No hay cursos creados aún.</p>
          <p className="text-slate-400 text-sm mt-1">Ve a <strong>Gestión de Cursos</strong> para crear el primero.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {courses.map(course => (
            <button
              key={course.id}
              onClick={() => onSelect(course.id)}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all text-left flex flex-col group"
            >
              <div className="h-32 w-full bg-slate-100 relative overflow-hidden">
                {resolveImg(course.image_url) ? (
                  <img src={resolveImg(course.image_url)!} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100">
                    <BookOpen className="w-8 h-8 opacity-50" />
                  </div>
                )}
                {course.type && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/90 text-white backdrop-blur-sm shadow-sm">
                    {course.type}
                  </span>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between w-full">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2 mb-1">{course.title}</h3>
                  <p className="text-xs text-slate-400">{course.code}{course.level && ` • ${course.level}`}</p>
                </div>
                <div className="mt-4 flex items-center text-secondary text-xs font-bold gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Gestionar materiales <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminMaterialesRoute() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  // If no courseId, show course picker
  if (!courseId) {
    return (
      <CourseSelector
        onSelect={(id) => navigate(`/aula/admin/materiales/${id}`)}
      />
    );
  }

  return <AdminMaterialesManager courseId={courseId} />;
}

function AdminMaterialesManager({ courseId }: { courseId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const qKey = ['admin-modules', courseId];

  // State
  const [activeModule, setActiveModule] = useState<CourseModule | null>(null);
  const [activeSection, setActiveSection] = useState<ModuleSection | null>(null);
  const [showAddContent, setShowAddContent] = useState(false);
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [showAddModule, setShowAddModule] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [pendingModuleForSection, setPendingModuleForSection] = useState<CourseModule | null>(null);

  // ── Fetch Modules ───────────────────────────────────────────────────────────

  const { data: courseInfo } = useQuery({
    queryKey: ['admin-course-detail', courseId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/v1/admin/courses/${courseId}`);
      return res.data.data as CourseSummary;
    },
    enabled: !!courseId,
  });

  const { data: modules = [], isLoading, error } = useQuery({
    queryKey: qKey,
    queryFn: async () => {
      const res = await apiClient.get(`/api/v1/aula/courses/${courseId}/modules`);
      return res.data.data as CourseModule[];
    },
    enabled: !!courseId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qKey });

  // ── Mutations ───────────────────────────────────────────────────────────────

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

  // ── Computed ────────────────────────────────────────────────────────────────

  // Sync active module/section refs after re-fetch
  const freshModule = modules.find(m => m.id === activeModule?.id) ?? null;
  const freshSection = freshModule?.sections.find(s => s.id === activeSection?.id) ?? null;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleTypeSelected = (type: ContentType) => setSelectedType(type);

  const handleAddItem = (data: FormData | Record<string, unknown>) => {
    if (!freshSection) return;
    addItemMut.mutate({ sectionId: freshSection.id, data });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-8 rounded-3xl text-center border border-red-100">
        <AlertCircle className="w-10 h-10 mx-auto mb-3" />
        <p className="font-bold">Error cargando los módulos del curso.</p>
      </div>
    );
  }

  const ContentFormComponent = selectedType ? CONTENT_FORM_MAP[selectedType] : null;
  const EditFormComponent = editingItem ? CONTENT_FORM_MAP[editingItem.type] : null;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
          {courseInfo?.image_url ? (
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 shadow-sm border border-slate-200">
              <img src={resolveImg(courseInfo.image_url)!} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="p-4 bg-primary/10 rounded-2xl">
              <Layers className="w-8 h-8 text-primary" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-black text-slate-800 line-clamp-1">
              {courseInfo?.title || 'Gestor de Materiales'}
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              {courseInfo?.code && <span className="mr-2">{courseInfo.code}</span>}
              Curso ID: <span className="font-bold text-primary">#{courseId}</span>
              {' · '}Módulos y Secciones
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/aula/admin/materiales')}
          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:text-primary border border-slate-200 hover:border-primary/30 rounded-xl transition-all"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Cambiar curso
        </button>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[600px]">
        {/* LEFT: Module Tree Sidebar */}
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
                  : 'Selecciona una sección para gestionar su contenido'
                }
              </h3>
              <p className="text-sm text-slate-400 mt-2">
                {modules.length === 0
                  ? 'Usa el botón "Agregar Módulo" en el panel izquierdo.'
                  : 'O crea una nueva sección dentro de un módulo.'
                }
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
                  <Plus className="w-4 h-4" />
                  Añadir contenido
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

      {/* ── Modals ──────────────────────────────────────────────────────────── */}

      {/* Add Module */}
      <SidePanel isOpen={showAddModule} title="Nuevo Módulo" onClose={() => setShowAddModule(false)}>
        <SimpleForm
          label="Nombre del Módulo"
          placeholder="Ej: Módulo 1 — Fundamentos"
          onSubmit={addModuleMut.mutate}
          loading={addModuleMut.isPending}
        />
      </SidePanel>

      {/* Edit Module */}
      <SidePanel isOpen={!!editingModule} title="Editar Módulo" onClose={() => setEditingModule(null)}>
        {editingModule && (
          <SimpleForm
            label="Nombre del Módulo"
            placeholder="Nombre del módulo"
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
            label="Nombre de la Sección"
            placeholder="Ej: Sesión 1 — Conceptos Básicos"
            onSubmit={title => addSectionMut.mutate({ moduleId: pendingModuleForSection.id, title })}
            loading={addSectionMut.isPending}
          />
        )}
      </SidePanel>

      {/* Add Content Modal (type picker) */}
      <AddContentModal
        isOpen={showAddContent}
        onClose={() => setShowAddContent(false)}
        onSelectType={(type) => { handleTypeSelected(type); setShowAddContent(false); }}
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
