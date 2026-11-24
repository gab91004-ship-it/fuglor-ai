/**
 * Intelligent Speech & Neural Voice Manager for Fuglor AI
 * Provides ChatGPT-style ultra-realistic AI neural speech via Gemini TTS
 * with automatic fallback to high-definition Web Speech API.
 */

export type EngineType = 'neural_ai' | 'browser_native';

export type AiVoiceName = 'Kore' | 'Puck' | 'Fenrir' | 'Zephyr' | 'Charon';

export interface VoicePreference {
  engine: EngineType;
  aiVoice: AiVoiceName;
  voiceURI?: string;
  speed: number; // 0.8 to 1.2
  gender: 'auto' | 'female' | 'male';
}

export const AI_VOICES: Array<{
  id: AiVoiceName;
  name: string;
  desc: string;
  gender: 'female' | 'male';
  tag: string;
}> = [
  {
    id: 'Kore',
    name: 'Kore (Consigliata)',
    desc: 'Femminile naturale, calda e amichevole (stile ChatGPT Sky)',
    gender: 'female',
    tag: 'ULTRA HD',
  },
  {
    id: 'Puck',
    name: 'Puck',
    desc: 'Maschile brillante, empatico ed espressivo (stile ChatGPT Alloy)',
    gender: 'male',
    tag: 'ULTRA HD',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    desc: 'Femminile dolce, pacata e rilassante per lo studio',
    gender: 'female',
    tag: 'STUDIO',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    desc: 'Maschile profondo, autorevole e rassicurante',
    gender: 'male',
    tag: 'PROFONDO',
  },
];

const VOICE_PREF_KEY = 'fuglor_voice_preference_v2';

export function getSavedVoicePreference(): VoicePreference {
  try {
    const saved = localStorage.getItem(VOICE_PREF_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        engine: parsed.engine || 'neural_ai',
        aiVoice: parsed.aiVoice || 'Kore',
        speed: parsed.speed || 1.0,
        gender: parsed.gender || 'auto',
        voiceURI: parsed.voiceURI,
      };
    }
  } catch {
    // fallback
  }
  return {
    engine: 'neural_ai',
    aiVoice: 'Kore',
    speed: 1.0,
    gender: 'auto',
  };
}

export function saveVoicePreference(pref: VoicePreference) {
  try {
    localStorage.setItem(VOICE_PREF_KEY, JSON.stringify(pref));
  } catch {
    // ignore
  }
}

/**
 * Transforms Markdown text, mathematical equations, and school notation
 * into natural, fluent Italian spoken sentences.
 */
