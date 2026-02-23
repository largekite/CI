// app/lib/investment/types.ts

export type Strategy = 'rental' | 'appreciation' | 'short_term_rental';

export interface InvestmentAssumptions {
  /** Annual property tax as % of property value (e.g. 1.2% = 0.012) */
  taxRate: number;
  /** Annual insurance as % of property value (e.g. 0.4% = 0.004) */
  insuranceRate: number;
  /** Annual maintenance as % of gross rent (e.g. 10% = 0.10) */
  maintenanceRate: number;
  /** Annual management as % of gross rent (e.g. 8% = 0.08) */
  managementRate: number;
  /** Vacancy as % of gross rent (e.g. 5% = 0.05) */
  vacancyRate: number;
  /** Interest rate on mortgage (e.g. 6.5% = 0.065) */
  loanRate: number;
  /** Down payment as % of purchase price (e.g. 25% = 0.25) */
  downPayment: number;
}

/**
 * Raw property info coming directly from Realtor / RapidAPI
 * (after mapping the external JSON into this structure).
 */
export interface RawProperty {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  listPrice: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  yearBuilt?: number;
  hoaMonthly?: number;
  imageUrl?: string;
  images?: string[];
  externalUrl?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Derived investment metrics based on assumptions.
 */
export interface InvestmentMetrics {
  /** Estimated market rent / month */
  estimatedRent: number;
  /** Total annual operating expenses (tax, insurance, HOA, maint, management, vacancy) */
  annualExpenses: number;
  /** Net Operating Income = Rent(annual) - Expenses */
  annualNOI: number;
  /** NOI / Purchase Price */
  capRate: number;
  /** Cash-on-cash return (approx, based on down payment and annual cash flow) */
  cashOnCash: number;
  /** Projected property value at the end of horizon */
  projectedValueYearN: number;
}

/**
 * Context for scoring a property given a user’s strategy & horizon.
 */
export interface ScoringContext {
  strategy: Strategy;
  horizonYears: number;
  assumptions: InvestmentAssumptions;
}

/**
 * Main object used by the UI & API.
 */
export interface ScoredProperty {
  property: RawProperty;
  metrics: InvestmentMetrics;
  /** 0–100 overall score, higher is better */
  score: number;
}

/**
 * A single bullet point with a headline claim and supporting evidence.
 */
export interface AnalysisBulletPoint {
  point: string;    // e.g. "Strong population growth"
  evidence: string; // e.g. "Population grew 8.2% since 2020, above the national avg of 3.1%"
}

/**
 * Area-level market analysis for a city/ZIP.
 * Fetched once automatically after a search, shared across all property cards.
 * Returned by /api/investment-properties/market
 */
export interface AreaAnalysis {
  marketData: {
    populationTrend: string;         // e.g. "Growing 1.8%/yr, above national avg"
    jobMarket: string;               // e.g. "3.9% unemployment; Boeing, Amazon are top employers"
    medianIncome: string;            // e.g. "$72,400 median HH income, +4.2% YoY"
    rentTrend: string;               // e.g. "Median rent $1,850/mo, +5.1% YoY"
    homeValueTrend: string;          // e.g. "Median home $385K, +6.2% YoY, low inventory"
    vacancyRate: string;             // e.g. "4.2% rental vacancy — tight market"
    developmentActivity: string;     // e.g. "$2.1B mixed-use project approved 2024"
  };
  neighborhoodInsights: string[];    // 3–5 ZIP / neighborhood-specific facts
  areaOutlook: string;               // 2–3 sentence macro outlook for the next 5 years
  dataSource: 'live_search';
  generatedAt: string;
}

/**
 * Property-specific investment analysis.
 * Fetched on-demand when user clicks "AI Analysis" on a card.
 * Returned by /api/investment-properties/analyze
 * The prompt is given the AreaAnalysis as context so it focuses on property-level comparisons.
 */
export interface PropertyAnalysis {
  verdict: 'strong_buy' | 'buy' | 'hold' | 'pass';
  confidenceScore: number;           // 0–100
  summary: string;                   // 2–3 sentence property-specific executive summary
  bullCase: AnalysisBulletPoint[];   // 3–5 property-specific investment strengths
  bearCase: AnalysisBulletPoint[];   // 2–4 property-specific risks or concerns
  propertyHighlights: string[];      // 2–4 standout traits of THIS property vs. the market
  fiveYearOutlook: string;           // Property-level 5-year investment thesis
  dataSource: 'live_search';
  generatedAt: string;
}
