import React, { useState } from 'react';
import { Setlist, SetlistItem, Song } from '../types';
import { useI18n } from '../services/i18n';
import {
  ListMusic,
  Plus,
  Play,
  Calendar,
  MapPin,
  Clock,
  Trash2,
  ChevronUp,
  ChevronDown,
  Coffee,
  Search,
  Check,
  Share2,
  Edit2,
  ArrowRight,
} from 'lucide-react';

interface SetlistManagerProps {
  setlists: Setlist[];
  songs: Song[];
  onSaveSetlist: (setlist: Setlist) => void;
  onDeleteSetlist: (id: string) => void;
  onStartStageSetlist: (setlist: Setlist, startSongId?: string) => void;
  onSelectSong: (songId: string) => void;
}

export const SetlistManager: React.FC<SetlistManagerProps> = ({
  setlists,
  songs,
  onSaveSetlist,
  onDeleteSetlist,
  onStartStageSetlist,
  onSelectSong,
}) => {
  const { lang, t } = useI18n();

  const [activeSetlistId, setActiveSetlistId] = useState<string | null>(
    setlists[0]?.id || null
  );

  const [isCreatingSetlist, setIsCreatingSetlist] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [newSetVenue, setNewSetVenue] = useState('');
  const [newSetDate, setNewSetDate] = useState('');
  const [newSetNotes, setNewSetNotes] = useState('');

  // Song Picker Modal for active setlist
  const [showSongPicker, setShowSongPicker] = useState(false);
  const [songPickerSearch, setSongPickerSearch] = useState('');

  // Break modal
  const [showAddBreak, setShowAddBreak] = useState(false);
  const [breakMinutes, setBreakMinutes] = useState(15);
  const [breakNote, setBreakNote] = useState('');

  const activeSetlist = setlists.find((s) => s.id === activeSetlistId) || setlists[0] || null;

  // Calculate total duration
  const totalDurationMinutes = activeSetlist
    ? activeSetlist.items.reduce((total, item) => {
        if (item.type === 'break') {
          return total + (item.breakDurationMinutes || 10);
        }
        const s = songs.find((song) => song.id === item.songId);
        return total + Math.round((s?.duration || 240) / 60);
      }, 0)
    : 0;

  const handleCreateSetlist = () => {
    if (!newSetName.trim()) return;

    const newSet: Setlist = {
      id: `setlist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: newSetName.trim(),
      venue: newSetVenue.trim(),
      date: newSetDate.trim(),
      notes: newSetNotes.trim(),
      items: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onSaveSetlist(newSet);
    setActiveSetlistId(newSet.id);
    setIsCreatingSetlist(false);
    setNewSetName('');
    setNewSetVenue('');
    setNewSetDate('');
    setNewSetNotes('');
  };

  const handleAddSongToSetlist = (songId: string) => {
    if (!activeSetlist) return;
    const newItem: SetlistItem = {
      songId,
      type: 'song',
    };
    const updated: Setlist = {
      ...activeSetlist,
      items: [...activeSetlist.items, newItem],
    };
    onSaveSetlist(updated);
  };

  const handleAddBreakToSetlist = () => {
    if (!activeSetlist) return;
    const newItem: SetlistItem = {
      songId: '',
      type: 'break',
      breakDurationMinutes: breakMinutes,
      customNote: breakNote || (lang === 'sk' ? `Prestávka ${breakMinutes} min` : `Intermission ${breakMinutes} min`),
    };
    const updated: Setlist = {
      ...activeSetlist,
      items: [...activeSetlist.items, newItem],
    };
    onSaveSetlist(updated);
    setShowAddBreak(false);
    setBreakNote('');
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (!activeSetlist) return;
    const items = [...activeSetlist.items];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const temp = items[index];
    items[index] = items[targetIdx];
    items[targetIdx] = temp;

    onSaveSetlist({ ...activeSetlist, items });
  };

  const removeItem = (index: number) => {
    if (!activeSetlist) return;
    const items = activeSetlist.items.filter((_, idx) => idx !== index);
    onSaveSetlist({ ...activeSetlist, items });
  };

  const copyBandSetlistToClipboard = () => {
    if (!activeSetlist) return;
    let text = `🎵 ${activeSetlist.name}\n📍 ${activeSetlist.venue || ''} | 📅 ${activeSetlist.date || ''}\n--------------------------\n`;
    activeSetlist.items.forEach((item, idx) => {
      if (item.type === 'break') {
        text += `[-- ${item.customNote || 'Prestávka'} (${item.breakDurationMinutes}m) --]\n`;
      } else {
        const s = songs.find((x) => x.id === item.songId);
        text += `${idx + 1}. ${s?.title || 'Unknown'} (${s?.currentKey || 'C'}) - ${s?.artist || ''}\n`;
      }
    });
    navigator.clipboard.writeText(text);
    alert(lang === 'sk' ? 'Setlist bol skopírovaný do schránky pre kapelu!' : 'Setlist copied to clipboard for band members!');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
      {/* Left Column: Setlists Selector & New Setlist */}
      <div className="lg:col-span-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-amber-400" />
            <span>{t.setlists}</span>
          </h2>

          <button
            onClick={() => setIsCreatingSetlist(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.createSetlist}</span>
          </button>
        </div>

        {/* Setlists Tabs */}
        <div className="space-y-2">
          {setlists.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
              {lang === 'sk' ? 'Žiadne setlisty. Vytvorte si svoj prvý setlist na vystúpenie!' : 'No setlists yet. Create your first setlist!'}
            </div>
          ) : (
            setlists.map((sl) => {
              const isSelected = activeSetlist?.id === sl.id;
              const songCount = sl.items.filter((i) => i.type === 'song').length;

              return (
                <div
                  key={sl.id}
                  onClick={() => setActiveSetlistId(sl.id)}
                  className={`p-4 rounded-2xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500/50 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={`font-bold text-sm ${isSelected ? 'text-amber-400' : 'text-slate-200'}`}>
                        {sl.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        {sl.venue && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {sl.venue}
                          </span>
                        )}
                        {sl.date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {sl.date}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                      {songCount} {lang === 'sk' ? 'skladieb' : 'songs'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Active Setlist Details & Song Sequence */}
      <div className="lg:col-span-8">
        {activeSetlist ? (
          <div className="space-y-4">
            {/* Setlist Header Card */}
            <div className="p-5 md:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                    {activeSetlist.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1.5">
                    {activeSetlist.venue && (
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        {activeSetlist.venue}
                      </span>
                    )}
                    {activeSetlist.date && (
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        {activeSetlist.date}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      ~{totalDurationMinutes} min ({t.totalDuration})
                    </span>
                  </div>
                </div>

                {/* Actions: Start Gig Mode & Share */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyBandSetlistToClipboard}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                    title={lang === 'sk' ? 'Kopírovať text pre kapelu' : 'Copy setlist for band'}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(lang === 'sk' ? 'Naozaj vymazať tento setlist?' : 'Delete this setlist?')) {
                        onDeleteSetlist(activeSetlist.id);
                      }
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 transition cursor-pointer"
                    title={lang === 'sk' ? 'Zmazať setlist' : 'Delete setlist'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Start Live Stage Mode Button */}
                  <button
                    onClick={() => onStartStageSetlist(activeSetlist)}
                    disabled={activeSetlist.items.filter((i) => i.type === 'song').length === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-extrabold text-xs md:text-sm shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition cursor-pointer disabled:opacity-40"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{t.enterStageMode}</span>
                  </button>
                </div>
              </div>

              {activeSetlist.notes && (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
                  <span className="font-bold text-amber-400 mr-1.5">Poznámka k vystúpeniu:</span>
                  {activeSetlist.notes}
                </div>
              )}

              {/* Add items to Setlist bar */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setShowSongPicker(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs border border-amber-500/30 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'sk' ? 'Pridať skladbu do setlistu' : 'Add Song to Setlist'}</span>
                </button>

                <button
                  onClick={() => setShowAddBreak(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition cursor-pointer"
                >
                  <Coffee className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.addBreak}</span>
                </button>
              </div>
            </div>

            {/* Setlist Song Items List */}
            <div className="space-y-2">
              {activeSetlist.items.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-dashed border-slate-800 text-slate-400 text-sm">
                  <p>{t.emptySetlist}</p>
                  <button
                    onClick={() => setShowSongPicker(true)}
                    className="mt-3 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 font-semibold text-xs hover:bg-amber-500/30 border border-amber-500/30 cursor-pointer"
                  >
                    + {lang === 'sk' ? 'Vybrať skladby zo spevníka' : 'Select songs from library'}
                  </button>
                </div>
              ) : (
                activeSetlist.items.map((item, idx) => {
                  if (item.type === 'break') {
                    return (
                      <div
                        key={`break-${idx}`}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-300"
                      >
                        <div className="flex items-center gap-3">
                          <Coffee className="w-5 h-5 text-amber-400" />
                          <div>
                            <span className="font-bold text-xs uppercase tracking-wider">
                              ☕ {item.customNote || 'Prestávka / Intermission'}
                            </span>
                            <span className="text-xs text-amber-400/80 ml-2">
                              ({item.breakDurationMinutes} min)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveItem(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveItem(idx, 'down')}
                            disabled={idx === activeSetlist.items.length - 1}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeItem(idx)}
                            className="p-1 text-slate-400 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  const song = songs.find((s) => s.id === item.songId);

                  return (
                    <div
                      key={`song-${idx}`}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition group"
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="w-7 h-7 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-mono text-xs font-bold text-amber-400">
                          {idx + 1}
                        </span>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4
                              onClick={() => song && onSelectSong(song.id)}
                              className="font-bold text-slate-100 text-sm hover:text-amber-400 transition cursor-pointer"
                            >
                              {song?.title || 'Unknown Song'}
                            </h4>
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 font-mono text-xs font-bold text-amber-400">
                              {song?.currentKey || 'C'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{song?.artist}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.customNote && (
                          <span className="text-xs text-slate-400 italic hidden sm:inline">
                            {item.customNote}
                          </span>
                        )}

                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                          <button
                            onClick={() => moveItem(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveItem(idx, 'down')}
                            disabled={idx === activeSetlist.items.length - 1}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeItem(idx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Modal: Create Setlist */}
      {isCreatingSetlist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-4">
            <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
              <ListMusic className="w-4 h-4" />
              <span>{lang === 'sk' ? 'Vytvoriť nový Setlist / Playlist' : 'Create New Setlist'}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  {lang === 'sk' ? 'Názov vystúpenia / Setu' : 'Setlist / Gig Name'}
                </label>
                <input
                  type="text"
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                  placeholder="napr. Jazz Club Bratislava - Set 1"
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  {lang === 'sk' ? 'Miesto / Podujatie (Venue)' : 'Venue / Event'}
                </label>
                <input
                  type="text"
                  value={newSetVenue}
                  onChange={(e) => setNewSetVenue(e.target.value)}
                  placeholder="napr. Dom Umenia, Hlavné pódium"
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  {lang === 'sk' ? 'Dátum vystúpenia' : 'Gig Date'}
                </label>
                <input
                  type="date"
                  value={newSetDate}
                  onChange={(e) => setNewSetDate(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  {lang === 'sk' ? 'Poznámky k vystúpeniu' : 'Stage notes'}
                </label>
                <textarea
                  rows={2}
                  value={newSetNotes}
                  onChange={(e) => setNewSetNotes(e.target.value)}
                  placeholder="napr. Zvukovka o 18:00, saxofón cez mikrofón č. 3..."
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsCreatingSetlist(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleCreateSetlist}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition cursor-pointer shadow-lg active:scale-95"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Pick Song from Library */}
      {showSongPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-4">
            <h3 className="text-base font-bold text-amber-400">
              {lang === 'sk' ? 'Pridať skladbu do setlistu' : 'Select Song for Setlist'}
            </h3>

            {/* Search filter in modal */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={songPickerSearch}
                onChange={(e) => setSongPickerSearch(e.target.value)}
                placeholder={t.searchSongOrArtist}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {songs
                .filter(
                  (s) =>
                    s.title.toLowerCase().includes(songPickerSearch.toLowerCase()) ||
                    s.artist.toLowerCase().includes(songPickerSearch.toLowerCase())
                )
                .map((song) => {
                  const alreadyIn = activeSetlist?.items.some((i) => i.songId === song.id);

                  return (
                    <div
                      key={song.id}
                      onClick={() => {
                        handleAddSongToSetlist(song.id);
                        setShowSongPicker(false);
                      }}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 cursor-pointer transition"
                    >
                      <div>
                        <h4 className="font-bold text-xs text-slate-100">{song.title}</h4>
                        <p className="text-[11px] text-slate-400">{song.artist}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-400">
                          {song.currentKey || 'C'}
                        </span>
                        {alreadyIn && (
                          <span className="text-[10px] text-slate-500">
                            {lang === 'sk' ? '(v setliste)' : '(added)'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowSongPicker(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Break */}
      {showAddBreak && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-4">
            <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
              <Coffee className="w-4 h-4" />
              <span>{t.addBreak}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">{t.breakMinutes}</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(parseInt(e.target.value, 10) || 15)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">
                  {lang === 'sk' ? 'Poznámka k prestávke' : 'Break Note'}
                </label>
                <input
                  type="text"
                  value={breakNote}
                  onChange={(e) => setBreakNote(e.target.value)}
                  placeholder="napr. Prestávka na občerstvenie & ladenie"
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowAddBreak(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleAddBreakToSetlist}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition cursor-pointer"
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
