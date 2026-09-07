import { NextResponse } from "next/server";
import {
  askShield,
  cleanInput,
  clientIp,
  scrubSensitive,
  SENSITIVE_NOTE,
  EXPLAIN_SYSTEM,
  shieldStatusFor,
  shieldThrottled,
  type ShieldError,
} from "@/lib/server/shield";
import { explainRequestSchema } from "@/lib/schemas";

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
        { ok: false, error: "Too many requests at once. Please wait a minute.", retry: true },
        { status: 429 }
      );
    }
    const parsed = explainRequestSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Please describe what you are seeing first, then press the button." },
        { status: 400 }
      );
    }
    const cleaned = cleanInput(parsed.data.text);
    if (cleaned.error || !cleaned.text) {
      return NextResponse.json({ ok: false, error: cleaned.error || "Please describe what you are seeing first." }, { status: 400 });
    }
    const sensitive = scrubSensitive(cleaned.text);
    try {
      const { json, raw } = await askShield({ system: EXPLAIN_SYSTEM, user: sensitive.redacted, maxTokens: 400 });
      if (!json || !json.happening) {
        return NextResponse.json({
          ok: true,
          happening: "I could not explain this clearly just now, and I do not want to guess.",
          not_meaning: "This does not mean you did anything wrong.",
          next_step: "Close the window or hang up, do not call any number shown there, and ask someone you trust to look with you.",
          fallback: true,
          raw: json ? undefined : raw.slice(0, 500),
          ...(sensitive.found ? { sensitiveNote: SENSITIVE_NOTE, sensitiveKinds: sensitive.kinds } : {}),
        });
      }
      return NextResponse.json({
        ok: true,
        happening: String(json.happening).slice(0, 800),
        not_meaning: String(json.not_meaning || "").slice(0, 300),
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
