import React from 'react';
import { useI18n } from '../services/i18n';
import { HelpCircle, X, Check, Copy } from 'lucide-react';

interface ChordProHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChordProHelpModal: React.FC<ChordProHelpModalProps> = ({ isOpen, onClose }) => {
  const { lang, t } = useI18n();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 max-h-[85vh] overflow-y-auto space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              {lang === 'sk' ? 'ChordPro formát — Rýchly sprievodca' : 'ChordPro Format Cheat Sheet'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <div>
            <h4 className="font-bold text-amber-400 mb-1 text-sm">
              {lang === 'sk' ? '1. Vkladanie akordov do textu' : '1. Inserting Chords in Lyrics'}
            </h4>
            <p className="text-slate-400 mb-2">
              {lang === 'sk'
                ? 'Akordy vkladajte priamo do hranatých zátvoriek [] pred slabiku, na ktorú pripadá zmena akordu.'
                : 'Place chords in square brackets [] right before the corresponding lyric syllable.'}
            </p>
            <div className="p-3 bg-slate-950 rounded-xl font-mono text-amber-300 border border-slate-800">
              [Dm]I feel so unsure as I [Gm]take your hand<br />
              And lead you [Bb]to the dance floor [Am7] [A7]
            </div>
          </div>

          <div>
            <h4 className="font-bold text-amber-400 mb-1 text-sm">
              {lang === 'sk' ? '2. Refrény a verše (Zvýraznenie)' : '2. Chorus & Verse Blocks'}
            </h4>
            <div className="p-3 bg-slate-950 rounded-xl font-mono text-slate-200 border border-slate-800 space-y-1">
              <span className="text-amber-400">{'{start_of_chorus}'}</span> alebo <span className="text-amber-400">{'{soc}'}</span><br />
              [F]This is the chorus [G]singing loud and clear<br />
              <span className="text-amber-400">{'{end_of_chorus}'}</span> alebo <span className="text-amber-400">{'{eoc}'}</span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-amber-400 mb-1 text-sm">
              {lang === 'sk' ? '3. Poznámky a saxofónové vyhrávky' : '3. Stage Cues & Sax Solos'}
            </h4>
            <div className="p-3 bg-slate-950 rounded-xl font-mono text-slate-200 border border-slate-800">
              <span className="text-sky-400">{'{comment: Saxofónové sólo - Altový saxofón}'}</span><br />
              [Dm] [Gm] [Bb] [Am]
            </div>
          </div>

          <div>
            <h4 className="font-bold text-amber-400 mb-1 text-sm">
              {lang === 'sk' ? '4. Hlavička skladby (Metadáta)' : '4. Song Metadata Directives'}
            </h4>
            <div className="p-3 bg-slate-950 rounded-xl font-mono text-slate-200 border border-slate-800 space-y-0.5">
              <div><span className="text-amber-400">{'{title: '}</span>Careless Whisper{'}'}</div>
              <div><span className="text-amber-400">{'{artist: '}</span>George Michael{'}'}</div>
              <div><span className="text-amber-400">{'{key: '}</span>Dm{'}'}</div>
              <div><span className="text-amber-400">{'{tempo: '}</span>76{'}'}</div>
              <div><span className="text-amber-400">{'{capo: '}</span>0{'}'}</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
