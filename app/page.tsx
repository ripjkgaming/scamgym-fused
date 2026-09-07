"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck } from "@phosphor-icons/react";
import LandingPage from "@/app/components/LandingPage";
import { SimulatorPhone } from "@/app/components/Simulator";
import SosButton from "@/app/components/SosButton";

function HomeRouter() {
  const params = useSearchParams();
  const isDemo = params.get("demo") === "1";

  if (isDemo) {
    return (
      <>
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
      </>
    );
  }

  return <LandingPage />;
}

export default function Home() {
  return (
    <main className="app-shell landing-shell" id="main-content">
      <Suspense>
        <HomeRouter />
      </Suspense>
      <SosButton />
    </main>
  );
}
