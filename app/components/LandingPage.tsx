"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bank,
  Buildings,
  CaretRight,
  ChatCircleText,
  CheckCircle,
  EnvelopeSimple,
  GlobeHemisphereWest,
  MagnifyingGlass,
  Microphone,
  Package,
  Pause,
  Phone,
  PhoneDisconnect,
  Printer,
  ShieldCheck,
  Siren,
  SpeakerHigh,
  UsersThree,
  WarningCircle,
} from "@phosphor-icons/react";
import { SimulatorPhone } from "@/app/components/Simulator";
import ShieldTools from "@/app/components/ShieldTools";
import { useLandingMotion } from "@/app/components/landing-motion";
import { landingCopy } from "@/app/components/landing-copy";
import { languages, tacticLabels } from "@/lib/i18n";
import { SCENARIOS } from "@/lib/scenarios";
import type { LanguageCode } from "@/lib/types";

const TICKER_LINES = [
  "“Your account will be frozen within two hours.”",
  "“Do not tell anyone, this case is confidential.”",
  "“Pay a $2 redelivery fee to release your parcel.”",
  "“We are transferring you to a senior officer.”",
  "“Move the money to a protected account now.”",
  "“You won a prize. Pay the fee first to claim it.”",
];

const PRESSURE_TURNS = [
  { speaker: "Caller", tactic: "fear" as const, text: "We detected an unfamiliar card payment of $840. Did you make it?", time: "0:04" },
  { speaker: "You", tactic: null, text: "No… I did not buy anything today.", time: "0:11" },
  { speaker: "Caller", tactic: "urgency" as const, text: "Your account may be frozen unless we verify it on this call, now.", time: "0:19" },
  { speaker: "Caller", tactic: "secrecy" as const, text: "There is no time to call the number on your card. Stay on this line.", time: "0:34" },
  { speaker: "You", tactic: null, text: "I am ending this call. I will phone the bank on the number printed on my card.", time: "0:47" },
];

const SIGNS = [
  { no: "01", title: "The clock is the weapon", body: "“Act within two hours or the account closes.” Real banks give you time. Scammers remove it, because a rushed person cannot check.", example: "Heard on a Tuesday afternoon: a frozen-account threat with a 90-minute deadline." },
  { no: "02", title: "Secrecy is the lock", body: "“Do not tell your children. This is confidential.” Isolation is deliberate. A second opinion ends most scams in one sentence.", example: "The government-impersonation script forbids calling anyone else first." },
  { no: "03", title: "The detour is the trap", body: "“Do not call the number on your card — let me transfer you.” Any request to skip the official channel is the clearest signal to leave.", example: "Parcel scripts push a link instead of the courier's own app." },
  { no: "04", title: "The safe account does not exist", body: "No bank, police unit, or courier moves your money to a protected account over the phone. That sentence is always the scam.", example: "Every bank-fraud rehearsal ends on this exact request." },
];

const ROUTINE = [
  { icon: Pause, step: "Pause", body: "Say: “I need to think about this.” Urgency loses its grip the moment you stop answering at their speed." },
  { icon: PhoneDisconnect, step: "Hang up", body: "You never need permission to end a call. The dial tone is a complete sentence." },
  { icon: MagnifyingGlass, step: "Verify alone", body: "Find the number yourself — card, bill, official site — and call back. Never use the number they gave you." },
];

const SCAM_GUIDES = [
  { id: "text-sms", title: "Text or SMS scams", icon: ChatCircleText },
  { id: "phone", title: "Phone scams", icon: Phone },
  { id: "email", title: "Email scams", icon: EnvelopeSimple },
  { id: "social-media", title: "Social media scams", icon: UsersThree },
  { id: "websites", title: "Website scams", icon: GlobeHemisphereWest },
];

