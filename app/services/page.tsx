import Link from 'next/link';
import SentimentPill from '../components/SentimentPill';

export const metadata = {
  title: 'Professional Services — LargeKite Capital Intelligence',
  description: 'Get hands-on guidance from CFA charterholders for complex portfolios and major investment decisions.',
};

export default function Services() {
  return (
    <>
      <header className="nav">
        <div className="brand">LargeKite<span>Capital Intelligence</span></div>
        <nav className="links">
          <Link href="/">Home</Link>
          <Link href="/tools/investment-property-finder" className="cta">Start Analysis</Link>
        </nav>
      </header>

      <main>
        <section className="section section-white">
          <div className="section-inner" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="eyebrow">Professional Services</div>
            <h1 className="h2">Need Hands-On Guidance?</h1>
            <p className="content">
              For complex portfolios or major decisions, get direct advice from CFA charterholders. 
              We prioritize fundamentals—cash flow, risk, taxes—and use AI only to accelerate research and modeling.
            </p>

            <div className="card" style={{ marginTop: 32 }}>
              <div className="eyebrow">Market temperature</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <SentimentPill />
                <Link className="tiny" href="/market-sentiment">View methodology →</Link>
              </div>
              <p className="tiny" style={{ marginTop: 8 }}>
                We use this simple, finance-first signal in discovery to frame risk and pacing. 
                AI only automates data pulls; human judgment drives recommendations.
              </p>
            </div>

            <div className="cards" style={{ marginTop: 32 }}>
              <div className="card">
                <div className="service-icon" style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
                <h3>Portfolio Strategy</h3>
                <p>Asset allocation, risk budgeting, tax-aware rebalancing, and Investment Policy Statement drafting.</p>
              </div>
              <div className="card">
                <div className="service-icon" style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
                <h3>Research & Due Diligence</h3>
                <p>Screening and professional memo preparation on funds, managers, or direct investment deals.</p>
              </div>
              <div className="card">
                <div className="service-icon" style={{ fontSize: '32px', marginBottom: '12px' }}>💰</div>
                <h3>Cash-Flow & Real Estate Planning</h3>
                <p>Scenario planning for mortgages, second properties, and cap-rate sensitivity analysis.</p>
              </div>
            </div>

            <div className="cta-centered" style={{ marginTop: 40 }}>
              <Link className="btn btn-primary" href="/contact">Schedule a Consultation</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="section" style={{ borderTop: '1px solid var(--line)', marginTop: '40px' }}>
        <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ marginBottom: '20px' }}>
            <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '14px' }}>Home</Link>
            {' · '}
            <Link href="/tools/investment-property-finder" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '14px' }}>Property Analyzer</Link>
            {' · '}
            <Link href="/contact" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '14px' }}>Contact</Link>
          </div>
          <div className="eyebrow">LargeKite Capital Intelligence LLC</div>
          <p className="tiny" style={{ marginTop: '16px', maxWidth: '800px', margin: '16px auto 0' }}>
            Professional financial consulting and analysis services. CFA Institute does not endorse, promote, or warrant the accuracy or quality of LargeKite Capital Intelligence LLC. 
            CFA® and Chartered Financial Analyst® are registered trademarks owned by CFA Institute.
          </p>
          <p className="tiny" style={{ marginTop: '12px' }}>
            © 2025 LargeKite Capital Intelligence LLC. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}