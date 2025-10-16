import Link from 'next/link';
import MarketStatsRow from './components/MarketStatsRow';

function Section({ id, title, eyebrow, children }:{
  id?: string; title:string; eyebrow?:string; children:React.ReactNode
}) {
  return (
    <section id={id} className="section">
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h2 className="h2">{title}</h2>
      <div className="content">{children}</div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <header className="nav">
        <div className="brand">LargeKite<span>Capital</span></div>
        <nav className="links">
          <a href="/services">Services</a>
          <a href="#method">Method</a>
          <a href="#cases">Case Snapshots</a>
          <a href="/insights">Insights</a>
          <a href="/market-sentiment">Market Sentiment</a>
          <a className="cta" href="/contact">Book a call</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-inner">
            <h1>Independent Finance Consulting.<br/>AI is just our wrench.</h1>
            <p>
              We’re a finance-first partner for individuals, founders, and advisors.
              We use AI to accelerate research and modeling—<strong>never</strong>
              to replace professional judgment.
            </p>
            import SentimentPill from './components/SentimentPill';

            <div className="hero-ctas">
              <a className="btn primary" href="/contact">Book a consultation</a>
              <a className="btn ghost" href="#method">See our methodology</a>
                          <SentimentPill />
            </div>
            <ul className="trust">
              <li>CFA-led</li>
              <li>Human-reviewed</li>
              <li>Transparent fees</li>
            </ul>
          </div>
        </section>

        <MarketStatsRow />

        <Section id="services" eyebrow="What we do" title="Finance services with measurable outcomes">
          <div className="cards">
            <div className="card"><h3>Portfolio Strategy</h3><p>Asset allocation, risk budgeting, tax-aware rebalancing, IPS drafting.</p></div>
            <div className="card"><h3>Research & Due Diligence</h3><p>Screening and memo prep on funds, managers, or direct deals.</p></div>
            <div className="card"><h3>Cash-Flow & Real Estate</h3><p>Scenario planning for mortgages, second properties, and cap-rate sensitivity.</p></div>
          </div>
          <p className="note">We deliver formal memos, spreadsheets, and a live review—not just dashboards.</p>
        </Section>

        <Section id="method" eyebrow="How we work" title="Human-led process. AI assists under the hood.">
          <ol className="steps">
            <li><strong>Discovery:</strong> goals, constraints, timeline, risk profile.</li>
            <li><strong>Human analysis:</strong> frameworks, sanity checks, peer review.</li>
            <li><strong>AI-assisted tasks:</strong> document extraction, screening, scenario runs.</li>
            <li><strong>Recommendations:</strong> options with trade-offs, not hype.</li>
            <li><strong>Implementation support:</strong> checklists, monitoring plan.</li>
          </ol>
          <div className="badges">
            <span>AI assists: Doc parsing</span><span>AI assists: Monte Carlo</span><span>AI assists: Data cleaning</span>
          </div>
        </Section>

        <Section id="cases" eyebrow="Selected outcomes" title="Case snapshots (illustrative)">
          <div className="cases">
            <div className="case"><h3>Mortgage vs. Invest</h3><p>Compared early payoff vs. index fund glidepath; client chose hybrid plan with defined rebalance bands and tax-lot rules.</p><small>Result: clearer policy, lower regret risk.</small></div>
            <div className="case"><h3>Second Property Screen</h3><p>Underwrote markets and HOA/tax scenarios; ran rent/occupancy sensitivities and exit comps.</p><small>Result: narrowed to 2 zip codes with target DSCR &lt; 1.2 stress.</small></div>
            <div className="case"><h3>Advisor Co-Pilot</h3><p>Prepped diligence memo on an alt fund; flagged fee waterfall and benchmark mismatch.</p><small>Result: renegotiated share class; better benchmark.</small></div>
          </div>
          <p className="disclaimer">Not investment advice. Examples are illustrative; results vary.</p>
        </Section>

        <Section id="faq" eyebrow="Clarity, not hype" title="FAQ">
          <details><summary>Is AI your product?</summary><p>No—finance is the product. AI is a tool to speed grunt work so we spend more time on judgment and communication.</p></details>
          <details><summary>Do you give investment advice?</summary><p>We provide research and education. Engagement scope can include non-discretionary recommendations. Nothing here is personalized advice.</p></details>
          <details><summary>How do fees work?</summary><p>Flat project fees with a clearly defined deliverable; no AUM required.</p></details>
          <details><summary>Security & privacy?</summary><p>We never upload sensitive docs to third-party tools without your written consent. AI assistants operate on redacted data where possible.</p></details>
        </Section>

        <Section id="contact" eyebrow="Let’s talk" title="Book a consultation">
          <p>Prefer email? <a href="mailto:hello@largekitecapital.com">hello@largekitecapital.com</a></p>
          <a className="btn primary" href="/contact">Open contact form</a>
          <p className="tiny">By contacting us, you agree to our brief engagement policy and privacy notice.</p>
        </Section>
      </main>

      <footer className="footer">
        <div>© {new Date().getFullYear()} LargeKite Capital LLC</div>
        <div className="fineprint">Educational content. Not an offer to buy/sell securities. Past results are not indicative of future results.</div>
      </footer>
    </>
  );
}
