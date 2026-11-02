import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'sk' | 'en';

export const translations = {
  sk: {
    appTitle: 'SaxChord Stage',
    appSubtitle: 'Spevník a Live Setlisty s akordmi a saxofónom',
    searchPlaceholder: 'Hľadať podľa názvu, interpreta alebo akordov...',
    searchSongOrArtist: 'Hľadať skladbu alebo interpreta...',
    allSongs: 'Všetky skladby',
    favorites: 'Obľúbené',
    setlists: 'Setlisty a Playlisty',
    createSetlist: 'Nový Setlist',
    newSong: 'Pridať skladbu',
    editSong: 'Upraviť skladbu',
    deleteSong: 'Zmazať skladbu',
    save: 'Uložiť',
    cancel: 'Zrušiť',
    close: 'Zavrieť',
    title: 'Názov skladby',
    artist: 'Interpret',
    originalKey: 'Pôvodná tónina',
    currentKey: 'Aktuálna tónina',
    tempo: 'Tempo (BPM)',
    timeSignature: 'Takt',
    capo: 'Kapodaster',
    tags: 'Štítky / Žánre',
    liveStageMode: 'STAGE REŽIM NA PÓDIUM',
    enterStageMode: 'Spustiť živé vystúpenie',
    exitStageMode: 'Ukončiť Stage režim',
    transposition: 'Transpozícia akordov',
    transposeUp: 'Transponovať +1',
    transposeDown: 'Transponovať -1',
    resetKey: 'Pôvodná tónina',
    instrumentPitch: 'Ladenie nástroja',
    concertPitch: 'Koncertné ladenie (C)',
    tenorSaxPitch: 'Tenor / Soprán Sax (B♭)',
    altoSaxPitch: 'Alt / Baritón Sax (E♭)',
    saxophoneSolos: 'Saxofónové sóla a vyhrávky',
    addSaxSolo: 'Pridať saxofónové sólo',
    soloNotes: 'Tóny sóla',
    soloTips: 'Tipy na prednes a frázovanie',
    scaleHelper: 'Sprievodca stupnicami (Blues & Pentatonika)',
    performanceNotes: 'Poznámky k skladbe (Stage Cues)',
    addNote: 'Pridať poznámku',
    audioRecordings: 'Zvukové nahrávky a skúšky',
    recordAudio: 'Nahrať novú zvukovú stopu',
    uploadAudio: 'Nahrať audio súbor (MP3/WAV)',
    recording: 'Nahráva sa...',
    stopRecording: 'Zastaviť nahrávanie',
    play: 'Prehrať',
    pause: 'Pozastaviť',
    speed: 'Rýchlosť',
    loop: 'Slučka',
    megaSync: 'MEGA Cloud Synchronizácia',
    megaConnected: 'MEGA pripojené',
    megaDisconnected: 'MEGA nepripojené',
    syncNow: 'Synchronizovať teraz',
    pushToMega: 'Nahrať do MEGA Cloudu',
    pullFromMega: 'Stiahnuť z MEGA Cloudu',
    downloadBackup: 'Stiahnuť záložný súbor (.mega)',
    restoreBackup: 'Obnoviť zo súboru',
    offlineReady: '100% Offline pripravené na pódium',
    autoScroll: 'Automatické posúvanie',
    scrollSpeed: 'Rýchlosť posunu',
    nextSong: 'Ďalšia skladba',
    prevSong: 'Predchádzajúca skladba',
    duration: 'Trvanie',
    totalDuration: 'Celkový čas vystúpenia',
    addBreak: 'Pridať prestávku / pauzu',
    breakMinutes: 'Dĺžka prestávky (min)',
    emptySetlist: 'Tento setlist zatiaľ neobsahuje žiadne skladby.',
    emptySongs: 'Žiadne skladby nezodpovedajú vyhľadávaniu.',
    chordProHelp: 'ChordPro formát nápoveda',
    fontSize: 'Veľkosť písma',
    metronome: 'Vizuálny metronóm',
  },
  en: {
    appTitle: 'SaxChord Stage',
    appSubtitle: 'Songbook & Live Gig Setlists with Chords & Saxophone',
    searchPlaceholder: 'Search by title, artist, chords or lyrics...',
    searchSongOrArtist: 'Search by song title or artist...',
    allSongs: 'All Songs',
    favorites: 'Favorites',
    setlists: 'Setlists & Playlists',
    createSetlist: 'New Setlist',
    newSong: 'Add Song',
    editSong: 'Edit Song',
    deleteSong: 'Delete Song',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    title: 'Song Title',
    artist: 'Artist',
    originalKey: 'Original Key',
    currentKey: 'Current Key',
    tempo: 'Tempo (BPM)',
    timeSignature: 'Time Sig',
    capo: 'Capo',
    tags: 'Tags / Genres',
    liveStageMode: 'STAGE PERFORMANCE MODE',
    enterStageMode: 'Start Live Performance',
    exitStageMode: 'Exit Stage Mode',
    transposition: 'Chord Transposition',
    transposeUp: 'Transpose +1',
    transposeDown: 'Transpose -1',
    resetKey: 'Reset Key',
    instrumentPitch: 'Instrument Pitch',
    concertPitch: 'Concert Pitch (C)',
    tenorSaxPitch: 'Tenor / Soprano Sax (B♭)',
    altoSaxPitch: 'Alto / Baritone Sax (E♭)',
    saxophoneSolos: 'Saxophone Solos & Riffs',
    addSaxSolo: 'Add Sax Solo',
    soloNotes: 'Solo Notes',
    soloTips: 'Phrasing & Performance Tips',
    scaleHelper: 'Scale Guide (Blues & Pentatonic)',
    performanceNotes: 'Stage & Arrangement Notes',
    addNote: 'Add Note',
    audioRecordings: 'Audio Records & Rehearsals',
    recordAudio: 'Record New Audio Take',
    uploadAudio: 'Upload Audio File (MP3/WAV)',
    recording: 'Recording...',
    stopRecording: 'Stop Recording',
    play: 'Play',
    pause: 'Pause',
    speed: 'Speed',
    loop: 'Loop',
    megaSync: 'MEGA Cloud Synchronization',
    megaConnected: 'MEGA Connected',
    megaDisconnected: 'MEGA Disconnected',
    syncNow: 'Sync Now',
    pushToMega: 'Push to MEGA Cloud',
    pullFromMega: 'Pull from MEGA Cloud',
    downloadBackup: 'Download Backup File (.mega)',
    restoreBackup: 'Restore from File',
    offlineReady: '100% Offline Ready for Stage',
    autoScroll: 'Auto-Scroll',
    scrollSpeed: 'Scroll Speed',
    nextSong: 'Next Song',
    prevSong: 'Previous Song',
    duration: 'Duration',
    totalDuration: 'Total Gig Duration',
    addBreak: 'Add Intermission / Break',
    breakMinutes: 'Break Duration (mins)',
    emptySetlist: 'This setlist is currently empty. Add songs below.',
    emptySongs: 'No songs matched your search criteria.',
    chordProHelp: 'ChordPro Format Help',
    fontSize: 'Font Size',
    metronome: 'Visual Metronome',
  }
};

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof translations['sk'];
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('saxchord_lang') as Language) || 'sk';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('saxchord_lang', newLang);
  };

  const t = translations[lang];

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
