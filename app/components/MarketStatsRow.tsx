import SentimentPill from './SentimentPill';
import { getSentimentFull } from '@/app/lib/sentiment';
export default async function MarketStatsRow(){
  let vixLast=null, spx20d=null, asOf=null;
  try { const d=await getSentimentFull(); vixLast=d.vix.last; spx20d=d.spx.chg20d; asOf=d.asOf; } catch {}
  return (<section className="section" style={{paddingTop:24,paddingBottom:24}}>
    <div className="cards" style={{gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))'}}>
      <div className="card"><div className="eyebrow">Market temperature</div><div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}><SentimentPill /><a className="tiny" href="/market-sentiment">Details →</a></div></div>
      <div className="card"><div className="eyebrow">VIX level</div><div style={{fontSize:24,fontWeight:800}}>{vixLast!=null? vixLast.toFixed(2):'—'}</div><div className="tiny">Lower is calmer. Heuristic penalizes above ~18.</div></div>
      <div className="card"><div className="eyebrow">S&amp;P 500 — 20d</div><div style={{fontSize:24,fontWeight:800}}>{spx20d!=null? `${spx20d.toFixed(2)}%`:'—'}</div><div className="tiny">Positive momentum warms; negative cools.</div></div>
    </div>
    <div className="tiny" style={{marginTop:8}}>As of: {asOf? new Date(asOf).toLocaleString():'—'}</div>
  </section>);
}
