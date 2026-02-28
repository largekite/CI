import Link from 'next/link';
import ContactFormClient from './ContactFormClient';

export const metadata = {
  title: 'Contact — LargeKiteCapitalIntelligence'
};

export default function ContactPage() {
  return (
    <>
      <header className="nav">
        <div className="brand">
          <Link href="/">LargeKite<span> Capital Intelligence</span></Link>
        </div>
        <nav className="links">
          <Link href="/#how-it-works">How It Works</Link>
          <Link href="/#methodology">Methodology</Link>
          <Link href="/#faq">FAQ</Link>
          <Link href="/tools/investment-property-finder" className="btn btn-primary btn-sm">Start Free Analysis</Link>
          <button className="hamburger" aria-label="Menu">☰</button>
        </nav>
      </header>
      
      <main className="section">
        <div className="eyebrow">Get in touch</div>
        <h1 className="h2">Book a consultation</h1>
        <p className="content">
          Tell us a bit about you and what you'd like help with. We'll reply by email to schedule a call.
        </p>
        <ContactFormClient />
      </main>
    </>
  );
}