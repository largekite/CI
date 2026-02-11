import Link from 'next/link';

export default function Home(){
  return (
    <>
      <header className="nav">
        <div className="brand">
          <Link href="/">LargeKite<span> Capital Intelligence</span></Link>
        </div>
        <nav className="links">
          <Link href="#how-it-works">How It Works</Link>
          <Link href="#methodology">Methodology</Link>
          <Link href="#faq">FAQ</Link>
          <Link href="/tools/investment-property-finder" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '14px' }}>Start Free Analysis</Link>
          <button className="hamburger" aria-label="Menu">☰</button>
        </nav>
      </header>
      
      <main>
        {/* HERO SECTION */}
        <section className="hero hero-dark">
          <div className="hero-inner">
            <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.8)' }}>Professional-Grade Analysis</div>
            <h1>Analyze Any Property Deal in 30 Seconds</h1>
            <p className="hero-subtitle">CFA-level ROI and cashflow analysis. No spreadsheets. No guesswork.</p>
            <div className="hero-ctas">
              <Link className="btn btn-primary btn-lg" href="/tools/investment-property-finder">Analyze Your First Property Free</Link>
            </div>
            <div style={{ marginTop: '24px', color: 'rgba(255,255,255,0.7)', fontSize: '14px', display: 'flex', gap: '32px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <span>✓ Free forever</span>
              <span>✓ No credit card required</span>
              <span>✓ Instant results</span>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="section section-white" id="how-it-works">
          <div className="section-inner">
            <h2>How It Works</h2>
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: '18px', maxWidth: '700px', margin: '0 auto 48px' }}>
              Get professional-grade property analysis in three simple steps
            </p>
            <div className="journey-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', marginTop: '40px' }}>
              <div className="step-card">
                <div className="step-number">1.</div>
                <h3>Enter Location & Criteria</h3>
                <p>City, ZIP code, or paste a property listing URL. Set your price range and investment strategy.</p>
              </div>
              <div className="step-card">
                <div className="step-number">2.</div>
                <h3>CFA-Level Analysis</h3>
                <p>Our system calculates cap rate, cash-on-cash return, NOI, and 5-year projections using current market data.</p>
              </div>
              <div className="step-card">
                <div className="step-number">3.</div>
                <h3>Investment Decision</h3>
                <p>Get a scored recommendation with transparent calculations you can verify and trust.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SAMPLE REPORT PREVIEW */}
        <section className="section section-light" id="example">
          <div className="section-inner">
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span style={{
                background: '#fef3c7',
                color: '#92400e',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600',
                border: '1px solid #fcd34d'
              }}>
                SAMPLE REPORT
              </span>
            </div>
            <h2>What You'll Get</h2>
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: '16px', maxWidth: '600px', margin: '0 auto 40px' }}>
              Every property analysis includes these key metrics, calculated using current market data
            </p>
            <div className="report-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginTop: '32px' }}>
              <div className="metric-card" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8f 100%)', color: 'white', padding: '28px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cap Rate</div>
                <div style={{ fontSize: '48px', fontWeight: '700' }}>8.5%</div>
                <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '12px' }}>Annual return on property value</div>
              </div>
              <div className="metric-card" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', padding: '28px', borderRadius: '16px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Monthly Cashflow</div>
                <div style={{ fontSize: '48px', fontWeight: '700', color: '#15803d' }}>+$520</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '12px' }}>After mortgage, taxes & expenses</div>
              </div>
              <div className="metric-card" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', padding: '28px', borderRadius: '16px', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Cash-on-Cash</div>
                <div style={{ fontSize: '48px', fontWeight: '700', color: '#1e40af' }}>12.3%</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '12px' }}>Annual return on cash invested</div>
              </div>
              <div className="metric-card" style={{ background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', padding: '28px', borderRadius: '16px', border: '1px solid #86efac' }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Investment Score</div>
                <div style={{ fontSize: '48px', fontWeight: '700', color: '#166534' }}>82<span style={{ fontSize: '28px' }}>/100</span></div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '12px' }}>Strong buy opportunity</div>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <Link href="/tools/investment-property-finder" className="btn btn-primary btn-lg">Analyze Your Property Now</Link>
            </div>
          </div>
        </section>



        {/* METHODOLOGY SECTION */}
        <section className="section section-white" id="methodology">
          <div className="section-inner">
            <h2>Our Methodology</h2>
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: '18px', maxWidth: '700px', margin: '0 auto 48px' }}>
              Built by CFA charterholders using institutional-grade real estate analysis
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
              <div style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ color: '#1e293b', marginBottom: '16px', fontSize: '20px' }}>Cap Rate Calculation</h3>
                <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6' }}>
                  Net Operating Income ÷ Property Value. We factor in property taxes, insurance, maintenance (1% annually), and vacancy rates (5%) using local market data.
                </p>
              </div>
              <div style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ color: '#1e293b', marginBottom: '16px', fontSize: '20px' }}>Cash-on-Cash Return</h3>
                <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6' }}>
                  Annual cashflow ÷ Total cash invested. Assumes 20% down payment, 6.5% mortgage rate, and calculates true monthly profit after all expenses.
                </p>
              </div>
              <div style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ color: '#1e293b', marginBottom: '16px', fontSize: '20px' }}>5-Year Projections</h3>
                <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6' }}>
                  Historical appreciation rates for the specific ZIP code, combined with rent growth projections and principal paydown over your holding period.
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '48px', padding: '32px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                <strong style={{ color: '#1e293b' }}>Full Transparency:</strong> All calculations are shown in your report so you can verify our assumptions and adjust them to match your specific situation.
              </p>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="section section-dark" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8f 100%)', color: 'white' }}>
          <div className="section-inner" style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '36px', marginBottom: '16px' }}>Ready to Make Smarter Investment Decisions?</h2>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)', maxWidth: '600px', margin: '0 auto 32px' }}>
              Join investors using professional-grade analysis to evaluate properties in seconds, not hours.
            </p>
            <div className="cta-centered" style={{ marginTop: '32px' }}>
              <Link href="/tools/investment-property-finder" className="btn btn-primary btn-lg" style={{ background: 'white', color: '#1e3a5f', fontSize: '18px', padding: '16px 40px' }}>
                Start Your Free Analysis Now
              </Link>
            </div>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginTop: '20px' }}>
              No credit card required • Results in 30 seconds • Always free
            </p>
          </div>
        </section>



        {/* FAQ SECTION */}
        <section className="section section-light" id="faq">
          <div className="section-inner">
            <h2>Frequently Asked Questions</h2>
            <div style={{ maxWidth: '800px', margin: '48px auto 0' }}>
              <div style={{ marginBottom: '32px', padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ color: '#1e293b', marginBottom: '12px', fontSize: '18px' }}>How accurate is this analysis?</h3>
                <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.7', margin: 0 }}>
                  We use current market data, historical appreciation rates, and standard real estate metrics used by professional investors. Our calculations are transparent - you can see every assumption and adjust them to match your specific scenario. Think of it as a comprehensive starting point built by CFAs.
                </p>
              </div>
              <div style={{ marginBottom: '32px', padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ color: '#1e293b', marginBottom: '12px', fontSize: '18px' }}>What data sources do you use?</h3>
                <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.7', margin: 0 }}>
                  We pull property data from public MLS listings, combine it with local market rental rates, property tax records, and historical appreciation data for the specific ZIP code. Mortgage rates are updated regularly to reflect current market conditions.
                </p>
              </div>
              <div style={{ marginBottom: '32px', padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ color: '#1e293b', marginBottom: '12px', fontSize: '18px' }}>Is this really free?</h3>
                <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.7', margin: 0 }}>
                  Yes, completely free with no credit card required. Our property analyzer will always be free because we believe every investor deserves professional-grade analysis tools.
                </p>
              </div>
              <div style={{ marginBottom: '32px', padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ color: '#1e293b', marginBottom: '12px', fontSize: '18px' }}>Can I trust AI for six-figure decisions?</h3>
                <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.7', margin: 0 }}>
                  We're not asking you to trust AI blindly. Every calculation is shown step-by-step so you can verify the math yourself. We're automating the spreadsheet work that investors do manually - the same formulas, just faster. Always do your own due diligence and consult with professionals for final decisions.
                </p>
              </div>
              <div style={{ padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ color: '#1e293b', marginBottom: '12px', fontSize: '18px' }}>What makes this better than my spreadsheet?</h3>
                <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.7', margin: 0 }}>
                  Speed and accuracy. No more hunting for comparable rents, calculating mortgage payments, or looking up property tax rates. We pull all that data automatically and run CFA-level calculations in seconds. Plus, you can compare multiple properties side-by-side instantly.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="section" style={{ borderTop: '1px solid var(--line)', marginTop: '0', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '48px 20px' }}>
          <div style={{ marginBottom: '32px' }}>
            <Link href="/tools/investment-property-finder" style={{ color: '#1e293b', textDecoration: 'none', fontSize: '15px', fontWeight: '600' }}>Property Analyzer</Link>
            {' · '}
            <Link href="#methodology" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '14px' }}>Methodology</Link>
            {' · '}
            <Link href="#faq" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '14px' }}>FAQ</Link>
            {' · '}
            <Link href="/contact" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '14px' }}>Contact</Link>
          </div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
            LargeKite Capital Intelligence
          </div>
          <p className="tiny" style={{ marginTop: '16px', maxWidth: '800px', margin: '16px auto 0', fontSize: '13px', lineHeight: '1.6' }}>
            Professional real estate analysis tools built by CFA charterholders. CFA Institute does not endorse, promote, or warrant the accuracy or quality of LargeKite Capital Intelligence LLC.
            CFA® and Chartered Financial Analyst® are registered trademarks owned by CFA Institute.
          </p>
          <p className="tiny" style={{ marginTop: '16px', fontSize: '13px', lineHeight: '1.6', maxWidth: '800px', margin: '16px auto 0' }}>
            <strong>Disclaimer:</strong> Analysis and projections are for informational purposes only and do not constitute investment advice or a recommendation to buy or sell real estate.
            Always conduct your own due diligence and consult with qualified professionals before making investment decisions.
          </p>
          <p className="tiny" style={{ marginTop: '20px', fontSize: '12px' }}>
            © 2024 LargeKite Capital Intelligence LLC. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}