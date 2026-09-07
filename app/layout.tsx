import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScamGym | Practise before it is real",
  description: "A safe voice-call simulator for building scam resistance.",
  openGraph: {
    title: "ScamGym | Practise before it is real",
    description: "Multilingual voice-call practice that helps seniors recognise scam pressure before it is real.",
    type: "website",
  },
};

import MorphBackground from "@/app/components/MorphBackground";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><a className="skip-link" href="#main-content">Skip to content</a><MorphBackground />{children}</body>
    </html>
  );
}
