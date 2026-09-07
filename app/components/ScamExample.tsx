"use client";

import { ChatCircleText, EnvelopeSimple, Headphones, LockKey, Package, Paperclip, Phone, ShieldWarning } from "@phosphor-icons/react";
import { useId, useState, type ReactNode } from "react";
import type { ScamChannel } from "@/lib/scam-channels";

export interface ScamExampleProps {
  channel: ScamChannel;
}

export default function ScamExample({ channel }: ScamExampleProps) {
  const [revealed, setRevealed] = useState(false);
  const id = useId();
  const flagsId = `${id}-flags`;

  function marker(index: number) {
    if (!revealed) return null;
    return (
      <span
        className="example-flag"
        role="img"
        aria-label={`Warning sign ${index + 1}: ${channel.warningSigns[index].title}`}
        aria-describedby={`${flagsId}-${index}`}
      >
        {index + 1}
      </span>
    );
  }

  let preview: ReactNode;
  let context: string;

  switch (channel.id) {
    case "text-sms":
      preview = (
        <div className="example-sms">
          <div className="example-toolbar">
            <span className="example-avatar"><Package size={24} aria-hidden="true" /></span>
            <div className="example-identity">
              <strong>Parcel service {marker(0)}</strong>
              <span>Text message</span>
            </div>
            <ChatCircleText size={22} aria-hidden="true" />
          </div>
          <div className="example-thread">
            <p className="example-timestamp">Today, 9:41 am</p>
            <div className="example-message">
              <p>Your parcel could not be delivered. Pay a $2.80 redelivery fee.</p>
              <p><span className="example-url">parcel-update.example/redelivery</span> {marker(1)}</p>
              <p>Confirm by 6 pm or your parcel will be returned. {marker(2)}</p>
            </div>
          </div>
        </div>
      );
      context = "An expected parcel and a familiar message thread can make this feel routine. Check the delivery through your original order or official app, not through this text.";
      break;
    case "phone":
      preview = (
        <div className="example-call">
          <div className="example-toolbar">
            <span className="example-call-label">Incoming call preview</span>
            <span className="example-badge">Text only</span>
          </div>
          <span className="example-avatar example-avatar--call"><Phone size={34} weight="fill" aria-hidden="true" /></span>
          <div className="example-identity">
            <strong>Bank security {marker(0)}</strong>
            <span className="example-call-status">Written example, no sound</span>
          </div>
          <div className="example-waveform" aria-hidden="true">
            <span /><span /><span /><span /><span /><span /><span /><span /><span />
          </div>
          <div className="example-transcript">
            <p className="example-transcript-label">What the caller says</p>
            <blockquote>
              <p>"We have found an unusual payment. Move your savings to a safe holding account so we can protect them." {marker(1)}</p>
              <p>"Stay on the line. Do not call your branch while we secure the account." {marker(2)}</p>
            </blockquote>
          </div>
        </div>
      );
      context = "A displayed bank name can be spoofed. End an unexpected call and use the number on your bank card or the official app; the caller's own transfer or callback number is not an independent check.";
      break;
    case "email":
      preview = (
        <div className="example-mail">
          <div className="example-toolbar">
            <EnvelopeSimple size={22} aria-hidden="true" />
            <span>Email example</span>
          </div>
          <dl className="example-mail-meta">
            <div>
              <dt>From</dt>
              <dd><strong>Accounts team</strong> {marker(0)}<span className="example-url">billing@harbour-services.example</span></dd>
            </div>
            <div><dt>To</dt><dd>You</dd></div>
            <div><dt>Subject</dt><dd>Action required: updated bank details</dd></div>
          </dl>
          <div className="example-mail-body">
            <p>Hello,</p>
            <p>Please find the replacement invoice for your recent booking. Our bank details have changed; use the new account in the attachment. {marker(1)}</p>
            <p>Payment is due today. Reply to this email only so we can avoid delays. {marker(2)}</p>
            <p>Thank you,<br />The accounts team</p>
            <div className="example-attachment">
              <Paperclip size={24} aria-hidden="true" />
              <div><strong>Invoice-update.pdf</strong><span>Example only. No file to open.</span></div>
            </div>
          </div>
        </div>
      );
      context = "Correct spelling, booking details and even a genuine email account do not settle a payment-change request. A compromised mailbox can look familiar; verify the new details through an existing trusted contact.";
      break;
    case "social-media":
      preview = (
        <div className="example-social">
          <div className="example-toolbar">
            <span className="example-avatar" aria-hidden="true">A</span>
            <div className="example-identity">
              <strong>Alex {marker(0)}</strong>
              <span>A familiar profile</span>
            </div>
            <ChatCircleText size={22} aria-hidden="true" />
          </div>
          <div className="example-thread">
            <p className="example-timestamp">Today, 7:12 pm</p>
            <div className="example-message">
              <p>Hey! I have been using a private investment group. My balance doubled in a week. The returns are guaranteed. {marker(1)}</p>
            </div>
            <div className="example-message example-message--followup">
              <p>There is only one spot left today. Keep it between us and message my adviser on another app. {marker(2)}</p>
              <p><span className="example-url">private-circle.example/join</span></p>
            </div>
          </div>
        </div>
      );
      context = "An old account can be taken over, and profit screenshots can be invented. Call your friend using a number you already have; a reply or voice note from the same profile is not an independent check.";
      break;
    case "websites":
      preview = (
        <div className="example-browser">
          <div className="example-toolbar">
            <span className="example-browser-dots" aria-hidden="true"><span /><span /><span /></span>
            <div className="example-address">
              <LockKey size={16} aria-hidden="true" />
              <span className="example-url">weekend-audio.example</span>
            </div>
          </div>
          <div className="example-store">
            <div className="example-store-header">
              <strong>Weekend Audio</strong>
              <span className="example-store-tag">Australian warehouse {marker(0)}</span>
            </div>
            <div className="example-product">
              <div className="example-product-art" aria-hidden="true"><Headphones size={112} weight="duotone" aria-hidden="true" /></div>
              <div className="example-product-copy">
                <p className="example-sale">Today only | Save $200</p>
                <h4>Wireless over-ear headphones</h4>
                <p className="example-price"><span>Was <s>$249</s></span><strong>Now $49</strong> {marker(1)}</p>
                <p>Big sound. A very small price.</p>
              </div>
            </div>
            <div className="example-payment">
              <strong>Bank transfer only {marker(2)}</strong>
              <p>Pay within 15 minutes to hold this price.</p>
            </div>
          </div>
        </div>
      );
      context = "The padlock represents an encrypted connection, not an approved seller. Local branding and a polished storefront are not proof either; check the business independently and understand the payment protections.";
      break;
  }

  return (
    <figure className={`example-frame example-frame--${channel.id}`} aria-labelledby={`${id}-title`}>
      <figcaption className="example-caption">
        <h3 className="example-title" id={`${id}-title`}>{channel.exampleTitle}</h3>
        <p className="example-intro">This example is made up. No links, calls or payments work.</p>
      </figcaption>
      <div className="example-preview">{preview}</div>
      <button
        className="example-reveal"
        type="button"
        aria-expanded={revealed}
        aria-controls={flagsId}
        onClick={() => setRevealed((current) => !current)}
      >
        <ShieldWarning size={20} aria-hidden="true" />
        {revealed ? "Hide warning signs" : "Show warning signs"}
        <span className="example-reveal-count" aria-hidden="true">{channel.warningSigns.length}</span>
      </button>
      <div className="example-flags" id={flagsId} hidden={!revealed} role="region" aria-label="Warning signs in this example">
        <ol className="example-flag-list">
          {channel.warningSigns.map((sign, index) => (
            <li className="example-flag-item" key={sign.title} id={`${flagsId}-${index}`}>
              <span className="example-flag-number" aria-hidden="true">{index + 1}</span>
              <div className="example-flag-copy"><h4>{sign.title}</h4><p>{sign.body}</p></div>
            </li>
          ))}
        </ol>
      </div>
      <details className="guide-more example-explanation"><summary>Why this can fool us</summary><p>{context}</p></details>
    </figure>
  );
}
