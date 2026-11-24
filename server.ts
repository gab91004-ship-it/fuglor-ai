import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, ThinkingLevel, Modality, LiveServerMessage } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

const modelCooldownUntil: Record<string, number> = {};

// ---------------------------------------------------------------------------
// Multi-key pool: ruota tra piu' chiavi Gemini (GEMINI_API_KEY_1..N oppure
// GEMINI_API_KEYS="key1,key2,...") cosi' il limite gratuito RPD/RPM si divide
// tra tutte le chiavi e l'app regge anche con centinaia di studenti collegati.
// ---------------------------------------------------------------------------
type PoolEntry = { apiKey: string; client: GoogleGenAI; cooldownUntil: number };

function loadApiKeys(): string[] {
  const fromList = (process.env.GEMINI_API_KEYS || '')
    .split(/[,;\s]+/)
    .map((k) => k.trim())
    .filter(Boolean);
  const numbered: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const k = (process.env[`GEMINI_API_KEY_${i}`] || '').trim();
    if (k) numbered.push(k);
  }
  const single = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
  const all = [...numbered, ...fromList, ...(single ? [single] : [])];
  // Rimuove duplicati preservando l'ordine
  return Array.from(new Set(all));
}

let keyPool: PoolEntry[] = [];
let poolSignature = '';
let poolCursor = 0;

function buildPool(force = false): PoolEntry[] {
  const keys = loadApiKeys();
  const sig = keys.join('|');
  if (!force && keyPool.length > 0 && sig === poolSignature) {
    return keyPool;
  }
  poolSignature = sig;
  keyPool = keys.map((apiKey) => ({
    apiKey,
    client: new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    }),
    cooldownUntil: 0,
  }));
  return keyPool;
}

// Ritorna la prima chiave disponibile (non in cooldown). Se tutte sono in
// cooldown, usa comunque quella che si libera prima (round-robin) cosi' gli
// utenti non restano bloccati.
function getGeminiClient(): GoogleGenAI {
  const pool = buildPool();
  if (pool.length === 0) {
    throw new Error('Chiave API non trovata. PERMISSION_DENIED: Seleziona una chiave API nelle impostazioni di AI Studio.');
  }
  const now = Date.now();
  for (let i = 0; i < pool.length; i++) {
    const entry = pool[(poolCursor + i) % pool.length];
    if (entry.cooldownUntil <= now) {
      poolCursor = (pool.indexOf(entry) + 1) % pool.length;
      return entry.client;
    }
  }
  // Tutte in cooldown: scegli quella che si libera prima
  const earliest = pool.reduce((a, b) => (a.cooldownUntil < b.cooldownUntil ? a : b));
  return earliest.client;
}

function markKeyRateLimited(client: GoogleGenAI, seconds: number) {
  const entry = buildPool().find((e) => e.client === client);
  if (entry) {
    entry.cooldownUntil = Date.now() + seconds * 1000;
  }
}

function isRateLimitError(err: unknown): boolean {
  const raw = ((err as Error)?.message || String(err || '')).toLowerCase();
  return raw.includes('429') || raw.includes('resource_exhausted') || raw.includes('quota') || raw.includes('too many requests');
}

// Health check
app.get('/api/health', (_req, res) => {
  const pool = buildPool();
  res.json({
    status: 'ok',
    name: 'Fuglor AI',
    team: ['Federico', 'Luca', 'Gabriel'],
    hasKey: pool.length > 0,
    keyCount: pool.length,
  });
});

