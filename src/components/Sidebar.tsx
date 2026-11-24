import React, { useState, useMemo } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Pin,
  Check,
  X,
  Search,
  Globe,
  Users,
  Crown,
} from 'lucide-react';
import { ChatSession } from '../types';
import { Language, Translations } from '../constants/translations';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onTogglePinSession: (id: string) => void;
  onOpenTeam: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isDesktopExpanded?: boolean;
  onToggleDesktopExpanded?: () => void;
  language: Language;
  onSelectLanguage: (lang: Language) => void;
  isPro?: boolean;
  onOpenPricing?: () => void;
  t: Translations['sidebar'];
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onTogglePinSession,
  onOpenTeam,
  isOpenMobile,
  onCloseMobile,
  isDesktopExpanded: controlledExpanded,
  onToggleDesktopExpanded,
  language,
  onSelectLanguage,
  isPro = false,
  onOpenPricing,
  t,
}) => {
  const [internalExpanded, setInternalExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('fuglor_sidebar_expanded');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const isDesktopExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggleExpanded = () => {
    if (onToggleDesktopExpanded) {
      onToggleDesktopExpanded();
    } else {
      setInternalExpanded((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('fuglor_sidebar_expanded', String(next));
        } catch {}
        return next;
      });
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const startEditing = (s: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(s.id);
    setEditTitle(s.title);
  };

  const saveEdit = (id: string) => {
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter((s) => s.title.toLowerCase().includes(q));
  }, [sessions, searchQuery]);

  const groupedSessions = useMemo(() => {
    const pinned: ChatSession[] = [];
    const today: ChatSession[] = [];
    const yesterday: ChatSession[] = [];
    const previousWeek: ChatSession[] = [];
    const older: ChatSession[] = [];

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    for (const s of filteredSessions) {
      if (s.isPinned) {
        pinned.push(s);
        continue;
      }
      const age = now - (s.updatedAt || s.createdAt);
      if (age < oneDay) {
        today.push(s);
      } else if (age < 2 * oneDay) {
        yesterday.push(s);
      } else if (age < 7 * oneDay) {
        previousWeek.push(s);
      } else {
        older.push(s);
      }
    }

    return [
      { label: t.pinned, items: pinned },
      { label: t.today, items: today },
      { label: t.yesterday, items: yesterday },
      { label: t.previousWeek, items: previousWeek },
      { label: t.older, items: older },
    ].filter((g) => g.items.length > 0);
  }, [filteredSessions, t]);

  const renderDrawerContent = (isMobile = false) => (
    <div className="flex flex-col h-full w-full">
      {/* Top Header: Mobile/Tablet Close + New Chat CTA */}
      <div className="p-3.5 border-b border-[#E5E7EB] dark:border-white/[0.06] flex flex-col gap-2.5 shrink-0">
        {isMobile && (
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md p-[1px] bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-500 overflow-hidden">
                <img
                  src="/assets/aistudio/immagine_11d61f71.png"
                  alt="Fuglor AI"
                  className="w-full h-full object-cover rounded-[5px]"
                />
              </div>
              <span className="text-sm font-bold text-[#111318] dark:text-white">Fuglor AI</span>
            </div>
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.06] cursor-pointer"
              aria-label="Chiudi menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <button
          onClick={() => {
            onNewSession();
            if (isMobile) onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 dark:from-cyan-500 dark:to-blue-600 dark:hover:from-cyan-400 dark:hover:to-blue-500 text-white dark:text-slate-950 font-semibold text-xs tracking-wide transition-all shadow-sm shadow-sky-500/20 cursor-pointer active:scale-[0.99]"
        >
          <Plus className="w-4 h-4 stroke-[2.25]" />
          <span>{t.newChat}</span>
        </button>

        {/* Search sessions */}
        {sessions.length > 3 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-2 lg:py-1.5 rounded-xl bg-white dark:bg-[#14161D] border border-[#E5E7EB] dark:border-white/[0.08] text-base lg:text-xs text-[#111318] dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500 dark:focus:border-cyan-400 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-4">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12 px-4 text-slate-400 dark:text-slate-500 text-xs">
            {searchQuery ? t.noResults : t.noChats}
          </div>
        ) : (
          groupedSessions.map((group) => (
            <div key={group.label} className="space-y-0.5">
              <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
                {group.label}
              </div>
              {group.items.map((session) => {
                const isActive = session.id === currentSessionId;
                const isEditing = editingId === session.id;

                return (
                  <div
                    key={session.id}
                    onClick={() => {
                      onSelectSession(session.id);
                      if (isMobile) onCloseMobile();
                    }}
                    className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-sky-50 dark:bg-cyan-500/15 text-sky-700 dark:text-cyan-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-sky-600 dark:text-cyan-400' : 'opacity-50'}`} />
                      {isEditing ? (
                        <div
                          className="flex items-center gap-1 flex-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(session.id);
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            autoFocus
                            className="w-full bg-white dark:bg-[#14161D] border border-sky-500 dark:border-cyan-400 rounded px-1.5 py-0.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                          />
                          <button
                            onClick={() => saveEdit(session.id)}
                            className="p-1 hover:text-sky-600 dark:hover:text-cyan-400 text-slate-400"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 hover:text-rose-500 text-slate-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="truncate">{session.title}</span>
                      )}
                    </div>

                    {!isEditing && (
                      <div
                        className={`flex items-center gap-0.5 transition-opacity ${
                          isActive ? 'opacity-100' : 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onTogglePinSession(session.id)}
                          className={`p-1 transition-colors ${
                            session.isPinned ? 'text-sky-600 dark:text-cyan-400' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                          title={session.isPinned ? t.unpin : t.pin}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => startEditing(session, e)}
                          className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                          title={t.rename}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {confirmDeleteId === session.id ? (
                          <div className="flex items-center gap-1 bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 rounded">
                            <span className="text-[10px] text-rose-600 dark:text-rose-300">{t.deletePrompt}</span>
                            <button
                              onClick={() => {
                                onDeleteSession(session.id);
                                setConfirmDeleteId(null);
                              }}
                              className="text-rose-600 dark:text-rose-300 hover:opacity-80 font-bold"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(session.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Bottom Section: Pro Card + Team + Language */}
      <div className="p-3 border-t border-[#E5E7EB] dark:border-white/[0.06] bg-[#F4F5F7] dark:bg-[#0B0D12] space-y-2 shrink-0">
        {onOpenPricing && (
          <button
            onClick={() => {
              onOpenPricing();
              if (isMobile) onCloseMobile();
            }}
            className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
              isPro
                ? 'bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-indigo-500/10 border-amber-400/50 dark:border-amber-500/40'
                : 'bg-white dark:bg-[#14161D] hover:border-indigo-400/60 dark:hover:border-cyan-500/40 border-[#E5E7EB] dark:border-white/[0.08]'
            }`}
          >
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-bold truncate text-slate-900 dark:text-white flex items-center gap-1.5">
                <Crown className={`w-3.5 h-3.5 shrink-0 ${isPro ? 'text-amber-500' : 'text-indigo-500 dark:text-cyan-400'}`} />
                <span>{isPro ? 'Fuglor Pro Attivo' : 'Passa a Fuglor Pro'}</span>
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                isPro ? 'bg-amber-400 text-slate-950' : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
              }`}>
                {isPro ? 'PRO' : 'Free'}
              </span>
            </div>
            <p className="text-[11px] mt-1 leading-snug text-slate-500 dark:text-slate-400">
              {isPro
                ? 'Tutte le funzionalità Pro attive.'
                : 'Sblocca modelli e codice anteprima.'}
            </p>
          </button>
        )}

        <button
          onClick={() => {
            onOpenTeam();
            if (isMobile) onCloseMobile();
          }}
          className="w-full text-left p-2.5 rounded-xl bg-white dark:bg-[#14161D] hover:border-sky-300 dark:hover:border-cyan-500/40 border border-[#E5E7EB] dark:border-white/[0.08] transition-colors group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900 dark:text-white">
              {t.teamTitle}
            </span>
            <span className="text-[11px] text-sky-600 dark:text-cyan-400 group-hover:underline">
              {t.viewTeam}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Federico · Luca · Gabriel
          </div>
        </button>

        {/* ENG / ITA Switcher */}
        <div className="flex items-center justify-between pt-1 px-0.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <Globe className="w-3.5 h-3.5" />
            <span>{t.language}</span>
          </div>

          <div className="flex items-center p-0.5 bg-[#E5E7EB] dark:bg-[#14161D] border border-slate-300/60 dark:border-white/[0.08] rounded-lg">
            <button
              type="button"
              onClick={() => onSelectLanguage('en')}
              className={`px-2 py-0.5 text-[11px] font-mono font-semibold rounded transition-colors cursor-pointer ${
                language === 'en'
                  ? 'bg-sky-600 text-white dark:bg-cyan-500 dark:text-slate-950 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
              title="Switch to English"
            >
              ENG
            </button>
            <button
              type="button"
              onClick={() => onSelectLanguage('it')}
              className={`px-2 py-0.5 text-[11px] font-mono font-semibold rounded transition-colors cursor-pointer ${
                language === 'it'
                  ? 'bg-sky-600 text-white dark:bg-cyan-500 dark:text-slate-950 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
              title="Passa all'Italiano"
            >
              ITA
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile & Portrait Tablet Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden animate-backdrop-fade"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile & Portrait Tablet Slide-Over Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[82vw] max-w-[300px] bg-[#F8F9FA] dark:bg-[#0B0D12] border-r border-[#E5E7EB] dark:border-white/[0.08] flex flex-col lg:hidden transition-transform duration-300 ease-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderDrawerContent(true)}
      </aside>

      {/* Desktop & Landscape Tablet Dual Layout (1024px+) */}
      <div className="hidden lg:flex h-full select-none shrink-0 border-r border-[#E5E7EB] dark:border-white/[0.06] bg-[#F8F9FA] dark:bg-[#0B0D12] relative z-10">
        {/* Minimal Icon Rail */}
        <div className="w-[54px] h-full shrink-0 flex flex-col items-center justify-between py-4 border-r border-[#E5E7EB] dark:border-white/[0.05] bg-[#F3F4F6] dark:bg-[#08090D] z-20">
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleToggleExpanded}
              className="w-8 h-8 rounded-lg p-[1.5px] bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-500 overflow-hidden flex items-center justify-center hover:scale-105 transition-transform cursor-pointer shadow-xs"
              title="Fuglor AI"
            >
              <img
                src="/assets/aistudio/immagine_11d61f71.png"
                alt="Fuglor AI"
                className="w-full h-full object-cover rounded-[6px]"
              />
            </button>

            <button
              onClick={handleToggleExpanded}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isDesktopExpanded
                  ? 'bg-white dark:bg-[#14161D] text-sky-600 dark:text-cyan-400 border border-[#E5E7EB] dark:border-white/[0.08] shadow-xs'
                  : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
              }`}
              title={isDesktopExpanded ? 'Comprimi barra laterale' : 'Espandi conversazioni'}
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenTeam}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
              title={t.teamTitle}
            >
              <Users className="w-4 h-4" />
            </button>

            {onOpenPricing && (
              <button
                onClick={onOpenPricing}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isPro
                    ? 'text-amber-500 bg-amber-500/15'
                    : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
                }`}
                title={isPro ? 'Piano Pro attivo' : 'Passa a Fuglor Pro'}
              >
                <Crown className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => onSelectLanguage(language === 'it' ? 'en' : 'it')}
              className="px-1.5 py-1 rounded-md text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white font-mono text-[10px] font-semibold hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
              title={language === 'it' ? 'Switch to English' : "Passa all'Italiano"}
            >
              {language.toUpperCase()}
            </button>
          </div>
        </div>

        {/* Expandable Drawer */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden flex flex-col bg-[#F8F9FA] dark:bg-[#0B0D12] ${
            isDesktopExpanded
              ? 'w-64 opacity-100'
              : 'w-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="w-64 h-full flex flex-col">
            {renderDrawerContent(false)}
          </div>
        </div>
      </div>
    </>
  );
};
