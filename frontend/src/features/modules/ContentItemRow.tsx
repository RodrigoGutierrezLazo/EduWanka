import React from 'react';
import { Trash2, Edit2, Eye, EyeOff, GripVertical } from 'lucide-react';
import type { ContentItem } from '@/lib/types';
import { CONTENT_TYPE_META } from './contentTypeMeta';

interface ContentItemRowProps {
  item: ContentItem;
  onEdit: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
  onTogglePublish?: (item: ContentItem) => void;
}

export const ContentItemRow: React.FC<ContentItemRowProps> = ({
  item,
  onEdit,
  onDelete,
  onTogglePublish,
}) => {
  const meta = CONTENT_TYPE_META[item.type];
  const Icon = meta.icon;

  const getPreviewUrl = () => {
    if (item.url) return item.url;
    if (item.path) return `/storage/${item.path}`;
    return null;
  };

  const previewUrl = getPreviewUrl();

  return (
    <div
      className={`group flex items-center gap-3 p-3 rounded-xl border transition-all ${
        item.published
          ? 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
          : 'bg-slate-50 border-dashed border-slate-200 opacity-60'
      }`}
    >
      {/* Drag Handle */}
      <GripVertical className="w-4 h-4 text-slate-300 cursor-grab flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Type Icon */}
      <div className={`p-2 rounded-lg bg-slate-50 flex-shrink-0 ${meta.color}`}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Title & Type */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 truncate">{item.title}</p>
        <p className={`text-xs font-semibold ${meta.color}`}>{meta.label}</p>
      </div>

      {/* Preview Link */}
      {previewUrl && (
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary font-bold hover:underline hidden group-hover:block"
        >
          Ver
        </a>
      )}

      {/* Gestionar Preguntas */}
      {(item.type === 'questionnaire' || item.type === 'substitute_exam') && item.referenced_id && (
        <a
          href={`/aula/questionnaire-builder/${item.type}/${item.referenced_id}`}
          className="text-xs text-secondary font-bold hover:underline hidden group-hover:block mr-2"
        >
          Gestionar Preguntas
        </a>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onTogglePublish && (
          <button
            onClick={() => onTogglePublish(item)}
            className={`p-1.5 rounded-lg transition-colors ${
              item.published
                ? 'text-slate-400 hover:text-yellow-500 hover:bg-yellow-50'
                : 'text-slate-300 hover:text-green-500 hover:bg-green-50'
            }`}
            title={item.published ? 'Ocultar' : 'Publicar'}
          >
            {item.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
        )}
        <button
          onClick={() => onEdit(item)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
          title="Editar"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(item)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Eliminar"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
