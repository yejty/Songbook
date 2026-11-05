import React, { useState, useMemo } from 'react';
import { Song, InstrumentType } from '../types';
import { useI18n } from '../services/i18n';
import { generateStarterChordPro } from '../services/chordProParser';
import {
  Search,
  Plus,
  Star,
  Play,
  Music,
  Clock,
  Sparkles,
  SlidersHorizontal,
  FolderOpen,
  Volume2,
  FileUp,
  User,
  ArrowUpDown,
  BookOpen,
  FolderArchive,
  Cloud,
} from 'lucide-react';

interface SongListProps {
  songs: Song[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectSong: (songId: string) => void;
  onEnterStageMode: (song: Song, semitones: number, instrument: InstrumentType) => void;
  onAddNewSong: (newSong: Song) => void;
  onOpenImportModal: () => void;
  onOpenMegaFolderImport?: () => void;
}

export const SongList: React.FC<SongListProps> = ({
  songs,
  searchQuery,
  onSearchChange,
  onSelectSong,
  onEnterStageMode,
  onAddNewSong,
  onOpenImportModal,
  onOpenMegaFolderImport,
}) => {
  const { lang, t } = useI18n();

  // Library filter: 'all' | 'my_songs' | 'favorites'
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'my_songs' | 'favorites'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'title' | 'artist' | 'recent' | 'key'>('title');

  const [showNewSongModal, setShowNewSongModal] = useState<boolean>(false);

  // New song form states
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newKey, setNewKey] = useState('C');
  const [newIsMySong, setNewIsMySong] = useState(true);

  // Collect all unique tags across songs
  const allTags = useMemo(() => {
    const set = new Set<string>();
    songs.forEach((s) => s.tags?.forEach((tag) => set.add(tag)));
    return Array.from(set);
  }, [songs]);

  const mySongsCount = useMemo(() => songs.filter((s) => s.isMySong).length, [songs]);
  const favoritesCount = useMemo(() => songs.filter((s) => s.isFavorite).length, [songs]);

