import Link from 'next/link';
import EmailCapture from './components/EmailCapture';

export default function Home(){
  return (
    <>
      <header className="nav">
        <div className="brand">LargeKite<span> Capital Intelligence</span></div>
        <nav className="links">
          <a href="#how-it-works">How It Works</a>
          <a href="#tools">Tools</a>
          <Link href="/services">Pricing</Link>
          <Link href="/contact">Login</Link>
          <button className="hamburger" aria-label="Menu">☰</button>
        </nav>
      </header>
      
      <main>
        {/* HERO SECTION */}
        <section className="hero hero-dark">
          <div className="hero-inner">
            <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.8)' }}>Instant Answer:</div>
            <h1>Should I Buy This Property?</h1>
            <p className="hero-subtitle">Get AI-powered analysis of ROI, cashflow, and risk in seconds.</p>
            <div className="hero-ctas">
              <Link className="btn btn-primary btn-lg" href="/tools/investment-property-finder">Analyze a Property Deal (Free)</Link>
              <Link className="btn btn-ghost" href="#example" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>See Example Report →</Link>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="section section-white" id="how-it-works">
          <div className="section-inner">
            <h2>How It Works</h2>
            <div className="journey-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginTop: '40px' }}>
              <div className="step-card">
                <div className="step-number">1.</div>
                <div className="step-icon">🏠</div>
                <h3>Enter Property Link</h3>
                <p>Paste a Zillow or Redfin link.</p>
              </div>
              <div className="step-card">
                <div className="step-number">2.</div>
                <div className="step-icon">🧠</div>
                <h3>AI Runs the Numbers</h3>
                <p>We analyze ROI, cashflow & risk.</p>
              </div>
              <div className="step-card">
                <div className="step-number">3.</div>
                <div className="step-icon">✅</div>
                <h3>Get Your Result</h3>
                <p>See your investment verdict.</p>
              </div>
            </div>
          </div>
        </section>

        {/* INVESTMENT REPORT PREVIEW */}
        <section className="section section-light" id="example">
          <div className="section-inner">
            <h2>Your Investment Report</h2>
            <div className="report-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '32px' }}>
              <div className="metric-card" style={{ background: '#1e3a5f', color: 'white', padding: '24px', borderRadius: '12px' }}>
                <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>Estimated ROI</div>
                <div style={{ fontSize: '42px', fontWeight: '700' }}>8.5%</div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '12px' }}>Paste a Zillow or Redfin link.</div>
              </div>
              <div className="metric-card" style={{ background: '#f5f5f5', padding: '24px', borderRadius: '12px' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Cashflow</div>
                <div style={{ fontSize: '42px', fontWeight: '700', color: '#10b981' }}>+$520<span style={{ fontSize: '20px', fontWeight: '400' }}> /month</span></div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '12px' }}>We analyze ROI, cashflow & risk.</div>
              </div>
              <div className="metric-card" style={{ background: '#dc6b4a', color: 'white', padding: '24px', borderRadius: '12px' }}>
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Risk Level</div>
                <div style={{ fontSize: '32px', fontWeight: '700' }}>Moderate</div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '12px' }}>See your investment verdict.</div>
              </div>
              <div className="metric-card" style={{ background: '#059669', color: 'white', padding: '24px', borderRadius: '12px' }}>
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Recommendation</div>
                <div style={{ fontSize: '32px', fontWeight: '700' }}>Buy & Hold</div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '12px' }}>&nbsp;</div>
              </div>
            </div>
          </div>
        </section>



        {/* CREDIBILITY SECTION */}
        <section className="section section-dark" style={{ background: '#1e3a5f', color: 'white' }}>
          <div className="section-inner">
            <h2 style={{ textAlign: 'center', marginBottom: '40px' }}>Trusted by Serious Investors</h2>
            <div className="trust-points" style={{ display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap' }}>
              <div className="trust-item" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>✅</span>
                <span>CFA-Led Analysis</span>
              </div>
              <div className="trust-item" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>✅</span>
                <span>Transparent Assumptions</span>
              </div>
              <div className="trust-item" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>✅</span>
                <span>Real-World Insights</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="section section-white">
          <div className="section-inner" style={{ textAlign: 'center' }}>
            <h2>Make Better Investment Decisions Today</h2>
            <div className="cta-centered" style={{ marginTop: '32px' }}>
              <Link href="/tools/investment-property-finder" className="btn btn-primary btn-lg">Start Your Free Analysis</Link>
            </div>
          </div>
        </section>

        {/* ADDITIONAL TOOLS */}
        <section className="section section-light" id="tools">
          <div className="section-inner">
            <h2 style={{ textAlign: 'center' }}>More Investment Tools</h2>
            <div className="tools-grid">
              <Link href="/tools/reddit-finance-sentiment" className="tool-card">
                <div className="tool-icon">📊</div>
                <h3>Market Sentiment</h3>
                <p>Track what sophisticated investors are buying and selling in real-time.</p>
                <div className="tool-cta">Explore Tool →</div>
              </Link>
              <Link href="/tools/cfa-summarizer" className="tool-card">
                <div className="tool-icon">📄</div>
                <h3>Research Summarizer</h3>
                <p>Extract key insights from CFA articles and research in seconds.</p>
                <div className="tool-cta">Explore Tool →</div>
              </Link>
            </div>
          </div>
        </section>



        {/* EMAIL CAPTURE */}
        <section className="section section-light email-capture-section">
          <div className="section-inner email-capture-inner">
            <h2>Get Early Access to Advanced Features</h2>
            <p>Join early users testing smarter investment tools.</p>
            <EmailCapture />
          </div>
        </section>
      </main>
      
      <footer className="section" style={{ borderTop: '1px solid var(--line)', marginTop: '40px' }}>
        <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ marginBottom: '20px' }}>
            <Link href="/services" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '14px' }}>Professional Services</Link>
            {' · '}
            <Link href="/tools/reddit-finance-sentiment" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '14px' }}>Market Sentiment</Link>
            {' · '}
            <Link href="/tools/cfa-summarizer" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '14px' }}>Research Tools</Link>
          </div>
          <div className="eyebrow">LargeKite Capital Intelligence LLC</div>
          <p className="tiny" style={{ marginTop: '16px', maxWidth: '800px', margin: '16px auto 0' }}>
            Professional financial consulting and analysis services. CFA Institute does not endorse, promote, or warrant the accuracy or quality of LargeKite Capital Intelligence LLC. 
            CFA® and Chartered Financial Analyst® are registered trademarks owned by CFA Institute.
          </p>
          <p className="tiny" style={{ marginTop: '12px' }}>
            Investment advice and analysis are for informational purposes only and do not constitute a recommendation to buy or sell securities. 
            Past performance does not guarantee future results. Please consult with a qualified financial advisor.
          </p>
          <p className="tiny" style={{ marginTop: '12px' }}>
            © 2024 LargeKite Capital Intelligence LLC. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}