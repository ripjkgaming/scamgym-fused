"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ScamChannel } from "@/lib/scam-channels";

export interface PracticeChatProps {
  channel: ScamChannel;
}

interface PracticeState {
  stepIndex: number;
  selectedChoice: number | null;
  completed: boolean;
}

export default function PracticeChat({ channel }: PracticeChatProps) {
  // A different guide gets a fresh session even when the parent reuses this component.
  return <PracticeSession key={channel.id} channel={channel} />;
}

function PracticeSession({ channel }: PracticeChatProps) {
  const { practice } = channel;
  const id = useId();
  const questionRef = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const focusAfterAction = useRef(false);
  const initialState: PracticeState = {
    stepIndex: 0,
    selectedChoice: null,
    completed: false,
  };
  const [session, setSession] = useState<PracticeState>(initialState);
  const step = practice.steps[session.stepIndex];
  const selected = session.selectedChoice === null ? null : step.choices[session.selectedChoice];
  const total = practice.steps.length;
  const current = session.stepIndex + 1;
  const answered = session.completed ? total : session.stepIndex + (selected?.safe ? 1 : 0);

  useEffect(() => {
    if (!focusAfterAction.current) return;
    focusAfterAction.current = false;
    const target = session.completed ? summaryRef : session.selectedChoice !== null ? feedbackRef : questionRef;
    target.current?.focus();
  }, [session]);

  function choose(choiceIndex: number) {
    focusAfterAction.current = true;
    setSession((previous) => {
      // Only the rendered session can act, so queued clicks cannot skip a decision.
      if (previous !== session || previous.completed || previous.selectedChoice !== null) return previous;
      const choice = practice.steps[previous.stepIndex].choices[choiceIndex];
      if (!choice) return previous;
      return {
        ...previous,
        selectedChoice: choiceIndex,
      };
    });
  }

  function continuePractice() {
    focusAfterAction.current = true;
    setSession((previous) => {
      if (previous !== session || previous.completed || previous.selectedChoice === null) return previous;
      const choice = practice.steps[previous.stepIndex].choices[previous.selectedChoice];
      if (!choice.safe) return { ...previous, selectedChoice: null };
      const nextIndex = previous.stepIndex + 1;
      if (nextIndex === total) return { ...previous, completed: true };
      return {
        ...previous,
        stepIndex: nextIndex,
        selectedChoice: null,
      };
    });
  }

  function reset() {
    focusAfterAction.current = true;
    setSession((previous) => previous === session && previous.completed ? initialState : previous);
  }

  return (
    <section className="practice-frame" aria-labelledby={`${id}-title`}>
      <header className="practice-header">
        <h3 className="practice-title" id={`${id}-title`}>{practice.title}</h3>
        <p className="practice-disclaimer">
          This is only practice. Nothing is sent and no money is used.
        </p>
      </header>

      <div className="practice-progress">
        <span className="practice-progress-label">{session.completed ? `${total} of ${total} questions complete` : `Question ${current} of ${total}`}</span>
        <progress className="practice-progress-bar" value={answered} max={total} aria-label="Steps with a safer decision" />
      </div>

      {!session.completed && (
        <>
          {selected === null && (
            <details className="practice-reference" key={session.stepIndex} open={session.stepIndex === 0}>
              <summary>Read the example again</summary>
              <p className="practice-reference-message">{practice.opening}</p>
            </details>
          )}
          <h4 className="practice-question" id={`${id}-question`} ref={questionRef} tabIndex={-1}>
            {step.message}
          </h4>
          {selected === null ? (
            <div className="practice-choices" role="group" aria-labelledby={`${id}-question`}>
              {step.choices.map((choice, index) => (
                <button className="practice-choice" key={`${session.stepIndex}-${index}`} type="button" onClick={() => choose(index)}>
                  <span className="practice-choice-label">{choice.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <>
              <p className="practice-answer"><strong>You chose:</strong> {selected.label}</p>
              <div className="practice-feedback" role="status" aria-atomic="true" aria-labelledby={`${id}-feedback-title`} ref={feedbackRef} tabIndex={-1}>
                <h4 className="practice-feedback-title" id={`${id}-feedback-title`}>
                  {selected.safe ? "A safer choice" : "Let us try a safer way"}
                </h4>
                <p>{selected.feedback}</p>
              </div>
              <button className="practice-continue" type="button" onClick={continuePractice}>
                {selected.safe ? current === total ? "Finish practice" : "Next question" : "Choose a different answer"}
              </button>
            </>
          )}
        </>
      )}

      {session.completed && (
        <div className="practice-summary" ref={summaryRef} tabIndex={-1} aria-labelledby={`${id}-summary-title`}>
          <h4 id={`${id}-summary-title`}>Practice complete</h4>
          <p className="practice-takeaway">{channel.takeaway}</p>
          <p>You practised pausing to check. You can use that same approach in everyday life.</p>
          <button className="practice-reset" type="button" onClick={reset}>Practise again</button>
        </div>
      )}

      <footer className="practice-footer">
        <p>There is no timer. Take your time.</p>
      </footer>
    </section>
  );
}
