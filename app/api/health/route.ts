import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    simulator: Boolean(process.env.OPENROUTER_API_KEY),
    simModel: process.env.SIM_MODEL || "google/gemma-4-31b-it:free",
    elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY),
    voices: Boolean(process.env.ELEVENLABS_CALLER_VOICE_ID && process.env.ELEVENLABS_COACH_VOICE_ID),
    shield: Boolean(process.env.OPENROUTER_API_KEY),
    shieldModel: process.env.SHIELD_MODEL || "liquid/lfm-2.5-2.6b:free",
  });
}