export default function LandingPage() {
  const [language, setLanguage] = useState<LanguageCode>("en");
  const rootRef = useLandingMotion(true);
  const t = landingCopy[language];
  const tactics = tacticLabels[language];

  return (
    <div className="landing" ref={rootRef}>
      {/* ── Masthead ─────────────────────────────────────────── */}
      <header className="masthead">
        <Link className="brand" href="/" aria-label="ScamGym home">
          <span className="brand-mark">
            <ShieldCheck size={21} weight="fill" />
          </span>
          <span className="brand-word">
            ScamGym
            <small>rehearse the pressure</small>
          </span>
        </Link>
        <nav className="masthead-nav" aria-label="Sections">
          <a href="#rehearse">{t.navPractice}</a>
          <a href="#signs">{t.navSigns}</a>
          <a href="#check">{t.navTools}</a>
          <a href="#routine">{t.navRoutine}</a>
        </nav>
        <div className="masthead-right">
          <div className="lang-switch" role="group" aria-label="Language / Bahasa / 语言 / மொழி">
            {languages.map((l) => (
              <button
                key={l.code}
                type="button"
                className={language === l.code ? "on" : ""}
                aria-pressed={language === l.code}
                onClick={() => {
                  setLanguage(l.code);
                  document.documentElement.lang = l.code === "zh" ? "zh-CN" : l.code;
                }}
              >
                {l.short}
              </button>
            ))}
          </div>
          <Link className="btn btn-solid btn-sm" href="/practice">
            {t.startPractice}
            <ArrowUpRight size={17} weight="bold" />
          </Link>
        </div>
      </header>

      {/* ── Hero · asymmetric editorial ──────────────────────── */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-ledger" data-parallax="0.06" aria-hidden="true">
          <span>SIMULATION LOG — 04 CALLS THIS WEEK</span>
          <span>EN / 华语 / MELAYU / தமிழ்</span>
          <span>NOTHING LEAVES THIS BROWSER</span>
        </div>
        <div className="hero-grid">
          <div className="hero-main">
            <p className="hero-kicker">
              <span className="kicker-dot" aria-hidden="true" />
              {t.kicker}
            </p>
            <h1 className="hero-title" id="hero-title">
              <span className="mask">
                <span className="reveal-line">{t.titleA}</span>
              </span>
              <span className="mask">
                <span className="reveal-line accent-serif">{t.titleB}</span>
              </span>
              <span className="mask">
                <span className="reveal-line">{t.titleC}</span>
              </span>
            </h1>
            <p className="hero-standfirst">{t.standfirst}</p>
            <div className="hero-cta">
              <Link className="btn btn-solid btn-lg" href="/practice">
                <Microphone size={21} weight="fill" />
                {t.primaryCta}
              </Link>
              <a className="btn btn-ghost btn-lg" href="#rehearse">
                {t.secondaryCta}
                <ArrowRight size={19} />
              </a>
            </div>
            <dl className="hero-stats">
              <div className="stat-ring" data-count={t.statCalls}>
                <span className="stat-num">{t.statCalls}</span>
                <dt className="sr-only">scam types</dt>
                <dd>{t.statCallsLabel}</dd>
              </div>
              <div className="stat-ring" data-count={t.statMinutes}>
                <span className="stat-num">{t.statMinutes}</span>
                <dt className="sr-only">minutes</dt>
                <dd>{t.statMinutesLabel}</dd>
              </div>
              <div className="stat-ring" data-count={t.statLanguages}>
                <span className="stat-num">{t.statLanguages}</span>
                <dt className="sr-only">languages</dt>
                <dd>{t.statLanguagesLabel}</dd>
              </div>
            </dl>
          </div>
          <aside className="hero-rail" aria-label="This week's pressure lines">
            <p className="rail-label">{t.tickerLabel}</p>
            <ol className="rail-list">
              <li className="hero-margin">
                <span className="rail-time">Tue 14:02</span>
                <p>“This is the bank security team. An $840 payment just left your card.”</p>
                <span className="tactic-tag tactic-fear">{tactics.fear}</span>
              </li>
              <li className="hero-margin">
                <span className="rail-time">Wed 11:47</span>
                <p>“Your identity appeared in an investigation. Tell no one.”</p>
                <span className="tactic-tag tactic-secrecy">{tactics.secrecy}</span>
              </li>
              <li className="hero-margin">
                <span className="rail-time">Fri 09:15</span>
                <p>“A parcel is held. Open the link and pay $2 to release it.”</p>
                <span className="tactic-tag tactic-link">{tactics.link}</span>
              </li>
            </ol>
            <p className="rail-foot">
              <ShieldCheck size={16} weight="fill" />
              <span>Labels stay hidden during a real rehearsal. They are revealed afterwards.</span>
            </p>
          </aside>
        </div>
      </section>

      {/* ── Ticker ───────────────────────────────────────────── */}
      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {[...TICKER_LINES, ...TICKER_LINES].map((line, i) => (
            <span key={i} className="ticker-item">
              {line}
              <i>◆</i>
            </span>
          ))}
        </div>
      </div>

      {/* ── svg divider ──────────────────────────────────────── */}
      <svg className="rule-svg" viewBox="0 0 1200 40" preserveAspectRatio="none" aria-hidden="true">
        <path className="draw-path" d="M0 20 H 480 M 720 20 H 1200" strokeWidth="1.5" />
        <circle cx="600" cy="20" r="5" className="rule-dot" />
      </svg>

      {/* ── 01 · How a call corners you ──────────────────────── */}
      <section className="chapter" id="rehearse" aria-labelledby="chapter-pressure">
        <div className="chapter-head">
          <span className="chapter-no">01</span>
          <div>
            <p className="eyebrow">The pressure, line by line</p>
            <h2 id="chapter-pressure">
              <span className="mask">
                <span className="reveal-line">Watch a two-minute call</span>
              </span>
              <span className="mask">
                <span className="reveal-line accent-serif">tighten its grip.</span>
              </span>
            </h2>
          </div>
          <p className="chapter-side">
            This is the actual bank-fraud rehearsal script. Four caller turns, one safe exit. Scroll to see where the
            pressure peaks — and where the rehearsal teaches you to leave.
          </p>
        </div>
        <ol className="transcript-wall" data-stagger>
          {PRESSURE_TURNS.map((turn, i) => (
            <li key={i} data-stagger-item className={`tw-row ${turn.speaker === "You" ? "tw-you" : "tw-caller"}`}>
              <span className="tw-time">{turn.time}</span>
              <div className="tw-bubble">
                <p className="tw-speaker">{turn.speaker}</p>
                <p>{turn.text}</p>
                {turn.tactic && <span className={`tactic-tag tactic-${turn.tactic}`}>{tactics[turn.tactic]}</span>}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Pinned rehearsal · phone stays, cards scroll ─────── */}
      <section className="pin-wrap" aria-labelledby="pin-title">
        <div className="pin-stage">
          <div className="pin-progress" aria-hidden="true">
            <span className="pin-progress-fill" />
          </div>
          <div className="pin-grid">
            <div className="pin-phone">
              <SimulatorPhone />
            </div>
            <div className="pin-copy">
              <p className="eyebrow">Rehearse it yourself</p>
              <h2 id="pin-title">
                The phone stays.
                <span className="accent-serif"> The pressure scrolls past.</span>
              </h2>
              <p className="lede">
                This is the live simulator, pinned while the room moves. Answer the call, feel the rush, then end it on
                your terms. Nothing is recorded. Nothing leaves the browser.
              </p>
              <div className="pin-cards">
                <article className="pin-card">
                  <span>Step 1</span>
                  <p>Pick a scenario. Bank, government, or parcel — in your own language.</p>
                </article>
                <article className="pin-card">
                  <span>Step 2</span>
                  <p>Answer. Tap to speak, or type. The caller pushes. You practise pushing back.</p>
                </article>
                <article className="pin-card">
                  <span>Step 3</span>
                  <p>Review the pressure map. Every tactic is named, scored, and tied to your words.</p>
                </article>
              </div>
              <Link className="btn btn-solid" href="/practice?demo=1">
                Open the full rehearsal
                <ArrowUpRight size={18} weight="bold" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── svg divider ──────────────────────────────────────── */}
      <svg className="rule-svg" viewBox="0 0 1200 40" preserveAspectRatio="none" aria-hidden="true">
        <path className="draw-path" d="M0 20 C 300 4, 900 36, 1200 20" strokeWidth="1.5" fill="none" />
      </svg>

      {/* ── 02 · Warning signs · offset ledger ───────────────── */}
      <section className="chapter signs" id="signs" aria-labelledby="chapter-signs">
        <div className="chapter-head">
          <span className="chapter-no">02</span>
          <div>
            <p className="eyebrow">Field notes from reported calls</p>
            <h2 id="chapter-signs">
              <span className="mask">
                <span className="reveal-line">Four sentences that</span>
              </span>
              <span className="mask">
                <span className="reveal-line accent-serif">always mean leave.</span>
              </span>
            </h2>
          </div>
        </div>
        <ol className="ledger" data-stagger>
          {SIGNS.map((s) => (
            <li key={s.no} data-stagger-item>
              <span className="ledger-no">{s.no}</span>
              <div className="ledger-body">
                <h3>{s.title}</h3>
                <p>{s.body}</p>
                <p className="ledger-ex">{s.example}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="scenario-strip" data-stagger>
          {Object.values(SCENARIOS).map((s) => {
            const Icon = s.icon === "bank" ? Bank : s.icon === "government" ? Buildings : Package;
            return (
              <Link key={s.id} className="scenario-card" href="/practice" data-stagger-item>
                <span className="scenario-icon">
                  <Icon size={24} />
                </span>
                <strong>{s.title.en}</strong>
                <p>{s.description.en}</p>
                <span className="scenario-go">
                  Rehearse this <CaretRight size={16} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="chapter" id="scam-types" aria-labelledby="chapter-scam-guides" lang="en">
        <div className="chapter-head">
          <span className="chapter-no"><ShieldCheck size={22} aria-hidden="true" /></span>
          <div><p className="eyebrow">Five channels. A safer next step.</p><h2 id="chapter-scam-guides">Explore the scam guides.</h2></div>
          <p className="chapter-side">Realistic examples, warning signs and interactive practice. These English-language guides include Australian safety resources.</p>
        </div>
        <div className="scenario-strip">
          {SCAM_GUIDES.map(({ id, title, icon: Icon }) => (
            // A full navigation also stops any pending work in the embedded call.
            <a key={id} className="scenario-card" style={{ translate: "none" }} href={`/scams/${id}`}>
              <span className="scenario-icon"><Icon size={24} weight="duotone" aria-hidden="true" /></span>
              <strong>{title}</strong>
              <span className="scenario-go">Open the guide <CaretRight size={16} aria-hidden="true" /></span>
            </a>
          ))}
        </div>
      </section>

      {/* ── 03 · Check tools · split ─────────────────────────── */}
      <section className="chapter tools" id="check" aria-labelledby="chapter-check">
        <div className="tools-grid">
          <div className="tools-copy">
            <span className="chapter-no">03</span>
            <p className="eyebrow">Already received something strange?</p>
            <h2 id="chapter-check">
              <span className="mask">
                <span className="reveal-line">Paste the message.</span>
              </span>
              <span className="mask">
                <span className="reveal-line accent-serif">Get one clear next step.</span>
              </span>
            </h2>
            <p className="lede">
              No account, no history, no judgement. Describe the call, text, or visitor in your own words and the
              checker names what it sees — then tells you exactly what to do next.
            </p>
            <ul className="tools-points">
              <li>
                <CheckCircle size={20} weight="fill" /> Plain verdict: scam, safe, or unsure — with reasons
              </li>
              <li>
                <CheckCircle size={20} weight="fill" /> A short note you can forward to family
              </li>
              <li>
                <CheckCircle size={20} weight="fill" /> Confusing pop-up? The explainer translates tech into plain words
              </li>
            </ul>
            <p className="tools-note">
              <WarningCircle size={17} weight="fill" />
              <span>Sensitive details are stripped before anything is analysed.</span>
            </p>
          </div>
          <div className="tools-panel">
            <ShieldTools />
          </div>
        </div>
      </section>

      {/* ── 04 · Exit plan · dark card ───────────────────────── */}
      <section className="chapter routine" id="routine" aria-labelledby="chapter-routine">
        <div className="routine-card">
          <div className="routine-head">
            <span className="chapter-no light">04</span>
            <div>
              <p className="eyebrow light">One routine for every unexpected caller</p>
              <h2 id="chapter-routine">
                Pause. Hang up.
                <span className="accent-serif"> Verify alone.</span>
              </h2>
              <p className="routine-sub">
                Print it. Stick it beside the phone. Use it the same way every time, until it becomes reflex.
              </p>
            </div>
            <button className="print-button routine-print" type="button" onClick={() => window.print()}>
              <Printer size={19} /> Print safety plan
            </button>
          </div>
          <ol className="routine-steps" data-stagger>
            {ROUTINE.map((r, i) => (
              <li key={r.step} data-stagger-item>
                <span className="routine-no">0{i + 1}</span>
                <span className="routine-ic">
                  <r.icon size={24} weight="fill" />
                </span>
                <h3>{r.step}</h3>
                <p>{r.body}</p>
              </li>
            ))}
          </ol>
          <div className="routine-proof">
            <div>
              <SpeakerHigh size={22} weight="fill" />
              <p>Rehearsal beats advice. One two-minute practice builds the muscle that a poster cannot.</p>
            </div>
            <Link className="btn btn-solid btn-lg" href="/practice">
              <Microphone size={21} weight="fill" />
              Start your rehearsal
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="colophon">
        <div className="colophon-grid">
          <div>
            <p className="brand">
              <span className="brand-mark">
                <ShieldCheck size={19} weight="fill" />
              </span>
              ScamGym
            </p>
            <p className="colophon-line">Practise before it is real. A safe simulator for scam resistance.</p>
          </div>
          <nav aria-label="Footer">
            <a href="#rehearse">{t.navPractice}</a>
            <a href="#signs">{t.navSigns}</a>
            <a href="#check">{t.navTools}</a>
            <a href="#scam-types" lang="en">Scam guides</a>
            <a href="/practice">Full rehearsal</a>
          </nav>
          <p className="colophon-line small">
            Training only. ScamGym never places real calls, never asks for real details, and never saves a session.
            If you think money has already moved, call your bank on the number printed on your card, then your local
            police.
          </p>
        </div>
        <p className="sos-strip">
          <Siren size={18} weight="fill" />
          <span>
            Mid-scam right now? Hang up first — then <a href="/check">check the message</a> or open the red button on
            any page.
          </span>
        </p>
      </footer>
    </div>
  );
}
