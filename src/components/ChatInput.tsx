import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowUp, Square, Globe, Camera, X, Timer, Brain, Award, Mic, MicOff, Loader2, AudioLines } from 'lucide-react';
import { FuglorModel } from '../types';
import { Translations } from '../constants/translations';

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  onSend: (textOverride?: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  activeModel: FuglorModel;
  useSearch: boolean;
  onToggleSearch: () => void;
  images?: Array<{ data: string; mimeType: string }>;
  onAddImage?: (img: { data: string; mimeType: string }) => void;
  onRemoveImage?: (index: number) => void;
  onOpenTimer?: () => void;
  onOpenLiveVoice?: () => void;
  onTriggerStudyMode?: (mode: 'quiz' | 'map') => void;
  language?: 'it' | 'en';
  variant?: 'centered' | 'bottom';
  t: Translations['input'];
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const SILENCE_AUTO_SEND_MS = 4000;

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSend,
  onStop,
  isStreaming,
  activeModel,
  useSearch,
  onToggleSearch,
  images = [],
  onAddImage,
  onRemoveImage,
  onOpenTimer,
  onOpenLiveVoice,
  onTriggerStudyMode,
  language = 'it',
  variant = 'bottom',
  t,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice dictation state
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [silenceCountdown, setSilenceCountdown] = useState<number | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const isListeningRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const baseInputRef = useRef('');
  const committedTranscriptRef = useRef('');
  const latestFullTextRef = useRef('');
  const hasSpokenRef = useRef(false);

  // Fallback MediaRecorder refs (when Web Speech API is unavailable)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafMonitorRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const shouldAutoSendOnStopRef = useRef(false);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [input]);

  const clearSilenceTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setSilenceCountdown(null);
  }, []);

  const stopListeningCleanup = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    clearSilenceTimers();

    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.stop();
      } catch {
        // ignore
      }
    }

    if (rafMonitorRef.current !== null) {
      cancelAnimationFrame(rafMonitorRef.current);
      rafMonitorRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      shouldAutoSendOnStopRef.current = false;
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    mediaRecorderRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((tr) => tr.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, [clearSilenceTimers]);

  useEffect(() => {
    return () => {
      stopListeningCleanup();
    };
  }, [stopListeningCleanup]);

  const triggerAutoSendFromSpeech = useCallback(() => {
    const textToSubmit = latestFullTextRef.current.trim();
    stopListeningCleanup();
    if (textToSubmit && !isStreaming) {
      onSend(textToSubmit);
    }
  }, [isStreaming, onSend, stopListeningCleanup]);

  const resetSilenceTimer = useCallback(
    (onTimeout: () => void) => {
      clearSilenceTimers();
      setSilenceCountdown(4);

      const startedAt = Date.now();
      countdownIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(1, Math.ceil((SILENCE_AUTO_SEND_MS - elapsed) / 1000));
        setSilenceCountdown(remaining);
      }, 250);

      silenceTimerRef.current = setTimeout(() => {
        clearSilenceTimers();
        onTimeout();
      }, SILENCE_AUTO_SEND_MS);
    },
    [clearSilenceTimers]
  );

  const startFallbackRecorder = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioChunks: Blob[] = [];
      audioChunksRef.current = audioChunks;
      shouldAutoSendOnStopRef.current = false;
      hasSpokenRef.current = false;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const shouldSend = shouldAutoSendOnStopRef.current;
        const blobs = [...audioChunksRef.current];
        audioChunksRef.current = [];
        stream.getTracks().forEach((tr) => tr.stop());
        mediaStreamRef.current = null;

        if (!shouldSend || blobs.length === 0) return;

        setIsTranscribing(true);
        try {
          const fullBlob = new Blob(blobs, { type: mimeType });
          const base64Audio = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(String(reader.result || ''));
            reader.onerror = reject;
            reader.readAsDataURL(fullBlob);
          });

          const resp = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64: base64Audio, mimeType, language }),
          });
          const data = await resp.json();
          const spoken = (data?.text || '').trim();
          if (spoken) {
            const combined = baseInputRef.current
              ? `${baseInputRef.current.trim()} ${spoken}`
              : spoken;
            setInput(combined);
            onSend(combined);
          } else {
            setMicError('Non ho sentito nessuna parola. Riprova parlando vicino al microfono.');
          }
        } catch {
          setMicError('Errore durante la trascrizione audio.');
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start(250);
      isListeningRef.current = true;
      setIsListening(true);
      setMicError(null);

      // Monitor microphone volume to detect >4s silence after speech
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        src.connect(analyser);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let silenceStart = 0;

        const checkAudioLevel = () => {
          if (!isListeningRef.current) return;
          analyser.getByteTimeDomainData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const v = (dataArray[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / dataArray.length);

          if (rms > 0.025) {
            hasSpokenRef.current = true;
            silenceStart = 0;
            setSilenceCountdown(null);
          } else if (hasSpokenRef.current) {
            if (!silenceStart) silenceStart = Date.now();
            const elapsed = Date.now() - silenceStart;
            const remaining = Math.max(1, Math.ceil((SILENCE_AUTO_SEND_MS - elapsed) / 1000));
            setSilenceCountdown(remaining);
            if (elapsed >= SILENCE_AUTO_SEND_MS) {
              shouldAutoSendOnStopRef.current = true;
              const rec = mediaRecorderRef.current;
              isListeningRef.current = false;
              setIsListening(false);
              setSilenceCountdown(null);
              if (rec && rec.state !== 'inactive') {
                rec.stop();
              }
              if (audioCtxRef.current) {
                audioCtxRef.current.close().catch(() => {});
                audioCtxRef.current = null;
              }
              return;
            }
          }

          rafMonitorRef.current = requestAnimationFrame(checkAudioLevel);
        };
        rafMonitorRef.current = requestAnimationFrame(checkAudioLevel);
      }
    } catch {
      stopListeningCleanup();
      setMicError('Permesso microfono negato. Abilita il microfono nelle impostazioni del browser.');
    }
  }, [language, onSend, setInput, stopListeningCleanup]);

  const startSpeechRecognition = useCallback(() => {
    const win = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    baseInputRef.current = input.trim();
    committedTranscriptRef.current = '';
    latestFullTextRef.current = input.trim();
    hasSpokenRef.current = false;
    setMicError(null);

    if (!SpeechRec) {
      startFallbackRecorder();
      return;
    }

    const launchRecognizer = () => {
      if (!isListeningRef.current) return;
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'en' ? 'en-US' : 'it-IT';
      recognitionRef.current = recognition;

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let finalSeg = '';
        let interimSeg = '';
        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          const text = res[0]?.transcript || '';
          if (res.isFinal) {
            finalSeg += text;
          } else {
            interimSeg += text;
          }
        }

        const spokenNow = `${committedTranscriptRef.current} ${finalSeg} ${interimSeg}`
          .replace(/\s+/g, ' ')
          .trim();

        const combined = baseInputRef.current
          ? `${baseInputRef.current} ${spokenNow}`.trim()
          : spokenNow;

        if (spokenNow.length > 0) {
          hasSpokenRef.current = true;
          latestFullTextRef.current = combined;
          setInput(combined);
          resetSilenceTimer(triggerAutoSendFromSpeech);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          stopListeningCleanup();
          setMicError('Permesso microfono negato. Abilita il microfono nel browser.');
        } else if (event.error === 'no-speech' && isListeningRef.current) {
          // Keep listening patiently until user speaks or stops
        } else if (event.error !== 'aborted') {
          stopListeningCleanup();
          setMicError('Riconoscimento vocale interrotto. Riprova.');
        }
      };

      recognition.onend = () => {
        // Persist finalized text across Chrome auto-restarts if user pauses briefly <4s
        if (latestFullTextRef.current && baseInputRef.current !== latestFullTextRef.current) {
          const prefixLen = baseInputRef.current.length;
          committedTranscriptRef.current = latestFullTextRef.current
            .slice(prefixLen)
            .trim();
        }
        if (isListeningRef.current) {
          try {
            launchRecognizer();
          } catch {
            // If browser refuses immediate restart, let active 4s silence timer finish sending
          }
        }
      };

      try {
        recognition.start();
      } catch {
        stopListeningCleanup();
        startFallbackRecorder();
      }
    };

    isListeningRef.current = true;
    setIsListening(true);
    launchRecognizer();
  }, [input, language, resetSilenceTimer, setInput, startFallbackRecorder, stopListeningCleanup, triggerAutoSendFromSpeech]);

  const handleToggleMic = () => {
    if (isStreaming || isTranscribing) return;
    if (isListening) {
      stopListeningCleanup();
    } else {
      startSpeechRecognition();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isListening) {
        stopListeningCleanup();
      }
      if (!isStreaming && (input.trim() || images.length > 0)) {
        onSend();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !onAddImage) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          onAddImage({
            data: result,
            mimeType: file.type || 'image/jpeg',
          });
        }
      };
      reader.readAsDataURL(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items || !onAddImage) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            if (result) {
              onAddImage({
                data: result,
                mimeType: file.type || 'image/png',
              });
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const canSend = Boolean(input.trim() || images.length > 0);
  const isCentered = variant === 'centered';

  const pillComposer = (
    <div
      className={`relative rounded-[26px] px-3 py-2 sm:px-3.5 sm:py-2 bg-white dark:bg-[#1E2028] border transition-all shadow-lg shadow-black/[0.04] dark:shadow-black/35 ${
        isListening
          ? 'border-rose-400 dark:border-rose-500/70 ring-2 ring-rose-500/15'
          : 'border-[#DFDFE6] dark:border-white/[0.09] focus-within:border-sky-500/70 dark:focus-within:border-cyan-400/60 focus-within:ring-2 focus-within:ring-sky-500/15 dark:focus-within:ring-cyan-400/15'
      }`}
    >
      {/* Voice Listening / Auto-Send Status Bar */}
      {(isListening || isTranscribing || micError) && (
        <div className="mb-2 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between gap-2 text-xs animate-fade-in-up">
          {micError ? (
            <span className="text-rose-600 dark:text-rose-400 font-medium">{micError}</span>
          ) : isTranscribing ? (
            <span className="flex items-center gap-2 text-sky-700 dark:text-cyan-300 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Trascrizione in corso...</span>
            </span>
          ) : (
            <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <span>
                {silenceCountdown !== null
                  ? `Invio automatico tra ${silenceCountdown}s (continua a parlare per annullare)`
                  : 'In ascolto... parla ora'}
              </span>
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              stopListeningCleanup();
              setMicError(null);
            }}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-2 py-0.5 rounded-md hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
          >
            {micError ? 'Chiudi' : 'Stop'}
          </button>
        </div>
      )}

      {/* Attached Images Preview Row */}
      {images.length > 0 && (
        <div className="mb-2 pb-2 border-b border-[#F0F1F3] dark:border-white/[0.08] flex items-center gap-2.5 flex-wrap">
          {images.map((img, idx) => (
            <div key={idx} className="relative group rounded-xl overflow-hidden border border-[#E5E7EB] dark:border-white/10 animate-pop-in">
              <img src={img.data} alt="Foto compito" className="w-12 h-12 object-cover" />
              {onRemoveImage && (
                <button
                  type="button"
                  onClick={() => onRemoveImage(idx)}
                  className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/75 hover:bg-black text-white transition-colors cursor-pointer"
                  title="Rimuovi immagine"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          <span className="text-xs text-[#626773] dark:text-zinc-400 font-medium">
            {images.length === 1 ? 'Foto allegata' : `${images.length} foto allegate`}
          </span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Gemini-style Pill Composer Row */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2">
        {/* Left Camera Icon (inline on sm+, bottom-left on <sm) */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full text-slate-600 hover:text-slate-950 dark:text-zinc-300 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors active:scale-95 cursor-pointer shrink-0"
          title="Allega o scatta foto del compito per l'analisi"
          aria-label="Allega foto del compito"
        >
          <Camera className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => {
            if (isListening) {
              clearSilenceTimers();
              latestFullTextRef.current = e.target.value;
            }
            setInput(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={
            isListening
              ? 'Parla al microfono... invio automatico dopo 4 secondi di silenzio'
              : images.length > 0
                ? 'Scrivi una domanda sulla foto o invia...'
                : language === 'en'
                  ? 'Ask Fuglor...'
                  : 'Chiedi a Fuglor...'
          }
          className="w-full sm:flex-1 min-w-0 bg-transparent px-2 py-1.5 text-base sm:text-sm text-[#111318] dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-400 resize-none outline-none font-sans leading-relaxed max-h-36"
        />

        {/* Actions Row */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-1 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#F0F1F3] dark:border-white/[0.06]">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="sm:hidden flex items-center justify-center w-9 h-9 rounded-full text-slate-600 dark:text-zinc-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors active:scale-95 cursor-pointer"
            title="Allega o scatta foto del compito per l'analisi"
            aria-label="Allega foto del compito"
          >
            <Camera className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleSearch}
              className={`flex items-center gap-1 px-2.5 py-1.5 min-h-[34px] rounded-full text-xs font-medium transition-colors active:scale-95 cursor-pointer whitespace-nowrap ${
                useSearch
                  ? 'bg-sky-500/15 text-sky-700 dark:bg-cyan-500/20 dark:text-cyan-300'
                  : 'text-[#626773] hover:text-[#111318] dark:text-zinc-300 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08]'
              }`}
              title={useSearch ? t.webGroundingOn : t.webGroundingOff}
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span className="text-xs sm:text-[11px]">{useSearch ? 'Web On' : 'Web'}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleMic}
              disabled={isStreaming || isTranscribing}
              className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isListening
                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                  : 'text-[#454A54] dark:text-zinc-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]'
              }`}
              title={
                isListening
                  ? 'Ferma dettatura vocale'
                  : 'Dettatura vocale: trascrive e invia dopo 4 secondi di silenzio'
              }
              aria-label={isListening ? 'Ferma microfono' : 'Attiva microfono'}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 text-rose-500 shrink-0" />
              ) : (
                <Mic className="w-4 h-4 shrink-0" />
              )}
            </button>

            {onOpenLiveVoice && (
              <button
                type="button"
                onClick={() => {
                  if (isListening) stopListeningCleanup();
                  onOpenLiveVoice();
                }}
                disabled={isStreaming}
                className="flex items-center justify-center w-9 h-9 rounded-full text-sky-600 dark:text-cyan-400 hover:bg-sky-500/10 dark:hover:bg-cyan-400/15 transition-colors active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title={
                  language === 'en'
                    ? 'Talk in real time with Fuglor'
                    : 'Parla in tempo reale con Fuglor'
                }
                aria-label={
                  language === 'en'
                    ? 'Talk in real time with Fuglor'
                    : 'Parla in tempo reale con Fuglor'
                }
              >
                <AudioLines className="w-4 h-4 shrink-0" />
              </button>
            )}

            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
                title={t.stop}
                aria-label={t.stop}
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              canSend && (
                <button
                  type="button"
                  onClick={() => {
                    if (isListening) stopListeningCleanup();
                    onSend();
                  }}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-sky-600 hover:bg-sky-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 shadow-xs transition-all active:scale-95 cursor-pointer animate-pop-in"
                  title="Invia messaggio"
                  aria-label="Invia messaggio"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.25]" />
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isCentered) {
    return <div className="w-full max-w-2xl mx-auto">{pillComposer}</div>;
  }

  return (
    <div className="px-3 pt-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4 lg:p-5 bg-gradient-to-t from-[#FAFAFB] via-[#FAFAFB]/95 to-transparent dark:from-[#0E1015] dark:via-[#0E1015]/95 dark:to-transparent shrink-0">
      <div className="max-w-3xl mx-auto w-full space-y-2">
        {/* Clean Quick Study Bar */}
        <div className="flex items-center justify-between gap-2 px-0.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5">
            {onTriggerStudyMode && (
              <>
                <button
                  type="button"
                  onClick={() => onTriggerStudyMode('quiz')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 sm:py-1 rounded-lg bg-white dark:bg-[#14161D] hover:border-sky-300 dark:hover:border-cyan-500/35 border border-[#E5E7EB] dark:border-white/[0.08] text-xs sm:text-[11px] font-medium text-[#454A54] dark:text-zinc-300 hover:text-sky-700 dark:hover:text-cyan-300 transition-colors active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                  title="Avvia simulazione di interrogazione con voto e feedback"
                >
                  <Award className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-sky-600 dark:text-cyan-400" />
                  <span>Simula interrogazione</span>
                </button>

                <button
                  type="button"
                  onClick={() => onTriggerStudyMode('map')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 sm:py-1 rounded-lg bg-white dark:bg-[#14161D] hover:border-sky-300 dark:hover:border-cyan-500/35 border border-[#E5E7EB] dark:border-white/[0.08] text-xs sm:text-[11px] font-medium text-[#454A54] dark:text-zinc-300 hover:text-sky-700 dark:hover:text-cyan-300 transition-colors active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                  title="Crea una mappa concettuale con nodi logici da copiare"
                >
                  <Brain className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-sky-600 dark:text-cyan-400" />
                  <span>Mappa concettuale</span>
                </button>
              </>
            )}

            {onOpenTimer && (
              <button
                type="button"
                onClick={onOpenTimer}
                className="flex items-center gap-1.5 px-2.5 py-1.5 sm:py-1 rounded-lg bg-white dark:bg-[#14161D] hover:border-sky-300 dark:hover:border-cyan-500/35 border border-[#E5E7EB] dark:border-white/[0.08] text-xs sm:text-[11px] font-medium text-[#454A54] dark:text-zinc-300 hover:text-sky-700 dark:hover:text-cyan-300 transition-colors active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                title="Apri il Timer Pomodoro da 25m per lo studio"
              >
                <Timer className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-[#626773] dark:text-zinc-400" />
                <span>Timer studio</span>
              </button>
            )}
          </div>
        </div>

        {pillComposer}

        {/* Quiet Footer Hint */}
        <div className="hidden sm:block text-center text-[11px] text-[#717684] dark:text-zinc-500">
          Fuglor AI usa il metodo socratico per aiutarti a ragionare passo dopo passo.
        </div>
      </div>
    </div>
  );
};
