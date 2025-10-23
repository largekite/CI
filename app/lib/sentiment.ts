// app/lib/sentiment.ts
import { yahooChart } from './yahoo';

export type FullSeries = { t: number[]; close: (number | null)[]; ma50?: (number | null)[]; ma200?: (number | null)[] };
export type SeriesHeadline = { last: number; chg5d: number; chg20d: number; chg60d: number; ma50?: number | null; ma200?: number | null };
export type SeriesBundle = { series: FullSeries; headline: SeriesHeadline };

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
  const chg5d = pctChange(close, i, 5) ?? 0;
  const chg20d = pctChange(close, i, 20) ?? 0;
  const chg60d = pctChange(close, i, 60) ?? 0;
  return { last, chg5d, chg20d, chg60d, ma50: ma50?.[i] ?? null, ma200: ma200?.[i] ?? null };
}

export async function getSeries(symbol: string, range = '1y', interval = '1d'): Promise<SeriesBundle> {
  const { t, close } = await yahooChart(symbol, range, interval);
  const ma50 = sma(close, 50);
  const ma200 = sma(close, 200);
  const series: FullSeries = { t, close, ma50, ma200 };
  const headline = headlineFrom(series);
  return { series, headline };
}

// Same as before
export function calcStatus(spx: SeriesBundle, vix: SeriesBundle) {
  const heat = 50 + 2 * (spx.headline.chg20d ?? 0) - 1.5 * Math.max(((vix.headline.last ?? 0) as number) - 18, 0);
  const label = heat >= 60 ? 'Hot' : heat <= 45 ? 'Cool' : 'Neutral';
  return { heat: Math.round(Math.max(0, Math.min(100, heat))), label };
}
