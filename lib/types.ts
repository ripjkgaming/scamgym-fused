export type LanguageCode = "en" | "zh" | "ms" | "ta";
export type ScenarioId =
  | "bank_fraud"
  | "government_impersonation"
  | "parcel_delivery";
export type VoiceRole = "caller" | "coach";
export type Tactic =
  | "authority"
  | "urgency"
  | "fear"
  | "secrecy"
  | "payment"
  | "link";
export type Outcome = "safe_exit" | "simulated_compliance" | "timeout";

export interface TranscriptTurn {
  id: string;
  role: "caller" | "user";
  text: string;
  timestampMs: number;
  tactic?: Tactic;
}

export interface AgentTurn {
  spokenText: string;
  tactic: Tactic;
  nextStage: string;
  shouldEnd: boolean;
  outcome?: Outcome;
  safetyIntervention?: string;
}

export interface EvidenceItem {
  behavior: string;
  achieved: boolean;
  points: number;
  transcriptExcerpt?: string;
  feedback?: string;
}

export interface Debrief {
  score: number;
  outcome: Outcome;
  evidence: EvidenceItem[];
  detectedRedFlags: string[];
  missedRedFlags: string[];
  saferResponse: string;
  coachingSummary: string;
}

export interface ScenarioConfig {
  id: ScenarioId;
  icon: "bank" | "government" | "parcel";
  title: Record<LanguageCode, string>;
  description: Record<LanguageCode, string>;
  callerLabel: Record<LanguageCode, string>;
  premise: Record<LanguageCode, string>;
  stages: Array<{
    id: string;
    tactic: Tactic;
    instruction: string;
  }>;
  redFlags: Record<LanguageCode, string[]>;
}
