// Simple test script to verify Reddit API functionality
const testRedditAPI = async () => {
  try {
    console.log('Testing Reddit API...');
    
    const response = await fetch('http://localhost:3000/api/reddit-finance?subreddit=investing&limit=5');
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API working!');
      console.log(`Found ${data.posts.length} posts`);
      console.log(`Sentiment: ${JSON.stringify(data.sentimentDistribution)}`);
      if (data.metadata.note) {
        console.log(`⚠️  ${data.metadata.note}`);
      }
    } else {
      console.log('❌ API failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
};

testRedditAPI();