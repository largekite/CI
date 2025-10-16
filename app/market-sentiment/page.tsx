'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { fmtAsOf } from '@/app/lib/fmt';

type Status = { heat:number; label:'Hot'|'Neutral'|'Cool'|string; trendUp?:boolean; trendDown?:boolean };
type Series = { last:number; chg5d:number; chg20d:number; chg60d:number; ma50?:number|null; ma200?:number|null };
type FullSeries = { t:number[]; close:number[]; ma50?:(number|null)[]; ma200?:(number|null)[] };
type Event = { t:number; type:'bull'|'bear' };

type Data = {
  ok: boolean;
  asOf: number;
  status: Status;
  spx: Series;
  vix: Series;
  spxSeries?: FullSeries;
  vixSeries?: FullSeries;
  crossovers?: Event[];
};

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

function Sparkline({ series, width=480, height=120, colors }:{ series: { t:number[]; lines:{ label:string; data:(number|null)[] }[] }, width?:number, height?:number, colors?:string[] }){
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
        <path key={l.label} d={pathFor(l.data)} fill="none" strokeWidth="2"
          stroke={colors?.[idx] || (idx===0?'#334155': idx===1?'#0ea5e9':'#64748b')} opacity={idx===0?0.9:0.95}/>
      ))}
    </svg>
  );
}

function SparklineWithTooltip({ series, width=560, height=140, colors }:{ series: { t:number[]; lines:{ label:string; data:(number|null)[] }[] }, width?:number, height?:number, colors?:string[] }){
  const ref = useRef<SVGSVGElement>(null);
  const { N, sx, sy } = useSparkScale(series, width, height);
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
    const y = sy((series.lines[0].data[i] as number) ?? 0);
    setHover({ i, x: sx(i), y });
  };

  return (
    <svg ref={ref} onMouseMove={onMove} onMouseLeave={()=>setHover(null)} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect x="0" y="0" width={width} height={height} fill="none" stroke="var(--line)"/>
      {series.lines.map((l,idx)=>(
        <path key={l.label} d={pathFor(l.data)} fill="none" strokeWidth="2"
          stroke={colors?.[idx] || (idx===0?'#334155': idx===1?'#0ea5e9':'#64748b')} opacity={idx===0?0.9:0.95}/>
      ))}
      {hover && (
        <>
          <line x1={hover.x} x2={hover.x} y1={1} y2={height-1} stroke="#94a3b8" strokeDasharray="4 3" />
          <circle cx={hover.x} cy={hover.y} r="3" fill="#0f172a" stroke="#94a3b8" />
        </>
      )}
      {/* Legend - light theme */}
      <g transform={`translate(8, ${height-10})`}>
        {series.lines.map((l,idx)=>(
          <g key={l.label} transform={`translate(${idx*120}, 0)`}>
            <rect x="0" y="-9" width="12" height="4" fill={colors?.[idx] || (idx===0?'#94a3b8': idx===1?'#0ea5e9':'#64748b')} />
            <text x="16" y="-6" fontSize="10" fill="#64748b">{l.label}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

export default function MarketSentiment() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string>('');
  useEffect(()=>{ fetch('/api/sentiment').then(r=>r.json()).then(setData).catch(e=>setError(String(e))); },[]);

  const spxSeries = useMemo(()=> data && data.spxSeries ? ({
    t: data.spxSeries.t,
    lines: [
      { label: 'Close', data: data.spxSeries.close },
      { label: 'SMA50', data: data.spxSeries.ma50! },
      { label: 'SMA200', data: data.spxSeries.ma200! },
    ]
  }) : null, [data]);

  const vixSeries = useMemo(()=> data && data.vixSeries ? ({
    t: data.vixSeries.t,
    lines: [
      { label: 'VIX', data: data.vixSeries.close },
    ]
  }) : null, [data]);

  return (
    <main className="section">
      <div className="eyebrow">Market dashboard</div>
      <h1 className="h2">Market Sentiment</h1>
      <p className="content">Light theme, same finance-first approach. Charts and legend colors tuned for readability on white.</p>

      {error && <p className="content">Error: {error}</p>}
      {!data && !error && <p className="content">Loading…</p>}

      {data && (
        <div style={{display:'grid', gap:16, gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', marginTop:16}}>
          <div className="card" style={{textAlign:'center'}}>
            <div className="eyebrow">Overall</div>
            <div style={{fontSize:42, fontWeight:800}}>{data.status.label}</div>
            <div className="tiny">Heat score: {data.status.heat}/100</div>
            <div className="tiny">As of: {fmtAsOf(data.asOf as number)}</div>
          </div>

          <div className="card">
            <h3>S&amp;P 500 — last 1y</h3>
            {spxSeries && <SparklineWithTooltip series={spxSeries} />}
            <ul className="tiny">
              <li>20d: {data.spx.chg20d?.toFixed?.(2)}% | 60d: {data.spx.chg60d?.toFixed?.(2)}%</li>
              <li>50d MA: {data.spx.ma50 ? data.spx.ma50.toFixed(2) : '—'} | 200d MA: {data.spx.ma200 ? data.spx.ma200.toFixed(2) : '—'}</li>
            </ul>
          </div>

          <div className="card">
            <h3>VIX — last 1y</h3>
            {vixSeries && <Sparkline series={vixSeries} colors={['#7c3aed']} />}
            <ul className="tiny">
              <li>Last: {data.vix.last?.toFixed?.(2)}</li>
              <li>20d: {data.vix.chg20d?.toFixed?.(2)}% | 60d: {data.vix.chg60d?.toFixed?.(2)}%</li>
            </ul>
          </div>

          <div className="card">
            <h3>Method</h3>
            <p className="tiny">
              Heat = 50 + 2×(S&amp;P 20d % change) − 1.5×max(VIX−18, 0). Hot only when 50d &gt; 200d.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
