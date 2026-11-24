import React, { useState, useEffect } from 'react';
import { X, Volume2, Check, Sparkles, Sliders, Play, Loader2, Radio } from 'lucide-react';
import {
  VoicePreference,
  AI_VOICES,
  getItalianVoices,
  saveVoicePreference,
  speechController,
} from '../utils/speechVoiceManager';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preference: VoicePreference;
  onSavePreference: (newPref: VoicePreference) => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  preference,
  onSavePreference,
}) => {
  const [pref, setPref] = useState<VoicePreference>(preference);
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [testState, setTestState] = useState<'idle' | 'loading' | 'playing'>('idle');

  useEffect(() => {
    setPref(preference);
  }, [preference]);

  useEffect(() => {
    if (!isOpen) return;

    const loadVoices = () => {
      const v = getItalianVoices();
      setSystemVoices(v);
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestVoice = () => {
    if (testState !== 'idle') {
      speechController.stop();
      setTestState('idle');
      return;
    }

    const testPhrase =
      pref.engine === 'neural_ai'
        ? 'Ciao! Sono la voce neurale di Fuglor. Ora parlo in modo naturale ed espressivo come ChatGPT, perfetto per studiare insieme!'
        : 'Ciao! Questa è la voce di sistema del tuo browser per leggere le spiegazioni.';

    speechController.play(
      testPhrase,
      pref,
      (status) => setTestState(status),
      () => setTestState('idle'),
      () => setTestState('idle')
    );
  };

  const handleSaveAndClose = (updated: VoicePreference) => {
    setPref(updated);
    saveVoicePreference(updated);
    onSavePreference(updated);
  };

  const handleCloseModal = () => {
    speechController.stop();
    setTestState('idle');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-xs animate-backdrop-fade"
      onClick={handleCloseModal}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#0F1422] border border-slate-200 dark:border-white/[0.1] rounded-3xl shadow-2xl max-h-[90dvh] flex flex-col overflow-hidden animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Header */}
        <div className="flex items-start justify-between gap-3 px-5 sm:px-6 pt-5 pb-3.5 border-b border-slate-100 dark:border-white/[0.08] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 flex-wrap">
                <span>Voce Neurale Fuglor</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-500" />
                  STILE CHATGPT
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ascolto con intonazione umana, calda e naturale
              </p>
            </div>
          </div>

          <button
            onClick={handleCloseModal}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer shrink-0"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">
          {/* Engine toggle */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Motore di Sintesi Vocale
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const updated: VoicePreference = { ...pref, engine: 'neural_ai' };
                  handleSaveAndClose(updated);
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  pref.engine === 'neural_ai'
                    ? 'bg-gradient-to-br from-cyan-50 to-indigo-50/50 dark:from-cyan-950/40 dark:to-indigo-950/30 border-cyan-400 dark:border-cyan-500/70 shadow-xs ring-1 ring-cyan-400/30'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-white/[0.08] hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                    Voce Neurale AI
                  </span>
                  {pref.engine === 'neural_ai' && <Check className="w-4 h-4 text-cyan-600 dark:text-cyan-400 stroke-[2.5]" />}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Umana & fluida come ChatGPT (Consigliata)
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const updated: VoicePreference = { ...pref, engine: 'browser_native' };
                  handleSaveAndClose(updated);
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  pref.engine === 'browser_native'
                    ? 'bg-slate-100 dark:bg-slate-800 border-indigo-400 dark:border-indigo-500/70 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-white/[0.08] hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-slate-400" />
                    Voce Dispositivo
                  </span>
                  {pref.engine === 'browser_native' && <Check className="w-4 h-4 text-indigo-600 dark:text-cyan-400 stroke-[2.5]" />}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Voci locali integrate nel browser
                </span>
              </button>
            </div>

            {speechController.getIsQuotaReached() && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
                <span>
                  Quota gratuita giornaliera per la voce AI raggiunta. Fuglor utilizza automaticamente la voce HD del tuo dispositivo per continuare a leggere senza interruzioni!
                </span>
              </div>
            )}
          </div>

          {/* AI Voice Selection (when neural_ai is active) */}
          {pref.engine === 'neural_ai' ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                <span>Scegli la Tonalità AI</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AI_VOICES.map((v) => {
                  const isSelected = pref.aiVoice === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        const updated: VoicePreference = { ...pref, aiVoice: v.id };
                        handleSaveAndClose(updated);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                        isSelected
                          ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-400 dark:border-cyan-500/70 shadow-xs ring-1 ring-cyan-400/30'
                          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-white/[0.08] hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {v.name}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-white/[0.1] text-slate-700 dark:text-slate-300">
                          {v.tag}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {v.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Voce Locale del Browser
                </label>
                <select
                  value={pref.voiceURI || ''}
                  onChange={(e) => {
                    const updated: VoicePreference = { ...pref, voiceURI: e.target.value || undefined };
                    handleSaveAndClose(updated);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/[0.1] text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-cyan-500 cursor-pointer"
                >
                  <option value="">🌟 Selezione Automatica Migliore</option>
                  {systemVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Speed Slider */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/[0.06]">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                <span>Velocità di Lettura</span>
              </span>
              <span className="font-mono text-indigo-600 dark:text-cyan-400 font-bold">
                {pref.speed}x
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400">Calma (0.8x)</span>
              <input
                type="range"
                min="0.8"
                max="1.2"
                step="0.05"
                value={pref.speed}
                onChange={(e) => {
                  const updated: VoicePreference = { ...pref, speed: parseFloat(e.target.value) };
                  handleSaveAndClose(updated);
                }}
                className="flex-1 accent-indigo-600 dark:accent-cyan-400 cursor-pointer"
              />
              <span className="text-[11px] text-slate-400">Veloce (1.2x)</span>
            </div>
          </div>

          {/* Test voice button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleTestVoice}
              disabled={testState === 'loading'}
              className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                testState === 'playing'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/25'
                  : testState === 'loading'
                  ? 'bg-indigo-700 text-white opacity-80 cursor-wait'
                  : 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white hover:scale-[1.01] active:scale-[0.99] shadow-indigo-500/25'
              }`}
            >
              {testState === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generazione Voce Neurale AI in corso...</span>
                </>
              ) : testState === 'playing' ? (
                <>
                  <X className="w-4 h-4" />
                  <span>Interrompi Prova Vocale</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Ascolta Prova Vocale AI 🎙️</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
