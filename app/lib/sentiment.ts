// app/lib/sentiment.ts
// Utilities for fetching market series from Yahoo and computing sentiment.

import { yahooChart } from '@/app/lib/yahoo';

/* ======================= Types ======================= */

export type FullSeries = {
  t: number[];                       // timestamps (ms)
  close: (number | null)[];          // closing prices (nullable for gaps)
  ma50?: (number | null)[];
  ma200?: (number | null)[];
};

export type SeriesHeadline = {
  last: number;
  chg5d: number;
  chg20d: number;
  chg60d: number;
  ma50?: number | null;
  ma200?: number | null;
};

export type SeriesBundle = {
  series: FullSeries;
  headline: SeriesHeadline;
};

export type SentimentStatus = {
  heat: number;                      // 0..100 heuristic
  label: 'Hot' | 'Neutral' | 'Cool' | string;
};

export type SentimentFull = {
  ok: boolean;
  asOf: number;
  status: SentimentStatus;

  // Headline stats (optional for top-cards)
  spx: SeriesHeadline;
  vix: SeriesHeadline;
  ndx: SeriesHeadline;
  dji: SeriesHeadline;
  gold: SeriesHeadline;

  // Full series for charts
  spxSeries: FullSeries;
  vixSeries: FullSeries;
  ndxSeries: FullSeries;
  djiSeries: FullSeries;
  goldSeries: FullSeries;
};

export type SentimentCompact = {
  ok: boolean;
  asOf: number;
  status: SentimentStatus;
};

/* ================== Math helpers ================== */

function sma(arr: (number | null)[], win: number): (number | null)[] {
  const out: (number | null)[] = new Array(arr.length).fill(null);
  let sum = 0, cnt = 0;
  const q: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (v != null && Number.isFinite(v)) { q.push(v); sum += v; cnt++; } else { q.push(NaN); }
    if (q.length > win) {
      const removed = q.shift()!;
      if (!Number.isNaN(removed)) { sum -= removed; cnt--; }
    }
    out[i] = cnt === win ? sum / cnt : null;
  }
  return out;
}

function pctChange(arr: (number | null)[], i: number, lag: number): number | null {
  if (i - lag < 0) return null;
  const a = arr[i], b = arr[i - lag];
  if (a == null || b == null || !Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  return (a / b - 1) * 100;
}

function headlineFrom(series: FullSeries): SeriesHeadline {
  const { close, ma50, ma200 } = series;
  const i = close.length - 1;
  const last = close[i] ?? NaN;
  const chg5d  = pctChange(close, i, 5)  ?? 0;
  const chg20d = pctChange(close, i, 20) ?? 0;
  const chg60d = pctChange(close, i, 60) ?? 0;
  return { last, chg5d, chg20d, chg60d, ma50: ma50?.[i] ?? null, ma200: ma200?.[i] ?? null };
}

/* ============== Public series fetcher ============== */

export async function getSeries(symbol: string, range = '1y', interval = '1d'): Promise<SeriesBundle> {
  const { t, close } = await yahooChart(symbol, range, interval);
  const ma50 = sma(close, 50);
  const ma200 = sma(close, 200);
  const series: FullSeries = { t, close, ma50, ma200 };
  const headline = headlineFrom(series);
  return { series, headline };
}

/* ============== Sentiment & defaults ============== */

export function calcStatus(spx: SeriesBundle, vix: SeriesBundle): SentimentStatus {
  // Simple heuristic: momentum warms, high VIX cools
  const heat =
    50 +
    2 * (spx.headline.chg20d ?? 0) -
    1.5 * Math.max(((vix.headline.last ?? 0) as number) - 18, 0);

  const label = heat >= 60 ? 'Hot' : heat <= 45 ? 'Cool' : 'Neutral';
  return { heat: Math.round(Math.max(0, Math.min(100, heat))), label };
}

export function defaultIntervalFor(range: string) {
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

/* ============== Unified builders ============== */

export async function getSentimentFull(range = '1y', interval?: string): Promise<SentimentFull> {
  const intv = interval || defaultIntervalFor(range);

  // Yahoo symbols
  const SPX  = '^GSPC';   // S&P 500
  const VIX  = '^VIX';    // VIX
  const NDXC = '^IXIC';   // NASDAQ Composite (use '^NDX' for NASDAQ-100 if preferred)
  const DJI  = '^DJI';    // Dow 30
  const GOLD = 'GC=F';    // Gold futures (alt: 'XAUUSD=X' or 'GLD')

  const [spx, vix, ndx, dji, gold] = await Promise.all([
    getSeries(SPX,  range, intv),
    getSeries(VIX,  range, intv),
    getSeries(NDXC, range, intv),
    getSeries(DJI,  range, intv),
    getSeries(GOLD, range, intv),
  ]);

  const status = calcStatus(spx, vix);

  return {
    ok: true,
    asOf: Date.now(),
    status,
    spx: spx.headline,
    vix: vix.headline,
    ndx: ndx.headline,
    dji: dji.headline,
    gold: gold.headline,
    spxSeries: spx.series,
    vixSeries: vix.series,
    ndxSeries: ndx.series,
    djiSeries: dji.series,
    goldSeries: gold.series,
  };
}

/** Lightweight helper for components that only need the pill data */
export async function getSentimentCompact(range = '1y', interval?: string): Promise<SentimentCompact> {
  const full = await getSentimentFull(range, interval);
  return { ok: Boolean(full?.ok), asOf: full.asOf, status: full.status };
}
