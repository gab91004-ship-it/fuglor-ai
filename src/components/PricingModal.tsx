import React, { useState } from 'react';
import {
  X,
  Check,
  Sparkles,
  Crown,
  School,
  ShieldCheck,
  HeartHandshake,
  Lock,
  Clock,
  Ticket,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { Translations } from '../constants/translations';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPro: boolean;
  onTogglePro: (proState: boolean) => void;
  onOpenTeam?: () => void;
  t: Translations['pricing'];
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  isPro,
  onTogglePro,
  onOpenTeam: _onOpenTeam,
  t,
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [showCoupon, setShowCoupon] = useState(false);
  const [couponStatus, setCouponStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [activeCoupon, setActiveCoupon] = useState<string>(() => {
    try {
      return localStorage.getItem('fuglor_active_coupon') || '';
    } catch {
      return '';
    }
  });

  if (!isOpen) return null;

  const EXCLUSIVE_COUPON = 'ANTEPRIMAVANNIFUGLOR';

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = couponInput.trim().toUpperCase();
    if (!cleanCode) return;

    if (cleanCode === EXCLUSIVE_COUPON) {
      setCouponStatus('success');
      setActiveCoupon(cleanCode);
      try {
        localStorage.setItem('fuglor_active_coupon', cleanCode);
      } catch {}
      onTogglePro(true);
    } else {
      setCouponStatus('error');
    }
  };

  const handleDeactivatePro = () => {
    try {
      localStorage.removeItem('fuglor_active_coupon');
    } catch {}
    setActiveCoupon('');
    setCouponStatus('idle');
    setCouponInput('');
    onTogglePro(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/75 backdrop-blur-xs animate-backdrop-fade"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-[#0F1422] border border-slate-200 dark:border-white/[0.1] rounded-3xl shadow-2xl max-h-[90dvh] flex flex-col overflow-hidden animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Modal Header (always visible on PC, tablet & mobile) */}
        <div className="flex items-start justify-between gap-3 px-4 sm:px-7 pt-4 sm:pt-6 pb-3.5 border-b border-slate-100 dark:border-white/[0.08] shrink-0 bg-white dark:bg-[#0F1422]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {t.modalTitle}
                </h2>
                {isPro && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-xs shrink-0">
                    PRO ATTIVO
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
                {t.modalSubtitle}
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

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-7 pt-6 pb-5 sm:pb-7">
          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch mb-4">
          {/* Card 1: Free Tier */}
          <div
            className={`rounded-2xl p-5 flex flex-col justify-between border transition-all ${
              !isPro
                ? 'bg-slate-50/80 dark:bg-[#131929] border-slate-200 dark:border-white/[0.1] shadow-sm'
                : 'bg-white dark:bg-[#0F1422] border-slate-200/80 dark:border-white/[0.06] opacity-80'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t.freePlanTitle}
                </span>
                {!isPro && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-medium">
                    {t.currentPlan}
                  </span>
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {t.freePrice}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ {t.freePeriod}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t.freePlanDesc}
                </p>
              </div>

              {/* Features List */}
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 py-3 border-t border-slate-200/70 dark:border-white/[0.06]">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Modello Fuglor Lite ultra-veloce</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>11 Schede e presentazioni studio Canva</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Metodo socratico per compiti e scuola</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Cronologia conversazioni salvata in locale</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-200/70 dark:border-white/[0.06] mt-4">
              {!isPro ? (
                <button
                  disabled
                  className="w-full py-2.5 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-xs font-semibold cursor-not-allowed text-center"
                >
                  {t.active}
                </button>
              ) : (
                <button
                  onClick={handleDeactivatePro}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer text-center"
                >
                  {t.deactivatePro}
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Pro Tier (Featured / Popular) */}
          <div className="relative rounded-2xl p-5 flex flex-col justify-between bg-gradient-to-b from-indigo-50/70 via-white to-purple-50/50 dark:from-[#1A1838] dark:via-[#13172C] dark:to-[#101322] border-2 border-indigo-400 dark:border-indigo-500/80 shadow-xl shadow-indigo-500/10">
            {/* Top Ribbon */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-500 text-white font-mono text-[10px] font-bold shadow-md tracking-wider uppercase">
              {t.popularBadge}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3 mt-1">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t.proPlanTitle}
                </span>
                {isPro && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700">
                    {t.active}
                  </span>
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                    {t.proPriceMonthly}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">/ {t.proPeriod}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {t.proPlanDesc}
                </p>
              </div>

              {/* Features List */}
              <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-200 py-3 border-t border-indigo-100 dark:border-indigo-900/40">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                  <span className="font-medium">Tutti i modelli avanzati inclusi</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                  <span>Ricerca web Google illimitata con fonti</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                  <span>Tutor socratico per problemi e temi complessi</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                  <span>Notazione matematica pulita e senza formule grezze</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                  <span>Badge PRO dorato nel profilo utente</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                  <span>Priorità di calcolo e risposte fulminee</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-indigo-100 dark:border-indigo-900/40 mt-4 space-y-3">
              {isPro ? (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-amber-300/40 dark:border-amber-500/30 text-xs">
                    <div className="flex items-center justify-between font-bold text-amber-700 dark:text-amber-300 mb-1">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>{t.couponActiveBadge}</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-800 dark:text-amber-200 font-bold">
                        ATTIVO
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      {t.couponActiveMsg}
                    </p>
                    {activeCoupon && (
                      <div className="mt-2 pt-2 border-t border-amber-200/40 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        <span>Coupon riscattato:</span>
                        <span className="tracking-widest font-bold text-indigo-600 dark:text-indigo-400">••••••••</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={onClose}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4 stroke-[2.5] shrink-0" />
                      <span>Continua con Fuglor Pro</span>
                    </button>
                    <button
                      onClick={handleDeactivatePro}
                      className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer text-center"
                      title="Torna al piano base"
                    >
                      {t.deactivatePro}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    disabled
                    aria-disabled="true"
                    className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300/80 dark:border-white/10 text-slate-500 dark:text-slate-400 text-xs font-bold cursor-not-allowed flex items-center justify-center gap-2 select-none shadow-inner"
                    title="Non attivabile: il pagamento con Stripe sarà integrato a breve"
                  >
                    <Lock className="w-3.5 h-3.5 opacity-70" />
                    <span>{t.activatePro}</span>
                  </button>

                  <div className="flex items-start gap-2 p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/40 text-[11px] text-indigo-900 dark:text-indigo-300 leading-tight">
                    <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                    <span>{t.proDisabledNotice}</span>
                  </div>

                  {/* Coupon section to get Pro early preview */}
                  <div className="pt-2.5 border-t border-indigo-200/70 dark:border-indigo-900/50">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Ticket className="w-3.5 h-3.5 text-amber-500" />
                        <span>{t.couponLabel}</span>
                      </span>
                      <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider">
                        Anteprima
                      </span>
                    </div>

                    <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                      <div className="flex items-center gap-1 rounded-xl bg-white dark:bg-[#151C2C] border border-indigo-200 dark:border-white/10 p-1 focus-within:ring-2 focus-within:ring-indigo-500 shadow-inner">
                        <input
                          type={showCoupon ? 'text' : 'password'}
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value);
                            if (couponStatus !== 'idle') setCouponStatus('idle');
                          }}
                          placeholder={t.couponPlaceholder}
                          className="flex-1 min-w-0 bg-transparent px-2 py-1 text-base sm:text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none tracking-wider"
                          autoComplete="off"
                          spellCheck="false"
                        />

                        <button
                          type="button"
                          onClick={() => setShowCoupon(!showCoupon)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
                          title={showCoupon ? 'Censura/Nascondi codice' : 'Mostra codice'}
                        >
                          {showCoupon ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="submit"
                          disabled={!couponInput.trim()}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{t.couponApplyBtn}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 px-1">
                        <span className="flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5 text-amber-500" />
                          <span>{t.couponCensoredHint}</span>
                        </span>
                      </div>

                      {couponStatus === 'error' && (
                        <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400 animate-fade-in">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{t.couponInvalid}</span>
                        </div>
                      )}

                      {couponStatus === 'success' && (
                        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 animate-fade-in font-medium">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>{t.couponSuccess}</span>
                        </div>
                      )}
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Card 3: School & Classes Tier */}
          <div className="rounded-2xl p-5 flex flex-col justify-between bg-slate-50/80 dark:bg-[#131929] border border-slate-200 dark:border-white/[0.08] shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-cyan-500" />
                  {t.schoolPlanTitle}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {t.schoolPrice}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ classe / mese</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {t.schoolPlanDesc}
                </p>
              </div>

              {/* Features List */}
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 py-3 border-t border-slate-200/70 dark:border-white/[0.06]">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                  <span>Accesso completo per tutti gli studenti della classe</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                  <span>Pannello per docenti e animatori digitali</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                  <span>Integrazione con le 11 presentazioni Canva scolastiche</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                  <span>Supporto prioritario con gli sviluppatori (Federico, Luca, Gabriel)</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-200/70 dark:border-white/[0.06] mt-4">
              <button
                disabled
                aria-disabled="true"
                className="w-full py-2.5 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-xs font-semibold cursor-not-allowed text-center flex items-center justify-center gap-1.5 select-none"
                title="Richiesta non disponibile al momento"
              >
                <HeartHandshake className="w-4 h-4 opacity-70" />
                <span>{t.contactTeam}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info note */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-500 shrink-0" />
            <span>Nessun vincolo: puoi disattivare o cambiare piano in qualunque momento.</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            Fuglor AI · Sviluppato da Federico, Luca & Gabriel
          </span>
        </div>
        </div>
      </div>
    </div>
  );
};
