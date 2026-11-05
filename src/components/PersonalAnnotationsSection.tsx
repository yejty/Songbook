import React, { useState } from 'react';
import { PersonalAnnotation } from '../types';
import { useI18n } from '../services/i18n';
import {
  StickyNote,
  Plus,
  Trash2,
  Tag,
  Mic,
  Music,
  Sliders,
  Bookmark,
  Sparkles,
} from 'lucide-react';

interface PersonalAnnotationsSectionProps {
  annotations: PersonalAnnotation[];
  onUpdateAnnotations: (updated: PersonalAnnotation[]) => void;
  readOnly?: boolean;
}

export const PersonalAnnotationsSection: React.FC<PersonalAnnotationsSectionProps> = ({
  annotations,
  onUpdateAnnotations,
  readOnly = false,
}) => {
  const { lang } = useI18n();

  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<PersonalAnnotation['category']>('vocal');
  const [newColor, setNewColor] = useState<PersonalAnnotation['color']>('amber');

  const categories = [
    { id: 'vocal' as const, label: lang === 'sk' ? 'Vokál / Spev' : 'Vocal / Singing', icon: Mic },
    { id: 'sax' as const, label: lang === 'sk' ? 'Alt Saxofón' : 'Alto Sax', icon: Music },
    { id: 'gear' as const, label: lang === 'sk' ? 'Aparát / Pedále' : 'Gear & Pedals', icon: Sliders },
    { id: 'memo' as const, label: lang === 'sk' ? 'Osobné memo' : 'Personal Memo', icon: Bookmark },
    { id: 'cue' as const, label: lang === 'sk' ? 'Pódiový cue' : 'Stage Cue', icon: Sparkles },
  ];

  const colors = [
    { id: 'amber' as const, bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
    { id: 'emerald' as const, bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    { id: 'purple' as const, bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
    { id: 'rose' as const, bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
    { id: 'sky' as const, bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' },
  ];

  const handleAddAnnotation = () => {
    if (!newText.trim()) return;

    const annotation: PersonalAnnotation = {
      id: `pa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      category: newCategory,
      text: newText.trim(),
      color: newColor,
      createdAt: Date.now(),
    };

    onUpdateAnnotations([...annotations, annotation]);
    setNewText('');
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    onUpdateAnnotations(annotations.filter((a) => a.id !== id));
  };

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 md:p-6 shadow-xl backdrop-blur-md space-y-3">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <StickyNote className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span>{lang === 'sk' ? 'Osobné poznámky k piesni' : 'Personal Annotations'}</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
              {annotations.length}
            </span>
          </h3>
        </div>

        {!readOnly && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'sk' ? 'Pridať poznámku' : 'Add Note'}</span>
          </button>
        )}
      </div>

      {/* Add form */}
      {isAdding && (
        <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/30 space-y-3">
          {/* Category selector */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.id}
                  onClick={() => setNewCategory(c.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    newCategory === c.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>

          {/* Color tag picker */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Farba štítku:</span>
            <div className="flex items-center gap-1.5">
              {colors.map((clr) => (
                <button
                  key={clr.id}
                  onClick={() => setNewColor(clr.id)}
                  className={`w-5 h-5 rounded-full border-2 transition ${
                    newColor === clr.id ? 'border-white scale-110' : 'border-transparent opacity-70'
                  } ${
                    clr.id === 'amber'
                      ? 'bg-amber-400'
                      : clr.id === 'emerald'
                      ? 'bg-emerald-400'
                      : clr.id === 'purple'
                      ? 'bg-purple-400'
                      : clr.id === 'rose'
                      ? 'bg-rose-400'
                      : 'bg-sky-400'
                  }`}
                />
              ))}
            </div>
          </div>

          <textarea
            rows={2}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder={
              lang === 'sk'
                ? 'napr. V druhom refréne ísť do falzetu, dychový nástup po 8 taktoch...'
                : 'e.g. Falsetto on chorus 2, sax enters after 8 bars...'
            }
            className="w-full rounded-lg bg-slate-900 border border-slate-800 p-2.5 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Zrušiť
            </button>
            <button
              onClick={handleAddAnnotation}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition cursor-pointer"
            >
              Uložiť
            </button>
          </div>
        </div>
      )}

      {/* Annotations List */}
      <div className="space-y-2">
        {annotations.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">
            {lang === 'sk'
              ? 'Žiadne osobné poznámky k spevu alebo nástupu. Pridajte si pripomienky pre vystúpenie.'
              : 'No personal annotations. Add performance cues, singing reminders or gear notes.'}
          </p>
        ) : (
          annotations.map((ann) => {
            const clr = colors.find((c) => c.id === ann.color) || colors[0];
            const cat = categories.find((c) => c.id === ann.category);
            const Icon = cat?.icon || StickyNote;

            return (
              <div
                key={ann.id}
                className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition group"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${clr.bg} ${clr.text} ${clr.border}`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{cat?.label || ann.category}</span>
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">{ann.text}</p>
                </div>

                {!readOnly && (
                  <button
                    onClick={() => handleDelete(ann.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition cursor-pointer p-1"
                    title="Odstrániť"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
