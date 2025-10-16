
import SentimentPill from '../components/SentimentPill';

export const metadata = { title: 'Services — LargeKite Capital' };

const tiers = [
  { name: 'Project: Portfolio Strategy', price: '$1,500–$3,500 / project', bullets: [
    'Risk profile & IPS draft', 'Tax-aware allocation & rebalance bands', '90-min live review + deliverables (memo + sheet)'
  ]},
  { name: 'Project: Real Estate & Cash-Flow', price: '$1,200–$2,800 / project', bullets: [
    'Buy vs. wait, rent/sell scenarios', 'DSCR & cap-rate sensitivity table', 'Local tax/HOA overlays (client-provided data)'
  ]},
  { name: 'Advisor Co-Pilot (B2B)', price: 'From $2,000 / memo', bullets: [
    'Fund/manager screen & red-flag review', 'Fee waterfall & benchmark sanity checks', 'Client-facing one-pager + appendix'
  ]},
];

export default function Services() {
  return (
    <main className="section">
      <div className="eyebrow">What we do</div>
      <h1 className="h2">Finance services, human-led. AI assists under the hood.</h1>
      <p className="content">We price on scope with fixed deliverables. No AUM required. Work is CFA-led and human-reviewed.</p>

      {/* Market Sentiment card */}
      <div className="card" style={{marginTop:16}}>
        <div className="eyebrow">Market temperature</div>
        <div style={{display:'flex', alignItems:'center', gap:12, flexWrap:'wrap'}}>
          <SentimentPill />
          <a className="tiny" href="/market-sentiment">View methodology →</a>
        </div>
        <p className="tiny" style={{marginTop:8}}>
          We use this simple, finance-first signal in discovery to frame risk and pacing. AI only automates data pulls; human judgment and context drive recommendations.
        </p>
      </div>

      <div className="cards" style={{marginTop:16}}>
        {tiers.map(t=>(
          <div key={t.name} className="card">
            <h3>{t.name}</h3><strong>{t.price}</strong>
            <ul>{t.bullets.map(b=><li key={b}>{b}</li>)}</ul>
            <a className="btn primary" href="/contact">Start this project</a>
          </div>
        ))}
      </div>
      <details style={{marginTop:18}}><summary>What AI actually does here</summary>
        <p className="content">We use AI for document extraction, first-pass screens, and Monte Carlo scenario assists. Every recommendation is reviewed by a human analyst.</p>
      </details>
      <p className="tiny" style={{marginTop:12}}>Educational content. Not investment advice. Engagements are non-discretionary unless otherwise agreed.</p>
    </main>
  );
}
