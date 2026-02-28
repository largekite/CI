import Link from 'next/link';
import Image from 'next/image';

export default function Home(){
  return (
    <>
      <header className="nav">
        <div className="brand">
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <Image src="/logo.png" alt="Capital Intelligence" width={36} height={36} style={{ objectFit: 'contain' }} />
            LargeKite<span> Capital Intelligence</span>
          </Link>
        </div>
        <nav className="links">
          <Link href="#how-it-works">How It Works</Link>
          <Link href="#methodology">Methodology</Link>
          <Link href="#faq">FAQ</Link>
          <Link href="/tools/investment-property-finder" className="btn btn-primary btn-sm">Start Free Analysis</Link>
          <button className="hamburger" aria-label="Menu">☰</button>
        </nav>
      </header>

      <main>
        {/* HERO */}
        <section className="hero">
          <div className="hero-inner">
            <p className="eyebrow" style={{ marginBottom: '24px' }}>Real Estate Investment Analysis</p>
            <h1>Analyze any property deal<br/>in under a minute.</h1>
            <p className="hero-subtitle">
              Cap rate, cash-on-cash return, and 5-year projections — calculated with the same methodology used by institutional investors. No spreadsheets.
            </p>
            <div className="hero-ctas">
              <Link className="btn btn-primary btn-lg" href="/tools/investment-property-finder">Analyze a Property Free</Link>
            </div>
            <p style={{ marginTop: '20px', color: '#9ca3af', fontSize: '13px' }}>No credit card required · Instant results · Always free</p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="section" id="how-it-works">
          <div className="section-inner">
            <h2>How It Works</h2>
            <p className="section-description">Three steps from property address to investment decision.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', marginTop: '32px' }}>
              <div style={{ padding: '32px', background: 'white' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', letterSpacing: '0.1em', marginBottom: '16px' }}>01</div>
                <h3 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: '600', color: '#111827' }}>Enter Location & Criteria</h3>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', lineHeight: '1.65' }}>City, ZIP code, or paste a property listing URL. Set your price range and investment strategy.</p>
              </div>
              <div style={{ padding: '32px', background: 'white', borderLeft: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', letterSpacing: '0.1em', marginBottom: '16px' }}>02</div>
                <h3 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: '600', color: '#111827' }}>CFA-Level Analysis</h3>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', lineHeight: '1.65' }}>Cap rate, cash-on-cash return, NOI, and 5-year projections calculated using current market data.</p>
              </div>
              <div style={{ padding: '32px', background: 'white', borderLeft: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', letterSpacing: '0.1em', marginBottom: '16px' }}>03</div>
                <h3 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: '600', color: '#111827' }}>Investment Decision</h3>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', lineHeight: '1.65' }}>A scored recommendation with transparent calculations you can verify and adjust.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SAMPLE METRICS */}
        <div style={{ background: '#f9fafb', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
          <section className="section" id="example" style={{ borderBottom: 'none' }}>
            <div className="section-inner">
              <h2>What You'll Get</h2>
              <p className="section-description">Every analysis includes these metrics, calculated with current market data.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1px', background: '#e5e7eb', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', marginTop: '32px' }}>
                <div style={{ background: 'white', padding: '24px' }}>
                  <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: '500' }}>Cap Rate</div>
                  <div style={{ fontSize: '38px', fontWeight: '700', color: '#111827', lineHeight: 1, letterSpacing: '-0.02em' }}>8.5%</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>Annual yield on property value</div>
                </div>
                <div style={{ background: 'white', padding: '24px' }}>
                  <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: '500' }}>Monthly Cashflow</div>
                  <div style={{ fontSize: '38px', fontWeight: '700', color: '#16a34a', lineHeight: 1, letterSpacing: '-0.02em' }}>+$520</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>After all expenses</div>
                </div>
                <div style={{ background: 'white', padding: '24px' }}>
                  <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: '500' }}>Cash-on-Cash</div>
                  <div style={{ fontSize: '38px', fontWeight: '700', color: '#111827', lineHeight: 1, letterSpacing: '-0.02em' }}>12.3%</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>Annual return on cash invested</div>
                </div>
                <div style={{ background: 'white', padding: '24px' }}>
                  <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: '500' }}>Investment Score</div>
                  <div style={{ fontSize: '38px', fontWeight: '700', color: '#111827', lineHeight: 1, letterSpacing: '-0.02em' }}>82<span style={{ fontSize: '20px', color: '#9ca3af', fontWeight: '400' }}>/100</span></div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>Strong buy opportunity</div>
                </div>
              </div>
              <div style={{ textAlign: 'center', marginTop: '28px' }}>
                <Link href="/tools/investment-property-finder" className="btn btn-primary">Analyze Your Property</Link>
              </div>
            </div>
          </section>
        </div>

        {/* METHODOLOGY */}
        <section className="section" id="methodology">
          <div className="section-inner">
            <h2>Our Methodology</h2>
            <p className="section-description">Built by CFA charterholders using institutional-grade real estate analysis frameworks.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginTop: '32px' }}>
              <div style={{ padding: '24px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: '600', color: '#111827' }}>Cap Rate</h3>
                <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.65', margin: 0 }}>
                  Net Operating Income ÷ Property Value. We factor in taxes, insurance, maintenance (1% annually), and vacancy (5%) using local market data.
                </p>
              </div>
              <div style={{ padding: '24px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: '600', color: '#111827' }}>Cash-on-Cash Return</h3>
                <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.65', margin: 0 }}>
                  Annual cashflow ÷ Total cash invested. Assumes 20% down payment and current mortgage rates, calculating true monthly profit after all expenses.
                </p>
              </div>
              <div style={{ padding: '24px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: '600', color: '#111827' }}>5-Year Projections</h3>
                <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.65', margin: 0 }}>
                  ZIP-specific appreciation rates combined with rent growth projections and principal paydown over your holding period.
                </p>
              </div>
            </div>
            <div style={{ marginTop: '16px', padding: '18px 20px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: '1.6' }}>
                <strong style={{ color: '#374151', fontWeight: '600' }}>Full transparency:</strong> All calculations are shown in your report so you can verify assumptions and adjust them to your situation.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div style={{ background: '#111827' }}>
          <div style={{ maxWidth: '980px', margin: '0 auto', padding: '72px 24px', textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: '700', color: 'white', margin: '0 0 14px', letterSpacing: '-0.02em' }}>
              Ready to analyze your first property?
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '16px', margin: '14px auto 32px', lineHeight: '1.65', maxWidth: '480px' }}>
              Join investors using professional-grade analysis to evaluate properties in seconds.
            </p>
            <Link href="/tools/investment-property-finder" className="btn" style={{ background: 'white', color: '#111827', fontWeight: '600', fontSize: '15px', padding: '13px 28px', border: 'none' }}>
              Start Free Analysis
            </Link>
            <p style={{ fontSize: '13px', color: '#4b5563', marginTop: '20px' }}>
              No credit card required · Always free
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
          <section className="section" id="faq" style={{ borderBottom: 'none' }}>
            <div className="section-inner">
              <h2>Frequently Asked Questions</h2>
              <div style={{ maxWidth: '680px', margin: '40px auto 0' }}>
                <div style={{ paddingBottom: '24px', marginBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
                  <h3 style={{ color: '#111827', margin: '0 0 10px', fontSize: '15px', fontWeight: '600' }}>How accurate is this analysis?</h3>
                  <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.7', margin: 0 }}>
                    We use current market data, historical appreciation rates, and standard metrics used by professional investors. All calculations are transparent — you can see every assumption and adjust them to your specific scenario.
                  </p>
                </div>
                <div style={{ paddingBottom: '24px', marginBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
                  <h3 style={{ color: '#111827', margin: '0 0 10px', fontSize: '15px', fontWeight: '600' }}>What data sources do you use?</h3>
                  <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.7', margin: 0 }}>
                    Public MLS listings, local rental rates, property tax records, and historical appreciation data for the specific ZIP code. Mortgage rates are updated regularly to reflect current market conditions.
                  </p>
                </div>
                <div style={{ paddingBottom: '24px', marginBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
                  <h3 style={{ color: '#111827', margin: '0 0 10px', fontSize: '15px', fontWeight: '600' }}>Is this really free?</h3>
                  <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.7', margin: 0 }}>
                    Yes, completely free with no credit card required. Our property analyzer will always be free because we believe every investor deserves professional-grade analysis tools.
                  </p>
                </div>
                <div style={{ paddingBottom: '24px', marginBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
                  <h3 style={{ color: '#111827', margin: '0 0 10px', fontSize: '15px', fontWeight: '600' }}>Can I trust AI for six-figure decisions?</h3>
                  <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.7', margin: 0 }}>
                    Every calculation is shown step-by-step so you can verify the math yourself. We automate the spreadsheet work investors do manually — the same formulas, just faster. Always consult with professionals for final decisions.
                  </p>
                </div>
                <div>
                  <h3 style={{ color: '#111827', margin: '0 0 10px', fontSize: '15px', fontWeight: '600' }}>What makes this better than a spreadsheet?</h3>
                  <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.7', margin: 0 }}>
                    Speed and completeness. No more hunting for comparable rents or looking up tax rates — we pull all data automatically and run the analysis in seconds. You can also compare multiple properties side-by-side instantly.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer style={{ borderTop: '1px solid #e5e7eb', background: 'white', padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div style={{ marginBottom: '24px', display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/tools/investment-property-finder" style={{ color: '#374151', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Property Analyzer</Link>
            <Link href="#methodology" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '14px' }}>Methodology</Link>
            <Link href="#faq" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '14px' }}>FAQ</Link>
            <Link href="/contact" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '14px' }}>Contact</Link>
          </div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
            LargeKite Capital Intelligence
          </div>
          <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: '1.65', maxWidth: '600px', margin: '0 auto 10px' }}>
            Professional real estate analysis tools built by CFA charterholders. CFA Institute does not endorse, promote, or warrant the accuracy or quality of LargeKite Capital Intelligence LLC.
            CFA® and Chartered Financial Analyst® are registered trademarks owned by CFA Institute.
          </p>
          <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: '1.65', maxWidth: '600px', margin: '0 auto' }}>
            Analysis and projections are for informational purposes only and do not constitute investment advice.
            Always conduct due diligence and consult qualified professionals before making investment decisions.
          </p>
          <p style={{ fontSize: '12px', color: '#d1d5db', marginTop: '20px' }}>
            © 2025 LargeKite Capital Intelligence LLC. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}
