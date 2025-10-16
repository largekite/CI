
import SentimentPill from './SentimentPill';
import { getSentimentFull } from '@/app/lib/sentiment';

export default async function MarketStatsRow() {
  let vixLast: number | null = null;
  let spx20d: number | null = null;
  let asOf: number | null = null;
  try {
    const data = await getSentimentFull();
    vixLast = data.vix.last;
    spx20d = data.spx.chg20d;
    asOf = data.asOf;
  } catch {
    // leave nulls; we'll render placeholders
  }

  return (
    <section className="section" style={{paddingTop: 24, paddingBottom: 24}}>
      <div className="cards" style={{gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))'}}>
        <div className="card">
          <div className="eyebrow">Market temperature</div>
          <div style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
            <SentimentPill />
            <a className="tiny" href="/market-sentiment">Details →</a>
          </div>
        </div>
        <div className="card">
          <div className="eyebrow">VIX level</div>
          <div style={{fontSize:24, fontWeight:800}}>{vixLast!=null ? vixLast.toFixed(2) : '—'}</div>
          <div className="tiny">Lower is calmer. Heuristic penalizes above ~18.</div>
        </div>
        <div className="card">
          <div className="eyebrow">S&amp;P 500 — 20d</div>
          <div style={{fontSize:24, fontWeight:800}}>
            {spx20d!=null ? `${spx20d.toFixed(2)}%` : '—'}
          </div>
          <div className="tiny">Positive momentum warms; negative cools.</div>
        </div>
      </div>
      <div className="tiny" style={{marginTop:8}}>As of: {asOf ? new Date(asOf).toLocaleString() : '—'}</div>
    </section>
  );
}
