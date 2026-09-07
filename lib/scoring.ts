import type { Debrief, EvidenceItem, Outcome } from "@/lib/types";

export const RUBRIC = {
  verify_officially: { behavior: "End the call and verify independently", points: 40 },
  refuse_sensitive: { behavior: "Refuse sensitive information or payment", points: 25 },
  question_pressure: { behavior: "Question urgency, authority, or secrecy", points: 15 },
  refuse_action: { behavior: "Refuse links, transfers, or software", points: 10 },
  consult_trusted: { behavior: "Consult someone trusted", points: 10 },
} as const;

export type RubricKey = keyof typeof RUBRIC;

export function buildEvidence(
  behaviors: Array<{ key: RubricKey; achieved: boolean; transcriptExcerpt?: string; feedback?: string }>,
): EvidenceItem[] {
  const byKey = new Map(behaviors.map((item) => [item.key, item]));
  return (Object.keys(RUBRIC) as RubricKey[]).map((key) => ({
    behavior: RUBRIC[key].behavior,
    achieved: byKey.get(key)?.achieved ?? false,
    points: RUBRIC[key].points,
    transcriptExcerpt: byKey.get(key)?.transcriptExcerpt,
    feedback: byKey.get(key)?.feedback,
  }));
}

export function calculateScore(evidence: EvidenceItem[]) {
  return evidence.reduce((total, item) => total + (item.achieved ? item.points : 0), 0);
}

export function createDebrief(
  input: Omit<Debrief, "score" | "evidence"> & { evidence: EvidenceItem[]; outcome: Outcome },
): Debrief {
  return { ...input, score: calculateScore(input.evidence) };
}
