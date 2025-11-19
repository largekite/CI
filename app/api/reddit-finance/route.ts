import { NextRequest, NextResponse } from 'next/server';

interface RedditPost {
  title: string;
  selftext: string;
  score: number;
  num_comments: number;
  created_utc: number;
  url: string;
  permalink: string;
  author: string;
  subreddit: string;
}

interface RedditResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
  };
}

function analyzeSentiment(text: string): 'bullish' | 'bearish' | 'neutral' {
  const bullishWords = ['buy', 'bull', 'moon', 'rocket', 'gains', 'pump', 'calls', 'long', 'hodl', 'diamond', 'green', 'up', 'rise', 'surge', 'rally'];
  const bearishWords = ['sell', 'bear', 'crash', 'dump', 'puts', 'short', 'red', 'down', 'fall', 'drop', 'decline', 'recession', 'bubble'];
  
  const lowerText = text.toLowerCase();
  const bullishCount = bullishWords.filter(word => lowerText.includes(word)).length;
  const bearishCount = bearishWords.filter(word => lowerText.includes(word)).length;
  
  if (bullishCount > bearishCount) return 'bullish';
  if (bearishCount > bullishCount) return 'bearish';
  return 'neutral';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subreddit = searchParams.get('subreddit') || 'investing';
  const timeframe = searchParams.get('timeframe') || 'day';
  const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100);

  try {

    // Try to fetch from Reddit API with fallback to proxy
    let response: Response;
    let data: RedditResponse;
    
    try {
      // First try direct Reddit API
      const redditUrl = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}&t=${timeframe}`;
      response = await fetch(redditUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LargeKiteCapital/1.0; +https://largekitecapital.com)',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        next: { revalidate: 300 }
      });
      
      if (!response.ok) {
        throw new Error(`Direct API failed: ${response.status}`);
      }
      
      data = await response.json();
    } catch (directError) {
      console.log('Direct Reddit API failed, trying proxy:', directError);
      
      // Fallback to proxy endpoint
      const proxyUrl = `/api/reddit-proxy?subreddit=${subreddit}&timeframe=${timeframe}&limit=${limit}`;
      const baseUrl = request.url.split('/api/')[0];
      
      response = await fetch(`${baseUrl}${proxyUrl}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LargeKiteCapital/1.0; +https://largekitecapital.com)'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Proxy also failed: ${response.status}`);
      }
      
      data = await response.json();
    }

    // Process the fetched data
    
    const posts = data.data.children.map(child => {
      const post = child.data;
      const fullText = `${post.title} ${post.selftext}`;
      const sentiment = analyzeSentiment(fullText);
      
      return {
        id: post.permalink,
        title: post.title,
        content: post.selftext?.substring(0, 200) + (post.selftext?.length > 200 ? '...' : ''),
        score: post.score,
        comments: post.num_comments,
        created: new Date(post.created_utc * 1000).toISOString(),
        url: `https://reddit.com${post.permalink}`,
        author: post.author,
        subreddit: post.subreddit,
        sentiment
      };
    });

    // Calculate sentiment distribution
    const sentimentCounts = posts.reduce((acc, post) => {
      acc[post.sentiment]++;
      return acc;
    }, { bullish: 0, bearish: 0, neutral: 0 });

    const totalPosts = posts.length;
    const sentimentDistribution = {
      bullish: Math.round((sentimentCounts.bullish / totalPosts) * 100),
      bearish: Math.round((sentimentCounts.bearish / totalPosts) * 100),
      neutral: Math.round((sentimentCounts.neutral / totalPosts) * 100)
    };

    // Find trending topics (simple keyword extraction)
    const allText = posts.map(p => `${p.title} ${p.content}`).join(' ').toLowerCase();
    const words: string[] = allText.match(/\b[a-z]{3,}\b/g) || [];
    const wordCounts = words.reduce((acc: Record<string, number>, word: string) => {
      if (!['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word)) {
        acc[word] = (acc[word] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const trendingTopics = Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    return NextResponse.json({
      posts,
      sentimentDistribution,
      trendingTopics,
      metadata: {
        subreddit,
        timeframe,
        totalPosts,
        fetchedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Reddit API error:', error);
    
    // Return fallback data instead of error
    return NextResponse.json({
      posts: getMockRedditData(subreddit),
      sentimentDistribution: { bullish: 35, bearish: 25, neutral: 40 },
      trendingTopics: [
        { word: 'stocks', count: 15 },
        { word: 'market', count: 12 },
        { word: 'investing', count: 10 },
        { word: 'portfolio', count: 8 },
        { word: 'dividend', count: 6 }
      ],
      metadata: {
        subreddit,
        timeframe,
        totalPosts: 10,
        fetchedAt: new Date().toISOString(),
        note: 'Demo data - Reddit API temporarily unavailable'
      }
    });
  }
}

function getMockRedditData(subreddit: string) {
  const mockPosts = [
    {
      id: '/r/investing/comments/mock1',
      title: 'Market outlook for Q4 2024 - bullish on tech stocks',
      content: 'With earnings season approaching, I\'m seeing strong fundamentals in major tech companies...',
      score: 245,
      comments: 67,
      created: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      url: 'https://reddit.com/r/investing/comments/mock1',
      author: 'investor_pro',
      subreddit,
      sentiment: 'bullish' as const
    },
    {
      id: '/r/investing/comments/mock2',
      title: 'Concerns about rising interest rates impact on REITs',
      content: 'The Fed\'s hawkish stance might negatively affect real estate investment trusts...',
      score: 189,
      comments: 43,
      created: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      url: 'https://reddit.com/r/investing/comments/mock2',
      author: 'reit_watcher',
      subreddit,
      sentiment: 'bearish' as const
    },
    {
      id: '/r/investing/comments/mock3',
      title: 'Diversification strategy for volatile markets',
      content: 'Looking for advice on portfolio allocation during uncertain times...',
      score: 156,
      comments: 89,
      created: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      url: 'https://reddit.com/r/investing/comments/mock3',
      author: 'balanced_trader',
      subreddit,
      sentiment: 'neutral' as const
    },
    {
      id: '/r/investing/comments/mock4',
      title: 'Strong earnings from semiconductor sector driving growth',
      content: 'Chip manufacturers are showing impressive quarterly results...',
      score: 298,
      comments: 124,
      created: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      url: 'https://reddit.com/r/investing/comments/mock4',
      author: 'chip_analyst',
      subreddit,
      sentiment: 'bullish' as const
    },
    {
      id: '/r/investing/comments/mock5',
      title: 'Market correction signals - time to be cautious',
      content: 'Several technical indicators suggest we might see a pullback soon...',
      score: 167,
      comments: 78,
      created: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      url: 'https://reddit.com/r/investing/comments/mock5',
      author: 'technical_trader',
      subreddit,
      sentiment: 'bearish' as const
    }
  ];
  
  return mockPosts;
}