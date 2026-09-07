import { readFile } from "node:fs/promises";

const baseUrl = process.env.SCAMGYM_URL || "http://127.0.0.1:3000";
const scenarios = [
  ["bank_fraud", "alert", "fear"],
  ["government_impersonation", "case", "authority"],
  ["parcel_delivery", "delivery", "urgency"],
];
const languages = ["en", "zh", "ms", "ta"];

async function request(path, init = {}, timeoutMs = 30_000) {
  const response = await fetch(`${baseUrl}${path}`, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error(`${path} returned ${response.status}: ${await response.text()}`);
  return response;
}

async function checkTurns() {
  for (const language of languages) {
    const results = await Promise.all(scenarios.map(async ([scenario, currentStage, expectedTactic]) => {
      const response = await request("/api/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario, language, currentStage, history: [], elapsedTime: 0 }),
      });
      const turn = await response.json();
      if (typeof turn.spokenText !== "string" || !turn.spokenText.trim()) throw new Error(`${scenario}/${language} returned no dialogue`);
      if (turn.tactic !== expectedTactic) throw new Error(`${scenario}/${language} escaped its configured tactic`);
      return `${scenario}/${language}`;
    }));
    console.log(`turns: ${results.join(", ")}`);
  }
}

async function checkSpeech() {
  const samples = { en: "End the call and verify.", zh: "结束通话并自行核实。", ms: "Tamatkan panggilan dan semak sendiri.", ta: "அழைப்பை முடித்து சரிபார்க்கவும்." };
  for (const [language, text] of Object.entries(samples)) {
    const response = await request("/api/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language, role: "coach" }),
    });
    const bytes = (await response.arrayBuffer()).byteLength;
    if (!response.headers.get("content-type")?.startsWith("audio/") || bytes < 500) throw new Error(`speech/${language} returned invalid audio`);
    console.log(`speech: ${language} (${bytes} bytes)`);
  }
}

async function checkDebrief() {
  const response = await request("/api/debrief", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scenario: "bank_fraud",
      language: "en",
      forcedOutcome: "safe_exit",
      history: [
        { id: "caller-1", role: "caller", text: "Your account may be frozen unless you act now.", timestampMs: 0, tactic: "urgency" },
        { id: "user-1", role: "user", text: "No. I will hang up, call the official number, and ask my daughter to help me check.", timestampMs: 1000 },
      ],
    }),
  });
  const debrief = await response.json();
  if (!Number.isInteger(debrief.score) || debrief.score < 0 || debrief.score > 100 || debrief.evidence?.length !== 5) throw new Error("debrief returned an invalid deterministic score");
  console.log(`debrief: ${debrief.score}/100 with ${debrief.evidence.length} evidence rows`);
}

async function checkTranscription() {
  const audioPath = new URL("../public/demo-audio/bank-0.mp3", import.meta.url);
  try {
    const audio = await readFile(audioPath);
    const form = new FormData();
    form.set("audio", new Blob([audio], { type: "audio/mpeg" }), "bank-0.mp3");
    form.set("language", "en");
    const response = await request("/api/transcribe", { method: "POST", body: form });
    const result = await response.json();
    if (typeof result.transcript !== "string" || !result.transcript.trim()) throw new Error("transcription returned no text");
    console.log(`transcription: ${result.transcript.length} characters`);
  } catch (error) {
    if (error?.code === "ENOENT") {
      console.log("transcription: skipped (run npm run cache:demo-audio first)");
      return;
    }
    throw error;
  }
}

const health = await (await request("/api/health", {}, 5_000)).json();
if (!health.simulator || !health.elevenlabs || !health.voices) throw new Error("health check reports missing configuration");
console.log("health: configured");
await checkTurns();
await checkSpeech();
await checkTranscription();
await checkDebrief();
console.log("live smoke test passed");
