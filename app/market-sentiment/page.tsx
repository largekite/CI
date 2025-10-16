
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

type Status = { heat:number; label:'Hot'|'Neutral'|'Cool'|string; trendUp?:boolean; trendDown?:boolean };
type Series = { last:number; chg5d:number; chg20d:number; chg60d:number; ma50?:number|null; ma200?:number|null };
type FullSeries = { t:number[]; close:number[]; ma50?:(number|null)[]; ma200?:(number|null)[] };
type Event = { t:number; type:'bull'|'bear' };

type Data = { ok: boolean; asOf: number; status: Status; spx: Series; vix: Series; spxSeries: FullSeries; vixSeries: FullSeries; crossovers: Event[] };

function useSparkScale(series: { t:number[]; lines:{ label:string; data:(number|null)[] }[] }, width:number, height:number){
  let min = Infinity, max = -Infinity;
  for (const l of series.lines){
    for (const v of l.data){
      if (v==null || !isFinite(v)) continue;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  if (!isFinite(min) || !isFinite(max) || min===max) { min = 0; max = 1; }
  const N = series.t.length;
  const sx = (i:number)=> (i/(Math.max(1,N-1))) * (width-2) + 1;
  const sy = (v:number)=> height - 1 - ((v - min)/(max - min)) * (height-2);
  return { min, max, N, sx, sy };
}

function Sparkline({ series, width=360, height=80, colors }:{ series: { t:number[]; lines:{ label:string; data:(number|null)[] }[] }, width?:number, height?:number, colors?:string[] }){
  const { N, sx, sy } = useSparkScale(series, width, height);
  const pathFor = (data:(number|null)[]) => {
    let d = '';
    for (let i=0;i<N;i++){
      const v = data[i];
      if (v==null || !isFinite(v)) continue;
      const x = sx(i), y = sy(v);
      if (d==='') d = `M ${x} ${y}`; else d += ` L ${x} ${y}`;
    }
    return d;
  };
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="sparkline">
      <rect x="0" y="0" width={width} height={height} fill="none" stroke="var(--line)"/>
      {series.lines.map((l,idx)=>(
        <path key={l.label} d={pathFor(l.data)} fill="none" strokeWidth="2" stroke={colors?.[idx] || (idx===0?'currentColor': idx===1?'#7cf0c9':'#6aa5ff')} opacity={idx===0?0.9:0.9}/>
      ))}
    </svg>
  );
}

function SparklineWithTooltip({ series, width=480, height=120, colors }:{ series: { t:number[]; lines:{ label:string; data:(number|null)[] }[] }, width?:number, height?:number, colors?:string[] }){
  const ref = useRef<SVGSVGElement>(null);
  const { min, max, N, sx, sy } = useSparkScale(series, width, height);
  const [hover, setHover] = useState<{i:number; x:number; y:number} | null>(null);

  const pathFor = (data:(number|null)[]) => {
    let d = '';
    for (let i=0;i<N;i++){
      const v = data[i];
      if (v==null || !isFinite(v)) continue;
      const x = sx(i), y = sy(v);
      if (d==='') d = `M ${x} ${y}`; else d += ` L ${x} ${y}`;
    }
    return d;
  };

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = ref.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const frac = Math.min(1, Math.max(0, (x-1) / (width-2)));
    const i = Math.round(frac * (N-1));
    const y = sy(series.lines[0].data[i] as number);
    setHover({ i, x: sx(i), y });
  };

  return (
    <svg ref={ref} onMouseMove={onMove} onMouseLeave={()=>setHover(null)} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect x="0" y="0" width={width} height={height} fill="none" stroke="var(--line)"/>
      {series.lines.map((l,idx)=>(
        <path key={l.label} d={pathFor(l.data)} fill="none" strokeWidth="2" stroke={colors?.[idx] || (idx===0?'currentColor': idx===1?'#7cf0c9':'#6aa5ff')} opacity={idx===0?0.9:0.9}/>
      ))}
      {hover && (
        <>
          <line x1={hover.x} x2={hover.x} y1={1} y2={height-1} stroke="#888" strokeDasharray="4 3" />
          <circle cx={hover.x} cy={hover.y} r="3" fill="#fff" />
        </>
      )}
      {/* Legend */}
      <g transform={`translate(8, ${height-12})`}>
        {series.lines.map((l,idx)=>(
          <g key={l.label} transform={`translate(${idx*110}, 0)`}>
            <rect x="0" y="-10" width="12" height="4" fill={colors?.[idx] || (idx===0?'#e9eefc': idx===1?'#7cf0c9':'#6aa5ff')} />
            <text x="16" y="-7" fontSize="10" fill="#b7c0d6">{l.label}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

export default function MarketSentiment() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string>('');
  const [dismissed, setDismissed] = useState(false);

  useEffect(()=>{ fetch('/api/sentiment').then(r=>r.json()).then(setData).catch(e=>setError(String(e))); },[]);

  const badgeClass = (label?:string) => (label||'').toLowerCase()==='hot' ? 'badge hot' : (label||'').toLowerCase()==='cool' ? 'badge cool' : 'badge neutral';

  const spxSeries = useMemo(()=> data ? ({
    t: data.spxSeries.t,
    lines: [
      { label: 'Close', data: data.spxSeries.close },
      { label: 'SMA50', data: data.spxSeries.ma50! },
      { label: 'SMA200', data: data.spxSeries.ma200! },
    ]
  }) : null, [data]);

  const vixSeries = useMemo(()=> data ? ({
    t: data.vixSeries.t,
    lines: [
      { label: 'VIX', data: data.vixSeries.close },
    ]
  }) : null, [data]);

  const crossoverCount = data?.crossovers?.length || 0;
  const lastBull = data?.crossovers?.slice().reverse().find(e=>e.type==='bull');
  const lastBear = data?.crossovers?.slice().reverse().find(e=>e.type==='bear');

  return (
    <main className="section">
      {!dismissed && (
        <div className="banner">
          <div>
            Educational heuristic only. Not investment advice. Signals may be delayed or noisy. Always consider your risk, taxes, and horizon.
          </div>
          <button className="btn" onClick={()=>setDismissed(true)}>Dismiss</button>
        </div>
      )}

      <div className="eyebrow">Market dashboard</div>
      <h1 className="h2">Market Sentiment</h1>
      <p className="content">We combine S&amp;P 500 momentum, volatility (VIX), and a trend gate (50d &gt; 200d) to label conditions <strong>Hot / Neutral / Cool</strong>.</p>

      {error && <p className="content">Error: {error}</p>}
      {!data && !error && <p className="content">Loading…</p>}

      {data && (
        <div style={{display:'grid', gap:16, gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', marginTop:16}}>
          <div className="card" style={{textAlign:'center'}}>
            <div className="eyebrow">Overall</div>
            <div className={badgeClass(data.status.label)}>{data.status.label}</div>
            <div className="tiny">Heat score: {data.status.heat}/100</div>
            <div className="tiny">Trend gate: {data.status.trendUp ? 'SMA50 > SMA200 (uptrend)' : data.status.trendDown ? 'SMA50 < SMA200 (downtrend)' : 'insufficient data'}</div>
            <div className="tiny">As of: {new Date(data.asOf).toLocaleString()}</div>
            <a className="tiny" href="/api/sentiment?format=compact" target="_blank" rel="noreferrer">Compact JSON feed</a>
          </div>

          <div className="card">
            <h3>S&amp;P 500 — last 1y</h3>
            {spxSeries && <SparklineWithTooltip series={spxSeries} width={520} height={140} />}
            <ul className="tiny">
              <li>Last: {data.spx.last?.toFixed?.(2)}</li>
              <li>20d: {data.spx.chg20d?.toFixed?.(2)}% | 60d: {data.spx.chg60d?.toFixed?.(2)}%</li>
              <li>50d MA: {data.spx.ma50 ? data.spx.ma50.toFixed(2) : '—'} | 200d MA: {data.spx.ma200 ? data.spx.ma200.toFixed(2) : '—'}</li>
            </ul>
          </div>

          <div className="card">
            <h3>VIX — last 1y</h3>
            {vixSeries && <Sparkline series={vixSeries} width={520} height={120} colors={['#c77dff']} />}
            <ul className="tiny">
              <li>Last: {data.vix.last?.toFixed?.(2)}</li>
              <li>20d: {data.vix.chg20d?.toFixed?.(2)}% | 60d: {data.vix.chg60d?.toFixed?.(2)}%</li>
            </ul>
          </div>

          <div className="card">
            <h3>Crossovers (50/200)</h3>
            <p className="tiny">Count (last year): {crossoverCount}</p>
            <ul className="tiny">
              <li>Last bull cross: {lastBull ? new Date(lastBull.t).toLocaleDateString() : '—'}</li>
              <li>Last bear cross: {lastBear ? new Date(lastBear.t).toLocaleDateString() : '—'}</li>
            </ul>
            <p className="tiny">Interpretation: bull cross = potential regime strength; bear cross = deterioration. Use alongside valuation, macro, and risk controls.</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .banner {
          display:flex; justify-content:space-between; align-items:center;
          gap:12px; border:1px solid var(--line); background:#161a25; padding:12px 14px; border-radius:10px; margin-bottom:12px;
        }
        .badge { display:inline-block; padding:8px 14px; border-radius:999px; font-weight:800; letter-spacing:.02em; }
        .badge.hot { background:#1faa74; color:#081510; }
        .badge.cool { background:#3a6ff2; color:#0a0f1f; }
        .badge.neutral { background:#c7a534; color:#1a1403; }
      `}</style>
    </main>
  );
}
