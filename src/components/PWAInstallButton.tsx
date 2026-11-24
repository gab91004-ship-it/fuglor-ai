import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={
          compact
            ? 'flex items-center gap-1.5 px-2.5 py-1.5 min-h-[34px] rounded-xl text-xs font-medium text-sky-700 dark:text-cyan-300 bg-sky-50 hover:bg-sky-100 dark:bg-cyan-500/15 dark:hover:bg-cyan-500/25 border border-sky-200 dark:border-cyan-500/30 transition-colors cursor-pointer whitespace-nowrap'
            : 'flex items-center gap-2 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-sky-500 transition-colors cursor-pointer whitespace-nowrap'
        }
        title="Installa Fuglor AI come app"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span className={compact ? 'hidden @[920px]:inline' : ''}>Installa App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 min-h-[34px] rounded-xl text-xs font-medium text-sky-700 dark:text-cyan-300 bg-sky-50 hover:bg-sky-100 dark:bg-cyan-500/15 dark:hover:bg-cyan-500/25 border border-sky-200 dark:border-cyan-500/30 transition-colors cursor-pointer whitespace-nowrap"
          title="Installa su iPhone o iPad"
        >
          <Share className="w-3.5 h-3.5 shrink-0" />
          <span className={compact ? 'hidden @[920px]:inline' : ''}>Installa</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#0F1422] border border-slate-200 dark:border-white/[0.1] p-5 shadow-2xl space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Installa Fuglor AI su iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>
                  Tocca il pulsante <strong>Condividi</strong> nella barra di Safari.
                </li>
                <li>
                  Scorri verso il basso e seleziona <strong>Aggiungi alla schermata Home</strong>.
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Chiudi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
