
// app/lib/sentiment.ts
const Y_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart/';

export type SeriesArr = { t:number[]; close:number[]; ma50?:(number|null)[]; ma200?:(number|null)[] };
export type Summary = { last:number; chg5d:number; chg20d:number; chg60d:number; ma50?:number|null; ma200?:number|null; ma50Arr?:(number|null)[]; ma200Arr?:(number|null)[] };
export type Status = { heat:number; label:'Hot'|'Neutral'|'Cool'; trendUp:boolean; trendDown:boolean };
export type Event = { t:number; type:'bull'|'bear' };
export type FullPayload = {
  ok: true;
  asOf: number;
  status: Status;
  spx: Summary;
  vix: Summary;
  spxSeries: SeriesArr;
  vixSeries: SeriesArr;
  crossovers: Event[];
};

export type Compact = {
  asOf: number;
  label: 'Hot'|'Neutral'|'Cool';
  heat: number;
  trendUp: boolean;
  spx: { last:number; chg20d:number };
  vix: { last:number; chg20d:number };
};

export async function fetchYahoo(symbol: string, range='1y', interval='1d') {
  const url = `${Y_BASE}${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error('Yahoo fetch failed: ' + res.status);
  const j = await res.json();
  const r = j?.chart?.result?.[0];
  const closes: number[] = r?.indicators?.quote?.[0]?.close || [];
  const t: number[] = (r?.timestamp || []).map((x: number)=> x * 1000);
  return { closes, t };
}

export function smaArr(series: number[], window: number): (number|null)[] {
  const out: (number|null)[] = new Array(series.length).fill(null);
  let sum = 0, count = 0;
  for (let i = 0; i < series.length; i++) {
    const v = series[i];
    if (isFinite(v)) { sum += v; count += 1; }
    if (i >= window) {
      const old = series[i - window];
      if (isFinite(old)) { sum -= old; count -= 1; }
    }
    if (i >= window - 1 && count === window) out[i] = sum / window;
  }
  return out;
}

export function pct(a: number, b: number) {
  if (!a || !b || !isFinite(a) || !isFinite(b) || b === 0) return 0;
  return (a / b - 1) * 100;
}

export function summarize(closes: number[], periods=20): Summary {
  const n = closes.length;
  const last = closes[n-1];
  const p20 = n>periods ? closes[n-1-periods] : closes[0];
  const p5 = n>5 ? closes[n-1-5] : closes[0];
  const p60 = n>60 ? closes[n-1-60] : closes[0];
  const ma50 = smaArr(closes, 50);
  const ma200 = smaArr(closes, 200);
  const lastMa50 = ma50[ma50.length-1];
  const lastMa200 = ma200[ma200.length-1];
  return {
    last, chg5d: pct(last, p5), chg20d: pct(last, p20), chg60d: pct(last, p60),
    ma50: lastMa50, ma200: lastMa200, ma50Arr: ma50, ma200Arr: ma200
  };
}

export function computeCrossovers(t: number[], ma50Arr: (number|null)[], ma200Arr: (number|null)[]): Event[] {
  const events: Event[] = [];
  let prevDiff: number | null = null;
  for (let i=0;i<t.length;i++){
    const a = ma50Arr[i], b = ma200Arr[i];
    if (a==null || b==null) continue;
    const diff = a - b;
    if (prevDiff != null) {
      if (prevDiff <= 0 && diff > 0) events.push({ t: t[i], type: 'bull' });
      else if (prevDiff >= 0 && diff < 0) events.push({ t: t[i], type: 'bear' });
    }
    prevDiff = diff;
  }
  return events;
}

export function computeHeat(spx: Summary, vix: Summary): Status {
  let heat = 50;
  heat += (spx.chg20d || 0) * 2;
  heat -= Math.max(0, (vix.last || 0) - 18) * 1.5;
  heat = Math.max(0, Math.min(100, heat));
  let label: 'Hot'|'Neutral'|'Cool' = 'Neutral';
  if (heat >= 60) label = 'Hot';
  else if (heat <= 40) label = 'Cool';
  const trendUp = !!(spx.ma50 != null && spx.ma200 != null && spx.ma50 > spx.ma200);
  const trendDown = !!(spx.ma50 != null && spx.ma200 != null && spx.ma50 < spx.ma200);
  if (label === 'Hot' && !trendUp) {
    label = 'Neutral';
    heat = Math.min(59, heat);
  }
  return { heat: Math.round(heat), label, trendUp, trendDown };
}

export async function getSentimentFull(): Promise<FullPayload> {
  const [spxRaw, vixRaw] = await Promise.all([ fetchYahoo('^GSPC', '1y', '1d'), fetchYahoo('^VIX', '1y', '1d') ]);
  const spxSum = summarize(spxRaw.closes, 20);
  const vixSum = summarize(vixRaw.closes, 20);
  const status = computeHeat(spxSum, vixSum);
  const crossovers = computeCrossovers(spxRaw.t, spxSum.ma50Arr!, spxSum.ma200Arr!);
  return {
    ok: true,
    asOf: Date.now(),
    status,
    spx: spxSum,
    vix: vixSum,
    spxSeries: { t: spxRaw.t, close: spxRaw.closes, ma50: spxSum.ma50Arr!, ma200: spxSum.ma200Arr! },
    vixSeries: { t: vixRaw.t, close: vixRaw.closes },
    crossovers
  };
}

export async function getSentimentCompact(): Promise<Compact> {
  const full = await getSentimentFull();
  return {
    asOf: full.asOf,
    label: full.status.label,
    heat: full.status.heat,
    trendUp: full.status.trendUp,
    spx: { last: full.spx.last, chg20d: full.spx.chg20d },
    vix: { last: full.vix.last, chg20d: full.vix.chg20d }
  };
}
