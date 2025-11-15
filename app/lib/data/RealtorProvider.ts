// app/lib/data/RealtorProvider.ts
import { PropertyDataProvider } from './PropertyDataProvider';
import { InvestmentSearchParams, RawProperty } from '../types/investment';

interface RealtorProperty {
  property_id: string;
  listing_id: string;
  price?: number;
  list_price?: number;
  beds?: number;
  baths?: number;
  year_built?: number;
  building_size?: { size?: number; units?: string };
  address?: {
    line?: string;
    city?: string;
    state_code?: string;
    postal_code?: string;
  };
  hoa_fee?: number;
  hoa_fee_total?: number;
  photos?: { href?: string }[];
  rdc_web_url?: string;
}

interface RealtorResponse {
  properties?: RealtorProperty[];
}

export class RealtorProvider implements PropertyDataProvider {
  constructor(
    private apiKey: string,
    private host: string = 'realtor.p.rapidapi.com'
  ) {}

  async searchProperties(params: InvestmentSearchParams): Promise<RawProperty[]> {
    const url = new URL(
      'https://realtor.p.rapidapi.com/properties/v2/list-for-sale'
    );

    url.searchParams.set('postal_code', params.zip);
    url.searchParams.set('sort', 'relevance');
    url.searchParams.set('offset', '0');
    url.searchParams.set('limit', '50');

    if (params.minPrice) url.searchParams.set('price_min', String(params.minPrice));
    if (params.maxPrice) url.searchParams.set('price_max', String(params.maxPrice));
    if (params.minBeds) url.searchParams.set('beds_min', String(params.minBeds));
    if (params.minBaths) url.searchParams.set('baths_min', String(params.minBaths));

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-key': this.apiKey,
        'x-rapidapi-host': this.host,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Realtor API error', res.status, await res.text());
      throw new Error(`Realtor API error: ${res.status}`);
    }

    const data = (await res.json()) as RealtorResponse;

    const properties = (data.properties || [])
      .map<RawProperty | null>((p) => {
        const price = p.price ?? p.list_price;
        if (!price) return null;

        const addr = p.address || {};

        const images =
          (p.photos || [])
            .map((ph) => ph.href)
            .filter((href): href is string => !!href)
            .slice(0, 6) || [];

        const primaryPhoto = images[0];

        const hoa =
          p.hoa_fee_total ??
          p.hoa_fee ??
          undefined;

        return {
          id: p.listing_id || p.property_id,
          address: addr.line || 'Unknown address',
          city: addr.city || '',
          state: addr.state_code || '',
          zip: addr.postal_code || params.zip,
          latitude: undefined,
          longitude: undefined,

          listPrice: price,
          beds: p.beds,
          baths: p.baths,
          sqft: p.building_size?.size,
          yearBuilt: p.year_built,
          hoaMonthly: hoa ? Number(hoa) : undefined,

          imageUrl: primaryPhoto,
          images, // 🔥 NEW: full array for carousel/strip
          externalUrl: p.rdc_web_url,
        };
      })
      .filter((p): p is RawProperty => p !== null);

    return properties;
  }
}
