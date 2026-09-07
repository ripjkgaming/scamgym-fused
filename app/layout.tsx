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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,560;0,9..144,640;1,9..144,560&display=swap"
          rel="stylesheet"
        />
      </head>
      <body><a className="skip-link" href="#main-content">Skip to content</a><MorphBackground />{children}</body>
    </html>
  );
}
