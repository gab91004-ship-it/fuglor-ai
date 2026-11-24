import React, { useState } from 'react';
import {
  Sparkles,
  Globe,
  Menu,
  Users,
  Settings,
  ChevronDown,
  Check,
  Share2,
  Crown,
  Timer,
  Plus,
  Sun,
  Moon,
  MoreVertical,
} from 'lucide-react';
import { FUGLOR_MODELS } from '../constants/models';
import { FuglorModel } from '../types';
import { Translations } from '../constants/translations';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentModelId: string;
  onSelectModel: (modelId: string) => void;
  useSearch: boolean;
  onToggleSearch: () => void;
  onOpenTeam: () => void;
  onOpenSettings: () => void;
  onOpenShare: () => void;
  onExportHTML?: () => void;
  onToggleMobileSidebar: () => void;
  onNewSession?: () => void;
  isPro?: boolean;
  onOpenPricing?: () => void;
  onOpenTimer?: () => void;
  timerTimeLeft?: number;
  isTimerRunning?: boolean;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  t: Translations['header'];
}

export const Header: React.FC<HeaderProps> = ({
  currentModelId,
  onSelectModel,
  useSearch,
  onToggleSearch,
  onOpenTeam,
  onOpenSettings,
  onOpenShare,
  onExportHTML: _onExportHTML,
  onToggleMobileSidebar,
  onNewSession,
  isPro = false,
  onOpenPricing,
  onOpenTimer,
  timerTimeLeft,
  isTimerRunning = false,
  theme = 'dark',
  onToggleTheme,
  t,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const activeModel = FUGLOR_MODELS.find((m) => m.id === currentModelId) || FUGLOR_MODELS[0];

  const timerLabel =
    timerTimeLeft !== undefined
      ? `${Math.floor(timerTimeLeft / 60)}:${String(timerTimeLeft % 60).padStart(2, '0')}`
      : 'Timer';

  return (
    <header className="@container h-14 sm:h-15 border-b border-[#E5E7EB] dark:border-white/[0.06] bg-white/90 dark:bg-[#0E1015]/90 backdrop-blur-md px-2.5 sm:px-4 lg:px-6 flex items-center justify-between gap-2 z-20 shrink-0">
      {/* Zone 1: Sidebar Toggle + Wordmark + Model Selector */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink">
        <button
          onClick={onToggleMobileSidebar}
          className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
          title="Mostra / Nascondi barra laterale"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg p-[1.5px] bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-500 shadow-xs shrink-0 overflow-hidden">
            <img
              src="/assets/aistudio/immagine_11d61f71.png"
              alt="Fuglor AI"
              className="w-full h-full object-cover rounded-[6px]"
            />
          </div>
          <span className="hidden sm:inline font-bold text-base tracking-tight bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-cyan-400 dark:to-indigo-400 bg-clip-text text-transparent whitespace-nowrap">
            Fuglor AI
          </span>
          <span className="hidden @[640px]:inline text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-white/[0.06]">
            v1.0
          </span>
        </div>

        {/* Model Dropdown */}
        <div className="relative min-w-0">
          <button
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setMoreMenuOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 min-h-[34px] rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#14161D] dark:hover:bg-[#1A1D26] border border-[#E5E7EB] dark:border-white/[0.08] text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors cursor-pointer max-w-full"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400 shrink-0" />
            <span className="font-semibold truncate max-w-[115px] sm:max-w-[160px]">
              {activeModel.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="fixed sm:absolute left-3 right-3 sm:left-0 sm:right-auto top-15 sm:top-full sm:mt-2 sm:w-80 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200 dark:border-white/[0.1] shadow-2xl z-40 py-1.5 overflow-hidden animate-popover-blur">
                <div className="px-3.5 py-2 border-b border-slate-100 dark:border-white/[0.06] text-[10px] font-mono tracking-wider uppercase text-slate-400 dark:text-slate-500 font-semibold">
                  {t.modelSelectorHint}
                </div>
                {FUGLOR_MODELS.map((model: FuglorModel) => {
                  const isSelected = model.id === currentModelId;
                  return (
                    <button
                      key={model.id}
                      onClick={() => {
                        onSelectModel(model.id);
                        setDropdownOpen(false);
                      }}
                      className={`w-full px-3.5 py-2.5 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-sky-50/80 dark:bg-cyan-500/10 text-slate-950 dark:text-white'
                          : 'hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900 dark:text-white">
                            {model.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-100/80 dark:bg-cyan-500/15 text-sky-700 dark:text-cyan-300 font-medium">
                            {model.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-normal">
                          {model.description}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-sky-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Web Search Grounding Toggle */}
        <button
          onClick={onToggleSearch}
          className={`hidden @[580px]:flex items-center gap-1.5 px-2.5 py-1.5 min-h-[34px] rounded-xl border text-xs font-medium transition-colors cursor-pointer shrink-0 ${
            useSearch
              ? 'bg-sky-50 border-sky-200 text-sky-700 dark:bg-cyan-500/15 dark:border-cyan-500/35 dark:text-cyan-300 shadow-xs'
              : 'bg-transparent border-[#E5E7EB] dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
          }`}
          title={useSearch ? t.webSearchActive : t.webSearch}
        >
          <Globe className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden @[900px]:inline text-xs whitespace-nowrap">{t.webSearch}</span>
        </button>
      </div>

      {/* Zone 2: Container-Aware Clean Actions */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {onNewSession && (
          <button
            onClick={onNewSession}
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-[#E5E7EB] dark:border-white/[0.08] text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            title="Nuova Chat"
            aria-label="Nuova Chat"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}

        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="xl:hidden flex items-center justify-center w-9 h-9 rounded-xl text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Passa a tema chiaro' : 'Passa a tema scuro'}
            aria-label={theme === 'dark' ? 'Passa a tema chiaro' : 'Passa a tema scuro'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>
        )}

        <button
          onClick={onOpenSettings}
          className="hidden @[580px]:flex items-center gap-1.5 px-2.5 py-1.5 min-h-[34px] rounded-xl text-xs font-medium text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
          title={t.settings}
        >
          <Settings className="w-4 h-4 @[880px]:w-3.5 @[880px]:h-3.5 shrink-0" />
          <span className="hidden @[880px]:inline text-xs whitespace-nowrap">Configura</span>
        </button>

        <button
          onClick={onOpenTeam}
          className="hidden @[580px]:flex items-center gap-1.5 px-2.5 py-1.5 min-h-[34px] rounded-xl text-xs font-medium text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
          title="Team: Gabriel, Luca, Federico"
        >
          <Users className="w-4 h-4 @[880px]:w-3.5 @[880px]:h-3.5 shrink-0" />
          <span className="hidden @[880px]:inline text-xs whitespace-nowrap">{t.team}</span>
        </button>

        {onOpenTimer && (
          <button
            onClick={onOpenTimer}
            className={`${
              isTimerRunning ? 'flex' : 'hidden @[580px]:flex'
            } items-center gap-1.5 px-2.5 py-1.5 min-h-[34px] rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              isTimerRunning
                ? 'bg-orange-500/15 text-orange-600 dark:text-orange-300 border border-orange-400/40'
                : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
            }`}
            title="Timer studio"
          >
            <Timer className="w-4 h-4 @[880px]:w-3.5 @[880px]:h-3.5 shrink-0" />
            <span className="font-mono text-[11px] tabular-nums whitespace-nowrap">{timerLabel}</span>
          </button>
        )}

        <button
          onClick={onOpenShare}
          className="hidden @[580px]:flex items-center gap-1.5 px-2.5 py-1.5 min-h-[34px] rounded-xl text-xs font-medium text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
          title="Condividi"
        >
          <Share2 className="w-4 h-4 @[880px]:w-3.5 @[880px]:h-3.5 shrink-0" />
          <span className="hidden @[880px]:inline text-xs whitespace-nowrap">Condividi</span>
        </button>

        <PWAInstallButton compact />

        {onOpenPricing && (
          <button
            onClick={onOpenPricing}
            className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-xs ${
              isPro
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-amber-500/20'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/20'
            }`}
            title="Piani e Abbonamento Fuglor"
          >
            <Crown className="w-3.5 h-3.5 shrink-0" />
            <span>{isPro ? 'PRO' : 'Piani'}</span>
          </button>
        )}

        {/* Overflow Menu for narrow container (< 580px) */}
        <div className="relative @[580px]:hidden">
          <button
            onClick={() => {
              setMoreMenuOpen((prev) => !prev);
              setDropdownOpen(false);
            }}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
            title="Altre opzioni"
            aria-label="Altre opzioni"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {moreMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setMoreMenuOpen(false)}
              />
              <div className="fixed right-3 top-15 w-56 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200 dark:border-white/[0.1] shadow-2xl z-40 py-1.5 overflow-hidden animate-popover-blur">
                <button
                  onClick={() => {
                    onToggleSearch();
                    setMoreMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-medium flex items-center justify-between text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04] cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-sky-500 dark:text-cyan-400" />
                    <span>Ricerca Web</span>
                  </span>
                  <span className={`text-[11px] font-mono ${useSearch ? 'text-sky-600 dark:text-cyan-400 font-bold' : 'text-slate-400'}`}>
                    {useSearch ? 'ON' : 'OFF'}
                  </span>
                </button>

                {onOpenTimer && (
                  <button
                    onClick={() => {
                      onOpenTimer();
                      setMoreMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-medium flex items-center justify-between text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04] cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Timer className="w-4 h-4 text-orange-500" />
                      <span>Timer Pomodoro</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{timerLabel}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onOpenShare();
                    setMoreMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-medium flex items-center gap-2.5 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04] cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-indigo-500" />
                  <span>Condividi</span>
                </button>

                <button
                  onClick={() => {
                    onOpenSettings();
                    setMoreMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-medium flex items-center gap-2.5 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04] cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Configurazione</span>
                </button>

                <button
                  onClick={() => {
                    onOpenTeam();
                    setMoreMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-medium flex items-center gap-2.5 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04] cursor-pointer"
                >
                  <Users className="w-4 h-4 text-cyan-500" />
                  <span>Team: Gabriel, Luca, Federico</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
