import React, { useState } from 'react';
import { SheetAttachment } from '../types';
import { useI18n } from '../services/i18n';
import {
  FileText,
  Image,
  Upload,
  Trash2,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  FileDown,
} from 'lucide-react';

interface SheetMusicViewerProps {
  attachments: SheetAttachment[];
  onUpdateAttachments: (updated: SheetAttachment[]) => void;
  readOnly?: boolean;
}

export const SheetMusicViewer: React.FC<SheetMusicViewerProps> = ({
  attachments,
  onUpdateAttachments,
  readOnly = false,
}) => {
  const { lang } = useI18n();

  const [activeAttachmentId, setActiveAttachmentId] = useState<string | null>(
    attachments[0]?.id || null
  );
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreenModal, setIsFullscreenModal] = useState<boolean>(false);
  const [isInvertedStageColors, setIsInvertedStageColors] = useState<boolean>(false);

  const activeAttachment = attachments.find((a) => a.id === activeAttachmentId) || attachments[0] || null;

  // Handle uploading PDF or Image photo of sheet music
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const type: 'pdf' | 'image' = isPdf ? 'pdf' : 'image';

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const newAtt: SheetAttachment = {
        id: `sheet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        type,
        base64Data: base64,
        blobUrl: URL.createObjectURL(file),
        mimeType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
        uploadedAt: Date.now(),
      };

      const updated = [...attachments, newAtt];
      onUpdateAttachments(updated);
      setActiveAttachmentId(newAtt.id);
    };

    reader.readAsDataURL(file);
  };

  const handleDelete = (id: string) => {
    if (confirm(lang === 'sk' ? 'Naozaj zmazať tento notový list / fotku?' : 'Delete this sheet attachment?')) {
      const updated = attachments.filter((a) => a.id !== id);
      onUpdateAttachments(updated);
      if (activeAttachmentId === id) {
        setActiveAttachmentId(updated[0]?.id || null);
      }
    }
  };

  const handleDownloadAttachment = (attachment: SheetAttachment) => {
    if (!attachment.base64Data) return;
    const a = document.createElement('a');
    a.href = attachment.base64Data;
    a.download = attachment.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 md:p-6 shadow-2xl space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{lang === 'sk' ? 'Notové listy, PDF a fotky akordov' : 'Sheet Music, PDF & Photo Viewer'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
                {attachments.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'sk'
                ? 'Prezeranie originálnych nôt a fotiek akordov z vášho MEGA cloudu'
                : 'View original sheet music PDFs and chord charts from your MEGA storage'}
            </p>
          </div>
        </div>

        {/* Upload Button */}
        {!readOnly && (
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold text-xs border border-sky-500/30 transition cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>{lang === 'sk' ? 'Pridať PDF / Fotku nôt' : 'Add Sheet PDF / Photo'}</span>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Attachment Tabs */}
      {attachments.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {attachments.map((att) => {
            const isSelected = activeAttachment?.id === att.id;
            return (
              <button
                key={att.id}
                onClick={() => {
                  setActiveAttachmentId(att.id);
                  setZoomLevel(100);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-sky-500 text-slate-950 font-bold shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {att.type === 'pdf' ? <FileText className="w-3.5 h-3.5" /> : <Image className="w-3.5 h-3.5" />}
                <span className="truncate max-w-[140px]">{att.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Sheet Viewer Area */}
      {activeAttachment ? (
        <div className="space-y-3">
          {/* Viewer Toolbar */}
          <div className="flex items-center justify-between p-2 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                title="Zmenšiť"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono text-slate-400 font-bold text-xs">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(250, z + 25))}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                title="Zväčšiť"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsInvertedStageColors(!isInvertedStageColors)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
                  isInvertedStageColors
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
                title="Invertovať farby pre tmavé pódium"
              >
                Invertovať farby
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownloadAttachment(activeAttachment)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                title="Stiahnuť súbor"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsFullscreenModal(true)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                title="Zobraziť na celú obrazovku"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {!readOnly && (
                <button
                  onClick={() => handleDelete(activeAttachment.id)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-400 cursor-pointer"
                  title="Zmazať list"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Sheet Canvas / Display Viewport */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/90 min-h-[380px] max-h-[600px] overflow-auto flex items-center justify-center">
            {activeAttachment.type === 'pdf' ? (
              <iframe
                src={activeAttachment.base64Data || activeAttachment.blobUrl}
                title={activeAttachment.name}
                className="w-full h-[520px] rounded-xl border border-slate-800"
              />
            ) : (
              <img
                src={activeAttachment.base64Data || activeAttachment.blobUrl}
                alt={activeAttachment.name}
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  filter: isInvertedStageColors ? 'invert(1) hue-rotate(180deg)' : 'none',
                  transformOrigin: 'top center',
                }}
                className="max-w-full rounded-xl transition-transform shadow-2xl"
              />
            )}
          </div>
        </div>
      ) : (
        <div className="p-10 text-center rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-slate-400 text-xs space-y-2">
          <p>
            {lang === 'sk'
              ? 'Tento song zatiaľ nemá priložené žiadne naskenované noty ani PDF z MEGA cloudu.'
              : 'No attached sheet music scans or PDFs for this song yet.'}
          </p>
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>{lang === 'sk' ? 'Pridať prvé noty alebo fotku akordov' : 'Add Sheet Music'}</span>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Fullscreen Modal View */}
      {isFullscreenModal && activeAttachment && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col p-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h4 className="font-bold text-white text-sm">{activeAttachment.name}</h4>
            <button
              onClick={() => setIsFullscreenModal(false)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            {activeAttachment.type === 'pdf' ? (
              <iframe
                src={activeAttachment.base64Data || activeAttachment.blobUrl}
                title={activeAttachment.name}
                className="w-full h-full rounded-xl"
              />
            ) : (
              <img
                src={activeAttachment.base64Data || activeAttachment.blobUrl}
                alt={activeAttachment.name}
                style={{
                  filter: isInvertedStageColors ? 'invert(1) hue-rotate(180deg)' : 'none',
                }}
                className="max-h-full max-w-full object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
