/**
 * Automatic converter from raw lyrics-with-chords (e.g. from ultimate-guitar, supermusic.sk)
 * to standard ChordPro format.
 */

// Common chord regex recognizing roots A-G, accidentals #/b, qualities, numbers, alterations, and slash chords
export const CHORD_REGEX = /^[A-G][#b]?(m|maj|min|dim|aug|sus[24]?|[0-9]|add[0-9]|b[59]|#[59]|M7|M9)*(\/[A-G][#b]?)?$/;

/**
 * Checks if a token looks like a musical chord
 */
export function isChordToken(token: string): boolean {
  const clean = token.trim().replace(/[(),]/g, '');
  if (!clean) return false;
  // Ignore purely numerical numbers or common punctuation
  if (/^[0-9]+$/.test(clean) || clean === '|' || clean === '/' || clean === '-' || clean === 'x' || clean === '||:') {
    return true;
  }
  return CHORD_REGEX.test(clean);
}

/**
 * Checks if an entire line is primarily a line of chords
 */
export function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('{') || trimmed.startsWith('#')) return false;

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;

  let chordCount = 0;
  for (const token of tokens) {
    if (isChordToken(token)) {
      chordCount++;
    }
  }

  // If at least 65% of words look like chords and there is at least one chord
  return chordCount > 0 && chordCount / tokens.length >= 0.65;
}

/**
 * Finds all chord tokens and their 0-based character positions in a chord line
 */
interface ChordPosition {
  chord: string;
  index: number;
}

export function extractChordPositions(chordLine: string): ChordPosition[] {
  const results: ChordPosition[] = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(chordLine)) !== null) {
    const word = match[0].replace(/[()]/g, '');
    if (isChordToken(word)) {
      results.push({
        chord: word,
        index: match.index,
      });
    }
  }

  return results;
}

/**
 * Merges a chord line into the lyric line below it using column indices
 */
export function mergeChordAndLyricLines(chordLine: string, lyricLine: string): string {
  const chordPositions = extractChordPositions(chordLine);
  if (chordPositions.length === 0) return lyricLine;

  // If lyric line is shorter than the last chord position, pad it with spaces
  const maxChordIndex = chordPositions[chordPositions.length - 1].index;
  let paddedLyric = lyricLine;
  if (paddedLyric.length < maxChordIndex) {
    paddedLyric = paddedLyric.padEnd(maxChordIndex + 1, ' ');
  }

  // Insert chords from right to left so indices don't shift!
  let result = paddedLyric;
  for (let i = chordPositions.length - 1; i >= 0; i--) {
    const { chord, index } = chordPositions[i];
    const safeIndex = Math.min(index, result.length);
    result = result.slice(0, safeIndex) + `[${chord}]` + result.slice(safeIndex);
  }

  return result.trimEnd();
}

/**
 * Converts raw song text into ChordPro format
 */
