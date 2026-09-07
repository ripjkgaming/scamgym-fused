"use client";

import { useState } from "react";
import { CheckCircle, WarningCircle, X } from "@phosphor-icons/react";

type Verdict = "scam" | "safe" | "unsure";

type CheckOk =
  | {
      ok: true;
      verdict: Verdict;
      headline: string;
      reasons: string[];
      next_step: string;
      fallback?: boolean;
      sensitiveNote?: string;
      truncated?: boolean;
    }
  | { ok: false; error: string; retry?: boolean; sensitiveNote?: string; truncated?: boolean };

type ExplainOk =
  | {
      ok: true;
      happening: string;
      not_meaning?: string;
      next_step?: string;
      fallback?: boolean;
      sensitiveNote?: string;
      truncated?: boolean;
    }
  | { ok: false; error: string; retry?: boolean; sensitiveNote?: string; truncated?: boolean };

const EXAMPLES: Array<{ label: string; text: string }> = [
  {
    label: "Bank call",
    text: "Someone called saying they are from my bank, my account is frozen, and they need my card number right now.",
  },
  {
    label: "Grandchild in trouble",
    text: "I got a call from someone who sounded like my grandson. He said he is in trouble and needs money sent quickly, and not to tell his parents.",
  },
  {
    label: "Prize win",
    text: "I got a text saying I won a prize in a lottery I never entered, and I need to pay a small fee first to get it.",
  },
];

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await r.json().catch(() => ({ ok: false, error: "Something went wrong." }))) as T;
}

function verdictIcon(verdict: Verdict) {
  if (verdict === "scam") return <WarningCircle size={24} weight="fill" aria-hidden="true" />;
  if (verdict === "safe") return <CheckCircle size={24} weight="fill" aria-hidden="true" />;
  return <span aria-hidden="true">?</span>;
}

