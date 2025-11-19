'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Post {
  id: string;
  title: string;
  content: string;
  score: number;
  comments: number;
  created: string;
  url: string;
  author: string;
  subreddit: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

interface RedditData {
  posts: Post[];
  sentimentDistribution: {
    bullish: number;
    bearish: number;
    neutral: number;
  };
  trendingTopics: Array<{ word: string; count: number }>;
  metadata: {
    subreddit: string;
    timeframe: string;
    totalPosts: number;
    fetchedAt: string;
  };
}

const SUBREDDITS = [
  { value: 'investing', label: 'Investing', description: 'General investment discussions' },
  { value: 'stocks', label: 'Stocks', description: 'Stock market analysis' },
  { value: 'SecurityAnalysis', label: 'Security Analysis', description: 'Deep value analysis' },
  { value: 'ValueInvesting', label: 'Value Investing', description: 'Long-term value strategies' },
  { value: 'financialindependence', label: 'Financial Independence', description: 'FIRE community' },
  { value: 'personalfinance', label: 'Personal Finance', description: 'Personal money management' }
];

export default function RedditFinanceSentiment() {
  const [data, setData] = useState<RedditData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [subreddit, setSubreddit] = useState('investing');
  const [timeframe, setTimeframe] = useState('day');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');

  const fetchRedditData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/reddit-finance?subreddit=${subreddit}&timeframe=${timeframe}&limit=50`);
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Failed to fetch data');
      }
      
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRedditData();
  }, []);

  const filteredPosts = data?.posts.filter(post => 
    sentimentFilter === 'all' || post.sentiment === sentimentFilter
  ) || [];

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return '#10b981';
      case 'bearish': return '#ef4444';
      default: return '#64748b';
    }
  };

  const getSentimentBg = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return '#ecfdf5';
      case 'bearish': return '#fef2f2';
      default: return '#f8fafc';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return '📈';
      case 'bearish': return '📉';
      default: return '➖';
    }
  };

  const getOverallSentiment = () => {
    if (!data) return 'neutral';
    const { bullish, bearish } = data.sentimentDistribution;
    if (bullish > bearish + 10) return 'bullish';
    if (bearish > bullish + 10) return 'bearish';
    return 'neutral';
  };

  return (
    <>
      <header className="nav">
        <div className="brand">
          <Link href="/">LargeKite<span>Capital</span></Link>
        </div>
      </header>
      
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '0' }}>
      <div style={{ background: 'rgba(255,255,255,0.95)', minHeight: '100vh' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '48px', paddingBottom: '24px', borderBottom: '2px solid #e2e8f0' }}>
            <div style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '16px',
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              borderRadius: '50px',
              color: 'white',
              fontSize: '24px',
              fontWeight: '600',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
            }}>
              📊 Reddit Finance Sentiment
            </div>
            <p style={{ color: '#475569', fontSize: '18px', margin: 0, fontWeight: '400', letterSpacing: '0.5px' }}>
              Professional sentiment analysis from leading finance communities
            </p>
          </div>

          {/* Controls Panel */}
          <div style={{ 
            background: 'white', 
            padding: '32px', 
            borderRadius: '20px', 
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
            marginBottom: '32px'
          }}>
            <h3 style={{ margin: '0 0 24px 0', color: '#1e293b', fontSize: '20px', fontWeight: '600', letterSpacing: '0.5px' }}>Analysis Configuration</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#374151', fontSize: '15px', letterSpacing: '0.3px' }}>
                  Community
                </label>
                <select
                  value={subreddit}
                  onChange={(e) => setSubreddit(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '15px',
                    background: 'white',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    fontWeight: '500'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                >
                  {SUBREDDITS.map(sub => (
                    <option key={sub.value} value={sub.value}>
                      r/{sub.label} - {sub.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#374151', fontSize: '15px', letterSpacing: '0.3px' }}>
                  Time Period
                </label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '15px',
                    background: 'white',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    fontWeight: '500'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                >
                  <option value="hour">Past Hour</option>
                  <option value="day">Past 24 Hours</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#374151', fontSize: '15px', letterSpacing: '0.3px' }}>
                  Sentiment Filter
                </label>
                <select
                  value={sentimentFilter}
                  onChange={(e) => setSentimentFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '15px',
                    background: 'white',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    fontWeight: '500'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                >
                  <option value="all">All Sentiments</option>
                  <option value="bullish">📈 Bullish Only</option>
                  <option value="bearish">📉 Bearish Only</option>
                  <option value="neutral">➖ Neutral Only</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
              <button
                onClick={fetchRedditData}
                disabled={loading}
                style={{
                  padding: '14px 28px',
                  background: loading ? '#94a3b8' : 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.3s ease',
                  boxShadow: loading ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)',
                  transform: loading ? 'none' : 'translateY(-1px)'
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Analyzing...
                  </>
                ) : (
                  <>
                    🔄 Refresh Analysis
                  </>
                )}
              </button>
              
              {data && (
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                  Last updated: {new Date(data.metadata.fetchedAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '18px 24px',
              borderRadius: '16px',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '15px',
              fontWeight: '500'
            }}>
              ⚠️ {error}
            </div>
          )}

          {data && (
            <>
              {/* Sentiment Overview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                <div style={{
                  background: 'white',
                  padding: '28px',
                  borderRadius: '20px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                  border: '1px solid #f1f5f9'
                }}>
                  <h3 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '18px', fontWeight: '600', letterSpacing: '0.3px' }}>Sentiment Distribution</h3>
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                      <span style={{ color: '#10b981', fontWeight: '600', fontSize: '15px' }}>📈 Bullish</span>
                      <span style={{ fontWeight: '700', fontSize: '16px', color: '#1f2937' }}>{data.sentimentDistribution.bullish}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                      <span style={{ color: '#ef4444', fontWeight: '600', fontSize: '15px' }}>📉 Bearish</span>
                      <span style={{ fontWeight: '700', fontSize: '16px', color: '#1f2937' }}>{data.sentimentDistribution.bearish}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                      <span style={{ color: '#64748b', fontWeight: '600', fontSize: '15px' }}>➖ Neutral</span>
                      <span style={{ fontWeight: '700', fontSize: '16px', color: '#1f2937' }}>{data.sentimentDistribution.neutral}%</span>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'white',
                  padding: '28px',
                  borderRadius: '20px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                  border: '1px solid #f1f5f9'
                }}>
                  <h3 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '18px', fontWeight: '600', letterSpacing: '0.3px' }}>Trending Topics</h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {data.trendingTopics.slice(0, 8).map((topic, index) => (
                      <div key={topic.word} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                        <span style={{ fontSize: '15px', textTransform: 'capitalize', fontWeight: '500', color: '#374151' }}>{topic.word}</span>
                        <span style={{ fontSize: '13px', color: '#6b7280', background: '#f3f4f6', padding: '4px 8px', borderRadius: '6px', fontWeight: '600' }}>
                          {topic.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Posts */}
              <div style={{
                background: 'white',
                padding: '32px',
                borderRadius: '20px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                border: '1px solid #f1f5f9'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                  <h3 style={{ margin: 0, color: '#1f2937', fontSize: '20px', fontWeight: '600', letterSpacing: '0.3px' }}>
                    Posts ({filteredPosts.length} of {data.posts.length})
                  </h3>
                  <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                    Last updated: {new Date(data.metadata.fetchedAt).toLocaleTimeString()}
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '20px' }}>
                  {filteredPosts.map((post) => (
                    <div key={post.id} style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '16px',
                      padding: '20px',
                      borderLeft: `4px solid ${getSentimentColor(post.sentiment)}`,
                      transition: 'all 0.2s ease',
                      background: '#fafbfc'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 10px 0', fontSize: '17px', color: '#1f2937', fontWeight: '600', lineHeight: '1.4' }}>
                            <a href={post.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                              {post.title}
                            </a>
                          </h4>
                          {post.content && (
                            <p style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#6b7280', lineHeight: '1.5' }}>
                              {post.content}
                            </p>
                          )}
                        </div>
                        <div style={{
                          background: getSentimentColor(post.sentiment),
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '600',
                          marginLeft: '16px',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}>
                          {getSentimentIcon(post.sentiment)} {post.sentiment}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                        <div>
                          by u/{post.author} • {new Date(post.created).toLocaleDateString()}
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                          <span>↑ {post.score}</span>
                          <span>💬 {post.comments}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        button:hover:not(:disabled) {
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5) !important;
        }
      `}</style>
      </div>
    </>
  );
}