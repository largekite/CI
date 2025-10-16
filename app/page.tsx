import Link from 'next/link';
import MarketStatsRow from './components/MarketStatsRow';
import SentimentPill from './components/SentimentPill';

function Section({ id, title, eyebrow, children }:{ id?:string; title:string; eyebrow?:string; children:React.ReactNode }){
  return (<section id={id} className="section">{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h2 className="h2">{title}</h2><div className="content">{children}</div></section>);
}
export default function Home(){
  return (<>
    <header className="nav">
      <div className="brand">LargeKiteCapitalIntelligence</div>
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
          <p>We’re a finance-first partner for individuals, founders, and advisors. We use AI to accelerate research and modeling—<strong>never</strong> to replace professional judgment.</p>
          <div className="hero-ctas">
            <a className="btn primary" href="/contact">Book a consultation</a>
            <a className="btn ghost" href="#method">See our methodology</a>
            <SentimentPill />
          </div>
          <ul className="trust"><li>CFA-led</li><li>Human-reviewed</li><li>Transparent fees</li></ul>
        </div>
      </section>
      <MarketStatsRow />
      <section id="method" className="section">
        <div className="eyebrow">How we work</div>
        <h2 className="h2">Method</h2>
        <div className="content">
          <ol className="steps">
            <li>Discovery: define objectives, constraints, and risk budget.</li>
            <li>Research: human-led due diligence; AI speeds data pulls only.</li>
            <li>Modeling: scenarios, taxes, and drawdowns; share assumptions.</li>
            <li>Decision: memo, spreadsheet, and live review.</li>
          </ol>
        </div>
      </section>

      
      <section id="cases" className="section">
        <div className="eyebrow">Snapshots</div>
        <h2 className="h2">Case Snapshots</h2>
        <div className="cases">
          <div className="case"><h3>Public markets IPS</h3><p>Rebuilt a client policy with risk bands and tax-aware rebalancing.</p></div>
          <div className="case"><h3>Real estate timing</h3><p>Modeled buy-vs-rent and fixed vs ARM with rate paths.</p></div>
          <div className="case"><h3>Manager screen</h3><p>Compared factor tilts, costs, and persistence across ETFs.</p></div>
        </div>
        <p className="disclaimer">Examples are illustrative; not investment advice.</p>
      </section>

      <Section id="services" eyebrow="What we do" title="Finance services with measurable outcomes">
        <div className="cards">
          <div className="card"><h3>Portfolio Strategy</h3><p>Asset allocation, risk budgeting, tax-aware rebalancing, IPS drafting.</p></div>
          <div className="card"><h3>Research & Due Diligence</h3><p>Screening and memo prep on funds, managers, or direct deals.</p></div>
          <div className="card"><h3>Cash-Flow & Real Estate</h3><p>Scenario planning for mortgages, second properties, and cap-rate sensitivity.</p></div>
        </div>
        <p className="note">We deliver formal memos, spreadsheets, and a live review—not just dashboards.</p>
      </Section>
    </main>
    <footer className="footer"><div>© {new Date().getFullYear()} LargeKiteCapitalIntelligence LLC LLC LLC</div></footer>
  </>);
}
