import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    openai: Boolean(process.env.OPENAI_API_KEY),
    elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY),
    voices: Boolean(process.env.ELEVENLABS_CALLER_VOICE_ID && process.env.ELEVENLABS_COACH_VOICE_ID),
    shield: Boolean(process.env.OPENROUTER_API_KEY),
  });
}
