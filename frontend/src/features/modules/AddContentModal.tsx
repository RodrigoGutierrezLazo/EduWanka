import React from 'react';
import { X } from 'lucide-react';
import type { ContentType } from '@/lib/types';
import { CONTENT_TYPE_META } from './contentTypeMeta';

interface AddContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: ContentType) => void;
}

const ALL_TYPES: ContentType[] = [
  'video', 'file', 'meet', 'text', 'url',
  'questionnaire', 'substitute_exam', 'assignment'
];

export const AddContentModal: React.FC<AddContentModalProps> = ({
  isOpen,
  onClose,
  onSelectType,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-black text-slate-800">Añadir actividad o recurso</h3>
            <p className="text-sm text-slate-500 mt-0.5">Selecciona el tipo de contenido que deseas agregar</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Grid */}
        <div className="p-6">
          <div className="grid grid-cols-3 gap-3">
            {ALL_TYPES.map((type) => {
              const meta = CONTENT_TYPE_META[type];
              const Icon = meta.icon;

              return (
                <button
                  key={type}
                  onClick={() => { onSelectType(type); onClose(); }}
                  className={`group flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${meta.bg}`}
                >
                  <div className={`p-3 rounded-xl bg-white shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all ${meta.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-black ${meta.color}`}>{meta.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-tight">{meta.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
