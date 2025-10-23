'use client';

import { useEffect, useMemo, useRef, useState, useId } from 'react';
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

function useSparkScale(
  series: { t:number[]; lines:{ label:string; data:(number|null)[] }[] },
  width:number,
  height:number,
  pad:number
){
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
  const innerW = Math.max(1, width - 2*pad);
  const innerH = Math.max(1, height - 2*pad);
  const sx = (i:number)=> pad + (N<=1 ? 0 : (i/(N-1))*innerW);
  const sy = (v:number)=> pad + innerH - ((v - min)/(max - min))*innerH;
  return { min, max, N, sx, sy, innerW, innerH };
}

type MomentumMode = 'normal' | 'inverted';

function Legend({
  items,
  active,
  onToggle,
}:{
  items:{ label:string; swatch?:string }[];
  active:boolean[];
  onToggle:(idx:number)=>void;
}){
  function onKeyToggle(e: React.KeyboardEvent<HTMLButtonElement>, idx:number){
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle(idx);
    }
  }
  return (
    <div className="tiny" style={{display:'flex', gap:10, flexWrap:'wrap', marginTop:8}}>
      {items.map((it, i)=>(
        <button
          key={i}
          type="button"
          onClick={()=>onToggle(i)}
          onKeyDown={(e)=>onKeyToggle(e,i)}
          aria-pressed={active[i]}
          role="button"
          tabIndex={0}
          title={active[i] ? `Hide ${it.label}` : `Show ${it.label}`}
          style={{
            display:'inline-flex',
            alignItems:'center',
            gap:6,
            padding:'4px 10px',
            border:'1px solid var(--line)',
            borderRadius:999,
            background: active[i] ? '#fff' : '#f1f5f9',
            cursor:'pointer',
            outlineOffset: 2
          }}
        >
          <span style={{
            width:12, height:3, borderRadius:2,
            background: it.swatch || '#64748b', display:'inline-block'
          }} />
          {it.label}
        </button>
      ))}
    </div>
  );
}