// AI Neural Text-to-Speech (like ChatGPT / modern conversational AI)
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'Kore' } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Nessun testo fornito per la voce.' });
    }

    // Limit text chunk for responsive TTS (up to 1000 characters in 1 cohesive audio clip)
    const cleanText = text.trim().slice(0, 1000);

    // Map requested voices (Kore: Natural Female, Puck: Natural Male, Fenrir: Warm Male, Zephyr: Calm Female)
    const validVoices = ['Kore', 'Puck', 'Fenrir', 'Zephyr', 'Charon'];
    const chosenVoice = validVoices.includes(voice) ? voice : 'Kore';

    // Prova con piu' chiavi API del pool: se una e' in quota si passa alla successiva
    let base64Audio: string | undefined;
    let lastErr: unknown = null;
    const maxKeyTries = Math.max(1, buildPool().length);
    for (let k = 0; k < maxKeyTries; k++) {
      const ai = getGeminiClient();
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: cleanText,
                  speechMetadata: {
                    style: 'Natural, warm, friendly Italian student tutor with clear human-like intonation and modern conversational style.',
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: chosenVoice },
              },
            },
          },
        });
        base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        break;
      } catch (keyErr: unknown) {
        lastErr = keyErr;
        if (isRateLimitError(keyErr)) {
          markKeyRateLimited(ai, 75);
          continue;
        }
        throw keyErr;
      }
    }
    if (!base64Audio) {
      if (lastErr) throw lastErr;
      return res.json({ fallback: true, message: 'Nessun flusso audio generato.' });
    }

    res.json({
      audioUrl: `data:audio/wav;base64,${base64Audio}`,
      format: 'audio/wav',
      voice: chosenVoice,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err || '');
    const isQuota =
      errMsg.includes('429') ||
      errMsg.includes('RESOURCE_EXHAUSTED') ||
      errMsg.includes('quota') ||
      errMsg.includes('rate-limits');

    // Return friendly fallback signal without throwing or raising runtime errors
    return res.json({
      fallback: true,
      quotaExceeded: isQuota,
      message: isQuota
        ? 'Quota giornaliera per la voce neurale AI esaurita. Utilizzo automatico della voce HD del dispositivo.'
        : 'Sintesi vocale AI non disponibile al momento. Utilizzo della voce HD del dispositivo.',
    });
  }
});

// Audio transcription fallback for browsers without Web Speech API
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm', language = 'it' } = req.body || {};
    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return res.status(400).json({ error: 'Nessun audio ricevuto.' });
    }
    const cleanBase64 = audioBase64.includes('base64,') ? audioBase64.split('base64,')[1] : audioBase64;
    const prompt =
      language === 'en'
        ? 'Transcribe this speech accurately into clean plain text without timestamps or extra commentary. Return only the spoken text.'
        : 'Trascrivi fedelmente questo parlato in italiano in testo pulito senza commenti aggiuntivi o timestamp. Restituisci solo il testo parlato.';

    // Prova con piu' chiavi API del pool: se una e' in quota si passa alla successiva
    let transcribedText: string | null = null;
    const maxKeyTries = Math.max(1, buildPool().length);
    for (let k = 0; k < maxKeyTries; k++) {
      const ai = getGeminiClient();
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-transcribe',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
              { text: prompt },
            ],
          },
        });
        transcribedText = (response.text || '').trim();
        break;
      } catch (keyErr: unknown) {
        if (isRateLimitError(keyErr)) {
          markKeyRateLimited(ai, 75);
          continue;
        }
        throw keyErr;
      }
    }

    if (transcribedText === null) {
      return res.status(500).json({ error: 'Trascrizione non riuscita: tutte le chiavi API sono momentaneamente in quota.' });
    }
    res.json({ text: transcribedText });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Trascrizione non riuscita.';
    res.status(500).json({ error: msg });
  }
});

