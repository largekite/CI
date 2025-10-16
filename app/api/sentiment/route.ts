
import { getSentimentFull, getSentimentCompact } from '@/app/lib/sentiment';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const compact = url.searchParams.get('format') === 'compact';

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