export default function ShieldTools() {
  const [checkText, setCheckText] = useState("");
  const [checkBusy, setCheckBusy] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckOk | null>(null);
  const [explainText, setExplainText] = useState("");
  const [explainBusy, setExplainBusy] = useState(false);
  const [explainResult, setExplainResult] = useState<ExplainOk | null>(null);
  const [familyBusy, setFamilyBusy] = useState(false);
  const [familyNote, setFamilyNote] = useState("");
  const [lastCheck, setLastCheck] = useState<{ situation: string; headline: string; nextStep: string } | null>(null);

  const runCheck = async () => {
    if (!checkText.trim() || checkBusy) return;
    setCheckBusy(true);
    setFamilyNote("");
    try {
      const data = await postJson<CheckOk>("/api/scam-check", { text: checkText });
      setCheckResult(data);
      if (data.ok && !data.fallback) {
        setLastCheck({ situation: checkText.trim().slice(0, 4000), headline: data.headline, nextStep: data.next_step });
      } else {
        setLastCheck(null);
      }
    } catch {
      setCheckResult({ ok: false, error: "Could not reach the helper. Check your connection and try again.", retry: true });
    } finally {
      setCheckBusy(false);
    }
  };

  const runExplain = async () => {
    if (!explainText.trim() || explainBusy) return;
    setExplainBusy(true);
    try {
      const data = await postJson<ExplainOk>("/api/explain", { text: explainText });
      setExplainResult(data);
    } catch {
      setExplainResult({ ok: false, error: "Could not reach the helper. Check your connection and try again.", retry: true });
    } finally {
      setExplainBusy(false);
    }
  };

  const runFamily = async () => {
    if (!lastCheck || familyBusy) return;
    setFamilyBusy(true);
    setFamilyNote("Writing a short note...");
    try {
      const data = await postJson<{ ok: boolean; summary?: string }>("/api/family", lastCheck);
      setFamilyNote(
        data.ok && data.summary
          ? data.summary
          : "I could not write the note just now. You could say: \u201CSomething worried me and I would like your opinion before I do anything.\u201D"
      );
    } catch {
      setFamilyNote("I could not write the note just now. You could say: \u201CSomething worried me and I would like your opinion before I do anything.\u201D");
    } finally {
      setFamilyBusy(false);
    }
  };

  return (
    <div className="shield-tools">
      <section className="shield-section" aria-labelledby="shield-check-h">
        <p className="eyebrow">Check before you act</p>
        <h2 id="shield-check-h">Is this a scam?</h2>
        <p className="lede">Type or paste what happened. You get a plain answer and one clear next step. Nothing is saved.</p>
        <label className="shield-label" htmlFor="shield-check-input">What happened, in your own words</label>
        <textarea
          id="shield-check-input"
          className="shield-input"
          rows={4}
          maxLength={6000}
          value={checkText}
          onChange={(e) => setCheckText(e.target.value)}
          placeholder="Describe the call, text, email or visitor..."
        />
        <div className="shield-meta">
          <span>{checkText.length} characters</span>
          <span>Only used for this one check.</span>
        </div>
        <div className="shield-examples" aria-label="Try an example">
          <span>Try an example:</span>
          {EXAMPLES.map((ex) => (
            <button key={ex.label} type="button" className="shield-chip" onClick={() => setCheckText(ex.text)}>
              {ex.label}
            </button>
          ))}
        </div>
        <button type="button" className="primary-button w-full" onClick={() => void runCheck()} disabled={checkBusy || !checkText.trim()}>
          {checkBusy ? "Reading this carefully..." : "Check this for me"}
        </button>
        {checkResult && (
          <div
            className={`shield-result ${checkResult.ok ? `verdict-${checkResult.verdict}` : "verdict-error"}`}
            aria-live="polite"
          >
            {!checkResult.ok ? (
              <>
                <div className="shield-verdict">
                  <X size={24} aria-hidden="true" />
                  <div>
                    <h3>Sorry, that did not work.</h3>
                    <p>{checkResult.error}</p>
                  </div>
                </div>
                {checkResult.retry && <p className="shield-next">Please wait a moment and try again.</p>}
              </>
            ) : (
              <>
                <div className="shield-verdict">
                  {verdictIcon(checkResult.verdict)}
                  <div>
                    <h3>
                      {checkResult.verdict === "scam"
                        ? "This has strong signs of a scam."
                        : checkResult.verdict === "safe"
                          ? "This looks safe."
                          : "Not sure from this alone \u2014 here is what to check."}
                    </h3>
                    <p>{checkResult.headline}</p>
                  </div>
                </div>
                {checkResult.reasons.length > 0 && (
                  <ul>
                    {checkResult.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                )}
                <p className="shield-next"><strong>Next step:</strong> {checkResult.next_step}</p>
              </>
            )}
            {checkResult.sensitiveNote && <p className="notice safe">{checkResult.sensitiveNote}</p>}
            {checkResult.truncated && (
              <p className="notice safe">Your message was very long, so I read the first part. If something important was at the end, try sending just that part.</p>
            )}
          </div>
        )}
        {checkResult?.ok && !checkResult.fallback && (
          <div className="shield-family">
            <button type="button" className="secondary-button" onClick={() => void runFamily()} disabled={familyBusy || !lastCheck}>
              {familyBusy ? "Writing a short note..." : "Explain this to my family"}
            </button>
            {familyNote && (
              <p className="shield-family-out" aria-live="polite">
                {familyNote}
              </p>
            )}
          </div>
        )}
      </section>

      <section className="shield-section" aria-labelledby="shield-explain-h">
        <p className="eyebrow">Confusing screens, plain answers</p>
        <h2 id="shield-explain-h">Explain this to me.</h2>
        <p className="lede">Describe a pop-up, an error, or something your phone or computer is doing that worries you.</p>
        <label className="shield-label" htmlFor="shield-explain-input">What are you seeing?</label>
        <textarea
          id="shield-explain-input"
          className="shield-input"
          rows={4}
          maxLength={6000}
          value={explainText}
          onChange={(e) => setExplainText(e.target.value)}
          placeholder="Describe the pop-up, message or call..."
        />
        <div className="shield-meta">
          <span>{explainText.length} characters</span>
          <span>Only used for this one explanation.</span>
        </div>
        <button type="button" className="primary-button w-full" onClick={() => void runExplain()} disabled={explainBusy || !explainText.trim()}>
          {explainBusy ? "Working out a plain explanation..." : "Explain this to me"}
        </button>
        {explainResult && (
          <div className={`shield-result ${explainResult.ok ? "verdict-safe" : "verdict-error"}`} aria-live="polite">
            {!explainResult.ok ? (
              <div className="shield-verdict">
                <X size={24} aria-hidden="true" />
                <div>
                  <h3>Sorry, that did not work.</h3>
                  <p>{explainResult.error}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="shield-verdict">
                  <CheckCircle size={24} weight="fill" aria-hidden="true" />
                  <div>
                    <h3>Here is what is going on.</h3>
                  </div>
                </div>
                <p>{explainResult.happening}</p>
                {explainResult.not_meaning && (
                  <p><strong>What this does not mean:</strong> {explainResult.not_meaning}</p>
                )}
                {explainResult.next_step && (
                  <p className="shield-next"><strong>Next step:</strong> {explainResult.next_step}</p>
                )}
              </>
            )}
            {explainResult.sensitiveNote && <p className="notice safe">{explainResult.sensitiveNote}</p>}
            {explainResult.truncated && (
              <p className="notice safe">Your message was very long, so I read the first part. If something important was at the end, try sending just that part.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
