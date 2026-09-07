import { NextResponse } from "next/server";
import {
  askShield,
  clientIp,
  scrubSensitive,
  SENSITIVE_NOTE,
  FAMILY_SYSTEM,
  SHIELD_MAX_INPUT,
  shieldStatusFor,
  shieldThrottled,
  type ShieldError,
} from "@/lib/server/shield";
import { familyRequestSchema } from "@/lib/schemas";

function fail(e: unknown, sensitive: { found: boolean; kinds: string[] }) {
  const err = e as ShieldError;
  return NextResponse.json(
    {
      ok: false,
      error: err.message || "Something went wrong.",
      retry: Boolean(err.retry),
      ...(sensitive?.found ? { sensitiveNote: SENSITIVE_NOTE } : {}),
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
    const parsed = familyRequestSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "There is no recent check to summarize yet. Run a check first." },
        { status: 400 }
      );
    }
    const situation = parsed.data.situation.trim().slice(0, SHIELD_MAX_INPUT);
    if (!situation) {
      return NextResponse.json(
        { ok: false, error: "There is no recent check to summarize yet. Run a check first." },
        { status: 400 }
      );
    }
    const sensitive = scrubSensitive(situation);
    try {
      const { json } = await askShield({
        system: FAMILY_SYSTEM,
        user: `What happened: ${sensitive.redacted}\nChecker said: ${parsed.data.headline}\nSuggested step: ${parsed.data.nextStep}`,
        maxTokens: 250,
      });
      return NextResponse.json({
        ok: true,
        summary: json?.summary
          ? String(json.summary).slice(0, 800)
          : "I looked into something that worried me and I would like your opinion before I do anything.",
        ...(sensitive.found ? { sensitiveNote: SENSITIVE_NOTE } : {}),
      });
    } catch (e) {
      return fail(e, sensitive);
    }
  } catch (e) {
    return fail(e, { found: false, kinds: [] });
  }
}
