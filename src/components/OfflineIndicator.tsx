import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useI18n } from '../services/i18n';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { lang } = useI18n();
  const [dismissed, setDismissed] = useState(false);

  if (isOnline || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900/95 border border-amber-500/40 px-3.5 py-2 text-xs font-medium text-amber-300 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
      </span>
      <WifiOff className="w-3.5 h-3.5" />
      <span>
        {lang === 'sk'
          ? 'Offline režim — Všetky skladby a audio sú uložené lokálne pre pódium'
          : 'Offline Mode — All songs & audio are cached locally for live stage'}
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="ml-2 text-slate-400 hover:text-white px-1.5 py-0.5 rounded text-[10px] bg-slate-800"
      >
        ✕
      </button>
    </div>
  );
};