function cleanErrorMessage(err: unknown): { message: string; isQuotaExceeded: boolean; isHighDemand: boolean; isAuthError: boolean } {
  let raw = err instanceof Error ? err.message : String(err || '');
  const lower = raw.toLowerCase();
  
  const isAuth =
    lower.includes('permission_denied') ||
    lower.includes('access_token_scope_insufficient') ||
    lower.includes('api_key_invalid') ||
    lower.includes('api key should be set') ||
    lower.includes('unauthenticated') ||
    lower.includes('401') ||
    (lower.includes('403') && !lower.includes('quota'));

  const isDailyQuota =
    lower.includes('perday') ||
    lower.includes('generaterequestsperday') ||
    lower.includes('free_tier_requests');
  const isQuota = lower.includes('429') || lower.includes('resource_exhausted') || lower.includes('quota') || lower.includes('too many requests');
  const isHighDemand = lower.includes('high demand') || lower.includes('503') || lower.includes('unavailable') || lower.includes('spikes in demand') || lower.includes('overloaded');

  try {
    const parsed = JSON.parse(raw);
    if (parsed.error?.message) {
      raw = parsed.error.message;
      try {
        const inner = JSON.parse(raw);
        if (inner.error?.message) {
          raw = inner.error.message;
        }
      } catch {
        // inner is not JSON
      }
    }
  } catch {
    // not JSON
  }

  if (isAuth) {
    return {
      message: 'Chiave API gratuita non attiva o scaduta (PERMISSION_DENIED). Chiudi la finestra di fatturazione (non serve pagare): verifica nel pannello Secrets di AI Studio che sia impostata la chiave gratuita oppure ricarica l’anteprima.',
      isQuotaExceeded: false,
      isHighDemand: false,
      isAuthError: true,
    };
  }

  if (isDailyQuota) {
    return {
      message: 'Questo modello ha raggiunto il limite gratuito giornaliero (20 richieste/giorno). Seleziona un altro modello dal menu in alto (es. Fuglor Lite) oppure riprova più tardi.',
      isQuotaExceeded: true,
      isHighDemand: false,
      isAuthError: false,
    };
  }

  if (isHighDemand) {
    return {
      message: 'I server gratuiti stanno registrando un picco temporaneo di traffico (503 High Demand). Attendi qualche secondo e premi "Riprova".',
      isQuotaExceeded: false,
      isHighDemand: true,
      isAuthError: false,
    };
  }

  if (isQuota) {
    return {
      message: 'Il limite di richieste per minuto è stato momentaneamente raggiunto (HTTP 429). Attendi 10-15 secondi e premi "Riprova": Fuglor AI riprenderà normalmente.',
      isQuotaExceeded: true,
      isHighDemand: false,
      isAuthError: false,
    };
  }

  return { message: raw, isQuotaExceeded: false, isHighDemand: false, isAuthError: false };
}

