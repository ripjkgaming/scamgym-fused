import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import LearningLayout, { HelpSection } from "@/app/components/LearningLayout";
import GuideSteps from "@/app/components/GuideSteps";
import { getScamChannel, scamChannels } from "@/lib/scam-channels";

type GuideProps = { params: Promise<{ channel: string }> };

export function generateStaticParams() {
  return scamChannels.map(({ id }) => ({ channel: id }));
}

export async function generateMetadata({ params }: GuideProps): Promise<Metadata> {
  const channel = getScamChannel((await params).channel);
  return channel ? { title: `${channel.title} | ScamGym`, description: channel.description, openGraph: { title: `${channel.title} | ScamGym`, description: channel.description } } : {};
}

export default async function ScamGuide({ params }: GuideProps) {
  const channel = getScamChannel((await params).channel);
  if (!channel) notFound();

  return (
    <LearningLayout active={channel.id}>
      <main className="learning-width guide-page" id="main-content">
        <nav className="guide-breadcrumb" aria-label="Breadcrumb"><Link href="/#scam-types" className="guide-back"><ArrowLeft size={22} aria-hidden="true" />Back to all guides</Link></nav>
        <GuideSteps key={channel.id} channel={channel} />
        <HelpSection />
      </main>
    </LearningLayout>
  );
}
