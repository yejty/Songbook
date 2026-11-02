import { transposeChord } from './transposer';

export interface ChordLyricSegment {
  chord: string | null;
  text: string;
}

export type ChordLineType = 'chord-lyric' | 'directive' | 'comment' | 'section-start' | 'section-end' | 'empty';

export interface ParsedLine {
  id: string;
  type: ChordLineType;
  raw: string;
  directiveName?: string;
  directiveValue?: string;
  segments?: ChordLyricSegment[];
  sectionType?: 'chorus' | 'verse' | 'bridge' | 'intro' | 'outro' | 'solo';
  isComment?: boolean;
  commentText?: string;
}

export interface ParsedChordProSong {
  metadata: {
    title?: string;
    artist?: string;
    key?: string;
    tempo?: number;
    capo?: number;
    time?: string;
    duration?: number;
  };
  lines: ParsedLine[];
  allUniqueChords: string[];
}

/**
 * Parses raw ChordPro text into structured data
 * Accepts optional transposition semitones and flat/sharp preference
 */
export function parseChordPro(
  chordProText: string,
  semitones: number = 0,
  preferFlats?: boolean
): ParsedChordProSong {
  const lines = chordProText.split(/\r?\n/);
  const parsedLines: ParsedLine[] = [];
  const metadata: ParsedChordProSong['metadata'] = {};
  const uniqueChordsSet = new Set<string>();

  let currentSection: 'chorus' | 'verse' | 'bridge' | 'intro' | 'outro' | 'solo' | undefined;

  lines.forEach((lineText, lineIdx) => {
    const trimmed = lineText.trim();
    const lineId = `line-${lineIdx}`;

    // Empty line
    if (!trimmed) {
      parsedLines.push({
        id: lineId,
        type: 'empty',
        raw: lineText,
      });
      return;
    }

    // Directives: {directive: value} or {directive}
    const directiveMatch = trimmed.match(/^\{([a-zA-Z0-9_]+)(?::\s*(.*))?\}$/);
    if (directiveMatch) {
      const dirName = directiveMatch[1].toLowerCase();
      const dirVal = (directiveMatch[2] || '').trim();

      // Handle common ChordPro metadata
      if (dirName === 'title' || dirName === 't') {
        metadata.title = dirVal;
      } else if (dirName === 'subtitle' || dirName === 'st' || dirName === 'artist') {
        if (!metadata.artist) metadata.artist = dirVal;
      } else if (dirName === 'key') {
        metadata.key = dirVal;
      } else if (dirName === 'tempo' || dirName === 'bpm') {
        const parsedTempo = parseInt(dirVal, 10);
        if (!isNaN(parsedTempo)) metadata.tempo = parsedTempo;
      } else if (dirName === 'capo') {
        const parsedCapo = parseInt(dirVal, 10);
        if (!isNaN(parsedCapo)) metadata.capo = parsedCapo;
      } else if (dirName === 'time') {
        metadata.time = dirVal;
      } else if (dirName === 'comment' || dirName === 'c' || dirName === 'highlight') {
        parsedLines.push({
          id: lineId,
          type: 'comment',
          raw: lineText,
          isComment: true,
          commentText: dirVal,
        });
        return;
      } else if (dirName === 'start_of_chorus' || dirName === 'soc') {
        currentSection = 'chorus';
        parsedLines.push({
          id: lineId,
          type: 'section-start',
          sectionType: 'chorus',
          raw: lineText,
          directiveValue: dirVal || 'Chorus',
        });
        return;
      } else if (dirName === 'end_of_chorus' || dirName === 'eoc') {
        currentSection = undefined;
        parsedLines.push({
          id: lineId,
          type: 'section-end',
          sectionType: 'chorus',
          raw: lineText,
        });
        return;
      } else if (dirName === 'start_of_bridge' || dirName === 'sob') {
        currentSection = 'bridge';
        parsedLines.push({
          id: lineId,
          type: 'section-start',
          sectionType: 'bridge',
          raw: lineText,
          directiveValue: dirVal || 'Bridge',
        });
        return;
      } else if (dirName === 'end_of_bridge' || dirName === 'eob') {
        currentSection = undefined;
        parsedLines.push({
          id: lineId,
          type: 'section-end',
          sectionType: 'bridge',
          raw: lineText,
        });
        return;
      } else if (dirName === 'start_of_verse' || dirName === 'sov') {
        currentSection = 'verse';
        parsedLines.push({
          id: lineId,
          type: 'section-start',
          sectionType: 'verse',
          raw: lineText,
          directiveValue: dirVal || 'Verse',
        });
        return;
      } else if (dirName === 'end_of_verse' || dirName === 'eov') {
        currentSection = undefined;
        parsedLines.push({
          id: lineId,
          type: 'section-end',
          sectionType: 'verse',
          raw: lineText,
        });
        return;
      }

      parsedLines.push({
        id: lineId,
        type: 'directive',
        raw: lineText,
        directiveName: dirName,
        directiveValue: dirVal,
      });
      return;
    }

    // Parse chords inside brackets: [Chord]lyrics
    const segments: ChordLyricSegment[] = [];
    const regex = /\[([A-G][^\]]*)\]/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    // Check if line contains any chord
    const hasChords = /\[[A-G][^\]]*\]/.test(lineText);

    if (!hasChords) {
      // Plain lyric line
      parsedLines.push({
        id: lineId,
        type: 'chord-lyric',
        raw: lineText,
        sectionType: currentSection,
        segments: [{ chord: null, text: lineText }],
      });
      return;
    }

    // Line has chords
    while ((match = regex.exec(lineText)) !== null) {
      const chordIndex = match.index;
      const rawChord = match[1].trim();

      // Transpose chord
      const transposedChord = transposeChord(rawChord, semitones, preferFlats);
      uniqueChordsSet.add(transposedChord);

      // Text before this chord (if any)
      if (chordIndex > lastIndex) {
        const precedingText = lineText.substring(lastIndex, chordIndex);
        if (segments.length === 0) {
          segments.push({ chord: null, text: precedingText });
        } else {
          // Append to previous segment or keep as preceding
          segments[segments.length - 1].text += precedingText;
        }
      }

      // We'll collect the text that follows this chord up to the next chord
      const nextIndex = regex.lastIndex;
      lastIndex = nextIndex;

      // Find text until the next chord or line end
      const peekMatch = /\[[A-G][^\]]*\]/.exec(lineText.substring(lastIndex));
      let textForChord = '';
      if (peekMatch) {
        const untilNext = peekMatch.index;
        textForChord = lineText.substring(lastIndex, lastIndex + untilNext);
        lastIndex = lastIndex + untilNext;
        regex.lastIndex = lastIndex; // advance
      } else {
        textForChord = lineText.substring(lastIndex);
        lastIndex = lineText.length;
        regex.lastIndex = lastIndex;
      }

      segments.push({
        chord: transposedChord,
        text: textForChord,
      });
    }

    parsedLines.push({
      id: lineId,
      type: 'chord-lyric',
      raw: lineText,
      sectionType: currentSection,
      segments,
    });
  });

  return {
    metadata,
    lines: parsedLines,
    allUniqueChords: Array.from(uniqueChordsSet),
  };
}

