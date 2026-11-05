import React, { useState, useEffect } from 'react';
import { MegaSyncConfig, MegaSyncLog } from '../types';
import {
  pushToMega,
  pullFromMega,
  getMegaLogs,
  downloadMegaBackupFile,
} from '../services/megaSync';
import { getSyncConfig, saveSyncConfig, importFullDatabase } from '../services/db';
import { useI18n } from '../services/i18n';
import {
  Cloud,
  CloudLightning,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  FileText,
  X,
  HardDrive,
  ShieldCheck,
  FolderSync,
  FolderArchive,
} from 'lucide-react';

interface MegaSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete: () => void;
  onOpenFolderImport?: () => void;
}

export const MegaSyncModal: React.FC<MegaSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete,
  onOpenFolderImport,
}) => {
  const { lang, t } = useI18n();
  const [config, setConfig] = useState<MegaSyncConfig>({
    email: '',
    folderPath: '/Root/SaxChord_Stage_Backup',
    lastSyncTimestamp: null,
    autoSync: true,
    isConnected: false,
  });
  const [logs, setLogs] = useState<MegaSyncLog[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    const saved = await getSyncConfig();
    setConfig(saved);
    setLogs(getMegaLogs());
  };

  if (!isOpen) return null;

  const handlePush = async () => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const res = await pushToMega(config);
      if (res.success) {
        setStatusMessage({ text: res.message });
        await loadConfig();
        onSyncComplete();
      } else {
        setStatusMessage({ text: res.message, isError: true });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePull = async () => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const res = await pullFromMega(config);
      if (res.success) {
        setStatusMessage({ text: res.message });
        await loadConfig();
        onSyncComplete();
      } else {
        setStatusMessage({ text: res.message, isError: true });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveSettings = async () => {
    await saveSyncConfig({
      ...config,
      isConnected: Boolean(config.email.trim()),
    });
    setStatusMessage({
      text: lang === 'sk' ? 'Nastavenia MEGA cloudu boli uložené.' : 'MEGA cloud configuration saved.',
    });
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const text = await file.text();
      const res = await importFullDatabase(text);
      setStatusMessage({
        text:
          lang === 'sk'
            ? `Úspešne obnovených ${res.songsCount} skladieb a ${res.setlistsCount} setlistov zo súboru MEGA!`
            : `Successfully restored ${res.songsCount} songs and ${res.setlistsCount} setlists from file!`,
      });
      onSyncComplete();
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'Failed to restore', isError: true });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/40 flex items-center justify-center text-red-500 font-black text-xl shadow-lg">
              M
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>MEGA Cloud Storage</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-semibold border border-red-500/30">
                  {config.isConnected ? 'Synchronized' : 'Cloud Ready'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'sk'
                  ? 'Zabezpečená synchronizácia textov, akordov a nahrávok naprieč všetkými zariadeniami'
                  : 'Encrypted sync for songs, chords, and rehearsal recordings across all devices'}
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

        {/* Status Message Notification */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              statusMessage.isError
                ? 'bg-red-500/20 border border-red-500/40 text-red-300'
                : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
            }`}
          >
            {statusMessage.isError ? (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Highlighted Initial Folder Import Banner */}
        {onOpenFolderImport && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/60 via-slate-900 to-amber-950/40 border border-red-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 flex-shrink-0">
                <FolderArchive className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white flex items-center gap-2">
                  <span>{lang === 'sk' ? 'Prvotný import priečinkov z MEGA' : 'Initial Folder Import from MEGA'}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                    ODPORÚČANÉ
                  </span>
                </h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {lang === 'sk'
                    ? 'Máte na MEGA cloude priečinky s nahrávkami (.mp3), PDF notami, skenmi akordov a textami? Spustite hromadný import!'
                    : 'Have song folders on MEGA with recordings (.mp3), PDF sheets, scanned chords, and lyrics? Run bulk import!'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenFolderImport();
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:brightness-110 text-white font-extrabold text-xs shadow-md transition active:scale-95 cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
            >
              <span>{lang === 'sk' ? 'Otvoriť import priečinkov →' : 'Open Folder Importer →'}</span>
            </button>
          </div>
        )}

        {/* Cloud Actions Hub */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handlePush}
            disabled={isProcessing}
            className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-red-500/50 hover:bg-slate-950/80 transition flex items-center gap-3.5 cursor-pointer text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 group-hover:scale-105 transition">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-100 group-hover:text-red-400 transition">
                {t.pushToMega}
              </h4>
              <p className="text-[11px] text-slate-400">
                {lang === 'sk'
                  ? 'Uložiť kompletný spevník a audio do MEGA'
                  : 'Upload full songbook & audio to MEGA cloud'}
              </p>
            </div>
          </button>

          <button
            onClick={handlePull}
            disabled={isProcessing}
            className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-950/80 transition flex items-center gap-3.5 cursor-pointer text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-105 transition">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-100 group-hover:text-sky-400 transition">
                {t.pullFromMega}
              </h4>
              <p className="text-[11px] text-slate-400">
                {lang === 'sk'
                  ? 'Stiahnuť najnovšie skladby z iných zariadení'
                  : 'Pull latest songs & setlists from cloud'}
              </p>
            </div>
          </button>
        </div>

        {/* Standalone Backup / Restore buttons */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <h4 className="font-bold text-slate-200">
              {lang === 'sk' ? 'Manuálna záloha súborom (.mega-songbook.json)' : 'Manual file export for MEGA drive'}
            </h4>
            <p className="text-[11px] text-slate-400">
              {lang === 'sk'
                ? 'Stiahnite si súbor a presuňte priamo do MEGA disku alebo zdieľajte s kapelou'
                : 'Download full encrypted songbook archive or restore on any tablet/laptop'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadMegaBackupFile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer transition"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'sk' ? 'Stiahnuť zálohu' : 'Export File'}</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer transition">
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              <span>{lang === 'sk' ? 'Obnoviť zo súboru' : 'Restore File'}</span>
              <input
                type="file"
                accept=".json,.mega-songbook.json"
                onChange={handleRestoreFile}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Configuration settings form */}
        <div className="space-y-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
          <h4 className="font-bold text-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'sk' ? 'Nastavenie účtu MEGA' : 'MEGA Account Configuration'}</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">
                {lang === 'sk' ? 'MEGA e-mail / Používateľské ID' : 'MEGA Account Email'}
              </label>
              <input
                type="text"
                value={config.email}
                onChange={(e) => setConfig({ ...config, email: e.target.value })}
                placeholder="saxofonista@gmail.com"
                className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-white focus:border-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                {lang === 'sk' ? 'Cesta k priečinku na MEGA' : 'MEGA Cloud Folder'}
              </label>
              <input
                type="text"
                value={config.folderPath}
                onChange={(e) => setConfig({ ...config, folderPath: e.target.value })}
                placeholder="/Root/SaxChord_Stage_Backup"
                className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-white focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoSync}
                onChange={(e) => setConfig({ ...config, autoSync: e.target.checked })}
                className="rounded accent-red-500 cursor-pointer"
              />
              <span>
                {lang === 'sk'
                  ? 'Automatická synchronizácia po úprave skladieb'
                  : 'Auto-sync changes across devices'}
              </span>
            </label>

            <button
              onClick={handleSaveSettings}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition cursor-pointer"
            >
              {t.save}
            </button>
          </div>
        </div>

        {/* Sync Logs */}
        {logs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {lang === 'sk' ? 'História synchronizácie' : 'Sync History'}
            </h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        log.status === 'success' ? 'bg-emerald-400' : 'bg-red-400'
                      }`}
                    />
                    <span className="text-slate-300">{log.message}</span>
                  </div>
                  <span className="text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
