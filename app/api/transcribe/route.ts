import { NextResponse } from "next/server";
import { languageSchema } from "@/lib/schemas";
import { redactSensitive } from "@/lib/redact";
import { withRetry } from "@/lib/server/retry";

const sttLanguage = { en: "eng", zh: "zho", ms: "msa", ta: "tam" } as const;

export async function POST(request: Request) {
  try {
    if (!process.env.ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY is not configured");
    const incoming = await request.formData();
    const file = incoming.get("audio");
    const language = languageSchema.parse(incoming.get("language"));
    if (!(file instanceof File) || file.size < 256) {
      return NextResponse.json({ error: "No speech was recorded." }, { status: 400 });
    }
    const result = await withRetry(async (signal) => {
      const form = new FormData();
      form.set("file", file, file.name || "reply.webm");
      form.set("model_id", "scribe_v2");
      form.set("language_code", sttLanguage[language]);
      const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
        method: "POST",
        headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! },
        body: form,
        signal,
      });
      if (!response.ok) throw new Error(`ElevenLabs transcription failed: ${response.status}`);
      return response.json() as Promise<{ text?: string; language_code?: string }>;
    }, 15_000);
    if (!result.text?.trim()) return NextResponse.json({ error: "No speech was detected." }, { status: 422 });
    const clean = redactSensitive(result.text.trim());
    return NextResponse.json({ transcript: clean.text, language, redacted: clean.redacted });
  } catch (error) {
    console.error("Transcription failed", error);
    return NextResponse.json({ error: "Could not transcribe the recording." }, { status: 503 });
  }
}