function Spark({
  series,
  width=560,
  height=160,
  colors,
  showTooltip=false,
  showGrid=true,
  showDate=false,
  momentumColors=false,
  momentumMode='normal',
  pctWindow=20,
  visible,
}:{
  series: { t:number[]; lines:{ label:string; data:(number|null)[] }[] },
  width?:number,
  height?:number,
  colors?:string[],
  showTooltip?: boolean,
  showGrid?: boolean,
  showDate?: boolean,
  momentumColors?: boolean,
  momentumMode?: MomentumMode,
  pctWindow?: number,
  visible?: boolean[],
}){
  const PAD = 10;
  const { N, sx, sy, innerH } = useSparkScale(series, width, height, PAD);
  const vis = visible && visible.length === series.lines.length ? visible : series.lines.map(()=>true);

  const pathFor = (data:(number|null)[]) => {
    let d = '';
    for (let i=0;i<N;i++){
      const v = data[i];
      if (v==null || !isFinite(v)) continue;
      const x = sx(i), y = sy(v);
      d += (d ? ` L ${x} ${y}` : `M ${x} ${y}`);
    }
    return d;
  };

  function segColor(up:boolean){
    if (momentumMode === 'inverted') return up ? '#ef4444' : '#10b981'; // VIX: rising red, falling green
    return up ? '#10b981' : '#ef4444'; // SPX: rising green, falling red
  }

  function SegmentedLine({ data }:{ data:(number|null)[] }){
    const segs: JSX.Element[] = [];
    let prevX: number | null = null;
    let prevY: number | null = null;
    let prevV: number | null = null;

    for (let i=0;i<N;i++){
      const v = data[i];
      if (v==null || !isFinite(v)) { prevX = prevY = prevV = null; continue; }
      const x = sx(i), y = sy(v);

      if (prevX!=null && prevY!=null && prevV!=null){
        const up = v >= prevV;
        segs.push(
          <line
            key={`seg-${i}`}
            x1={prevX} y1={prevY}
            x2={x}     y2={y}
            stroke={segColor(up)}
            strokeWidth={2}
          />
        );
      }
      prevX = x; prevY = y; prevV = v;
    }
    return <>{segs}</>;
  }

  // ✅ Stable IDs to avoid SSR/client mismatch
  const uid = useId().replace(/[:]/g, '');
  const clipId = `plotClip_${uid}`;
  const gridId = `gridPath_${uid}`;

  const svgRef = useRef<SVGSVGElement|null>(null);
  const [hover, setHover] = useState<{i:number; x:number; y:number; values:number[]}|null>(null);

  function onMove(e: React.MouseEvent<SVGSVGElement, MouseEvent>){
    if (!showTooltip) return;
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const frac = Math.min(1, Math.max(0, (x - PAD) / (width - 2*PAD)));
    const i = Math.round(frac * (N-1));

    const values = series.lines.map(l => {
      const v = l.data[i];
      return (v==null || !isFinite(v)) ? NaN : Number(v);
    });

    // Tooltip y follows first visible series, else center
    let y = PAD + innerH/2;
    for (let k=0;k<series.lines.length;k++){
      if (!vis[k]) continue;
      const v = values[k];
      if (!isNaN(v)) { y = sy(v); break; }
    }

    setHover({ i, x: sx(i), y, values });
  }

  function pctChangeAt(i:number, window:number){
    if (i - window < 0) return NaN;
    const a = series.lines[0]?.data[i];
    const b = series.lines[0]?.data[i - window];
    if (a==null || b==null || !isFinite(a) || !isFinite(b) || b === 0) return NaN;
    return (Number(a) / Number(b) - 1) * 100;
  }

  const mainVisible = vis[0];

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="sparkline"
      onMouseMove={onMove}
      onMouseLeave={()=>setHover(null)}
    >
      <rect x="0" y="0" width={width} height={height} fill="none" stroke="var(--line)"/>

      <defs>
        <clipPath id={clipId}>
          {/* inset by 0.5px to prevent stroke bleed on some renderers */}
          <rect x={PAD+0.5} y={PAD+0.5} width={width - 2*PAD - 1} height={height - 2*PAD - 1} />
        </clipPath>
        <path id={gridId} d={`M ${PAD} 0 H ${width-PAD}`} stroke="var(--line)" strokeDasharray="4 3" fill="none"/>
      </defs>

      {/* Gridlines (clipped) */}
      <g clipPath={`url(#${clipId})`}>
        {[0,1,2,3].map(g => {
          const gy = PAD + (g+1)*((height - 2*PAD)/5);
          return <use key={g} href={`#${gridId}`} transform={`translate(0, ${gy})`} opacity="0.7"/>;
        })}
      </g>

      {/* Lines (clipped) */}
      <g clipPath={`url(#${clipId})`}>
        {series.lines[0] && mainVisible && momentumColors ? (
          <SegmentedLine data={series.lines[0].data} />
        ) : (
          series.lines[0] && mainVisible && (
            <path
              d={pathFor(series.lines[0].data)}
              fill="none"
              strokeWidth="2"
              stroke={colors?.[0] || '#334155'}
              opacity={0.95}
            />
          )
        )}
        {series.lines.slice(1).map((l, idx)=>(
          vis[idx+1] && (
            <path
              key={l.label}
              d={pathFor(l.data)}
              fill="none"
              strokeWidth="2"
              stroke={colors?.[idx+1] || (idx===0 ? '#0ea5e9' : '#64748b')}
              opacity={0.9}
            />
          )
        ))}
      </g>

      {/* Tooltip (also clipped so guides/dots don't bleed) */}
      {showTooltip && hover && (
        <g clipPath={`url(#${clipId})`}>
          <line x1={hover.x} x2={hover.x} y1={PAD} y2={height-PAD} stroke="#94a3b8" strokeDasharray="4 3" />
          <circle cx={hover.x} cy={hover.y} r="3.5" fill="#0f172a" stroke="#94a3b8"/>

          {(() => {
            const labelLines: string[] = [];
            if (showDate) {
              const ts = series.t[hover.i];
              if (ts) labelLines.push(new Date(ts).toLocaleDateString());
            }
            if (mainVisible) {
              const v0 = hover.values[0];
              if (!isNaN(v0)) {
                labelLines.push(`${series.lines[0].label}: ${v0.toFixed(2)}`);
                const pct = pctChangeAt(hover.i, pctWindow);
                if (!isNaN(pct)) labelLines.push(`${pctWindow}d: ${pct.toFixed(2)}%`);
              }
            }
            series.lines.slice(1).forEach((l, idx) => {
              if (!vis[idx+1]) return;
              const v = hover.values[idx+1];
              if (!isNaN(v)) labelLines.push(`${l.label}: ${v.toFixed(2)}`);
            });

            const badgeWidth = 160;
            const badgeHeight = labelLines.length*16 + 8;
            const badgeX = Math.min(width - badgeWidth - 4, Math.max(hover.x + 8, PAD));
            const badgeY = Math.max(PAD + 4, Math.min(height - PAD - badgeHeight, hover.y - 18));

            return (
              <g transform={`translate(${badgeX}, ${badgeY})`}>
                <rect width={badgeWidth} height={badgeHeight} rx="6" ry="6" fill="#ffffff" stroke="var(--line)"/>
                {labelLines.map((txt, i)=>(
                  <text key={i} x="8" y={14 + i*16} fontSize="11" fill="#334155">{txt}</text>
                ))}
              </g>
            );
          })()}
        </g>
      )}
    </svg>
  );
}

