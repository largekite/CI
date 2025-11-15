// app/api/sentiment/route.ts
import { NextResponse } from 'next/server';
import { getSentimentFull, defaultIntervalFor } from '@/app/lib/sentiment';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const range = url.searchParams.get('range') || '1y';
    const interval = url.searchParams.get('interval') || defaultIntervalFor(range);
    const data = await getSentimentFull(range, interval);
    return NextResponse.json(data, { headers: { 'cache-control': 'no-store' } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
