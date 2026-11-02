export type InstrumentType = 'concert' | 'tenor_sax' | 'alto_sax';

export interface SaxSoloNote {
  id: string;
  title: string; // e.g. "Main Sax Hook / Intro Solo"
  concertKey: string; // e.g. "D minor"
  notesContent: string; // e.g. "D5  F5  G5 - G#5->G5  F5  D5  C5  D5"
  tips?: string; // e.g. "Growl on G#5, vibrato on ending D5"
  tabOrNotation?: string;
}

export interface AudioRecord {
  id: string;
  name: string;
  date: string;
  durationSeconds: number;
  blobUrl?: string;
  blobData?: Blob; // stored in IndexedDB
  base64Data?: string; // for export/sync
  mimeType: string;
}

export interface PerformanceNote {
  id: string;
  tag: 'cue' | 'solo' | 'intro' | 'outro' | 'gear' | 'general';
  text: string;
  color?: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  originalKey: string;
  currentKey: string;
  tempo?: number; // BPM
  timeSignature?: string; // 4/4, 3/4, 6/8
  capo?: number;
  duration?: number; // in seconds, e.g. 210 for 3:30
  tags: string[];
  chordProText: string;
  performanceNotes: PerformanceNote[];
  saxSolos: SaxSoloNote[];
  audioRecords: AudioRecord[];
  isFavorite: boolean;
  lastModified: number;
}

export interface SetlistItem {
  songId: string;
  type: 'song' | 'break';
  customTitle?: string;
  customKey?: string;
  customNote?: string;
  breakDurationMinutes?: number;
}

export interface Setlist {
  id: string;
  name: string;
  venue?: string;
  date?: string;
  items: SetlistItem[];
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface MegaSyncConfig {
  email: string;
  folderPath: string;
  lastSyncTimestamp: number | null;
  autoSync: boolean;
  isConnected: boolean;
  sessionToken?: string;
}

export interface MegaSyncLog {
  id: string;
  timestamp: number;
  action: 'upload' | 'download' | 'merge';
  status: 'success' | 'error';
  itemCount: number;
  message: string;
}
