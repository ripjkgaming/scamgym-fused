"use client";

import { useEffect, useState } from "react";
import { Pause, PhoneDisconnect, MagnifyingGlass, ShieldCheck, Siren } from "@phosphor-icons/react";

export default function SosButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open ]);

  return (
    <>
      <button type="button" className="sos-fab" onClick={() => setOpen(true)}>
        <Siren size={20} weight="fill" aria-hidden="true" /> I think I am being scammed
      </button>
      {open && (
        <div className="sos-veil" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="sos-card" role="dialog" aria-modal="true" aria-labelledby="sos-h">
            <p className="eyebrow">Slow this down together</p>
            <h2 id="sos-h">Let us slow this down together.</h2>
            <p className="sos-first"><strong>Hang up or close the window now.</strong> Do not give any more information.</p>
            <ol className="sos-steps">
              <li>Do not send money, gift cards or codes.</li>
              <li>Call your bank on the number printed on your card, not a number they gave you.</li>
              <li>Tell a family member or someone you trust what happened.</li>
              <li>If money was sent, tell your bank straight away, then consider reporting it to your local police or consumer protection service.</li>
            </ol>
            <p className="lede">Take your time. Nothing bad happens from waiting.</p>
            <ol className="routine-list" aria-label="Three-step exit plan">
              <li><span><Pause size={20} weight="fill" /></span><div><strong>Pause</strong><p>Do not let urgency make the decision.</p></div></li>
              <li><span><PhoneDisconnect size={20} weight="fill" /></span><div><strong>Hang up</strong><p>You never need permission to end a call.</p></div></li>
              <li><span><MagnifyingGlass size={20} weight="bold" /></span><div><strong>Verify</strong><p>Find the official number yourself and call back.</p></div></li>
            </ol>
            <div className="button-row">
              <a className="secondary-button sos-cta" href="/check" onClick={() => setOpen(false)}><ShieldCheck size={19} /> Check the message</a>
              <button type="button" className="primary-button" onClick={() => setOpen(false)}>Close this</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
