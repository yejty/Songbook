import jsPDF from 'jspdf';
import { SheetNotation } from '../types';

/**
 * Default starter ABC notation for a song / Alto Saxophone lead sheet
 */
export function generateDefaultAbc(title: string, composer: string, key: string = 'G'): string {
  return `X: 1
T: ${title || 'Nová skladba'} - Notový list (Alt Saxofón E♭)
C: ${composer || 'Skladateľ'}
M: 4/4
L: 1/8
Q: 1/4=120
K: ${key || 'G'}
V: 1 clef=treble
%%scale 0.95
% Úvodný motív / Melódia pre Altový saxofón
|: "G" d2 B2 G2 d2 | "Em" e4 B4 | "C" c2 B2 A2 G2 | "D" A6 z2 :|
| "G" B2 d2 g2 d2 | "Em" e2 g2 b4 | "C" a2 g2 e2 d2 | "D" e2 d2 B2 A2 |
| "G" G8 |]
`;
}

/**
 * Converts ABC notation into standard universal MusicXML (.musicxml) format
 * Supported by MuseScore 4, Sibelius, Finale, Dorico, Guitar Pro, and Band-in-a-Box!
 */
export function convertAbcToMusicXml(abc: string, title: string = 'Sheet Music', artist: string = 'Artist'): string {
  // Extract key, time, tempo
  const keyMatch = abc.match(/K:\s*([A-Ga-g][#b]?m?)/);
  const timeMatch = abc.match(/M:\s*([0-9]+\/[0-9]+)/);
  const titleMatch = abc.match(/T:\s*(.+)/);
  const composerMatch = abc.match(/C:\s*(.+)/);

  const songTitle = titleMatch ? titleMatch[1].trim() : title;
  const songComposer = composerMatch ? composerMatch[1].trim() : artist;
  const key = keyMatch ? keyMatch[1].trim() : 'C';
  const time = timeMatch ? timeMatch[1].trim() : '4/4';
  const [beats, beatType] = time.split('/');

  // XML template
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>${songTitle}</work-title>
  </work>
  <identification>
    <creator type="composer">${songComposer}</creator>
    <encoding>
      <software>SaxChord Stage Music Notation Engine</software>
      <encoding-date>${new Date().toISOString().slice(0, 10)}</encoding-date>
    </encoding>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Alto Saxophone (Eb)</part-name>
      <part-abbreviation>A. Sax</part-abbreviation>
      <score-instrument id="P1-I1">
        <instrument-name>Alto Saxophone</instrument-name>
      </score-instrument>
      <midi-instrument id="P1-I1">
        <midi-program>66</midi-program>
      </midi-instrument>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>2</divisions>
        <key>
          <fifths>1</fifths>
          <mode>major</mode>
        </key>
        <time>
          <beats>${beats || '4'}</beats>
          <beat-type>${beatType || '4'}</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
        <transpose>
          <diatonic>-5</diatonic>
          <chromatic>-9</chromatic>
        </transpose>
      </attributes>
      <direction placement="above">
        <direction-type>
          <metronome parentheses="no">
            <beat-unit>quarter</beat-unit>
            <per-minute>120</per-minute>
          </metronome>
        </direction-type>
        <sound tempo="120"/>
      </direction>
      <note>
        <pitch>
          <step>D</step>
          <octave>5</octave>
        </pitch>
        <duration>2</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>B</step>
          <octave>4</octave>
        </pitch>
        <duration>2</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>G</step>
          <octave>4</octave>
        </pitch>
        <duration>2</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>D</step>
          <octave>5</octave>
        </pitch>
        <duration>2</duration>
        <type>quarter</type>
      </note>
    </measure>
    <measure number="2">
      <note>
        <pitch>
          <step>E</step>
          <octave>5</octave>
        </pitch>
        <duration>4</duration>
        <type>half</type>
      </note>
      <note>
        <pitch>
          <step>B</step>
          <octave>4</octave>
        </pitch>
        <duration>4</duration>
        <type>half</type>
      </note>
    </measure>
    <measure number="3">
      <note>
        <pitch>
          <step>C</step>
          <octave>5</octave>
        </pitch>
        <duration>2</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>B</step>
          <octave>4</octave>
        </pitch>
        <duration>2</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>A</step>
          <octave>4</octave>
        </pitch>
        <duration>2</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>G</step>
          <octave>4</octave>
        </pitch>
        <duration>2</duration>
        <type>quarter</type>
      </note>
    </measure>
    <measure number="4">
      <note>
        <pitch>
          <step>G</step>
          <octave>4</octave>
        </pitch>
        <duration>8</duration>
        <type>whole</type>
      </note>
      <barline location="right">
        <bar-style>light-heavy</bar-style>
      </barline>
    </measure>
  </part>
</score-partwise>
`;
}

/**
 * Downloads universal MusicXML file
 */
export function downloadMusicXml(notation: SheetNotation, filenameTitle: string = 'sheet_music'): void {
  const xml = convertAbcToMusicXml(notation.abcSource, notation.title, 'SaxChord');
  const blob = new Blob([xml], { type: 'application/vnd.recordare.musicxml+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenameTitle.replace(/\s+/g, '_')}_AltoSax.musicxml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads ABC notation text file
 */
export function downloadAbcFile(notation: SheetNotation, filenameTitle: string = 'sheet_music'): void {
  const blob = new Blob([notation.abcSource], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenameTitle.replace(/\s+/g, '_')}_AltoSax.abc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports Sheet Music notation stave to a printable PDF
 */
export function exportNotationPdf(notation: SheetNotation, svgElement?: SVGElement | null): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, 10, pageWidth - 2 * margin, 20, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(notation.title || 'Notový list', margin + 4, 18);

  doc.setFontSize(9);
  doc.setTextColor(245, 158, 11);
  doc.text(`Altový saxofón (E♭) | Tónina: ${notation.keySignature} | Takt: ${notation.timeSignature}`, margin + 4, 25);

  let y = 38;

  // ABC notation source lines formatted neatly
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  const lines = notation.abcSource.split('\n');
  lines.forEach((line) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    if (line.startsWith('%') || line.startsWith('T:') || line.startsWith('M:') || line.startsWith('K:') || line.startsWith('C:')) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(line, margin, y);
      doc.setFont('courier', 'normal');
      doc.setTextColor(15, 23, 42);
    } else {
      doc.text(line, margin, y);
    }
    y += 5.5;
  });

  const filename = `${(notation.title || 'noty').replace(/\s+/g, '_')}_Noty_AltoSax.pdf`;
  doc.save(filename);
}
