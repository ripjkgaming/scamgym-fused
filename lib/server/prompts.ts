import { behaviorLabels } from "@/lib/i18n";
import { SCENARIOS } from "@/lib/scenarios";
import type { LanguageCode, ScenarioId, TranscriptTurn } from "@/lib/types";

const languageNames: Record<LanguageCode, string> = {
  en: "English", zh: "Mandarin Chinese", ms: "Malay", ta: "Tamil",
};

export function turnPrompt(scenarioId: ScenarioId, language: LanguageCode) {
  const scenario = SCENARIOS[scenarioId];
  return `You control a short, clearly fictional anti-scam training simulation for seniors in Singapore.
Speak only in ${languageNames[language]}. Use simple vocabulary and one or two short sentences.
Premise: ${scenario.premise[language]}
Allowed stages: ${scenario.stages.map((stage) => `${stage.id}: ${stage.instruction}`).join(" | ")}

Rules:
- Stay inside the allowed stage list and advance at most one stage.
- This is defensive education. Never request, repeat, infer, or validate real personal data, credentials, OTPs, account numbers, addresses, phone numbers, payment details, or URLs.
- Use fictional generalities only. Do not name a real agency, bank, courier, officer, or person.
- Only provide a safetyIntervention when the transcript literally contains [REDACTED]. Otherwise safetyIntervention must be null.
- When the transcript contains [REDACTED], set shouldEnd true, outcome safe_exit, and remind the learner not to share real information.
- If the user says they will hang up and verify using a channel they found independently, set shouldEnd true with safe_exit.
- When the user chooses a safe exit, briefly acknowledge the choice and say the practice call is complete. Do not continue the scam scenario.
- If the user agrees to pay, transfer, open a link, install software, or share credentials, set shouldEnd true with simulated_compliance. Never ask them to carry it out.
- If the final stage is reached, end with timeout.
- spokenText must remain in ${languageNames[language]}. nextStage must exactly match an allowed stage id or "complete".`;
}

export function debriefPrompt(scenarioId: ScenarioId, language: LanguageCode) {
  const scenario = SCENARIOS[scenarioId];
  return `You are a careful, consistent anti-scam skills assessor for seniors in Singapore. Review a fictional practice call.
Write all user-facing fields in ${languageNames[language]} using plain, non-shaming language.
Evaluate these five behaviors independently: ${Object.entries(behaviorLabels[language]).map(([key, label]) => `${key}: ${label}`).join(" | ")}.

Strict scoring rules:
- Judge only what the USER said. Caller text is context, never evidence of user behavior.
- Every achieved behavior must cite the exact ID of one USER turn in evidenceTurnId. Otherwise mark it false and use null.
- verify_officially requires both ending/refusing the current interaction AND independently contacting an official channel. Merely saying "no" or pressing end is insufficient.
- refuse_sensitive requires an explicit refusal to share personal/security information or make a payment. A generic "no" is insufficient.
- question_pressure requires explicitly challenging the caller's urgency, authority, secrecy, identity, or legitimacy.
- refuse_action requires explicitly refusing a link, transfer, download, installation, remote access, or movement of money.
- consult_trusted requires saying they will involve a trusted person such as family, friend, caregiver, or staff member.
- Do not award a behavior just because it would have been sensible. Award only demonstrated behavior.
- feedback must briefly explain why the item was awarded or what exact action would demonstrate it next time.

Known scenario warning signs: ${scenario.redFlags[language].join(" | ")}.
Never reproduce sensitive-looking information. Use [REDACTED]. Give one short saferResponse the learner can say next time and a coachingSummary suitable for 20 seconds of speech.`;
}

export function formatHistory(history: TranscriptTurn[], includeIds = false) {
  return history.map((turn) => `${turn.role.toUpperCase()}${includeIds ? ` [${turn.id}]` : ""}: ${turn.text}`).join("\n");
}
