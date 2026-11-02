import React, { useState } from 'react';
import { Song } from '../types';
import { convertToChordPro } from '../services/chordProConverter';
import { useI18n } from '../services/i18n';
import {
  FileText,
  Upload,
  Sparkles,
  ArrowRight,
  CheckCircle,
  X,
  FileCode,
  Music,
} from 'lucide-react';

interface ImportSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSong: (song: Song) => void;
}

const SAMPLE_RAW_SONG = `Karol Duchoň - V slovenských dolinách
Tónina: G

[Intro]
G   Em   C   D

[Sloha 1]
G                 Em
V dolinách, kde tráva vonia medom
C                  D
V dolinách, kde vietor šumí stromom
G                 Em
Tam niekde v diaľke vidím svoj dom
C                  D
A kráčam k nemu celým svojím srdcom

[Refrén]
G                 Em
V dolinách, kvitne kvet
C                 D
Ktorý lásku vráti späť
G                 Em
V dolinách, kvitne kvet
C         D       G
Môj rodný šíry svet

[Sólo]
G   Em   C   D`;

export const ImportSongModal: React.FC<ImportSongModalProps> = ({
  isOpen,
  onClose,
  onImportSong,
}) => {
  const { lang, t } = useI18n();

  const [rawText, setRawText] = useState<string>('');
  const [songTitle, setSongTitle] = useState<string>('');
  const [songArtist, setSongArtist] = useState<string>('');
  const [songKey, setSongKey] = useState<string>('C');
  const [previewChordPro, setPreviewChordPro] = useState<string>('');
  const [activeStep, setActiveStep] = useState<'input' | 'preview'>('input');

  if (!isOpen) return null;

  const handleRunConversion = () => {
    if (!rawText.trim()) return;

    const result = convertToChordPro(rawText, songTitle, songArtist);
    setPreviewChordPro(result.chordProText);
    if (!songTitle && result.detectedTitle) setSongTitle(result.detectedTitle);
    if (!songArtist && result.detectedArtist) setSongArtist(result.detectedArtist);
    if (result.detectedKey) setSongKey(result.detectedKey);

    setActiveStep('preview');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content);
      const cleanFileName = file.name.replace(/\.[^/.]+$/, '');
      if (!songTitle) setSongTitle(cleanFileName);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    const finalTitle = songTitle.trim() || 'Nová skladba';
    const finalArtist = songArtist.trim() || (lang === 'sk' ? 'Interpret' : 'Artist');

    const newSong: Song = {
      id: `song-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: finalTitle,
      artist: finalArtist,
      originalKey: songKey || 'C',
      currentKey: songKey || 'C',
      tempo: 120,
      timeSignature: '4/4',
      tags: ['Alt Saxofón', 'Importované'],
      chordProText: previewChordPro || rawText,
      performanceNotes: [
        {
          id: `pn-${Date.now()}`,
          tag: 'cue',
          text: lang === 'sk' ? 'Skladba importovaná a skonvertovaná do ChordPro formátu.' : 'Imported song auto-converted to ChordPro.',
        },
      ],
      saxSolos: [
        {
          id: `sax-${Date.now()}`,
          title: lang === 'sk' ? 'Alt Saxofón (E♭) vyhrávka' : 'Alto Sax (E♭) Riff',
          concertKey: songKey || 'C',
          notesContent: `${songKey || 'C'}5 - E5 - G5 | A5 - - -`,
          tips: lang === 'sk' ? 'Altový saxofón transponovaný o +9 poltónov' : 'Alto sax transposed +9 semitones',
        },
      ],
      audioRecords: [],
      isFavorite: false,
      lastModified: Date.now(),
    };

    onImportSong(newSong);
    onClose();
  };

  const loadSample = () => {
    setRawText(SAMPLE_RAW_SONG);
    setSongTitle('V slovenských dolinách');
    setSongArtist('Karol Duchoň');
    setSongKey('G');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                <span>{lang === 'sk' ? 'Importovať skladbu a konvertovať do ChordPro' : 'Import Song & Auto-Convert to ChordPro'}</span>
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'sk'
                  ? 'Vložte bežný text s akordmi nad slovami (z internetu) — systém ich automaticky zlúči do [Akordov] pre pódium'
                  : 'Paste chords-over-lyrics or load file — converts automatically into standard [Chord] syntax'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveStep('input')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeStep === 'input'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            1. {lang === 'sk' ? 'Vloženie textu / Súbor' : 'Input Lyrics & Chords'}
          </button>
          <span className="text-slate-600">→</span>
          <button
            onClick={() => rawText.trim() && handleRunConversion()}
            disabled={!rawText.trim()}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer disabled:opacity-40 ${
              activeStep === 'preview'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            2. {lang === 'sk' ? 'Náhľad skonvertovaného ChordPro' : 'Preview ChordPro'}
          </button>
        </div>

        {activeStep === 'input' ? (
          <div className="space-y-4">
            {/* Metadata Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">{t.title}</label>
                <input
                  type="text"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  placeholder="napr. Voda čo ma drží nad vodou"
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">{t.artist}</label>
                <input
                  type="text"
                  value={songArtist}
                  onChange={(e) => setSongArtist(e.target.value)}
                  placeholder="napr. Elán / Karol Duchoň"
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">{t.originalKey}</label>
                <input
                  type="text"
                  value={songKey}
                  onChange={(e) => setSongKey(e.target.value)}
                  placeholder="G, Dm, C..."
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-amber-400 font-mono font-bold focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Upload or Sample Helper bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700 cursor-pointer transition">
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === 'sk' ? 'Nahrať súbor (.txt, .cho, .pro)' : 'Upload text file'}</span>
                  <input
                    type="file"
                    accept=".txt,.cho,.chordpro,.pro,.crd"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={loadSample}
                  className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-amber-400 bg-slate-950 border border-slate-800 transition cursor-pointer"
                >
                  {lang === 'sk' ? 'Vyskúšať vzorovú skladbu' : 'Try sample song'}
                </button>
              </div>

              <span className="text-[11px] text-slate-500">
                Podporuje akordy nad textom z Ultimate Guitar & Supermusic
              </span>
            </div>

            {/* Raw Textarea */}
            <div>
              <textarea
                rows={12}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`Vložte sem text s akordmi, napríklad:\n\nC          G           Am\nPrší prší len sa leje...\nF          G           C\nNech sa leje nevadí...`}
                className="w-full rounded-xl bg-slate-950 font-mono text-xs md:text-sm text-slate-200 border border-slate-800 p-4 leading-relaxed focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleRunConversion}
                disabled={!rawText.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition cursor-pointer shadow-lg active:scale-95 disabled:opacity-40"
              >
                <Sparkles className="w-4 h-4" />
                <span>{lang === 'sk' ? 'Automaticky konvertovať do ChordPro' : 'Auto-Convert to ChordPro'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Preview & Confirmation */
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-medium">
              <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>
                {lang === 'sk'
                  ? 'Text bol úspešne skonvertovaný do ChordPro formátu! Môžete skontrolovať kód a potvrdiť import.'
                  : 'Successfully converted to ChordPro! Review the code below and confirm import.'}
              </span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 text-xs font-medium">
                ChordPro kód s automaticky integrovanými akordmi [Am]:
              </label>
              <textarea
                rows={14}
                value={previewChordPro}
                onChange={(e) => setPreviewChordPro(e.target.value)}
                className="w-full rounded-xl bg-slate-950 font-mono text-xs text-amber-200 border border-slate-800 p-4 leading-relaxed focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <button
                onClick={() => setActiveStep('input')}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                ← {lang === 'sk' ? 'Späť na zadávanie' : 'Back to input'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition cursor-pointer shadow-lg active:scale-95"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{lang === 'sk' ? 'Uložiť skladbu do spevníka' : 'Save to Songbook'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
