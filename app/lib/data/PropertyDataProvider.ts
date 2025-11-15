// app/lib/data/PropertyDataProvider.ts
import { InvestmentSearchParams, RawProperty } from '../types/investment';

export interface PropertyDataProvider {
  searchProperties(params: InvestmentSearchParams): Promise<RawProperty[]>;
}
