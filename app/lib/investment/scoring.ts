// app/lib/investment/scoring.ts

import {
  InvestmentAssumptions,
  InvestmentMetrics,
  RawProperty,
  ScoringContext,
  ScoredProperty,
  Strategy,
} from './types';

// Same defaults as your UI state in page.tsx
export const DEFAULT_ASSUMPTIONS: InvestmentAssumptions = {
  taxRate: 0.012,        // 1.2%
  insuranceRate: 0.004,  // 0.4%
  maintenanceRate: 0.10, // 10% of rent
  managementRate: 0.08,  // 8% of rent
  vacancyRate: 0.05,     // 5% of rent
  loanRate: 0.065,       // 6.5%
  downPayment: 0.25,     // 25%
};

/**
 * Very simple rent model: assume monthly rent ~0.8% of price.
 * You can swap this out later with a rent estimate API.
 */
export function estimateRent(property: RawProperty): number {
  if (!property.listPrice || property.listPrice <= 0) return 0;
  const base = property.listPrice * 0.008; // 0.8% rule
  // Slight tweak for bedrooms
  const bedFactor = property.beds && property.beds > 0 ? 1 + (property.beds - 3) * 0.03 : 1;
  return Math.round(base * bedFactor);
}

/**
 * Compute investment metrics given a property, assumptions, and horizon.
 */
export function computeMetrics(
  property: RawProperty,
  assumptions: InvestmentAssumptions,
  horizonYears: number,
  strategy: Strategy     
): InvestmentMetrics {
  const price = property.listPrice || 0;
  const rentMonthly = estimateRent(property);

  const grossRentAnnual = rentMonthly * 12;

  // Property taxes & insurance
  const taxAnnual = price * assumptions.taxRate;
  const insuranceAnnual = price * assumptions.insuranceRate;

  // Operating expenses as % of gross rent
  const maintAnnual = grossRentAnnual * assumptions.maintenanceRate;
  const mgmtAnnual = grossRentAnnual * assumptions.managementRate;
  const vacancyLossAnnual = grossRentAnnual * assumptions.vacancyRate;

  const hoaAnnual = (property.hoaMonthly || 0) * 12;

  const annualExpenses =
    taxAnnual +
    insuranceAnnual +
    maintAnnual +
    mgmtAnnual +
    vacancyLossAnnual +
    hoaAnnual;

  const annualNOI = grossRentAnnual - annualExpenses;

  const capRate = price > 0 ? annualNOI / price : 0;

  // Loan + CoC
  const equity = price * assumptions.downPayment;
  const loanAmount = price - equity;
  const interestAnnual = loanAmount * assumptions.loanRate;

  const preTaxCashFlow = annualNOI - interestAnnual;
  const cashOnCash = equity > 0 ? preTaxCashFlow / equity : 0;

  // Principal paydown over holding period via amortization formula
  // remainingBalance = L * ((1+r)^n - (1+r)^k) / ((1+r)^n - 1)  where r=monthly rate, n=360, k=months paid
  const monthlyRate = assumptions.loanRate / 12;
  const n = 360; // 30-year mortgage
  const principalPaydown = loanAmount > 0 && monthlyRate > 0
    ? (() => {
        const factor = Math.pow(1 + monthlyRate, n);
        const kFactor = Math.pow(1 + monthlyRate, horizonYears * 12);
        const remaining = loanAmount * (factor - kFactor) / (factor - 1);
        return Math.max(0, Math.round(loanAmount - remaining));
      })()
    : 0;

  // Appreciation based on strategy
  const baseAppreciation = strategyBaseAppreciation(capRate, { strategy: 'rental' });
  const strategyAdj = strategyBaseAppreciation(capRate, { strategy: 'appreciation' });

  const usedAppreciation =
    strategy === 'appreciation'
      ? strategyAdj
      : strategy === 'short_term_rental'
      ? baseAppreciation + 0.005
      : baseAppreciation;

  const projectedValueYearN =
    horizonYears > 0 && price > 0
      ? Math.round(price * Math.pow(1 + usedAppreciation, horizonYears))
      : price;

  return {
    estimatedRent: rentMonthly,
    annualExpenses,
    annualNOI,
    capRate,
    cashOnCash,
    projectedValueYearN,
    annualCashFlow: Math.round(preTaxCashFlow),
    principalPaydown,
  };
}

/**
 * Helper to derive a rough appreciation rate from cap rate and strategy.
 * You can tune these weights later.
 */
function strategyBaseAppreciation(
  capRate: number,
  opts: { strategy: Strategy }
): number {
  // Baseline 3% annual appreciation
  let base = 0.03;

  // Very high cap areas usually lower appreciation; smooth clamp
  if (capRate > 0.09) base -= 0.01;
  if (capRate > 0.12) base -= 0.01;

  // Strategy tweak
  if (opts.strategy === 'appreciation') base += 0.01;
  if (opts.strategy === 'short_term_rental') base -= 0.005;

  // Clamp between 1% and 7%
  return Math.min(0.07, Math.max(0.01, base));
}

/**
 * Convert property + context to a ScoredProperty.
 */
export function scoreProperty(
  property: RawProperty,
  ctx: {
    strategy: Strategy;
    horizonYears: number;
    assumptions?: InvestmentAssumptions;
  }
): ScoredProperty {
  const assumptions = ctx.assumptions || DEFAULT_ASSUMPTIONS;

  const metrics = computeMetrics(
    property,
    assumptions,
    ctx.horizonYears,
    ctx.strategy 
  );
  const { capRate, cashOnCash, projectedValueYearN } = metrics;

  // Scoring: combine cap rate, CoC, appreciation into a 0–100 score
  const capScore = normalizePercent(capRate, 0.03, 0.12);       // 3–12%
  const cocScore = normalizePercent(cashOnCash, 0.04, 0.20);    // 4–20%
  const apprScore = normalizePercent(
    projectedValueYearN / (property.listPrice || 1) - 1,
    0.10,
    0.80
  );

  // Different weights by strategy
  let total =
    ctx.strategy === 'rental'
      ? capScore * 0.5 + cocScore * 0.4 + apprScore * 0.1
      : ctx.strategy === 'appreciation'
      ? capScore * 0.2 + cocScore * 0.2 + apprScore * 0.6
      : // short-term rental: value cash flow heavier
        capScore * 0.3 + cocScore * 0.5 + apprScore * 0.2;

  // Penalty for very small / zero rent
  if (metrics.estimatedRent < 500) total *= 0.9;

  const score = Math.round(Math.max(0, Math.min(100, total * 100)));

  return {
    property,
    metrics,
    score,
  };
}

/**
 * Normalize a metric between [0,1] based on a min/max band,
 * with soft clipping.
 */
function normalizePercent(
  value: number,
  min: number,
  max: number
): number {
  if (!isFinite(value)) return 0;
  const clamped = Math.max(min * 0.5, Math.min(max * 1.5, value));
  const span = max - min || 1;
  return Math.max(0, Math.min(1, (clamped - min) / span));
}

/**
 * Convenience function: full pipeline from RawProperty + context → ScoredProperty.
 */
export function evaluateProperty(
  property: RawProperty,
  context: ScoringContext
): ScoredProperty {
  return scoreProperty(property, {
    strategy: context.strategy,
    horizonYears: context.horizonYears,
    assumptions: context.assumptions,
  });
}
