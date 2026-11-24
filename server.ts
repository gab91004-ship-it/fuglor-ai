/**
 * Fuglor AI — Server di produzione con Express + Vite
 * Multi-provider: ogni provider ha un POOL di chiavi API con rotazione automatica.
 * Provider supportati (configurabili via .env): OpenAI, Groq, Gemini, Mistral, Cohere, DeepSeek, Together, Cerebras
 */

import express from "express";
import type { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

// ==================== CONFIGURAZIONE PROVIDER ====================

type ProviderType = "gemini" | "openai-compatible";

interface ProviderConfig {
  type: ProviderType;
  label: string;
  models: string[]; // lista modelli per fallback
  keys: string[];   // pool di chiavi
  baseUrl?: string; // per openai-compatible
}

const providers: ProviderConfig[] = [];

function buildKeys(prefix: string, listEnv?: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (k?: string) => {
    if (!k) return;
    for (const part of k.split(",")) {
      const t = part.trim();
      if (t && !seen.has(t)) { seen.add(t); out.push(t); }
    }
  };
  push(process.env[prefix]);
  if (listEnv) push(process.env[listEnv]);
  for (let i = 2; i <= 20; i++) push(process.env[`${prefix}_${i}`]);
  return out;
}

function registerProvider(p: ProviderConfig) {
  if (p.keys.length > 0) providers.push(p);
}

registerProvider({
  type: "gemini",
  label: "Gemini",
  models: ["gemini-2.5-flash", "gemini-2.0-flash"],
  keys: buildKeys("GEMINI_API_KEY", "GEMINI_API_KEYS"),
});

registerProvider({
  type: "openai-compatible",
  label: "OpenAI",
  baseUrl: "https://api.openai.com/v1",
  models: ["gpt-4o-mini", "gpt-4.1-mini"],
  keys: buildKeys("OPENAI_API_KEY", "OPENAI_API_KEYS"),
});

registerProvider({
  type: "openai-compatible",
  label: "Groq",
  baseUrl: "https://api.groq.com/openai/v1",
  models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
  keys: buildKeys("GROQ_API_KEY", "GROQ_API_KEYS"),
});

registerProvider({
  type: "openai-compatible",
  label: "Mistral",
  baseUrl: "https://api.mistral.ai/v1",
  models: ["mistral-small-latest", "open-mixtral-8x22b"],
  keys: buildKeys("MISTRAL_API_KEY", "MISTRAL_API_KEYS"),
});

registerProvider({
  type: "openai-compatible",
  label: "Cohere",
  baseUrl: "https://api.cohere.com/v2",
  models: ["c4ai-aya-expanse-8b", "command-r7b-arabic-02-2025"],
  keys: buildKeys("COHERE_API_KEY", "COHERE_API_KEYS"),
});

registerProvider({
  type: "openai-compatible",
  label: "DeepSeek",
  baseUrl: "https://api.deepseek.com/v1",
  models: ["deepseek-chat"],
  keys: buildKeys("DEEPSEEK_API_KEY", "DEEPSEEK_API_KEYS"),
});

registerProvider({
  type: "openai-compatible",
  label: "Together",
  baseUrl: "https://api.together.xyz/v1",
  models: ["meta-llama/Llama-3.3-70B-Instruct-Turbo-Free", "deepseek-ai/DeepSeek-R1-Distill-Qwen-14B"],
  keys: buildKeys("TOGETHER_API_KEY", "TOGETHER_API_KEYS"),
});

registerProvider({
  type: "openai-compatible",
  label: "Cerebras",
  baseUrl: "https://api.cerebras.ai/v1",
  models: ["llama3.1-8b", "qwen3-32b"],
  keys: buildKeys("CEREBRAS_API_KEY", "CEREBRAS_API_KEYS"),
});

// Priorità: prima i provider gratuiti (più capacità), poi a pagamento
const FREE_PROVIDERS = new Set(["Gemini", "Groq", "Cerebras", "Together"]);
providers.sort((a, b) => {
  const fa = FREE_PROVIDERS.has(a.label) ? 0 : 1;
  const fb = FREE_PROVIDERS.has(b.label) ? 0 : 1;
  if (fa !== fb) return fa - fb;
  return b.keys.length - a.keys.length;
});

console.log(`[IntelliAI] Provider attivi: ${providers.map(p => `${p.label}(${p.keys.length})`).join(", ") || "NESSUNO"}`);

// ==================== COOLDOWN ====================

const keyCooldowns = new Map<string, number>();   // "provider:key" -> timestamp rilascio
const modelCooldowns = new Map<string, number>(); // "provider:model" -> timestamp rilascio

function isCoolingDown(m: Map<string, number>, k: string): boolean {
  const until = m.get(k);
  if (!until) return false;
  if (Date.now() >= until) { m.delete(k); return false; }
  return true;
}

// Slot = combinazione provider+modello+chiave, enumerata una volta all'avvio
interface Slot {
  provider: ProviderConfig;
  model: string;
  key: string;
}

const allSlots: Slot[] = providers.flatMap((p) =>
  p.models.flatMap((m) => p.keys.map((k) => ({ provider: p, model: m, key: k })))
);

let rrCursor = 0;

function slotKeyOf(s: Slot): string {
  return `${s.provider.label}:${s.model}:${s.key}`;
}

function nextSlot(): Slot | null {
  const total = allSlots.length;
  if (total === 0) return null;
  // prima cerca uno slot libero partendo dal cursore
  for (let n = 0; n < total; n++) {
    const s = allSlots[(rrCursor + n) % total];
    if (isCoolingDown(keyCooldowns, `${s.provider.label}:${s.key}`)) continue;
    if (isCoolingDown(modelCooldowns, `${s.provider.label}:${s.model}`)) continue;
    rrCursor = (rrCursor + n + 1) % total;
    return s;
  }
  // tutti in cooldown: scegli quello che si libera prima (attesa minima)
  let best: Slot | null = null;
  let bestUntil = Infinity;
  for (const s of allSlots) {
    const ku = keyCooldowns.get(`${s.provider.label}:${s.key}`) ?? 0;
    const mu = modelCooldowns.get(`${s.provider.label}:${s.model}`) ?? 0;
    const until = Math.max(ku, mu);
    if (until < bestUntil) { bestUntil = until; best = s; }
  }
  return best;
}

function markRateLimited(s: Slot, ms: number) {
  keyCooldowns.set(`${s.provider.label}:${s.key}`, Date.now() + ms);
}

function markKeyInvalid(s: Slot) {
  keyCooldowns.set(`${s.provider.label}:${s.key}`, Date.now() + 24 * 3600_000);
}

function markModelUnavailable(s: Slot) {
  modelCooldowns.set(`${s.provider.label}:${s.model}`, Date.now() + 24 * 3600_000);
}

// ==================== CHAT UNIFICATA ====================

async function chatComplete(
  messages: { role: string; content: string }[],
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<{ text: string; slot: Slot }> {
  const attempts = Math.max(8, allSlots.length);
  let lastErr: any = null;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const slot = nextSlot();
    if (!slot) break;
    try {
      if (slot.provider.type === "gemini") {
        const ai = new GoogleGenAI({ apiKey: slot.key });
        const contents = messages
          .filter((m) => m.role !== "system")
          .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
        const sys = messages.find((m) => m.role === "system")?.content;
        const res = await ai.models.generateContent({
          model: slot.model,
          contents,
          config: { temperature: opts.temperature ?? 0.7, systemInstruction: sys },
        });
        return { text: res.text ?? "", slot };
      } else {
        const client = new OpenAI({ apiKey: slot.key, baseURL: slot.provider.baseUrl });
        const res = await client.chat.completions.create({
          model: slot.model,
          messages: messages as any,
          temperature: opts.temperature ?? 0.7,
          max_tokens: opts.maxTokens,
        });
        return { text: res.choices[0]?.message?.content ?? "", slot };
      }
    } catch (e: any) {
      lastErr = e;
      const status = e?.status ?? e?.response?.status;
      const msg = String(e?.message ?? "");
      if (status === 429 || /quota|rate.?limit|exhausted/i.test(msg)) {
        markRateLimited(slot, 75_000);
        console.warn(`[IntelliAI] ${slot.provider.label}/${slot.model} chiave ****${slot.key.slice(-4)} rate-limit → cooldown 75s`);
      } else if (status === 401 || status === 403) {
        markKeyInvalid(slot);
        console.warn(`[IntelliAI] ${slot.provider.label} chiave ****${slot.key.slice(-4)} non valida → esclusa 24h`);
      } else if (status === 404 || /model.*(not found|does not exist|unsupported)/i.test(msg)) {
        markModelUnavailable(slot);
        console.warn(`[IntelliAI] ${slot.provider.label}/${slot.model} modello non disponibile → escluso 24h`);
      } else {
        console.error(`[IntelliAI] Errore ${slot.provider.label}/${slot.model}:`, msg);
        markRateLimited(slot, 15_000);
      }
    }
  }
  throw lastErr ?? new Error("Nessun provider AI configurato");
}

// ==================== VITE + EXPRESS ====================

const viteDevServer = await createViteServer({
  server: { middlewareMode: true },
  appType: "custom",
  base: "./",
});

const app = express();
app.use(express.json({ limit: "25mb" }));
app.use(viteDevServer.middlewares);

const systemPrompt = `Sei IntelliAI, l'assistente personale del Preside della scuola Fuglor. Sei stato creato da lui e sei sempre al suo fianco. Rispondi sempre in italiano, in modo diretto, pratico e professionale. Non sei un assistente generico: sei il braccio destro del Preside.`;

app.post("/api/chat", async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });
  try {
    const { text, slot } = await chatComplete([
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ]);
    res.json({ reply: text, provider: slot.provider.label, model: slot.model });
  } catch (e: any) {
    res.status(503).json({ error: e.message || "Servizio AI temporaneamente non disponibile." });
  }
});

