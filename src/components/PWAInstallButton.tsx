import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';
import { useI18n } from '../services/i18n';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const { lang } = useI18n();

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-md hover:from-amber-400 hover:to-amber-500 transition active:scale-95 cursor-pointer"
        title="Nainštalovať aplikáciu pre 100% offline prístup"
      >
        <Download className="w-3.5 h-3.5" />
        <span>{lang === 'sk' ? 'Inštalovať App' : 'Install App'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          <span>iOS App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-amber-400">
                  {lang === 'sk' ? 'Inštalácia na iPhone / iPad' : 'Install on iPhone / iPad'}
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                {lang === 'sk' ? (
                  <>
                    1. V Safari ťuknite na tlačidlo <strong>Zdieľať (Share)</strong> v dolnej lište.<br />
                    2. Zvoľte <strong>Pridať na plochu (Add to Home Screen)</strong>.<br />
                    3. Aplikácia bude fungovať plne offline priamo na pódiu bez internetu.
                  </>
                ) : (
                  <>
                    1. Tap the <strong>Share</strong> button in the Safari toolbar.<br />
                    2. Scroll down and tap <strong>Add to Home Screen</strong>.<br />
                    3. The app will be available 100% offline during live gigs!
                  </>
                )}
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition"
              >
                {lang === 'sk' ? 'Rozumiem' : 'Got it'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
