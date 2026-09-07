"use client";

import { ArrowLeft, ArrowRight, Check, TextAa } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { ScamChannel } from "@/lib/scam-channels";
import ScamExample from "./ScamExample";
import PracticeChat from "./PracticeChat";

const steps = [
  { label: "Example", title: "Look at an example", hash: "example" },
  { label: "Stay safe", title: "What to do", hash: "safe-steps" },
  { label: "Practise", title: "Try a practice question", hash: "practice" },
];

export default function GuideSteps({ channel }: { channel: ScamChannel }) {
  const [stage, setStage] = useState(0);
  const [largeText, setLargeText] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const shouldFocus = useRef(false);
  const id = useId();

  useEffect(() => {
    try { setLargeText(localStorage.getItem("scamgym-large-text") === "true"); } catch { /* Reading controls still work when storage is blocked. */ }
    const followHash = () => {
      const next = steps.findIndex((step) => `#${step.hash}` === window.location.hash);
      if (next !== -1) {
        shouldFocus.current = true;
        setStage(next);
      }
    };
    followHash();
    window.addEventListener("hashchange", followHash);
    return () => window.removeEventListener("hashchange", followHash);
  }, []);

  useEffect(() => {
    if (!shouldFocus.current || window.location.hash !== `#${steps[stage].hash}`) return;
    shouldFocus.current = false;
    headingRef.current?.focus();
  }, [stage]);

  function changeStage(next: number) {
    if (next === stage) return;
    shouldFocus.current = true;
    setStage(next);
    // Keep shared links useful without filling the browser's back history.
    window.history.replaceState(window.history.state, "", `#${steps[next].hash}`);
  }

  function changeTextSize() {
    const next = !largeText;
    setLargeText(next);
    try { localStorage.setItem("scamgym-large-text", String(next)); } catch { /* The preference is optional. */ }
  }

  return (
    <div className="guide-reader" data-large-text={largeText}>
      <header className="guide-heading">
        <h1>{channel.title}</h1>
        <p>{channel.description}</p>
        <div className="guide-reading-controls">
          <p>Take one step at a time. There is no rush.</p>
          <button className="guide-size-button" type="button" aria-pressed={largeText} onClick={changeTextSize}>
            <TextAa size={24} aria-hidden="true" />Larger text{largeText && <Check size={22} aria-hidden="true" />}
          </button>
        </div>
      </header>

      <nav className="guide-step-nav" aria-label="Guide steps">
        <ol>{steps.map((step, index) => (
          <li key={step.hash}>
            <button type="button" aria-current={stage === index ? "step" : undefined} aria-controls={`${id}-panel-${index}`} onClick={() => changeStage(index)}>
              <span className="guide-step-number">{index + 1}</span><span>{step.label}</span>
            </button>
          </li>
        ))}</ol>
      </nav>

      {steps.map((step, index) => (
        <section key={step.hash} className="guide-panel" id={`${id}-panel-${index}`} hidden={stage !== index} aria-labelledby={`${id}-heading-${index}`}>
          <div id={step.hash} className="guide-panel-heading">
            <p className="guide-step-count">Step {index + 1} of 3</p>
            <h2 id={`${id}-heading-${index}`} ref={stage === index ? headingRef : undefined} tabIndex={-1}>{step.title}</h2>
          </div>
          {index === 0 && <ScamExample channel={channel} />}
          {index === 1 && <>
            <ol className="guide-safe-steps">{channel.safeSteps.map((item, itemIndex) => (
              <li key={item.title}><span className="safe-step-number" aria-hidden="true">{itemIndex + 1}</span><div><h3>{item.title}</h3><p>{item.body}</p></div></li>
            ))}</ol>
            <div className="guide-takeaway"><strong>Remember</strong><p>{channel.takeaway}</p></div>
          </>}
          {index === 2 && <>
            <PracticeChat channel={channel} />
            {channel.id === "phone" && <details className="guide-more voice-practice-option">
              <summary>Prefer to practise speaking?</summary>
              <p>You can speak or type in our separate phone-call simulator.</p>
              <Link href="/practice" className="learning-button">Start voice practice <ArrowRight size={22} aria-hidden="true" /></Link>
              <p className="guide-secondary-text">Live voice practice uses external AI and speech services. Read the safety notice before starting.</p>
              <Link href="/practice?demo=1" className="guide-back">Try the scripted voice demo instead</Link>
            </details>}
          </>}
          <div className="guide-actions">
            {index > 0 && <button type="button" className="guide-back-button" onClick={() => changeStage(index - 1)}><ArrowLeft size={22} aria-hidden="true" />{index === 1 ? "Back: example" : "Back: safety advice"}</button>}
            {index < 2 && <button type="button" className="learning-button" onClick={() => changeStage(index + 1)}>{index === 0 ? "Next: what to do" : "Next: practise"}<ArrowRight size={22} aria-hidden="true" /></button>}
          </div>
        </section>
      ))}
    </div>
  );
}
