import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ChatCircleText, EnvelopeSimple, GlobeHemisphereWest, Phone, ShieldCheck, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { scamChannels, type ScamChannelId } from "@/lib/scam-channels";

export function ChannelIcon({ id, size = 26 }: { id: ScamChannelId; size?: number }) {
  const Icon = { "text-sms": ChatCircleText, phone: Phone, email: EnvelopeSimple, "social-media": UsersThree, websites: GlobeHemisphereWest }[id];
  return <Icon size={size} weight="duotone" aria-hidden="true" />;
}

export default function LearningLayout({ children, active }: { children: React.ReactNode; active?: ScamChannelId }) {
  return (
    <div className="learning-shell" lang="en">
      <header className="learning-topbar learning-width">
        <Link className="brand" href="/" aria-label="ScamGym home"><span className="brand-mark"><ShieldCheck size={25} weight="fill" aria-hidden="true" /></span>ScamGym</Link>
        <nav className="learning-nav" aria-label="Main navigation">
          <Link href="#get-help" className="nav-help">Get help</Link>
        </nav>
      </header>
      {children}
      <footer className="learning-footer learning-width">
        <Link href="/#scam-types" className="guide-back"><ArrowLeft size={22} aria-hidden="true" />Back to all guides</Link>
        <details className="guide-more">
          <summary>See other scam guides</summary>
          <nav className="footer-channels" aria-label="Scam guides">{scamChannels.map((channel) => <Link href={`/scams/${channel.id}`} key={channel.id} aria-current={active === channel.id ? "page" : undefined}><ChannelIcon id={channel.id} size={23} />{channel.title}</Link>)}</nav>
        </details>
        <p className="footer-note">These guides are in English. They help you practise, but cannot check a real message or caller for you.</p>
      </footer>
    </div>
  );
}

export function HelpSection() {
  return (
    <section className="help-section" id="get-help" aria-labelledby="help-title">
      <h2 id="help-title">Need help with a real scam?</h2>
      <p>If you paid or shared banking details, <strong>contact your bank now.</strong> Use the number on your bank card. Stop contact with the suspected scammer and do not send more money.</p>
      <p>You can ask someone you trust to help. Scams can happen to anyone.</p>
      <details className="guide-more help-resources">
        <summary>Support and reporting in Australia</summary>
        <div className="help-links">
          <a href="https://www.scamwatch.gov.au/report-a-scam" className="help-link">Report to Scamwatch <ArrowUpRight size={22} aria-hidden="true" /></a>
          <a href="https://www.idcare.org/" className="help-link">Get identity support from IDCARE <ArrowUpRight size={22} aria-hidden="true" /></a>
        </div>
        <p className="help-note">These links open the support organisations' websites. Reporting does not replace calling your bank or guarantee a refund.</p>
      </details>
    </section>
  );
}
