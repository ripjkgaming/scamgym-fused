import Link from "next/link";
import LearningLayout, { HelpSection } from "@/app/components/LearningLayout";

export default function NotFound() {
  return <LearningLayout><main className="learning-width" id="main-content"><section className="not-found-section"><p className="learning-eyebrow">LET US GET YOU BACK ON TRACK</p><h1>This guide is not here.</h1><p>Explore our five scam guides to find a familiar situation and practise a safer response.</p><Link href="/#scam-types" className="learning-button">Explore the scam guides</Link></section><HelpSection /></main></LearningLayout>;
}