function usePersistedVisibility(key:string, initial:boolean[]){
  const [visible, setVisible] = useState<boolean[]>(initial);
  useEffect(()=>{
    try{
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      if (raw){
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length === initial.length){
          setVisible(arr.map(Boolean));
        }
      }
    }catch{}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(()=>{
    try{
      if (typeof window !== 'undefined'){
        window.localStorage.setItem(key, JSON.stringify(visible));
      }
    }catch{}
  }, [key, visible]);
  return [visible, setVisible] as const;
}

function ChartWithLegend({
  storageKey,
  title,
  series,
  legendItems,
  legendInitial,
  ...sparkProps
}:{
  storageKey:string;
  title:string;
  series:{ t:number[]; lines:{ label:string; data:(number|null)[] }[] };
  legendItems:{ label:string; swatch?:string }[];
  legendInitial:boolean[];
  showTooltip?:boolean;
  showGrid?:boolean;
  showDate?:boolean;
  momentumColors?:boolean;
  momentumMode?:MomentumMode;
  pctWindow?:number;
}){
  const [visible, setVisible] = usePersistedVisibility(storageKey, legendInitial);
  const toggle = (idx:number)=> setVisible(v => v.map((b,i)=> i===idx ? !b : b));

  return (
    <div className="card">
      <h3>{title}</h3>
      <Spark series={series} visible={visible} {...(sparkProps as any)} />
      <Legend items={legendItems} active={visible} onToggle={toggle} />
    </div>
  );
}

export default function MarketSentiment() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string>('');
  useEffect(()=> {
    fetch('/api/sentiment', { cache: 'no-store' })
      .then(r=>r.json())
      .then(setData)
      .catch(e=>setError(String(e)));
  },[]);

  const spxSeries = useMemo(()=> data?.spxSeries ? ({
    t: data.spxSeries.t,
    lines: [
      { label: 'Close', data: data.spxSeries.close },
      { label: 'SMA50', data: data.spxSeries.ma50! },
      { label: 'SMA200', data: data.spxSeries.ma200! },
    ]
  }) : null, [data]);

  const vixSeries = useMemo(()=> data?.vixSeries ? ({
    t: data.vixSeries.t,
    lines: [
      { label: 'VIX', data: data.vixSeries.close },
    ]
  }) : null, [data]);

  return (
    <main className="section">
      <div className="eyebrow">Market dashboard</div>
      <h1 className="h2">Market Sentiment</h1>

      {error && <p className="content">Error: {error}</p>}
      {!data && !error && <p className="content">Loading…</p>}

      {data && (
        <div style={{display:'grid', gap:16, gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', marginTop:16}}>
          <div className="card" style={{textAlign:'center'}}>
            <div className="eyebrow">Overall</div>
            <div style={{fontSize:42, fontWeight:800}}>{data.status.label}</div>
            <div className="tiny">Heat score: {data.status.heat}/100</div>
            <div className="tiny">As of: {fmtAsOf(data.asOf)}</div>
          </div>

          {spxSeries && (
            <ChartWithLegend
              storageKey="ms_vis_spx"
              title="S&P 500 — last 1y"
              series={spxSeries}
              legendItems={[
                { label: 'Close',  swatch: '#10b981/#ef4444' }, // momentum (up/down)
                { label: 'SMA50', swatch: '#0ea5e9' },
                { label: 'SMA200', swatch: '#64748b' },
              ]}
              legendInitial={[true, true, true]}
              showTooltip
              showGrid
              showDate
              momentumColors
              momentumMode="normal"
              pctWindow={20}
            />
          )}

          {vixSeries && (
            <div>
              <ChartWithLegend
                storageKey="ms_vis_vix"
                title="VIX — last 1y"
                series={vixSeries}
                legendItems={[ { label: 'VIX (rising = red, falling = green)', swatch: '#ef4444/#10b981' } ]}
                legendInitial={[true]}
                showTooltip
                showGrid
                momentumColors
                momentumMode="inverted"
                pctWindow={20}
              />
              <div className="tiny" style={{marginTop:6}}>
                VIX is a fear gauge—rising (red) often signals stress, falling (green) calmer conditions.
              </div>
            </div>
          )}

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
