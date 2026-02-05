import Link from 'next/link';
import EmailCapture from './components/EmailCapture';

export default function Home(){
  return (
    <>
      <header className="nav">
        <div className="brand">LargeKite<span>Capital Intelligence</span></div>
        <nav className="links">
          <Link href="/tools/investment-property-finder" className="cta">Start Analysis</Link>
        </nav>
      </header>
      
      <main>
        {/* HERO SECTION */}
        <section className="hero hero-dark">
          <div className="hero-inner">
            <h1>Should I Buy This?</h1>
            <p className="hero-subtitle">Get a clear yes or no on investment decisions in seconds. Analyze real estate deals, evaluate market timing with sentiment data, and validate your thesis with CFA-backed research.</p>
            <div className="hero-ctas">
              <Link className="btn btn-primary btn-lg" href="/tools/investment-property-finder">Analyze a Property Deal</Link>
            </div>
          </div>
        </section>

        {/* DECISION JOURNEY SECTION */}
        <section className="section section-white">
          <div className="section-inner">
            <h2>How to Make Better Investment Decisions</h2>
            <p className="section-description">Three tools. One clear answer. Follow your decision-making process.</p>
            
            <div className="decision-journey">
              {/* Step 1 */}
              <div className="journey-step">
                <div className="journey-number">1</div>
                <div className="journey-content">
                  <h3>Found a Deal? Analyze the Numbers.</h3>
                  <p className="journey-desc">Get ROI, cashflow, and risk scoring for any property. Know exactly what you're buying before committing.</p>
                  <div className="journey-example">
                    <strong>Example:</strong> "Is this $500K property a good long-term hold?"
                  </div>
                  <Link href="/tools/investment-property-finder" className="journey-link">
                    Property Deal Analyzer →
                  </Link>
                </div>
                <div className="journey-icon">🏠</div>
              </div>

              {/* Step 2 */}
              <div className="journey-step">
                <div className="journey-number">2</div>
                <div className="journey-content">
                  <h3>Timing Matters. Check Market Sentiment.</h3>
                  <p className="journey-desc">See what sophisticated investors are buying/selling. Track real estate, market, and stock sentiment in real-time.</p>
                  <div className="journey-example">
                    <strong>Example:</strong> "Are investors bullish on real estate right now?" or "Should I buy stocks in this sector?"
                  </div>
                  <Link href="/tools/reddit-finance-sentiment" className="journey-link">
                    Market Sentiment Tracker →
                  </Link>
                </div>
                <div className="journey-icon">📊</div>
              </div>

              {/* Step 3 */}
              <div className="journey-step">
                <div className="journey-number">3</div>
                <div className="journey-content">
                  <h3>Validate Your Thesis. Research Deep.</h3>
                  <p className="journey-desc">Read the articles and research supporting your decision. Extract key insights in seconds instead of hours.</p>
                  <div className="journey-example">
                    <strong>Example:</strong> "What do CFA analysts say about the current market? Are interest rates coming down?"
                  </div>
                  <Link href="/tools/cfa-summarizer" className="journey-link">
                    CFA Research Summarizer →
                  </Link>
                </div>
                <div className="journey-icon">📄</div>
              </div>
            </div>
          </div>
        </section>

        {/* MARKET OVERVIEW SECTION */}
        <section className="section section-light">
          <div className="section-inner">
            <h2>Live Market Overview</h2>
            <p className="section-description">Real-time market data to inform your investment timing decisions.</p>
            <div className="market-cards">
              <div className="market-card">
                <div className="market-label">S&P 500</div>
                <div className="market-ticker">SPX</div>
                <div className="market-cta">
                  <Link href="/market-sentiment" className="btn btn-ghost btn-sm">View Live Charts →</Link>
                </div>
              </div>
              <div className="market-card">
                <div className="market-label">NASDAQ</div>
                <div className="market-ticker">NDX</div>
                <div className="market-cta">
                  <Link href="/market-sentiment" className="btn btn-ghost btn-sm">View Live Charts →</Link>
                </div>
              </div>
              <div className="market-card">
                <div className="market-label">Dow Jones</div>
                <div className="market-ticker">DJI</div>
                <div className="market-cta">
                  <Link href="/market-sentiment" className="btn btn-ghost btn-sm">View Live Charts →</Link>
                </div>
              </div>
              <div className="market-card">
                <div className="market-label">VIX (Volatility)</div>
                <div className="market-ticker">VIX</div>
                <div className="market-cta">
                  <Link href="/market-sentiment" className="btn btn-ghost btn-sm">View Live Charts →</Link>
                </div>
              </div>
            </div>
            <div className="market-banner">
              <p>Access interactive charts with technical analysis, moving averages, and multiple timeframes</p>
              <Link href="/market-sentiment" className="btn btn-primary">Open Live Dashboard</Link>
            </div>
          </div>
        </section>

        {/* CREDIBILITY SECTION */}
        <section className="section section-white">
          <div className="section-inner">
            <h2>Built for Serious Investors</h2>
            <p className="section-description">
              LargeKite Capital Intelligence combines CFA-led financial methodologies with AI automation to deliver fast, transparent, and practical investment insights. We focus on real decisions — not black-box predictions.
            </p>
            <div className="trust-points">
              <div className="trust-item">✔ Finance-sound assumptions</div>
              <div className="trust-item">✔ Transparent calculations</div>
              <div className="trust-item">✔ Designed for real-world investing</div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="section section-light">
          <div className="section-inner">
            <h2>Ready to Make Your First Decision?</h2>
            <p className="section-description">Start with the tool that matches your current question.</p>
            <div className="cta-options">
              <div className="cta-option">
                <div className="option-icon">🏠</div>
                <h3>Have a Property Deal?</h3>
                <p>Analyze the numbers first</p>
                <Link href="/tools/investment-property-finder" className="btn btn-primary">Start Property Analysis</Link>
              </div>
              <div className="cta-option">
                <div className="option-icon">📊</div>
                <h3>Wondering About Timing?</h3>
                <p>Check market sentiment</p>
                <Link href="/tools/reddit-finance-sentiment" className="btn btn-primary">Check Market Sentiment</Link>
              </div>
              <div className="cta-option">
                <div className="option-icon">📄</div>
                <h3>Need Research Insights?</h3>
                <p>Summarize key articles</p>
                <Link href="/tools/cfa-summarizer" className="btn btn-primary">Summarize Articles</Link>
              </div>
            </div>
          </div>
        </section>

        {/* PROFESSIONAL SERVICES */}
        <section className="section section-white">
          <div className="section-inner">
            <h2>Need Hands-On Guidance?</h2>
            <p className="section-description">For complex portfolios or major decisions, get direct advice from CFA charterholders.</p>
            <div className="services-grid">
              <div className="service-card">
                <div className="service-icon">📋</div>
                <h3>Portfolio Strategy</h3>
                <p>Asset allocation, risk budgeting, tax-aware rebalancing, and Investment Policy Statement drafting.</p>
              </div>
              <div className="service-card">
                <div className="service-icon">🔍</div>
                <h3>Research & Due Diligence</h3>
                <p>Screening and professional memo preparation on funds, managers, or direct investment deals.</p>
              </div>
              <div className="service-card">
                <div className="service-icon">💰</div>
                <h3>Cash-Flow & Real Estate Planning</h3>
                <p>Scenario planning for mortgages, second properties, and cap-rate sensitivity analysis.</p>
              </div>
            </div>
            <div className="cta-centered">
              <Link className="btn btn-ghost" href="/contact">Schedule a Consultation →</Link>
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