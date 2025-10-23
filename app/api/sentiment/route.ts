// app/api/sentiment/route.ts
import { NextResponse } from 'next/server';
// import your existing helpers:
import { getSeries, calcStatus } from '@/app/lib/sentiment'; 
// ^ names are placeholders—use the actual names you have

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Existing
    const spx = await getSeries('^GSPC');   // or 'SPX'
    const vix = await getSeries('^VIX');    // or 'VIX'

    // NEW — pick the symbols your fetcher accepts:
    const ndx  = await getSeries('^IXIC');  // NASDAQ Composite (fallback: '^NDX' for NASDAQ-100 if you prefer)
    const dji  = await getSeries('^DJI');   // Dow 30
    const gold = await getSeries('XAUUSD'); // Gold spot; alternatives: 'GC=F' (CME futures) or 'GLD' (ETF)

    const status = calcStatus(spx, vix);

    return NextResponse.json({
      ok: true,
      asOf: Date.now(),
      status,

      // headline stats (optional — if your helper returns {last, chg5d, ...} separately, include them)
      spx: spx.headline, vix: vix.headline,
      ndx: ndx?.headline, dji: dji?.headline, gold: gold?.headline,

      // full series for charts
      spxSeries: spx.series, vixSeries: vix.series,
      ndxSeries: ndx?.series, djiSeries: dji?.series, goldSeries: gold?.series,
    }, { headers: { 'cache-control': 'no-store' } });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:String(e) }, { status:500 });
  }
}
