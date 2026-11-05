import React, { useState } from 'react';
import { parseChordPro, ChordLyricSegment } from '../services/chordProParser';
import { useI18n } from '../services/i18n';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  MousePointerClick,
  FileCode,
  Sliders,
} from 'lucide-react';

interface VisualChordEditorProps {
  chordProText: string;
  onChangeChordPro: (newText: string) => void;
  currentKey: string;
}

const COMMON_CHORDS = [
  'C', 'C#m', 'D', 'Dm', 'Eb', 'E', 'Em', 'F', 'F#m', 'G', 'Gm', 'Ab', 'A', 'Am', 'Bb', 'B', 'B7',
];

export const VisualChordEditor: React.FC<VisualChordEditorProps> = ({
  chordProText,
  onChangeChordPro,
  currentKey,
}) => {
  const { lang } = useI18n();

  // Active chord tool selected from palette
  const [selectedPaletteChord, setSelectedPaletteChord] = useState<string>('C');
  const [customChordInput, setCustomChordInput] = useState<string>('');

  // Editing modal/popover for a specific segment
  const [activePlacement, setActivePlacement] = useState<{
    lineIdx: number;
    segIdx: number;
    currentChord: string | null;
  } | null>(null);

  const parsed = parseChordPro(chordProText, 0);

  // Convert parsed lines back to ChordPro text
  const serializeBackToChordPro = (lines: typeof parsed.lines) => {
    let result = '';
    // Preserve header if exists
    if (parsed.metadata.title) {
      result += `{title: ${parsed.metadata.title}}\n`;
    }
    if (parsed.metadata.artist) {
      result += `{artist: ${parsed.metadata.artist}}\n`;
    }
    if (parsed.metadata.key) {
      result += `{key: ${parsed.metadata.key}}\n`;
    }
    if (parsed.metadata.tempo) {
      result += `{tempo: ${parsed.metadata.tempo}}\n`;
    }
    result += '\n';

    lines.forEach((line) => {
      if (line.type === 'empty') {
        result += '\n';
        return;
      }
      if (line.type === 'comment') {
        result += `{comment: ${line.commentText}}\n`;
        return;
      }
      if (line.type === 'section-start') {
        result += `{start_of_${line.sectionType || 'verse'}}\n`;
        return;
      }
      if (line.type === 'section-end') {
        result += `{end_of_${line.sectionType || 'verse'}}\n`;
        return;
      }

      // Reconstruct chord-lyric line
      let lineStr = '';
      line.segments?.forEach((seg) => {
        if (seg.chord) {
          lineStr += `[${seg.chord}]`;
        }
        lineStr += seg.text;
      });
      result += lineStr + '\n';
    });

    return result.trim();
  };

  // Place a chord onto a segment
  const handlePlaceChord = (lineIdx: number, segIdx: number, chordToPlace: string) => {
    const newLines = [...parsed.lines];
    const targetLine = newLines[lineIdx];
    if (targetLine && targetLine.segments && targetLine.segments[segIdx]) {
      targetLine.segments[segIdx].chord = chordToPlace;
      const updatedText = serializeBackToChordPro(newLines);
      onChangeChordPro(updatedText);
    }
    setActivePlacement(null);
  };

  // Remove a chord from a segment
  const handleRemoveChord = (lineIdx: number, segIdx: number) => {
    const newLines = [...parsed.lines];
    const targetLine = newLines[lineIdx];
    if (targetLine && targetLine.segments && targetLine.segments[segIdx]) {
      targetLine.segments[segIdx].chord = null;
      const updatedText = serializeBackToChordPro(newLines);
      onChangeChordPro(updatedText);
    }
    setActivePlacement(null);
  };

  // Split word to place chord at exact position
  const handleSplitSegment = (lineIdx: number, segIdx: number, splitCharPos: number, chord: string) => {
    const newLines = [...parsed.lines];
    const targetLine = newLines[lineIdx];
    if (!targetLine || !targetLine.segments) return;

    const originalSeg = targetLine.segments[segIdx];
    const text = originalSeg.text;
    if (splitCharPos <= 0 || splitCharPos >= text.length) return;

    const part1 = text.substring(0, splitCharPos);
    const part2 = text.substring(splitCharPos);

    const newSeg1: ChordLyricSegment = { chord: originalSeg.chord, text: part1 };
    const newSeg2: ChordLyricSegment = { chord: chord, text: part2 };

    targetLine.segments.splice(segIdx, 1, newSeg1, newSeg2);
    const updatedText = serializeBackToChordPro(newLines);
    onChangeChordPro(updatedText);
    setActivePlacement(null);
  };

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-2xl">
      {/* Editor Banner & Instructions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <MousePointerClick className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{lang === 'sk' ? 'Vizuálny editor umiestňovania akordov' : 'Visual Place-Chords Editor'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                Interactive
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {lang === 'sk'
                ? 'Kliknite na ľubovoľné slovo v texte piesne pre umiestnenie alebo zmenu akordu'
                : 'Click any word in lyrics to place, change or remove chords'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customChordInput}
            onChange={(e) => setCustomChordInput(e.target.value)}
            placeholder="Vlastný akord..."
            className="w-24 px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-amber-300 font-mono font-bold focus:outline-none"
          />
          {customChordInput && (
            <button
              onClick={() => {
                setSelectedPaletteChord(customChordInput.trim());
                setCustomChordInput('');
              }}
              className="px-2 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
            >
              +
            </button>
          )}
        </div>
      </div>

      {/* Quick Chord Palette Bar */}
      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5">
        <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
          <span>{lang === 'sk' ? 'Paleta akordov na umiestnenie:' : 'Active chord palette:'}</span>
          <span className="text-amber-400 font-mono font-bold">
            {lang === 'sk' ? 'Vybraný akord:' : 'Selected:'} [{selectedPaletteChord}]
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_CHORDS.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedPaletteChord(c)}
              className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition cursor-pointer ${
                selectedPaletteChord === c
                  ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Sheet Grid for Placing Chords */}
      <div className="space-y-4 bg-slate-950 p-4 md:p-6 rounded-xl border border-slate-800/90 leading-loose">
        {parsed.lines.map((line, lineIdx) => {
          if (line.type === 'empty') {
            return <div key={line.id} className="h-4" />;
          }

          if (line.type === 'comment') {
            return (
              <div
                key={line.id}
                className="my-1 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold"
              >
                ⚡ {line.commentText}
              </div>
            );
          }

          if (line.type === 'section-start') {
            return (
              <div key={line.id} className="pt-2 text-xs font-bold text-amber-400 uppercase tracking-widest border-b border-slate-800 pb-1">
                {line.directiveValue || line.sectionType}
              </div>
            );
          }

          if (line.type === 'section-end') {
            return <div key={line.id} className="pb-1" />;
          }

          return (
            <div
              key={line.id}
              className="flex flex-wrap items-baseline gap-x-1.5 my-1 hover:bg-slate-900/60 p-1 rounded-lg transition"
            >
              {line.segments?.map((seg, segIdx) => {
                const isSelected =
                  activePlacement?.lineIdx === lineIdx && activePlacement?.segIdx === segIdx;

                return (
                  <div
                    key={segIdx}
                    onClick={() => {
                      // Click opens chord placement or places selectedPaletteChord
                      if (seg.chord) {
                        setActivePlacement({
                          lineIdx,
                          segIdx,
                          currentChord: seg.chord,
                        });
                      } else {
                        handlePlaceChord(lineIdx, segIdx, selectedPaletteChord);
                      }
                    }}
                    className={`inline-flex flex-col items-start align-bottom leading-tight group/word cursor-pointer p-0.5 rounded transition ${
                      isSelected ? 'ring-2 ring-amber-400 bg-amber-500/10' : 'hover:bg-slate-800/80'
                    }`}
                    title={lang === 'sk' ? 'Kliknite pre umiestnenie alebo úpravu akordu' : 'Click to place or edit chord'}
                  >
                    {/* Chord Badge */}
                    <div className="h-6 flex items-center">
                      {seg.chord ? (
                        <span className="font-mono font-bold text-amber-400 text-sm px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 shadow-sm flex items-center gap-1">
                          <span>{seg.chord}</span>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveChord(lineIdx, segIdx);
                            }}
                            className="text-[10px] text-amber-400 hover:text-red-400 ml-0.5"
                            title="Odstrániť akord"
                          >
                            ×
                          </span>
                        </span>
                      ) : (
                        <span className="opacity-0 group-hover/word:opacity-100 text-[10px] text-slate-500 font-mono px-1 rounded border border-dashed border-slate-700">
                          +[{selectedPaletteChord}]
                        </span>
                      )}
                    </div>

                    {/* Word / Syllable Text */}
                    <span className="font-sans text-base text-slate-100 whitespace-pre">
                      {seg.text || ' '}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Segment Popover / Modal for Specific Word */}
      {activePlacement && (
        <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/40 text-xs space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-400">
              {lang === 'sk' ? 'Zmeniť akord na tomto slove:' : 'Change chord on this word:'}
            </span>
            <button
              onClick={() => setActivePlacement(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {COMMON_CHORDS.map((c) => (
              <button
                key={c}
                onClick={() => handlePlaceChord(activePlacement.lineIdx, activePlacement.segIdx, c)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-mono text-xs font-bold cursor-pointer transition"
              >
                {c}
              </button>
            ))}
            <button
              onClick={() => handleRemoveChord(activePlacement.lineIdx, activePlacement.segIdx)}
              className="px-2 py-0.5 rounded bg-red-950/60 hover:bg-red-600 text-red-300 hover:text-white text-xs font-bold cursor-pointer transition ml-auto"
            >
              {lang === 'sk' ? 'Odstrániť akord' : 'Remove chord'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