app.post("/api/chat/stream", async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const { text } = await chatComplete([
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ]);
    const chunkSize = 12;
    for (let i = 0; i < text.length; i += chunkSize) {
      res.write(`data: ${JSON.stringify({ text: text.slice(i, i + chunkSize) })}\n\n`);
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (e: any) {
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
    res.end();
  }
});

// ==================== TTS & TRASCRIZIONE (solo Gemini) ====================

const geminiKeys = () => providers.find((p) => p.label === "Gemini")?.keys ?? [];

app.post("/api/tts", async (req: Request, res: Response) => {
  const { text, voice = "it-IT-Female-1", language = "it" } = req.body;
  if (!text) return res.status(400).json({ error: "Text required" });

  const voicesByLang: Record<string, string[]> = {
    it: ["it-IT-Female-1", "it-IT-Male-1", "Puck", "Charon"],
    en: ["en-US-Female-1", "en-US-Male-1", "Kore", "Fenrir"],
    ru: ["ru-RU-Female-1", "ru-RU-Male-1", "Zephyr", "Leda"],
  };
  const voicesToTry = [voice, ...(voicesByLang[language] ?? voicesByLang.it)];
  const keys = geminiKeys();
  let lastError: any = null;

  for (const v of voicesToTry) {
    for (let attempt = 0; attempt < Math.max(keys.length, 1) * 2; attempt++) {
      const slot = nextSlotGemini();
      if (!slot) break;
      try {
        const ai = new GoogleGenAI({ apiKey: slot.key });
        const result = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ role: "user", parts: [{ text: `Riproduci questo testo ad alta voce: "${text}"` }] }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: v } } },
          } as any,
        });
        const audioPart = (result as any).candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
        if (audioPart?.inlineData?.data) {
          res.json({ audio: audioPart.inlineData.data, mimeType: audioPart.inlineData.mimeType || "audio/wav", voice: v });
          return;
        }
      } catch (err: any) {
        lastError = err;
        const status = err?.status;
        if (status === 429 || /quota|rate.?limit/i.test(err?.message ?? "")) {
          markRateLimited({ ...slot, model: "tts" }, 75_000);
          continue;
        }
        if (status === 404 || /voice|model/i.test(err?.message ?? "")) break; // prova voce successiva
      }
    }
  }
  res.status(503).json({ error: "TTS non disponibile.", detail: lastError?.message });
});

