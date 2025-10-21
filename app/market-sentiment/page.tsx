'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { fmtAsOf } from '@/app/lib/fmt';

type Status = { heat:number; label:'Hot'|'Neutral'|'Cool'|string; trendUp?:boolean; trendDown?:boolean };
type Series = { last:number; chg5d:number; chg20d:number; chg60d:number; ma50?:number|null; ma200?:number|null };
type FullSeries = { t:number[]; close:number[]; ma50?:(number|null)[]; ma200?:(number|null)[] };
type Event = { t:number; type:'bull'|'bear' };
type Data = { ok: boolean; asOf: number; status: Status; spx: Series; vix: Series; spxSeries?: FullSeries; vixSeries?: FullSeries; crossovers?: Event[]; };

function useSparkScale(series:{t:number[];lines:{label:string;data:(number|null)[]}[]},w:number,h:number){
  let min=Infinity,max=-Infinity; for(const l of series.lines){ for(const v of l.data){ if(v==null||!isFinite(v)) continue; if(v<min)min=v; if(v>max)max=v; } }
  if(!isFinite(min)||!isFinite(max)||min===max){min=0;max=1}
  const N=series.t.length; const sx=(i:number)=> (i/(Math.max(1,N-1)))*(w-2)+1; const sy=(v:number)=> h-1-((v-min)/(max-min))*(h-2); return {N,sx,sy};
}
function Spark({ series, width=560, height=140, colors }:{ series:{t:number[];lines:{label:string;data:(number|null)[]}[]}, width?:number, height?:number, colors?:string[] }){
  const {N,sx,sy}=useSparkScale(series,width,height);
  const pathFor=(data:(number|null)[])=>{ let d=''; for(let i=0;i<N;i++){ const v=data[i]; if(v==null||!isFinite(v)) continue; const x=sx(i), y=sy(v); d += (d?' L ':'M ')+`${x} ${y}` } return d; };
  return (<svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}><rect x="0" y="0" width={width} height={height} fill="none" stroke="var(--line)"/>{series.lines.map((l,idx)=>(<path key={l.label} d={pathFor(l.data)} fill="none" strokeWidth="2" stroke={colors?.[idx] || (idx===0?'#334155': idx===1?'#0ea5e9':'#64748b')} opacity={idx===0?0.9:0.95}/>))}</svg>);
}

export default function MarketSentiment(){
  const [data,setData] = useState<Data|null>(null);
  const [err,setErr] = useState<string>('');
  useEffect(()=>{ fetch('/api/sentiment',{cache:'no-store'}).then(r=>r.json()).then(setData).catch(e=>setErr(String(e))); },[]);

  const spxSeries = useMemo(()=> data?.spxSeries && ({ t:data.spxSeries.t, lines:[ {label:'Close',data:data.spxSeries.close}, {label:'SMA50',data:data.spxSeries.ma50!}, {label:'SMA200',data:data.spxSeries.ma200!} ] }) || null, [data]);
  const vixSeries = useMemo(()=> data?.vixSeries && ({ t:data.vixSeries.t, lines:[ {label:'VIX',data:data.vixSeries.close} ] }) || null, [data]);

  return (<main className='section'>
    <div className='eyebrow'>Market dashboard</div>
    <h1 className='h2'>Market Sentiment</h1>
    <p className='content'>Light theme, finance-first. Charts tuned for readability on white.</p>
    {err && <p className='content'>Error: {err}</p>}
    {!data && !err && <p className='content'>Loading…</p>}
    {data && (<div style={{display:'grid',gap:16,gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',marginTop:16}}>
      <div className='card' style={{textAlign:'center'}}>
        <div className='eyebrow'>Overall</div>
        <div style={{fontSize:42,fontWeight:800}}>{data.status.label}</div>
        <div className='tiny'>Heat score: {data.status.heat}/100</div>
        <div className='tiny'>As of: {fmtAsOf(data.asOf)}</div>
      </div>
      <div className='card'><h3>S&amp;P 500 — last 1y</h3>{spxSeries && <Spark series={spxSeries} />}</div>
      <div className='card'><h3>VIX — last 1y</h3>{vixSeries && <Spark series={vixSeries} colors={['#7c3aed']} />}</div>
      <div className='card'><h3>Method</h3><p className='tiny'>Heat = 50 + 2×(S&amp;P 20d % change) − 1.5×max(VIX−18, 0). Hot only when 50d &gt; 200d.</p></div>
    </div>)}
  </main>);
}
