import { NextResponse } from "next/server";
import { z } from "zod";
import { languageSchema } from "@/lib/schemas";
import { withRetry } from "@/lib/server/retry";

const speechRequestSchema = z.object({
  text: z.string().min(1).max(800),
  language: languageSchema,
  role: z.enum(["caller", "coach"]),
});

export async function POST(request: Request) {
  try {
    if (!process.env.ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY is not configured");
    const body = speechRequestSchema.parse(await request.json());
    const voiceId = body.role === "caller" ? process.env.ELEVENLABS_CALLER_VOICE_ID : process.env.ELEVENLABS_COACH_VOICE_ID;
    if (!voiceId) throw new Error(`ElevenLabs ${body.role} voice is not configured`);

    const response = await withRetry(async (signal) => {
      const result = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream?output_format=mp3_44100_128`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "xi-api-key": process.env.ELEVENLABS_API_KEY! },
        body: JSON.stringify({
          text: body.text,
          model_id: "eleven_flash_v2_5",
          voice_settings: body.role === "caller"
            ? { stability: 0.48, similarity_boost: 0.72, style: 0.28, use_speaker_boost: true, speed: 0.96 }
            : { stability: 0.7, similarity_boost: 0.65, style: 0.08, use_speaker_boost: true, speed: 0.92 },
        }),
        signal,
      });
      if (!result.ok) throw new Error(`ElevenLabs speech failed: ${result.status}`);
      return result;
    }, 15_000);

    return new Response(response.body, {
      headers: {
        "Content-Type": response.headers.get("content-type") || "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Speech generation failed", error);
    return NextResponse.json({ error: "Could not generate speech." }, { status: 503 });
  }
}