// Chat stream endpoint
app.post('/api/chat/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  const {
    message = '',
    images = [],
    history = [],
    model = 'gemini-4-hydrogen',
    systemInstruction,
    useSearch = false,
    clientTime,
    timeZone = 'Europe/Rome',
  } = req.body;

  const now = clientTime ? new Date(clientTime) : new Date();
  const userTimeZone = typeof timeZone === 'string' && timeZone.trim() ? timeZone : 'Europe/Rome';
  let formattedDate = '';
  let formattedTime = '';
  try {
    formattedDate = new Intl.DateTimeFormat('it-IT', {
      timeZone: userTimeZone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(now);
    formattedTime = new Intl.DateTimeFormat('it-IT', {
      timeZone: userTimeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(now);
  } catch {
    formattedDate = now.toLocaleDateString('it-IT');
    formattedTime = now.toLocaleTimeString('it-IT');
  }

  const hasTextMessage = typeof message === 'string' && message.trim().length > 0;
  const hasImages = Array.isArray(images) && images.length > 0;

  if (!hasTextMessage && !hasImages) {
    res.write(`data: ${JSON.stringify({ error: 'È necessario inserire un messaggio di testo o una foto del compito.' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  // Map requested or legacy models strictly to active high-availability Gemini models
  const MODEL_ALIAS_MAP: Record<string, string> = {
    'gemini-4-hydrogen': 'gemini-4-hydrogen',
    'gemini-3.1-flash-lite': 'gemini-3.1-flash-lite',
    'gemini-3.5-flash': 'gemini-4-hydrogen',
    'gemini-3.5-flash-lite': 'gemini-3.1-flash-lite',
    'gemini-3.8-flash': 'gemini-4-hydrogen',
    'gemini-flash-latest': 'gemini-4-hydrogen',
  };
  const targetModel = MODEL_ALIAS_MAP[model] || 'gemini-4-hydrogen';
  const alternateModel = targetModel === 'gemini-4-hydrogen' ? 'gemini-3.1-flash-lite' : 'gemini-4-hydrogen';

  try {
    // Build structured conversation turns
    const contents: Array<{ role: 'user' | 'model'; parts: Array<Record<string, unknown>> }> = [];

    // Prior history (only user and assistant/model turns)
    for (const h of history) {
      if (h.content && typeof h.content === 'string') {
        contents.push({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }],
        });
      }
    }

    // Current user message parts (supports text and attached photo/document)
    const currentParts: Array<Record<string, unknown>> = [];

    if (hasImages) {
      for (const img of images) {
        if (img && typeof img.data === 'string') {
          const rawBase64 = img.data.includes('base64,') ? img.data.split('base64,')[1] : img.data;
          currentParts.push({
            inlineData: {
              data: rawBase64,
              mimeType: img.mimeType || 'image/jpeg',
            },
          });
        }
      }
    }

    const effectiveText = hasTextMessage
      ? message.trim()
      : (hasImages ? 'Ho allegato la foto del mio compito/esercizio. Leggi il testo della foto e aiutami a capirlo e risolverlo passo dopo passo con il metodo socratico!' : '');

    currentParts.push({ text: effectiveText });

    contents.push({
      role: 'user',
      parts: currentParts,
    });

    // Build model configuration
    const config: Record<string, unknown> = {};

    const studyResourcesContext = `
Curated study resources available (Canva presentations):
1. Storia dell’arte — Storia dell’arte egizia: https://canva.link/0z8s32plgcfa9va
2. Scienze — Il rame: https://canva.link/lr0o104o7gl1il8
3. Storia — Le popolazioni precolombiane: https://canva.link/8vge6eqzxvtmx71
4. Geografia — L’Unione Europea: https://canva.link/wun5mnzlk26ilsp
5. Letteratura — Introduzione della Divina Commedia: https://canva.link/89mxxwp517ghav5
6. Geografia — Viterbo e provincia: https://canva.link/k52rz377mstfogj
7. Storia dell’arte — Yayoi Kusama video lezione: https://canva.link/emxp4ouoe30xwip
8. Storia dell’arte — L’anfiteatro: https://canva.link/yht9x9i9jr7i4kp
9. Scienze — Il sistema solare: https://canva.link/2wznzjsttqe1cfw
10. Cultura generale — Mostro di Loch Ness: https://canva.link/jpwcq7jfhzdfmam
11. Storia — La riforma della Chiesa: https://canva.link/xusmyto06cqizc8
When the user asks for study resources, study help, or "help studying", present these exact links with titles and offer to quiz, summarize, or explain them.`;

    const defaultSystem = `Sei Fuglor AI, un assistente didattico e di studio avanzato, brillante, elegante ed empatico, creato da Federico, Luca e Gabriel. Rispondi sempre in italiano naturale, fluido e ben strutturato.

FONDAMENTALE: METODO SOCRATICO E DIDATTICA PER LA MATEMATICA E I COMPITI:
1. MATEMATICA, SCIENZE ED ESERCIZI:
   - Se l'utente ti chiede un esercizio, equazione, espressione, problema di geometria o domanda di matematica/scienze:
     * NON DARE MAI DIRETTAMENTE IL RISULTATO O LA SOLUZIONE FINALE COMPLETATA SUBITO! Non fargli trovare la soluzione pronta passivamente!
     * IL TUO OBIETTIVO È FARLO ARRIVARE ALLA SOLUZIONE RAGIONANDO ("non glielo fai tu, glielo fai capire passo dopo passo con metodo socratico").
     * Procedi così:
       a) Riconosci l'argomento e spiega con parole semplici e chiare la regola o la logica di partenza.
       b) Mostra SOLO IL PRIMO PASSAGGIO oppure fagli una domanda mirata per invitarlo a ragionare (es. "Qual è il primo passaggio che faresti qui?", "Cosa dobbiamo fare per isolare la x?", "Cosa succede se sottraiamo 4 da entrambe le parti?").
       c) Chiedigli di fare il calcolo o di dirti cosa farebbe dopo: "Prova tu a fare questo passaggio e dimmi cosa ti viene!".
       d) Quando lo studente risponde, convalidalo con entusiasmo se ha fatto bene, oppure correggilo con gentilezza spiegandogli il perché se ha sbagliato.
       e) Solo ed esclusivamente se lo studente dice esplicitamente "non lo so, spiegamelo tutto" o "mostrami tutti i passaggi", allora spiegagli passo dopo passo ogni singolo calcolo a parole chiarissime.

2. SCRITTURA FORMULE E NOTAZIONE MATEMATICA (NO LATEX GREZZO):
   - È ASSOLUTAMENTE VIETATO rispondere con sintassi grezza di codice LaTeX tipo "$a^2 = b$, allora $\\sqrt{b} = a$" con dollari o barre rovesciate LaTeX non spiegate!
   - Scrivi le formule in modo pulito, naturale e comprensibile per gli studenti:
     * Usa apici per le potenze (es. a² = b, x³ + 2x = 0).
     * Usa simboli matematici chiari: √b per la radice quadrata (es. a = √b), ± per più o meno, · o × per la moltiplicazione, / per le frazioni (es. a/b), ≠, ≤, ≥.
     * Spiega sempre a parole semplici il significato delle formule prima o dopo averle scritte.

3. TEMI E COMPITI DI LETTERATURA O STORIA:
   - Se l'utente chiede un tema o un saggio: non scriverlo per intero. Fornisci la spiegazione del significato della traccia, una scaletta logica (Introduzione, Sviluppo, Conclusione), spunti originali e un breve esempio di incipit per incoraggiarlo a scrivere con parole sue.

4. FOTO DEL COMPITO, QUADERNO O LIBRO (OCR & MULTIMODALITÀ):
   - Se l'utente allega una foto del compito o libro:
     a) Riconosci e trascrivi brevemente l'esercizio con precisione (es. "Ho letto l'esercizio dalla foto: ...").
     b) Avvia la guida socratica spiegando la regola e chiedendo allo studente il primo passaggio.

