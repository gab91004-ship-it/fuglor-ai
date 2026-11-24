import React, { useEffect, useRef, useState } from 'react';
import {
  User,
  Users,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ArrowRight,
  Globe,
  AlertCircle,
  RefreshCw,
  GraduationCap,
  Volume2,
  VolumeX,
  Printer,
  Brain,
  Award,
  SlidersHorizontal,
  Loader2,
  PenLine,
  Sparkles,
  Timer,
} from 'lucide-react';
import { ChatMessage, FuglorModel } from '../types';
import { STARTER_PROMPTS } from '../constants/models';
import { MarkdownRenderer } from '../utils/markdown';
import { Translations } from '../constants/translations';
import { exportStudyNoteAsPrintable } from '../utils/exportNotes';
import {
  VoicePreference,
  cleanTextForSpeech,
  getSavedVoicePreference,
  speechController,
} from '../utils/speechVoiceManager';
import { VoiceSettingsModal } from './VoiceSettingsModal';

interface ChatAreaProps {
  messages: ChatMessage[];
  activeModel: FuglorModel;
  isStreaming: boolean;
  onSendStarterPrompt: (prompt: string, customResponse?: string) => void;
  onOpenTeam: () => void;
  onRetryLastMessage?: () => void;
  userName?: string;
  onOpenNameModal?: () => void;
  isPro?: boolean;
  onOpenTimer?: () => void;
  onTriggerStudyMode?: (mode: 'quiz' | 'map') => void;
  centeredComposer?: React.ReactNode;
  sessionKey?: string | null;
  language?: 'it' | 'en';
  tWelcome: Translations['welcome'];
  tChat: Translations['chat'];
  tStudyCard: Translations['studyCard'];
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  activeModel,
  isStreaming,
  onSendStarterPrompt,
  onOpenTeam,
  onRetryLastMessage,
  userName = '',
  onOpenNameModal,
  isPro = false,
  onOpenTimer,
  onTriggerStudyMode,
  centeredComposer,
  sessionKey = null,
  language = 'it',
  tWelcome,
  tChat,
  tStudyCard,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lastScrolledMsgIdRef = useRef<string | null>(null);
  const lastSessionIdRef = useRef<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [speakingStatus, setSpeakingStatus] = useState<'idle' | 'loading' | 'playing'>('idle');
  const [voicePref, setVoicePref] = useState<VoicePreference>(() => getSavedVoicePreference());
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [greetingVariant, setGreetingVariant] = useState<number>(() => Math.floor(Math.random() * 10));
  const wasEmptyRef = useRef<boolean>(messages.length === 0);
  const prevSessionKeyRef = useRef<string | null>(sessionKey);

  // Pick a fresh greeting whenever opening an empty screen or switching to a new empty chat
  useEffect(() => {
    const isEmpty = messages.length === 0;
    const sessionSwitched = sessionKey !== prevSessionKeyRef.current;
    if (isEmpty && (!wasEmptyRef.current || sessionSwitched)) {
      setGreetingVariant((prev) => {
        const next = Math.floor(Math.random() * 10);
        return next === prev ? (next + 1) % 10 : next;
      });
    }
    wasEmptyRef.current = isEmpty;
    prevSessionKeyRef.current = sessionKey;
  }, [messages.length, sessionKey]);

  const getDynamicGreeting = (): string => {
    if (userName) {
      if (language === 'en') {
        const pool = [
          tWelcome.greeting(userName),
          tWelcome.greeting(userName),
          tWelcome.greeting(userName),
          `Ready, ${userName}? 🚀`,
          `I'm ready, ${userName}`,
          `What are we studying, ${userName}?`,
          `Welcome back, ${userName}! ✨`,
          `Hey ${userName}, let's dive in! ⚡`,
          `All set for you, ${userName}`,
          `Let's crush this, ${userName}! 💡`,
        ];
        return pool[greetingVariant % pool.length];
      }
      const pool = [
        tWelcome.greeting(userName),
        tWelcome.greeting(userName),
        tWelcome.greeting(userName),
        `Pronto, ${userName}? 🚀`,
        `Sono pronto, ${userName}`,
        `Che studiamo oggi, ${userName}?`,
        `Bentornato, ${userName}! ✨`,
        `Ehi ${userName}, si parte! ⚡`,
        `Tutto pronto, ${userName} 📚`,
        `A tua disposizione, ${userName}`,
      ];
      return pool[greetingVariant % pool.length];
    }

    if (language === 'en') {
      const pool = [
        'Hi, there 👋',
        'Hi, there 👋',
        'Ready to start? 🚀',
        "I'm ready!",
        'What are we studying?',
      ];
      return pool[greetingVariant % pool.length];
    }
    const pool = [
      'Ciao! 👋',
      'Ciao! 👋',
      'Pronto a iniziare? 🚀',
      'Sono pronto!',
      'Che studiamo oggi?',
    ];
    return pool[greetingVariant % pool.length];
  };

