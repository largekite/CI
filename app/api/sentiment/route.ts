// app/api/sentiment/route.ts
import { NextResponse } from 'next/server';
import { getSeries, calcStatus } from '@/app/lib/sentiment';

export const dynamic = 'force-dynamic';

function defaultIntervalFor(range: string) {
  // reasonable defaults by range
  switch (range) {
    case '1mo': return '1d';
    case '3mo': return '1d';
    case '6mo': return '1d';
    case 'ytd': return '1d';
    case '1y':  return '1d';
    case '2y':  return '1wk';
    case '5y':  return '1wk';
    case '10y': return '1mo';
    case 'max': return '1mo';
    default:    return '1d';
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const range = url.searchParams.get('range') || '1y';
    const interval = url.searchParams.get('interval') || defaultIntervalFor(range);

    const SPX  = '^GSPC';
    const VIX  = '^VIX';
    const NDXC = '^IXIC';   // (NASDQ-100 alternative: '^NDX')
    const DJI  = '^DJI';
    const GOLD = 'GC=F';    // alt: 'XAUUSD=X' or 'GLD'

    const [spx, vix, ndx, dji, gold] = await Promise.all([
      getSeries(SPX,  range, interval),
      getSeries(VIX,  range, interval),
      getSeries(NDXC, range, interval),
      getSeries(DJI,  range, interval),
      getSeries(GOLD, range, interval),
    ]);

    const status = calcStatus(spx, vix);

    return NextResponse.json({
      ok: true,
      asOf: Date.now(),
      status,
      spx: spx.headline, vix: vix.headline,
      ndx: ndx.headline, dji: dji.headline, gold: gold.headline,
      spxSeries: spx.series, vixSeries: vix.series,
      ndxSeries: ndx.series, djiSeries: dji.series, goldSeries: gold.series,
    }, { headers: { 'cache-control': 'no-store' } });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:String(e?.message || e) }, { status:500 });
  }
}