5. SIMULAZIONE INTERROGAZIONI & QUIZ:
   - Quando l'utente chiede di simulare un'interrogazione o fare un quiz:
     a) Fai UNA SOLA domanda alla volta per mantenere alto il coinvolgimento.
     b) Aspetta la risposta dello studente prima di fare la domanda successiva.
     c) Assegna un voto/valutazione (es. 8/10, o giudizio formativo) con un commento costruttivo su cosa ha fatto bene e cosa approfondire.
     d) Poni quindi la domanda successiva.

6. MAPPE CONCETTUALI & SCHEMI LOGICI:
   - Se l'utente chiede una mappa concettuale o schema riassuntivo:
     a) Disegna uno schema visivo ad albero con linee e frecce chiare (es. [Concetto Principale] ──▶ [Cause / Punti Chiave] ──▶ [Effetti / Date]).
     b) Usa elenchi puntati strutturati e ben spaziati, perfetti per la memoria visiva e da copiare sul quaderno.

7. ORA ESATTA E DATA CORRENTE IN TEMPO REALE:
   - ORA ESATTA CORRENTE: ${formattedTime} (fuso orario: ${userTimeZone}).
   - DATA CORRENTE: ${formattedDate}.
   - Se l'utente ti chiede l'ora o la data (es. "che ore sono", "dimmi l'ora", "che ora è", "ora esatta", "che giorno è oggi", "data di oggi"):
     * Rispondi subito e in modo naturale con l'ora esatta indicata qui sopra (es. "In questo momento sono le ${formattedTime} di ${formattedDate}.").
     * Non dire MAI che non hai un orologio o che non hai accesso all'orario in tempo reale.

