import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, Edit2, GripVertical } from 'lucide-react';
import type { CourseModule, ModuleSection } from '@/lib/types';

interface ModuleTreeProps {
  modules: CourseModule[];
  activeModuleId?: number | null;
  activeSectionId?: number | null;
  onSelectModule: (module: CourseModule) => void;
  onSelectSection: (section: ModuleSection, module: CourseModule) => void;
  onAddModule: () => void;
  onAddSection: (module: CourseModule) => void;
  onEditModule: (module: CourseModule) => void;
  onDeleteModule: (module: CourseModule) => void;
  onDeleteSection: (section: ModuleSection) => void;
}

export const ModuleTree: React.FC<ModuleTreeProps> = ({
  modules,
  activeModuleId,
  activeSectionId,
  onSelectModule,
  onSelectSection,
  onAddModule,
  onAddSection,
  onEditModule,
  onDeleteModule,
  onDeleteSection,
}) => {
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set(modules.map(m => m.id)));

  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {/* Add Module Button */}
      <button
        onClick={onAddModule}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/5 border-2 border-dashed border-primary/20 text-primary font-bold text-sm hover:bg-primary/10 hover:border-primary/40 transition-all"
      >
        <Plus className="w-4 h-4" />
        Agregar Módulo
      </button>

      {[...modules].sort((a, b) => a.order - b.order).map((module) => {
        const isExpanded = expandedModules.has(module.id);
        const isActive = activeModuleId === module.id;

        return (
          <div key={module.id} className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            {/* Module Header */}
            <div
              className={`flex items-center gap-2 px-4 py-3 cursor-pointer transition-all ${
                isActive ? 'bg-primary text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <GripVertical className="w-4 h-4 opacity-30 cursor-grab" />

              <button
                onClick={() => toggleModule(module.id)}
                className="flex-shrink-0 p-0.5"
              >
                {isExpanded
                  ? <ChevronDown className="w-4 h-4" />
                  : <ChevronRight className="w-4 h-4" />
                }
              </button>

              <span
                className="flex-1 text-sm font-bold truncate"
                onClick={() => onSelectModule(module)}
              >
                {module.title}
              </span>

              <button
                onClick={(e) => { e.stopPropagation(); onEditModule(module); }}
                className={`p-1.5 rounded-lg hover:bg-white/20 transition-colors ${isActive ? 'text-white/80' : 'text-slate-400 hover:text-primary'}`}
                title="Editar módulo"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteModule(module); }}
                className={`p-1.5 rounded-lg hover:bg-white/20 transition-colors ${isActive ? 'text-white/80' : 'text-slate-400 hover:text-red-500'}`}
                title="Eliminar módulo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sections */}
            {isExpanded && (
              <div className="bg-white divide-y divide-slate-50">
                {[...module.sections].sort((a, b) => a.order - b.order).map((section) => {
                  const isSectionActive = activeSectionId === section.id;
                  return (
                    <div
                      key={section.id}
                      onClick={() => onSelectSection(section, module)}
                      className={`flex items-center gap-2 px-6 py-2.5 cursor-pointer transition-all ${
                        isSectionActive
                          ? 'bg-secondary/10 text-secondary border-l-2 border-secondary'
                          : 'hover:bg-slate-50 text-slate-600 border-l-2 border-transparent'
                      }`}
                    >
                      <span className="flex-1 text-xs font-semibold truncate">
                        {section.title}
                      </span>
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {section.items?.length ?? 0} ítems
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteSection(section); }}
                        className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}

                {/* Add Section Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); onAddSection(module); }}
                  className="w-full flex items-center gap-2 px-6 py-2 text-xs text-slate-400 hover:text-primary hover:bg-primary/5 transition-all font-bold"
                >
                  <Plus className="w-3 h-3" />
                  Agregar Sección
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
