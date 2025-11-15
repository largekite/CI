// app/lib/investment/analyzer.ts
import {
  InvestmentSearchParams,
  RawProperty,
  InvestmentMetrics,
  ScoredProperty,
} from '../types/investment';

export function estimateRent(property: RawProperty): number {
  // Very rough placeholder:
  // rent ~ 0.7% – 0.9% of price/month; start conservative.
  return property.listPrice * 0.0075;
}

export function estimateAnnualExpenses(property: RawProperty, rent: number): number {
  const taxes = property.listPrice * 0.012;  // 1.2% property tax
  const insurance = property.listPrice * 0.004; // 0.4%
  const maintenance = rent * 12 * 0.1; // 10% of rent
  const propertyManagement = rent * 12 * 0.08; // 8%
  const hoa = (property.hoaMonthly || 0) * 12;

  return taxes + insurance + maintenance + propertyManagement + hoa;
}

export function projectValue(
  property: RawProperty,
  timeHorizonYears: number,
  annualGrowthRate = 0.03
): number {
  const v0 = property.listPrice;
  return v0 * Math.pow(1 + annualGrowthRate, timeHorizonYears);
}

export function computeMetrics(
  property: RawProperty,
  params: InvestmentSearchParams
): InvestmentMetrics {
  const rent = estimateRent(property);
  const annualRent = rent * 12;
  const expenses = estimateAnnualExpenses(property, rent);
  const noi = annualRent - expenses;

  const capRate = noi / property.listPrice;

  // Assume 25% down payment, 75% financed
  const cashInvested = property.listPrice * 0.25;
  const mortgagePaymentAnnual = property.listPrice * 0.75 * 0.065; // very rough
  const annualCashFlow = noi - mortgagePaymentAnnual;
  const cashOnCash = annualCashFlow / cashInvested;

  const projectedValueYearN = projectValue(property, params.timeHorizonYears);

  return {
    estimatedRent: rent,
    annualExpenses: expenses,
    annualNOI: noi,
    capRate,
    cashOnCash,
    projectedValueYearN,
  };
}

export function scoreProperty(
  property: RawProperty,
  params: InvestmentSearchParams
): ScoredProperty {
  const metrics = computeMetrics(property, params);

  let score = 0;

  if (params.strategy === 'rental') {
    score =
      0.5 * normalize(metrics.capRate, 0.03, 0.12) +
      0.4 * normalize(metrics.cashOnCash, 0.04, 0.20) +
      0.1 * normalize(metrics.annualNOI, 3000, 15000);
  } else if (params.strategy === 'appreciation') {
    const appreciation = metrics.projectedValueYearN - property.listPrice;
    score =
      0.7 * normalize(appreciation, 20000, 200000) +
      0.3 * normalize(metrics.capRate, 0.03, 0.12);
  } else {
    // short-term rental later — placeholder
    score =
      0.6 * normalize(metrics.cashOnCash, 0.05, 0.30) +
      0.4 * normalize(metrics.capRate, 0.04, 0.15);
  }

  return {
    property,
    metrics,
    score: Math.round(Math.max(0, Math.min(100, score * 100))),
  };
}

// Simple normalization helper
function normalize(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}
