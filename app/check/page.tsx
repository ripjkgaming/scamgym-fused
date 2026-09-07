import type { Metadata } from "next";
import SosButton from "@/app/components/SosButton";

export const metadata: Metadata = {
  title: "Check a message | ScamGym",
  description: "Paste a suspicious message and get a calm verdict with one clear next step.",
};

const SIGNS: Array<{ icon: string; title: string; example: string }> = [
  { icon: "\u25F7", title: "They rush you.", example: "\u201CAct now or your account closes today.\u201D" },
  { icon: "\u25C9", title: "They ask for gift cards, wire transfers or crypto.", example: "\u201CPay with gift cards to fix this.\u201D" },
  { icon: "\u2709", title: "They ask for passwords or codes from texts.", example: "\u201CRead me the code we just sent you.\u201D" },
  { icon: "\u260E", title: "They claim to be your bank, the government or tech support.", example: "\u201CThis is Microsoft, your computer is infected.\u201D" },
  { icon: "\u2665", title: "A grandchild or loved one is suddenly in trouble.", example: "\u201CGrandma, do not tell Mom, just send money.\u201D" },
  { icon: "\u2726", title: "You won a prize you never entered.", example: "\u201CYou won a lottery, just pay the fee first.\u201D" },
];

export default function CheckPage() {
  return (
    <main className="app-shell" id="main-content">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">S</span>ScamGym</div>
        <nav className="experience-progress" aria-label="Sections">
          <span><i>1</i>Check</span>
        </nav>
      </header>
      <div className="stage">
        <section className="phone">
          <div className="screen debrief-screen">
            <div><p className="eyebrow">Check before you act</p><h2>Common warning signs.</h2></div>
            <section className="review-section">
              <div className="warning-list">
                {SIGNS.map((s) => (
                  <div className="warning-item" key={s.title}>
                    <strong>{s.icon} {s.title}</strong>
                    <p>{s.example}</p>
                  </div>
                ))}
              </div>
            </section>
            <section className="review-section">
              <h3>You are doing the right thing by checking.</h3>
              <p className="lede">Asking for a second opinion is wise, never embarrassing. Scams work by creating panic. Slowing down is how you beat them.</p>
            </section>
          </div>
        </section>
      </div>
      <SosButton />
    </main>
  );
}
