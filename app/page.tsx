"use client";

import {
  ArrowRight,
  Bank,
  Buildings,
  CaretRight,
  Check,
  CheckCircle,
  Headphones,
  LockKey,
  Microphone,
  MagnifyingGlass,
  Package,
  PaperPlaneTilt,
  Pause,
  Phone,
  PhoneDisconnect,
  Printer,
  ShieldCheck,
  SpeakerHigh,
  Stop,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { DEMO_CALLER_TURNS, demoDebrief, demoTurn } from "@/lib/demo";
import { behaviorLabels, getCopy, languages, tacticLabels } from "@/lib/i18n";
import { redactSensitive } from "@/lib/redact";
import { buildEvidence, createDebrief } from "@/lib/scoring";
import { SCENARIOS, scenarioList } from "@/lib/scenarios";
import type { AgentTurn, Debrief, LanguageCode, Outcome, ScenarioId, TranscriptTurn, VoiceRole } from "@/lib/types";
import ShieldTools from "@/app/components/ShieldTools";
import SosButton from "@/app/components/SosButton";

type Screen = "setup" | "consent" | "incoming" | "call" | "loading" | "debrief";
type BusyState = "idle" | "recording" | "transcribing" | "thinking" | "speaking";

const languageVoices: Record<LanguageCode, string> = { en: "en-SG", zh: "zh-CN", ms: "ms-MY", ta: "ta-IN" };

const fallbackLines: Record<LanguageCode, Record<ScenarioId, string[]>> = {
  en: {
    bank_fraud: ["This is the bank security team. We detected an unfamiliar card payment. Did you make it?", "Your account may be frozen unless we verify it now.", "Please do not hang up. I can move the money to a protected account.", "You must decide now or the payment may go through."],
    government_impersonation: ["This is an investigation office. Your identity has appeared in a case.", "This matter is confidential. You must not discuss it with anyone.", "I need to transfer you to a senior officer now.", "Delaying this interview may have consequences."],
    parcel_delivery: ["We could not deliver a parcel addressed to you.", "A small redelivery fee is required before we can continue.", "Please open the link in the message we sent.", "The parcel will be returned if you do not act now."],
  },
  zh: {
    bank_fraud: ["这里是银行保安部。我们发现一笔陌生的银行卡交易。是您进行的吗？", "如果现在不核实，您的账户可能被冻结。", "请不要挂断。我可以把资金转到受保护账户。", "您必须立即决定，否则交易可能完成。"],
    government_impersonation: ["这里是调查部门。您的身份资料涉及一宗案件。", "此事必须保密，请不要告诉任何人。", "我现在需要把您转接给高级调查员。", "延迟接受调查可能会带来后果。"],
    parcel_delivery: ["我们无法送达一个属于您的包裹。", "重新派送前需要支付一笔小额费用。", "请打开我们发送给您的链接。", "如果您不立即行动，包裹将被退回。"],
  },
  ms: {
    bank_fraud: ["Ini pasukan keselamatan bank. Kami mengesan bayaran kad yang tidak dikenali. Adakah anda membuatnya?", "Akaun anda mungkin dibekukan jika tidak disahkan sekarang.", "Jangan tamatkan panggilan. Saya boleh pindahkan wang ke akaun terlindung.", "Anda perlu membuat keputusan sekarang atau bayaran itu mungkin diteruskan."],
    government_impersonation: ["Ini pejabat siasatan. Identiti anda muncul dalam satu kes.", "Perkara ini sulit. Jangan beritahu sesiapa.", "Saya perlu pindahkan anda kepada pegawai kanan sekarang.", "Kelewatan temu bual ini mungkin membawa akibat."],
    parcel_delivery: ["Kami tidak dapat menghantar bungkusan untuk anda.", "Bayaran kecil diperlukan untuk penghantaran semula.", "Sila buka pautan dalam mesej yang kami hantar.", "Bungkusan akan dipulangkan jika anda tidak bertindak sekarang."],
  },
  ta: {
    bank_fraud: ["இது வங்கி பாதுகாப்புக் குழு. அறியாத அட்டை பணப்பரிவர்த்தனை கண்டறியப்பட்டது. அதை நீங்கள் செய்தீர்களா?", "இப்போது சரிபார்க்காவிட்டால் உங்கள் கணக்கு முடக்கப்படலாம்.", "அழைப்பை நிறுத்த வேண்டாம். பணத்தை பாதுகாப்பான கணக்கிற்கு மாற்ற முடியும்.", "இப்போதே முடிவு செய்ய வேண்டும் அல்லது பணம் செலுத்தப்படலாம்."],
    government_impersonation: ["இது விசாரணை அலுவலகம். ஒரு வழக்கில் உங்கள் அடையாளம் தோன்றியுள்ளது.", "இது ரகசியமானது. யாரிடமும் சொல்ல வேண்டாம்.", "இப்போது உங்களை மூத்த அதிகாரியிடம் இணைக்க வேண்டும்.", "இந்த நேர்காணலை தாமதப்படுத்தினால் விளைவுகள் ஏற்படலாம்."],
    parcel_delivery: ["உங்களுக்கான பார்சலை வழங்க முடியவில்லை.", "மீண்டும் வழங்க சிறிய கட்டணம் தேவை.", "நாங்கள் அனுப்பிய செய்தியில் உள்ள இணைப்பைத் திறக்கவும்.", "இப்போது செயல்படாவிட்டால் பார்சல் திருப்பி அனுப்பப்படும்."],
  },
};

function makeTurn(role: "caller" | "user", text: string, start: number, tactic?: AgentTurn["tactic"]): TranscriptTurn {
  return { id: crypto.randomUUID(), role, text, timestampMs: Math.max(0, Date.now() - start), tactic };
}

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

async function fetchWithTimeout(input: RequestInfo, init: RequestInit, timeout = 16_000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [scenarioId, setScenarioId] = useState<ScenarioId>("bank_fraud");
  const [history, setHistory] = useState<TranscriptTurn[]>([]);
  const [busy, setBusy] = useState<BusyState>("idle");
  const [stage, setStage] = useState("alert");
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [typedMode, setTypedMode] = useState(false);
  const [typedReply, setTypedReply] = useState("");
  const [notice, setNotice] = useState<{ kind: "error" | "safe"; text: string } | null>(null);
  const [debrief, setDebrief] = useState<Debrief | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [coachPlaying, setCoachPlaying] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const startingRecordingRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  const c = getCopy(language);
  const scenario = SCENARIOS[scenarioId];
  const goldenDemo = demoMode && language === "en" && scenarioId === "bank_fraud";
  const progressStep = screen === "debrief" ? 2 : screen === "call" || screen === "loading" ? 1 : 0;

  useEffect(() => {
    const isDemo = new URLSearchParams(window.location.search).get("demo") === "1";
    setDemoMode(isDemo);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (screen !== "call" || !startedAt) return;
    const timer = window.setInterval(() => {
      const next = Math.min(120, Math.floor((Date.now() - startedAt) / 1000));
      setElapsed(next);
      if (next >= 120) void finishSession("timeout");
    }, 1000);
    return () => window.clearInterval(timer);
  });

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [history, busy]);

  useEffect(() => () => {
    audioRef.current?.pause();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    window.speechSynthesis?.cancel();
  }, []);

  const reset = (keepChoices = true) => {
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    setHistory([]); setDebrief(null); setNotice(null); setElapsed(0); setStartedAt(0); setStage("alert"); setBusy("idle"); setTypedReply("");
    setScreen(keepChoices ? "incoming" : "setup");
  };

  const localFallbackTurn = (items: TranscriptTurn[]): AgentTurn => {
    const index = Math.min(items.filter((item) => item.role === "user").length, 3);
    const configStage = scenario.stages[Math.min(index, scenario.stages.length - 1)];
    return { spokenText: fallbackLines[language][scenarioId][index], tactic: configStage.tactic, nextStage: scenario.stages[Math.min(index + 1, scenario.stages.length - 1)].id, shouldEnd: index >= 3, outcome: index >= 3 ? "timeout" : undefined };
  };

  const speakInBrowser = (text: string) => new Promise<void>((resolve) => {
    if (!("speechSynthesis" in window)) return resolve();
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageVoices[language];
    utterance.rate = 0.92;
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      resolve();
    };
    const timeout = window.setTimeout(finish, 3_000);
    utterance.onend = finish;
    utterance.onerror = finish;
    window.speechSynthesis.speak(utterance);
  });

  const playSpeech = async (text: string, role: VoiceRole, demoIndex?: number) => {
    setBusy("speaking");
    setNotice(null);
    try {
      if (goldenDemo && role === "caller" && demoIndex !== undefined) {
        const cached = await fetch(`/demo-audio/bank-${demoIndex}.mp3`);
        if (cached.ok) {
          const blob = await cached.blob();
          await playBlob(blob);
          return;
        }
        await speakInBrowser(text);
        return;
      }
      const response = await fetchWithTimeout("/api/speech", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, language, role }) });
      if (!response.ok) throw new Error("speech unavailable");
      await playBlob(await response.blob());
    } catch {
      setNotice({ kind: "error", text: c.fallback });
      await speakInBrowser(text);
    } finally {
      setBusy("idle");
    }
  };

  const playBlob = (blob: Blob) => new Promise<void>((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
    audio.onerror = () => { URL.revokeObjectURL(url); reject(new Error("audio playback failed")); };
    void audio.play().catch(reject);
  });

  const replayLastCaller = async () => {
    const lastCaller = [...history].reverse().find((turn) => turn.role === "caller");
    if (!lastCaller || busy !== "idle") return;
    const demoIndex = goldenDemo ? Math.max(0, DEMO_CALLER_TURNS.findIndex((item) => item.spokenText === lastCaller.text)) : undefined;
    await playSpeech(lastCaller.text, "caller", demoIndex);
  };

  const appendCaller = async (turn: AgentTurn, baseHistory: TranscriptTurn[] = history) => {
    const callStart = startedAt || Date.now();
    const next = makeTurn("caller", turn.safetyIntervention || turn.spokenText, callStart, turn.tactic);
    setHistory([...baseHistory, next]);
    setStage(turn.nextStage);
    const demoIndex = goldenDemo ? Math.max(0, DEMO_CALLER_TURNS.findIndex((item) => item.spokenText === turn.spokenText)) : undefined;
    await playSpeech(next.text, "caller", demoIndex);
    if (turn.shouldEnd) await finishSession(turn.outcome || "timeout", [...baseHistory, next]);
  };

  const requestTurn = async (items: TranscriptTurn[], currentStage = stage) => {
    setBusy("thinking");
    try {
      if (goldenDemo) return demoTurn(items);
      const response = await fetchWithTimeout("/api/turn", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: scenarioId, language, currentStage, history: items, elapsedTime: elapsed }),
      });
      if (!response.ok) throw new Error("turn unavailable");
      return (await response.json()) as AgentTurn;
    } catch {
      setNotice({ kind: "error", text: c.networkError });
      return localFallbackTurn(items);
    }
  };

  const answerCall = async () => {
    const now = Date.now();
    setStartedAt(now); setElapsed(0); setHistory([]); setScreen("call"); setNotice(null);
    const first = goldenDemo ? DEMO_CALLER_TURNS[0] : await requestTurn([], scenario.stages[0].id);
    await appendCaller(first, []);
  };

  const submitUserText = async (raw: string) => {
    if (!raw.trim() || busy !== "idle") return;
    const clean = redactSensitive(raw.trim());
    if (clean.redacted) setNotice({ kind: "safe", text: c.redacted }); else setNotice(null);
    const userTurn = makeTurn("user", clean.text, startedAt);
    const nextHistory = [...history, userTurn];
    setHistory(nextHistory); setTypedReply("");
    const nextTurn = await requestTurn(nextHistory);
    await appendCaller(nextTurn, nextHistory);
  };

  const startRecording = async () => {
    if (busy !== "idle" || startingRecordingRef.current) return;
    startingRecordingRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (data) => { if (data.data.size) chunksRef.current.push(data.data); };
      recorder.onstop = () => void transcribeRecording(new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }));
      recorder.start();
      setBusy("recording"); setNotice(null);
    } catch {
      setTypedMode(true); setBusy("idle"); setNotice({ kind: "error", text: c.micError });
    } finally {
      startingRecordingRef.current = false;
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  };

  const transcribeRecording = async (blob: Blob) => {
    setBusy("transcribing");
    try {
      if (blob.size < 256) throw new Error("empty recording");
      const form = new FormData();
      form.set("audio", blob, "reply.webm"); form.set("language", language);
      const response = await fetchWithTimeout("/api/transcribe", { method: "POST", body: form }, 18_000);
      if (!response.ok) throw new Error("transcription unavailable");
      const result = await response.json() as { transcript: string; redacted: boolean };
      setBusy("idle");
      if (result.redacted) setNotice({ kind: "safe", text: c.redacted });
      await submitUserText(result.transcript);
    } catch {
      setBusy("idle"); setTypedMode(true); setNotice({ kind: "error", text: c.micError });
    }
  };

  const fallbackDebrief = (items: TranscriptTurn[], outcome: Outcome): Debrief => {
    const base = demoDebrief(items);
    const evidence = buildEvidence([
      { key: "verify_officially", achieved: outcome === "safe_exit" },
      { key: "refuse_sensitive", achieved: false }, { key: "question_pressure", achieved: false },
      { key: "refuse_action", achieved: outcome === "safe_exit" }, { key: "consult_trusted", achieved: false },
    ]).map((item, index) => ({ ...item, behavior: behaviorLabels[language][Object.keys(behaviorLabels.en)[index]] }));
    return createDebrief({ ...base, outcome, evidence, detectedRedFlags: scenario.redFlags[language].slice(0, 1), missedRedFlags: scenario.redFlags[language].slice(1), saferResponse: language === "zh" ? "我会结束通话，并使用官方号码自行联系有关机构。" : language === "ms" ? "Saya akan tamatkan panggilan dan hubungi organisasi melalui nombor rasmi." : language === "ta" ? "நான் அழைப்பை முடித்து, அதிகாரப்பூர்வ எண்ணில் நிறுவனத்தை தொடர்புகொள்வேன்." : base.saferResponse, coachingSummary: language === "zh" ? "做得好。遇到突如其来的要求时，请放慢脚步、结束通话，并通过官方渠道自行核实。" : language === "ms" ? "Syabas kerana berlatih. Perlahankan keadaan, tamatkan panggilan dan semak sendiri melalui saluran rasmi." : language === "ta" ? "பயிற்சி செய்தது சிறப்பு. அழைப்பை முடித்து, அதிகாரப்பூர்வ வழியில் தனியாக சரிபார்க்கவும்." : base.coachingSummary });
  };

  const finishSession = async (outcome: Outcome, suppliedHistory?: TranscriptTurn[]) => {
    if (screen === "loading" || screen === "debrief") return;
    const finalHistory = suppliedHistory || history;
    audioRef.current?.pause(); window.speechSynthesis?.cancel();
    setScreen("loading"); setBusy("thinking");
    try {
      const result = goldenDemo ? demoDebrief(finalHistory) : await (async () => {
        const response = await fetchWithTimeout("/api/debrief", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenario: scenarioId, language, history: finalHistory, forcedOutcome: outcome }) }, 18_000);
        if (!response.ok) throw new Error("debrief unavailable");
        return response.json() as Promise<Debrief>;
      })();
      setDebrief(result);
    } catch {
      setDebrief(fallbackDebrief(finalHistory, outcome));
    } finally {
      setBusy("idle"); setScreen("debrief");
    }
  };

  const playCoach = async () => {
    if (!debrief) return;
    if (coachPlaying) {
      audioRef.current?.pause(); window.speechSynthesis?.cancel(); setCoachPlaying(false); setBusy("idle"); return;
    }
    setCoachPlaying(true);
    await playSpeech(debrief.coachingSummary, "coach");
    setCoachPlaying(false);
  };

  const selectedScenarioIcon = useMemo(() => scenario.icon === "bank" ? Bank : scenario.icon === "government" ? Buildings : Package, [scenario.icon]);
  const SelectedIcon = selectedScenarioIcon;

  return (
    <main className="app-shell" id="main-content">
      <header className="topbar">
        <div className="brand"><span className="brand-mark"><ShieldCheck size={21} weight="fill" /></span>{c.brand}</div>
        <nav className="experience-progress" aria-label="Session progress">
          {[c.progressSetup, c.progressCall, c.progressReview].map((label, index) => <span key={label} className={index <= progressStep ? "active" : ""}><i>{index + 1}</i>{label}</span>)}
        </nav>
      </header>
      <div className="stage">
        <section className="phone">
          {screen === "setup" && (
            <div className="screen setup-screen">
              <div><p className="eyebrow">{c.eyebrow}</p><h1>{c.setupTitle}</h1><p className="lede">{c.setupBody}</p><p className="proof-line"><ShieldCheck size={17} weight="fill" />{c.proofLine}</p></div>
              <div className="field-group"><span className="field-label">{c.chooseLanguage}</span><div className="language-grid">
                {languages.map((item) => <button key={item.code} className={`choice-button language-button ${language === item.code ? "selected" : ""}`} onClick={() => setLanguage(item.code)} aria-pressed={language === item.code}><span className="language-short">{item.short}</span><span>{item.label}</span></button>)}
              </div></div>
              <div className="field-group"><span className="field-label">{c.chooseScenario}</span><div className="scenario-list">
                {scenarioList.map((item) => {
                  const Icon = item.icon === "bank" ? Bank : item.icon === "government" ? Buildings : Package;
                  return <button key={item.id} className={`choice-button scenario-button ${scenarioId === item.id ? "selected" : ""}`} onClick={() => setScenarioId(item.id)} aria-pressed={scenarioId === item.id}><span className="scenario-icon"><Icon size={23} /></span><span className="scenario-copy"><strong>{item.title[language]}</strong><p>{item.description[language]}</p></span><CaretRight size={20} /></button>;
                })}
              </div></div>
              <div className="push-bottom"><button className="primary-button w-full" onClick={() => setScreen("consent")}>{c.continue} <ArrowRight className="inline ml-2" size={19} /></button><p className="privacy-note"><LockKey size={16} />{c.privacy}</p></div>
              <section className="review-section" aria-label="Check a message">
                <ShieldTools />
              </section>
            </div>
          )}

          {screen === "consent" && (
            <div className="screen consent-screen">
              <span className="safety-symbol"><ShieldCheck size={38} weight="duotone" /></span><div><h2>{c.safetyTitle}</h2><p className="lede">{c.safetyBody}</p></div>
              <div className="safety-list"><div className="safety-row"><CheckCircle size={22} weight="fill" /><span>{c.privacy}</span></div><div className="safety-row"><WarningCircle size={22} weight="fill" /><span>{c.redacted}</span></div></div>
              <div className="button-row"><button className="secondary-button" onClick={() => setScreen("setup")}>{c.decline}</button><button className="primary-button" onClick={() => setScreen("incoming")}>{c.understand}</button></div>
            </div>
          )}

          {screen === "incoming" && (
            <div className="screen incoming-screen">
              <p className="incoming-meta">{c.incoming}</p><span className="avatar"><SelectedIcon size={54} weight="duotone" /></span><h2 className="caller-name">{scenario.callerLabel[language]}</h2><span className="simulation-tag"><ShieldCheck size={17} weight="fill" />{c.simulated}</span>
              <div className="incoming-actions"><button className="secondary-button" onClick={() => setScreen("setup")}>{c.decline}</button><button className="primary-button" onClick={() => void answerCall()}><Phone className="inline mr-2" size={20} weight="fill" />{c.answer}</button></div>
            </div>
          )}

          {screen === "call" && (
            <div className="screen call-screen">
              <div className="call-header"><div className="caller-identity"><span className="mini-avatar"><SelectedIcon size={23} /></span><div><strong>{scenario.callerLabel[language]}</strong><div className="timer">{c.elapsed}: {formatTime(elapsed)}</div></div></div><button className="end-call-button" onClick={() => void finishSession("safe_exit")}><PhoneDisconnect size={22} weight="fill" /><span>{c.endCall}</span></button></div>
              <div className="training-banner"><ShieldCheck size={19} weight="fill" /><strong>{c.trainingOnly}</strong></div>
              <div className="transcript" ref={transcriptRef} aria-live="polite" aria-busy={busy !== "idle"}>{history.map((turn) => <div className={`bubble ${turn.role}`} key={turn.id}>{turn.text}</div>)}</div>
              <div className="call-tools"><div className="status-line" role="status">{busy === "speaking" && <><span className="sound-bars"><span /><span /><span /></span>{c.callerSpeaking}</>}{busy === "thinking" && c.preparing}{busy === "transcribing" && c.analysing}{busy === "recording" && c.listening}</div><button className="replay-button" onClick={() => void replayLastCaller()} disabled={busy !== "idle" || !history.some((turn) => turn.role === "caller")}><SpeakerHigh size={20} weight="fill" />{c.replayCaller}</button></div>
              {notice && <div className={`notice ${notice.kind}`}>{notice.text}</div>}
              <div className="composer">
                {!typedMode ? <><button className={`talk-button ${busy === "recording" ? "recording" : ""}`} disabled={!(["idle", "recording"] as BusyState[]).includes(busy)} onClick={() => busy === "recording" ? stopRecording() : void startRecording()}>{busy === "recording" ? <><Stop size={25} weight="fill" />{c.release}</> : <><Microphone size={26} weight="fill" />{c.holdToSpeak}</>}</button><p className="call-tip">{c.callTip}</p><button className="text-toggle" onClick={() => setTypedMode(true)}>{c.typeInstead}</button></> : <form className="text-form" onSubmit={(event: FormEvent) => { event.preventDefault(); void submitUserText(typedReply); }}><label htmlFor="reply">{c.typeLabel}</label><div className="text-form-row"><input id="reply" className="text-input" value={typedReply} onChange={(event) => setTypedReply(event.target.value)} placeholder={c.typePlaceholder} autoFocus /><button className="send-button" type="submit" disabled={busy !== "idle" || !typedReply.trim()} aria-label={c.send}><PaperPlaneTilt size={22} weight="fill" /></button></div><button type="button" className="text-toggle" onClick={() => setTypedMode(false)}><Microphone className="inline mr-2" size={19} />{c.holdToSpeak}</button></form>}
              </div>
            </div>
          )}

          {screen === "loading" && <div className="screen loading-screen"><div className="loading-wave"><span /><span /><span /><span /><span /></div><h2>{c.analysing}</h2><p className="lede">{c.privacy}</p></div>}

          {screen === "debrief" && debrief && (
            <div className="screen debrief-screen">
              <div><p className="eyebrow">{c.practice}</p><h2>{c.debriefTitle}</h2></div>
              <div className="score-layout"><div className="score-ring" style={{ "--score": debrief.score } as React.CSSProperties}><span className="score-number">{debrief.score}</span></div><div className="score-copy"><h3>{c.scoreLabel}</h3><p>{debrief.score >= 75 ? debrief.coachingSummary : c.safer}</p></div></div>
              <section className="review-section"><h3>{c.spotted}</h3><div className="evidence-list">{debrief.evidence.map((item) => <div className="evidence-item" key={item.behavior}>{item.achieved ? <CheckCircle className="evidence-icon" size={22} weight="fill" /> : <X className="evidence-icon missed" size={22} />}<div><strong>{item.behavior}</strong>{item.feedback && <p className="judgement-note">{item.feedback}</p>}{item.transcriptExcerpt && <p className="evidence-quote">“{item.transcriptExcerpt}”</p>}</div><span className="points">{item.achieved ? `+${item.points}` : "0"}</span></div>)}</div></section>
              <section className="review-section pressure-section"><div className="section-heading"><div><h3>{c.pressureMap}</h3><p>{c.pressureMapBody}</p></div><span className="analysis-mark"><MagnifyingGlass size={20} weight="bold" /></span></div><div className="pressure-map">{history.filter((turn) => turn.role === "caller").map((turn, index) => <article className="pressure-turn" key={turn.id}><span className="turn-index">{String(index + 1).padStart(2, "0")}</span><div><span className={`tactic-tag tactic-${turn.tactic || "authority"}`}>{tacticLabels[language][turn.tactic || "authority"]}</span><p>{turn.text}</p></div></article>)}</div></section>
              <section className="review-section"><h3>{c.missed}</h3><div className="warning-list">{debrief.missedRedFlags.map((item) => <div className="warning-item" key={item}>{item}</div>)}</div></section>
              <section className="review-section"><h3>{c.safer}</h3><p className="safer-response">“{debrief.saferResponse}”</p><button className="secondary-button w-full" onClick={() => void playCoach()}>{coachPlaying ? <Stop className="inline mr-2" size={20} weight="fill" /> : <Headphones className="inline mr-2" size={20} />}{coachPlaying ? c.stopCoach : c.listenCoach}</button></section>
              <section className="safety-card"><div className="section-heading"><div><p className="eyebrow">{c.practice}</p><h3>{c.safetyRoutine}</h3><p>{c.safetyRoutineBody}</p></div></div><ol className="routine-list"><li><span><Pause size={20} weight="fill" /></span><div><strong>{c.routinePause}</strong><p>{c.routinePauseBody}</p></div></li><li><span><PhoneDisconnect size={20} weight="fill" /></span><div><strong>{c.routineHangUp}</strong><p>{c.routineHangUpBody}</p></div></li><li><span><MagnifyingGlass size={20} weight="bold" /></span><div><strong>{c.routineVerify}</strong><p>{c.routineVerifyBody}</p></div></li></ol><button className="print-button" onClick={() => window.print()}><Printer size={19} />{c.printPlan}</button></section>
              <div className="debrief-actions"><button className="primary-button" onClick={() => reset(true)}>{c.retry}</button><button className="secondary-button" onClick={() => reset(false)}>{c.newScenario}</button></div>
            </div>
          )}
        </section>
      </div>
      <SosButton />
    </main>
  );
}
