import React from 'react';
import { X, Sparkles, Palette, Cpu, ShieldCheck } from 'lucide-react';
import { TEAM_MEMBERS } from '../constants/models';
import { Translations } from '../constants/translations';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: Translations['teamModal'];
}

export const TeamModal: React.FC<TeamModalProps> = ({ isOpen, onClose, t }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-xs animate-backdrop-fade"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#0F1422] border border-slate-200 dark:border-white/[0.1] rounded-3xl shadow-2xl max-h-[90dvh] flex flex-col overflow-hidden animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-slate-100 dark:border-white/[0.08] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 via-violet-600 to-emerald-600 flex items-center justify-center shadow-md shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {t.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer shrink-0"
            title="Chiudi"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-5">
          {/* Vision Statement */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.06] text-xs text-slate-700 dark:text-slate-300 leading-relaxed shadow-xs">
            <p>{t.vision}</p>
          </div>

          {/* Creators Grid */}
          <div className="space-y-4">
            {TEAM_MEMBERS.map((member, idx) => {
              const icons = [
                <Cpu key="0" className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />,
                <Palette key="1" className="w-4 h-4 text-violet-500 dark:text-violet-400" />,
                <Palette key="2" className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />,
              ];

              return (
                <div
                  key={member.name}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 dark:bg-[#131929] border border-slate-200 dark:border-white/[0.07] hover:border-cyan-500/40 dark:hover:border-white/[0.15] transition-all shadow-xs"
                >
                  <div className="flex items-start gap-3.5 sm:gap-4">
                    {/* Avatar */}
                    <div
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr ${member.avatarBg} flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0`}
                    >
                      {member.name.charAt(0)}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {member.name}
                          </h3>
                          <span className="flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {icons[idx]}
                            {member.specialty}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 mt-0.5">
                        {member.role}
                      </p>

                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                        {member.bio}
                      </p>

                      {/* Key Contributions */}
                      <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-white/[0.06]">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
                          {t.keyFocus}
                        </span>
                        <ul className="mt-1.5 space-y-1">
                          {member.contributions.map((c, cIdx) => (
                            <li
                              key={cIdx}
                              className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 shrink-0" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer info & publishing readiness */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span>{t.readyBadge}</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer shrink-0"
            >
              {t.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
