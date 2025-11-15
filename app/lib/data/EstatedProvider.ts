// app/lib/data/EstatedProvider.ts
import { PropertyDataProvider } from './PropertyDataProvider';
import { InvestmentSearchParams, RawProperty } from '../types/investment';

export class EstatedProvider implements PropertyDataProvider {
  constructor(private apiKey: string) {}

  async searchProperties(params: InvestmentSearchParams): Promise<RawProperty[]> {
    const { zip, minPrice, maxPrice } = params;

    const url = new URL('https://api.estated.com/v4/property');
    url.searchParams.set('token', this.apiKey);
    url.searchParams.set('postal_code', zip);
    // You may need pagination and filters depending on provider docs

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`Provider error: ${res.status}`);
    }
    const json = await res.json();

    // Map provider’s response into RawProperty[]
    const properties: RawProperty[] = json.properties
      .filter((p: any) => {
        const price = p.valuation?.value || p.assessment?.improvement?.value;
        if (!price) return false;
        if (minPrice && price < minPrice) return false;
        if (maxPrice && price > maxPrice) return false;
        return true;
      })
      .map((p: any) => ({
        id: p.id,
        address: p.mailing_address?.street || '',
        city: p.mailing_address?.city || '',
        state: p.mailing_address?.state || '',
        zip: p.mailing_address?.zip || zip,
        listPrice: p.valuation?.value,
        beds: p.structure?.beds,
        baths: p.structure?.baths,
        sqft: p.structure?.area,
        yearBuilt: p.structure?.year_built,
        imageUrl: undefined,
        externalUrl: undefined, // if provider gives a listing URL
      }));

    return properties;
  }
}
