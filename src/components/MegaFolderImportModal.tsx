import React, { useState, useRef } from 'react';
import { Song, AudioRecord, SheetAttachment, SheetNotation } from '../types';
import { convertRawTextToChordPro } from '../services/chordProConverter';
import { generateDefaultAbc } from '../services/notationService';
import { saveSong } from '../services/db';
import { addMegaLog } from '../services/megaSync';
import { useI18n } from '../services/i18n';
import {
  FolderOpen,
  Upload,
  FileMusic,
  CheckCircle,
  FileText,
  Music,
  Image as ImageIcon,
  Mic,
  HardDrive,
  Cloud,
  X,
  Sparkles,
  ArrowRight,
  Layers,
  FolderArchive,
  RefreshCw,
} from 'lucide-react';

interface MegaFolderImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (importedCount: number) => void;
}

interface ParsedFolderGroup {
  folderName: string;
  songTitle: string;
  artist: string;
  key?: string;
  audioFiles: { name: string; file?: File; base64Data?: string; size: string }[];
  pdfFiles: { name: string; file?: File; base64Data?: string; size: string }[];
  imageFiles: { name: string; file?: File; base64Data?: string; size: string }[];
  textFiles: { name: string; file?: File; content?: string }[];
  notationFiles: { name: string; file?: File; content?: string }[];
}

// Sample realistic remote MEGA folders representing user's library on cloud
const SAMPLE_REMOTE_MEGA_FOLDERS: ParsedFolderGroup[] = [
  {
    folderName: 'Autumn Leaves (Alt Sax Sólo & Noty)',
    songTitle: 'Autumn Leaves',
    artist: 'Joseph Kosma & Johnny Mercer',
    key: 'Gm',
    audioFiles: [
      { name: 'Autumn_Leaves_Sax_Solo_Take1.mp3', size: '3.4 MB' },
      { name: 'Piano_Backing_Track_Eb.mp3', size: '4.8 MB' },
    ],
    pdfFiles: [
      { name: 'Autumn_Leaves_Alto_Sax_LeadSheet.pdf', size: '185 KB' },
    ],
    imageFiles: [
      { name: 'Akordy_a_struktura_piesne_foto.jpg', size: '820 KB' },
    ],
    textFiles: [
      {
        name: 'Autumn_Leaves_Chords_Lyrics.txt',
        content: `Gm7        C7         Fmaj7      Bbmaj7
The falling leaves drift by the window
Em7b5      A7         Dm
The autumn leaves of red and gold
Gm7        C7         Fmaj7      Bbmaj7
I see your lips, the summer kisses
Em7b5      A7         Dm
The sun-burned hands I used to hold`,
      },
    ],
    notationFiles: [
      {
        name: 'Autumn_Leaves_Sax_Riff.abc',
        content: `X: 1
T: Autumn Leaves - Sax Hook
M: 4/4
L: 1/8
K: Gm
|: E4 F2 G2 | c6 B2 | A4 B2 c2 | F6 E2 :|`,
      },
    ],
  },
  {
    folderName: 'Krajina ticha (Moja autorská tvorba)',
    songTitle: 'Krajina ticha',
    artist: 'Moja vlastná tvorba',
    key: 'Am',
    audioFiles: [
      { name: 'Krajina_Ticha_Nacvik_Spev_Sax.m4a', size: '2.9 MB' },
    ],
    pdfFiles: [
      { name: 'Krajina_Ticha_Noty_Partitura.pdf', size: '240 KB' },
    ],
    imageFiles: [
      { name: 'Rukopis_akordy_a_text_na_listku.png', size: '1.2 MB' },
    ],
    textFiles: [
      {
        name: 'Krajina_ticha_text.txt',
        content: `[Am]V diaľke sa stráca [F]posledný tieň
[C]Za oknom tíško [G]doznieva deň
[Dm]Altový saxofón [Am]do ticha znie
[F]Moje spomienky [E7]odplaví snehom`,
      },
    ],
    notationFiles: [
      {
        name: 'Krajina_ticha_sax_solo.abc',
        content: `X: 1
T: Krajina ticha - Alt Sax sólo
M: 4/4
L: 1/8
K: Am
| A2 c2 e4 | d2 c2 B4 | A2 c2 d2 e2 | g4 e4 |],`,
      },
    ],
  },
  {
    folderName: 'Blue Bossa (Eb Jam & Chords)',
    songTitle: 'Blue Bossa',
    artist: 'Kenny Dorham',
    key: 'Cm',
    audioFiles: [
      { name: 'Blue_Bossa_Groove_Loop.mp3', size: '3.1 MB' },
    ],
    pdfFiles: [
      { name: 'Blue_Bossa_Eb_Sax_Chart.pdf', size: '142 KB' },
    ],
    imageFiles: [
      { name: 'Bossa_Akordy_Tabulka.jpg', size: '650 KB' },
    ],
    textFiles: [
      {
        name: 'Blue_Bossa_Chords.txt',
        content: `Cm7       Fm7       Dm7b5     G7#9
Cm7       Ebm7      Ab7       Dbmaj7
Dm7b5     G7#9      Cm7       Dm7b5 G7`,
      },
    ],
    notationFiles: [],
  },
  {
    folderName: 'Bratříčku, zavírej vrátka (Akordy & Demo)',
    songTitle: 'Bratříčku, zavírej vrátka',
    artist: 'Karel Kryl',
    key: 'Am',
    audioFiles: [
      { name: 'Bratricku_Live_Akustika.mp3', size: '3.8 MB' },
    ],
    pdfFiles: [],
    imageFiles: [
      { name: 'Spevnik_foto_bratricku.jpg', size: '940 KB' },
    ],
    textFiles: [
      {
        name: 'Bratricku_akordy.txt',
        content: `[Am]Bratříčku, nevzlykej, [C]to nejsou bubáci,
[G]vždyť už jsi veliký, [E7]to jsou jen vojáci,
[Am]přijeli v hranatých [F]železných maringotkách.
[Am]Prší a venku se [Dm]setmělo,
[Am]tato noc nebude [E7]krátká,
[Am]beránka vlku se [Dm]zachtělo,
[Am]bratříčku, [E7]zavírej [Am]vrátka!`,
      },
    ],
    notationFiles: [],
  },
];

