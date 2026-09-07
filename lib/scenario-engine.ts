import type { AgentTurn, Outcome, ScenarioConfig, TranscriptTurn } from "@/lib/types";

export function shouldForceSessionEnd(history: TranscriptTurn[], elapsedTime: number) {
  return elapsedTime >= 120 || history.filter((turn) => turn.role === "caller").length >= 6;
}

export function constrainAgentTurn(
  scenario: ScenarioConfig,
  currentStage: string,
  candidate: AgentTurn,
  sensitiveDataDetected = false,
): AgentTurn {
  const foundIndex = scenario.stages.findIndex((stage) => stage.id === currentStage);
  const currentIndex = foundIndex >= 0 ? foundIndex : 0;
  const stage = scenario.stages[currentIndex];
  const followingStage = scenario.stages[Math.min(currentIndex + 1, scenario.stages.length - 1)];
  const safetyIntervention = sensitiveDataDetected ? candidate.safetyIntervention : undefined;
  const safetyStop = Boolean(safetyIntervention);
  const atFinalStage = currentIndex === scenario.stages.length - 1;
  const shouldEnd = candidate.shouldEnd || safetyStop || atFinalStage;
  const allowedNextStages = new Set([stage.id, followingStage.id]);
  const nextStage = shouldEnd
    ? "complete"
    : allowedNextStages.has(candidate.nextStage) ? candidate.nextStage : followingStage.id;
  const outcome: Outcome | undefined = shouldEnd
    ? safetyStop ? "safe_exit" : candidate.outcome ?? (atFinalStage ? "timeout" : undefined)
    : undefined;

  return {
    ...candidate,
    tactic: stage.tactic,
    nextStage,
    shouldEnd,
    outcome,
    safetyIntervention,
  };
}
