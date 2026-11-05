import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Song, Setlist, InstrumentType, SaxSoloNote } from '../types';
import { parseChordPro } from '../services/chordProParser';
import {
  transposeChord,
  getInstrumentSemitoneOffset,
  getInstrumentLabel,
  transposeSaxNotesText,
} from '../services/transposer';
import { useI18n } from '../services/i18n';
import {
  X,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Type,
  Music,
  Activity,
  Sliders,
  Sparkles,
  Volume2,
  FileText,
} from 'lucide-react';

interface StageModeProps {
  initialSong: Song;
  allSongs: Song[];
  activeSetlist?: Setlist | null;
  initialSemitones?: number;
  initialInstrument?: InstrumentType;
  onExit: () => void;
}

export const StageMode: React.FC<StageModeProps> = ({
  initialSong,
  allSongs,
  activeSetlist,
  initialSemitones = 0,
  initialInstrument = 'alto_sax',
  onExit,
}) => {
  const { lang, t } = useI18n();

  // Active song in stage mode
  const [currentSong, setCurrentSong] = useState<Song>(initialSong);
  const [transpositionSemitones, setTranspositionSemitones] = useState<number>(initialSemitones);
  const [instrument, setInstrument] = useState<InstrumentType>(initialInstrument);
  const [preferFlats, setPreferFlats] = useState<boolean>(false);

  // Auto-scroll states
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(3); // 1 (slow) to 10 (fast)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Font size scale: 1 (compact), 2 (normal), 3 (large), 4 (huge), 5 (stage-giant)
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(3);

  // Show Saxophone Solo Card overlay
  const [showSaxOverlay, setShowSaxOverlay] = useState<boolean>(false);

  // View Mode: 'chords' or 'sheets' (if scanned sheet music / PDF is attached)
  const [stageViewMode, setStageViewMode] = useState<'chords' | 'sheets'>('chords');
  const [activeAttachmentIndex, setActiveAttachmentIndex] = useState<number>(0);

  // Visual metronome state
  const [showMetronome, setShowMetronome] = useState<boolean>(false);
  const [beatActive, setBeatActive] = useState<boolean>(false);

  // Setlist sequence indices
  const setlistSongIds = useMemo(() => {
    if (!activeSetlist) return [];
    return activeSetlist.items.filter((item) => item.type === 'song').map((item) => item.songId);
  }, [activeSetlist]);

  const currentSetlistIndex = setlistSongIds.indexOf(currentSong.id);

  // Instrument pitch semitones
  const instrumentOffset = getInstrumentSemitoneOffset(instrument);
  const effectiveSemitones = transpositionSemitones + instrumentOffset;

  // Parsed ChordPro for stage rendering
  const parsed = useMemo(() => {
    return parseChordPro(currentSong.chordProText, effectiveSemitones, preferFlats);
  }, [currentSong.chordProText, effectiveSemitones, preferFlats]);

  const effectiveKey = useMemo(() => {
    const baseKey = currentSong.currentKey || currentSong.originalKey || 'C';
    return transposeChord(baseKey, effectiveSemitones, preferFlats);
  }, [currentSong.currentKey, currentSong.originalKey, effectiveSemitones, preferFlats]);

  // Visual Metronome interval
  useEffect(() => {
    if (!showMetronome || !currentSong.tempo) return;
    const bpm = currentSong.tempo;
    const intervalMs = (60 / bpm) * 1000;

    const interval = setInterval(() => {
      setBeatActive(true);
      setTimeout(() => setBeatActive(false), 120);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [showMetronome, currentSong.tempo]);

  // Smooth Auto-scroll animation loop
  useEffect(() => {
    if (!isAutoScrolling) return;

    let animId: number;
    let lastTime = performance.now();

    const scrollStep = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;

      if (scrollContainerRef.current) {
        // speed 1: 15px/sec, speed 10: 90px/sec
        const pxPerSecond = 10 + scrollSpeed * 10;
        const scrollDelta = (pxPerSecond * delta) / 1000;
        scrollContainerRef.current.scrollTop += scrollDelta;
      }
      animId = requestAnimationFrame(scrollStep);
    };

    animId = requestAnimationFrame(scrollStep);
    return () => cancelAnimationFrame(animId);
  }, [isAutoScrolling, scrollSpeed]);

  // Keyboard foot-pedal / bluetooth page-turner listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsAutoScrolling((prev) => !prev);
      } else if (e.key === 'PageDown' || e.key === 'ArrowDown') {
        // Scroll down one screen chunk
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollBy({ top: 300, behavior: 'smooth' });
        }
      } else if (e.key === 'PageUp' || e.key === 'ArrowUp') {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollBy({ top: -300, behavior: 'smooth' });
        }
      } else if (e.key === 'ArrowRight') {
        goToNextSong();
      } else if (e.key === 'ArrowLeft') {
        goToPrevSong();
      } else if (e.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSetlistIndex, setlistSongIds]);

  const goToNextSong = () => {
    if (activeSetlist && currentSetlistIndex !== -1 && currentSetlistIndex < setlistSongIds.length - 1) {
      const nextId = setlistSongIds[currentSetlistIndex + 1];
      const nextSong = allSongs.find((s) => s.id === nextId);
      if (nextSong) {
        setCurrentSong(nextSong);
        setTranspositionSemitones(0);
        if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
      }
    }
  };

  const goToPrevSong = () => {
    if (activeSetlist && currentSetlistIndex > 0) {
      const prevId = setlistSongIds[currentSetlistIndex - 1];
      const prevSong = allSongs.find((s) => s.id === prevId);
      if (prevSong) {
        setCurrentSong(prevSong);
        setTranspositionSemitones(0);
        if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
      }
    }
  };

  // Font size CSS classes
  const fontSizes = [
    { text: 'text-base', chord: 'text-sm' },
    { text: 'text-lg', chord: 'text-base' },
    { text: 'text-xl', chord: 'text-lg' },
    { text: 'text-2xl', chord: 'text-xl' },
    { text: 'text-3xl', chord: 'text-2xl' },
  ][fontSizeLevel - 1] || { text: 'text-xl', chord: 'text-lg' };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-slate-100 select-none overflow-hidden font-sans">
      {/* Stage Top Bar - High Contrast HUD */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-950/95 border-b border-zinc-800 backdrop-blur-md">
        {/* Left: Song Info & Setlist Progress */}
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 font-bold text-xs border border-zinc-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>{t.exitStageMode}</span>
          </button>

          <div>
            <h2 className="text-base md:text-lg font-black text-white leading-tight flex items-center gap-2">
              <span>{currentSong.title}</span>
              <span className="font-mono text-sm px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                {effectiveKey}
              </span>
            </h2>
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
              <span>{currentSong.artist}</span>
              {activeSetlist && (
                <span className="text-amber-400/90 font-semibold">
                  • {lang === 'sk' ? 'Skladba' : 'Song'} {currentSetlistIndex + 1}/{setlistSongIds.length}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Stage Controls (Auto-scroll, Font size, Metronome) */}
        <div className="flex items-center gap-2">
          {/* Visual Metronome */}
          {currentSong.tempo && (
            <button
              onClick={() => setShowMetronome(!showMetronome)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                showMetronome
                  ? 'bg-amber-500 text-black border border-amber-400'
                  : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
              }`}
              title="Vizuálny metronóm (tichý na pódium)"
            >
              <Activity className={`w-3.5 h-3.5 ${beatActive ? 'text-red-500 scale-125' : ''}`} />
              <span>{currentSong.tempo} BPM</span>
              {showMetronome && (
                <span
                  className={`w-2.5 h-2.5 rounded-full transition-transform ${
                    beatActive ? 'bg-red-500 scale-150' : 'bg-zinc-600'
                  }`}
                />
              )}
            </button>
          )}

          {/* Auto-Scroll Play/Pause */}
          <div className="flex items-center bg-zinc-900 rounded-xl border border-zinc-800 p-0.5">
            <button
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                isAutoScrolling
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
            >
              {isAutoScrolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isAutoScrolling ? (lang === 'sk' ? 'Pauza' : 'Pause') : (lang === 'sk' ? 'Rolovať' : 'Scroll')}</span>
            </button>

            {/* Scroll speed selector */}
            <div className="flex items-center px-2 gap-1 text-[11px] font-mono text-zinc-300">
              <span className="text-zinc-500">SPD:</span>
              <button
                onClick={() => setScrollSpeed((s) => Math.max(1, s - 1))}
                className="px-1 text-zinc-400 hover:text-white cursor-pointer font-bold"
              >
                -
              </button>
              <span className="font-bold text-amber-400 w-3 text-center">{scrollSpeed}</span>
              <button
                onClick={() => setScrollSpeed((s) => Math.min(10, s + 1))}
                className="px-1 text-zinc-400 hover:text-white cursor-pointer font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Font Size Stepper */}
          <div className="hidden sm:flex items-center bg-zinc-900 rounded-xl border border-zinc-800 px-2 py-1 gap-1 text-xs">
            <Type className="w-3.5 h-3.5 text-zinc-400" />
            <button
              onClick={() => setFontSizeLevel((l) => Math.max(1, l - 1))}
              className="px-1.5 py-0.5 text-zinc-300 hover:text-white font-bold cursor-pointer"
            >
              A-
            </button>
            <span className="text-amber-400 font-bold text-xs">{fontSizeLevel}</span>
            <button
              onClick={() => setFontSizeLevel((l) => Math.min(5, l + 1))}
              className="px-1.5 py-0.5 text-zinc-300 hover:text-white font-bold cursor-pointer"
            >
              A+
            </button>
          </div>

          {/* Sax Solo Popup Toggle */}
          {currentSong.saxSolos && currentSong.saxSolos.length > 0 && (
            <button
              onClick={() => setShowSaxOverlay(!showSaxOverlay)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                showSaxOverlay
                  ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/30'
                  : 'bg-zinc-900 text-amber-300 border border-amber-500/40 hover:bg-zinc-800'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Sax Solo</span>
            </button>
          )}
        </div>

        {/* Right: Instrument Pitch & Transpose quick switches */}
        <div className="flex items-center gap-2">
          {/* Toggle between Chords and Scanned Sheets / Notes on stage */}
          {currentSong.sheetAttachments && currentSong.sheetAttachments.length > 0 && (
            <button
              onClick={() => setStageViewMode(stageViewMode === 'chords' ? 'sheets' : 'chords')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                stageViewMode === 'sheets'
                  ? 'bg-amber-500 text-black border-amber-400 font-extrabold shadow-md'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:text-white'
              }`}
              title="Prepnúť zobrazenie na pódiu: Akordy ↔ Noty / Sken"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{stageViewMode === 'sheets' ? '🎼 Noty' : '🎸 Akordy'}</span>
            </button>
          )}

          {/* Instrument select */}
          <select
            value={instrument}
            onChange={(e) => setInstrument(e.target.value as InstrumentType)}
            className="bg-zinc-900 text-amber-300 font-semibold text-xs border border-zinc-700 rounded-xl px-2.5 py-1.5 cursor-pointer focus:outline-none"
          >
            <option value="alto_sax">🎷 Alt Saxofón (E♭)</option>
            <option value="concert">Koncertné (C)</option>
          </select>

          {/* Quick semitone transposer */}
          <div className="flex items-center bg-zinc-900 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setTranspositionSemitones((prev) => prev - 1)}
              className="px-2 py-1 text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
            >
              -1
            </button>
            <span className="font-mono text-xs px-1 text-zinc-300 font-bold">
              {transpositionSemitones > 0 ? `+${transpositionSemitones}` : transpositionSemitones}
            </span>
            <button
              onClick={() => setTranspositionSemitones((prev) => prev + 1)}
              className="px-2 py-1 text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
            >
              +1
            </button>
          </div>
        </div>
      </div>

      {/* Main Stage Scrolling Viewport */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-6 md:px-16 py-8 space-y-6 scroll-smooth"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Stage Performance Cue & Personal Annotations Banner */}
        {((currentSong.performanceNotes && currentSong.performanceNotes.length > 0) ||
          (currentSong.personalAnnotations && currentSong.personalAnnotations.length > 0)) && (
          <div className="p-4 rounded-2xl bg-zinc-950 border border-amber-500/30 flex flex-wrap gap-2.5">
            {currentSong.performanceNotes?.map((note) => (
              <span
                key={note.id}
                className="px-3 py-1 rounded-xl bg-zinc-900 text-amber-300 text-xs md:text-sm font-semibold border border-zinc-800 flex items-center gap-1.5"
              >
                <span className="text-[10px] uppercase font-bold text-amber-400">[{note.tag}]</span>
                <span>{note.text}</span>
              </span>
            ))}
            {currentSong.personalAnnotations?.map((ann) => (
              <span
                key={ann.id}
                className="px-3 py-1 rounded-xl bg-zinc-900 text-sky-300 text-xs md:text-sm font-semibold border border-sky-500/30 flex items-center gap-1.5"
              >
                <span className="text-[10px] uppercase font-bold text-sky-400">📝 [{ann.category}]</span>
                <span>{ann.text}</span>
              </span>
            ))}
          </div>
        )}

        {/* High Contrast Chords & Lyrics Render OR Scanned Sheet Music Attachment */}
        {stageViewMode === 'sheets' && currentSong.sheetAttachments && currentSong.sheetAttachments.length > 0 ? (
          <div className="max-w-5xl mx-auto flex flex-col items-center gap-4 py-4">
            {/* Sheet Page Switcher */}
            {currentSong.sheetAttachments.length > 1 && (
              <div className="flex items-center gap-2 p-1.5 bg-zinc-900 rounded-xl border border-zinc-800">
                {currentSong.sheetAttachments.map((att, idx) => (
                  <button
                    key={att.id}
                    onClick={() => setActiveAttachmentIndex(idx)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeAttachmentIndex === idx
                        ? 'bg-amber-500 text-black'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Strana / Notový list {idx + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Display Active Sheet Music */}
            {(() => {
              const att = currentSong.sheetAttachments[activeAttachmentIndex] || currentSong.sheetAttachments[0];
              const src = att.blobUrl || att.base64Data;
              if (att.type === 'pdf') {
                return (
                  <div className="w-full bg-zinc-900 rounded-2xl border border-zinc-800 p-2 text-center">
                    <iframe
                      src={src ? `${src}#toolbar=0` : ''}
                      title={att.name}
                      className="w-full h-[75vh] rounded-xl border border-zinc-800"
                    />
                  </div>
                );
              }
              return (
                <div className="w-full flex justify-center">
                  <img
                    src={src}
                    alt={att.name}
                    className="max-h-[82vh] w-auto rounded-xl shadow-2xl object-contain border border-zinc-800"
                  />
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="stage-lyrics-flow space-y-4 max-w-5xl mx-auto">
            {parsed.lines.map((line) => {
              if (line.type === 'empty') {
                return <div key={line.id} className="h-6" />;
              }

              if (line.type === 'comment') {
                return (
                  <div
                    key={line.id}
                    className="my-3 px-4 py-2 rounded-xl bg-amber-500/20 border-l-4 border-amber-400 text-amber-300 text-base md:text-lg font-bold tracking-wide"
                  >
                    ⚡ {line.commentText}
                  </div>
                );
              }

              if (line.type === 'section-start') {
                return (
                  <div
                    key={line.id}
                    className="pt-4 pb-1 text-sm md:text-base font-extrabold text-amber-400 uppercase tracking-widest border-b border-zinc-800"
                  >
                    {line.directiveValue || line.sectionType}
                  </div>
                );
              }

              if (line.type === 'section-end') {
                return <div key={line.id} className="pb-2" />;
              }

              const isChorus = line.sectionType === 'chorus';

              return (
                <div
                  key={line.id}
                  className={`flex flex-wrap items-baseline gap-x-3 my-2 ${
                    isChorus ? 'border-l-4 border-amber-400 pl-4 bg-amber-950/20 py-2 rounded-r-xl' : ''
                  }`}
                >
                  {line.segments?.map((seg, idx) => (
                    <div key={idx} className="inline-flex flex-col items-start align-bottom leading-tight">
                      {seg.chord ? (
                        <span
                          className={`font-mono font-black text-amber-300 tracking-wider ${fontSizes.chord} select-all`}
                        >
                          {seg.chord}
                        </span>
                      ) : (
                        <span className={fontSizes.chord}>&nbsp;</span>
                      )}
                      <span
                        className={`font-sans font-medium text-white whitespace-pre ${fontSizes.text}`}
                      >
                        {seg.text || ' '}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* End of song spacer */}
        <div className="h-32 text-center text-zinc-600 text-sm font-mono pt-12">
          --- {lang === 'sk' ? 'Koniec skladby' : 'End of Song'} ---
        </div>
      </div>

      {/* Floating Saxophone Solo Overlay HUD */}
      {showSaxOverlay && currentSong.saxSolos && currentSong.saxSolos.length > 0 && (
        <div className="absolute right-4 bottom-20 z-50 w-full max-w-md p-5 rounded-2xl bg-zinc-950/95 border-2 border-amber-400 text-white shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎷</span>
              <div>
                <h4 className="font-bold text-amber-400 text-sm">
                  {currentSong.saxSolos[0].title}
                </h4>
                <p className="text-[11px] text-zinc-400">
                  {getInstrumentLabel(instrument, lang)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSaxOverlay(false)}
              className="p-1 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 font-mono text-sm text-amber-200 bg-black/80 p-3 rounded-xl border border-zinc-800 max-h-56 overflow-y-auto leading-relaxed">
            {transposeSaxNotesText(
              currentSong.saxSolos[0].notesContent,
              instrumentOffset,
              instrument !== 'concert'
            )}
          </div>

          {currentSong.saxSolos[0].tips && (
            <p className="mt-2 text-xs text-amber-400/90 italic">
              💡 {currentSong.saxSolos[0].tips}
            </p>
          )}
        </div>
      )}

      {/* Bottom Stage Foot-Pedal / Touch Navigation Bar */}
      {activeSetlist && setlistSongIds.length > 1 && (
        <div className="flex items-center justify-between px-6 py-3 bg-zinc-950 border-t border-zinc-800">
          <button
            onClick={goToPrevSong}
            disabled={currentSetlistIndex <= 0}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition active:scale-95 cursor-pointer ${
              currentSetlistIndex > 0
                ? 'bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-700'
                : 'opacity-30 cursor-not-allowed text-zinc-600'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            <span>{t.prevSong}</span>
          </button>

          {/* Quick jump to Next Song title preview */}
          <div className="text-center">
            {currentSetlistIndex < setlistSongIds.length - 1 && (
              <span className="text-xs text-zinc-400">
                {lang === 'sk' ? 'Nasleduje:' : 'Next up:'}{' '}
                <strong className="text-amber-400">
                  {allSongs.find((s) => s.id === setlistSongIds[currentSetlistIndex + 1])?.title}
                </strong>
              </span>
            )}
          </div>

          <button
            onClick={goToNextSong}
            disabled={currentSetlistIndex >= setlistSongIds.length - 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition active:scale-95 cursor-pointer ${
              currentSetlistIndex < setlistSongIds.length - 1
                ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/30'
                : 'opacity-30 cursor-not-allowed text-zinc-600'
            }`}
          >
            <span>{t.nextSong}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
