import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AudioLines, Mic, MicOff, PhoneOff, Volume2, X, Loader2, Headphones, Volume1, Hand } from 'lucide-react';

export interface LiveTranscriptTurn {
  role: 'user' | 'assistant';
  text: string;
}

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: (turns?: LiveTranscriptTurn[]) => void;
  language: 'it' | 'en';
  userName?: string;
}

type VoiceOption = 'Kore' | 'Zephyr' | 'Puck' | 'Fenrir';
type LiveStatus = 'connecting' | 'listening' | 'speaking' | 'error';

const VOICE_OPTIONS: Array<{ id: VoiceOption; label: string }> = [
  { id: 'Kore', label: 'Kore' },
  { id: 'Zephyr', label: 'Zephyr' },
  { id: 'Puck', label: 'Puck' },
  { id: 'Fenrir', label: 'Fenrir' },
];

function downsampleTo16k(input: Float32Array, sourceRate: number): Float32Array {
  if (sourceRate === 16000) return input;
  const ratio = sourceRate / 16000;
  const newLength = Math.round(input.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const pos = i * ratio;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    const s0 = input[idx] ?? 0;
    const s1 = input[Math.min(idx + 1, input.length - 1)] ?? s0;
    result[i] = s0 + (s1 - s0) * frac;
  }
  return result;
}

function float32ToPcm16Base64(float32: Float32Array): string {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const clamped = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  const chunkSize = 0x4000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(slice));
  }
  return btoa(binary);
}

