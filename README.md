# ScamGym

ScamGym is a local-first voice-call simulator that helps Singapore seniors practise responding safely to common scams. It supports fake bank, government impersonation, and parcel delivery scenarios in English, Mandarin, Malay, and Tamil.

Unlike a scam-information chatbot, ScamGym rehearses the moment of pressure. Tactic labels stay hidden during the call, then an annotated pressure map connects each caller message to fear, urgency, secrecy, false authority, payment pressure, or an unsafe link. OpenRouter serves the free Gemma 4 31B chat model for caller turns and evidence extraction, application code calculates the score, and ElevenLabs gives the caller and coach distinct voices. The check-a-message tools use the free Liquid LFM 2.5 model, also via OpenRouter.

## Senior-first interaction design

- Large default type, strong contrast, captions, visible focus states, and 52px-or-larger controls.
- Tap once to start speaking and tap again to send—no press-and-hold dexterity requirement.
- A permanently visible simulation banner and a labeled **End call** control reduce ambiguity.
- Learners can replay the most recent caller message or switch to typed input at any time.
- Plain-language recovery states keep the session usable when microphone, transcription, AI, or speech services fail.

## Start locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and add your OpenRouter key and ElevenLabs voice IDs.
3. Start the app with `npm run dev`.
4. Open `http://localhost:3000`.

Use `http://localhost:3000/?demo=1` for the deterministic English bank demo. Without cached audio, demo mode uses the browser's local speech engine.

## Cache the judging demo audio

With the ElevenLabs variables available in your shell, run `npm run cache:demo-audio`. This generates five ignored MP3 files under `public/demo-audio`. The app will use them automatically in demo mode and continue to work if the APIs are unavailable.

## Quality checks

- `npm test` runs unit tests for redaction, scoring, scenario coverage, and translations.
- `npm run build` runs the production type and build checks.
- `npx playwright install chromium && npm run test:e2e` runs the mobile demo flow.
- `npm run smoke:live` checks all 12 live scenario/language openings plus speech, transcription, and debrief contracts against a running server.

All model and audio calls are stateless. API keys remain on the server, and sensitive-looking transcript content is replaced with `[REDACTED]` before it is sent for evaluation.

## Judging materials

- [Three-minute demo script](docs/PITCH_SCRIPT.md)
- [Rubric audit and score rationale](docs/RUBRIC_AUDIT.md)
