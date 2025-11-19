export const dynamic='force-dynamic';

export async function GET() {
  console.log('[health] GET /api/health');
  
  const healthCheck = {
    ok: true,
    ts: Date.now(),
    services: {
      reddit: 'unknown'
    }
  };

  // Quick Reddit API health check
  try {
    const response = await fetch('https://www.reddit.com/r/investing/hot.json?limit=1', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LargeKiteCapital/1.0; +https://largekitecapital.com)'
      },
      signal: new AbortController().signal
    });
    
    healthCheck.services.reddit = response.ok ? 'healthy' : 'degraded';
  } catch (error) {
    healthCheck.services.reddit = 'unavailable';
  }

  return new Response(JSON.stringify(healthCheck), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store'
    }
  });
}
