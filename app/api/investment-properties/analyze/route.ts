// app/api/investment-properties/analyze/route.ts

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
  RawProperty,
  InvestmentMetrics,
  Strategy,
  AreaAnalysis,
  PropertyAnalysis,
} from '@/app/lib/investment/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { property, metrics, score, strategy, areaContext } = body as {
      property: RawProperty;
      metrics: InvestmentMetrics;
      score: number;
      strategy: Strategy;
      areaContext?: AreaAnalysis;
    };

    if (!property || !metrics) {
      return NextResponse.json(
        { error: 'Property and metrics are required' },
        { status: 400 }
      );
    }

    if (!process.env.PERPLEXITY_API_KEY) {
      return NextResponse.json(
        {
          error: 'PERPLEXITY_API_KEY is not configured.',
          details: 'Add PERPLEXITY_API_KEY to your .env.local file. Get a key at perplexity.ai/settings/api',
        },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: 'https://api.perplexity.ai',
    });

    const pricePerSqft =
      property.sqft && property.listPrice
        ? Math.round(property.listPrice / property.sqft)
        : null;

    const strategyLabel =
      strategy === 'rental'
        ? 'Buy & Hold Rental'
        : strategy === 'appreciation'
        ? 'Appreciation / Long-Term Hold'
        : 'Short-Term Rental (Airbnb / VRBO)';

    const systemPrompt = `You are an expert real estate investment analyst. Your task is to evaluate a SPECIFIC property against its local market and deliver a focused, evidence-backed property-level investment verdict. Be precise — use actual numbers, compare to market benchmarks, and highlight what makes this property stand out or fall short.

You MUST respond ONLY with valid JSON matching the exact schema provided. No markdown, no commentary, no preamble — pure JSON only.`;

    // Serialize area context if available so the model can reference it
    const areaContextBlock = areaContext
      ? `
=== AREA MARKET CONTEXT (already researched) ===
Population Trend: ${areaContext.marketData.populationTrend}
Job Market: ${areaContext.marketData.jobMarket}
Median Income: ${areaContext.marketData.medianIncome}
Home Value Trend: ${areaContext.marketData.homeValueTrend}
Rent Trend: ${areaContext.marketData.rentTrend}
Vacancy Rate: ${areaContext.marketData.vacancyRate}
Development Activity: ${areaContext.marketData.developmentActivity}
Neighborhood Insights: ${areaContext.neighborhoodInsights.join(' | ')}
Area Outlook: ${areaContext.areaOutlook}
`
      : `(No area context provided — use your knowledge of ${property.city}, ${property.state} to fill in comparisons.)`;

    const userPrompt = `Evaluate this specific investment property and return a property-level analysis.
${areaContextBlock}
=== THIS PROPERTY ===
Address: ${property.address}, ${property.city}, ${property.state} ${property.zip}
List Price: $${property.listPrice.toLocaleString()}
Bedrooms: ${property.beds ?? 'N/A'} | Bathrooms: ${property.baths ?? 'N/A'}
Square Footage: ${property.sqft ? property.sqft.toLocaleString() + ' sqft' : 'N/A'}
Year Built: ${property.yearBuilt ?? 'N/A'}
Price per Sqft: ${pricePerSqft ? '$' + pricePerSqft : 'N/A'}
HOA (monthly): ${property.hoaMonthly ? '$' + property.hoaMonthly : 'None'}

=== CALCULATED METRICS ===
Investment Strategy: ${strategyLabel}
Estimated Monthly Rent: $${metrics.estimatedRent.toLocaleString()}
Cap Rate: ${(metrics.capRate * 100).toFixed(2)}%
Cash-on-Cash Return: ${(metrics.cashOnCash * 100).toFixed(2)}%
Annual NOI: $${metrics.annualNOI.toLocaleString()}
Annual Expenses: $${metrics.annualExpenses.toLocaleString()}
Projected 5-Year Value: $${metrics.projectedValueYearN.toLocaleString()}
Algorithm Score: ${score}/100

=== PROPERTY-LEVEL ANALYSIS TASKS ===
Answer each of the following using specific numbers and comparisons to the area context above:

1. How does this property's list price compare to the area median price per sqft and recent comps?
2. Is the estimated rent of $${metrics.estimatedRent}/mo realistic vs. actual market rents for similar ${property.beds ?? 3}-bed units? Over or under-estimated?
3. Is the cap rate of ${(metrics.capRate * 100).toFixed(2)}% competitive vs. the local market average for rentals?
4. What does the year built (${property.yearBuilt ?? 'unknown'}) imply for maintenance, insurance, and buyer appeal?
5. Is the HOA (${property.hoaMonthly ? '$' + property.hoaMonthly + '/mo' : 'none'}) a meaningful drag on returns?
6. What are 2–4 standout traits that make THIS property better or worse than a typical listing in this ZIP?
7. What property-specific risks exist beyond the general market risks?
8. Given the market context and property metrics, what is your investment verdict?

=== OUTPUT FORMAT ===
Return STRICT JSON (no extra keys, no markdown):

{
  "verdict": "strong_buy" | "buy" | "hold" | "pass",
  "confidenceScore": <integer 0-100>,
  "summary": "<2–3 sentence executive summary mentioning the address, list price, and the single strongest reason for your verdict>",
  "bullCase": [
    { "point": "<property-specific strength>", "evidence": "<comparison to market — cite numbers: price/sqft vs. area median, cap rate vs. local avg, rent premium, etc.>" },
    ...3 to 5 items
  ],
  "bearCase": [
    { "point": "<property-specific risk>", "evidence": "<quantified: HOA drag %, year-built maintenance risk, rent overestimate, price premium vs. comps, etc.>" },
    ...2 to 4 items
  ],
  "propertyHighlights": [
    "<one-liner standout fact about THIS property vs. the local market>",
    ...2 to 4 items
  ],
  "fiveYearOutlook": "<paragraph: given this property's specific characteristics AND the area macro trends, what is the expected 5-year investment trajectory — projected rent growth, appreciation potential, exit liquidity?>",
  "dataSource": "live_search",
  "generatedAt": "${new Date().toISOString()}"
}

Verdict guidelines:
- "strong_buy": Cap rate ≥ 7% OR CoC ≥ 10%, property clearly undervalued vs. comps, strong upside
- "buy": Cap rate 5–7% OR CoC 6–10%, property holds up well vs. market, positive fundamentals
- "hold": Marginal returns or mixed signals, average vs. comparables
- "pass": Cap rate < 4% AND CoC < 4%, overpriced vs. comps, or major property-specific red flags`;

    const response = await client.chat.completions.create({
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
    });

    const rawContent = response.choices[0]?.message?.content;
    if (!rawContent) {
      throw new Error('Empty response from Perplexity API');
    }

    // Strip markdown code fences if model wrapped the JSON
    const cleaned = rawContent
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let analysis: PropertyAnalysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch {
      // If JSON parse fails, return a best-effort object with raw text
      analysis = {
        verdict: 'hold',
        confidenceScore: 50,
        summary: cleaned.slice(0, 500),
        bullCase: [],
        bearCase: [],
        propertyHighlights: [],
        fiveYearOutlook: 'Analysis data could not be fully structured. Please retry.',
        dataSource: 'live_search',
        generatedAt: new Date().toISOString(),
      };
    }

    // Ensure required fields exist (defensive)
    analysis.dataSource = 'live_search';
    analysis.generatedAt = analysis.generatedAt || new Date().toISOString();

    return NextResponse.json(analysis);
  } catch (err: any) {
    console.error('❌ Property analysis error:', err);

    if (err?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid PERPLEXITY_API_KEY. Check your .env.local file.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: err.message || 'Analysis failed',
        details: err?.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
