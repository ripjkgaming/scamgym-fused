import type { AgentTurn, Debrief, TranscriptTurn } from "@/lib/types";
import { buildEvidence, createDebrief } from "@/lib/scoring";

export const DEMO_CALLER_TURNS: AgentTurn[] = [
  { spokenText: "Hello, this is the bank security team. We detected an unfamiliar card payment of eight hundred and forty dollars. Did you make it?", tactic: "fear", nextStage: "verify", shouldEnd: false },
  { spokenText: "I understand. Your account may be frozen unless we verify it now. Please stay on this call while I secure it.", tactic: "urgency", nextStage: "urgent", shouldEnd: false },
  { spokenText: "There is no time to call the number on your card. I can move the funds to a protected account for you now.", tactic: "secrecy", nextStage: "transfer", shouldEnd: false },
  { spokenText: "If you hang up, the payment may go through. Are you sure you want to take that risk?", tactic: "fear", nextStage: "final", shouldEnd: false },
  { spokenText: "That is a safe choice. This practice call is now complete.", tactic: "authority", nextStage: "complete", shouldEnd: true, outcome: "safe_exit" },
];

export function demoTurn(history: TranscriptTurn[]): AgentTurn {
  const userText = [...history].reverse().find((turn) => turn.role === "user")?.text.toLowerCase() ?? "";
  const safe = /(hang up|call.*bank|official|number on.*card|verify|police|trusted|family|不会|挂断|核实|银行|tamat|semak|bank|முடிக்க|சரிபார)/i.test(userText);
  if (safe) return DEMO_CALLER_TURNS[4];
  const index = Math.min(history.filter((turn) => turn.role === "user").length, 3);
  return DEMO_CALLER_TURNS[index];
}

export function demoDebrief(history: TranscriptTurn[]): Debrief {
  const userTurns = history.filter((turn) => turn.role === "user");
  const transcript = userTurns.map((turn) => turn.text).join(" ");
  const findTurn = (pattern: RegExp) => userTurns.find((turn) => pattern.test(turn.text));
  const verificationTurn = findTurn(/official|number on.*card|call.*bank/i);
  const verify = /(hang up|end.*call|not continue|call.*bank)/i.test(transcript) && Boolean(verificationTurn);
  const sensitiveTurn = findTurn(/(?:not|won't|will not|refuse).*(?:share|give|otp|password|information|payment|pay|money)/i);
  const questionTurn = findTurn(/why|how.*know|prove|who are you|why.*urgent|verify.*identity/i);
  const actionTurn = findTurn(/(?:not|won't|will not|refuse).*(?:open|click|transfer|install|move money)/i);
  const trustedTurn = findTurn(/family|friend|trusted|daughter|son|caregiver|someone/i);
  const evidence = buildEvidence([
    { key: "verify_officially", achieved: verify, transcriptExcerpt: verify ? verificationTurn?.text : undefined, feedback: verify ? "You ended the interaction and chose a channel you found independently." : "Say that you will end the call and contact the organisation through an official number you find yourself." },
    { key: "refuse_sensitive", achieved: Boolean(sensitiveTurn), transcriptExcerpt: sensitiveTurn?.text, feedback: sensitiveTurn ? "You clearly refused to share information or make a payment." : "Explicitly say that you will not share information or make a payment." },
    { key: "question_pressure", achieved: Boolean(questionTurn), transcriptExcerpt: questionTurn?.text, feedback: questionTurn ? "You challenged the caller's claim instead of accepting it." : "Question why the request is urgent and how the caller's identity can be verified." },
    { key: "refuse_action", achieved: Boolean(actionTurn), transcriptExcerpt: actionTurn?.text, feedback: actionTurn ? "You refused the unsafe action directly." : "Explicitly refuse links, transfers, downloads, or remote access." },
    { key: "consult_trusted", achieved: Boolean(trustedTurn), transcriptExcerpt: trustedTurn?.text, feedback: trustedTurn ? "You brought a trusted person into the decision." : "Say that you will check with a trusted family member, friend, or staff member." },
  ]);
  return createDebrief({
    outcome: verify ? "safe_exit" : "timeout",
    evidence,
    detectedRedFlags: verify ? ["You chose to verify through an official channel.", "You did not accept the caller's urgency."] : ["You stayed calm during an unexpected call."],
    missedRedFlags: verify ? ["A real bank will not ask you to move money to a safe account."] : ["End unexpected financial calls and use the number printed on your bank card.", "Urgency is designed to stop you from checking."],
    saferResponse: "I will not continue this call. I will contact my bank using the official number on my card.",
    coachingSummary: verify ? "Well done. You slowed the conversation down and chose to verify the claim independently. That breaks the scammer's control." : "You stayed calm, which is a good start. Next time, end the call and contact the organisation through an official number you find yourself.",
  });
}
