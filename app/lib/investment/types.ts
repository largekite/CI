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
