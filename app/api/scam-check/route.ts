import { NextResponse } from "next/server";
import {
  askShield,
  cleanInput,
  clientIp,
  scrubSensitive,
  SENSITIVE_NOTE,
  SCAM_SYSTEM,
  shieldStatusFor,
  shieldThrottled,
  type ShieldError,
} from "@/lib/server/shield";
import { scamCheckSchema } from "@/lib/schemas";

function fail(e: unknown, sensitive: { found: boolean; kinds: string[] }, truncated = false) {
  const err = e as ShieldError;
  return NextResponse.json(
    {
      ok: false,
      error: err.message || "Something went wrong.",
      retry: Boolean(err.retry),
      ...(sensitive?.found ? { sensitiveNote: SENSITIVE_NOTE, sensitiveKinds: sensitive.kinds } : {}),
      ...(truncated ? { truncated: true } : {}),
    },
    { status: shieldStatusFor(err.code) }
  );
}

export async function POST(request: Request) {
  try {
    if (shieldThrottled(clientIp(request))) {
      return NextResponse.json(
        { ok: false, error: "Too many checks at once. Please wait a minute.", retry: true },
        { status: 429 }
      );
    }
    const parsed = scamCheckSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Please type or paste a few words first, then press the button." },
        { status: 400 }
      );
    }
    const cleaned = cleanInput(parsed.data.text);
    if (cleaned.error || !cleaned.text) {
      return NextResponse.json({ ok: false, error: cleaned.error || "Please type or paste a few words first." }, { status: 400 });
    }
    const sensitive = scrubSensitive(cleaned.text);
    try {
      const { json, raw } = await askShield({ system: SCAM_SYSTEM, user: sensitive.redacted });
      if (!json || !["scam", "safe", "unsure"].includes(String(json.verdict))) {
        // A failed or garbled check must never read as "looks fine".
        return NextResponse.json({
          ok: true,
          verdict: "unsure",
          headline: "I could not give a clear answer just now.",
          reasons: ["The helper's reply was unclear, so I will not guess.", "Please read the warning signs below and ask someone you trust."],
          next_step: "Do not send money or share codes. If anyone is pressuring you, hang up and talk to a family member or call your bank on its official number.",
          fallback: true,
          raw: json ? undefined : raw.slice(0, 500),
          ...(sensitive.found ? { sensitiveNote: SENSITIVE_NOTE, sensitiveKinds: sensitive.kinds } : {}),
          ...(cleaned.truncated ? { truncated: true } : {}),
        });
      }
      return NextResponse.json({
        ok: true,
        verdict: json.verdict,
        headline: String(json.headline || "").slice(0, 300),
        reasons: Array.isArray(json.reasons) ? json.reasons.map(String).slice(0, 4) : [],
        next_step: String(json.next_step || "").slice(0, 400),
        ...(sensitive.found ? { sensitiveNote: SENSITIVE_NOTE, sensitiveKinds: sensitive.kinds } : {}),
        ...(cleaned.truncated ? { truncated: true } : {}),
      });
    } catch (e) {
      return fail(e, sensitive, cleaned.truncated);
    }
  } catch (e) {
    return fail(e, { found: false, kinds: [] });
  }
}
