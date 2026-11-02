import { InstrumentType } from '../types';

export const CHROMATIC_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const CHROMATIC_FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const ALL_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'
];

// Mapping for standardizing note index (0 = C)
export const NOTE_TO_SEMITONE: Record<string, number> = {
  'C': 0, 'B#': 0,
  'C#': 1, 'DB': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'EB': 3, 'Eb': 3,
  'E': 4, 'FB': 4, 'Fb': 4,
  'F': 5, 'E#': 5,
  'F#': 6, 'GB': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'AB': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'BB': 10, 'Bb': 10,
  'B': 11, 'CB': 11, 'Cb': 11,
};

/**
 * Returns semitone interval for saxophone transposition from concert pitch
 */
export function getInstrumentSemitoneOffset(instrument: InstrumentType): number {
  switch (instrument) {
    case 'tenor_sax':
      // Bb instrument: written pitch is 2 semitones (+2) higher than concert
      return 2;
    case 'alto_sax':
      // Eb instrument: written pitch is 9 semitones (+9) higher than concert (or -3)
      return 9;
    case 'concert':
    default:
      return 0;
  }
}

export function getInstrumentLabel(instrument: InstrumentType, lang: 'sk' | 'en' = 'en'): string {
  switch (instrument) {
    case 'tenor_sax':
      return lang === 'sk' ? 'Tenor / Soprán Sax (B♭)' : 'Tenor / Soprano Sax (B♭)';
    case 'alto_sax':
      return lang === 'sk' ? 'Alt / Baritón Sax (E♭)' : 'Alto / Baritone Sax (E♭)';
    case 'concert':
    default:
      return lang === 'sk' ? 'Koncertné ladenie (C)' : 'Concert Pitch (C)';
  }
}

/**
 * Normalizes semitone to 0..11
 */
export function normalizeSemitone(semitone: number): number {
  return ((semitone % 12) + 12) % 12;
}

/**
 * Transpose a single note name (e.g. "C#", "Bb", "F")
 */
export function transposeNote(note: string, semitones: number, preferFlats: boolean = false): string {
  const cleanNote = note.trim();
  const upper = cleanNote.toUpperCase();
  const normalized = cleanNote.charAt(0).toUpperCase() + cleanNote.slice(1);
  
  if (!(normalized in NOTE_TO_SEMITONE) && !(upper in NOTE_TO_SEMITONE)) {
    return note;
  }

  const currentIdx = NOTE_TO_SEMITONE[normalized] ?? NOTE_TO_SEMITONE[upper];
  const targetIdx = normalizeSemitone(currentIdx + semitones);

  return preferFlats ? CHROMATIC_FLATS[targetIdx] : CHROMATIC_SHARPS[targetIdx];
}

/**
 * Transpose any chord symbol, including slash chords like "F#m7/C#" or "Bbmaj7/D"
 */
export function transposeChord(chord: string, semitones: number, preferFlats?: boolean): string {
  if (semitones === 0) return chord;
  if (!chord || typeof chord !== 'string') return '';

  // Check if chord has a slash bass note (e.g., G/B, Am7/F#)
  const slashParts = chord.split('/');
  if (slashParts.length === 2) {
    const mainChord = transposeChord(slashParts[0], semitones, preferFlats);
    const bassNote = transposeNote(slashParts[1], semitones, preferFlats ?? slashParts[1].includes('b'));
    return `${mainChord}/${bassNote}`;
  }

  // Regex to extract root note: e.g. "C#", "Bb", "D"
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;

  const [, root, quality] = match;
  const isFlatChord = root.includes('b') || chord.includes('b');
  const shouldUseFlats = preferFlats !== undefined ? preferFlats : isFlatChord;

  const newRoot = transposeNote(root, semitones, shouldUseFlats);
  return `${newRoot}${quality}`;
}

/**
 * Calculate semitones difference between two keys
 */
