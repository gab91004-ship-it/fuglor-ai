/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { ChatInput } from './components/ChatInput';
import { TeamModal } from './components/TeamModal';
import { SettingsModal } from './components/SettingsModal';
import { NameModal } from './components/NameModal';
import { PricingModal } from './components/PricingModal';
import { ShareModal } from './components/ShareModal';
import { StudyTimerModal, TimerMode } from './components/StudyTimerModal';
import { LiveVoiceModal, LiveTranscriptTurn } from './components/LiveVoiceModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { FUGLOR_MODELS } from './constants/models';
import { ChatMessage, ChatSession, GroundingSource } from './types';
import { Language, TRANSLATIONS } from './constants/translations';
import { speechController } from './utils/speechVoiceManager';

const SESSIONS_STORAGE_KEY = 'fuglor_chat_sessions_v1';
const MESSAGES_STORAGE_KEY = 'fuglor_chat_messages_v1';
const SETTINGS_STORAGE_KEY = 'fuglor_system_instruction_v1';
const LANGUAGE_STORAGE_KEY = 'fuglor_language_v1';
const USERNAME_STORAGE_KEY = 'fuglor_user_name_v1';
const THEME_STORAGE_KEY = 'fuglor_theme';
const PRO_STORAGE_KEY = 'fuglor_is_pro_v1';

