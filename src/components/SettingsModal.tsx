import React, { useState } from 'react';
import { X, Trash2, Sliders, Check } from 'lucide-react';
import { Translations } from '../constants/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemInstruction: string;
  onSaveSystemInstruction: (val: string) => void;
  onExportHTML?: () => void;
  onClearAllSessions: () => void;
  t: Translations['settingsModal'];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  systemInstruction,
  onSaveSystemInstruction,
  onClearAllSessions,
  t,
}) => {
  const [instruction, setInstruction] = useState(systemInstruction);
  const [saved, setSaved] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSystemInstruction(instruction);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-backdrop-fade"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#0F1422] border border-slate-200 dark:border-white/[0.1] rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 sm:space-y-6 max-h-[90dvh] overflow-y-auto animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* System Instructions */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
            {t.systemTitle}
          </label>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
            {t.systemDesc}
          </p>
          <textarea
            rows={4}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder={t.systemPlaceholder}
            className="w-full rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] p-3 text-base sm:text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none font-sans"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>{t.saved}</span>
                </>
              ) : (
                <span>{t.save}</span>
              )}
            </button>
          </div>
        </div>

        {/* Clear Data Section */}
        <div className="pt-4 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-300 block">
              {t.clearTitle}
            </span>
            <span className="text-[11px] text-slate-500">
              {t.clearDesc}
            </span>
          </div>
          {confirmClear ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClearAllSessions();
                  setConfirmClear(false);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-500 transition-colors cursor-pointer"
              >
                {t.confirmDelete}
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.clearBtn}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