function nextSlotGemini(): Slot | null {
  const gem = providers.filter((p) => p.label === "Gemini");
  const slots = gem.flatMap((p) => p.models.flatMap((m) => p.keys.map((k) => ({ provider: p, model: m, key: k }))));
  for (const s of slots) {
    if (isCoolingDown(keyCooldowns, `${s.provider.label}:${s.key}`)) continue;
    return s;
  }
  return slots[0] ?? null;
}

app.post("/api/transcribe", async (req: Request, res: Response) => {
  const { audio, mimeType = "audio/webm" } = req.body;
  if (!audio) return res.status(400).json({ error: "Audio required" });

  let lastError: any = null;
  for (let attempt = 0; attempt < Math.max(geminiKeys().length, 1) * 2; attempt++) {
    const slot = nextSlotGemini();
    if (!slot) break;
    try {
      const ai = new GoogleGenAI({ apiKey: slot.key });
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ inlineData: { mimeType, data: audio } }, { text: "Trascrivi esattamente quello che viene detto nell'audio, senza aggiungere commenti." }] }],
      });
      res.json({ transcript: result.text });
      return;
    } catch (err: any) {
      lastError = err;
      const status = err?.status;
      if (status === 429 || /quota|rate.?limit/i.test(err?.message ?? "")) {
        markRateLimited({ ...slot, model: "transcribe" }, 75_000);
      } else if (status === 401 || status === 403) {
        markKeyInvalid(slot);
      }
    }
  }
  res.status(503).json({ error: "Trascrizione non disponibile.", detail: lastError?.message });
});

// ==================== HEALTH ====================

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    name: "Fuglor AI",
    providers: providers.map((p) => ({
      name: p.label,
      keys: p.keys.length,
      models: p.models.filter((m) => !isCoolingDown(modelCooldowns, `${p.label}:${m}`)),
    })),
    totalCapacity: providers.reduce((s, p) => s + p.keys.length, 0),
    coolingDown: keyCooldowns.size,
  });
});

app.use(express.static(__dirname));

const server = app.listen(Number(PORT), "::", () => {
  console.log(`Server running on port ${PORT}`);
});

server.on("upgrade", (request, socket, head) => {
  viteDevServer.httpServer?.emit("upgrade", request, socket, head);
});
