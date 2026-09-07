import { buildEvidence, type RubricKey } from "@/lib/scoring";
import type { TranscriptTurn } from "@/lib/types";

export interface BehaviorVerdict {
  achieved: boolean;
  evidenceTurnId: string | null;
  feedback: string;
}

export type BehaviorVerdicts = Record<RubricKey, BehaviorVerdict>;

export function groundEvidenceInTranscript(verdicts: BehaviorVerdicts, history: TranscriptTurn[]) {
  const userTurns = new Map(history.filter((turn) => turn.role === "user").map((turn) => [turn.id, turn]));
  return buildEvidence((Object.entries(verdicts) as Array<[RubricKey, BehaviorVerdict]>).map(([key, verdict]) => {
    const citedTurn = verdict.evidenceTurnId ? userTurns.get(verdict.evidenceTurnId) : undefined;
    const achieved = verdict.achieved && Boolean(citedTurn);
    return {
      key,
      achieved,
      transcriptExcerpt: achieved ? citedTurn!.text.slice(0, 220) : undefined,
      feedback: verdict.feedback,
    };
  }));
}
