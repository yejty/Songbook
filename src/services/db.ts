import { Song, Setlist, MegaSyncConfig } from '../types';

const DB_NAME = 'SaxChordDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('songs')) {
        const songStore = db.createObjectStore('songs', { keyPath: 'id' });
        songStore.createIndex('title', 'title', { unique: false });
        songStore.createIndex('artist', 'artist', { unique: false });
        songStore.createIndex('lastModified', 'lastModified', { unique: false });
      }

      if (!db.objectStoreNames.contains('setlists')) {
        const setlistStore = db.createObjectStore('setlists', { keyPath: 'id' });
        setlistStore.createIndex('name', 'name', { unique: false });
      }

      if (!db.objectStoreNames.contains('audioBlobs')) {
        db.createObjectStore('audioBlobs', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('config')) {
        db.createObjectStore('config', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

// Initial Starter Songs
export const DEFAULT_SONGS: Song[] = [
  {
    id: 'song-careless-whisper',
    title: 'Careless Whisper',
    artist: 'George Michael',
    originalKey: 'Dm',
    currentKey: 'Dm',
    tempo: 76,
    timeSignature: '4/4',
    duration: 300,
    isFavorite: true,
    tags: ['Sax Classic', 'Ballad', 'Pop', '80s', 'Slow Dance'],
    lastModified: Date.now() - 1000 * 3600 * 12,
    performanceNotes: [
      { id: 'pn-1', tag: 'intro', text: 'Drum click 2 bars, then Sax Solo enters with delay effect.' },
      { id: 'pn-2', tag: 'solo', text: 'Keep sax tone warm and breathy, slight vibrato on held notes.' },
      { id: 'pn-3', tag: 'cue', text: 'Bass drops to low D on second verse.' },
      { id: 'pn-4', tag: 'outro', text: 'Repeat intro sax riff 3 times, fade on fourth.' }
    ],
    saxSolos: [
      {
        id: 'sax-cw-1',
        title: 'Iconic Main Sax Hook (Concert Pitch)',
        concertKey: 'D minor',
        notesContent: `[Phrase 1]
D5 - F5 - A5 - G5 - F5 - D5 | F5 - E5 - D5 - C5
[Phrase 2]
D5 - F5 - A5 - G5 - F5 - D5 | E5 - - -
[Phrase 3 - High Ascending]
D5 - F5 - A5 - D6 - C6 - Bb5 | A5 - G5 - F5 - E5 - D5
[Resolving Turn]
C5 - D5 - E5 - F5 - E5 - D5 - C#5 | D5 - - -`,
        tips: 'Tenor sax sounds 1 whole step higher in key of Em. Alto sax plays in key of Bm. Use smooth legato slurs!',
      }
    ],
    audioRecords: [],
    chordProText: `{title: Careless Whisper}
{artist: George Michael}
{key: Dm}
{tempo: 76}
{time: 4/4}

{c: Intro - Iconic Saxophone Solo}
[Dm]   [Gm]   [Bb]   [Am]   [A7]
[Dm]   [Gm]   [Bb]   [Am]   [A7]

{start_of_verse}
I feel so [Dm]unsure as I take your [Gm]hand
And lead you to the [Bb]dance floor
As the music dies, [Am]something in your eyes [A7]
Calls to mind a [Dm]silver screen
And all its sad good[Gm]byes
{end_of_verse}

{start_of_chorus}
I'm never gonna [Dm]dance again
Guilty feet have [Gm]got no rhythm
Though it's easy to [Bb]pretend
I know you're not a [Am]fool [A7]
Should've known better than to [Dm]cheat a friend
And waste the chance that I'd been [Gm]given
So I'm never gonna [Bb]dance again
The way I danced with [Am]you, [A7]oh...
{end_of_chorus}

{c: Re-entry Saxophone Lick}
[Dm]   [Gm]   [Bb]   [Am]   [A7]

{start_of_verse}
[Dm]Time can never mend
The careless whis[Gm]pers of a good friend
To the heart and [Bb]mind
Ignorance is [Am]kind [A7]
There's no comfort in the [Dm]truth
Pain is the only thing you'll [Gm]find
{end_of_verse}

{start_of_chorus}
I'm never gonna [Dm]dance again
Guilty feet have [Gm]got no rhythm
Though it's easy to [Bb]pretend
I know you're not a [Am]fool [A7]
{end_of_chorus}

{c: Outro - Sax Solo to Fade}
[Dm]   [Gm]   [Bb]   [Am]   [A7]
[Dm]   [Gm]   [Bb]   [Am]   [A7]`
  },
  {
    id: 'song-baker-street',
    title: 'Baker Street',
    artist: 'Gerry Rafferty',
    originalKey: 'D',
    currentKey: 'D',
    tempo: 114,
    timeSignature: '4/4',
    duration: 360,
    isFavorite: true,
    tags: ['Sax Classic', 'Rock', '70s', 'High Energy'],
    lastModified: Date.now() - 1000 * 3600 * 24,
    performanceNotes: [
      { id: 'pn-bs-1', tag: 'intro', text: 'Booming Alto sax tone, open up the throat for projection.' },
      { id: 'pn-bs-2', tag: 'cue', text: 'Band hits hard on beat 1 with crash cymbal.' }
    ],
    saxSolos: [
      {
        id: 'sax-bs-1',
        title: 'Baker Street Legendary Sax Hook',
        concertKey: 'D major',
        notesContent: `[Concert Pitch Notes]
D5 - F#5 - A5 - B5 - A5 - F#5 | E5 - D5 - B4 - D5
D5 - F#5 - A5 - B5 - D6 - B5 | A5 - - -
D5 - F#5 - A5 - B5 - A5 - F#5 | E5 - D5 - B4 - D5
E5 - F#5 - G5 - F#5 - E5 - D5 | D5 - - -`,
        tips: 'Alto Saxophone plays this in B major (B - D# - F# - G#). Massive punchy tone, accent the syncopations!',
      }
    ],
    audioRecords: [],
    chordProText: `{title: Baker Street}
{artist: Gerry Rafferty}
{key: D}
{tempo: 114}
{time: 4/4}

{c: Intro - Legendary Alto Sax Riff}
[D]   [C]   [G]   [D]
[D]   [C]   [G]   [D]

{start_of_verse}
[A]Winding your way down on Baker Street
[A]Light in your head and dead on your feet
Well, a[Em]nother crazy day, you'll [G]drink the night away
And [D]forget about everything
{end_of_verse}

{start_of_verse}
[A]This city desert makes you feel so cold
It's got [A]so many people, but it's got no soul
And it's [Em]taken you so long to [G]find out you were wrong
When you [D]thought it held everything
{end_of_verse}

{start_of_chorus}
[Dm]You used to think that it was [Am]so easy
[Dm]You used to say that it was [Am]so easy
But [C]you're trying, [G]you're trying [D]now
[Dm]Another year and then you'd [Am]be happy
[Dm]Just one more year and then you'd [Am]be happy
But [C]you're crying, [G]you're crying [A]now
{end_of_chorus}

{c: Huge Sax Solo Break}
[D]   [C]   [G]   [D]
[D]   [C]   [G]   [D]`
  },
  {
    id: 'song-voda-co-ma-drzi',
    title: 'Voda, čo ma drží nad vodou',
    artist: 'Elán / Jožo Ráž',
    originalKey: 'G',
    currentKey: 'G',
    tempo: 72,
    timeSignature: '4/4',
    duration: 310,
    isFavorite: true,
    tags: ['Slovak Hit', 'Rock Ballad', 'Crowd Favorite', 'Moja tvorba'],
    isMySong: true,
    lastModified: Date.now() - 1000 * 3600 * 48,
    personalAnnotations: [
      { id: 'pa-1', category: 'vocal', text: 'V druhej slohe jemnejší tichý spev, v refréne naplno!', color: 'amber', createdAt: Date.now() },
      { id: 'pa-2', category: 'sax', text: 'Altový saxofón (E dur) - vyhrávky s vibratom po slove "slobodou"', color: 'emerald', createdAt: Date.now() }
    ],
    performanceNotes: [
      { id: 'pn-v-1', tag: 'intro', text: 'Jemný klavírny úvod, saxofón nastupuje jemnými vyhrávkami.' },
      { id: 'pn-v-2', tag: 'solo', text: 'Po druhom refréne plné saxofónové sólo s gradáciou do výšok.' },
      { id: 'pn-v-3', tag: 'outro', text: 'Spoločný spev s publikom, saxofón improvizuje bluesové tóny.' }
    ],
    saxSolos: [
      {
        id: 'sax-v-1',
        title: 'Saxofónové melodické vyhrávky a sólo',
        concertKey: 'G major',
        notesContent: `[Sólo po 2. refréne]
D5 - E5 - G5 - A5 - B5 - A5 | G5 - E5 - D5 - -
D5 - G5 - B5 - C6 - B5 - A5 | G5 - A5 - - -
B5 - C6 - D6 - E6 - D6 - B5 | A5 - G5 - E5 - G5
G5 - A5 - B5 - A5 - G5 - F#5 | G5 - - -`,
        tips: 'Pre Tenor sax ladenie A dur (A - C# - E - F#). Pre Alt sax ladenie E dur (E - G# - B - C#). Hraj s veľkým citom!',
      }
    ],
    audioRecords: [],
    chordProText: `{title: Voda, čo ma drží nad vodou}
{artist: Elán}
{key: G}
{tempo: 72}
{time: 4/4}

{c: Intro - Klavír a jemný saxofón}
[G]   [Em]   [C]   [D]
[G]   [Em]   [C]   [D]

{start_of_verse}
[G]Keby bolo [Em]niečo, čo sa [C]dá ti [D]dať
[G]Keby bolo [Em]niečo, čo si [C]budeš [D]priať
[Em]Kúpim ti aj [Bm]snehobielu [C]vranu [Am]
Len [C]nechaj moje [Am]dvere otvore[D]né
{end_of_verse}

{start_of_chorus}
Voda, čo ma [G]drží nad vo[Em]dou
Keď si [C]so mnou, kráčam [D]so slobodou
Voda, čo ma [G]drží nad vo[Em]dou
Neod[C]íď mi s nočnou [D]oblohou
{end_of_chorus}

{c: Saxofónové sólo - melodická gradácia}
[G]   [Em]   [C]   [D]
[Em]   [Bm]   [C]   [D]

{start_of_verse}
[G]Keby bolo [Em]svetlo, čo sa [C]nestra[D]tí
[G]A za ktorým [Em]každý z nás sa [C]navrá[D]ti
[Em]Kúpil by som [Bm]celý vesmír [C]pre nás [Am]
Kým [C]nad nami [Am]ešte svieti [D]čas
{end_of_verse}

{start_of_chorus}
Voda, čo ma [G]drží nad vo[Em]dou
Keď si [C]so mnou, kráčam [D]so slobodou
Voda, čo ma [G]drží nad vo[Em]dou
Neod[C]íď mi s nočnou [D]oblohou
{end_of_chorus}

{c: Outro - Saxofón & Grand Finale}
[G]   [Em]   [C]   [D]   [G]`
  },
  {
    id: 'song-smooth-operator',
    title: 'Smooth Operator',
    artist: 'Sade',
    originalKey: 'Dm',
    currentKey: 'Dm',
    tempo: 118,
    timeSignature: '4/4',
    duration: 260,
    isFavorite: false,
    tags: ['Jazz Pop', 'Smooth Jazz', 'Sax Riffs', 'Sophisticated'],
    lastModified: Date.now() - 1000 * 3600 * 72,
    performanceNotes: [
      { id: 'pn-so-1', tag: 'solo', text: 'Classic Stuart Matthewman tenor saxophone sound. Sub-tone in lower register.' },
      { id: 'pn-so-2', tag: 'intro', text: 'Latin percussion & bass groove start in Dm9.' }
    ],
    saxSolos: [
      {
        id: 'sax-so-1',
        title: 'Smooth Latin Tenor Riff',
        concertKey: 'D minor',
        notesContent: `[Tenor Hook in Concert Pitch]
D4 - F4 - G4 - Ab4 - A4 | C5 - D5 - C5 - A4
G4 - F4 - D4 - F4 - D4 | C4 - D4 - - -
[Latin Bridge Lick]
A4 - C5 - D5 - F5 - G5 - F5 | D5 - C5 - A4 - G4 - F4`,
        tips: 'Tenor sax in Em. Use blue note (Ab in concert, Bb on Tenor) for signature Sade texture.',
      }
    ],
    audioRecords: [],
    chordProText: `{title: Smooth Operator}
{artist: Sade}
{key: Dm}
{tempo: 118}
{time: 4/4}

{c: Intro - Latin Groove & Tenor Saxophone}
[Dm7]   [Am7]   [Bbmaj7]   [Am7]
[Dm7]   [Am7]   [Bbmaj7]   [Am7]

{start_of_verse}
[Dm7]Diamond life, [Am7]lover boy
[Bbmaj7]He move on every [Am7]lane
[Dm7]With minimum waste and [Am7]maximum joy
[Bbmaj7]City lights and [Am7]business nights
[Dm7]When you require [Am7]streetcar desire for [Bbmaj7]higher heights [Am7]
{end_of_verse}

{start_of_chorus}
No [Gm7]place for beginners or [Am7]sensitive hearts
[Dm7]When sentiment is left to chance
No [Gm7]place to be looking for [Am7]love in the dark
[Bbmaj7]Smooth operator, [Am7]smooth operator
{end_of_chorus}

{c: Middle Sax Solo - Rehearsal 16 bars}
[Dm7]   [Am7]   [Bbmaj7]   [Am7]
[Dm7]   [Am7]   [Bbmaj7]   [Am7]`
  }
];

export const DEFAULT_SETLISTS: Setlist[] = [
  {
    id: 'setlist-gig-1',
    name: 'Festival Pohoda - Live Stage (Set 1)',
    venue: 'Hlavné pódium / Main Stage',
    date: '2026-07-18',
    notes: 'Line check o 19:30, štart presne o 20:00. Bezdrôtový sax mikrofón kanál 4.',
    createdAt: Date.now() - 1000 * 3600 * 48,
    updatedAt: Date.now() - 1000 * 3600 * 5,
    items: [
      { songId: 'song-baker-street', type: 'song', customNote: 'Energický úvod! Crash činely na prvú dobu.' },
      { songId: 'song-smooth-operator', type: 'song', customNote: 'Udržať groove, saxofónové vyhrávky.' },
      { songId: '', type: 'break', breakDurationMinutes: 10, customNote: 'Prestávka 10 min / Vyladenie & voda' },
      { songId: 'song-voda-co-ma-drzi', type: 'song', customNote: 'Spievanie s publikom na refrénoch.' },
      { songId: 'song-careless-whisper', type: 'song', customNote: 'Zlatý klinec večera! Saxofónové sólo s reverbom.' }
    ]
  }
];

// Database Operations
export async function getAllSongs(): Promise<Song[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('songs', 'readonly');
    const store = tx.objectStore('songs');
    const request = store.getAll();

    request.onsuccess = () => {
      const songs = request.result as Song[];
      if (!songs || songs.length === 0) {
        // Seed default songs on first run
        seedInitialData().then(resolve).catch(reject);
      } else {
        resolve(songs);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getSong(id: string): Promise<Song | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('songs', 'readonly');
    const store = tx.objectStore('songs');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveSong(song: Song): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('songs', 'readwrite');
    const store = tx.objectStore('songs');
    const songToSave = { ...song, lastModified: Date.now() };
    const request = store.put(songToSave);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteSong(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('songs', 'readwrite');
    const store = tx.objectStore('songs');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Setlists Operations
export async function getAllSetlists(): Promise<Setlist[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('setlists', 'readonly');
    const store = tx.objectStore('setlists');
    const request = store.getAll();

    request.onsuccess = () => {
      const setlists = request.result as Setlist[];
      if (!setlists || setlists.length === 0) {
        seedInitialSetlists().then(resolve).catch(reject);
      } else {
        resolve(setlists);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveSetlist(setlist: Setlist): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('setlists', 'readwrite');
    const store = tx.objectStore('setlists');
    const itemToSave = { ...setlist, updatedAt: Date.now() };
    const request = store.put(itemToSave);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteSetlist(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('setlists', 'readwrite');
    const store = tx.objectStore('setlists');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Audio Blob Storage in IndexedDB
export async function saveAudioBlob(id: string, blob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('audioBlobs', 'readwrite');
    const store = tx.objectStore('audioBlobs');
    const request = store.put({ id, blob, timestamp: Date.now() });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAudioBlob(id: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('audioBlobs', 'readonly');
    const store = tx.objectStore('audioBlobs');
    const request = store.get(id);

    request.onsuccess = () => {
      if (request.result && request.result.blob) {
        resolve(request.result.blob);
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteAudioBlob(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('audioBlobs', 'readwrite');
    const store = tx.objectStore('audioBlobs');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Config & MEGA sync settings
export async function getSyncConfig(): Promise<MegaSyncConfig> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('config', 'readonly');
    const store = tx.objectStore('config');
    const request = store.get('megaSync');

    request.onsuccess = () => {
      const res = request.result;
      if (res && res.value) {
        resolve(res.value);
      } else {
        resolve({
          email: '',
          folderPath: '/Root/SaxChord_Stage_Backup',
          lastSyncTimestamp: null,
          autoSync: true,
          isConnected: false,
        });
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveSyncConfig(config: MegaSyncConfig): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('config', 'readwrite');
    const store = tx.objectStore('config');
    const request = store.put({ key: 'megaSync', value: config });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Export / Import Full Database for MEGA Sync / Offline Backup
export async function exportFullDatabase(): Promise<string> {
  const [songs, setlists, config] = await Promise.all([
    getAllSongs(),
    getAllSetlists(),
    getSyncConfig(),
  ]);

  // Convert audio blobs to base64 so they can be bundled in MEGA cloud JSON
  const songsWithAudio = await Promise.all(
    songs.map(async (song) => {
      const recordsWithData = await Promise.all(
        song.audioRecords.map(async (rec) => {
          const blob = await getAudioBlob(rec.id);
          if (blob) {
            const base64 = await blobToBase64(blob);
            return { ...rec, base64Data: base64 };
          }
          return rec;
        })
      );
      return { ...song, audioRecords: recordsWithData };
    })
  );

  const payload = {
    version: '1.0',
    exportedAt: Date.now(),
    app: 'SaxChord Stage',
    config,
    songs: songsWithAudio,
    setlists,
  };

  return JSON.stringify(payload, null, 2);
}

export async function importFullDatabase(jsonString: string): Promise<{ songsCount: number; setlistsCount: number }> {
  const data = JSON.parse(jsonString);
  if (!data || !Array.isArray(data.songs)) {
    throw new Error('Invalid SaxChord backup file format');
  }

  const db = await openDB();

  // Save songs and restore audio blobs
  for (const song of data.songs) {
    if (song.audioRecords && Array.isArray(song.audioRecords)) {
      for (const rec of song.audioRecords) {
        if (rec.base64Data) {
          const blob = base64ToBlob(rec.base64Data, rec.mimeType || 'audio/webm');
          await saveAudioBlob(rec.id, blob);
          delete rec.base64Data; // keep memory light
        }
      }
    }
    await saveSong(song);
  }

  // Save setlists
  if (Array.isArray(data.setlists)) {
    for (const setlist of data.setlists) {
      await saveSetlist(setlist);
    }
  }

  return {
    songsCount: data.songs.length,
    setlistsCount: (data.setlists || []).length,
  };
}

// Helpers
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const parts = base64.split(',');
  const byteString = atob(parts[1] || parts[0]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
}

async function seedInitialData(): Promise<Song[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('songs', 'readwrite');
    const store = tx.objectStore('songs');
    DEFAULT_SONGS.forEach((s) => store.put(s));

    tx.oncomplete = () => resolve(DEFAULT_SONGS);
    tx.onerror = () => reject(tx.error);
  });
}

async function seedInitialSetlists(): Promise<Setlist[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('setlists', 'readwrite');
    const store = tx.objectStore('setlists');
    DEFAULT_SETLISTS.forEach((sl) => store.put(sl));

    tx.oncomplete = () => resolve(DEFAULT_SETLISTS);
    tx.onerror = () => reject(tx.error);
  });
}