/**
 * Transpose raw ChordPro text directly (e.g. for permanent transposing or saving)
 */
export function transposeChordProText(
  chordProText: string,
  semitones: number,
  preferFlats?: boolean
): string {
  if (semitones === 0) return chordProText;

  // Transpose {key: X} directive
  let result = chordProText.replace(/\{key:\s*([A-G][#b]?)([^}]*)\}/gi, (match, root, quality) => {
    const newRoot = transposeChord(root, semitones, preferFlats);
    return `{key: ${newRoot}${quality}}`;
  });

  // Transpose all [Chord] occurrences
  result = result.replace(/\[([A-G][^\]]*)\]/g, (match, chord) => {
    return `[${transposeChord(chord, semitones, preferFlats)}]`;
  });

  return result;
}

/**
 * Helper to generate starter ChordPro template
 */
export function generateStarterChordPro(title: string, artist: string, key: string): string {
  return `{title: ${title || 'New Song'}}
{artist: ${artist || 'Artist'}}
{key: ${key || 'C'}}
{tempo: 120}
{time: 4/4}

{c: Intro - Piano & Sax lead}
[${key || 'C'}]   [Am]   [F]   [G]

{start_of_verse}
[${key || 'C'}]Here are the lyrics for the [Am]first verse
[F]Singing the story with [G]melody and flow
[${key || 'C'}]Every word connects with [Am]harmony
[F]Building up until the [G]chorus comes
{end_of_verse}

{start_of_chorus}
[F]This is the chorus [G]singing loud and clear
[Em]Feel the rhythm in the [Am]stage lights tonight
[F]Saxophone solo kicks in [G]right after this line
[${key || 'C'}]Holding the groove until the [Am]end
{end_of_chorus}

{c: Saxophone Solo - Alt / Tenor riff}
[F]   [G]   [Em]   [Am]
[F]   [G]   [${key || 'C'}]

{start_of_verse}
[${key || 'C'}]Second verse keeps the [Am]energy alive
[F]Chords transposable with [G]just one tap
{end_of_verse}

{c: Outro - Big Sax finale}
[F]   [G]   [${key || 'C'}]
`;
}