  // Filtered & Sorted songs
  const filteredSongs = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    let result = songs.filter((song) => {
      if (libraryFilter === 'my_songs' && !song.isMySong) return false;
      if (libraryFilter === 'favorites' && !song.isFavorite) return false;
      if (selectedTag !== 'all' && !song.tags?.includes(selectedTag)) return false;

      if (!query) return true;

      const titleMatch = song.title.toLowerCase().includes(query);
      const artistMatch = song.artist.toLowerCase().includes(query);
      const keyMatch = (song.currentKey || '').toLowerCase().includes(query);
      const tagMatch = song.tags?.some((t) => t.toLowerCase().includes(query));
      const lyricsMatch = song.chordProText.toLowerCase().includes(query);

      return titleMatch || artistMatch || keyMatch || tagMatch || lyricsMatch;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'artist') return a.artist.localeCompare(b.artist);
      if (sortBy === 'key') return (a.currentKey || '').localeCompare(b.currentKey || '');
      if (sortBy === 'recent') return (b.lastModified || 0) - (a.lastModified || 0);
      return 0;
    });

    return result;
  }, [songs, searchQuery, libraryFilter, selectedTag, sortBy]);

  const handleCreateNewSong = () => {
    if (!newTitle.trim()) return;

    const initialChordPro = generateStarterChordPro(newTitle, newArtist, newKey);

    const created: Song = {
      id: `song-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: newTitle.trim(),
      artist: newArtist.trim() || (lang === 'sk' ? 'Moja tvorba' : 'My Composition'),
      originalKey: newKey,
      currentKey: newKey,
      tempo: 120,
      timeSignature: '4/4',
      tags: ['Alt Saxofón', newIsMySong ? 'Moja tvorba' : 'Cover'],
      chordProText: initialChordPro,
      performanceNotes: [],
      personalAnnotations: [],
      saxSolos: [
        {
          id: `sax-${Date.now()}`,
          title: lang === 'sk' ? 'Alt Saxofón (E♭) vyhrávka' : 'Alto Sax (E♭) Riff',
          concertKey: newKey,
          notesContent: `${newKey}5 - E5 - G5 | A5 - - -`,
          tips: lang === 'sk' ? 'Altový saxofón transponovaný o +9 poltónov' : 'Alto sax transposed +9 semitones',
        },
      ],
      audioRecords: [],
      isFavorite: false,
      isMySong: newIsMySong,
      lastModified: Date.now(),
    };

    onAddNewSong(created);
    setShowNewSongModal(false);
    setNewTitle('');
    setNewArtist('');
    setNewKey('C');
  };

  return (
    <div className="space-y-5 pb-20">
      {/* Top Search & Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl backdrop-blur-md space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Input with quick clear */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none transition shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* MEGA Initial Folder Import Button */}
            {onOpenMegaFolderImport && (
              <button
                onClick={onOpenMegaFolderImport}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs shadow-md transition active:scale-95 cursor-pointer"
                title={lang === 'sk' ? 'Prvotný import priečinkov s nôtami, audio a fotkami z MEGA' : 'Initial bulk import of song folders from MEGA'}
              >
                <FolderArchive className="w-4 h-4" />
                <span>{lang === 'sk' ? 'Prvotný import z MEGA' : 'Import from MEGA'}</span>
              </button>
            )}

            {/* IMPORT SONG BUTTON */}
            <button
              onClick={onOpenImportModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-extrabold text-xs shadow-md transition active:scale-95 cursor-pointer"
              title={lang === 'sk' ? 'Importovať text a automaticky konvertovať do ChordPro' : 'Import text and auto-convert to ChordPro'}
            >
              <FileUp className="w-4 h-4" />
              <span>{lang === 'sk' ? 'Importovať skladbu' : 'Import Song'}</span>
            </button>

            {/* Add New Song Button */}
            <button
              onClick={() => setShowNewSongModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs border border-slate-700 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>{t.newSong}</span>
            </button>
          </div>
        </div>

        {/* Library Tabs (Všetky skladby / Moje piesne / Obľúbené) & Sort Dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {/* All songs */}
            <button
              onClick={() => setLibraryFilter('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
                libraryFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{t.allSongs}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${libraryFilter === 'all' ? 'bg-slate-950 text-white' : 'bg-slate-800'}`}>
                {songs.length}
              </span>
            </button>

            {/* My Songs specifically */}
            <button
              onClick={() => setLibraryFilter('my_songs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
                libraryFilter === 'my_songs'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'sk' ? 'Moje piesne (Moja tvorba)' : 'My Songs (Originals)'}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${libraryFilter === 'my_songs' ? 'bg-slate-950 text-white' : 'bg-slate-800'}`}>
                {mySongsCount}
              </span>
            </button>

            {/* Favorites */}
            <button
              onClick={() => setLibraryFilter('favorites')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
                libraryFilter === 'favorites'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{t.favorites}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${libraryFilter === 'favorites' ? 'bg-slate-950 text-white' : 'bg-slate-800'}`}>
                {favoritesCount}
              </span>
            </button>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <span>Zoradiť:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
            >
              <option value="title">Podľa názvu (A-Z)</option>
              <option value="artist">Podľa interpreta</option>
              <option value="key">Podľa tóniny</option>
              <option value="recent">Najnovšie upravené</option>
            </select>
          </div>
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] text-slate-500 mr-1 self-center">Žánre:</span>
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
              selectedTag === 'all'
                ? 'bg-slate-700 text-white font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Všetky
          </button>

          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? 'all' : tag)}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                selectedTag === tag
                  ? 'bg-slate-700 text-white font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Songs Grid */}
      {filteredSongs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-dashed border-slate-800 text-slate-400 text-sm space-y-3">
          <FolderOpen className="w-10 h-10 mx-auto text-slate-600" />
          <p>{t.emptySongs}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                onSearchChange('');
                setLibraryFilter('all');
                setSelectedTag('all');
              }}
              className="text-xs text-amber-400 underline font-semibold cursor-pointer"
            >
              {lang === 'sk' ? 'Zrušiť filtre a zobraziť všetky' : 'Reset filters and show all'}
            </button>
            <button
              onClick={onOpenImportModal}
              className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold cursor-pointer"
            >
              {lang === 'sk' ? 'Importovať novú skladbu' : 'Import New Song'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSongs.map((song) => {
            const hasSax = song.saxSolos && song.saxSolos.length > 0;
            const hasAudio = song.audioRecords && song.audioRecords.length > 0;
            const hasPersonalNotes = song.personalAnnotations && song.personalAnnotations.length > 0;

            return (
              <div
                key={song.id}
                className="group p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-amber-500/50 hover:bg-slate-900 transition-all duration-200 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div
                      onClick={() => onSelectSong(song.id)}
                      className="cursor-pointer flex-1"
                    >
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-slate-100 group-hover:text-amber-400 transition leading-snug">
                          {song.title}
                        </h3>
                        {song.isMySong && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                            Moja
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">
                        {song.artist}
                      </p>
                    </div>

                    {/* Key badge */}
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-amber-400 shadow-inner">
                      {song.currentKey || 'C'}
                    </span>
                  </div>

                  {/* Badges: BPM, Sax, Audio, Tags, Personal Notes */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3 text-[11px]">
                    {song.tempo && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300 font-mono">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {song.tempo} BPM
                      </span>
                    )}

                    {hasSax && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium">
                        🎷 Alt Sax
                      </span>
                    )}

                    {hasAudio && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-300 font-medium">
                        <Volume2 className="w-3 h-3" />
                        {song.audioRecords.length}
                      </span>
                    )}

                    {hasPersonalNotes && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-300 font-medium">
                        📝 {song.personalAnnotations!.length} poznámok
                      </span>
                    )}

                    {song.capo ? (
                      <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-400">
                        Capo {song.capo}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Bottom Row: View Sheet & Live Stage Launch */}
                <div className="flex items-center justify-between gap-2 mt-5 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => onSelectSong(song.id)}
                    className="text-xs text-slate-300 hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>{lang === 'sk' ? 'Otvoriť noty a akordy' : 'Open Sheet & Chords'}</span>
                    <span>→</span>
                  </button>

                  <button
                    onClick={() => onEnterStageMode(song, 0, 'alto_sax')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-400 text-xs font-bold transition active:scale-95 cursor-pointer shadow"
                    title={lang === 'sk' ? 'Spustiť priamo na pódium' : 'Launch stage view'}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Stage</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Song Modal */}
      {showNewSongModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-4">
            <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>{t.newSong}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">{t.title}</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="napr. Moja nová pieseň"
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{t.artist}</label>
                <input
                  type="text"
                  value={newArtist}
                  onChange={(e) => setNewArtist(e.target.value)}
                  placeholder="napr. Moje Meno / Kapela"
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{t.originalKey}</label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="Dm, C, G..."
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-amber-400 font-mono font-bold focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsMySong}
                    onChange={(e) => setNewIsMySong(e.target.checked)}
                    className="rounded accent-emerald-500 cursor-pointer"
                  />
                  <span className="font-semibold text-emerald-400">
                    Označiť ako moju pieseň (Moja tvorba)
                  </span>
                </label>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              {lang === 'sk'
                ? 'Automaticky vytvoríme ChordPro šablónu s vyhrávkou pre Alt Saxofón a akordmi.'
                : 'We will auto-generate a ChordPro template with Alto Sax cues and chords.'}
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowNewSongModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleCreateNewSong}
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
