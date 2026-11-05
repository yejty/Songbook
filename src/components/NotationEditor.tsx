import React, { useState, useEffect, useRef } from 'react';
import { SheetNotation } from '../types';
import {
  generateDefaultAbc,
  downloadMusicXml,
  downloadAbcFile,
  exportNotationPdf,
} from '../services/notationService';
import { useI18n } from '../services/i18n';
import abcjs from 'abcjs';
import {
  Music,
  FileDown,
  CloudUpload,
  Play,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Save,
  FileText,
  Sliders,
  Check,
} from 'lucide-react';

interface NotationEditorProps {
  notation?: SheetNotation;
  songTitle: string;
  songArtist: string;
  songKey: string;
  onSaveNotation: (notation: SheetNotation) => void;
  onUploadToMega?: (notation: SheetNotation) => void;
}

export const NotationEditor: React.FC<NotationEditorProps> = ({
  notation,
  songTitle,
  songArtist,
  songKey,
  onSaveNotation,
  onUploadToMega,
}) => {
  const { lang } = useI18n();

  const [abcText, setAbcText] = useState<string>(() => {
    return notation?.abcSource || generateDefaultAbc(songTitle, songArtist, songKey || 'G');
  });

  const [activeClef, setActiveClef] = useState<'treble' | 'bass'>('treble');
  const [selectedDuration, setSelectedDuration] = useState<string>('2'); // '8' = whole, '4' = half, '2' = quarter, '1' = eighth
  const [selectedAccidental, setSelectedAccidental] = useState<string>(''); // '^' = sharp, '_' = flat, '=' = natural
  const [isSavedToast, setIsSavedToast] = useState(false);

  const staveContainerRef = useRef<HTMLDivElement | null>(null);

  // Render SVG musical notation using abcjs whenever abcText changes
  useEffect(() => {
    if (staveContainerRef.current) {
      try {
        abcjs.renderAbc(staveContainerRef.current, abcText, {
          responsive: 'resize',
          scale: 1.0,
          add_classes: true,
          foregroundColor: '#f8fafc',
        });
      } catch (err) {
        console.error('Error rendering ABC score', err);
      }
    }
  }, [abcText]);

  // Insert a note into ABC text
  const handleInsertNote = (noteChar: string) => {
    const formattedNote = `${selectedAccidental}${noteChar}${selectedDuration === '2' ? '' : selectedDuration}`;
    setAbcText((prev) => {
      // Append note before the ending barline or at the end
      if (prev.endsWith('|]') || prev.endsWith(':|')) {
        const lastBar = prev.lastIndexOf('|');
        return prev.slice(0, lastBar) + formattedNote + ' ' + prev.slice(lastBar);
      }
      return prev + formattedNote + ' ';
    });
  };

  const handleInsertBarline = () => {
    setAbcText((prev) => prev.trimEnd() + ' | ');
  };

  const handleInsertRest = () => {
    const rest = `z${selectedDuration === '2' ? '' : selectedDuration}`;
    setAbcText((prev) => prev.trimEnd() + ' ' + rest + ' ');
  };

  const handleSave = () => {
    const updated: SheetNotation = {
      id: notation?.id || `not-${Date.now()}`,
      title: songTitle,
      keySignature: songKey || 'G',
      timeSignature: '4/4',
      tempo: 120,
      clef: activeClef,
      abcSource: abcText,
      updatedAt: Date.now(),
    };
    onSaveNotation(updated);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  const currentNotationObj: SheetNotation = {
    id: notation?.id || `not-${Date.now()}`,
    title: songTitle,
    keySignature: songKey || 'G',
    timeSignature: '4/4',
    tempo: 120,
    clef: activeClef,
    abcSource: abcText,
    updatedAt: Date.now(),
  };

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 md:p-6 shadow-2xl space-y-5">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
            🎼
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{lang === 'sk' ? 'Notový editor (Sheet Music Editor)' : 'Sheet Music Notation Editor'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                Alt Saxofón (E♭)
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'sk'
                ? 'Vizuálna 5-linajková osnova, úprava tónov a export do MusicXML (MuseScore, Sibelius, Finale) alebo PDF'
                : '5-line musical stave, note editing and export to MusicXML (MuseScore/Sibelius) & PDF'}
            </p>
          </div>
        </div>

        {/* Action Buttons: Save & Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Download MusicXML for MuseScore, Sibelius, Finale */}
          <button
            onClick={() => downloadMusicXml(currentNotationObj, songTitle)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold text-xs border border-sky-500/30 transition cursor-pointer"
            title="Stiahnuť súbor MusicXML pre MuseScore, Sibelius alebo Finale"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>MusicXML</span>
          </button>

          {/* Download ABC notation file */}
          <button
            onClick={() => downloadAbcFile(currentNotationObj, songTitle)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition cursor-pointer"
            title="Stiahnuť textový súbor ABC notácie"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>.ABC</span>
          </button>

          {/* Export Notation to PDF */}
          <button
            onClick={() => exportNotationPdf(currentNotationObj)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs border border-amber-500/30 transition cursor-pointer"
            title="Exportovať notovú osnovu do PDF"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>PDF Noty</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSavedToast ? 'Uložené!' : 'Uložiť noty'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Note Insertion Palette */}
      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2.5 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
          {/* Note Duration Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">{lang === 'sk' ? 'Dĺžka noty:' : 'Duration:'}</span>
            {[
              { val: '8', label: '𝅝 Celá (1)' },
              { val: '4', label: '𝅗𝅥 Polová (1/2)' },
              { val: '2', label: '𝅘𝅥 Štvrťová (1/4)' },
              { val: '1', label: '𝅘𝅥𝅮 Osminová (1/8)' },
            ].map((d) => (
              <button
                key={d.val}
                type="button"
                onClick={() => setSelectedDuration(d.val)}
                className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                  selectedDuration === d.val
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Accidentals (# / b / =) */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-medium mr-1">{lang === 'sk' ? 'Predznamenanie:' : 'Accidentals:'}</span>
            {[
              { val: '', label: 'Prirodzený' },
              { val: '^', label: '♯ Krížik' },
              { val: '_', label: '♭ Béčko' },
              { val: '=', label: '♮ Odrážka' },
            ].map((acc) => (
              <button
                key={acc.val}
                type="button"
                onClick={() => setSelectedAccidental(selectedAccidental === acc.val ? '' : acc.val)}
                className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                  selectedAccidental === acc.val
                    ? 'bg-sky-500 text-slate-950 shadow'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pitches for Alto Sax register (D4 to F6) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-medium mr-1">{lang === 'sk' ? 'Vložiť tón:' : 'Insert note:'}</span>
          {[
            { n: 'C', label: 'C4' },
            { n: 'D', label: 'D4' },
            { n: 'E', label: 'E4' },
            { n: 'F', label: 'F4' },
            { n: 'G', label: 'G4' },
            { n: 'A', label: 'A4' },
            { n: 'B', label: 'B4' },
            { n: 'c', label: 'C5' },
            { n: 'd', label: 'D5' },
            { n: 'e', label: 'E5' },
            { n: 'f', label: 'F5' },
            { n: 'g', label: 'G5' },
            { n: 'a', label: 'A5' },
            { n: 'b', label: 'B5' },
            { n: "c'", label: 'C6' },
            { n: "d'", label: 'D6' },
          ].map((note) => (
            <button
              key={note.n}
              type="button"
              onClick={() => handleInsertNote(note.n)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-mono font-bold transition cursor-pointer border border-slate-800"
            >
              {selectedAccidental === '^' ? '♯' : selectedAccidental === '_' ? '♭' : ''}{note.label}
            </button>
          ))}

          <button
            type="button"
            onClick={handleInsertRest}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
          >
            𝄽 Pomlka (z)
          </button>

          <button
            type="button"
            onClick={handleInsertBarline}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold cursor-pointer"
          >
            | Taktová čiara
          </button>
        </div>
      </div>

      {/* Rendered Musical Staff Visualizer */}
      <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800/90 shadow-inner overflow-x-auto min-h-[160px] flex items-center justify-center">
        <div ref={staveContainerRef} className="w-full text-white" />
      </div>

      {/* Editable ABC Notation Source Area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <label className="font-semibold text-slate-300">
            {lang === 'sk' ? 'Zdrojový kód notácie (ABC formát):' : 'Notation Source (ABC notation code):'}
          </label>
          <span className="text-[11px] text-amber-400">
            Môžete priamo vpisovať tóny, akordy v úvodzovkách ("G", "Em") a taktové čiary (|)
          </span>
        </div>
        <textarea
          rows={7}
          value={abcText}
          onChange={(e) => setAbcText(e.target.value)}
          className="w-full bg-slate-950 font-mono text-xs md:text-sm text-amber-300 border border-slate-800 rounded-xl p-3.5 leading-relaxed focus:border-amber-500 focus:outline-none"
        />
      </div>
    </div>
  );
};
