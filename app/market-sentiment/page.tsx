'use client';

import { useEffect, useMemo, useRef, useState, useId } from 'react';
import Link from 'next/link';
import { fmtAsOf } from '@/app/lib/fmt';

/* ===================== Types ===================== */

type Status = {
  heat: number;
  label: 'Hot' | 'Neutral' | 'Cool' | string;
  trendUp?: boolean;
  trendDown?: boolean;
};

type Series = {
  last: number;
  chg5d: number;
  chg20d: number;
  chg60d: number;
  ma50?: number | null;
  ma200?: number | null;
};

type FullSeries = {
  t: number[];
  close: (number | null)[];
  ma50?: (number | null)[];
  ma200?: (number | null)[];
};

type Event = { t: number; type: 'bull' | 'bear' };

type Data = {
  ok: boolean;
  asOf: number;
  status: Status;

  spx: Series;
  vix: Series;
  spxSeries?: FullSeries;
  vixSeries?: FullSeries;

  // New assets
  ndx?: Series;
  dji?: Series;
  gold?: Series;
  ndxSeries?: FullSeries;
  djiSeries?: FullSeries;
  goldSeries?: FullSeries;

  crossovers?: Event[];
};

/* ===================== Range utils ===================== */

const RANGES = [
  { key: '1mo', label: '1M' },
  { key: '6mo', label: '6M' },
  { key: '1y', label: '1Y' },
  { key: '5y', label: '5Y' },
  { key: 'max', label: 'MAX' },
] as const;

type RangeKey = typeof RANGES[number]['key'];

function defaultIntervalFor(range: string) {
  switch (range) {
    case '1mo':
    case '3mo':
    case '6mo':
    case 'ytd':
    case '1y':
      return '1d';
    case '2y':
    case '5y':
      return '1wk';
    case '10y':
    case 'max':
      return '1mo';
    default:
      return '1d';
  }
}

function labelForRange(range: RangeKey) {
  const found = RANGES.find(r => r.key === range);
  return found ? found.label : range.toUpperCase();
}

/* ===================== Chart math & helpers ===================== */

