// app/lib/types/investment.ts
export type Strategy = 'rental' | 'appreciation' | 'short_term_rental';

export interface InvestmentSearchParams {
  zip: string;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  minBaths?: number;
  propertyTypes?: string[]; // ['single_family', 'condo', ...]
  strategy: Strategy;
  timeHorizonYears: number;
}

export interface RawProperty {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude?: number;
  longitude?: number;

  listPrice: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  yearBuilt?: number;
  hoaMonthly?: number;

  imageUrl?: string;
  externalUrl?: string; // link to listing (Zillow, Realtor, etc.)
}

export interface InvestmentMetrics {
  estimatedRent: number;
  annualExpenses: number;
  annualNOI: number;
  capRate: number;          // NOI / purchase price
  cashOnCash: number;       // annual cash flow / cash invested
  projectedValueYearN: number;
}

export interface ScoredProperty {
  property: RawProperty;
  metrics: InvestmentMetrics;
  score: number; // 0-100
}
