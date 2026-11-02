import React, { useState, useMemo } from 'react';
import { Song, SaxSoloNote, PerformanceNote, AudioRecord, InstrumentType } from '../types';
import { parseChordPro, transposeChordProText } from '../services/chordProParser';
import {
  ALL_KEYS,
  getSemitonesBetweenKeys,
  transposeChord,
  getInstrumentSemitoneOffset,
  getInstrumentLabel,
} from '../services/transposer';
import { useI18n } from '../services/i18n';
import { SaxSoloSection } from './SaxSoloSection';
import { AudioSection } from './AudioSection';
import { PerformanceNotesSection } from './PerformanceNotesSection';
import {
  ArrowLeft,
  Play,
  Edit3,
  Save,
  Star,
  Clock,
  Sparkles,
  Music2,
  Sliders,
  Maximize2,
  Copy,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Tag,
  Info,
} from 'lucide-react';

interface SongDetailProps {
  song: Song;
  onSaveSong: (updatedSong: Song) => void;
  onBack: () => void;
  onEnterStageMode: (song: Song, semitones: number, instrument: InstrumentType) => void;
  onDeleteSong: (id: string) => void;
}

export const SongDetail: React.FC<SongDetailProps> = ({
  song,
  onSaveSong,
  onBack,
  onEnterStageMode,
  onDeleteSong,
}) => {
  const { lang, t } = useI18n();

  // Mode: View or Edit
  const [isEditingChordPro, setIsEditingChordPro] = useState(false);
  const [editedText, setEditedText] = useState(song.chordProText);
  const [editedTitle, setEditedTitle] = useState(song.title);
  const [editedArtist, setEditedArtist] = useState(song.artist);
  const [editedKey, setEditedKey] = useState(song.currentKey || 'C');
  const [editedTempo, setEditedTempo] = useState<number | undefined>(song.tempo);
  const [editedCapo, setEditedCapo] = useState<number | undefined>(song.capo);
  const [editedTags, setEditedTags] = useState<string>(song.tags.join(', '));

  // Transposition states
  const [transpositionSemitones, setTranspositionSemitones] = useState<number>(0);
  const [preferFlats, setPreferFlats] = useState<boolean>(false);
  const [viewInstrument, setViewInstrument] = useState<InstrumentType>('concert');

  // Total semitones offset including instrument transposition (e.g. Alto sax +9)
  const instrumentOffset = getInstrumentSemitoneOffset(viewInstrument);
  const effectiveSemitones = transpositionSemitones + instrumentOffset;

  // Parsed ChordPro Song for rendering
  const parsed = useMemo(() => {
    return parseChordPro(song.chordProText, effectiveSemitones, preferFlats);
  }, [song.chordProText, effectiveSemitones, preferFlats]);

  // Current sounding/transposed key
  const effectiveKey = useMemo(() => {
    const baseKey = song.currentKey || song.originalKey || 'C';
    return transposeChord(baseKey, effectiveSemitones, preferFlats);
  }, [song.currentKey, song.originalKey, effectiveSemitones, preferFlats]);

  const handleTranspose = (delta: number) => {
    setTranspositionSemitones((prev) => prev + delta);
  };

  const handleResetTransposition = () => {
    setTranspositionSemitones(0);
  };

  const handleToggleFavorite = () => {
    onSaveSong({ ...song, isFavorite: !song.isFavorite });
  };

  const handleSaveChordProEdit = () => {
    const updatedTags = editedTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const updated: Song = {
      ...song,
      title: editedTitle.trim() || song.title,
      artist: editedArtist.trim() || song.artist,
      currentKey: editedKey,
      tempo: editedTempo,
      capo: editedCapo,
      tags: updatedTags,
      chordProText: editedText,
    };
    onSaveSong(updated);
    setIsEditingChordPro(false);
  };

  // Permanently commit current transposition into the ChordPro text
  const handleCommitTransposition = () => {
    if (transpositionSemitones === 0) return;
    const newText = transposeChordProText(song.chordProText, transpositionSemitones, preferFlats);
    const updated: Song = {
      ...song,
      currentKey: effectiveKey,
      chordProText: newText,
    };
    onSaveSong(updated);
    setTranspositionSemitones(0);
    alert(
      lang === 'sk'
        ? `Akordy boli permanentne transponované do tóniny ${effectiveKey}!`
        : `Chords permanently transposed to ${effectiveKey}!`
    );
  };

  // Quick insert buttons in editor
  const insertTextAtCursor = (textToInsert: string) => {
    setEditedText((prev) => prev + '\n' + textToInsert);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
            title={lang === 'sk' ? 'Späť na zoznam skladieb' : 'Back to songs'}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>{song.title}</span>
              <button
                onClick={handleToggleFavorite}
                className="cursor-pointer text-amber-400 hover:scale-110 transition"
              >
                <Star
                  className={`w-5 h-5 ${
                    song.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                  }`}
                />
              </button>
            </h1>
            <p className="text-sm font-medium text-slate-400">{song.artist}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Start Live Stage Mode Button */}
          <button
            onClick={() => onEnterStageMode(song, effectiveSemitones, viewInstrument)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-extrabold text-xs md:text-sm shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-95 transition cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
            <span>{t.enterStageMode}</span>
          </button>

          {/* Toggle Edit Button */}
          <button
            onClick={() => {
              if (isEditingChordPro) {
                handleSaveChordProEdit();
              } else {
                setEditedText(song.chordProText);
                setEditedTitle(song.title);
                setEditedArtist(song.artist);
                setEditedKey(song.currentKey);
                setEditedTempo(song.tempo);
                setEditedCapo(song.capo);
                setEditedTags(song.tags.join(', '));
                setIsEditingChordPro(true);
              }
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold transition cursor-pointer ${
              isEditingChordPro
                ? 'bg-emerald-600 text-white shadow-emerald-900/40'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {isEditingChordPro ? (
              <>
                <Save className="w-4 h-4" />
                <span>{t.save}</span>
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4" />
                <span>{t.editSong}</span>
              </>
            )}
          </button>

          {isEditingChordPro && (
            <button
              onClick={() => setIsEditingChordPro(false)}
              className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800 cursor-pointer"
            >
              {t.cancel}
            </button>
          )}
        </div>
      </div>

      {/* Musical Metadata & Transposition Hub */}
      {!isEditingChordPro && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-lg backdrop-blur-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Metadata Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-amber-500/30">
                <span className="text-[11px] text-slate-400">{t.currentKey}:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">{effectiveKey}</span>
                {song.originalKey && song.originalKey !== effectiveKey && (
                  <span className="text-[10px] text-slate-400">
                    (orig. {song.originalKey})
                  </span>
                )}
              </div>

              {song.tempo && (
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-mono font-semibold">{song.tempo} BPM</span>
                </div>
              )}

              {song.capo ? (
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs">
                  <span className="text-slate-400">Capo:</span>
                  <span className="font-semibold text-amber-300">{song.capo}. pražec</span>
                </div>
              ) : null}

              {song.timeSignature && (
                <div className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs font-mono">
                  {song.timeSignature}
                </div>
              )}
            </div>

            {/* Instrument View Selector */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-400 px-2 font-medium">
                {lang === 'sk' ? 'Akordy pre:' : 'View chords for:'}
              </span>
              {(['concert', 'tenor_sax', 'alto_sax'] as InstrumentType[]).map((inst) => (
                <button
                  key={inst}
                  onClick={() => setViewInstrument(inst)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer text-xs ${
                    viewInstrument === inst
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {inst === 'concert'
                    ? 'Concert (C)'
                    : inst === 'tenor_sax'
                    ? 'Tenor (B♭)'
                    : 'Alt (E♭)'}
                </button>
              ))}
            </div>
          </div>

          {/* Transposition Step Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                {t.transposition}:
              </span>

              <div className="flex items-center gap-1 bg-slate-950 rounded-xl border border-slate-800 p-0.5">
                <button
                  onClick={() => handleTranspose(-1)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs transition cursor-pointer active:scale-95"
                  title={t.transposeDown}
                >
                  -1
                </button>
                <span className="font-mono font-bold text-xs px-2 text-slate-100 min-w-8 text-center">
                  {transpositionSemitones > 0 ? `+${transpositionSemitones}` : transpositionSemitones}
                </span>
                <button
                  onClick={() => handleTranspose(1)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs transition cursor-pointer active:scale-95"
                  title={t.transposeUp}
                >
                  +1
                </button>
              </div>

              {transpositionSemitones !== 0 && (
                <button
                  onClick={handleResetTransposition}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 text-xs transition cursor-pointer"
                  title={t.resetKey}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Prefer Flats/Sharps Toggle */}
              <button
                onClick={() => setPreferFlats(!preferFlats)}
                className={`px-2 py-1 rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${
                  preferFlats ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-slate-800 text-slate-400'
                }`}
                title="Prepnúť krížiky (#) a béčka (♭)"
              >
                {preferFlats ? '♭ Flats' : '# Sharps'}
              </button>
            </div>

            {/* Permanent Transpose Save */}
            {transpositionSemitones !== 0 && (
              <button
                onClick={handleCommitTransposition}
                className="text-xs px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition cursor-pointer"
              >
                {lang === 'sk'
                  ? `Uložiť permanentne v tónine ${effectiveKey}`
                  : `Save permanently in key ${effectiveKey}`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ChordPro Editor View */}
      {isEditingChordPro ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">{t.title}</label>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">{t.artist}</label>
              <input
                type="text"
                value={editedArtist}
                onChange={(e) => setEditedArtist(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">{t.originalKey}</label>
              <select
                value={editedKey}
                onChange={(e) => setEditedKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-amber-400 font-mono font-bold focus:border-amber-500 focus:outline-none"
              >
                {ALL_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">{t.tempo}</label>
              <input
                type="number"
                value={editedTempo || ''}
                onChange={(e) => setEditedTempo(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                placeholder="120"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">{t.capo}</label>
              <input
                type="number"
                value={editedCapo || ''}
                onChange={(e) => setEditedCapo(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">{t.tags}</label>
              <input
                type="text"
                value={editedTags}
                onChange={(e) => setEditedTags(e.target.value)}
                placeholder="Rock, Ballad, Sax Solo"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Quick Chord Insertion Toolset */}
          <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <span className="text-[11px] text-slate-400 font-medium mr-1">{lang === 'sk' ? 'Vložiť akord:' : 'Insert chord:'}</span>
            {['[C]', '[D]', '[Dm]', '[E]', '[Em]', '[F]', '[G]', '[Am]', '[Bb]', '[B7]'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setEditedText((prev) => prev + c)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono font-bold cursor-pointer transition"
              >
                {c}
              </button>
            ))}
            <div className="h-4 w-px bg-slate-700 mx-1"></div>
            <button
              type="button"
              onClick={() => insertTextAtCursor('{c: Sax Solo - Alt / Tenor}')}
              className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[11px] font-semibold cursor-pointer"
            >
              + Sax Tag
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('{start_of_chorus}\n[C]Chorus text here...\n{end_of_chorus}')}
              className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[11px] font-semibold cursor-pointer"
            >
              + Chorus
            </button>
          </div>

          <div>
            <textarea
              rows={20}
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full bg-slate-950 font-mono text-xs md:text-sm text-slate-200 border border-slate-800 rounded-xl p-4 leading-relaxed focus:border-amber-500 focus:outline-none"
              placeholder="{title: Názov}\n[C]Text piesne..."
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => {
                if (confirm(lang === 'sk' ? 'Naozaj chcete zmazať túto skladbu?' : 'Delete this song?')) {
                  onDeleteSong(song.id);
                }
              }}
              className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition cursor-pointer"
            >
              {t.deleteSong}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditingChordPro(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSaveChordProEdit}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition cursor-pointer shadow-lg active:scale-95"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Sheet Music & Lyrics View */
        <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-5 md:p-8 shadow-2xl space-y-6">
          {/* Section: Rendered ChordPro Text */}
          <div className="chordpro-render font-sans text-slate-100 leading-loose space-y-3">
            {parsed.lines.map((line) => {
              if (line.type === 'empty') {
                return <div key={line.id} className="h-4" />;
              }

              if (line.type === 'comment') {
                return (
                  <div
                    key={line.id}
                    className="flex items-center gap-2 my-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs md:text-sm font-semibold tracking-wide"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>{line.commentText}</span>
                  </div>
                );
              }

              if (line.type === 'section-start') {
                return (
                  <div key={line.id} className="pt-2 text-xs font-bold text-amber-400/90 uppercase tracking-widest border-b border-slate-800 pb-1">
                    {line.directiveValue || line.sectionType}
                  </div>
                );
              }

              if (line.type === 'section-end') {
                return <div key={line.id} className="pb-1" />;
              }

              // Chord-Lyric line rendering
              const isChorus = line.sectionType === 'chorus';

              return (
                <div
                  key={line.id}
                  className={`flex flex-wrap items-baseline gap-x-1.5 my-1 ${
                    isChorus ? 'border-l-2 border-amber-500/60 pl-3.5 bg-amber-500/[0.02] py-1 rounded-r-lg' : ''
                  }`}
                >
                  {line.segments?.map((seg, idx) => (
                    <div key={idx} className="inline-flex flex-col items-start align-bottom leading-tight">
                      {seg.chord ? (
                        <span className="font-mono font-bold text-amber-400 text-sm md:text-base tracking-wide h-6 select-all">
                          {seg.chord}
                        </span>
                      ) : (
                        <span className="h-6" />
                      )}
                      <span className="font-sans text-base md:text-lg text-slate-100 whitespace-pre">
                        {seg.text || ' '}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Unique Chords In This Song */}
          {parsed.allUniqueChords.length > 0 && (
            <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">
                {lang === 'sk' ? 'Akordy v skladbe:' : 'Song Chords:'}
              </span>
              {parsed.allUniqueChords.map((chord) => (
                <span
                  key={chord}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-amber-300 font-mono font-bold text-xs shadow-inner"
                >
                  {chord}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Saxophone Solos Section */}
      <SaxSoloSection
        solos={song.saxSolos || []}
        songKey={effectiveKey}
        onUpdateSolos={(updatedSolos) => {
          onSaveSong({ ...song, saxSolos: updatedSolos });
        }}
      />

      {/* Performance Notes to Sheet */}
      <PerformanceNotesSection
        notes={song.performanceNotes || []}
        onUpdateNotes={(updatedNotes) => {
          onSaveSong({ ...song, performanceNotes: updatedNotes });
        }}
      />

      {/* Audio Records for Song */}
      <AudioSection
        songId={song.id}
        audioRecords={song.audioRecords || []}
        onUpdateRecords={(updatedRecords) => {
          onSaveSong({ ...song, audioRecords: updatedRecords });
        }}
      />
    </div>
  );
};
