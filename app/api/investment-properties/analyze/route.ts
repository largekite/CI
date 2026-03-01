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

    const cashflow5yr = (metrics.annualCashFlow ?? 0) * 5;
    const appreciationGain = metrics.projectedValueYearN - property.listPrice;
    const principalPaydown = metrics.principalPaydown ?? 0;
    const totalReturn5yr = cashflow5yr + appreciationGain + principalPaydown;
    const cashInvested = Math.round(property.listPrice * 0.25); // 25% down

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
Annual Cash Flow (after mortgage interest): $${(metrics.annualCashFlow ?? 0).toLocaleString()}/yr
Annual Expenses: $${metrics.annualExpenses.toLocaleString()}
Projected 5-Year Value: $${metrics.projectedValueYearN.toLocaleString()}
5-Year Appreciation Gain: $${appreciationGain.toLocaleString()}
5-Year Cumulative Cash Flow: $${cashflow5yr.toLocaleString()}
5-Year Principal Paydown: $${principalPaydown.toLocaleString()}
5-Year Total Return (all sources): $${totalReturn5yr.toLocaleString()} on $${cashInvested.toLocaleString()} invested
Algorithm Score: ${score}/100

=== PROPERTY-LEVEL ANALYSIS TASKS ===
Answer each using specific numbers and comparisons to the area context above:

1. How does this property's list price compare to the area median price per sqft and recent comps?
2. Is the estimated rent of $${metrics.estimatedRent}/mo realistic vs. actual market rents for similar ${property.beds ?? 3}-bed units? Over or under-estimated?
3. Is the cap rate of ${(metrics.capRate * 100).toFixed(2)}% competitive vs. the local market average for rentals?
4. What does the year built (${property.yearBuilt ?? 'unknown'}) imply for maintenance, insurance, and buyer appeal?
5. Is the HOA (${property.hoaMonthly ? '$' + property.hoaMonthly + '/mo' : 'none'}) a meaningful drag on returns?
6. What are 2–4 standout traits that make THIS property better or worse than a typical listing in this ZIP?
7. What property-specific risks exist beyond the general market risks?
8. Given the market context and property metrics, what is your investment verdict?

=== PSYCHOLOGICAL BIAS CHECKS ===
For each of the four biases below, determine if it is triggered for this specific property and market.

RECENCY BIAS: Has this market had unusual appreciation in the past 2–3 years (e.g., >15% cumulative) that may not continue? If so, are the 5-year projections extrapolating a hot cycle rather than the long-run average? Mark triggered=true if the area's recent appreciation significantly exceeds its 10-year historical average.

LOSS AVERSION: Investors tend to underweight downside scenarios. Compute:
- If vacancy doubles to 10% (from the assumed 5%): what is the new annual cash flow?
- If rent is 10% below our estimate ($${Math.round(metrics.estimatedRent * 0.9)}/mo instead of $${metrics.estimatedRent}/mo): new annual cash flow?
- If mortgage rate rises 1%: what is the approximate reduction in annual cash flow?
Mark triggered=true always — downside scenarios are always relevant.

CONFIRMATION BIAS: Is this a borderline deal where assumptions could easily swing the verdict? If cap rate is within 1% of a verdict threshold OR the rent estimate is critical to whether this is cash-flow positive, mark triggered=true and specify what the investor should independently verify.

MENTAL ACCOUNTING: Investors often evaluate cashflow and appreciation as separate "buckets." Provide a unified 5-year total return statement: starting from $${cashInvested.toLocaleString()} down payment, the total return is $${totalReturn5yr.toLocaleString()} ($${cashflow5yr.toLocaleString()} cash flow + $${appreciationGain.toLocaleString()} appreciation + $${principalPaydown.toLocaleString()} principal paydown). Mark triggered=true if cashflow alone is negative or marginal, because investors who focus only on cashflow may irrationally reject a strong total-return deal.

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
  "fiveYearOutlook": "<paragraph: unified 5-year investment thesis — state the total return of $${totalReturn5yr.toLocaleString()} broken down as cashflow + appreciation + principal paydown, then discuss rent growth, appreciation potential, and exit liquidity for this specific property>",
  "biasChecks": [
    {
      "bias": "recency_bias",
      "triggered": <true|false>,
      "flag": "<one-line headline, e.g. 'Recent market surge may inflate projections'>",
      "note": "<1–2 sentences specific to this property and market — cite the recent vs. long-run appreciation rates if triggered>"
    },
    {
      "bias": "loss_aversion",
      "triggered": true,
      "flag": "Downside scenarios stress-tested",
      "note": "<Summarize the three downside impacts: vacancy at 10%, rent -10%, rate +1% — use actual dollar figures>"
    },
    {
      "bias": "confirmation_bias",
      "triggered": <true|false>,
      "flag": "<e.g. 'Borderline deal — rent estimate is decisive' or 'Verdict is robust across assumption ranges'>",
      "note": "<What specific number should the investor independently verify before committing?>"
    },
    {
      "bias": "mental_accounting",
      "triggered": <true|false>,
      "flag": "<e.g. 'Negative cashflow masks strong total return' or 'All return sources are positive'>",
      "note": "<State the unified 5-year total return and each component explicitly>"
    }
  ],
  "downsideScenario": {
    "vacancyAt10Pct": "<e.g. 'Annual cash flow drops from $X to $Y (-$Z/yr vs. base case)'>",
    "rentDown10Pct": "<e.g. 'At $X/mo rent, annual NOI falls to $Y and cap rate drops to Z%'>",
    "rateUp1Pct": "<e.g. 'A 1% rate increase raises annual mortgage cost by ~$X, reducing cash flow to $Y/yr'>"
  },
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
        biasChecks: [],
        downsideScenario: { vacancyAt10Pct: '', rentDown10Pct: '', rateUp1Pct: '' },
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