export function cleanTextForSpeech(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Remove URLs and links cleanly
  text = text.replace(/https?:\/\/\S+/gi, ' ');

  // 2. Remove markdown images and links
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/gi, ' ');
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/gi, '$1');

  // 3. Remove raw code blocks
  text = text.replace(/```[\s\S]*?```/gi, ' ');
  text = text.replace(/`([^`]+)`/gi, '$1');

  // 4. Translate mathematical symbols into fluent Italian words
  text = text
    .replace(/\+/g, ' più ')
    .replace(/ - /g, ' meno ')
    .replace(/ = /g, ' è uguale a ')
    .replace(/ ≠ /g, ' è diverso da ')
    .replace(/ ≈ /g, ' è circa uguale a ')
    .replace(/ ≤ /g, ' minore o uguale a ')
    .replace(/ ≥ /g, ' maggiore o uguale a ')
    .replace(/ ± /g, ' più o meno ')
    .replace(/ [·×*] /g, ' per ')
    .replace(/ \/ /g, ' diviso ')
    .replace(/²/g, ' al quadrato')
    .replace(/³/g, ' al cubo')
    .replace(/√([a-zA-Z0-9]+)/g, ' radice quadrata di $1')
    .replace(/√/g, ' radice quadrata di ');

  // 5. Common fractions
  text = text
    .replace(/\b1\/2\b/g, ' un mezzo ')
    .replace(/\b1\/3\b/g, ' un terzo ')
    .replace(/\b1\/4\b/g, ' un quarto ')
    .replace(/\b2\/3\b/g, ' due terzi ')
    .replace(/\b3\/4\b/g, ' tre quarti ');

  // 6. Markdown headers & bullets
  text = text
    .replace(/^#+\s+/gim, '')
    .replace(/[*_~>]/g, '')
    .replace(/^[•\-\*]\s+/gim, '')
    .replace(/^\d+\.\s+/gim, '');

  // 7. Strip emojis
  text = text.replace(
    /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
    ''
  );

  // 8. Clean up whitespace and punctuation
  text = text
    .replace(/(\r\n|\n|\r)+/g, '. ')
    .replace(/\s+/g, ' ')
    .replace(/\.{2,}/g, '.')
    .replace(/([.?!])\s*([.?!])+/g, '$1')
    .trim();

  return text;
}

/**
 * Splits long text into natural sentence batches (<= 450 chars)
 * for snappy and seamless audio generation.
 */
export function splitTextIntoSpokenChunks(text: string, maxLen = 450): string[] {
  if (text.length <= maxLen) return [text];

  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [text];
  const chunks: string[] = [];
  let current = '';

  for (const s of sentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    if ((current + ' ' + trimmed).trim().length <= maxLen) {
      current = current ? `${current} ${trimmed}` : trimmed;
    } else {
      if (current) chunks.push(current);
      current = trimmed;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.length > 0 ? chunks : [text];
}

/**
 * Native Web Speech API fallback helpers
 */
export function getItalianVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }

  const allVoices = window.speechSynthesis.getVoices();
  const itVoices = allVoices.filter(
    (v) => v.lang.toLowerCase().startsWith('it') || v.lang.toLowerCase() === 'it'
  );

  if (itVoices.length === 0) return [];

  return itVoices.sort((a, b) => {
    const score = (voice: SpeechSynthesisVoice) => {
      const name = voice.name.toLowerCase();
      let s = 0;
      if (name.includes('natural') || name.includes('online')) s += 100;
      if (name.includes('neural') || name.includes('premium')) s += 90;
      if (name.includes('google')) s += 80;
      if (name.includes('elsa') || name.includes('cosimo') || name.includes('isabella') || name.includes('diego')) s += 70;
      if (name.includes('alice') || name.includes('federica') || name.includes('luca') || name.includes('siri')) s += 60;
      if (name.includes('espeak')) s -= 150;
      if (name.includes('robot')) s -= 100;
      return s;
    };
    return score(b) - score(a);
  });
}

export function selectBestVoice(pref: VoicePreference): SpeechSynthesisVoice | null {
  const voices = getItalianVoices();
  if (voices.length === 0) return null;

  if (pref.voiceURI) {
    const match = voices.find((v) => v.voiceURI === pref.voiceURI);
    if (match) return match;
  }

  if (pref.gender === 'female') {
    const femaleMatch = voices.find((v) => {
      const n = v.name.toLowerCase();
      return (
        n.includes('elsa') ||
        n.includes('alice') ||
        n.includes('federica') ||
        n.includes('isabella') ||
        n.includes('female') ||
        n.includes('donna')
      );
    });
    if (femaleMatch) return femaleMatch;
  } else if (pref.gender === 'male') {
    const maleMatch = voices.find((v) => {
      const n = v.name.toLowerCase();
      return (
        n.includes('cosimo') ||
        n.includes('luca') ||
        n.includes('diego') ||
        n.includes('male') ||
        n.includes('uomo')
      );
    });
    if (maleMatch) return maleMatch;
  }

  return voices[0] || null;
}

/**
 * High-Performance Neural Voice Audio Player
 * Plays AI neural voice generated on the server with sentence streaming,
 * caching and fallback to browser Web Speech.
 */
class SpeechPlaybackController {
  private currentAudio: HTMLAudioElement | null = null;
  private abortController: AbortController | null = null;
  private isCancelled = false;
  private isBusy = false;

  public stop() {
    this.isCancelled = true;
    this.isBusy = false;

    if (this.abortController) {
      try {
        this.abortController.abort();
      } catch {
        // ignore
      }
      this.abortController = null;
    }

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.src = '';
      } catch {
        // ignore
      }
      this.currentAudio = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }

  private isAiQuotaReached = false;

  public getIsQuotaReached(): boolean {
    return this.isAiQuotaReached;
  }

  public resetQuotaStatus() {
    this.isAiQuotaReached = false;
  }

  public async play(
    rawText: string,
    pref: VoicePreference,
    onStatusChange?: (status: 'loading' | 'playing' | 'idle') => void,
    onFinished?: () => void,
    onError?: (errorMsg: string) => void
  ) {
    this.stop();
    this.isCancelled = false;
    this.isBusy = true;
    this.abortController = new AbortController();

    const cleaned = cleanTextForSpeech(rawText);
    if (!cleaned) {
      this.isBusy = false;
      onStatusChange?.('idle');
      onFinished?.();
      return;
    }

    // Try Neural AI voice if enabled and quota not reached
    if (pref.engine !== 'browser_native' && !this.isAiQuotaReached) {
      onStatusChange?.('loading');

      try {
        const textToSpeak = cleaned.slice(0, 950);
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: textToSpeak,
            voice: pref.aiVoice || 'Kore',
          }),
          signal: this.abortController?.signal,
        });

        if (this.isCancelled) return;

        const data = await res.json().catch(() => ({}));
        if (this.isCancelled) return;

        if (data.quotaExceeded) {
          this.isAiQuotaReached = true;
        }

        if (data.audioUrl && !data.fallback) {
          onStatusChange?.('playing');

          await new Promise<void>((resolve, reject) => {
            if (this.isCancelled) return resolve();

            const audio = new Audio(data.audioUrl);
            this.currentAudio = audio;
            audio.playbackRate = pref.speed || 1.0;

            audio.onended = () => {
              this.currentAudio = null;
              resolve();
            };

            audio.onerror = (e) => {
              this.currentAudio = null;
              reject(e);
            };

            audio.play().catch(reject);
          });

          if (!this.isCancelled) {
            this.isBusy = false;
            onStatusChange?.('idle');
            onFinished?.();
            return;
          }
        }
      } catch (err) {
        if (this.isCancelled) {
          this.isBusy = false;
          onStatusChange?.('idle');
          return;
        }
      }
    }

    // Seamless Fallback: Browser Web Speech API with High-Definition Italian Voice
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.isBusy = false;
      onStatusChange?.('idle');
      onError?.('Sintesi vocale non supportata su questo browser.');
      return;
    }

    onStatusChange?.('playing');

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = 'it-IT';
    utterance.rate = pref.speed || 0.95;
    utterance.pitch = 1.0;

    const matchedVoice = selectBestVoice(pref);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang;
    }

    utterance.onend = () => {
      this.isBusy = false;
      onStatusChange?.('idle');
      onFinished?.();
    };

    utterance.onerror = () => {
      this.isBusy = false;
      onStatusChange?.('idle');
      onFinished?.();
    };

    window.speechSynthesis.speak(utterance);
  }
}

export const speechController = new SpeechPlaybackController();
