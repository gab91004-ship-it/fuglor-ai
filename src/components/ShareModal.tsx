import React, { useState } from 'react';
import { X, Share2, Copy, Check, ExternalLink, Globe, MessageSquare, Smartphone } from 'lucide-react';
import { Translations } from '../constants/translations';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: Translations['shareModal'];
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, t }) => {
  const [copied, setCopied] = useState(false);
  const [copiedForChat, setCopiedForChat] = useState(false);

  if (!isOpen) return null;

  const SITE_URL = 'https://fuglor.ai.studio/';
  const SHARE_TEXT = `Prova Fuglor AI, l'assistente didattico e per lo studio sviluppato da Gabriel, Luca e Federico! ${SITE_URL}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(SITE_URL);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = SITE_URL;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  const handleOpenGoogleChat = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(SHARE_TEXT);
      }
      setCopiedForChat(true);
      setTimeout(() => setCopiedForChat(false), 3000);
    } catch {
      // ignore
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Fuglor AI',
          text: "Prova Fuglor AI, l'assistente didattico per la scuola e lo studio!",
          url: SITE_URL,
        });
      } catch {
        // user cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Prova Fuglor AI, l'assistente per lo studio creato da Gabriel, Luca e Federico! ${SITE_URL}`
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-backdrop-fade"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#0F1422] border border-slate-200 dark:border-white/[0.1] rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 sm:space-y-6 max-h-[90dvh] overflow-y-auto animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-500/25">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
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
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* URL Box with direct Copy Button */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-500" />
              <span>{t.urlLabel}</span>
            </span>
            <span className="text-cyan-600 dark:text-cyan-400 font-semibold">HTTPS</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white dark:bg-[#151C2C] border border-slate-200 dark:border-white/[0.06] text-xs font-mono font-medium text-slate-800 dark:text-slate-200 truncate select-all shadow-inner">
              {SITE_URL}
            </div>

            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                  <span>{t.copied}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t.copyLink}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sharing Options Grid */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold block px-1">
            Seleziona come condividere
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* WhatsApp Option */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/80 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 transition-all hover:scale-[1.01] active:scale-[0.99] group shadow-2xs"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.771.82 2.791.82 3.182 0 5.768-2.587 5.768-5.766.001-3.182-2.585-5.769-5.768-5.769zm3.393 8.163c-.144.405-.837.774-1.17.824-.312.045-.634.07-.945.07-.899 0-1.879-.434-2.822-1.378-.943-.943-1.378-1.923-1.378-2.822 0-.311.025-.633.07-.945.05-.333.419-1.026.824-1.17.202-.072.433-.072.635 0 .167.06.333.468.428.66.096.192.144.384.072.553-.072.168-.168.24-.264.336-.096.096-.192.192-.288.288-.12.12-.144.24-.072.384.216.432.552.864.984 1.296.432.432.864.768 1.296.984.144.072.264.048.384-.072.096-.096.192-.192.288-.288.096-.096.168-.192.336-.264.168-.072.36-.024.553.072.192.095.6.261.66.428.072.202.072.433 0 .635zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.434 5.176L2 22l4.957-1.399C8.423 21.498 10.155 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                    {t.whatsapp}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 opacity-60 group-hover:opacity-100" />
                </div>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-0.5 leading-snug">
                  {t.whatsappDesc}
                </p>
              </div>
            </a>

            {/* Google Chat Option */}
            <a
              href="https://chat.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleOpenGoogleChat}
              className="flex items-start gap-3 p-3.5 rounded-2xl bg-sky-50/70 hover:bg-sky-100/80 dark:bg-sky-950/30 dark:hover:bg-sky-950/50 border border-sky-200 dark:border-sky-800/50 transition-all hover:scale-[1.01] active:scale-[0.99] group shadow-2xs"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-5 h-5 fill-current" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-950 dark:text-sky-200">
                    {t.googleChat}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 opacity-60 group-hover:opacity-100" />
                </div>
                <p className="text-[11px] text-sky-800/80 dark:text-sky-300/80 mt-0.5 leading-snug">
                  {copiedForChat ? '✓ Testo copiato! Si apre Google Chat' : t.googleChatDesc}
                </p>
              </div>
            </a>
          </div>

          {/* Native OS Share Button for Mobile & Desktop Apps */}
          <button
            onClick={handleNativeShare}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-900/70 dark:hover:bg-slate-850 border border-slate-200/80 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all hover:scale-[1.005] active:scale-[0.99] cursor-pointer shadow-2xs"
          >
            <Smartphone className="w-4 h-4 text-indigo-500" />
            <span>Condividi con altre app (Instagram, Telegram, Messaggi, Mail...)</span>
          </button>
        </div>

        {/* Footer info note */}
        <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px] text-slate-500">
            Fuglor AI · https://fuglor.ai.studio/
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
