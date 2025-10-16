export const BRAND_UI = 'LargeKiteCapitalIntelligence';
export const BRAND_LEGAL = 'LargeKiteCapitalIntelligence LLC';

/** Ensure we only ever show a single trailing " LLC" (guards against accidental string duplication) */
export function asLegalOnce(name: string = BRAND_LEGAL) {
  const base = BRAND_UI;
  return base + ' LLC';
}