export default function App() {
  // Theme State ('dark' | 'light') - Persisted and synced with root document element
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // fallback
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);
  // User Name State (Prompts when opening the site for the first time)
  const [userName, setUserName] = useState<string>(() => {
    try {
      return localStorage.getItem(USERNAME_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const [isNameModalOpen, setIsNameModalOpen] = useState<boolean>(() => {
    try {
      // If user hasn't set or skipped a name yet, open modal on arrival
      return localStorage.getItem(USERNAME_STORAGE_KEY) === null;
    } catch {
      return false;
    }
  });

  const handleSaveUserName = (name: string) => {
    setUserName(name);
    try {
      localStorage.setItem(USERNAME_STORAGE_KEY, name);
    } catch {
      // ignore
    }
  };

  // Language State (Italian by default as requested, persists in localStorage)
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'it' || saved === 'en') return saved;
    } catch {
      // fallback
    }
    return 'it';
  });

  const handleSelectLanguage = (lang: Language) => {
    setLanguage(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  };

  const t = TRANSLATIONS[language];
  // Sessions & Active Session State
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Messages State indexed by sessionId
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(() => {
    try {
      const saved = localStorage.getItem(MESSAGES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {};
  });

  // Model & Capabilities State (fuglor-speed when Pro is active, fuglor-lite otherwise)
  const [currentModelId, setCurrentModelId] = useState<string>(() => {
    try {
      return localStorage.getItem(PRO_STORAGE_KEY) === 'true' ? 'fuglor-speed' : 'fuglor-lite';
    } catch {
      return 'fuglor-lite';
    }
  });
  const [useSearch, setUseSearch] = useState<boolean>(false);
  const [systemInstruction, setSystemInstruction] = useState<string>(() => {
    try {
      return localStorage.getItem(SETTINGS_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  // Chat Input & Streaming State
  const [input, setInput] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Modals & Navigation
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);

  // Attached images for OCR / homework analysis
  const [inputImages, setInputImages] = useState<Array<{ data: string; mimeType: string }>>([]);

  const handleAddImage = (img: { data: string; mimeType: string }) => {
    setInputImages((prev) => [...prev, img]);
  };

  const handleRemoveImage = (index: number) => {
    setInputImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Pomodoro Study Timer State
  const [timerTimeLeft, setTimerTimeLeft] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerMode, setTimerMode] = useState<TimerMode>('pomodoro');

  const playTimerChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch {
      // AudioContext not supported or blocked
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerRunning && timerTimeLeft > 0) {
      interval = setInterval(() => {
        setTimerTimeLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            playTimerChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerTimeLeft]);

  const handleToggleTimer = () => {
    setIsTimerRunning((prev) => !prev);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    const duration = timerMode === 'pomodoro' ? 25 * 60 : timerMode === 'short' ? 15 * 60 : 5 * 60;
    setTimerTimeLeft(duration);
  };

  const handleSelectTimerMode = (newMode: TimerMode) => {
    setTimerMode(newMode);
    setIsTimerRunning(false);
    const duration = newMode === 'pomodoro' ? 25 * 60 : newMode === 'short' ? 15 * 60 : 5 * 60;
    setTimerTimeLeft(duration);
  };

  // Pro Subscription State (Persisted across sessions via coupon early access or Stripe)
  const [isPro, setIsPro] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PRO_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const handleTogglePro = (proState: boolean) => {
    setIsPro(proState);
    setCurrentModelId((prev) => {
      if (proState && prev === 'fuglor-lite') return 'fuglor-speed';
      if (!proState && prev === 'fuglor-speed') return 'fuglor-lite';
      return prev;
    });
    try {
      localStorage.setItem(PRO_STORAGE_KEY, String(proState));
    } catch {}
  };

  const [isDesktopSidebarExpanded, setIsDesktopSidebarExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('fuglor_sidebar_expanded');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileSidebarOpen((prev) => !prev);
      return;
    }
    setIsDesktopSidebarExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('fuglor_sidebar_expanded', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Active Model Object
  const activeModel = FUGLOR_MODELS.find((m) => m.id === currentModelId) || FUGLOR_MODELS[0];

  // Save Sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch {
      // ignore
    }
  }, [sessions]);

  // Save Messages to localStorage (skip during active streaming to prevent JSON.stringify main-thread stalls per chunk)
  useEffect(() => {
    if (isStreaming) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messagesMap));
      } catch {
        // ignore
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [messagesMap, isStreaming]);

  // Initialize or ensure active session
  useEffect(() => {
    if (sessions.length > 0 && !currentSessionId) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [sessions, currentSessionId]);

  // Keyboard shortcut for New Chat (Cmd/Ctrl + K or Cmd/Ctrl + N)
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'n')) {
        e.preventDefault();
        handleNewSession();
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, []);

  // Handle Model Selection (auto-toggle search for research model)
  const handleSelectModel = (modelId: string) => {
    setCurrentModelId(modelId);
    if (modelId === 'fuglor-research') {
      setUseSearch(true);
    }
  };

  // Create New Session
  const handleNewSession = useCallback(() => {
    speechController.stop();
    const newId = `sess_${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: currentModelId,
      useSearch,
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setInput('');
  }, [currentModelId, useSearch]);

  // Delete Session
  const handleDeleteSession = (id: string) => {
    speechController.stop();
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setMessagesMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    if (currentSessionId === id) {
      const remaining = sessions.filter((s) => s.id !== id);
      setCurrentSessionId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Rename Session
  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s))
    );
  };

  // Toggle Pin Session
  const handleTogglePinSession = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isPinned: !s.isPinned } : s))
    );
  };

  // Save System Instruction
  const handleSaveSystemInstruction = (instruction: string) => {
    setSystemInstruction(instruction);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, instruction);
    } catch {
      // ignore
    }
  };

  // Clear All Data
  const handleClearAllSessions = () => {
    speechController.stop();
    setSessions([]);
    setMessagesMap({});
    setCurrentSessionId(null);
    try {
      localStorage.removeItem(SESSIONS_STORAGE_KEY);
      localStorage.removeItem(MESSAGES_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  // Active Session Messages
  const currentMessages = currentSessionId ? messagesMap[currentSessionId] || [] : [];

  // Stop Active Generation
  const handleStopGeneration = () => {
    speechController.stop();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);

    if (currentSessionId) {
      setMessagesMap((prev) => {
        const list = prev[currentSessionId] || [];
        return {
          ...prev,
          [currentSessionId]: list.map((m) =>
            m.isStreaming ? { ...m, isStreaming: false } : m
          ),
        };
      });
    }
  };

  // Send Message Core Logic (Supports text and attached homework images)
  const handleSendMessage = async (
    textOverride?: string,
    customResponse?: string,
    imagesToSend?: Array<{ data: string; mimeType: string }>
  ) => {
    speechController.stop();
    const imagesForTurn = imagesToSend || inputImages;
    const textToSend = (textOverride !== undefined ? textOverride : input).trim();
    if ((!textToSend && imagesForTurn.length === 0) || isStreaming) return;

    // Ensure we have an active session, otherwise create one
    let targetSessionId = currentSessionId;
    if (!targetSessionId) {
      targetSessionId = `sess_${Date.now()}`;
      const titleCandidate = textToSend || (imagesForTurn.length > 0 ? 'Foto Compito' : 'Nuova Chat');
      const newSession: ChatSession = {
        id: targetSessionId,
        title: titleCandidate.slice(0, 36) + (titleCandidate.length > 36 ? '...' : ''),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        model: currentModelId,
        useSearch,
      };
      setSessions([newSession]);
      setCurrentSessionId(targetSessionId);
    }

    const userMessageId = `msg_${Date.now()}_u`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      sessionId: targetSessionId,
      role: 'user',
      content: textToSend || (imagesForTurn.length > 0 ? 'Ho allegato la foto del mio compito/esercizio.' : ''),
      timestamp: Date.now(),
      images: imagesForTurn.length > 0 ? [...imagesForTurn] : undefined,
    };

    const assistantMessageId = `msg_${Date.now()}_a`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      sessionId: targetSessionId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
      sources: [],
    };

    // Update messages map with user message & empty assistant placeholder
    setMessagesMap((prev) => {
      const existing = prev[targetSessionId!] || [];
      return {
        ...prev,
        [targetSessionId!]: [...existing, userMessage, assistantMessage],
      };
    });

    // If first message in session, update title if it was "New Conversation"
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === targetSessionId && (s.title === 'New Conversation' || !s.title)) {
          return {
            ...s,
            title: textToSend.slice(0, 36) + (textToSend.length > 36 ? '...' : ''),
            updatedAt: Date.now(),
          };
        }
        return s.id === targetSessionId ? { ...s, updatedAt: Date.now() } : s;
      })
    );

    if (customResponse) {
      setInput('');
      setIsStreaming(true);
      let currentLen = 0;
      const step = 10;
      const interval = setInterval(() => {
        currentLen += step;
        if (currentLen >= customResponse.length) {
          clearInterval(interval);
          setMessagesMap((prev) => {
            const list = prev[targetSessionId!] || [];
            return {
              ...prev,
              [targetSessionId!]: list.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, content: customResponse, isStreaming: false }
                  : m
              ),
            };
          });
          setIsStreaming(false);
        } else {
          setMessagesMap((prev) => {
            const list = prev[targetSessionId!] || [];
            return {
              ...prev,
              [targetSessionId!]: list.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, content: customResponse.slice(0, currentLen), isStreaming: true }
                  : m
              ),
            };
          });
        }
      }, 15);
      return;
    }

    setInput('');
    setInputImages([]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Build compact conversation history for context (last 20 turns, exclude errors/empty)
      const existingMessages = messagesMap[targetSessionId] || [];
      const history = existingMessages
        .filter((m) => !m.error && m.content)
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content }));

      const runStreamAttempt = async (maxSilentRetries = 1): Promise<void> => {
        for (let attempt = 0; attempt <= maxSilentRetries; attempt++) {
          if (controller.signal.aborted) return;

          const response = await fetch('/api/chat/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              message: textToSend,
              images: imagesForTurn,
              history,
              model: activeModel.geminiModel,
              systemInstruction,
              useSearch,
              clientTime: new Date().toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Rome',
            }),
          });

          if (!response.ok) {
            throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
          }

          if (!response.body) {
            throw new Error('ReadableStream not supported by response');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let accumulatedText = '';
          const accumulatedSources: GroundingSource[] = [];
          let rafId: number | null = null;
          let streamError: string | null = null;
          let isRetryableError = false;

          const flushStreamingUi = (streamingActive = true) => {
            rafId = null;
            setMessagesMap((prev) => {
              const list = prev[targetSessionId!] || [];
              return {
                ...prev,
                [targetSessionId!]: list.map((m) =>
                  m.id === assistantMessageId
                    ? {
                        ...m,
                        content: accumulatedText,
                        sources: [...accumulatedSources],
                        isStreaming: streamingActive,
                        ...(streamError ? { error: streamError } : {}),
                      }
                    : m
                ),
              };
            });
          };

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            let shouldStop = false;
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;

              const dataStr = trimmed.slice(5).trim();
              if (dataStr === '[DONE]') {
                shouldStop = true;
                break;
              }

              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.error) {
                  streamError = parsed.error;
                  isRetryableError = Boolean(parsed.retryable) && !accumulatedText;
                  if (rafId !== null) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                  }
                  shouldStop = true;
                  break;
                }

                if (parsed.text) {
                  accumulatedText += parsed.text;
                }

                if (Array.isArray(parsed.sources) && parsed.sources.length > 0) {
                  for (const s of parsed.sources) {
                    if (!accumulatedSources.some((item) => item.uri === s.uri)) {
                      accumulatedSources.push(s);
                    }
                  }
                }

                if (rafId === null) {
                  rafId = requestAnimationFrame(() => flushStreamingUi(true));
                }
              } catch {
                // Ignored if chunk is incomplete or partial
              }
            }
            if (shouldStop) break;
          }

          if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }

          if (streamError) {
            if (isRetryableError && attempt < maxSilentRetries && !controller.signal.aborted) {
              await new Promise<void>((resolve, reject) => {
                const timer = setTimeout(resolve, 1800);
                controller.signal.addEventListener(
                  'abort',
                  () => {
                    clearTimeout(timer);
                    reject(new DOMException('Aborted', 'AbortError'));
                  },
                  { once: true }
                );
              });
              continue;
            }
            flushStreamingUi(false);
            return;
          }

          flushStreamingUi(false);
          return;
        }
      };

      await runStreamAttempt(1);
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        console.log('Stream generation aborted by user.');
      } else {
        const errorMsg = err instanceof Error ? err.message : 'Unknown generation failure.';
        setMessagesMap((prev) => {
          const list = prev[targetSessionId!] || [];
          return {
            ...prev,
            [targetSessionId!]: list.map((m) =>
              m.id === assistantMessageId
                ? {
                    ...m,
                    isStreaming: false,
                    error: errorMsg,
                  }
                : m
            ),
          };
        });
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleRetryLastMessage = () => {
    if (!currentSessionId) return;
    const list = messagesMap[currentSessionId] || [];
    const lastUser = [...list].reverse().find((m) => m.role === 'user');
    if (lastUser) {
      // Remove failed assistant message
      setMessagesMap((prev) => ({
        ...prev,
        [currentSessionId]: (prev[currentSessionId] || []).filter(
          (m) => !(m.role === 'assistant' && m.error)
        ),
      }));
      handleSendMessage(lastUser.content, undefined, lastUser.images);
    }
  };

  const handleTriggerStudyMode = (mode: 'quiz' | 'map') => {
    if (mode === 'quiz') {
      handleSendMessage("Fammi un'interrogazione simulata: fai 1 sola domanda alla volta su una materia scolastica (o chiedimi quale argomento preferisco), aspetta la mia risposta, dammi un voto da 1 a 10 con spiegazione dettagliata e poi fammi la domanda successiva!");
    } else {
      handleSendMessage("Crea una mappa concettuale schematica per il mio quaderno: usa una struttura ad albero con nodi e frecce [Concetto Principale] ──▶ [Cause / Punti Chiave] ──▶ [Dettagli], con punti elenco visivi.");
    }
  };

  const handleCloseLiveVoice = (turns?: LiveTranscriptTurn[]) => {
    setIsLiveVoiceOpen(false);
    if (!turns || turns.length === 0) return;

    let targetSessionId = currentSessionId;
    const firstUserText = turns.find((turn) => turn.role === 'user')?.text || 'Fuglor Live';
    if (!targetSessionId) {
      targetSessionId = `sess_${Date.now()}`;
      const newSession: ChatSession = {
        id: targetSessionId,
        title: firstUserText.slice(0, 36) + (firstUserText.length > 36 ? '...' : ''),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        model: currentModelId,
        useSearch,
      };
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(targetSessionId);
    } else {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? {
                ...s,
                title:
                  s.title === 'New Conversation' || !s.title
                    ? firstUserText.slice(0, 36) + (firstUserText.length > 36 ? '...' : '')
                    : s.title,
                updatedAt: Date.now(),
              }
            : s
        )
      );
    }

    const baseTime = Date.now();
    const newMsgs: ChatMessage[] = turns.map((turn, idx) => ({
      id: `msg_${baseTime}_live_${idx}`,
      sessionId: targetSessionId!,
      role: turn.role,
      content: turn.text,
      timestamp: baseTime + idx,
      isStreaming: false,
    }));

    setMessagesMap((prev) => {
      const existing = prev[targetSessionId!] || [];
      return {
        ...prev,
        [targetSessionId!]: [...existing, ...newMsgs],
      };
    });
  };

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-[#F4F5F7] dark:bg-[#07090E] p-0 lg:p-3 font-sans">
      {/* Outer Sculpted Shell */}
      <div className="flex-1 flex overflow-hidden bg-[#FAFAFB] dark:bg-[#0E1015] rounded-none lg:rounded-3xl border-0 lg:border border-[#E5E7EB] dark:border-white/[0.06] shadow-2xl relative">
        {/* Responsive Collapsible Sidebar with Bottom-Left Language Switcher */}
        <Sidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={(id) => {
            speechController.stop();
            setCurrentSessionId(id);
          }}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
          onTogglePinSession={handleTogglePinSession}
          onOpenTeam={() => setIsTeamModalOpen(true)}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isDesktopExpanded={isDesktopSidebarExpanded}
          onToggleDesktopExpanded={handleToggleSidebar}
          language={language}
          onSelectLanguage={handleSelectLanguage}
          isPro={isPro}
          onOpenPricing={() => setIsPricingModalOpen(true)}
          t={t.sidebar}
        />

        {/* Main Chat Viewport */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#FAFAFB] dark:bg-[#0E1015] relative">
          {/* Subtle Ambient Radial Glow Accent */}
          <div
            className="pointer-events-none fixed inset-0 overflow-hidden opacity-30 dark:opacity-100 transition-opacity duration-700"
            style={{
              background:
                'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(56, 189, 248, 0.08) 0%, transparent 100%)',
            }}
          />

          {/* Top Navigation Bar */}
          <Header
            currentModelId={currentModelId}
            onSelectModel={handleSelectModel}
            useSearch={useSearch}
            onToggleSearch={() => setUseSearch((prev) => !prev)}
            onOpenTeam={() => setIsTeamModalOpen(true)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onOpenShare={() => setIsShareModalOpen(true)}
            onToggleMobileSidebar={handleToggleSidebar}
            onNewSession={handleNewSession}
            isPro={isPro}
            onOpenPricing={() => setIsPricingModalOpen(true)}
            onOpenTimer={() => setIsTimerModalOpen(true)}
            timerTimeLeft={timerTimeLeft}
            isTimerRunning={isTimerRunning}
            theme={theme}
            onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            t={t.header}
          />

          {/* Message Stream Area (includes centered composer when conversation is empty) */}
          <ChatArea
            messages={currentMessages}
            activeModel={activeModel}
            isStreaming={isStreaming}
            onSendStarterPrompt={(prompt, customResponse) => handleSendMessage(prompt, customResponse)}
            onOpenTeam={() => setIsTeamModalOpen(true)}
            onRetryLastMessage={handleRetryLastMessage}
            userName={userName}
            onOpenNameModal={() => setIsNameModalOpen(true)}
            isPro={isPro}
            onOpenTimer={() => setIsTimerModalOpen(true)}
            onTriggerStudyMode={handleTriggerStudyMode}
            sessionKey={currentSessionId}
            language={language}
            centeredComposer={
              currentMessages.length === 0 ? (
                <ChatInput
                  input={input}
                  setInput={setInput}
                  onSend={(textOverride?: string) => handleSendMessage(textOverride)}
                  onStop={handleStopGeneration}
                  isStreaming={isStreaming}
                  activeModel={activeModel}
                  useSearch={useSearch}
                  onToggleSearch={() => setUseSearch((prev) => !prev)}
                  images={inputImages}
                  onAddImage={handleAddImage}
                  onRemoveImage={handleRemoveImage}
                  onOpenTimer={() => setIsTimerModalOpen(true)}
                  onOpenLiveVoice={() => {
                    speechController.stop();
                    setIsLiveVoiceOpen(true);
                  }}
                  onTriggerStudyMode={handleTriggerStudyMode}
                  language={language}
                  variant="centered"
                  t={t.input}
                />
              ) : undefined
            }
            tWelcome={t.welcome}
            tChat={t.chat}
            tStudyCard={t.studyCard}
          />

          {/* Bottom Chat Input Form (active during conversation) */}
          {currentMessages.length > 0 && (
            <ChatInput
              input={input}
              setInput={setInput}
              onSend={(textOverride?: string) => handleSendMessage(textOverride)}
              onStop={handleStopGeneration}
              isStreaming={isStreaming}
              activeModel={activeModel}
              useSearch={useSearch}
              onToggleSearch={() => setUseSearch((prev) => !prev)}
              images={inputImages}
              onAddImage={handleAddImage}
              onRemoveImage={handleRemoveImage}
              onOpenTimer={() => setIsTimerModalOpen(true)}
              onOpenLiveVoice={() => {
                speechController.stop();
                setIsLiveVoiceOpen(true);
              }}
              onTriggerStudyMode={handleTriggerStudyMode}
              language={language}
              variant="bottom"
              t={t.input}
            />
          )}
        </div>
      </div>

      {/* Name Input Modal on First Arrival */}
      <NameModal
        isOpen={isNameModalOpen}
        onClose={() => setIsNameModalOpen(false)}
        onSaveName={handleSaveUserName}
        currentName={userName}
        t={t.nameModal}
      />

      {/* Team Creators Modal (Federico, Luca, Gabriel) */}
      <TeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        t={t.teamModal}
      />

      {/* Settings & Standalone HTML Exporter Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        systemInstruction={systemInstruction}
        onSaveSystemInstruction={handleSaveSystemInstruction}
        onClearAllSessions={handleClearAllSessions}
        t={t.settingsModal}
      />

      {/* Pricing & Subscription Modal (Free / Pro / School) */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        isPro={isPro}
        onTogglePro={handleTogglePro}
        onOpenTeam={() => {
          setIsPricingModalOpen(false);
          setIsTeamModalOpen(true);
        }}
        t={t.pricing}
      />

      {/* Share Modal (WhatsApp, Google Chat, Copy Link) */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        t={t.shareModal}
      />

      {/* Pomodoro Study Timer Modal */}
      <StudyTimerModal
        isOpen={isTimerModalOpen}
        onClose={() => setIsTimerModalOpen(false)}
        timeLeft={timerTimeLeft}
        isRunning={isTimerRunning}
        mode={timerMode}
        onToggleTimer={handleToggleTimer}
        onResetTimer={handleResetTimer}
        onSelectMode={handleSelectTimerMode}
      />

      {/* Real-Time Voice Conversation Modal (Gemini Live API) */}
      <LiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={handleCloseLiveVoice}
        language={language}
        userName={userName}
      />

      {/* Offline Status Banner */}
      <OfflineIndicator />

      {/* Bottom-Right Desktop Theme Switcher */}
      <div
        className="hidden xl:flex fixed bottom-5 right-6 z-40 items-center bg-white/95 dark:bg-[#14161D]/95 backdrop-blur-md border border-[#E5E7EB] dark:border-white/[0.1] shadow-lg rounded-xl p-1 transition-all"
        role="region"
        aria-label="Theme selector"
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
            theme === 'light'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
          }`}
          title={t.theme.toggleToLight}
          aria-pressed={theme === 'light'}
        >
          <Sun className="w-3.5 h-3.5" />
          <span className="text-[11px] font-sans">{t.theme.light}</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
            theme === 'dark'
              ? 'bg-cyan-500 text-slate-950 font-semibold shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
          }`}
          title={t.theme.toggleToDark}
          aria-pressed={theme === 'dark'}
        >
          <Moon className="w-3.5 h-3.5" />
          <span className="text-[11px] font-sans">{t.theme.dark}</span>
        </button>
      </div>
    </div>
  );
}
