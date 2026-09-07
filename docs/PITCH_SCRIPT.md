# ScamGym three-minute demo script

## Before presenting

- Open `http://localhost:3000/?demo=1` and keep the English fake-bank scenario selected.
- Grant microphone access before judges arrive, or use **Type instead** for the deterministic path.
- Keep a second tab on `/api/health`; it should show all three values as `true`.
- Use the exact safe reply below. Do not improvise personal information.

## 0:00–0:20 — Hook

**Say:** “Everyone knows the advice: never share an OTP and never transfer money to a safe account. But scammers do not test what we know. They test what we do while we are frightened, rushed, and alone.”

**Action:** Show the setup screen and select the fake-bank call.

## 0:20–0:43 — Product

**Say:** “ScamGym is a private voice simulator where seniors rehearse that high-pressure moment before it is real. It supports English, Mandarin, Malay, and Tamil across bank, government, and parcel scams. There is no account, no real phone call, and nothing is saved after the session.”

**Action:** Continue through the safety warning and answer the incoming call.

## 0:43–1:25 — Live call

Let the first caller message play. Then choose **Type instead** and enter:

> No. I will not share information or move money. I am hanging up and will call the bank using the official number on my card. I will ask my daughter to help me check.

**Say while the next turn loads:** “The caller is generated one short turn at a time. It can adapt its pressure, but it must remain inside a safety-constrained scenario graph. If a learner types an OTP, phone number, email, or link, ScamGym redacts it and stops escalation.”

End the call if it has not ended automatically.

## 1:25–2:05 — Reveal the learning

**Say:** “The important part is not a mysterious AI score. OpenAI identifies evidence in the transcript, then our application applies a fixed 100-point rubric. Every point is visible and tied to the learner’s own words.”

**Action:** Scroll through the evidence, then pause at **How the pressure changed**.

**Say:** “During the call we hide the labels so the situation feels natural. Afterward, the pressure map reveals fear, urgency, secrecy, and false authority turn by turn. The learner can hear a calm coaching summary and print one reusable rule: pause, hang up, verify.”

## 2:05–2:38 — Technical depth

**Say:** “The pipeline combines ElevenLabs Scribe for multilingual transcription, OpenAI Structured Outputs for safe scenario progression and evidence extraction, and ElevenLabs speech for distinct caller and coach voices. Zod validates every model response. Keys stay server-side. Calls time out after two minutes or six turns, and every external dependency has a timeout, retry, and safe fallback. A cached golden path protects the live demo during an outage.”

## 2:38–3:00 — Impact and close

**Say:** “Warning campaigns tell people what scams look like. ScamGym builds the reflex to leave. Our next step is a community-centre pilot measuring whether one two-minute rehearsal improves safe hang-up and independent verification rates across languages. You should not meet a scammer for the first time when your savings are on the line. Practise before it is real.”

## Likely judge questions

**Why use AI?** Static scripts become predictable. AI varies wording and responds to the learner, while the typed scenario graph, structured output, redaction, and deterministic scoring keep the experience bounded and explainable.

**Can it accidentally teach scammers?** The simulator never provides operational instructions, real links, real organisations, or methods for collecting credentials. It models only common social-pressure patterns already used in public safety education.

**How do you know the score is fair?** The model can only mark five predefined behaviours and must cite transcript evidence. Code—not the model—assigns the fixed points.

**What happens when an API fails?** Transcription falls back to typing, speech falls back to captions and browser speech, malformed AI output falls back to scripted safe dialogue, and the demo path is deterministic.

**How would this scale?** Scenario content is configuration, server routes are stateless, and sessions stay in the browser. New scams and languages do not require separate application flows.
