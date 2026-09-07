import { NextResponse } from "next/server";
import { aiDebriefSchema, debriefRequestSchema } from "@/lib/schemas";
import { redactSensitive } from "@/lib/redact";
import { createDebrief } from "@/lib/scoring";
import { groundEvidenceInTranscript } from "@/lib/judging";
import { structuredResponse } from "@/lib/server/simulator";
import { debriefPrompt, formatHistory } from "@/lib/server/prompts";

export async function POST(request: Request) {
  try {
    const body = debriefRequestSchema.parse(await request.json());
    const cleanHistory = body.history.map((turn) => ({ ...turn, text: redactSensitive(turn.text).text }));
    const result = await structuredResponse({
      name: "scam_training_debrief",
      schema: aiDebriefSchema,
      instructions: debriefPrompt(body.scenario, body.language),
      input: `Session termination: ${body.forcedOutcome ?? "infer from transcript"}. This describes how the simulation stopped; it is not scoring evidence.\nTranscript:\n${formatHistory(cleanHistory, true)}`,
    });
    const evidence = groundEvidenceInTranscript(result.behaviors, cleanHistory);
    return NextResponse.json(createDebrief({
      outcome: body.forcedOutcome ?? result.outcome,
      evidence,
      detectedRedFlags: result.detectedRedFlags,
      missedRedFlags: result.missedRedFlags,
      saferResponse: result.saferResponse,
      coachingSummary: result.coachingSummary,
    }));
  } catch (error) {
    console.error("Debrief generation failed", error);
    return NextResponse.json({ error: "Could not prepare the review." }, { status: 503 });
  }
}
