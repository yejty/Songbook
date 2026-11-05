import jsPDF from 'jspdf';
import { Song, InstrumentType } from '../types';
import { parseChordPro } from './chordProParser';
import {
  transposeChord,
  getInstrumentSemitoneOffset,
  transposeSaxNotesText,
} from './transposer';

export interface PdfExportOptions {
  instrument?: InstrumentType;
  semitones?: number;
  preferFlats?: boolean;
  mode?: 'both' | 'lyrics_only'; // 'both' = Lyrics + Chords, 'lyrics_only' = Lyrics only
}

/**
 * Generates a clean, stage-ready PDF document for a song with chords, notes, and saxophone solos
 * Supports both "Chords + Lyrics" and "Lyrics Only" modes!
 */
export function generateSongPdfBlob(
  song: Song,
  options: PdfExportOptions = {}
): { doc: jsPDF; blob: Blob; filename: string } {
  const mode = options.mode || 'both';
  const isLyricsOnly = mode === 'lyrics_only';
  const instrument = options.instrument || 'alto_sax';
  const semitones = options.semitones || 0;
  const preferFlats = options.preferFlats || false;

  const instrumentOffset = getInstrumentSemitoneOffset(instrument);
  const effectiveSemitones = semitones + instrumentOffset;

  const effectiveKey = transposeChord(song.currentKey || song.originalKey || 'C', effectiveSemitones, preferFlats);
  const parsed = parseChordPro(song.chordProText, effectiveSemitones, preferFlats);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 18;

  const checkPageBreak = (neededHeight: number = 10) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = 18;
    }
  };

  // Header Background bar
  doc.setFillColor(15, 23, 42); // dark slate #0f172a
  doc.rect(margin, y - 6, pageWidth - 2 * margin, 24, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(song.title, margin + 4, y + 2);

  // Artist
  doc.setTextColor(203, 213, 225); // slate-300
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(song.artist, margin + 4, y + 8);

  // Mode badge & Key / Tempo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(245, 158, 11); // amber

  if (isLyricsOnly) {
    const modeLabel = 'TEXT PIESNE (LYRICS ONLY)';
    const modeWidth = doc.getTextWidth(modeLabel);
    doc.text(modeLabel, pageWidth - margin - modeWidth - 4, y + 2);

    const detailsLabel = `${song.tempo ? `${song.tempo} BPM  ` : ''}${song.timeSignature || '4/4'}`;
    const detailsWidth = doc.getTextWidth(detailsLabel);
    doc.setTextColor(148, 163, 184);
    doc.text(detailsLabel, pageWidth - margin - detailsWidth - 4, y + 8);
  } else {
    const keyLabel = `Tónina: ${effectiveKey} | Alt Sax (E♭)`;
    const keyWidth = doc.getTextWidth(keyLabel);
    doc.text(keyLabel, pageWidth - margin - keyWidth - 4, y + 2);

    const detailsLabel = `${song.tempo ? `${song.tempo} BPM  ` : ''}${song.capo ? `Capo ${song.capo}  ` : ''}${song.timeSignature || '4/4'}`;
    const detailsWidth = doc.getTextWidth(detailsLabel);
    doc.setTextColor(148, 163, 184);
    doc.text(detailsLabel, pageWidth - margin - detailsWidth - 4, y + 8);
  }

  y += 26;

  // Personal Annotations & Performance Notes
  const allNotes = [
    ...(song.performanceNotes || []).map((n) => `[${n.tag.toUpperCase()}] ${n.text}`),
    ...(song.personalAnnotations || []).map((pa) => `[${pa.category.toUpperCase()}] ${pa.text}`),
  ];

  if (allNotes.length > 0) {
    checkPageBreak(25);
    doc.setFillColor(254, 243, 199); // light amber
    doc.setDrawColor(245, 158, 11);
    doc.rect(margin, y, pageWidth - 2 * margin, 6 + allNotes.length * 5.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(180, 83, 9);
    doc.text('OSOBNÉ POZNÁMKY & PÓDIOVÉ SIGNÁLY (PERSONAL ANNOTATIONS & CUES):', margin + 3, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    allNotes.forEach((noteText, idx) => {
      const lineY = y + 9.5 + idx * 5.5;
      doc.text(`• ${noteText}`, margin + 4, lineY);
    });

    y += 10 + allNotes.length * 5.5;
  }

  // Saxophone Solo Section in PDF (only in 'both' mode or if solos exist)
  if (!isLyricsOnly && song.saxSolos && song.saxSolos.length > 0) {
    checkPageBreak(30);
    const solo = song.saxSolos[0];
    const transposedSoloNotes = transposeSaxNotesText(solo.notesContent, instrumentOffset, instrument !== 'concert');

    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, pageWidth - 2 * margin, 24, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`🎷 SAXOFÓNOVÉ SÓLO (ALTOVÝ SAXOFÓN E♭) - ${solo.title}:`, margin + 3, y + 4.5);

    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(180, 83, 9);

    const soloLines = doc.splitTextToSize(transposedSoloNotes, pageWidth - 2 * margin - 8);
    doc.text(soloLines.slice(0, 3), margin + 4, y + 10);

    if (solo.tips) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Tip: ${solo.tips}`, margin + 4, y + 20);
    }

    y += 28;
  }

  // Render Lyrics (and optional Chords)
  doc.setFontSize(isLyricsOnly ? 10.5 : 9.5);

  parsed.lines.forEach((line) => {
    checkPageBreak(isLyricsOnly ? 8 : 12);

    if (line.type === 'empty') {
      y += 4;
      return;
    }

    if (line.type === 'comment') {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 83, 9);
      doc.text(`[ ${line.commentText} ]`, margin, y);
      y += 6;
      return;
    }

    if (line.type === 'section-start') {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`--- ${line.directiveValue || line.sectionType?.toUpperCase()} ---`, margin, y);
      y += 6;
      return;
    }

    if (line.type === 'section-end') {
      y += 2;
      return;
    }

    // LYRICS ONLY MODE
    if (isLyricsOnly) {
      const fullText = (line.segments || []).map((s) => s.text).join('');
      if (fullText.trim()) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(fullText, margin, y);
        y += 6;
      }
      return;
    }

    // BOTH (CHORDS + LYRICS) MODE
    let currentX = margin;
    const hasAnyChord = line.segments?.some((s) => Boolean(s.chord));

    if (hasAnyChord) {
      let chordX = margin;
      line.segments?.forEach((seg) => {
        if (seg.chord) {
          doc.setFont('courier', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(217, 119, 6); // amber-600
          doc.text(seg.chord, chordX, y);
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        const textWidth = doc.getTextWidth(seg.text || ' ');
        const chordWidth = seg.chord ? doc.getTextWidth(seg.chord + ' ') : 0;
        chordX += Math.max(textWidth, chordWidth);
      });

      y += 4.5;
    }

    line.segments?.forEach((seg) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(seg.text || '', currentX, y);

      const textWidth = doc.getTextWidth(seg.text || ' ');
      const chordWidth = seg.chord ? doc.getTextWidth(seg.chord + ' ') : 0;
      currentX += Math.max(textWidth, chordWidth);
    });

    y += 6;
  });

  const blob = doc.output('blob');
  const modeSuffix = isLyricsOnly ? 'LyricsOnly' : 'Chords_Lyrics_AltoSax';
  const filename = `${song.title.replace(/[^a-zA-Z0-9_\u00C0-\u017F]/g, '_')}_${modeSuffix}.pdf`;

  return { doc, blob, filename };
}

/**
 * Trigger immediate download of the song PDF
 */
export function downloadSongPdf(song: Song, options: PdfExportOptions = {}): void {
  const { doc, filename } = generateSongPdfBlob(song, options);
  doc.save(filename);
}