  // Pre-load voices on mount to ensure high quality neural voices are ready
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      const handler = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.onvoiceschanged = handler;
    }

    return () => {
      speechController.stop();
    };
  }, []);

  // Immediately stop audio if speaking message is removed, or if chat is cleared/deleted
  useEffect(() => {
    if (speakingMessageId) {
      const stillExists = messages.some((m) => m.id === speakingMessageId);
      if (!stillExists) {
        speechController.stop();
        setSpeakingMessageId(null);
        setSpeakingStatus('idle');
      }
    }
  }, [messages, speakingMessageId]);

  // Keep viewport anchored at the beginning of new AI responses instead of auto-scrolling down
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (messages.length === 0) {
      lastScrolledMsgIdRef.current = null;
      lastSessionIdRef.current = null;
      setShowScrollBottom(false);
      return;
    }

    const lastMsg = messages[messages.length - 1];
    const currentSessionId = lastMsg?.sessionId ?? null;
    const sessionChanged = currentSessionId !== lastSessionIdRef.current;

    if (sessionChanged) {
      lastSessionIdRef.current = currentSessionId;
      lastScrolledMsgIdRef.current = lastMsg.id;
      if (!lastMsg.isStreaming) {
        container.scrollTop = container.scrollHeight;
      }
    } else if (lastMsg && lastMsg.id !== lastScrolledMsgIdRef.current) {
      lastScrolledMsgIdRef.current = lastMsg.id;
      if (lastMsg.role === 'assistant') {
        const targetEl = messageRefs.current[lastMsg.id];
        if (targetEl) {
          const containerRect = container.getBoundingClientRect();
          const elRect = targetEl.getBoundingClientRect();
          const targetTop = container.scrollTop + (elRect.top - containerRect.top) - 16;
          container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
        }
      }
    }

    const isFar =
      container.scrollHeight - container.scrollTop - container.clientHeight > 200;
    setShowScrollBottom(isFar);
  }, [messages, isStreaming]);

  // Handle scroll detection
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const isFar =
      container.scrollHeight - container.scrollTop - container.clientHeight > 200;
    setShowScrollBottom(isFar);
  };

  const scrollToBottom = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  };

  const copyMessage = async (msg: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopiedId(msg.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleToggleSpeak = (msgId: string, rawText: string) => {
    if (speakingMessageId === msgId) {
      speechController.stop();
      setSpeakingMessageId(null);
      setSpeakingStatus('idle');
      return;
    }

    speechController.stop();
    setSpeakingMessageId(msgId);
    setSpeakingStatus('loading');

    speechController.play(
      rawText,
      voicePref,
      (status) => {
        setSpeakingStatus(status);
        if (status === 'idle') {
          setSpeakingMessageId(null);
        }
      },
      () => {
        setSpeakingMessageId(null);
        setSpeakingStatus('idle');
      },
      () => {
        setSpeakingMessageId(null);
        setSpeakingStatus('idle');
      }
    );
  };

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5 relative"
    >
      <div className="max-w-3xl mx-auto w-full min-h-full flex flex-col min-w-0">
        {messages.length === 0 ? (
          /* Centered Gemini-style New Conversation Screen */
          <div className="my-auto py-4 sm:py-8 flex flex-col items-center text-center max-w-2xl mx-auto w-full relative animate-fade-in-scale">
            {/* Soft Atmospheric Radial Glow (matching reference dark-blue aura) */}
            <div
              className="pointer-events-none absolute -inset-x-16 -top-16 -bottom-12 opacity-60 dark:opacity-100"
              style={{
                background:
                  'radial-gradient(ellipse 68% 54% at 50% 42%, rgba(37, 99, 235, 0.16) 0%, rgba(79, 70, 229, 0.07) 48%, transparent 78%)',
              }}
            />

            {/* Keep Fuglor Logo */}
            <div className="relative z-10 mb-3 sm:mb-4 flex items-center justify-center animate-pop-in">
              <div
                className="absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full pointer-events-none opacity-55"
                style={{
                  background: 'radial-gradient(circle, rgba(99, 102, 241, 0.42) 0%, rgba(56, 189, 248, 0.25) 55%, transparent 78%)',
                  filter: 'blur(18px)',
                }}
              />
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full p-1 bg-gradient-to-tr from-blue-400 via-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/25 animate-orb-float transition-transform hover:scale-105 duration-300">
                <div className="w-full h-full rounded-full bg-[#0E1424] flex items-center justify-center overflow-hidden">
                  <img
                    src="/assets/aistudio/immagine_11d61f71.png"
                    alt="Fuglor AI Mascot"
                    className="w-full h-full object-cover rounded-full select-none pointer-events-none scale-105"
                    loading="eager"
                  />
                </div>
              </div>
            </div>

            {/* Keep Personalized "Ciao (nome)" Greeting */}
            <div className="relative z-10 mb-5 sm:mb-6 space-y-1 animate-fade-in-up delay-100">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-medium text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>{getDynamicGreeting()}</span>
                  {isPro && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-xs tracking-wider">
                      PRO
                    </span>
                  )}
                </h1>
                {onOpenNameModal && (
                  <button
                    onClick={onOpenNameModal}
                    title={tWelcome.changeName}
                    className="p-1 rounded-full text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all hover:scale-110 active:scale-95 cursor-pointer text-xs"
                  >
                    ✏️
                  </button>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
                {language === 'en' ? 'Where should we start?' : 'Da dove iniziamo oggi?'}
              </p>
            </div>

            {/* Centered Gemini-style Composer Bar */}
            {centeredComposer && (
              <div className="relative z-10 w-full animate-fade-in-up delay-150">
                {centeredComposer}
              </div>
            )}

            {/* Bottom Comfortable Bento Cards: Canva Resources & Study Prompts */}
            <div className="relative z-10 w-full grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3 text-left mt-5 sm:mt-6 animate-fade-in-up delay-250">
              {/* Featured Canva Study Resources Card (entire card clickable) */}
              <button
                type="button"
                onClick={() => onSendStarterPrompt(STARTER_PROMPTS[0].prompt, STARTER_PROMPTS[0].customResponse)}
                className="md:col-span-6 rounded-2xl bg-white dark:bg-[#161922] text-slate-900 dark:text-white p-3.5 sm:p-4 flex flex-col justify-between shadow-xs hover:shadow-lg border border-slate-200/90 dark:border-white/[0.08] hover:border-sky-400/60 dark:hover:border-cyan-400/50 relative overflow-hidden group transition-all duration-200 bento-card-interactive text-left cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-zinc-300 mb-1.5">
                    <span className="w-5 h-5 rounded-md bg-sky-50 dark:bg-cyan-500/15 flex items-center justify-center text-sky-600 dark:text-cyan-400">
                      <GraduationCap className="w-3.5 h-3.5" />
                    </span>
                    <span>{language === 'en' ? 'Study & Resources' : 'Studio & Risorse'}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug group-hover:text-sky-600 dark:group-hover:text-cyan-300 transition-colors">
                    {language === 'en'
                      ? 'Study resources & diagrams (Canva)'
                      : 'Risorse e schemi per lo studio (Canva)'}
                  </h3>
                  <p className="text-[12px] text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed line-clamp-2">
                    Arte egizia, Scienze, Divina Commedia, Viterbo, Kusama, Sistema Solare e altri.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/[0.07] flex items-center justify-between w-full">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-cyan-300">
                    <span>{language === 'en' ? 'Open 11 Decks' : 'Apri Schede'}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
                    11 Presentazioni
                  </span>
                </div>
              </button>

              {/* Right Column: Two Quick Study Prompt Cards */}
              <div className="md:col-span-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => onSendStarterPrompt('Aiutami a preparare una scaletta per il tema')}
                  className="flex-1 p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#161922] border border-slate-200/90 dark:border-white/[0.08] hover:border-indigo-400/60 dark:hover:border-indigo-400/50 shadow-xs hover:shadow-md transition-all duration-200 bento-card-interactive text-left flex items-center justify-between gap-2 group cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] text-indigo-500 dark:text-indigo-400 font-medium">
                      <PenLine className="w-3 h-3 shrink-0" />
                      <span>{language === 'en' ? 'Writing & Essays' : 'Metodo di studio'}</span>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-zinc-100 font-medium mt-0.5 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                      {language === 'en'
                        ? 'Help me build an essay outline'
                        : 'Aiutami a preparare una scaletta per il tema'}
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => onSendStarterPrompt('Spiegami un argomento difficile passo dopo passo')}
                  className="flex-1 p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#161922] border border-slate-200/90 dark:border-white/[0.08] hover:border-emerald-400/60 dark:hover:border-emerald-400/50 shadow-xs hover:shadow-md transition-all duration-200 bento-card-interactive text-left flex items-center justify-between gap-2 group cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span>{language === 'en' ? 'Step-by-step tutor' : 'Comprensione concetti'}</span>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-zinc-100 font-medium mt-0.5 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                      {language === 'en'
                        ? 'Explain a difficult topic step by step'
                        : 'Spiegami un concetto difficile passo dopo passo'}
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all shrink-0" />
                </button>
              </div>
            </div>

            {/* Clean Single Quick-Tools Row */}
            <div className="relative z-10 w-full flex flex-wrap items-center justify-center gap-2 mt-3.5 animate-fade-in-up delay-350">
              {onTriggerStudyMode && (
                <>
                  <button
                    type="button"
                    onClick={() => onTriggerStudyMode('quiz')}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#161922] border border-slate-200 dark:border-white/[0.08] hover:border-amber-400/50 text-xs text-slate-700 dark:text-zinc-300 font-medium flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>{language === 'en' ? 'Oral quiz' : 'Simula interrogazione'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onTriggerStudyMode('map')}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#161922] border border-slate-200 dark:border-white/[0.08] hover:border-purple-400/50 text-xs text-slate-700 dark:text-zinc-300 font-medium flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Brain className="w-3.5 h-3.5 text-purple-500" />
                    <span>{language === 'en' ? 'Concept map' : 'Mappa concettuale'}</span>
                  </button>
                </>
              )}

              {onOpenTimer && (
                <button
                  type="button"
                  onClick={onOpenTimer}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#161922] border border-slate-200 dark:border-white/[0.08] hover:border-sky-300 dark:hover:border-cyan-500/40 text-xs text-slate-700 dark:text-zinc-300 font-medium flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Timer className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
                  <span>{language === 'en' ? 'Study timer' : 'Timer studio'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenTeam}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#161922] border border-slate-200 dark:border-white/[0.08] hover:border-cyan-300 dark:hover:border-cyan-500/40 text-xs text-slate-700 dark:text-zinc-300 font-medium flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-cyan-500" />
                <span>Team: Gabriel, Luca, Federico</span>
              </button>
            </div>
          </div>
        ) : (
          /* Messages Stream */
          <div className="space-y-6 pb-6">
            {messages.map((message) => {
              const isUser = message.role === 'user';

              return (
                <div
                  key={message.id}
                  ref={(el) => {
                    messageRefs.current[message.id] = el;
                  }}
                  className={`flex gap-2.5 sm:gap-4 min-w-0 animate-fade-in-up ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {/* Assistant Avatar (Desktop & Tablet) */}
                  {!isUser && (
                    <div className="hidden sm:flex w-8 h-8 rounded-lg p-0.5 bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-500 items-center justify-center shrink-0 shadow-xs shadow-cyan-500/20 mt-0.5 overflow-hidden">
                      <img
                        src="/assets/aistudio/immagine_11d61f71.png"
                        alt="Fuglor AI"
                        className="w-full h-full object-cover rounded-[6px]"
                      />
                    </div>
                  )}

                  {/* Message Bubble Container */}
                  <div
                    className={`flex flex-col min-w-0 max-w-[95%] sm:max-w-[85%] ${
                      isUser ? 'items-end' : 'items-start flex-1'
                    }`}
                  >
                    {/* Role / Meta */}
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 text-[11px] text-slate-400 font-mono">
                      {!isUser && (
                        <span className="sm:hidden w-4 h-4 rounded p-[1px] bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-500 inline-flex items-center justify-center shrink-0 overflow-hidden">
                          <img
                            src="/assets/aistudio/immagine_11d61f71.png"
                            alt="Fuglor AI"
                            className="w-full h-full object-cover rounded-[3px]"
                          />
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <span>{isUser ? tChat.you : tChat.fuglor}</span>
                        {isUser && isPro && (
                          <span className="px-1.5 py-0.5 rounded-sm font-bold text-[9px] bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950">
                            PRO
                          </span>
                        )}
                      </span>
                      <span>·</span>
                      <span>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Message Card Body */}
                    <div
                      className={`relative rounded-2xl px-3.5 py-3 sm:px-5 sm:py-3.5 text-sm min-w-0 break-words ${
                        isUser
                          ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white shadow-sm'
                          : 'bg-white dark:bg-[#121824] border border-slate-200/90 dark:border-white/[0.08] text-slate-800 dark:text-slate-100 shadow-sm dark:shadow-md w-full'
                      }`}
                    >
                      {isUser ? (
                        <div className="space-y-2">
                          {/* Attached Homework Images in User Message */}
                          {message.images && message.images.length > 0 && (
                            <div className="flex gap-2 flex-wrap mb-1.5">
                              {message.images.map((img, iIdx) => (
                                <div key={iIdx} className="relative group rounded-xl overflow-hidden border border-white/20 shadow-md">
                                  <img
                                    src={img.data}
                                    alt="Foto compito allegata"
                                    className="max-h-52 max-w-full rounded-xl object-contain cursor-pointer hover:opacity-95 transition-opacity"
                                    onClick={() => setPreviewImageUrl(img.data)}
                                    title="Tocca per ingrandire la foto"
                                  />
                                  <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-xs text-[10px] font-mono px-1.5 py-0.5 rounded text-white">
                                    📸 Compito #{iIdx + 1}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <p className="whitespace-pre-wrap leading-relaxed">
                            {message.content}
                          </p>
                        </div>
                      ) : (
                        <div>
                          {message.error ? (
                            <div className="flex items-start gap-3 text-amber-900 dark:text-amber-200 bg-amber-500/10 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-700/50 p-4 rounded-2xl text-xs shadow-xs animate-fade-in-up">
                              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-amber-950 dark:text-amber-100">{tChat.errorTitle}</p>
                                <p className="mt-1 text-slate-700 dark:text-slate-300 leading-relaxed">{message.error}</p>
                                {onRetryLastMessage && (
                                  <button
                                    onClick={onRetryLastMessage}
                                    className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span>{tChat.retry}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : !message.content ? (
                            /* Thinking state: Animated jumping bouncing dots */
                            <div className="flex items-center gap-2 py-2 px-1 text-slate-600 dark:text-slate-300">
                              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tracking-wide">
                                Fuglor AI sta pensando
                              </span>
                              <div className="flex items-center gap-1.5 ml-1">
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce-dot-1" />
                                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce-dot-2" />
                                <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce-dot-3" />
                              </div>
                            </div>
                          ) : (
                            <div>
                              <MarkdownRenderer
                                content={message.content}
                                isStreaming={message.isStreaming}
                              />
                              {message.isStreaming && (
                                <div className="inline-flex items-center gap-1.5 ml-2 align-middle">
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce-dot-1" />
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce-dot-2" />
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce-dot-3" />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Search Grounding Sources */}
                          {message.sources && message.sources.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/[0.08] animate-fade-in-up">
                              <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-600 dark:text-cyan-400 mb-2">
                                <Globe className="w-3.5 h-3.5" />
                                <span>{tChat.groundingSources} ({message.sources.length})</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {message.sources.map((src, sIdx) => (
                                  <a
                                    key={sIdx}
                                    href={src.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors"
                                    title={src.title}
                                  >
                                    <span className="truncate max-w-[200px]">
                                      {src.title || src.uri}
                                    </span>
                                    <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Follow-up Study Micro-Actions */}
                          {!message.isStreaming && message.content && (
                            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center gap-1.5 flex-wrap animate-fade-in-up">
                              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">
                                Ripassa subito:
                              </span>
                              <button
                                onClick={() => onSendStarterPrompt(`Fammi una domanda di verifica rapida su quanto hai appena spiegato per vedere se ho capito bene.`)}
                                className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-white/[0.06] text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Award className="w-3 h-3 text-amber-500" />
                                <span>Mettimi alla prova</span>
                              </button>
                              <button
                                onClick={() => onSendStarterPrompt(`Trasforma questa spiegazione in uno schema a mappa concettuale con frecce [Concetto] ──▶ [Dettaglio] perfetto da copiare sul quaderno.`)}
                                className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-white/[0.06] text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Brain className="w-3 h-3 text-purple-500" />
                                <span>Crea Mappa</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Assistant Bottom Utility Bar (touch-friendly wrap on mobile & tablet) */}
                      {!isUser && !message.isStreaming && message.content && (
                        <div className="mt-2.5 pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-white/[0.06] text-xs text-slate-400 animate-fade-in-up">
                          <span className="hidden sm:inline text-[11px] font-mono opacity-60">
                            {activeModel.name}
                          </span>

                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-between sm:justify-end">
                            {/* Read Aloud TTS button & voice settings */}
                            <div className="flex items-center rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.06] overflow-hidden">
                              <button
                                onClick={() => handleToggleSpeak(message.id, message.content)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-1 transition-colors cursor-pointer ${
                                  speakingMessageId === message.id
                                    ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 text-white font-semibold shadow-xs'
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                                }`}
                                title={speakingMessageId === message.id ? 'Interrompi voce AI' : 'Ascolta con Voce Neurale AI (Stile ChatGPT)'}
                              >
                                {speakingMessageId === message.id ? (
                                  speakingStatus === 'loading' ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                                      <span className="text-[11px] text-white">Caricamento...</span>
                                    </>
                                  ) : (
                                    <>
                                      <VolumeX className="w-3.5 h-3.5 text-white" />
                                      <span className="text-[11px] text-white">Interrompi</span>
                                    </>
                                  )
                                ) : (
                                  <>
                                    <Volume2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                                    <span className="text-[11px]">Ascolta</span>
                                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 font-bold ml-0.5">
                                      AI
                                    </span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => setIsVoiceSettingsOpen(true)}
                                className="p-1.5 px-2 border-l border-slate-200/70 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-cyan-300 transition-colors cursor-pointer"
                                title="Impostazioni voce neurale stile ChatGPT (Kore, Puck, Zephyr, Fenrir)"
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                              </button>
                            </div>

                            <div className="flex items-center gap-1 sm:gap-1.5">
                              {/* Print / Save PDF note */}
                              <button
                                onClick={() => exportStudyNoteAsPrintable('Scheda di Studio Fuglor AI', message.content)}
                                className="flex items-center gap-1 px-2.5 py-1.5 sm:py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                                title="Stampa o salva come PDF/scheda di studio pulita"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span className="text-[11px]">PDF</span>
                              </button>

                              {/* Copy button */}
                              <button
                                onClick={() => copyMessage(message)}
                                className="flex items-center gap-1 px-2.5 py-1.5 sm:py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                                title={tChat.copyResponse}
                              >
                                {copiedId === message.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                                    <span className="text-emerald-500 dark:text-emerald-400 text-[11px]">{tChat.copied}</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span className="text-[11px]">{tChat.copyResponse}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User Avatar (Desktop & Tablet) */}
                  {isUser && (
                    <div className="hidden sm:flex w-8 h-8 rounded-lg bg-slate-800 border border-white/[0.08] items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-slate-300" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Sticky Scroll To Bottom Trigger (never overlaps ChatInput on phone/tablet) */}
        {showScrollBottom && (
          <div className="sticky bottom-3 self-end z-20 pointer-events-none">
            <button
              onClick={scrollToBottom}
              className="pointer-events-auto p-2.5 rounded-full bg-slate-800/95 hover:bg-slate-700 text-slate-200 border border-white/[0.15] shadow-xl transition-all active:scale-95 cursor-pointer animate-pop-in"
              title="Torna in fondo alla chat"
              aria-label="Torna in fondo alla chat"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* In-App Image Zoom Lightbox (Touch-friendly) */}
        {previewImageUrl && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4 animate-backdrop-fade"
            onClick={() => setPreviewImageUrl(null)}
          >
            <img
              src={previewImageUrl}
              alt="Anteprima foto compito"
              className="max-w-full max-h-[85dvh] rounded-2xl object-contain shadow-2xl animate-fade-in-scale"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="fixed top-4 right-4 px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-md cursor-pointer"
            >
              Chiudi ✕
            </button>
          </div>
        )}

        {/* Voice Settings Modal */}
        <VoiceSettingsModal
          isOpen={isVoiceSettingsOpen}
          onClose={() => setIsVoiceSettingsOpen(false)}
          preference={voicePref}
          onSavePreference={(newPref) => setVoicePref(newPref)}
        />
      </div>
    </div>
  );
};
