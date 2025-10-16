import { NextRequest } from 'next/server';
import { getSentimentFull, getSentimentCompact } from '@/app/lib/sentiment';

// Force dynamic so Next doesn't try to statically optimize this route.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const compact = req.nextUrl.searchParams.get('format') === 'compact';

    if (compact) {
      const data = await getSentimentCompact();
      return new Response(JSON.stringify(data), {
        headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=1800' }
      });
    }

    const data = await getSentimentFull();
    return new Response(JSON.stringify(data), {
      headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=1800' }
    });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ ok:false, error: String(e) }), { status: 500 });
  }
}
