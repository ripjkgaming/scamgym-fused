import { describe, expect, it } from "vitest";
import { languages, getCopy } from "@/lib/i18n";
import { redactSensitive } from "@/lib/redact";
import { buildEvidence, calculateScore } from "@/lib/scoring";
import { scenarioList } from "@/lib/scenarios";
import { constrainAgentTurn, shouldForceSessionEnd } from "@/lib/scenario-engine";
import { groundEvidenceInTranscript } from "@/lib/judging";

describe("sensitive data redaction", () => {
  it.each([
    ["my email is learner@example.com", "my email is [REDACTED]"],
    ["visit https://unsafe.example/path", "visit [REDACTED]"],
    ["the code is 123 456", "the code is [REDACTED]"],
    ["my OTP is A1B2C3", "my [REDACTED]"],
  ])("redacts %s", (input, expected) => expect(redactSensitive(input)).toEqual({ text: expected, redacted: true }));

  it("leaves ordinary speech intact", () => {
    expect(redactSensitive("I will call my bank myself")).toEqual({ text: "I will call my bank myself", redacted: false });
  });
});

describe("deterministic scoring", () => {
  it("awards exactly the configured points", () => {
    const evidence = buildEvidence([
      { key: "verify_officially", achieved: true },
      { key: "refuse_sensitive", achieved: true },
      { key: "question_pressure", achieved: false },
      { key: "refuse_action", achieved: true },
      { key: "consult_trusted", achieved: false },
    ]);
    expect(calculateScore(evidence)).toBe(75);
  });

  it("cannot exceed 100", () => {
    const evidence = buildEvidence([
      { key: "verify_officially", achieved: true }, { key: "refuse_sensitive", achieved: true },
      { key: "question_pressure", achieved: true }, { key: "refuse_action", achieved: true },
      { key: "consult_trusted", achieved: true },
    ]);
    expect(calculateScore(evidence)).toBe(100);
  });
});

describe("content coverage", () => {
  it("has three six-stage scenarios in all four languages", () => {
    expect(scenarioList).toHaveLength(3);
    for (const scenario of scenarioList) {
      expect(scenario.stages).toHaveLength(6);
      for (const { code } of languages) {
        expect(scenario.title[code]).toBeTruthy();
        expect(scenario.premise[code]).toBeTruthy();
        expect(scenario.redFlags[code].length).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it("has the same interface keys in every language", () => {
    const englishKeys = Object.keys(getCopy("en")).sort();
    for (const { code } of languages) expect(Object.keys(getCopy(code)).sort()).toEqual(englishKeys);
  });
});

describe("scenario guardrails", () => {
  const scenario = scenarioList[0];

  it("forces the configured tactic and prevents stage skipping", () => {
    expect(constrainAgentTurn(scenario, "alert", {
      spokenText: "Test line", tactic: "payment", nextStage: "transfer", shouldEnd: false,
    })).toMatchObject({ tactic: "fear", nextStage: "verify", shouldEnd: false });
  });

  it("stops immediately when a safety intervention is present", () => {
    expect(constrainAgentTurn(scenario, "verify", {
      spokenText: "Stop", tactic: "authority", nextStage: "urgent", shouldEnd: false, safetyIntervention: "Do not share real information.",
    }, true)).toMatchObject({ shouldEnd: true, nextStage: "complete", outcome: "safe_exit", safetyIntervention: "Do not share real information." });
  });

  it("discards hallucinated safety interventions when nothing was redacted", () => {
    expect(constrainAgentTurn(scenario, "verify", {
      spokenText: "That is a safe choice.", tactic: "authority", nextStage: "complete", shouldEnd: true, outcome: "safe_exit", safetyIntervention: "Do not share real information.",
    })).toMatchObject({ spokenText: "That is a safe choice.", shouldEnd: true, outcome: "safe_exit", safetyIntervention: undefined });
  });

  it("enforces the six-caller-turn and two-minute limits", () => {
    const callerTurns = Array.from({ length: 6 }, (_, index) => ({ id: String(index), role: "caller" as const, text: "Call", timestampMs: index }));
    expect(shouldForceSessionEnd(callerTurns, 0)).toBe(true);
    expect(shouldForceSessionEnd([], 120)).toBe(true);
    expect(shouldForceSessionEnd(callerTurns.slice(0, 5), 119)).toBe(false);
  });
});

describe("grounded judging", () => {
  const verdicts = {
    verify_officially: { achieved: true, evidenceTurnId: "user-1", feedback: "Verified independently." },
    refuse_sensitive: { achieved: true, evidenceTurnId: "caller-1", feedback: "Invalid caller citation." },
    question_pressure: { achieved: false, evidenceTurnId: null, feedback: "Not demonstrated." },
    refuse_action: { achieved: false, evidenceTurnId: null, feedback: "Not demonstrated." },
    consult_trusted: { achieved: false, evidenceTurnId: null, feedback: "Not demonstrated." },
  };
  const history = [
    { id: "caller-1", role: "caller" as const, text: "Act now.", timestampMs: 0 },
    { id: "user-1", role: "user" as const, text: "I will hang up and call the official number.", timestampMs: 1 },
  ];

  it("awards points only when the model cites a real user turn", () => {
    const evidence = groundEvidenceInTranscript(verdicts, history);
    expect(evidence[0]).toMatchObject({ achieved: true, transcriptExcerpt: history[1].text });
    expect(evidence[1]).toMatchObject({ achieved: false, transcriptExcerpt: undefined });
    expect(calculateScore(evidence)).toBe(40);
  });
});
