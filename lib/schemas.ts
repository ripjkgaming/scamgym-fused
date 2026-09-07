import { z } from "zod";

export const languageSchema = z.enum(["en", "zh", "ms", "ta"]);
export const scenarioIdSchema = z.enum([
  "bank_fraud",
  "government_impersonation",
  "parcel_delivery",
]);
export const tacticSchema = z.enum([
  "authority",
  "urgency",
  "fear",
  "secrecy",
  "payment",
  "link",
]);
export const outcomeSchema = z.enum([
  "safe_exit",
  "simulated_compliance",
  "timeout",
]);

export const transcriptTurnSchema = z.object({
  id: z.string(),
  role: z.enum(["caller", "user"]),
  text: z.string().min(1).max(800),
  timestampMs: z.number().nonnegative(),
  tactic: tacticSchema.optional(),
});

export const agentTurnSchema = z.object({
  spokenText: z.string().min(1).max(420),
  tactic: tacticSchema,
  nextStage: z.string().min(1).max(80),
  shouldEnd: z.boolean(),
  outcome: outcomeSchema.optional(),
  safetyIntervention: z.string().max(260).optional(),
});

export const aiAgentTurnSchema = z.object({
  spokenText: z.string().min(1).max(420),
  tactic: tacticSchema,
  nextStage: z.string().min(1).max(80),
  shouldEnd: z.boolean(),
  outcome: outcomeSchema.nullable(),
  safetyIntervention: z.string().max(260).nullable(),
});

export const behaviorVerdictSchema = z.object({
  achieved: z.boolean(),
  evidenceTurnId: z.string().max(120).nullable(),
  feedback: z.string().min(1).max(240),
});

export const aiDebriefSchema = z.object({
  outcome: outcomeSchema,
  behaviors: z.object({
    verify_officially: behaviorVerdictSchema,
    refuse_sensitive: behaviorVerdictSchema,
    question_pressure: behaviorVerdictSchema,
    refuse_action: behaviorVerdictSchema,
    consult_trusted: behaviorVerdictSchema,
  }),
  detectedRedFlags: z.array(z.string().max(180)).max(6),
  missedRedFlags: z.array(z.string().max(180)).max(6),
  saferResponse: z.string().min(1).max(360),
  coachingSummary: z.string().min(1).max(700),
});

export const turnRequestSchema = z.object({
  scenario: scenarioIdSchema,
  language: languageSchema,
  currentStage: z.string().max(80),
  history: z.array(transcriptTurnSchema).max(14),
  elapsedTime: z.number().nonnegative().max(300),
});

export const debriefRequestSchema = z.object({
  scenario: scenarioIdSchema,
  language: languageSchema,
  history: z.array(transcriptTurnSchema).min(1).max(14),
  forcedOutcome: outcomeSchema.optional(),
});

// Shield tools (ported from scam-shield; same contracts, OpenRouter-backed).
export const scamCheckSchema = z.object({ text: z.string().min(1).max(6000) });
export const explainRequestSchema = z.object({ text: z.string().min(1).max(6000) });
export const familyRequestSchema = z.object({
  situation: z.string().min(1).max(4000),
  headline: z.string().max(300).default(""),
  nextStep: z.string().max(400).default(""),
});
