import SentimentPill from '../components/SentimentPill';

export const metadata = { title: 'Services — LargeKiteCapitalIntelligence' };

export default function Services(){
  return (
    <main className="section">
      <div className="eyebrow">What we do</div>
      <h1 className="h2">Finance services with measurable outcomes</h1>
      <p className="content">We prioritize fundamentals—cash flow, risk, taxes—and use AI only to accelerate research and modeling.</p>

      {/* Market Sentiment card */}
      <div className="card" style={{marginTop:16}}>
        <div className="eyebrow">Market temperature</div>
        <div style={{display:'flex', alignItems:'center', gap:12, flexWrap:'wrap'}}>
          <SentimentPill />
          <a className="tiny" href="/market-sentiment">View methodology →</a>
        </div>
        <p className="tiny" style={{marginTop:8}}>
          We use this simple, finance-first signal in discovery to frame risk and pacing. AI only automates data pulls; human judgment drives recommendations.
        </p>
      </div>

      <div className="cards" style={{marginTop:16}}>
        <div className="card"><h3>Portfolio Strategy</h3><p>Asset allocation, risk budgeting, tax-aware rebalancing, IPS drafting.</p></div>
        <div className="card"><h3>Research & Due Diligence</h3><p>Screening and memo prep on funds, managers, and direct deals.</p></div>
        <div className="card"><h3>Cash-Flow & Real Estate</h3><p>Scenario planning for mortgages, second properties, and cap-rate sensitivity.</p></div>
      </div>
    </main>
  );
}
