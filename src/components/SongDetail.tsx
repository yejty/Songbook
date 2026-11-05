import React, { useState, useMemo } from 'react';
import { Song, SaxSoloNote, PerformanceNote, PersonalAnnotation, AudioRecord, InstrumentType } from '../types';
import { parseChordPro, transposeChordProText } from '../services/chordProParser';
import {
  ALL_KEYS,
  transposeChord,
  getInstrumentSemitoneOffset,
  getInstrumentLabel,
} from '../services/transposer';
import { useI18n } from '../services/i18n';
import { SaxSoloSection } from './SaxSoloSection';
import { AudioSection } from './AudioSection';
import { PerformanceNotesSection } from './PerformanceNotesSection';
import { PersonalAnnotationsSection } from './PersonalAnnotationsSection';
import { VisualChordEditor } from './VisualChordEditor';
import { SheetMusicViewer } from './SheetMusicViewer';
import { NotationEditor } from './NotationEditor';
import { downloadSongPdf, generateSongPdfBlob } from '../services/pdfExporter';
import { uploadSongBundleToMega } from '../services/megaSync';
import {
  ArrowLeft,
  Play,
  Edit3,
  Save,
  Star,
  Clock,
  Sparkles,
  Sliders,
  Maximize2,
  FileDown,
  CloudUpload,
  RotateCcw,
  CheckCircle,
  FileText,
  Music,
  Eye,
  EyeOff,
  Type,
  MousePointerClick,
  Code,
  X,
  Share2,
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
  const [editTab, setEditTab] = useState<'visual' | 'code'>('visual'); // 'visual' for placing chords, 'code' for raw text
  const [editedText, setEditedText] = useState(song.chordProText);
  const [editedTitle, setEditedTitle] = useState(song.title);
  const [editedArtist, setEditedArtist] = useState(song.artist);
  const [editedKey, setEditedKey] = useState(song.currentKey || 'C');
  const [editedTempo, setEditedTempo] = useState<number | undefined>(song.tempo);
  const [editedCapo, setEditedCapo] = useState<number | undefined>(song.capo);
  const [editedTags, setEditedTags] = useState<string>(song.tags.join(', '));
  const [editedIsMySong, setEditedIsMySong] = useState<boolean>(Boolean(song.isMySong));

  // Viewer controls: Toggle chords on/off, Font zoom
  const [showChords, setShowChords] = useState<boolean>(true);
  const [fontSizeDelta, setFontSizeDelta] = useState<number>(0); // -1, 0, 1, 2

  // Transposition states: Default to Alto Saxophone (Eb)
  const [transpositionSemitones, setTranspositionSemitones] = useState<number>(0);
  const [preferFlats, setPreferFlats] = useState<boolean>(false);
  const [viewInstrument, setViewInstrument] = useState<InstrumentType>('alto_sax');

  // Main View Switcher: Chords Sheet, Scanned Sheet Music & PDFs, or Music Notation Editor
  const [mainViewTab, setMainViewTab] = useState<'chords' | 'sheet_viewer' | 'notation_editor'>('chords');

  // PDF Export Modal state
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);
  const [pdfExportMode, setPdfExportMode] = useState<'both' | 'lyrics_only'>('both');
  const [isUploadingToMega, setIsUploadingToMega] = useState<boolean>(false);
  const [megaUploadSuccessMsg, setMegaUploadSuccessMsg] = useState<string | null>(null);

  // Semitones offset for Alto Sax (+9) or Concert (0)
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

  const handleToggleMySong = () => {
    onSaveSong({ ...song, isMySong: !song.isMySong });
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
      isMySong: editedIsMySong,
      chordProText: editedText,
    };
    onSaveSong(updated);
    setIsEditingChordPro(false);
  };

  // PDF Download Execution
  const executeDownloadPdf = (mode: 'both' | 'lyrics_only') => {
    downloadSongPdf(song, {
      instrument: viewInstrument,
      semitones: transpositionSemitones,
      preferFlats,
      mode,
    });
    setShowPdfModal(false);
  };

  // Upload Song PDF + Audio records directly to MEGA Cloud
  const executeSaveToMegaCloud = async (mode: 'both' | 'lyrics_only') => {
    try {
      setIsUploadingToMega(true);
      setMegaUploadSuccessMsg(null);

      // Generate PDF Blob
      const { blob: pdfBlob } = generateSongPdfBlob(song, {
        instrument: 'alto_sax',
        semitones: transpositionSemitones,
        preferFlats,
        mode,
      });

      // Save PDF and all audio takes to MEGA Cloud
      const res = await uploadSongBundleToMega(song, pdfBlob);
      if (res.success) {
        setMegaUploadSuccessMsg(res.message);
        setShowPdfModal(false);
        setTimeout(() => setMegaUploadSuccessMsg(null), 6000);
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert('Chyba pri ukladaní na MEGA: ' + err?.message);
    } finally {
      setIsUploadingToMega(false);
    }
  };

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
            title={lang === 'sk' ? 'Späť na knižnicu skladieb' : 'Back to library'}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>{song.title}</span>
                <button
                  onClick={handleToggleFavorite}
                  className="cursor-pointer text-amber-400 hover:scale-110 transition"
                  title="Pridať medzi obľúbené"
                >
                  <Star
                    className={`w-5 h-5 ${
                      song.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                    }`}
                  />
                </button>
              </h1>
              {song.isMySong && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  {lang === 'sk' ? 'Moja pieseň' : 'My Song'}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-slate-400">{song.artist}</p>
          </div>
        </div>

        {/* Action Buttons: Stage Mode, PDF Export options, Edit */}
        <div className="flex flex-wrap items-center gap-2">
          {/* PDF Export Hub (Supports Both & Lyrics Only!) */}
          <button
            onClick={() => setShowPdfModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition cursor-pointer"
            title="Exportovať PDF (iba text alebo akordy + text)"
          >
            <FileDown className="w-4 h-4 text-amber-400" />
            <span>PDF Export</span>
          </button>

          {/* Quick direct upload to MEGA */}
          <button
            onClick={() => executeSaveToMegaCloud('both')}
            disabled={isUploadingToMega}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600/90 hover:bg-red-500 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
            title={lang === 'sk' ? 'Uložiť PDF a audio nahrávky do pripojeného MEGA cloudu' : 'Upload PDF & audio to MEGA cloud'}
          >
            <CloudUpload className="w-4 h-4" />
            <span>{isUploadingToMega ? 'Ukladám...' : 'MEGA Cloud'}</span>
          </button>

          {/* Start Live Stage Mode Button */}
          <button
            onClick={() => onEnterStageMode(song, effectiveSemitones, viewInstrument)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-95 transition cursor-pointer"
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
                setEditedIsMySong(Boolean(song.isMySong));
                setIsEditingChordPro(true);
              }
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
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

      {/* Cloud Upload Success Toast Banner */}
      {megaUploadSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2.5 shadow-lg animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{megaUploadSuccessMsg}</span>
        </div>
      )}

      {/* Musical Metadata & Transposition Hub */}
      {!isEditingChordPro && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-lg backdrop-blur-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Metadata Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-amber-500/40">
                <span className="text-[11px] text-slate-400">{t.currentKey}:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">{effectiveKey}</span>
                {viewInstrument === 'alto_sax' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                    Alt Sax (E♭) +9
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

              {/* Toggle My Song Badge */}
              <button
                onClick={handleToggleMySong}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  song.isMySong
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {song.isMySong ? '★ Moja tvorba' : '+ Označiť ako moju pieseň'}
              </button>
            </div>

            {/* Instrument View Selector - Alto Sax as default & prominent */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-400 px-2 font-medium">
                {lang === 'sk' ? 'Ladenie:' : 'Pitch:'}
              </span>
              <button
                onClick={() => setViewInstrument('alto_sax')}
                className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer text-xs ${
                  viewInstrument === 'alto_sax'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🎷 Alt Saxofón (E♭)
              </button>
              <button
                onClick={() => setViewInstrument('concert')}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer text-xs ${
                  viewInstrument === 'concert'
                    ? 'bg-slate-700 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Koncertné (C)
              </button>
            </div>
          </div>

          {/* Transposition Step Bar & Viewer Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
            {/* Transpose +/- */}
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

            {/* Chord Sheet Viewer Controls: Show/Hide Chords & Font Zoom */}
            <div className="flex items-center gap-2">
              {/* Show/Hide Chords Toggle */}
              <button
                onClick={() => setShowChords(!showChords)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  showChords
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
                title={showChords ? 'Zobraziť iba text bez akordov' : 'Zobraziť akordy nad textom'}
              >
                {showChords ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{showChords ? 'Akordy: Zapnuté' : 'Iba text'}</span>
              </button>

              {/* Font Zoom */}
              <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 px-2 py-1 gap-1 text-xs text-slate-300">
                <Type className="w-3 h-3 text-slate-400" />
                <button
                  onClick={() => setFontSizeDelta((d) => Math.max(-1, d - 1))}
                  className="px-1 font-bold hover:text-white cursor-pointer"
                >
                  -
                </button>
                <span className="font-mono text-amber-400 text-xs">
                  {fontSizeDelta === 0 ? '100%' : `${100 + fontSizeDelta * 20}%`}
                </span>
                <button
                  onClick={() => setFontSizeDelta((d) => Math.min(2, d + 1))}
                  className="px-1 font-bold hover:text-white cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Switcher: Chords Sheet, Scanned Sheet Music & PDFs, or Music Notation Editor */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-2 rounded-2xl">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setMainViewTab('chords')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition cursor-pointer ${
              mainViewTab === 'chords'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>{lang === 'sk' ? 'Akordy a text (Chord Sheet)' : 'Chords & Lyrics'}</span>
          </button>

          <button
            onClick={() => setMainViewTab('sheet_viewer')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition cursor-pointer ${
              mainViewTab === 'sheet_viewer'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{lang === 'sk' ? 'Noty, PDF a Fotky' : 'Sheet Music & Scans'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              mainViewTab === 'sheet_viewer' ? 'bg-slate-950 text-white font-bold' : 'bg-slate-800 text-slate-300'
            }`}>
              {song.sheetAttachments?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setMainViewTab('notation_editor')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition cursor-pointer ${
              mainViewTab === 'notation_editor'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{lang === 'sk' ? 'Notový editor (Osnova)' : 'Notation Editor'}</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 hidden sm:block pr-3">
          {mainViewTab === 'chords' && (lang === 'sk' ? 'Text s akordami v ChordPro formáte' : 'ChordPro formatted lyrics')}
          {mainViewTab === 'sheet_viewer' && (lang === 'sk' ? 'Prehliadač nôt, PDF a fotografií akordov' : 'Viewer for sheet music & PDFs')}
          {mainViewTab === 'notation_editor' && (lang === 'sk' ? '5-riadková osnova pre Alt Sax a exporty' : '5-line stave for Alto Sax & exports')}
        </div>
      </div>

      {/* SIDE-BY-SIDE MAIN LAYOUT:
          LEFT: Lyrics & Chords Sheet / Sheet Music Viewer / Notation Editor
          RIGHT: Sticky Side Panel with Personal Annotations, Alto Sax Solos, and Audio Takes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Lg: 7 cols): Sheet Lyrics & Chords / Sheet Music / Editor */}
        <div className="lg:col-span-7 space-y-6">
          {mainViewTab === 'sheet_viewer' ? (
            /* Tab 2: Sheet Music & Scanned Photos Viewer */
            <SheetMusicViewer
              attachments={song.sheetAttachments || []}
              onUpdateAttachments={(updated) => onSaveSong({ ...song, sheetAttachments: updated })}
            />
          ) : mainViewTab === 'notation_editor' ? (
            /* Tab 3: 5-line Stave Notation Editor */
            <NotationEditor
              notation={song.sheetNotation}
              songTitle={song.title}
              songArtist={song.artist}
              songKey={effectiveKey}
              onSaveNotation={(updatedNotation) => onSaveSong({ ...song, sheetNotation: updatedNotation })}
              onUploadToMega={() => executeSaveToMegaCloud('both')}
            />
          ) : isEditingChordPro ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
              {/* Editor sub-tab switcher: Visual Place Chords vs Raw Code */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setEditTab('visual')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      editTab === 'visual'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <MousePointerClick className="w-3.5 h-3.5" />
                    <span>{lang === 'sk' ? 'Vizuálne umiestňovanie akordov (Place Chords)' : 'Visual Place Chords'}</span>
                  </button>

                  <button
                    onClick={() => setEditTab('code')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      editTab === 'code'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>ChordPro Kód</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditingChordPro(false)}
                    className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800 cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleSaveChordProEdit}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition cursor-pointer shadow-lg active:scale-95"
                  >
                    {t.save}
                  </button>
                </div>
              </div>

              {/* Metadata Inputs */}
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

              {/* Sub-mode 1: Visual Chord Placement Editor */}
              {editTab === 'visual' ? (
                <VisualChordEditor
                  chordProText={editedText}
                  onChangeChordPro={setEditedText}
                  currentKey={editedKey}
                />
              ) : (
                /* Sub-mode 2: Raw ChordPro Code */
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                    <span className="text-[11px] text-slate-400 font-medium mr-1">Rýchle akordy:</span>
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
                      onClick={() => insertTextAtCursor('{c: Alt Saxofón sólo}')}
                      className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[11px] font-semibold cursor-pointer"
                    >
                      + Alt Sax
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('{start_of_chorus}\n[C]Refrén...\n{end_of_chorus}')}
                      className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[11px] font-semibold cursor-pointer"
                    >
                      + Chorus
                    </button>
                  </div>

                  <textarea
                    rows={18}
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full bg-slate-950 font-mono text-xs md:text-sm text-slate-200 border border-slate-800 rounded-xl p-4 leading-relaxed focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          ) : (
            /* Sheet Music & Lyrics Viewer */
            <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-5 md:p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  <span>
                    {showChords
                      ? (lang === 'sk' ? 'Notový list: Akordy & Text' : 'Chord Sheet & Lyrics')
                      : (lang === 'sk' ? 'Iba text piesne (Lyrics Only)' : 'Lyrics Only View')}
                  </span>
                  {showChords && viewInstrument === 'alto_sax' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                      Alt Sax (E♭)
                    </span>
                  )}
                </span>
                <span className="text-xs text-slate-400">
                  {lang === 'sk' ? 'Osobné poznámky sú umiestnené v paneli vpravo →' : 'Personal notes are in the right sidebar →'}
                </span>
              </div>

              {/* ChordPro Render */}
              <div
                className={`chordpro-render font-sans text-slate-100 leading-loose space-y-3 ${
                  fontSizeDelta === -1
                    ? 'text-sm'
                    : fontSizeDelta === 1
                    ? 'text-lg'
                    : fontSizeDelta === 2
                    ? 'text-xl'
                    : 'text-base'
                }`}
              >
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
                      <div
                        key={line.id}
                        className="pt-2 text-xs font-bold text-amber-400/90 uppercase tracking-widest border-b border-slate-800 pb-1"
                      >
                        {line.directiveValue || line.sectionType}
                      </div>
                    );
                  }

                  if (line.type === 'section-end') {
                    return <div key={line.id} className="pb-1" />;
                  }

                  const isChorus = line.sectionType === 'chorus';

                  return (
                    <div
                      key={line.id}
                      className={`flex flex-wrap items-baseline gap-x-1.5 my-1 ${
                        isChorus ? 'border-l-2 border-amber-400 pl-3.5 bg-amber-500/[0.03] py-1 rounded-r-lg' : ''
                      }`}
                    >
                      {line.segments?.map((seg, idx) => (
                        <div key={idx} className="inline-flex flex-col items-start align-bottom leading-tight">
                          {showChords ? (
                            seg.chord ? (
                              <span className="font-mono font-bold text-amber-300 text-sm md:text-base tracking-wide h-6 select-all">
                                {seg.chord}
                              </span>
                            ) : (
                              <span className="h-6" />
                            )
                          ) : null}
                          <span className="font-sans text-base md:text-lg text-slate-100 whitespace-pre">
                            {seg.text || ' '}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* Unique chords pill bar */}
              {showChords && parsed.allUniqueChords.length > 0 && (
                <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">
                    {lang === 'sk' ? 'Akordy v piesni:' : 'Chords:'}
                  </span>
                  {parsed.allUniqueChords.map((chord) => (
                    <span
                      key={chord}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-amber-300 font-mono font-bold text-xs"
                    >
                      {chord}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column (Lg: 5 cols): NOTES & SAX & AUDIO SIDEBAR (Side-by-side) */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
          {/* 1. Personal Annotations - PERSONAL NOTES FOR THIS SONG */}
          <PersonalAnnotationsSection
            annotations={song.personalAnnotations || []}
            onUpdateAnnotations={(updated) => {
              onSaveSong({ ...song, personalAnnotations: updated });
            }}
          />

          {/* 2. Performance Notes & Stage Cues */}
          <PerformanceNotesSection
            notes={song.performanceNotes || []}
            onUpdateNotes={(updatedNotes) => {
              onSaveSong({ ...song, performanceNotes: updatedNotes });
            }}
          />

          {/* 3. Alto Saxophone (E♭) Solos & Scale Guide */}
          <SaxSoloSection
            solos={song.saxSolos || []}
            songKey={effectiveKey}
            onUpdateSolos={(updatedSolos) => {
              onSaveSong({ ...song, saxSolos: updatedSolos });
            }}
          />

          {/* 4. Audio Takes & Rehearsal Recorder with MEGA cloud integration */}
          <AudioSection
            songId={song.id}
            audioRecords={song.audioRecords || []}
            onUpdateRecords={(updatedRecords) => {
              onSaveSong({ ...song, audioRecords: updatedRecords });
            }}
          />
        </div>
      </div>

      {/* PDF Export Selection Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileDown className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  {lang === 'sk' ? 'PDF Export skladby' : 'Export Song to PDF'}
                </h3>
              </div>
              <button
                onClick={() => setShowPdfModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Choose Mode */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                {lang === 'sk' ? 'Vyberte obsah PDF exportu:' : 'Select PDF content:'}
              </label>

              <div className="grid grid-cols-1 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPdfExportMode('both')}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                    pdfExportMode === 'both'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold flex items-center gap-2">
                      <span>🎵 Kompletný notový list (Akordy + Text)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Obsahuje akordy nad textom (Alt Sax E♭), poodiové poznámky a sólo.
                    </p>
                  </div>
                  {pdfExportMode === 'both' && <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => setPdfExportMode('lyrics_only')}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                    pdfExportMode === 'lyrics_only'
                      ? 'bg-sky-500/15 border-sky-500 text-sky-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold flex items-center gap-2">
                      <span>📄 Iba text piesne (Lyrics Only)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Čistý text bez akordov, ideálny pre speváka alebo čítanie textu na pódiu.
                    </p>
                  </div>
                  {pdfExportMode === 'lyrics_only' && <CheckCircle className="w-4 h-4 text-sky-400 flex-shrink-0" />}
                </button>
              </div>
            </div>

            {/* Action Buttons: Download PDF or Save to MEGA */}
            <div className="space-y-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => executeDownloadPdf(pdfExportMode)}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-lg"
              >
                <FileDown className="w-4 h-4" />
                <span>
                  {pdfExportMode === 'lyrics_only'
                    ? 'Stiahnuť PDF (Iba text)'
                    : 'Stiahnuť PDF (Akordy + Text pre Alt Sax)'}
                </span>
              </button>

              <button
                onClick={() => executeSaveToMegaCloud(pdfExportMode)}
                disabled={isUploadingToMega}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-lg disabled:opacity-50"
              >
                <CloudUpload className="w-4 h-4" />
                <span>
                  {isUploadingToMega
                    ? 'Ukladám do MEGA...'
                    : 'Uložiť toto PDF a audio do MEGA Cloudu'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
