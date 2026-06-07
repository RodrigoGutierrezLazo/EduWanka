import React from 'react';
import { ListPlus, XCircle } from 'lucide-react';

interface ListEditorProps {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
}

export default function ListEditor({ label, items, onChange }: ListEditorProps) {
  const add = () => onChange([...items, '']);
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i: number, v: string) => {
    const n = [...items];
    n[i] = v;
    onChange(n);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</label>
        <button 
          type="button" 
          onClick={add} 
          className="flex items-center gap-1 text-xs font-bold text-secondary hover:text-secondary/80 transition-colors"
        >
          <ListPlus className="w-3.5 h-3.5" /> Añadir
        </button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 mb-1.5 animate-fadeIn">
          <span className="text-xs text-slate-400 pt-2.5 w-5 text-right flex-shrink-0">{i + 1}.</span>
          <input 
            value={item} 
            onChange={e => update(i, e.target.value)}
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-secondary transition-colors" 
          />
          <button 
            type="button" 
            onClick={() => remove(i)} 
            className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      ))}
      {items.length === 0 && (
        <p className="text-xs text-slate-300 italic">Sin elementos. Clic en "Añadir" para agregar.</p>
      )}
    </div>
  );
}
