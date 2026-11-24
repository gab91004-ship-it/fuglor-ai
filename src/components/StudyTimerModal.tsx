import React from 'react';
import { X, Play, Pause, RotateCcw, Timer, Sparkles, Coffee, Flame } from 'lucide-react';

export type TimerMode = 'pomodoro' | 'short' | 'break';

interface StudyTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeLeft: number;
  isRunning: boolean;
  mode: TimerMode;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onSelectMode: (mode: TimerMode) => void;
}

export const StudyTimerModal: React.FC<StudyTimerModalProps> = ({
  isOpen,
  onClose,
  timeLeft,
  isRunning,
  mode,
  onToggleTimer,
  onResetTimer,
  onSelectMode,
}) => {
  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalDuration = mode === 'pomodoro' ? 25 * 60 : mode === 'short' ? 15 * 60 : 5 * 60;
  const progressPercent = Math.max(0, Math.min(100, ((totalDuration - timeLeft) / totalDuration) * 100));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-backdrop-fade"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#0F1422] border border-slate-200 dark:border-white/[0.1] rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 sm:space-y-6 max-h-[90dvh] overflow-y-auto animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-md shadow-orange-500/25">
              <Timer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Timer Studio Pomodoro</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-800/50">
                  FOCUS
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Massimizza la concentrazione e impara meglio a blocchi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/[0.06]">
          <button
            onClick={() => onSelectMode('pomodoro')}
            className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'pomodoro'
                ? 'bg-white dark:bg-[#1A2234] text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>25m Studio</span>
          </button>

          <button
            onClick={() => onSelectMode('short')}
            className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'short'
                ? 'bg-white dark:bg-[#1A2234] text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>15m Ripasso</span>
          </button>

          <button
            onClick={() => onSelectMode('break')}
            className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'break'
                ? 'bg-white dark:bg-[#1A2234] text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>5m Pausa</span>
          </button>
        </div>

        {/* Countdown Center Display */}
        <div className="relative py-6 flex flex-col items-center justify-center rounded-3xl bg-gradient-to-b from-slate-50 to-white dark:from-[#131929] dark:to-[#0C101B] border border-slate-200/80 dark:border-white/[0.08] shadow-inner">
          <div className="text-5xl sm:text-6xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white select-none">
            {formattedTime}
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
            <span>{isRunning ? 'Sessione attiva' : 'In pausa'}</span>
          </div>

          {/* Progress Bar */}
          <div className="w-3/4 h-2 mt-5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Timer Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleTimer}
            className={`flex-1 py-3 rounded-2xl text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/25'
                : 'bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 shadow-orange-500/25'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Metti in Pausa</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Avvia Timer</span>
              </>
            )}
          </button>

          <button
            onClick={onResetTimer}
            className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
            title="Azzera timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Motivation Tip */}
        <div className="p-3 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-800/40 text-[11px] text-orange-900 dark:text-orange-200/90 leading-relaxed text-center">
          💡 <strong>Consiglio di studio:</strong> 25 minuti di concentrazione pura senza telefono equivalgono a un'ora di studio distratto!
        </div>
      </div>
    </div>
  );
};
