import React, { useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Translations } from '../constants/translations';

interface NameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveName: (name: string) => void;
  currentName?: string;
  t: Translations['nameModal'];
}

export const NameModal: React.FC<NameModalProps> = ({
  isOpen,
  onClose,
  onSaveName,
  currentName = '',
  t,
}) => {
  const [name, setName] = useState(currentName);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      onSaveName(trimmed);
      onClose();
    }
  };

  const handleSkip = () => {
    onSaveName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-backdrop-fade">
      <div
        className="relative w-full max-w-md rounded-3xl p-5 sm:p-7 text-center shadow-2xl space-y-5 sm:space-y-6 max-h-[90dvh] overflow-y-auto border border-white/10 animate-fade-in-scale"
        style={{
          background: 'linear-gradient(180deg, #161D2E 0%, #0E1320 100%)',
          boxShadow: '0 25px 60px -15px rgba(56, 189, 248, 0.2), 0 0 40px rgba(168, 85, 247, 0.15)',
        }}
      >
        {/* Glowing Luminous Halo Orb Header */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          {/* Outer animated neon glow rings */}
          <div
            className="absolute inset-0 rounded-full animate-glow-spin"
            style={{
              background: 'conic-gradient(from 0deg, #38BDF8, #818CF8, #C084FC, #F472B6, #FB7185, #38BDF8)',
              filter: 'blur(10px)',
              opacity: 0.7,
            }}
          />
          {/* Inner dark center core with mascot image */}
          <div className="relative w-20 h-20 rounded-full bg-[#0D1322] border-2 border-cyan-400/80 flex items-center justify-center shadow-inner overflow-hidden animate-orb">
            <img
              src="/assets/aistudio/immagine_11d61f71.png"
              alt="Fuglor AI Mascot"
              className="w-full h-full object-cover rounded-full select-none pointer-events-none scale-105"
            />
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {currentName ? t.changeTitle : t.title}
          </h2>
          <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="relative">
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.placeholder}
              maxLength={40}
              className="w-full px-4 py-3.5 rounded-2xl bg-[#090D16] border border-white/10 text-white placeholder-slate-500 text-base sm:text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all font-sans"
            />
            <Sparkles className="w-4 h-4 text-cyan-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="flex flex-col gap-2.5 pt-1">
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 hover:via-indigo-400 hover:to-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t.submit}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {!currentName && (
              <button
                type="button"
                onClick={handleSkip}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                {t.skip}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