export function getSemitonesBetweenKeys(fromKey: string, toKey: string): number {
  const fromClean = fromKey.replace(/m|maj|min|minor/gi, '').trim();
  const toClean = toKey.replace(/m|maj|min|minor/gi, '').trim();

  const fromIdx = NOTE_TO_SEMITONE[fromClean];
  const toIdx = NOTE_TO_SEMITONE[toClean];

  if (fromIdx === undefined || toIdx === undefined) return 0;

  let diff = toIdx - fromIdx;
  if (diff > 6) diff -= 12;
  if (diff < -6) diff += 12;
  return diff;
}

/**
 * Transposes single note representation with optional octave (e.g. "D5" -> "E5" if +2)
 */
export function transposePitchWithOctave(pitchStr: string, semitones: number, preferFlats: boolean = false): string {
  const match = pitchStr.match(/^([A-Ga-g][#b]?)([0-9])?(.*)$/);
  if (!match) return pitchStr;

  const [, noteName, octaveStr, extra] = match;
  const noteIdx = NOTE_TO_SEMITONE[noteName.toUpperCase()];
  if (noteIdx === undefined) return pitchStr;

  let currentOctave = octaveStr ? parseInt(octaveStr, 10) : 4;
  const totalSemitones = noteIdx + semitones;
  const newNoteIdx = normalizeSemitone(totalSemitones);
  const octaveShift = Math.floor(totalSemitones / 12);
  const newOctave = currentOctave + octaveShift;

  const newNoteName = preferFlats ? CHROMATIC_FLATS[newNoteIdx] : CHROMATIC_SHARPS[newNoteIdx];
  return `${newNoteName}${octaveStr ? newOctave : ''}${extra || ''}`;
}

/**
 * Transposes an entire line or text of sax solo notes (e.g. "D5 F5 G5 G#5 A5 | C6 D6")
 */
export function transposeSaxNotesText(text: string, semitones: number, preferFlats: boolean = false): string {
  if (semitones === 0) return text;

  // Match notes like D4, F#5, Bb4, Eb5, G, A
  return text.replace(/\b([A-G][#b]?[0-9]?)\b/g, (match) => {
    return transposePitchWithOctave(match, semitones, preferFlats);
  });
}

/**
 * Scale helper for saxophonists
 * Generates Blues Scale & Minor Pentatonic notes for a given root key
 */
export interface SaxScales {
  root: string;
  isMinor: boolean;
  bluesScale: string[];
  minorPentatonic: string[];
  majorPentatonic: string[];
}

export function getSaxScalesForSongKey(
  concertKey: string,
  instrument: InstrumentType = 'concert'
): SaxScales {
  const isMinor = concertKey.toLowerCase().includes('m') || concertKey.toLowerCase().includes('min');
  const cleanConcertRoot = concertKey.replace(/m|maj|min|minor/gi, '').trim() || 'C';

  const saxOffset = getInstrumentSemitoneOffset(instrument);
  const preferFlats = cleanConcertRoot.includes('b') || instrument === 'tenor_sax' || instrument === 'alto_sax';
  const saxRoot = transposeNote(cleanConcertRoot, saxOffset, preferFlats);

  const rootSemitone = NOTE_TO_SEMITONE[saxRoot] ?? 0;

  // Minor Pentatonic intervals: 0, 3, 5, 7, 10
  const minPentIntervals = [0, 3, 5, 7, 10];
  // Blues Scale intervals: 0, 3, 5, 6, 7, 10
  const bluesIntervals = [0, 3, 5, 6, 7, 10];
  // Major Pentatonic intervals: 0, 2, 4, 7, 9
  const majPentIntervals = [0, 2, 4, 7, 9];

  const scaleToNotes = (intervals: number[]) => {
    return intervals.map((interval) => {
      const idx = normalizeSemitone(rootSemitone + interval);
      return preferFlats ? CHROMATIC_FLATS[idx] : CHROMATIC_SHARPS[idx];
    });
  };

  return {
    root: saxRoot,
    isMinor,
    bluesScale: scaleToNotes(bluesIntervals),
    minorPentatonic: scaleToNotes(minPentIntervals),
    majorPentatonic: scaleToNotes(majPentIntervals),
  };
}
