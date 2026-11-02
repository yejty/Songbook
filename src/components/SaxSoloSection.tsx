import React, { useState } from 'react';
import { SaxSoloNote, InstrumentType } from '../types';
import {
  getInstrumentSemitoneOffset,
  getInstrumentLabel,
  transposeSaxNotesText,
  getSaxScalesForSongKey,
  ALL_KEYS,
} from '../services/transposer';
import { useI18n } from '../services/i18n';
import { Music, Plus, Edit2, Trash2, HelpCircle, Sparkles, Wand2 } from 'lucide-react';

interface SaxSoloSectionProps {
  solos: SaxSoloNote[];
  songKey: string;
  onUpdateSolos: (solos: SaxSoloNote[]) => void;
  readOnly?: boolean;
}

export const SaxSoloSection: React.FC<SaxSoloSectionProps> = ({
  solos,
  songKey,
  onUpdateSolos,
  readOnly = false,
}) => {
  const { lang, t } = useI18n();
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>('alto_sax');
  const [activeTab, setActiveTab] = useState<'solos' | 'scales'>('solos');
  const [editingSolo, setEditingSolo] = useState<SaxSoloNote | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Semitone offset for the selected saxophone
  const saxOffset = getInstrumentSemitoneOffset(selectedInstrument);
  const scales = getSaxScalesForSongKey(songKey || 'C', selectedInstrument);

  // Form states for new/editing solo
  const [formTitle, setFormTitle] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formTips, setFormTips] = useState('');

  const startEdit = (solo: SaxSoloNote) => {
    setEditingSolo(solo);
    setFormTitle(solo.title);
    setFormNotes(solo.notesContent);
    setFormTips(solo.tips || '');
    setIsAddingNew(false);
  };

  const startAddNew = () => {
    setIsAddingNew(true);
    setEditingSolo(null);
    setFormTitle(lang === 'sk' ? 'Saxofónové sólo' : 'Saxophone Solo');
    setFormNotes('D5 - F5 - G5 - Ab5 - A5 | C6 - D6 - C6 - A5');
    setFormTips(lang === 'sk' ? 'Hrať s jemným vibratom a dynamikou' : 'Play with gentle vibrato and dynamic crescendo');
  };

  const saveSoloForm = () => {
    if (!formTitle.trim()) return;

    if (editingSolo) {
      const updated = solos.map((s) =>
        s.id === editingSolo.id
          ? { ...s, title: formTitle, notesContent: formNotes, tips: formTips, concertKey: songKey }
          : s
      );
      onUpdateSolos(updated);
    } else {
      const newSolo: SaxSoloNote = {
        id: `sax-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: formTitle,
        concertKey: songKey || 'C',
        notesContent: formNotes,
        tips: formTips,
      };
      onUpdateSolos([...solos, newSolo]);
    }
    setEditingSolo(null);
    setIsAddingNew(false);
  };

  const deleteSolo = (id: string) => {
    onUpdateSolos(solos.filter((s) => s.id !== id));
  };

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-amber-500/30 p-4 md:p-6 shadow-xl backdrop-blur-md">
      {/* Header and Instrument Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              {t.saxophoneSolos}
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-semibold border border-amber-400/30">
                {solos.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'sk'
                ? 'Automatická transpozícia tónov pre Alt (E♭) a Tenor (B♭) saxofón'
                : 'Real-time pitch transposition for Alto (E♭) and Tenor (B♭) sax'}
            </p>
          </div>
        </div>

        {/* Instrument Switcher - Alto Sax Focused */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setSelectedInstrument('alto_sax')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              selectedInstrument === 'alto_sax'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🎷 Alt Saxofón (E♭)
          </button>
          <button
            onClick={() => setSelectedInstrument('concert')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              selectedInstrument === 'concert'
                ? 'bg-slate-700 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Koncertné (C)
          </button>
        </div>
      </div>

      {/* Sub Tabs: Solo Charts vs Scale Guide */}
      <div className="flex items-center justify-between mt-4 mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('solos')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeTab === 'solos'
                ? 'bg-slate-800 text-amber-400 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {lang === 'sk' ? 'Zoznam sól a vyhrávok' : 'Solo Charts & Riffs'}
          </button>
          <button
            onClick={() => setActiveTab('scales')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'scales'
                ? 'bg-slate-800 text-sky-400 border border-sky-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            {t.scaleHelper}
          </button>
        </div>

        {!readOnly && (
          <button
            onClick={startAddNew}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addSaxSolo}</span>
          </button>
        )}
      </div>

      {/* Content: Scales Mode */}
      {activeTab === 'scales' && (
        <div className="mt-3 p-4 rounded-xl bg-slate-950 border border-sky-500/30 text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span className="text-slate-400">
                {lang === 'sk' ? 'Koncertná tónina skladby:' : 'Concert Song Key:'}
              </span>{' '}
              <strong className="text-slate-100 font-mono text-sm">{songKey || 'C'}</strong>
            </div>
            <div>
              <span className="text-slate-400">
                {lang === 'sk' ? 'Tónina pre' : 'Key for'} {getInstrumentLabel(selectedInstrument, lang)}:
              </span>{' '}
              <strong className="text-amber-400 font-mono text-sm">
                {scales.root} {scales.isMinor ? 'moly / minor' : 'durová / major'}
              </strong>
            </div>
          </div>

          <div>
            <h4 className="text-amber-300 font-semibold mb-1 flex items-center gap-1.5">
              <span>🎷 {lang === 'sk' ? 'Bluesová stupnica pre saxofón:' : 'Saxophone Blues Scale:'}</span>
            </h4>
            <div className="flex flex-wrap gap-1.5 font-mono text-sm">
              {scales.bluesScale.map((note, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-0.5 rounded-md font-bold ${
                    idx === 3
                      ? 'bg-red-500/30 text-red-300 border border-red-500/40' // Blue note!
                      : 'bg-slate-800 text-amber-300 border border-slate-700'
                  }`}
                  title={idx === 3 ? 'Blue Note (znížená 5ka)' : 'Scale tone'}
                >
                  {note}
                  {idx === 3 && <span className="ml-1 text-[10px] text-red-400">♭5</span>}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sky-300 font-semibold mb-1">
              <span>🎵 {scales.isMinor ? 'Minor Pentatonic' : 'Major Pentatonic'}</span>
            </h4>
            <div className="flex flex-wrap gap-1.5 font-mono text-sm">
              {(scales.isMinor ? scales.minorPentatonic : scales.majorPentatonic).map((note, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md font-bold bg-slate-800/80 text-sky-300 border border-slate-700"
                >
                  {note}
                </span>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/60">
            {lang === 'sk'
              ? 'Tieto tóny zaručene ladia s aktuálnou harmóniou pri pódiovom improvizovaní.'
              : 'These scale notes are harmonic-safe for live stage soloing over this chord progression.'}
          </p>
        </div>
      )}

      {/* Content: Solos List */}
      {activeTab === 'solos' && (
        <div className="space-y-3 mt-3">
          {solos.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs">
              <p>{lang === 'sk' ? 'Zatiaľ nie sú pridané žiadne saxofónové sóla.' : 'No saxophone solos added yet.'}</p>
              {!readOnly && (
                <button
                  onClick={startAddNew}
                  className="mt-2 text-amber-400 hover:text-amber-300 font-semibold underline cursor-pointer"
                >
                  {t.addSaxSolo}
                </button>
              )}
            </div>
          ) : (
            solos.map((solo) => {
              const transposedNotes = transposeSaxNotesText(
                solo.notesContent,
                saxOffset,
                selectedInstrument !== 'concert'
              );

              return (
                <div
                  key={solo.id}
                  className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition group"
                >
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-800/80">
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                        <span>{solo.title}</span>
                        {selectedInstrument !== 'concert' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-semibold">
                            {selectedInstrument === 'tenor_sax' ? '+2 semitones (B♭)' : '+9 semitones (E♭)'}
                          </span>
                        )}
                      </h4>
                      {solo.tips && (
                        <p className="text-xs text-amber-400/80 mt-0.5 italic">
                          💡 {solo.tips}
                        </p>
                      )}
                    </div>

                    {!readOnly && (
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                        <button
                          onClick={() => startEdit(solo)}
                          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
                          title="Upraviť"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteSolo(solo.id)}
                          className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition cursor-pointer"
                          title="Zmazať"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Transposed Solo Notes Block */}
                  <div className="mt-2.5 font-mono text-sm leading-relaxed text-amber-200 whitespace-pre-wrap bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                    {transposedNotes}
                  </div>

                  {/* Dual reference if transposed */}
                  {selectedInstrument !== 'concert' && (
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        {lang === 'sk' ? 'Zobrazené pre:' : 'Displayed for:'}{' '}
                        <strong className="text-slate-300">{getInstrumentLabel(selectedInstrument, lang)}</strong>
                      </span>
                      <button
                        onClick={() => setSelectedInstrument('concert')}
                        className="text-amber-400 hover:underline cursor-pointer"
                      >
                        {lang === 'sk' ? 'Porovnať s koncertným (C)' : 'Compare with Concert (C)'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal / Overlay for Adding or Editing Solo */}
      {(isAddingNew || editingSolo) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
            <h3 className="text-base font-bold text-amber-400 mb-4 flex items-center gap-2">
              <Music className="w-4 h-4" />
              {isAddingNew
                ? (lang === 'sk' ? 'Pridať saxofónové sólo / vyhrávku' : 'Add Saxophone Solo / Riff')
                : (lang === 'sk' ? 'Upraviť saxofónové sólo' : 'Edit Saxophone Solo')}
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  {lang === 'sk' ? 'Názov sóla / Hook' : 'Solo Name / Hook'}
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 text-sm focus:border-amber-500 focus:outline-none"
                  placeholder="napr. Hlavný motív / Sólo po 2. refréne"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-medium">
                    {lang === 'sk' ? 'Tóny sóla v koncertnom ladení (C)' : 'Solo Notes in Concert Pitch (C)'}
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono">
                    napr. D5 - F5 - G5 | A5 - C6 - D6
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 font-mono text-xs focus:border-amber-500 focus:outline-none"
                  placeholder="Napíšte tóny s pomlčkami a taktovými čiarami | ..."
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <span className="text-[10px] text-slate-400 mr-1 self-center">Rýchle vloženie:</span>
                  {['C5', 'D5', 'Eb5', 'E5', 'F5', 'F#5', 'G5', 'Ab5', 'A5', 'Bb5', 'B5', 'C6', '|'].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setFormNotes((prev) => `${prev} ${n}`.trim())}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono cursor-pointer"
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  {lang === 'sk' ? 'Tipy na prednes / frázovanie / efekty' : 'Performance tips / phrasing / growl'}
                </label>
                <input
                  type="text"
                  value={formTips}
                  onChange={(e) => setFormTips(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                  placeholder="napr. Growl na G5, jemné vibrato na záver"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  setEditingSolo(null);
                  setIsAddingNew(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                onClick={saveSoloForm}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition cursor-pointer shadow-lg active:scale-95"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
