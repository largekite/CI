// app/api/investment-properties/market/route.ts
// Area-level market analysis — called once per search, shared across all property cards.

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { AreaAnalysis } from '@/app/lib/investment/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { city, state, zip, beds } = body as {
      city: string;
      state: string;
      zip: string;
      beds?: number;
    };

    if (!city || !state) {
      return NextResponse.json(
        { error: 'city and state are required' },
        { status: 400 }
      );
    }

    if (!process.env.PERPLEXITY_API_KEY) {
      return NextResponse.json(
        {
          error: 'PERPLEXITY_API_KEY is not configured.',
          details: 'Add PERPLEXITY_API_KEY to your .env.local file.',
        },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: 'https://api.perplexity.ai',
    });

    const systemPrompt = `You are an expert real estate market analyst with deep knowledge of US housing markets, demographics, and economic trends. You have access to current web data.

Research the specified city and return a comprehensive area-level market report. Be specific — cite actual numbers, percentages, recent headlines, and named employers wherever possible.

You MUST respond ONLY with valid JSON matching the exact schema provided. No markdown, no commentary, no preamble — pure JSON only.`;

    const userPrompt = `Research the real estate investment market for: ${city}, ${state} (ZIP: ${zip})

Search the web for current data on each of the following:

1. POPULATION & DEMOGRAPHICS
   - Current metro/city population and recent annual growth rate (compare to US avg ~0.5%/yr)
   - Age demographics, household composition, and net migration trends

2. JOB MARKET & ECONOMY
   - Current unemployment rate (compare to US avg ~3.9%)
   - Top 3–5 named employers and their industry sectors
   - Any recent significant job announcements, new facilities, or layoffs
   - Whether the economy is diversified or single-industry dependent

3. INCOME & AFFORDABILITY
   - Median household income (compare to US avg ~$78K) and year-over-year change
   - Price-to-income ratio for the local housing market
   - Renter affordability trend (are rents rising faster than incomes?)

4. REAL ESTATE MARKET CONDITIONS
   - Current median home sale price and YoY % change
   - Months of available inventory (buyer's market > 6 mo, seller's market < 3 mo)
   - Average days on market trend — is the market speeding up or slowing down?

5. RENTAL MARKET
   - Average monthly rent for a ${beds ?? 3}-bedroom unit in this area and YoY change
   - Rental vacancy rate (compare to US avg ~6.6%)
   - Key demand drivers (universities, military bases, large employers, tourism)

6. DEVELOPMENT & INFRASTRUCTURE
   - Any major under-construction or recently announced projects (commercial, residential, transit)
   - New corporate expansions, retail anchors, or hospital/university investments
   - City or county fiscal health and bond ratings

7. QUALITY OF LIFE & RISK FACTORS
   - GreatSchools or district average rating for ZIP ${zip}
   - Crime rate context vs. national average (violent crime rate per 100K)
   - Natural disaster risk profile (flood zone, tornado alley, wildfire, hurricane)
   - Landlord vs. tenant-friendly legal environment; any rent control

=== OUTPUT FORMAT ===
Return STRICT JSON with this exact schema:

{
  "marketData": {
    "populationTrend": "<city/metro population + annual growth rate + migration context>",
    "jobMarket": "<unemployment rate + named top employers + recent significant news>",
    "medianIncome": "<median HH income + YoY change + comparison to US avg>",
    "rentTrend": "<avg ${beds ?? 3}-bed rent + YoY change + key demand drivers>",
    "homeValueTrend": "<median sale price + YoY change + inventory level + buyer/seller market>",
    "vacancyRate": "<rental vacancy rate + tight/balanced/loose assessment>",
    "developmentActivity": "<named projects, investments, or growth signals with dollar amounts>"
  },
  "neighborhoodInsights": [
    "<specific fact about this ZIP or neighborhood — schools, crime, walkability score, named amenities, flood zone status, etc.>",
    "<second insight>",
    "<third insight>",
    "<fourth insight — optional>",
    "<fifth insight — optional>"
  ],
  "areaOutlook": "<2–3 sentence forward-looking paragraph synthesizing the macro trends for this metro area over the next 5 years — include named growth catalysts and key risks>",
  "dataSource": "live_search",
  "generatedAt": "${new Date().toISOString()}"
}`;

    const response = await client.chat.completions.create({
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
    });

    const rawContent = response.choices[0]?.message?.content;
    if (!rawContent) throw new Error('Empty response from Perplexity API');

    const cleaned = rawContent
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let analysis: AreaAnalysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch {
      analysis = {
        marketData: {
          populationTrend: 'Data unavailable — please retry.',
          jobMarket: 'Data unavailable — please retry.',
          medianIncome: 'Data unavailable — please retry.',
          rentTrend: 'Data unavailable — please retry.',
          homeValueTrend: 'Data unavailable — please retry.',
          vacancyRate: 'Data unavailable — please retry.',
          developmentActivity: 'Data unavailable — please retry.',
        },
        neighborhoodInsights: [],
        areaOutlook: cleaned.slice(0, 400),
        dataSource: 'live_search',
        generatedAt: new Date().toISOString(),
      };
    }

    analysis.dataSource = 'live_search';
    analysis.generatedAt = analysis.generatedAt || new Date().toISOString();

    return NextResponse.json(analysis);
  } catch (err: any) {
    console.error('❌ Area market analysis error:', err);
    if (err?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid PERPLEXITY_API_KEY.' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: err.message || 'Market analysis failed' },
      { status: 500 }
    );
  }
}
