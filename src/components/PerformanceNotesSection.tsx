import React, { useState } from 'react';
import { PerformanceNote } from '../types';
import { useI18n } from '../services/i18n';
import { FileText, Plus, Trash2, Tag } from 'lucide-react';

interface PerformanceNotesSectionProps {
  notes: PerformanceNote[];
  onUpdateNotes: (notes: PerformanceNote[]) => void;
  readOnly?: boolean;
}

export const PerformanceNotesSection: React.FC<PerformanceNotesSectionProps> = ({
  notes,
  onUpdateNotes,
  readOnly = false,
}) => {
  const { lang, t } = useI18n();
  const [newText, setNewText] = useState('');
  const [newTag, setNewTag] = useState<PerformanceNote['tag']>('cue');
  const [isAdding, setIsAdding] = useState(false);

  const tagColors: Record<PerformanceNote['tag'], { bg: string; text: string; border: string; label: string }> = {
    cue: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', label: lang === 'sk' ? 'Pódiový signál (Cue)' : 'Stage Cue' },
    intro: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Intro / Nástup' },
    solo: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30', label: 'Sólo / Sax' },
    outro: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', label: 'Outro / Záver' },
    gear: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30', label: lang === 'sk' ? 'Nastavenie aparátu' : 'Gear / Pedals' },
    general: { bg: 'bg-slate-700/30', text: 'text-slate-300', border: 'border-slate-700', label: lang === 'sk' ? 'Všeobecné' : 'General Note' },
  };

  const handleAddNote = () => {
    if (!newText.trim()) return;
    const note: PerformanceNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tag: newTag,
      text: newText.trim(),
    };
    onUpdateNotes([...notes, note]);
    setNewText('');
    setIsAdding(false);
  };

  const handleDeleteNote = (id: string) => {
    onUpdateNotes(notes.filter((n) => n.id !== id));
  };

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 md:p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <FileText className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            {t.performanceNotes}
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
              {notes.length}
            </span>
          </h3>
        </div>

        {!readOnly && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addNote}</span>
          </button>
        )}
      </div>

      {/* Adding Note Form */}
      {isAdding && (
        <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-amber-500/30 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(tagColors) as PerformanceNote['tag'][]).map((tagKey) => (
              <button
                key={tagKey}
                type="button"
                onClick={() => setNewTag(tagKey)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  newTag === tagKey
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {tagColors[tagKey].label}
              </button>
            ))}
          </div>

          <textarea
            rows={2}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder={
              lang === 'sk'
                ? 'napr. Bubny začínajú 4 takty, saxofón nastupuje jemne s delayom...'
                : 'e.g. Drums start 4 bars intro, sax enters on verse 2...'
            }
            className="w-full rounded-lg bg-slate-900 border border-slate-800 p-2.5 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleAddNote}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition cursor-pointer"
            >
              {t.save}
            </button>
          </div>
        </div>
      )}

      {/* Notes list */}
      <div className="mt-3 space-y-2">
        {notes.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">
            {lang === 'sk'
              ? 'Zatiaľ žiadne poznámky k aranžmánu alebo pódiovej komunikácii.'
              : 'No performance cues yet.'}
          </p>
        ) : (
          notes.map((note) => {
            const conf = tagColors[note.tag] || tagColors.general;
            return (
              <div
                key={note.id}
                className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition group"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${conf.bg} ${conf.text} ${conf.border}`}
                  >
                    {note.tag}
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">{note.text}</p>
                </div>

                {!readOnly && (
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition cursor-pointer p-1"
                    title="Odstrániť poznámku"
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