function useSparkScale(
  series: { t: number[]; lines: { label: string; data: (number | null)[] }[] },
  width: number,
  height: number,
  pad: number
) {
  let min = Infinity,
    max = -Infinity;
  for (const l of series.lines) {
    for (const v of l.data) {
      if (v == null || !isFinite(v)) continue;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  if (!isFinite(min) || !isFinite(max)) {
    min = 0;
    max = 1;
  }
  if (min === max) {
    min -= 1;
    max += 1;
  }

  // Add headroom so strokes never touch frame
  const HEADROOM = 0.08;
  const range = max - min;
  min = min - range * HEADROOM;
  max = max + range * HEADROOM;

  const N = series.t.length;
  const innerW = Math.max(1, width - 2 * pad);
  const innerH = Math.max(1, height - 2 * pad);
  const sx = (i: number) => pad + (N <= 1 ? 0 : (i / (N - 1)) * innerW);
  const sy = (v: number) => pad + innerH - ((v - min) / (max - min)) * innerH;
  return { min, max, N, sx, sy, innerW, innerH };
}

type MomentumMode = 'normal' | 'inverted';

function Legend({
  items,
  active,
  onToggle,
}: {
  items: { label: string; swatch?: string }[];
  active: boolean[];
  onToggle: (idx: number) => void;
}) {
  function onKeyToggle(e: React.KeyboardEvent<HTMLButtonElement>, idx: number) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle(idx);
    }
  }
  return (
    <div className="tiny" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
      {items.map((it, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onToggle(i)}
          onKeyDown={(e) => onKeyToggle(e, i)}
          aria-pressed={active[i]}
          role="button"
          tabIndex={0}
          title={active[i] ? `Hide ${it.label}` : `Show ${it.label}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            border: '1px solid var(--line)',
            borderRadius: 999,
            background: active[i] ? '#fff' : '#f1f5f9',
            cursor: 'pointer',
            outlineOffset: 2,
          }}
        >
          <span
            style={{
              width: 12,
              height: 3,
              borderRadius: 2,
              background: it.swatch || '#64748b',
              display: 'inline-block',
            }}
          />
          {it.label}
        </button>
      ))}
    </div>
  );
}

function Spark({
  series,
  width = 640,
  height = 220,
  colors,
  showTooltip = false,
  showGrid = true,
  showDate = false,
  momentumColors = false,
  momentumMode = 'normal',
  pctWindow = 20,
  visible,
}: {
  series: { t: number[]; lines: { label: string; data: (number | null)[] }[] };
  width?: number;
  height?: number;
  colors?: string[];
  showTooltip?: boolean;
  showGrid?: boolean;
  showDate?: boolean;
  momentumColors?: boolean;
  momentumMode?: MomentumMode;
  pctWindow?: number;
  visible?: boolean[];
}) {
  const PAD = 14;
  const { N, sx, sy, innerH, innerW } = useSparkScale(series, width, height, PAD);
  const vis = visible && visible.length === series.lines.length ? visible : series.lines.map(() => true);

  const pathFor = (data: (number | null)[]) => {
    let d = '';
    for (let i = 0; i < N; i++) {
      const v = data[i];
      if (v == null || !isFinite(v)) continue;
      const x = sx(i),
        y = sy(v);
      d += d ? ` L ${x} ${y}` : `M ${x} ${y}`;
    }
    return d;
  };

  function segColor(up: boolean) {
    if (momentumMode === 'inverted') return up ? '#ef4444' : '#10b981'; // VIX: rising red, falling green
    return up ? '#10b981' : '#ef4444'; // indices/metals: rising green, falling red
  }

  function SegmentedLine({ data }: { data: (number | null)[] }) {
    const segs: JSX.Element[] = [];
    let prevX: number | null = null,
      prevY: number | null = null,
      prevV: number | null = null;

    for (let i = 0; i < N; i++) {
      const v = data[i];
      if (v == null || !isFinite(v)) {
        prevX = prevY = prevV = null;
        continue;
      }
      const x = sx(i),
        y = sy(v);

      if (prevX != null && prevY != null && prevV != null) {
        const up = v >= prevV;
        segs.push(<line key={`seg-${i}`} x1={prevX} y1={prevY} x2={x} y2={y} stroke={segColor(up)} strokeWidth={2} />);
      }
      prevX = x;
      prevY = y;
      prevV = v;
    }
    return <>{segs}</>;
  }

  // Stable IDs for clip/grid (avoid SSR/client mismatch)
  const uid = useId().replace(/[:]/g, '');
  const clipId = `plotClip_${uid}`;
  const gridId = `gridPath_${uid}`;

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hover, setHover] = useState<{ i: number; x: number; y: number; values: number[] } | null>(null);

  function onMove(e: React.MouseEvent<SVGSVGElement, MouseEvent>) {
    if (!showTooltip) return;
    const rect = svgRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const frac = Math.min(1, Math.max(0, (x - PAD) / innerW));
    const i = Math.round(frac * (N - 1));

    const values = series.lines.map((l) => {
      const v = l.data[i];
      return v == null || !isFinite(v) ? NaN : Number(v);
    });

    // Tooltip y follows first visible series, else center
    let y = PAD + innerH / 2;
    for (let k = 0; k < series.lines.length; k++) {
      if (!vis[k]) continue;
      const v = values[k];
      if (!isNaN(v)) {
        y = sy(v);
        break;
      }
    }

    setHover({ i, x: sx(i), y, values });
  }

  function pctChangeAt(i: number, window: number) {
    if (i - window < 0) return NaN;
    const a = series.lines[0]?.data[i];
    const b = series.lines[0]?.data[i - window];
    if (a == null || b == null || !isFinite(a) || !isFinite(b) || b === 0) return NaN;
    return (Number(a) / Number(b) - 1) * 100;
  }

  const mainVisible = vis[0];

  return (
    <svg
      ref={svgRef}
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="sparkline"
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
    >
      <rect x="0" y="0" width={width} height={height} fill="none" stroke="var(--line)" />

      <defs>
        <clipPath id={clipId}>
          {/* inset by 0.5px to prevent stroke bleed */}
          <rect x={PAD + 0.5} y={PAD + 0.5} width={width - 2 * PAD - 1} height={height - 2 * PAD - 1} />
        </clipPath>
        <path id={gridId} d={`M ${PAD} 0 H ${width - PAD}`} stroke="var(--line)" strokeDasharray="4 3" fill="none" />
      </defs>

      {/* Gridlines (clipped) */}
      <g clipPath={`url(#${clipId})`}>
        {[0, 1, 2, 3].map((g) => {
          const gy = PAD + (g + 1) * (innerH / 5);
          return <use key={g} href={`#${gridId}`} transform={`translate(0, ${gy})`} opacity={0.7} />;
        })}
      </g>

      {/* Lines (clipped) */}
      <g clipPath={`url(#${clipId})`}>
        {series.lines[0] && mainVisible && momentumColors ? (
          <SegmentedLine data={series.lines[0].data} />
        ) : (
          series.lines[0] &&
          mainVisible && <path d={pathFor(series.lines[0].data)} fill="none" strokeWidth={2} stroke={colors?.[0] || '#334155'} opacity={0.95} />
        )}
        {series.lines.slice(1).map((l, idx) =>
          vis[idx + 1] ? (
            <path key={l.label} d={pathFor(l.data)} fill="none" strokeWidth={2} stroke={colors?.[idx + 1] || (idx === 0 ? '#0ea5e9' : '#64748b')} opacity={0.9} />
          ) : null
        )}
      </g>

      {/* Tooltip (clipped) */}
      {showTooltip && hover && (
        <g clipPath={`url(#${clipId})`}>
          <line x1={hover.x} x2={hover.x} y1={PAD} y2={height - PAD} stroke="#94a3b8" strokeDasharray="4 3" />
          <circle cx={hover.x} cy={hover.y} r="3.5" fill="#0f172a" stroke="#94a3b8" />
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
              if (!vis[idx + 1]) return;
              const v = hover.values[idx + 1];
              if (!isNaN(v)) labelLines.push(`${l.label}: ${v.toFixed(2)}`);
            });

            const badgeWidth = 180;
            const badgeHeight = labelLines.length * 16 + 8;
            const badgeX = Math.min(width - badgeWidth - 4, Math.max(hover.x + 8, 14));
            const badgeY = Math.max(14 + 4, Math.min(height - 14 - badgeHeight, hover.y - 18));

            return (
              <g transform={`translate(${badgeX}, ${badgeY})`}>
                <rect width={badgeWidth} height={badgeHeight} rx={6} ry={6} fill="#ffffff" stroke="var(--line)" />
                {labelLines.map((txt, i) => (
                  <text key={i} x={8} y={14 + i * 16} fontSize={11} fill="#334155">
                    {txt}
                  </text>
                ))}
              </g>
            );
          })()}
        </g>
      )}
    </svg>
  );
}

