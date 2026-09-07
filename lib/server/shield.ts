// Shared OpenRouter caller, redaction, and guardrails for the
// check-a-message / explain-tech / family-note tools.
// Ported from the scam-shield Express app; response shapes are identical.

const MODEL = process.env.SHIELD_MODEL || "liquid/lfm-2.5-2.6b:free";

export const SHIELD_MAX_INPUT = 4000;

export const SENSITIVE_NOTE =
  "You do not need to share account or card numbers here to get help. I removed them before checking, and I can still help without them.";

export type ShieldError = Error & { code?: string; retry?: boolean };

async function fetchWithTimeout(url: string, options: RequestInit = {}, ms = 25000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function askShield({
  system,
  user,
  maxTokens = 500,
}: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<{ json: Record<string, unknown> | null; raw: string }> {
  const key = process.env.OPENROUTER_API_KEY || "";
  if (!key) {
    const e = new Error("The helper service is not set up yet (missing API key).") as ShieldError;
    e.code = "NO_KEY";
    throw e;
  }
  let r: Response;
  try {
    r = await fetchWithTimeout(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "X-Title": "ScamGym Shield Tools",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          max_tokens: maxTokens,
          temperature: 0.3,
          response_format: { type: "json_object" },
        }),
      },
      25000
    );
  } catch (e) {
    const err = new Error(
      (e as Error)?.name === "AbortError"
        ? "The check took too long. Please try again in a moment."
        : "Could not reach the helper service. Check your connection and try again."
    ) as ShieldError;
    err.code = (e as Error)?.name === "AbortError" ? "TIMEOUT" : "NETWORK";
    throw err;
  }
  if (r.status === 401 || r.status === 403) {
    const e = new Error("The helper service key is not working. Please tell whoever set up this app.") as ShieldError;
    e.code = "AUTH";
    throw e;
  }
  if (r.status === 402 || r.status === 429) {
    const e = new Error("The helper service is busy right now. Please wait a minute and try again.") as ShieldError;
    e.code = "BUSY";
    e.retry = true;
    throw e;
  }
  if (!r.ok) {
    const e = new Error("The helper service had a problem. Please try again in a moment.") as ShieldError;
    e.code = "UPSTREAM_" + r.status;
    e.retry = true;
    throw e;
  }
  let data: { choices?: Array<{ message?: { content?: string } }> };
  try {
    data = (await r.json()) as typeof data;
  } catch {
    const e = new Error("Got an unreadable reply from the helper service. Please try again.") as ShieldError;
    e.code = "BAD_RESPONSE";
    e.retry = true;
    throw e;
  }
  const raw = data.choices?.[0]?.message?.content?.trim() || "";
  if (!raw) {
    const e = new Error("Got an empty reply from the helper service. Please try again.") as ShieldError;
    e.code = "EMPTY";
    e.retry = true;
    throw e;
  }
  try {
    return { json: JSON.parse(raw) as Record<string, unknown>, raw };
  } catch {
    return { json: null, raw };
  }
}

// Looks for card-like and SSN-like digit runs. Phone numbers are left alone
// on purpose: "they told me to call 1-800…" is useful signal, not a secret.
const CARD_RUN = /\b\d(?:[\s-]*\d){12,18}\b/g;
const SSN_RUN = /\b\d{3}[\s-]?\d{2}[\s-]?\d{4}\b/g;
const CVV_RUN = /\b(cv[vv]|cvc|security code)\W{0,5}\d{3,4}\b/gi;

export function scrubSensitive(text: string): { found: boolean; kinds: string[]; redacted: string } {
  const kinds: string[] = [];
  let redacted = text;
  CARD_RUN.lastIndex = 0;
  if (CARD_RUN.test(text)) kinds.push("card number");
  CARD_RUN.lastIndex = 0;
  redacted = redacted.replace(CARD_RUN, "[number removed]");
  SSN_RUN.lastIndex = 0;
  if (SSN_RUN.test(text)) kinds.push("ID number");
  SSN_RUN.lastIndex = 0;
  redacted = redacted.replace(SSN_RUN, "[number removed]");
  CVV_RUN.lastIndex = 0;
  if (CVV_RUN.test(text)) kinds.push("security code");
  CVV_RUN.lastIndex = 0;
  redacted = redacted.replace(CVV_RUN, "$1 [removed]");
  return { found: kinds.length > 0, kinds, redacted };
}

export function cleanInput(text: unknown): { text?: string; truncated?: boolean; error?: string } {
  if (typeof text !== "string" || !text.trim()) {
    return { error: "Please type or paste a few words first, then press the button." };
  }
  const trimmed = text.trim();
  const truncated = trimmed.length > SHIELD_MAX_INPUT;
  return { text: truncated ? trimmed.slice(0, SHIELD_MAX_INPUT) : trimmed, truncated };
}

// Gentle per-IP throttle so one device can't burn the shared key.
const hits = new Map<string, number[]>();

export function shieldThrottled(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 60000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 30;
}

export function shieldStatusFor(code?: string): number {
  if (code === "NO_KEY" || code === "AUTH") return 503;
  if (code === "BUSY") return 429;
  return 502;
}

export const SCAM_SYSTEM = `You are Scam Shield, a calm helper for older adults who may be worried about a scam.
Write in plain everyday words. Short sentences. Kind and steady, never alarming, never blaming the reader. No exclamation marks.
Common scam signs to weigh: pressure to act right now, threats, requests for gift cards, wire transfers or crypto, asks for passwords or codes from texts, callers claiming to be a bank, the government, tech support or a grandchild in trouble, prizes or lotteries, romance contacts asking for money, pop-ups demanding a phone call.
Reply with ONLY a JSON object, no other text:
{"verdict": "scam" or "safe" or "unsure", "headline": "one short sentence", "reasons": ["reason one", "reason two"], "next_step": "one concrete action, naming who to contact and how, e.g. hang up and call the number on the back of your bank card"}
Give 2 or 3 reasons, each under 30 words. If you are not certain, use "unsure" and say what to watch for. Always include a concrete next step, never only "be careful". Never ask for card numbers or passwords. If the message is not in English, reply in that language when you can; otherwise use simple English and note it in the headline.`;

export const EXPLAIN_SYSTEM = `You are Scam Shield, a calm helper that explains confusing computer and phone situations to older adults.
Write in plain everyday words. Short sentences. Kind and steady, never alarming, never blaming the reader. No exclamation marks.
Treat pop-ups demanding a phone call, fake virus warnings, and callers claiming to be Microsoft or Apple as scams unless there is clear evidence otherwise. Real companies do not call out of the blue about viruses, and a web page cannot scan your computer.
Reply with ONLY a JSON object, no other text:
{"happening": "what is actually going on, under 60 words", "not_meaning": "one thing this does NOT mean, under 30 words", "next_step": "one concrete safe action, under 40 words"}
If you are not certain, say so plainly inside "happening". Never ask for card numbers or passwords. If the message is not in English, reply in that language when you can; otherwise use simple English.`;

export const FAMILY_SYSTEM = `You are Scam Shield. Write a short note an older adult can show a family member to ask for a second opinion about a possible scam.
Plain everyday words, warm tone, no blame, no jargon, no exclamation marks. Under 100 words. End with one clear question the family member can help answer, such as whether to call the bank together.
Reply with ONLY a JSON object: {"summary": "the note text"}`;

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
