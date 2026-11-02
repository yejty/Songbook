import React, { useState, useEffect } from 'react';
import { Song, Setlist, InstrumentType } from './types';
import {
  getAllSongs,
  saveSong,
  deleteSong,
  getAllSetlists,
  saveSetlist,
  deleteSetlist,
  getSyncConfig,
} from './services/db';
import { I18nProvider, useI18n } from './services/i18n';
import { Navbar } from './components/Navbar';
import { SongList } from './components/SongList';
import { SongDetail } from './components/SongDetail';
import { SetlistManager } from './components/SetlistManager';
import { StageMode } from './components/StageMode';
import { MegaSyncModal } from './components/MegaSyncModal';
import { ImportSongModal } from './components/ImportSongModal';
import { ChordProHelpModal } from './components/ChordProHelpModal';
import { OfflineIndicator } from './components/OfflineIndicator';

function AppContent() {
  const { lang, t } = useI18n();

  // Database State
  const [songs, setSongs] = useState<Song[]>([]);
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [megaConnected, setMegaConnected] = useState<boolean>(false);

  // Navigation State
  const [activeTab, setActiveTab] = useState<'songs' | 'setlists'>('songs');
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isMegaSyncOpen, setIsMegaSyncOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  // Live Stage Mode State - default to Alto Sax (Eb)
  const [isStageModeActive, setIsStageModeActive] = useState<boolean>(false);
  const [stageActiveSong, setStageActiveSong] = useState<Song | null>(null);
  const [stageActiveSetlist, setStageActiveSetlist] = useState<Setlist | null>(null);
  const [stageInitialSemitones, setStageInitialSemitones] = useState<number>(0);
  const [stageInitialInstrument, setStageInitialInstrument] = useState<InstrumentType>('alto_sax');

  // Load from IndexedDB
  const refreshData = async () => {
    try {
      const [loadedSongs, loadedSetlists, config] = await Promise.all([
        getAllSongs(),
        getAllSetlists(),
        getSyncConfig(),
      ]);
      setSongs(loadedSongs);
      setSetlists(loadedSetlists);
      setMegaConnected(config.isConnected);
    } catch (err) {
      console.error('Failed to load songs from IndexedDB', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Handlers for Songs
  const handleSaveSong = async (updatedSong: Song) => {
    await saveSong(updatedSong);
    setSongs((prev) =>
      prev.map((s) => (s.id === updatedSong.id ? updatedSong : s))
    );
  };

  const handleAddNewSong = async (newSong: Song) => {
    await saveSong(newSong);
    setSongs((prev) => [newSong, ...prev]);
    setSelectedSongId(newSong.id);
  };

  const handleDeleteSong = async (id: string) => {
    await deleteSong(id);
    setSongs((prev) => prev.filter((s) => s.id !== id));
    if (selectedSongId === id) setSelectedSongId(null);
  };

  // Handlers for Setlists
  const handleSaveSetlist = async (updatedSetlist: Setlist) => {
    await saveSetlist(updatedSetlist);
    setSetlists((prev) => {
      const exists = prev.some((s) => s.id === updatedSetlist.id);
      if (exists) {
        return prev.map((s) => (s.id === updatedSetlist.id ? updatedSetlist : s));
      }
      return [...prev, updatedSetlist];
    });
  };

  const handleDeleteSetlist = async (id: string) => {
    await deleteSetlist(id);
    setSetlists((prev) => prev.filter((s) => s.id !== id));
  };

  // Stage Mode Launchers
  const handleEnterStageModeForSingleSong = (
    song: Song,
    semitones: number = 0,
    instrument: InstrumentType = 'alto_sax'
  ) => {
    setStageActiveSong(song);
    setStageActiveSetlist(null);
    setStageInitialSemitones(semitones);
    setStageInitialInstrument(instrument);
    setIsStageModeActive(true);
  };

  const handleStartStageSetlist = (setlist: Setlist, startSongId?: string) => {
    const songItems = setlist.items.filter((i) => i.type === 'song');
    if (songItems.length === 0) return;

    const initialId = startSongId || songItems[0].songId;
    const initialSong = songs.find((s) => s.id === initialId) || songs[0];

    setStageActiveSong(initialSong);
    setStageActiveSetlist(setlist);
    setStageInitialSemitones(0);
    setStageInitialInstrument('alto_sax');
    setIsStageModeActive(true);
  };

  const selectedSong = songs.find((s) => s.id === selectedSongId) || null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl animate-pulse">
          🎷
        </div>
        <div className="text-center">
          <h2 className="font-bold text-base text-amber-400">SaxChord Stage</h2>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'sk' ? 'Načítavam offline databázu skladieb...' : 'Loading offline song library...'}
          </p>
        </div>
      </div>
    );
  }

  // Full Screen Live Stage Performance Mode
  if (isStageModeActive && stageActiveSong) {
    return (
      <StageMode
        initialSong={stageActiveSong}
        allSongs={songs}
        activeSetlist={stageActiveSetlist}
        initialSemitones={stageInitialSemitones}
        initialInstrument={stageInitialInstrument}
        onExit={() => setIsStageModeActive(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top App Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedSongId(null);
        }}
        songsCount={songs.length}
        setlistsCount={setlists.length}
        onOpenMegaSync={() => setIsMegaSyncOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        megaConnected={megaConnected}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {selectedSong ? (
          /* Song Sheet & Editor View (Side-by-side with notes and Alto Sax solos) */
          <SongDetail
            song={selectedSong}
            onSaveSong={handleSaveSong}
            onBack={() => setSelectedSongId(null)}
            onEnterStageMode={handleEnterStageModeForSingleSong}
            onDeleteSong={handleDeleteSong}
          />
        ) : activeTab === 'songs' ? (
          /* All Songs Explorer */
          <SongList
            songs={songs}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectSong={(id) => setSelectedSongId(id)}
            onEnterStageMode={handleEnterStageModeForSingleSong}
            onAddNewSong={handleAddNewSong}
            onOpenImportModal={() => setIsImportModalOpen(true)}
          />
        ) : (
          /* Setlists & Playlists Manager */
          <SetlistManager
            setlists={setlists}
            songs={songs}
            onSaveSetlist={handleSaveSetlist}
            onDeleteSetlist={handleDeleteSetlist}
            onStartStageSetlist={handleStartStageSetlist}
            onSelectSong={(id) => setSelectedSongId(id)}
          />
        )}
      </main>

      {/* Modals & Floating Indicators */}
      <ImportSongModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSong={handleAddNewSong}
      />

      <MegaSyncModal
        isOpen={isMegaSyncOpen}
        onClose={() => setIsMegaSyncOpen(false)}
        onSyncComplete={refreshData}
      />

      <ChordProHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}
