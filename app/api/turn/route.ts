import { NextResponse } from "next/server";
import { agentTurnSchema, aiAgentTurnSchema, turnRequestSchema } from "@/lib/schemas";
import { SCENARIOS } from "@/lib/scenarios";
import { structuredResponse } from "@/lib/server/simulator";
import { formatHistory, turnPrompt } from "@/lib/server/prompts";
import { constrainAgentTurn, shouldForceSessionEnd } from "@/lib/scenario-engine";

export async function POST(request: Request) {
  try {
    const body = turnRequestSchema.parse(await request.json());
    const scenario = SCENARIOS[body.scenario];
    const currentIndex = Math.max(0, scenario.stages.findIndex((stage) => stage.id === body.currentStage));
    const forcedTimeout = shouldForceSessionEnd(body.history, body.elapsedTime);
    if (forcedTimeout) {
      return NextResponse.json({
        spokenText: body.language === "zh" ? "练习到此结束。让我们看看您发现了哪些警讯。" : body.language === "ms" ? "Latihan tamat. Mari lihat tanda amaran yang anda kesan." : body.language === "ta" ? "பயிற்சி முடிந்தது. நீங்கள் கண்ட எச்சரிக்கைகளைப் பார்ப்போம்." : "The practice is complete. Let us review the warning signs you noticed.",
        tactic: scenario.stages[currentIndex]?.tactic ?? "urgency",
        nextStage: "complete",
        shouldEnd: true,
        outcome: "timeout",
      });
    }
    const result = await structuredResponse({
      name: "scam_training_turn",
      schema: aiAgentTurnSchema,
      instructions: turnPrompt(body.scenario, body.language),
      input: `Current stage: ${body.currentStage}\nElapsed seconds: ${Math.round(body.elapsedTime)}\nTranscript:\n${formatHistory(body.history)}`,
    });
    const candidate = agentTurnSchema.parse({
      ...result,
      outcome: result.outcome ?? undefined,
      safetyIntervention: result.safetyIntervention ?? undefined,
    });
    const sensitiveDataDetected = body.history.some((turn) => turn.text.includes("[REDACTED]"));
    return NextResponse.json(agentTurnSchema.parse(constrainAgentTurn(scenario, body.currentStage, candidate, sensitiveDataDetected)));
  } catch (error) {
    console.error("Turn generation failed", error);
    return NextResponse.json({ error: "Could not generate the next practice turn." }, { status: 503 });
  }
}
