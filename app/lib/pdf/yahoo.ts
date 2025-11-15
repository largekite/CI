// app/lib/yahoo.ts
import { cache } from 'react';

type YahooChart = {
  chart: {
    result: Array<{
      timestamp: number[];
      indicators: { quote: Array<{ close: (number | null)[] }> };
    }> | null;
    error: any;
  };
};

async function fetchJSON(url: string) {
  const res = await fetch(url, {
    headers: {
      'accept': 'application/json, text/plain, */*',
      'accept-language': 'en-US,en;q=0.9',
      'cache-control': 'no-cache',
      'pragma': 'no-cache',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36',
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Yahoo ${res.status} ${res.statusText}`);
  return res.json();
}

// 1y daily by default; you can pass other ranges/intervals
export const yahooChart = cache(async function (symbol: string, range = '1y', interval = '1d') {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?range=${range}&interval=${interval}&includePrePost=false&events=div,splits`;
  const data = (await fetchJSON(url)) as YahooChart;

  const r = data?.chart?.result?.[0];
  const ts = r?.timestamp || [];
  const close = r?.indicators?.quote?.[0]?.close || [];
  if (!ts.length || !close.length) throw new Error(`No data for ${symbol}`);

  // seconds → ms; coerce to numbers/nulls
  const t = ts.map((s) => s * 1000);
  const c = close.map((v) => (v == null || Number.isNaN(v) ? null : Number(v)));
  return { t, close: c };
});