${studyResourcesContext}`;
    config.systemInstruction = systemInstruction ? `${defaultSystem}\n\nUser instructions: ${systemInstruction}` : defaultSystem;

    // Build attempts list: prioritize healthy model (bypass models in recent 503/429 cooldown)
    const nowMs = Date.now();
    const isTargetCoolingDown = (modelCooldownUntil[targetModel] || 0) > nowMs;
    const isAltCoolingDown = (modelCooldownUntil[alternateModel] || 0) > nowMs;
    const primaryModel = isTargetCoolingDown && !isAltCoolingDown ? alternateModel : targetModel;
    const secondaryModel = primaryModel === targetModel ? alternateModel : targetModel;

    type Attempt = { model: string; withSearch: boolean; useThinking: boolean };
    const attemptsToTry: Attempt[] = useSearch
      ? [
          { model: primaryModel, withSearch: true, useThinking: true },
          { model: secondaryModel, withSearch: true, useThinking: false },
          { model: secondaryModel, withSearch: false, useThinking: false },
          { model: primaryModel, withSearch: false, useThinking: false },
          { model: secondaryModel, withSearch: false, useThinking: false },
        ]
      : [
          { model: primaryModel, withSearch: false, useThinking: true },
          { model: secondaryModel, withSearch: false, useThinking: false },
          { model: secondaryModel, withSearch: false, useThinking: false },
          { model: primaryModel, withSearch: false, useThinking: false },
        ];

    let clientDisconnected = false;
    res.on('close', () => {
      if (!res.writableFinished && !res.writableEnded) {
        clientDisconnected = true;
      }
    });

    let streamedAnyChunk = false;
    let lastError: unknown = null;
    const dailyExhaustedModels = new Set<string>();
    // Tentativi extra quando si hanno piu' chiavi API nel pool: ogni 429
    // si mette in cooldown la chiave usata e si riprova con la successiva.
    const keyCount = buildPool().length;
    const maxAttempts = attemptsToTry.length + Math.max(0, keyCount - 1) * 2;

    for (let i = 0; i < maxAttempts; i++) {
      if (clientDisconnected) return;
      const attempt = attemptsToTry[Math.min(i, attemptsToTry.length - 1)];
      const { model: candidateModel, withSearch: candidateWithSearch, useThinking } = attempt;
      if (dailyExhaustedModels.has(candidateModel)) {
        // Con una sola chiave non ha senso continuare a girare a vuoto
        if (keyCount <= 1 && i >= attemptsToTry.length - 1) break;
        continue;
      }
      try {
        const attemptConfig: Record<string, unknown> = {
          ...config,
        };
        if (useThinking) {
          attemptConfig.thinkingConfig = {
            thinkingLevel:
              candidateModel === 'gemini-3.1-flash-lite'
                ? ThinkingLevel.MINIMAL
                : ThinkingLevel.LOW,
          };
        } else {
          delete attemptConfig.thinkingConfig;
        }

        if (candidateWithSearch) {
          attemptConfig.tools = [{ googleSearch: {} }];
        } else {
          delete attemptConfig.tools;
        }

        const aiClient = getGeminiClient();
        try {
          const responseStream = await aiClient.models.generateContentStream({
            model: candidateModel,
            contents,
            config: attemptConfig,
          });

          for await (const chunk of responseStream) {
            if (clientDisconnected) return;
            const text = chunk.text ?? '';
            const candidate = chunk.candidates?.[0];
            const groundingChunks = candidate?.groundingMetadata?.groundingChunks;
            let sources: Array<{ uri: string; title: string }> = [];

            if (Array.isArray(groundingChunks)) {
              sources = groundingChunks
                .map((gc) => {
                  const web = (gc as { web?: { uri?: string; title?: string } }).web;
                  return web?.uri ? { uri: web.uri, title: web.title || web.uri } : null;
                })
                .filter((s): s is { uri: string; title: string } => Boolean(s));
            }

            if (text || sources.length > 0) {
              streamedAnyChunk = true;
              res.write(`data: ${JSON.stringify({ text, sources })}\n\n`);
              if (typeof (res as any).flush === 'function') {
                (res as any).flush();
              }
            }
          }
        } catch (streamErr: unknown) {
          // Se la chiave corrente e' in rate-limit la mettiamo in cooldown:
          // il prossimo tentativo usera' automaticamente la chiave successiva.
          if (!streamedAnyChunk && isRateLimitError(streamErr)) {
            markKeyRateLimited(aiClient, 75);
          }
          throw streamErr;
        }

        // Successfully completed streaming
        delete modelCooldownUntil[candidateModel];
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      } catch (attemptErr: unknown) {
        lastError = attemptErr;
        const rawErrStr = (attemptErr as Error)?.message || String(attemptErr || '');
        const lowerErr = rawErrStr.toLowerCase();
        const isAuth =
          lowerErr.includes('permission_denied') ||
          lowerErr.includes('api_key_invalid') ||
          lowerErr.includes('unauthenticated') ||
          lowerErr.includes('401');
        const isDailyQuota =
          lowerErr.includes('perday') ||
          lowerErr.includes('generaterequestsperday') ||
          lowerErr.includes('free_tier_requests');
        const isQuota = lowerErr.includes('429') || lowerErr.includes('resource_exhausted') || lowerErr.includes('quota');
        const is503 = lowerErr.includes('503') || lowerErr.includes('unavailable') || lowerErr.includes('high demand') || lowerErr.includes('overloaded');

        console.warn(`[Fuglor AI] Candidate ${candidateModel} (search=${candidateWithSearch}, thinking=${useThinking}) failed: ${rawErrStr.slice(0, 300)}`);

        if (isDailyQuota) {
          dailyExhaustedModels.add(candidateModel);
          modelCooldownUntil[candidateModel] = Date.now() + 600_000;
        } else if (is503 || isQuota) {
          modelCooldownUntil[candidateModel] = Date.now() + 45_000;
        }

        // Stop immediately on auth errors or after partial output was already streamed
        if (streamedAnyChunk || isAuth) {
          throw attemptErr;
        }

        // Exponential backoff with jitter before retrying
        if (i < maxAttempts - 1 && !clientDisconnected) {
          const nextAttempt = attemptsToTry[Math.min(i + 1, attemptsToTry.length - 1)];
          const jitter = Math.floor(Math.random() * 200);
          const baseDelay =
            nextAttempt.model !== candidateModel && i === 0
              ? 100
              : isQuota
                ? 800 * (i + 1)
                : is503
                  ? 550 * (i + 1)
                  : 300 * (i + 1);
          await new Promise((r) => setTimeout(r, Math.min(baseDelay + jitter, 2000)));
        }
      }
    }

    if (!streamedAnyChunk) {
      throw lastError || new Error('All models temporarily unavailable.');
    }
  } catch (err: unknown) {
    const { message: cleanMsg, isHighDemand } = cleanErrorMessage(err);
    console.warn('Gemini stream completed with advisory:', cleanMsg);
    res.write(`data: ${JSON.stringify({ error: cleanMsg, retryable: isHighDemand })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// Setup HTTP server + Gemini Live API WebSocket bridge (/live) + Vite / static dist
async function startServer() {
  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/live' });

  wss.on('connection', (clientWs, req) => {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(req.url || '/live', 'http://localhost');
    } catch {
      parsedUrl = new URL('/live', 'http://localhost');
    }

    const lang = parsedUrl.searchParams.get('lang') === 'en' ? 'en' : 'it';
    const requestedVoice = parsedUrl.searchParams.get('voice') || 'Kore';
    const userName = (parsedUrl.searchParams.get('name') || '').trim().slice(0, 40);
    const validVoices = ['Kore', 'Puck', 'Fenrir', 'Zephyr', 'Charon'];
    const chosenVoice = validVoices.includes(requestedVoice) ? requestedVoice : 'Kore';

    const now = new Date();
    let formattedDateTime = '';
    try {
      formattedDateTime = new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'it-IT', {
        timeZone: 'Europe/Rome',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      }).format(now);
    } catch {
      formattedDateTime = now.toLocaleString();
    }

    const liveInstruction =
      lang === 'en'
        ? `You are Fuglor AI, a warm, brilliant Socratic study tutor created by Federico, Luca, and Gabriel.${userName ? ` You are talking live with ${userName}.` : ''} You are in a real-time spoken voice conversation: keep responses natural, concise, conversational, and encouraging. Guide the student step by step rather than dumping long lists. Current date and time: ${formattedDateTime}.`
        : `Sei Fuglor AI, un tutor di studio amichevole, brillante ed empatico creato da Federico, Luca e Gabriel.${userName ? ` Stai parlando dal vivo con ${userName}.` : ''} Sei in una conversazione vocale in tempo reale: parla in italiano naturale, diretto, espressivo e conciso (evita elenchi lunghi o sintassi markdown/LaTeX ad alta voce). Usa il metodo socratico per far ragionare lo studente passo dopo passo. Data e ora attuali: ${formattedDateTime}.`;

    let sessionClosed = false;
    let aiClient: GoogleGenAI;
    try {
      aiClient = getGeminiClient();
    } catch (err) {
      const { message } = cleanErrorMessage(err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'error', message }));
        clientWs.close();
      }
      return;
    }

    const sessionPromise = aiClient.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: chosenVoice },
          },
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        systemInstruction: liveInstruction,
      },
      callbacks: {
        onopen: () => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'ready' }));
          }
        },
        onmessage: (message: LiveServerMessage) => {
          if (clientWs.readyState !== WebSocket.OPEN) return;
          const content = message.serverContent;

          if (content?.inputTranscription?.text) {
            clientWs.send(
              JSON.stringify({ type: 'inputTranscript', text: content.inputTranscription.text })
            );
          }
          if (content?.outputTranscription?.text) {
            clientWs.send(
              JSON.stringify({ type: 'outputTranscript', text: content.outputTranscription.text })
            );
          }

          for (const part of content?.modelTurn?.parts ?? []) {
            if (part.inlineData?.data) {
              clientWs.send(
                JSON.stringify({ type: 'audio', data: part.inlineData.data })
              );
            }
          }

          if (content?.interrupted) {
            clientWs.send(JSON.stringify({ type: 'interrupted' }));
          }
          if (content?.turnComplete) {
            clientWs.send(JSON.stringify({ type: 'turnComplete' }));
          }
        },
        onerror: (err: unknown) => {
          const { message } = cleanErrorMessage(err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'error', message }));
          }
        },
        onclose: () => {
          sessionClosed = true;
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'closed' }));
          }
        },
      },
    });

    sessionPromise.catch((err) => {
      const { message } = cleanErrorMessage(err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'error', message }));
        clientWs.close();
      }
    });

    clientWs.on('message', (rawData) => {
      if (sessionClosed) return;
      try {
        const msg = JSON.parse(rawData.toString());
        if (msg.type === 'audio' && typeof msg.data === 'string') {
          sessionPromise
            .then((session) => {
              if (!sessionClosed) {
                session.sendRealtimeInput({
                  audio: { data: msg.data, mimeType: 'audio/pcm;rate=16000' },
                });
              }
            })
            .catch(() => {});
        } else if (msg.type === 'text' && typeof msg.text === 'string' && msg.text.trim()) {
          sessionPromise
            .then((session) => {
              if (!sessionClosed) {
                session.sendRealtimeInput({ text: msg.text.trim() });
              }
            })
            .catch(() => {});
        }
      } catch {
        // Ignore malformed client message
      }
    });

    clientWs.on('error', () => {
      sessionClosed = true;
    });

    clientWs.on('close', () => {
      sessionClosed = true;
      sessionPromise
        .then((session) => {
          try {
            session.close();
          } catch {
            // ignore
          }
        })
        .catch(() => {});
    });
  });

  wss.on('error', (err) => {
    console.warn('[Fuglor Live WSS error]:', err.message);
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Fuglor AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
