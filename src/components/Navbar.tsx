import React from 'react';
import { useI18n, Language } from '../services/i18n';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Music2,
  ListMusic,
  Cloud,
  HelpCircle,
  Globe,
  Radio,
  FileMusic,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'songs' | 'setlists';
  onTabChange: (tab: 'songs' | 'setlists') => void;
  songsCount: number;
  setlistsCount: number;
  onOpenMegaSync: () => void;
  onOpenHelp: () => void;
  megaConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  songsCount,
  setlistsCount,
  onOpenMegaSync,
  onOpenHelp,
  megaConnected,
}) => {
  const { lang, setLang, t } = useI18n();

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
            <span className="text-xl">🎷</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
              <span>SaxChord</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/40">
                STAGE
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              {lang === 'sk' ? 'Spevník & Setlisty na pódium' : 'Songbook & Live Gig Setlists'}
            </p>
          </div>
        </div>

        {/* Center: Tabs Switcher (Songs / Setlists) */}
        <nav className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => onTabChange('songs')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'songs'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music2 className="w-3.5 h-3.5" />
            <span>{t.allSongs}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'songs' ? 'bg-slate-950/30 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
              {songsCount}
            </span>
          </button>

          <button
            onClick={() => onTabChange('setlists')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'setlists'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>{t.setlists}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'setlists' ? 'bg-slate-950/30 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
              {setlistsCount}
            </span>
          </button>
        </nav>

        {/* Right Actions: MEGA Cloud, Help, Language, Install PWA */}
        <div className="flex items-center gap-2">
          {/* MEGA Cloud Sync Button */}
          <button
            onClick={onOpenMegaSync}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              megaConnected
                ? 'bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
            title={lang === 'sk' ? 'MEGA Cloud Synchronizácia' : 'MEGA Cloud Sync'}
          >
            <span className="font-black text-red-500 text-xs">M</span>
            <span className="hidden md:inline">MEGA</span>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${megaConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${megaConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
          </button>

          {/* ChordPro Guide */}
          <button
            onClick={onOpenHelp}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800 transition cursor-pointer"
            title={t.chordProHelp}
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'sk' ? 'en' : 'sk')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 transition cursor-pointer uppercase font-mono"
            title="Prepnúť jazyk / Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang}</span>
          </button>

          {/* PWA In-App Install Button */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