function base64Pcm16ToFloat32(base64: string): Float32Array<ArrayBuffer> {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
  const float32 = new Float32Array(new ArrayBuffer(int16.length * 4));
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768;
  }
  return float32;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
  language,
  userName,
}) => {
  const [status, setStatus] = useState<LiveStatus>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [headphoneMode, setHeadphoneMode] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>('Kore');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userCaption, setUserCaption] = useState('');
  const [aiCaption, setAiCaption] = useState('');

  const statusRef = useRef<LiveStatus>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const isReadyRef = useRef(false);
  const isMutedRef = useRef(false);
  const headphoneModeRef = useRef(false);
  const isModelTurnActiveRef = useRef(false);
  const echoGuardUntilRef = useRef(0);
  const ignoreCurrentAiTurnRef = useRef(false);

  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const orbPulseRef = useRef<HTMLDivElement | null>(null);

  const turnsRef = useRef<LiveTranscriptTurn[]>([]);
  const currentUserTurnRef = useRef('');
  const currentAiTurnRef = useRef('');

  const updateStatus = useCallback((next: LiveStatus) => {
    if (statusRef.current !== next) {
      statusRef.current = next;
      setStatus(next);
    }
  }, []);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    headphoneModeRef.current = headphoneMode;
  }, [headphoneMode]);

  const stopAllPlayback = useCallback(() => {
    activeSourcesRef.current.forEach((src) => {
      src.onended = null;
      try {
        src.stop();
      } catch {
        // ignore
      }
    });
    activeSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    isModelTurnActiveRef.current = false;
  }, []);

  const cleanupSession = useCallback(() => {
    isReadyRef.current = false;
    echoGuardUntilRef.current = 0;
    ignoreCurrentAiTurnRef.current = false;
    stopAllPlayback();

    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      try {
        processorRef.current.disconnect();
      } catch {
        // ignore
      }
      processorRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (inputCtxRef.current) {
      inputCtxRef.current.close().catch(() => {});
      inputCtxRef.current = null;
    }

    if (outputCtxRef.current) {
      outputCtxRef.current.close().catch(() => {});
      outputCtxRef.current = null;
    }

    if (wsRef.current) {
      const ws = wsRef.current;
      wsRef.current = null;
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        try {
          ws.close();
        } catch {
          // ignore
        }
      }
    }
  }, [stopAllPlayback]);

  const flushOpenCaptionsToTurns = useCallback(() => {
    const u = currentUserTurnRef.current.trim();
    if (u) {
      turnsRef.current.push({ role: 'user', text: u });
      currentUserTurnRef.current = '';
    }
    const a = currentAiTurnRef.current.trim();
    if (a) {
      turnsRef.current.push({ role: 'assistant', text: a });
      currentAiTurnRef.current = '';
    }
  }, []);

  const handleManualInterrupt = useCallback(() => {
    if (isModelTurnActiveRef.current) {
      ignoreCurrentAiTurnRef.current = true;
    }
    stopAllPlayback();
    echoGuardUntilRef.current = 0;
    if (isReadyRef.current) {
      updateStatus('listening');
    }
  }, [stopAllPlayback, updateStatus]);

  const startSession = useCallback(
    async (voice: VoiceOption) => {
      cleanupSession();
      updateStatus('connecting');
      setErrorMessage(null);
      setUserCaption('');
      setAiCaption('');

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          },
        });
        streamRef.current = stream;

        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

        const inputCtx = new AudioCtx({ sampleRate: 16000 });
        const outputCtx = new AudioCtx({ sampleRate: 24000 });
        inputCtxRef.current = inputCtx;
        outputCtxRef.current = outputCtx;

        await Promise.all([
          inputCtx.state === 'suspended' ? inputCtx.resume() : Promise.resolve(),
          outputCtx.state === 'suspended' ? outputCtx.resume() : Promise.resolve(),
        ]);

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const params = new URLSearchParams({
          lang: language,
          voice,
          ...(userName ? { name: userName } : {}),
        });
        const ws = new WebSocket(`${protocol}//${window.location.host}/live?${params.toString()}`);
        wsRef.current = ws;

        const bufferSize = inputCtx.sampleRate >= 32000 ? 4096 : 2048;
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(bufferSize, 1, 1);
        const silentGain = inputCtx.createGain();
        silentGain.gain.value = 0;

        processorRef.current = processor;
        source.connect(processor);
        processor.connect(silentGain);
        silentGain.connect(inputCtx.destination);

        processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);

          const isAiPlayingAudio =
            isModelTurnActiveRef.current ||
            activeSourcesRef.current.size > 0 ||
            performance.now() < echoGuardUntilRef.current;

          const suppressForEcho = !headphoneModeRef.current && isAiPlayingAudio;

          // Lightweight orb scale feedback via direct DOM transform
          if (orbPulseRef.current) {
            if (isMutedRef.current || suppressForEcho) {
              orbPulseRef.current.style.transform = 'scale(1)';
            } else {
              let sum = 0;
              for (let i = 0; i < inputData.length; i += 8) {
                sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / (inputData.length / 8));
              const scale = 1 + Math.min(0.28, rms * 1.9);
              orbPulseRef.current.style.transform = `scale(${scale.toFixed(3)})`;
            }
          }

          if (
            !isReadyRef.current ||
            isMutedRef.current ||
            suppressForEcho ||
            !wsRef.current ||
            wsRef.current.readyState !== WebSocket.OPEN
          ) {
            return;
          }

          const resampled = downsampleTo16k(inputData, inputCtx.sampleRate);
          const base64Audio = float32ToPcm16Base64(resampled);
          wsRef.current.send(JSON.stringify({ type: 'audio', data: base64Audio }));
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);

            if (msg.type === 'ready') {
              isReadyRef.current = true;
              updateStatus('listening');
              return;
            }

            if (msg.type === 'audio' && msg.data && outputCtxRef.current) {
              if (ignoreCurrentAiTurnRef.current) return;
              const ctx = outputCtxRef.current;
              const float32 = base64Pcm16ToFloat32(msg.data);
              if (float32.length === 0) return;

              isModelTurnActiveRef.current = true;

              const buffer = ctx.createBuffer(1, float32.length, 24000);
              buffer.copyToChannel(float32, 0);

              const srcNode = ctx.createBufferSource();
              srcNode.buffer = buffer;
              srcNode.connect(ctx.destination);

              // Smooth 120ms jitter buffer on fresh burst prevents network stutter/cutoff
              const minStart = ctx.currentTime + 0.04;
              if (nextStartTimeRef.current <= ctx.currentTime + 0.01) {
                nextStartTimeRef.current = ctx.currentTime + 0.12;
              }
              const startAt = Math.max(minStart, nextStartTimeRef.current);
              srcNode.start(startAt);
              nextStartTimeRef.current = startAt + buffer.duration;

              activeSourcesRef.current.add(srcNode);
              updateStatus('speaking');

              srcNode.onended = () => {
                activeSourcesRef.current.delete(srcNode);
                if (activeSourcesRef.current.size === 0 && !isModelTurnActiveRef.current) {
                  echoGuardUntilRef.current = performance.now() + 450;
                  if (isReadyRef.current) {
                    updateStatus('listening');
                  }
                }
              };
              return;
            }

            if (msg.type === 'inputTranscript' && msg.text) {
              ignoreCurrentAiTurnRef.current = false;
              if (currentAiTurnRef.current.trim()) {
                turnsRef.current.push({ role: 'assistant', text: currentAiTurnRef.current.trim() });
                currentAiTurnRef.current = '';
                setAiCaption('');
              }
              currentUserTurnRef.current += msg.text;
              setUserCaption(currentUserTurnRef.current.trim());
              return;
            }

            if (msg.type === 'outputTranscript' && msg.text) {
              if (ignoreCurrentAiTurnRef.current) return;
              if (currentUserTurnRef.current.trim()) {
                turnsRef.current.push({ role: 'user', text: currentUserTurnRef.current.trim() });
                currentUserTurnRef.current = '';
              }
              currentAiTurnRef.current += msg.text;
              setAiCaption(currentAiTurnRef.current.trim());
              return;
            }

            if (msg.type === 'interrupted') {
              ignoreCurrentAiTurnRef.current = false;
              stopAllPlayback();
              echoGuardUntilRef.current = 0;
              if (isReadyRef.current) {
                updateStatus('listening');
              }
              return;
            }

            if (msg.type === 'turnComplete') {
              ignoreCurrentAiTurnRef.current = false;
              isModelTurnActiveRef.current = false;
              flushOpenCaptionsToTurns();
              if (activeSourcesRef.current.size === 0) {
                echoGuardUntilRef.current = performance.now() + 450;
                if (isReadyRef.current) {
                  updateStatus('listening');
                }
              }
              return;
            }

            if (msg.type === 'error') {
              updateStatus('error');
              setErrorMessage(
                msg.message ||
                  (language === 'en'
                    ? 'Unable to connect live voice session.'
                    : 'Impossibile avviare la conversazione vocale in tempo reale.')
              );
              return;
            }

            if (msg.type === 'closed') {
              isReadyRef.current = false;
              isModelTurnActiveRef.current = false;
            }
          } catch {
            // ignore malformed message
          }
        };

        ws.onerror = () => {
          updateStatus('error');
          setErrorMessage(
            language === 'en'
              ? 'Connection error with Fuglor Live.'
              : 'Errore di connessione con Fuglor Live.'
          );
        };
      } catch {
        updateStatus('error');
        setErrorMessage(
          language === 'en'
            ? 'Microphone permission denied. Enable microphone access in your browser.'
            : 'Permesso microfono negato. Abilita il microfono nelle impostazioni del browser.'
        );
      }
    },
    [cleanupSession, flushOpenCaptionsToTurns, language, stopAllPlayback, updateStatus, userName]
  );

  useEffect(() => {
    if (!isOpen) {
      cleanupSession();
      turnsRef.current = [];
      currentUserTurnRef.current = '';
      currentAiTurnRef.current = '';
      return;
    }

    turnsRef.current = [];
    currentUserTurnRef.current = '';
    currentAiTurnRef.current = '';
    setIsMuted(false);
    startSession(selectedVoice);

    return () => {
      cleanupSession();
    };
  }, [isOpen, selectedVoice, startSession, cleanupSession]);

  const handleEndCall = () => {
    flushOpenCaptionsToTurns();
    const collected = [...turnsRef.current];
    cleanupSession();
    onClose(collected);
  };

  if (!isOpen) return null;

  const isEn = language === 'en';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs animate-backdrop-fade">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#111319] border border-[#E5E7EB] dark:border-white/[0.1] shadow-2xl overflow-hidden animate-fade-in-scale">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#F0F1F3] dark:border-white/[0.06] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 dark:bg-cyan-400/15 flex items-center justify-center text-sky-600 dark:text-cyan-400 shrink-0">
              <AudioLines className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[#111318] dark:text-white leading-tight">
                Fuglor Live
              </h2>
              <p className="text-[11px] text-[#626773] dark:text-zinc-400 truncate">
                {isEn ? 'Real-time voice conversation' : 'Conversazione vocale dal vivo'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setHeadphoneMode((prev) => !prev)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                headphoneMode
                  ? 'bg-sky-500/15 border-sky-400/50 text-sky-700 dark:text-cyan-300'
                  : 'bg-[#F4F5F7] dark:bg-white/[0.06] border-[#E5E7EB] dark:border-white/[0.1] text-[#626773] dark:text-zinc-300'
              }`}
              title={
                headphoneMode
                  ? isEn
                    ? 'Headphone mode: mic stays open for voice interruption'
                    : 'Modalità Cuffie: puoi interrompere a voce in qualsiasi momento'
                  : isEn
                    ? 'Speaker mode: echo protection active while Fuglor speaks'
                    : 'Modalità Altoparlanti: protezione eco attiva mentre Fuglor parla'
              }
            >
              {headphoneMode ? <Headphones className="w-3.5 h-3.5" /> : <Volume1 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{headphoneMode ? (isEn ? 'Headphones' : 'Cuffie') : (isEn ? 'Speaker' : 'Altoparlanti')}</span>
            </button>

            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value as VoiceOption)}
              className="text-xs font-medium px-2 py-1 rounded-lg bg-[#F4F5F7] dark:bg-white/[0.06] border border-[#E5E7EB] dark:border-white/[0.1] text-[#111318] dark:text-zinc-200 outline-none cursor-pointer"
              aria-label={isEn ? 'Select voice' : 'Seleziona voce'}
            >
              {VOICE_OPTIONS.map((v) => (
                <option key={v.id} value={v.id} className="bg-white dark:bg-[#14161D]">
                  {v.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleEndCall}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              aria-label={isEn ? 'Close' : 'Chiudi'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Voice Orb & Live Captions */}
        <div className="px-6 py-8 flex flex-col items-center text-center space-y-5">
          <div className="relative flex items-center justify-center w-36 h-36">
            <div
              ref={orbPulseRef}
              className={`absolute inset-2 rounded-full transition-transform duration-100 ${
                status === 'speaking'
                  ? 'bg-sky-500/20 dark:bg-cyan-400/20'
                  : status === 'listening' && !isMuted
                    ? 'bg-emerald-500/15 dark:bg-emerald-400/15'
                    : 'bg-zinc-500/10'
              }`}
            />
            <div
              className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-lg border transition-colors ${
                status === 'error'
                  ? 'bg-rose-500/15 border-rose-400/50 text-rose-500'
                  : status === 'speaking'
                    ? 'bg-sky-600 dark:bg-cyan-500 border-sky-400 dark:border-cyan-300 text-white dark:text-slate-950'
                    : status === 'connecting'
                      ? 'bg-[#F4F5F7] dark:bg-white/[0.06] border-[#E5E7EB] dark:border-white/[0.1] text-sky-600 dark:text-cyan-400'
                      : isMuted
                        ? 'bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-500'
                        : 'bg-sky-500/15 dark:bg-cyan-500/15 border-sky-400/50 dark:border-cyan-400/40 text-sky-600 dark:text-cyan-300'
              }`}
            >
              {status === 'connecting' ? (
                <Loader2 className="w-9 h-9 animate-spin" />
              ) : status === 'speaking' ? (
                <Volume2 className="w-9 h-9" />
              ) : isMuted ? (
                <MicOff className="w-9 h-9" />
              ) : (
                <AudioLines className="w-9 h-9" />
              )}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#111318] dark:text-white">
              {status === 'connecting'
                ? isEn
                  ? 'Connecting to Fuglor Live...'
                  : 'Connessione a Fuglor Live...'
                : status === 'error'
                  ? isEn
                    ? 'Session interrupted'
                    : 'Sessione interrotta'
                  : status === 'speaking'
                    ? isEn
                      ? 'Fuglor is speaking...'
                      : 'Fuglor sta parlando...'
                    : isMuted
                      ? isEn
                        ? 'Microphone muted'
                        : 'Microfono disattivato'
                      : isEn
                        ? 'Listening — speak naturally'
                        : 'In ascolto — parla liberamente'}
            </p>
            <p className="text-xs text-[#626773] dark:text-zinc-400">
              {status === 'speaking' && !headphoneMode
                ? isEn
                  ? 'Echo guard active — tap Interrupt to speak now.'
                  : 'Protezione eco attiva — tocca Interrompi se vuoi parlare subito.'
                : status === 'listening' && !isMuted
                  ? isEn
                    ? 'Speak clearly; Fuglor will answer right away.'
                    : 'Parla normalmente, Fuglor ti risponde subito.'
                  : '\u00A0'}
            </p>
          </div>

          {/* Error or Live Subtitles */}
          {errorMessage ? (
            <div className="w-full rounded-2xl px-4 py-3 bg-rose-500/10 border border-rose-400/30 text-xs text-rose-600 dark:text-rose-300">
              {errorMessage}
            </div>
          ) : (
            <div className="w-full min-h-[76px] rounded-2xl px-4 py-3 bg-[#F8F9FA] dark:bg-white/[0.04] border border-[#E5E7EB] dark:border-white/[0.06] flex flex-col justify-center gap-1.5 text-left">
              {userCaption && (
                <p className="text-xs text-[#626773] dark:text-zinc-400 line-clamp-2">
                  <span className="font-semibold text-[#111318] dark:text-zinc-200">
                    {isEn ? 'You: ' : 'Tu: '}
                  </span>
                  {userCaption}
                </p>
              )}
              {aiCaption ? (
                <p className="text-xs text-[#111318] dark:text-zinc-100 line-clamp-3">
                  <span className="font-semibold text-sky-600 dark:text-cyan-400">Fuglor: </span>
                  {aiCaption}
                </p>
              ) : (
                !userCaption && (
                  <p className="text-xs text-center text-zinc-400 dark:text-zinc-500">
                    {isEn
                      ? 'Ask a homework question or start talking...'
                      : 'Fai una domanda sui compiti o inizia a parlare...'}
                  </p>
                )
              )}
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="px-6 py-4 bg-[#F8F9FA] dark:bg-white/[0.02] border-t border-[#F0F1F3] dark:border-white/[0.06] flex items-center justify-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsMuted((prev) => !prev)}
            disabled={status === 'connecting' || status === 'error'}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isMuted
                ? 'bg-amber-500/15 border-amber-400/50 text-amber-700 dark:text-amber-300'
                : 'bg-white dark:bg-[#191C24] border-[#E5E7EB] dark:border-white/[0.1] text-[#111318] dark:text-zinc-200 hover:bg-black/[0.03] dark:hover:bg-white/[0.06]'
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isMuted ? (isEn ? 'Unmute' : 'Riattiva mic') : isEn ? 'Mute' : 'Muto'}</span>
          </button>

          {status === 'speaking' && (
            <button
              type="button"
              onClick={handleManualInterrupt}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 text-xs font-semibold shadow-sm transition-colors active:scale-95 cursor-pointer"
            >
              <Hand className="w-4 h-4" />
              <span>{isEn ? 'Interrupt' : 'Interrompi'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleEndCall}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition-colors active:scale-95 cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
            <span>{isEn ? 'End' : 'Termina'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
