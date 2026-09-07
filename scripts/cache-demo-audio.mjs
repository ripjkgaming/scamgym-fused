import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const lines = [
  "Hello, this is the bank security team. We detected an unfamiliar card payment of eight hundred and forty dollars. Did you make it?",
  "I understand. Your account may be frozen unless we verify it now. Please stay on this call while I secure it.",
  "There is no time to call the number on your card. I can move the funds to a protected account for you now.",
  "If you hang up, the payment may go through. Are you sure you want to take that risk?",
  "That is a safe choice. This practice call is now complete.",
];

const apiKey = process.env.ELEVENLABS_API_KEY;
const voiceId = process.env.ELEVENLABS_CALLER_VOICE_ID;
if (!apiKey || !voiceId) throw new Error("Set ELEVENLABS_API_KEY and ELEVENLABS_CALLER_VOICE_ID first.");

const outputDir = path.join(process.cwd(), "public", "demo-audio");
await mkdir(outputDir, { recursive: true });
for (const [index, text] of lines.entries()) {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "xi-api-key": apiKey },
    body: JSON.stringify({ text, model_id: "eleven_flash_v2_5", voice_settings: { stability: 0.48, similarity_boost: 0.72, style: 0.28, use_speaker_boost: true, speed: 0.96 } }),
  });
  if (!response.ok) throw new Error(`Audio ${index} failed with ${response.status}: ${await response.text()}`);
  await writeFile(path.join(outputDir, `bank-${index}.mp3`), Buffer.from(await response.arrayBuffer()));
  process.stdout.write(`Cached bank-${index}.mp3\n`);
}