export function convertToChordPro(rawText: string, defaultTitle?: string, defaultArtist?: string): {
  chordProText: string;
  detectedTitle: string;
  detectedArtist: string;
  detectedKey: string;
} {
  const lines = rawText.split(/\r?\n/);
  const outputLines: string[] = [];

  let detectedTitle = defaultTitle || '';
  let detectedArtist = defaultArtist || '';
  let detectedKey = 'C';
  let firstChordFound = false;

  let inChorus = false;
  let inVerse = false;

  let lineIdx = 0;

  // Try to detect Title and Artist from the top lines (e.g. "Elán - Voda čo ma drží nad vodou" or "Title: X")
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    // Check for "Artist - Title" or "Title - Artist"
    if (trimmed.includes(' - ') && !detectedTitle) {
      const parts = trimmed.split(' - ');
      if (parts.length >= 2) {
        detectedArtist = parts[0].trim();
        detectedTitle = parts[1].trim();
        continue;
      }
    }

    // Check directives if already present
    const titleMatch = trimmed.match(/^(title|t):\s*(.+)$/i);
    if (titleMatch) {
      detectedTitle = titleMatch[2].trim();
      continue;
    }
    const artistMatch = trimmed.match(/^(artist|st|subtitle):\s*(.+)$/i);
    if (artistMatch) {
      detectedArtist = artistMatch[2].trim();
      continue;
    }
    const keyMatch = trimmed.match(/^(key|tónina):\s*([A-G][#b]?m?)/i);
    if (keyMatch) {
      detectedKey = keyMatch[2].trim();
      continue;
    }
  }

  if (!detectedTitle) {
    detectedTitle = 'Nová skladba';
  }

  // Process line by line
  while (lineIdx < lines.length) {
    const currentLine = lines[lineIdx];
    const trimmed = currentLine.trim();

    // Empty line
    if (!trimmed) {
      if (inChorus) {
        outputLines.push('{end_of_chorus}');
        inChorus = false;
      }
      if (inVerse) {
        outputLines.push('{end_of_verse}');
        inVerse = false;
      }
      outputLines.push('');
      lineIdx++;
      continue;
    }

    // Already a ChordPro directive or existing ChordPro bracket syntax: keep it
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      outputLines.push(currentLine);
      lineIdx++;
      continue;
    }

    // Check for section headers like [Chorus], [Refrén], [Verse 1], [Intro], [Sólo]
    const sectionMatch = trimmed.match(/^\[?(refrén|chorus|verse|sloha|intro|outro|bridge|sólo|solo|medzihra)\s*([0-9]*)\]?:?$/i);
    if (sectionMatch) {
      const secType = sectionMatch[1].toLowerCase();
      if (inChorus) {
        outputLines.push('{end_of_chorus}');
        inChorus = false;
      }
      if (inVerse) {
        outputLines.push('{end_of_verse}');
        inVerse = false;
      }

      if (secType === 'refrén' || secType === 'chorus') {
        outputLines.push('{start_of_chorus}');
        inChorus = true;
      } else if (secType === 'verse' || secType === 'sloha') {
        outputLines.push('{start_of_verse}');
        inVerse = true;
      } else if (secType === 'intro' || secType === 'outro' || secType === 'bridge' || secType === 'sólo' || secType === 'solo' || secType === 'medzihra') {
        outputLines.push(`{comment: ${trimmed.replace(/[\[\]:]/g, '')}}`);
      }
      lineIdx++;
      continue;
    }

    // Check if current line is a chord line
    if (isChordLine(currentLine)) {
      // Look at the first chord to guess key if not set
      if (!firstChordFound) {
        const firstChords = extractChordPositions(currentLine);
        if (firstChords.length > 0) {
          detectedKey = firstChords[0].chord;
          firstChordFound = true;
        }
      }

      const nextLine = lineIdx + 1 < lines.length ? lines[lineIdx + 1] : '';
      const nextTrimmed = nextLine.trim();

      // If next line exists, is not empty, and is NOT a chord line, merge chords into it!
      if (nextTrimmed && !isChordLine(nextLine) && !nextTrimmed.startsWith('[') && !nextTrimmed.startsWith('{')) {
        const merged = mergeChordAndLyricLines(currentLine, nextLine);
        outputLines.push(merged);
        lineIdx += 2; // consumed both chord line and lyric line
        continue;
      } else {
        // Chords on their own line (e.g. Intro or Solo progression): wrap each chord in brackets [Am]  [F]
        const chordPositions = extractChordPositions(currentLine);
        if (chordPositions.length > 0) {
          const bracketChords = chordPositions.map((c) => `[${c.chord}]`).join('   ');
          outputLines.push(bracketChords);
        } else {
          outputLines.push(currentLine);
        }
        lineIdx++;
        continue;
      }
    }

    // Regular lyric line (which might already have [Am] brackets, or just plain lyrics)
    outputLines.push(currentLine);
    lineIdx++;
  }

  if (inChorus) {
    outputLines.push('{end_of_chorus}');
  }
  if (inVerse) {
    outputLines.push('{end_of_verse}');
  }

  // Prepend metadata header if not already present
  const header = `{title: ${detectedTitle}}
{artist: ${detectedArtist || 'Interpret'}}
{key: ${detectedKey}}
{tempo: 120}
{time: 4/4}

`;

  const finalChordPro = header + outputLines.join('\n');

  return {
    chordProText: finalChordPro,
    detectedTitle,
    detectedArtist,
    detectedKey,
  };
}

/**
 * Convenience wrapper returning ChordPro string directly
 */
export function convertRawTextToChordPro(
  rawText: string,
  defaultTitle?: string,
  defaultArtist?: string,
  defaultKey?: string
): string {
  const res = convertToChordPro(rawText, defaultTitle, defaultArtist);
  return res.chordProText;
}
