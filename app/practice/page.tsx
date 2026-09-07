import type { Metadata } from "next";
import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { SimulatorPhone } from "@/app/components/Simulator";
import SosButton from "@/app/components/SosButton";

export const metadata: Metadata = {
  title: "Practise a call | ScamGym",
  description: "Rehearse a scam call in English, Mandarin, Malay, or Tamil. Nothing is saved after the session.",
};

export default function PracticePage() {
  return (
    <main className="app-shell" id="main-content">
      <header className="topbar practice-topbar">
        <a className="brand" href="/" aria-label="ScamGym home">
          <span className="brand-mark">
            <ShieldCheck size={21} weight="fill" />
          </span>
          ScamGym
        </a>
        <p className="safe-label">Safe simulation · nothing is saved</p>
      </header>
      <div className="stage">
        <SimulatorPhone />
      </div>
      <SosButton />
    </main>
  );
}