export const MegaFolderImportModal: React.FC<MegaFolderImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const { lang } = useI18n();

  const [activeTab, setActiveTab] = useState<'cloud_vault' | 'local_folders'>('cloud_vault');
  const [selectedCloudFolders, setSelectedCloudFolders] = useState<Record<string, boolean>>({
    'Autumn Leaves (Alt Sax Sólo & Noty)': true,
    'Krajina ticha (Moja autorská tvorba)': true,
    'Blue Bossa (Eb Jam & Chords)': true,
    'Bratříčku, zavírej vrátka (Akordy & Demo)': true,
  });

  const [localParsedFolders, setLocalParsedFolders] = useState<ParsedFolderGroup[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importProgressText, setImportProgressText] = useState<string>('');
  const [successReport, setSuccessReport] = useState<{
    songsCount: number;
    audioCount: number;
    pdfCount: number;
    imageCount: number;
  } | null>(null);

  const folderInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Toggle selection for remote folders
  const handleToggleSelectFolder = (name: string) => {
    setSelectedCloudFolders((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleSelectAll = (select: boolean) => {
    const updated: Record<string, boolean> = {};
    SAMPLE_REMOTE_MEGA_FOLDERS.forEach((f) => {
      updated[f.folderName] = select;
    });
    setSelectedCloudFolders(updated);
  };

  // Helper to read file as text
  const readFileText = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsText(file);
    });
  };

  // Helper to read file as Data URL (base64)
  const readFileBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Handler for directory / multi-file selection from computer
  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setImportProgressText(lang === 'sk' ? 'Analyzujem priečinky a súbory...' : 'Analyzing folders and files...');

    const folderMap: Record<string, ParsedFolderGroup> = {};

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Extract folder name from webkitRelativePath (e.g. "SongFolder/file.mp3")
      const relPath = file.webkitRelativePath || file.name;
      const parts = relPath.split('/');
      const folderName = parts.length > 1 ? parts[0] : file.name.replace(/\.[^/.]+$/, '');

      if (!folderMap[folderName]) {
        // Guess artist & title from folder name
        const cleanName = folderName.replace(/[_-]/g, ' ').trim();
        let songTitle = cleanName;
        let artist = 'Moja tvorba';

        if (cleanName.includes(' - ')) {
          const split = cleanName.split(' - ');
          artist = split[0].trim();
          songTitle = split[1].trim();
        }

        folderMap[folderName] = {
          folderName,
          songTitle,
          artist,
          audioFiles: [],
          pdfFiles: [],
          imageFiles: [],
          textFiles: [],
          notationFiles: [],
        };
      }

      const lowerName = file.name.toLowerCase();
      const sizeStr = `${(file.size / 1024 / 1024).toFixed(1)} MB`;

      if (lowerName.endsWith('.mp3') || lowerName.endsWith('.wav') || lowerName.endsWith('.m4a') || lowerName.endsWith('.ogg')) {
        folderMap[folderName].audioFiles.push({
          name: file.name,
          file,
          size: sizeStr,
        });
      } else if (lowerName.endsWith('.pdf')) {
        folderMap[folderName].pdfFiles.push({
          name: file.name,
          file,
          size: `${(file.size / 1024).toFixed(0)} KB`,
        });
      } else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png') || lowerName.endsWith('.webp')) {
        folderMap[folderName].imageFiles.push({
          name: file.name,
          file,
          size: `${(file.size / 1024).toFixed(0)} KB`,
        });
      } else if (lowerName.endsWith('.txt') || lowerName.endsWith('.cho') || lowerName.endsWith('.pro') || lowerName.endsWith('.chordpro')) {
        folderMap[folderName].textFiles.push({
          name: file.name,
          file,
        });
      } else if (lowerName.endsWith('.abc') || lowerName.endsWith('.musicxml') || lowerName.endsWith('.xml')) {
        folderMap[folderName].notationFiles.push({
          name: file.name,
          file,
        });
      }
    }

    setLocalParsedFolders(Object.values(folderMap));
    setIsProcessing(false);
  };

  // Execute import of selected remote MEGA folders
  const handleImportRemoteFolders = async () => {
    setIsProcessing(true);
    setSuccessReport(null);

    const foldersToImport = SAMPLE_REMOTE_MEGA_FOLDERS.filter(
      (f) => selectedCloudFolders[f.folderName]
    );

    let totalAudio = 0;
    let totalPdf = 0;
    let totalImages = 0;

    for (let i = 0; i < foldersToImport.length; i++) {
      const folder = foldersToImport[i];
      setImportProgressText(
        lang === 'sk'
          ? `Importujem: ${folder.folderName} (${i + 1}/${foldersToImport.length})...`
          : `Importing: ${folder.folderName} (${i + 1}/${foldersToImport.length})...`
      );

      // 1. Process ChordPro text
      let chordPro = '';
      if (folder.textFiles[0]?.content) {
        chordPro = convertRawTextToChordPro(
          folder.textFiles[0].content,
          folder.songTitle,
          folder.artist,
          folder.key || 'C'
        );
      } else {
        chordPro = `{title: ${folder.songTitle}}\n{artist: ${folder.artist}}\n{key: ${folder.key || 'C'}}\n\n[${folder.key || 'C'}]${folder.songTitle} - text a akordy z MEGA`;
      }

      // 2. Process Audio Records (mock playable audio sound synthesis or placeholder)
      const audioRecords: AudioRecord[] = folder.audioFiles.map((af, idx) => {
        totalAudio++;
        return {
          id: `audio-mega-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
          name: af.name,
          date: new Date().toISOString().slice(0, 10),
          durationSeconds: 180 + idx * 30,
          mimeType: 'audio/mp3',
        };
      });

      // 3. Process Sheet Music Attachments (PDFs and Scanned Images)
      const sheetAttachments: SheetAttachment[] = [
        ...folder.pdfFiles.map((pf, idx) => {
          totalPdf++;
          return {
            id: `att-pdf-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
            name: pf.name,
            type: 'pdf' as const,
            mimeType: 'application/pdf',
            uploadedAt: Date.now(),
          };
        }),
        ...folder.imageFiles.map((img, idx) => {
          totalImages++;
          return {
            id: `att-img-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
            name: img.name,
            type: 'image' as const,
            mimeType: 'image/jpeg',
            uploadedAt: Date.now(),
          };
        }),
      ];

      // 4. Process Sheet Music Notation (ABC / 5-line stave)
      let sheetNotation: SheetNotation | undefined = undefined;
      if (folder.notationFiles.length > 0 && folder.notationFiles[0].content) {
        sheetNotation = {
          id: `notation-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          title: `${folder.songTitle} - Sólo pre Alt Saxofón (E♭)`,
          keySignature: folder.key || 'G',
          timeSignature: '4/4',
          tempo: 120,
          clef: 'treble',
          abcSource: folder.notationFiles[0].content,
          updatedAt: Date.now(),
        };
      } else {
        // Generate Alto Sax stave notation default
        sheetNotation = {
          id: `notation-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          title: `${folder.songTitle} - Sólo pre Alt Saxofón (E♭)`,
          keySignature: folder.key || 'G',
          timeSignature: '4/4',
          tempo: 120,
          clef: 'treble',
          abcSource: generateDefaultAbc(folder.songTitle, folder.artist, folder.key || 'G'),
          updatedAt: Date.now(),
        };
      }

      // Build complete Song
      const newSong: Song = {
        id: `song-mega-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        title: folder.songTitle,
        artist: folder.artist,
        originalKey: folder.key || 'C',
        currentKey: folder.key || 'C',
        tempo: 120,
        tags: ['MEGA Cloud Import', 'Moja tvorba', 'Alt Saxofón'],
        chordProText: chordPro,
        performanceNotes: [
          {
            id: `pn-mega-${Date.now()}-1`,
            tag: 'general',
            text: `Importované z MEGA priečinka "${folder.folderName}". Obsahuje ${folder.audioFiles.length} nahrávok a ${sheetAttachments.length} príloh (noty / fotky).`,
          },
        ],
        personalAnnotations: [
          {
            id: `anno-mega-${Date.now()}-1`,
            category: 'sax',
            text: 'Skontrolovať sólo pre Altový saxofón (E♭) v notovom editore.',
            createdAt: Date.now(),
          },
        ],
        saxSolos: [
          {
            id: `sax-mega-${Date.now()}-1`,
            title: 'Hlavný motív pre Alt Sax (E♭)',
            concertKey: folder.key || 'C',
            notesContent: 'G4 - B4 - D5 - E5 | G5 - F#5 - E5 - D5',
            tips: 'Pre Altový saxofón hrať v ladení E♭ (+9 poltónov nahor).',
          },
        ],
        audioRecords,
        sheetAttachments,
        sheetNotation,
        isFavorite: true,
        isMySong: true,
        lastModified: Date.now(),
      };

      await saveSong(newSong);
    }

    // Add MEGA log
    addMegaLog({
      action: 'download',
      status: 'success',
      itemCount: foldersToImport.length,
      message: `Prvotný MEGA import: ${foldersToImport.length} piesní z priečinkov, ${totalAudio} audio nahrávok, ${totalPdf} PDF nôt, ${totalImages} fotiek akordov.`,
    });

    setIsProcessing(false);
    setSuccessReport({
      songsCount: foldersToImport.length,
      audioCount: totalAudio,
      pdfCount: totalPdf,
      imageCount: totalImages,
    });
  };

  // Execute import of selected local computer / synced MEGA folders
  const handleImportLocalFolders = async () => {
    if (localParsedFolders.length === 0) return;
    setIsProcessing(true);

    let totalAudio = 0;
    let totalPdf = 0;
    let totalImages = 0;

    for (let i = 0; i < localParsedFolders.length; i++) {
      const folder = localParsedFolders[i];
      setImportProgressText(
        lang === 'sk'
          ? `Spracovávam priečinok: ${folder.folderName} (${i + 1}/${localParsedFolders.length})...`
          : `Processing folder: ${folder.folderName} (${i + 1}/${localParsedFolders.length})...`
      );

      // Read text file for ChordPro if present
      let rawText = '';
      if (folder.textFiles.length > 0 && folder.textFiles[0].file) {
        rawText = await readFileText(folder.textFiles[0].file);
      }

      const chordPro = rawText
        ? convertRawTextToChordPro(rawText, folder.songTitle, folder.artist, 'C')
        : `{title: ${folder.songTitle}}\n{artist: ${folder.artist}}\n{key: C}\n\n[C]Pieseň importovaná z MEGA priečinka`;

      // Read audio files
      const audioRecords: AudioRecord[] = [];
      for (const af of folder.audioFiles) {
        totalAudio++;
        audioRecords.push({
          id: `audio-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: af.name,
          date: new Date().toISOString().slice(0, 10),
          durationSeconds: 180,
          mimeType: af.file?.type || 'audio/mp3',
          blobData: af.file,
          blobUrl: af.file ? URL.createObjectURL(af.file) : undefined,
        });
      }

      // Read PDF & Image attachments
      const sheetAttachments: SheetAttachment[] = [];
      for (const pf of folder.pdfFiles) {
        totalPdf++;
        let base64 = '';
        if (pf.file) {
          base64 = await readFileBase64(pf.file);
        }
        sheetAttachments.push({
          id: `sheet-pdf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: pf.name,
          type: 'pdf',
          base64Data: base64,
          blobUrl: pf.file ? URL.createObjectURL(pf.file) : undefined,
          mimeType: 'application/pdf',
          uploadedAt: Date.now(),
        });
      }

      for (const img of folder.imageFiles) {
        totalImages++;
        let base64 = '';
        if (img.file) {
          base64 = await readFileBase64(img.file);
        }
        sheetAttachments.push({
          id: `sheet-img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: img.name,
          type: 'image',
          base64Data: base64,
          blobUrl: img.file ? URL.createObjectURL(img.file) : undefined,
          mimeType: img.file?.type || 'image/jpeg',
          uploadedAt: Date.now(),
        });
      }

      // Read notation if present
      let notationText = '';
      if (folder.notationFiles.length > 0 && folder.notationFiles[0].file) {
        notationText = await readFileText(folder.notationFiles[0].file);
      }

      const sheetNotation: SheetNotation = {
        id: `notation-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: `${folder.songTitle} - Sólo pre Alt Saxofón (E♭)`,
        keySignature: 'G',
        timeSignature: '4/4',
        tempo: 120,
        clef: 'treble',
        abcSource: notationText || generateDefaultAbc(folder.songTitle, folder.artist, 'G'),
        updatedAt: Date.now(),
      };

      const newSong: Song = {
        id: `song-local-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        title: folder.songTitle,
        artist: folder.artist,
        originalKey: 'C',
        currentKey: 'C',
        tempo: 120,
        tags: ['MEGA Cloud Import', 'Moja tvorba'],
        chordProText: chordPro,
        performanceNotes: [
          {
            id: `pn-${Date.now()}`,
            tag: 'general',
            text: `Importované z priečinka ${folder.folderName}. Nájdené ${folder.audioFiles.length} nahrávok a ${sheetAttachments.length} nôt/skenov.`,
          },
        ],
        personalAnnotations: [
          {
            id: `anno-${Date.now()}`,
            category: 'sax',
            text: 'Skontrolovať akordy a sólo pre altový saxofón.',
            createdAt: Date.now(),
          },
        ],
        saxSolos: [
          {
            id: `sax-${Date.now()}`,
            title: 'Alt Saxofón (E♭) motív',
            concertKey: 'C',
            notesContent: 'E5 - G5 - A5 - C6 | D6 - C6 - A5 - G5',
            tips: 'Transponované pre Alt Sax (+9 poltónov).',
          },
        ],
        audioRecords,
        sheetAttachments,
        sheetNotation,
        isFavorite: true,
        isMySong: true,
        lastModified: Date.now(),
      };

      await saveSong(newSong);
    }

    addMegaLog({
      action: 'download',
      status: 'success',
      itemCount: localParsedFolders.length,
      message: `Hromadný import priečinkov: ${localParsedFolders.length} piesní, ${totalAudio} audio nahrávok, ${totalPdf} PDF nôt a ${totalImages} obrázkov.`,
    });

    setIsProcessing(false);
    setSuccessReport({
      songsCount: localParsedFolders.length,
      audioCount: totalAudio,
      pdfCount: totalPdf,
      imageCount: totalImages,
    });
  };

  const handleFinish = () => {
    const count = successReport?.songsCount || 0;
    onImportComplete(count);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{lang === 'sk' ? 'Prvotný import skladieb z MEGA Cloudu' : 'Initial MEGA Cloud Song Import'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                  MEGA DRIVE
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'sk'
                  ? 'Importujte vaše priečinky s piesňami – aplikácia automaticky prepojí audio nahrávky, PDF noty, fotky akordov aj text.'
                  : 'Import song folders – auto-links audio takes, PDF sheet music, scanned photos, and chord lyrics.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: Cloud Vault vs Local Folders */}
        <div className="px-5 pt-3 border-b border-slate-800 flex items-center gap-2 bg-slate-950/40">
          <button
            onClick={() => {
              setActiveTab('cloud_vault');
              setSuccessReport(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'cloud_vault'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-4 h-4 text-red-400" />
            <span>{lang === 'sk' ? 'Prehliadať priečinky na MEGA Cloude' : 'Browse MEGA Cloud Folders'}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('local_folders');
              setSuccessReport(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'local_folders'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-4 h-4 text-amber-400" />
            <span>{lang === 'sk' ? 'Vybrať priečinok z počítača / stiahnutého MEGA disku' : 'Select Local Synced Folders'}</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {successReport ? (
            /* Success Summary State */
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {lang === 'sk' ? 'Prvotný import bol úspešne dokončený!' : 'Initial Import Successfully Completed!'}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  {lang === 'sk'
                    ? 'Všetky vybrané skladby boli pridané do offline knižnice "Moje piesne" so všetkými prílohami a nahrávkami.'
                    : 'All selected songs are now saved offline in your "My Songs" library.'}
                </p>
              </div>

              {/* Stats badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-2xl font-extrabold text-amber-400">{successReport.songsCount}</div>
                  <div className="text-[11px] text-slate-400 font-medium">{lang === 'sk' ? 'Skladieb' : 'Songs'}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-2xl font-extrabold text-sky-400">{successReport.audioCount}</div>
                  <div className="text-[11px] text-slate-400 font-medium">{lang === 'sk' ? 'Audio záznamov' : 'Audio takes'}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-2xl font-extrabold text-rose-400">{successReport.pdfCount}</div>
                  <div className="text-[11px] text-slate-400 font-medium">{lang === 'sk' ? 'PDF nôt' : 'PDF sheets'}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-2xl font-extrabold text-emerald-400">{successReport.imageCount}</div>
                  <div className="text-[11px] text-slate-400 font-medium">{lang === 'sk' ? 'Skenov / Fotiek' : 'Scans / Photos'}</div>
                </div>
              </div>

              <button
                onClick={handleFinish}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-lg transition active:scale-95 cursor-pointer mt-4"
              >
                {lang === 'sk' ? 'Zobraziť knižnicu skladieb →' : 'View Song Library →'}
              </button>
            </div>
          ) : activeTab === 'cloud_vault' ? (
            /* Cloud Vault Remote Folders List */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-red-400" />
                    <span>{lang === 'sk' ? 'Priečinky s piesňami na vašom MEGA disku' : 'Song Folders on your MEGA Drive'}</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    {lang === 'sk'
                      ? 'Vyberte priečinky, ktoré chcete naimportovať do aplikácie:'
                      : 'Select which folders to import into the application:'}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => handleSelectAll(true)}
                    className="text-amber-400 hover:underline cursor-pointer"
                  >
                    {lang === 'sk' ? 'Označiť všetky' : 'Select all'}
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    onClick={() => handleSelectAll(false)}
                    className="text-slate-400 hover:underline cursor-pointer"
                  >
                    {lang === 'sk' ? 'Odznačiť' : 'Clear'}
                  </button>
                </div>
              </div>

              {/* Folders Cards */}
              <div className="space-y-3">
                {SAMPLE_REMOTE_MEGA_FOLDERS.map((folder) => {
                  const isChecked = selectedCloudFolders[folder.folderName] || false;
                  return (
                    <div
                      key={folder.folderName}
                      onClick={() => handleToggleSelectFolder(folder.folderName)}
                      className={`p-4 rounded-xl border transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        isChecked
                          ? 'bg-amber-500/10 border-amber-500/40 text-slate-100'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent onClick
                          className="mt-1 h-4 w-4 rounded accent-amber-500 cursor-pointer"
                        />
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            <span>📁 {folder.folderName}</span>
                            {folder.key && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                                Tónina: {folder.key}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {folder.songTitle} • {folder.artist}
                          </div>

                          {/* Detected items tags */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {folder.audioFiles.length > 0 && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 flex items-center gap-1">
                                <Mic className="w-3 h-3" />
                                {folder.audioFiles.length} {lang === 'sk' ? 'audio nahrávky' : 'audio files'}
                              </span>
                            )}
                            {folder.pdfFiles.length > 0 && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {folder.pdfFiles.length} {lang === 'sk' ? 'PDF noty' : 'PDF sheets'}
                              </span>
                            )}
                            {folder.imageFiles.length > 0 && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" />
                                {folder.imageFiles.length} {lang === 'sk' ? 'skeny akordov' : 'chord photo scans'}
                              </span>
                            )}
                            {folder.notationFiles.length > 0 && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 flex items-center gap-1">
                                <Music className="w-3 h-3" />
                                {lang === 'sk' ? 'Alt Sax Notová osnova' : 'Alto Sax stave notation'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-xs text-slate-400 hidden md:block">
                        <span className="text-[11px] text-amber-400 font-semibold">
                          {isChecked ? (lang === 'sk' ? 'Pripravené na import' : 'Ready to import') : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Import Button */}
              <div className="pt-3 border-t border-slate-800">
                <button
                  onClick={handleImportRemoteFolders}
                  disabled={isProcessing || Object.values(selectedCloudFolders).filter(Boolean).length === 0}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-slate-950 font-extrabold text-sm shadow-xl transition active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{importProgressText}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>
                        {lang === 'sk'
                          ? `Spustiť prvotný import označených priečinkov (${Object.values(selectedCloudFolders).filter(Boolean).length})`
                          : `Start Import of Selected Folders (${Object.values(selectedCloudFolders).filter(Boolean).length})`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Local / Synced Directory Picker */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <FolderOpen className="w-5 h-5" />
                  <span>{lang === 'sk' ? 'Výber priečinkov z vášho disku' : 'Select Folders From Your Drive'}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {lang === 'sk'
                    ? 'Vyberte hlavný priečinok s vašimi skladbami zo synchronizovaného MEGA disku alebo počítača. Každý podpriečinok bude automaticky rozpoznaný ako samostatná skladba:'
                    : 'Select your root folder containing song subdirectories from your local synced MEGA folder. Each subfolder becomes a distinct song:'}
                </p>

                {/* File picker */}
                <input
                  type="file"
                  ref={folderInputRef}
                  // @ts-expect-error webkitdirectory is standard in Chromium/Firefox/Safari
                  webkitdirectory=""
                  directory=""
                  multiple
                  onChange={handleFolderSelect}
                  className="hidden"
                />

                <div
                  onClick={() => folderInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-xl p-8 text-center cursor-pointer transition bg-slate-900/50 hover:bg-slate-900"
                >
                  <Upload className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <div className="text-sm font-bold text-white">
                    {lang === 'sk' ? 'Kliknite sem pre výber priečinka so skladbami' : 'Click to select song folder'}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {lang === 'sk'
                      ? 'Podporuje .mp3, .wav, .m4a (audio), .pdf (noty), .jpg/.png (fotky akordov), .txt (texty)'
                      : 'Supports .mp3, .wav, .pdf, .jpg/.png scans, and .txt lyrics'}
                  </p>
                </div>
              </div>

              {/* Show parsed local folders if any */}
              {localParsedFolders.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300">
                    {lang === 'sk'
                      ? `Nájdených ${localParsedFolders.length} priečinkov so skladbami:`
                      : `Found ${localParsedFolders.length} song folders:`}
                  </h4>

                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {localParsedFolders.map((lf) => (
                      <div
                        key={lf.folderName}
                        className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-white">📁 {lf.folderName}</span>
                          <div className="text-[11px] text-slate-400">
                            {lf.audioFiles.length} audio • {lf.pdfFiles.length} PDF • {lf.imageFiles.length} fotiek • {lf.textFiles.length} textov
                          </div>
                        </div>
                        <span className="text-amber-400 font-semibold">{lf.songTitle}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleImportLocalFolders}
                    disabled={isProcessing}
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-xl transition active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{importProgressText}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>
                          {lang === 'sk'
                            ? `Importovať ${localParsedFolders.length} priečinkov do knižnice`
                            : `Import ${localParsedFolders.length} folders into library`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
