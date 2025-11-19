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
  try {
    const { searchParams } = new URL(request.url);
    const subreddit = searchParams.get('subreddit') || 'investing';
    const timeframe = searchParams.get('timeframe') || 'day';
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100);

    const redditUrl = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}&t=${timeframe}`;
    
    const response = await fetch(redditUrl, {
      headers: {
        'User-Agent': 'LargeKiteCapital/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data: RedditResponse = await response.json();
    
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
    const words = allText.match(/\b[a-z]{3,}\b/g) || [];
    const wordCounts = words.reduce((acc: Record<string, number>, word) => {
      if (!['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word)) {
        acc[word] = (acc[word] || 0) + 1;
      }
      return acc;
    }, {});

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
    return NextResponse.json(
      { error: 'Failed to fetch Reddit data' },
      { status: 500 }
    );
  }
}