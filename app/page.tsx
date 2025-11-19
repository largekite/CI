import Link from 'next/link';

export default function Home(){
  return (
    <>
      <header className="nav">
        <div className="brand">LargeKite<span>Capital Intelligence</span></div>
        <nav className="links">
          <Link href="/tools/cfa-summarizer">Summarizer</Link>
          <Link href="/tools/investment-property-finder">Property Finder</Link>
          <Link href="/tools/reddit-finance-sentiment">Sentiment</Link>
          <Link href="/market-sentiment">Market Dashboard</Link>
          <Link href="/contact" className="cta">Book a call</Link>
        </nav>
      </header>
      
      <main>
        <section className="hero">
          <div className="hero-inner">
            <h1>CFA-Led Financial Intelligence.<br/>AI is just our wrench.</h1>
            <p>Professional-grade tools for investment research, property analysis, and market sentiment tracking. Built by CFA charterholders for investors, analysts, and financial professionals.</p>
            <div className="hero-ctas">
              <Link className="btn primary" href="#tools">Explore Tools</Link>
              <Link className="btn ghost" href="/contact">Book a consultation</Link>
            </div>
            <ul className="trust">
              <li>CFA-Led</li>
              <li>Human-Reviewed</li>
              <li>Transparent Methods</li>
            </ul>
          </div>
        </section>

        <section id="tools" className="section">
          <div className="eyebrow">CFA-Built Tools</div>
          <h2 className="h2">Professional Financial Intelligence Suite</h2>
          <div className="cards">
            <Link href="/tools/cfa-summarizer" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📄</div>
              <h3>CFA Summarizer</h3>
              <p>Instantly summarize financial articles and research papers with AI-powered analysis. Extract key insights and takeaways from complex documents.</p>
              <div className="badges">
                <span>Article Analysis</span>
                <span>Key Insights</span>
                <span>PDF Export</span>
              </div>
            </Link>

            <Link href="/tools/investment-property-finder" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏠</div>
              <h3>Property Finder</h3>
              <p>Discover investment properties with detailed financial analysis, cap rates, and ROI projections. Compare properties and make informed decisions.</p>
              <div className="badges">
                <span>Cap Rate Analysis</span>
                <span>ROI Projections</span>
                <span>Property Comparison</span>
              </div>
            </Link>

            <Link href="/tools/reddit-finance-sentiment" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
              <h3>Sentiment Analysis</h3>
              <p>Track real-time market sentiment from Reddit finance communities. Analyze bullish/bearish trends and discover trending topics.</p>
              <div className="badges">
                <span>Real-time Data</span>
                <span>Sentiment Tracking</span>
                <span>Trend Analysis</span>
              </div>
            </Link>

            <Link href="/market-sentiment" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📈</div>
              <h3>Market Dashboard</h3>
              <p>Comprehensive market overview with S&P 500, NASDAQ, Dow Jones, VIX, and Gold charts. Interactive technical analysis with moving averages.</p>
              <div className="badges">
                <span>Live Charts</span>
                <span>Technical Analysis</span>
                <span>Multiple Timeframes</span>
              </div>
            </Link>
          </div>
        </section>

        <section className="section">
          <div className="eyebrow">What we do</div>
          <h2 className="h2">Finance services with measurable outcomes</h2>
          <div className="cards">
            <div className="card">
              <h3>Portfolio Strategy</h3>
              <p>Asset allocation, risk budgeting, tax-aware rebalancing, IPS drafting.</p>
            </div>
            <div className="card">
              <h3>Research & Due Diligence</h3>
              <p>Screening and memo prep on funds, managers, or direct deals.</p>
            </div>
            <div className="card">
              <h3>Cash-Flow & Real Estate</h3>
              <p>Scenario planning for mortgages, second properties, and cap-rate sensitivity.</p>
            </div>
          </div>
          <p className="note">We deliver formal memos, spreadsheets, and a live review—not just dashboards.</p>
        </section>

        <section className="section">
          <div className="eyebrow">Why choose us</div>
          <h2 className="h2">CFA-Led Advantage</h2>
          <div className="cases">
            <div className="case">
              <h3>🎓 CFA Charterholder Led</h3>
              <p>All analysis supervised by CFA charterholders following Institute standards for ethics and professional conduct.</p>
            </div>
            <div className="case">
              <h3>🤖 AI as Tool, Not Replacement</h3>
              <p>We use AI to accelerate research and data processing—never to replace human judgment or professional analysis.</p>
            </div>
            <div className="case">
              <h3>📈 Transparent Methodology</h3>
              <p>Full disclosure of assumptions, models, and limitations. No black-box recommendations or hidden algorithms.</p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="eyebrow">CFA Methodology</div>
          <h2 className="h2">Chartered Financial Analyst Approach</h2>
          <div className="content">
            <ol className="steps">
              <li><strong>Discovery:</strong> CFA-led objective setting, constraint analysis, and risk budgeting.</li>
              <li><strong>Research:</strong> Human-led due diligence following CFA Institute standards; AI accelerates data collection only.</li>
              <li><strong>Modeling:</strong> Professional scenario analysis, tax optimization, and drawdown modeling with transparent assumptions.</li>
              <li><strong>Decision:</strong> Formal CFA-quality memo, detailed spreadsheets, and live review session.</li>
            </ol>
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