function usePersistedVisibility(key: string, initial: boolean[]) {
  const [visible, setVisible] = useState<boolean[]>(initial);
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length === initial.length) {
          setVisible(arr.map(Boolean));
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(visible));
      }
    } catch {}
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
}: {
  storageKey: string;
  title: string;
  series: { t: number[]; lines: { label: string; data: (number | null)[] }[] };
  legendItems: { label: string; swatch?: string }[];
  legendInitial: boolean[];
  showTooltip?: boolean;
  showGrid?: boolean;
  showDate?: boolean;
  momentumColors?: boolean;
  momentumMode?: MomentumMode;
  pctWindow?: number;
}) {
  const [visible, setVisible] = usePersistedVisibility(storageKey, legendInitial);
  const toggle = (idx: number) => setVisible((v) => v.map((b, i) => (i === idx ? !b : b)));

  return (
    <div className="card">
      <h3>{title}</h3>
      <Spark series={series} visible={visible} {...(sparkProps as any)} />
      <Legend items={legendItems} active={visible} onToggle={toggle} />
    </div>
  );
}

/* ===================== Page ===================== */

export default function MarketSentiment() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string>('');
  const [range, setRange] = useState<RangeKey>('1y');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    const interval = defaultIntervalFor(range);
    fetch(`/api/sentiment?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [range]);

  const spxSeries = useMemo(
    () =>
      data?.spxSeries
        ? {
            t: data.spxSeries.t,
            lines: [
              { label: 'Close', data: data.spxSeries.close },
              { label: 'SMA50', data: data.spxSeries.ma50! },
              { label: 'SMA200', data: data.spxSeries.ma200! },
            ],
          }
        : null,
    [data]
  );

  const vixSeries = useMemo(
    () =>
      data?.vixSeries
        ? {
            t: data.vixSeries.t,
            lines: [{ label: 'VIX', data: data.vixSeries.close }],
          }
        : null,
    [data]
  );

  const ndxSeries = useMemo(
    () =>
      data?.ndxSeries
        ? {
            t: data.ndxSeries.t,
            lines: [
              { label: 'Close', data: data.ndxSeries.close },
              { label: 'SMA50', data: data.ndxSeries.ma50! },
              { label: 'SMA200', data: data.ndxSeries.ma200! },
            ],
          }
        : null,
    [data]
  );

  const djiSeries = useMemo(
    () =>
      data?.djiSeries
        ? {
            t: data.djiSeries.t,
            lines: [
              { label: 'Close', data: data.djiSeries.close },
              { label: 'SMA50', data: data.djiSeries.ma50! },
              { label: 'SMA200', data: data.djiSeries.ma200! },
            ],
          }
        : null,
    [data]
  );

  const goldSeries = useMemo(
    () =>
      data?.goldSeries
        ? {
            t: data.goldSeries.t,
            lines: [
              { label: 'Close', data: data.goldSeries.close },
              { label: 'SMA50', data: data.goldSeries.ma50! },
              { label: 'SMA200', data: data.goldSeries.ma200! },
            ],
          }
        : null,
    [data]
  );

  return (
    <>
      <header className="nav">
        <div className="brand">
          <Link href="/">LargeKite<span>Capital</span></Link>
        </div>
      </header>
      
      <main className="section">
      <div className="eyebrow">Market dashboard</div>
      <h1 className="h2">Market Sentiment</h1>

      {/* Range switcher */}
      <div className="tiny" style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
        <span style={{ alignSelf: 'center' }}>Range:</span>
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRange(r.key)}
            aria-pressed={range === r.key}
            disabled={loading && range === r.key}
            style={{
              padding: '4px 10px',
              border: '1px solid var(--line)',
              borderRadius: 999,
              background: range === r.key ? '#fff' : '#f1f5f9',
              cursor: 'pointer',
              opacity: loading && range === r.key ? 0.7 : 1,
            }}
          >
            {r.label}
          </button>
        ))}
        {loading && <span style={{ alignSelf: 'center' }}>Loading…</span>}
      </div>

      {error && <p className="content">Error: {error}</p>}
      {!data && !error && !loading && <p className="content">Loading…</p>}

      {data && (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', marginTop: 16 }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="eyebrow">Overall</div>
            <div style={{ fontSize: 42, fontWeight: 800 }}>{data.status.label}</div>
            <div className="tiny">Heat score: {data.status.heat}/100</div>
            <div className="tiny">As of: {fmtAsOf(data.asOf)}</div>
          </div>

          {spxSeries && (
            <div>
              <ChartWithLegend
                storageKey="ms_vis_spx"
                title={`S&P 500 — ${labelForRange(range)}`}
                series={spxSeries}
                legendItems={[
                  { label: 'Close', swatch: '#10b981/#ef4444' },
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
              <div className="tiny" style={{ marginTop: 6 }}>
                Data: Yahoo Finance
              </div>
            </div>
          )}

          {ndxSeries && (
            <div>
              <ChartWithLegend
                storageKey="ms_vis_ndx"
                title={`NASDAQ — ${labelForRange(range)}`}
                series={ndxSeries}
                legendItems={[
                  { label: 'Close', swatch: '#10b981/#ef4444' },
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
              <div className="tiny" style={{ marginTop: 6 }}>
                Data: Yahoo Finance
              </div>
            </div>
          )}

          {djiSeries && (
            <div>
              <ChartWithLegend
                storageKey="ms_vis_dji"
                title={`Dow 30 — ${labelForRange(range)}`}
                series={djiSeries}
                legendItems={[
                  { label: 'Close', swatch: '#10b981/#ef4444' },
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
              <div className="tiny" style={{ marginTop: 6 }}>
                Data: Yahoo Finance
              </div>
            </div>
          )}

          {goldSeries && (
            <div>
              <ChartWithLegend
                storageKey="ms_vis_gold"
                title={`Gold — ${labelForRange(range)}`}
                series={goldSeries}
                legendItems={[
                  { label: 'Close', swatch: '#10b981/#ef4444' },
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
              <div className="tiny" style={{ marginTop: 6 }}>
                Data: Yahoo Finance
              </div>
            </div>
          )}

          {vixSeries && (
            <div>
              <ChartWithLegend
                storageKey="ms_vis_vix"
                title={`VIX — ${labelForRange(range)}`}
                series={vixSeries}
                legendItems={[{ label: 'VIX (rising = red, falling = green)', swatch: '#ef4444/#10b981' }]}
                legendInitial={[true]}
                showTooltip
                showGrid
                momentumColors
                momentumMode="inverted"
                pctWindow={20}
              />
              <div className="tiny" style={{ marginTop: 6 }}>
                VIX is a fear gauge—rising (red) often signals stress, falling (green) calmer conditions. Data: Yahoo Finance
              </div>
            </div>
          )}

          <div className="card">
            <h3>Method</h3>
            <p className="tiny">Heat = 50 + 2×(S&amp;P 20d % change) − 1.5×max(VIX−18, 0). Hot only when 50d &gt; 200d.</p>
          </div>
        </div>
      )}
      </main>
    </>
  );
}
