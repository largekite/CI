import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subreddit = searchParams.get('subreddit') || 'investing';
    const timeframe = searchParams.get('timeframe') || 'day';
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100);

    // Try multiple Reddit endpoints
    const endpoints = [
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}&t=${timeframe}`,
      `https://old.reddit.com/r/${subreddit}/hot.json?limit=${limit}&t=${timeframe}`,
      `https://api.reddit.com/r/${subreddit}/hot?limit=${limit}&t=${timeframe}`
    ];

    let lastError: Error | null = null;

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; LargeKiteCapital/1.0; +https://largekitecapital.com)',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site'
          },
          next: { revalidate: 300 }
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data, {
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET',
              'Access-Control-Allow-Headers': 'Content-Type',
              'Cache-Control': 'public, max-age=300'
            }
          });
        }

        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error as Error;
        continue;
      }
    }

    throw lastError || new Error('All Reddit endpoints failed');

  } catch (error) {
    console.error('Reddit proxy error:', error);
    
    return NextResponse.json(
      { 
        error: 'Reddit API temporarily unavailable',
        message: 'Please try again later or contact support if the issue persists'
      },
      { 
        status: 503,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Retry-After': '300'
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}