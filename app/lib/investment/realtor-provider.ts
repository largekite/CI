// app/lib/investment/realtor-provider.ts

import type { RawProperty } from './types';

const API_HOST = 'realty-in-us.p.rapidapi.com';
const API_KEY = process.env.RAPIDAPI_KEY;

// Shape based on the JSON you pasted (data.home_search.results[])
export interface RealtorSearchHome {
  property_id: string;
  listing_id: string;
  status?: string;
  list_price: number;
  description?: {
    sold_date?: string | null;
    baths_consolidated?: string;
    beds?: number;
    lot_sqft?: number;
    sqft?: number;
    stories?: number;
    sold_price?: number | null;
  };
  location?: {
    address?: {
      postal_code?: string;
      state?: string;
      street_name?: string;
      street_number?: string | null;
      city?: string;
      coordinate?: {
        lat?: number;
        lon?: number;
      };
      state_code?: string;
      line?: string;
    };
  };
  photos?: { href?: string }[];
  primary_photo?: { href?: string };
  href?: string;
  permalink?: string;
}

/**
 * Fetch Realtor listings for a ZIP using RapidAPI (realtor-search.p.rapidapi.com)
 * Endpoint: GET /properties/search-buy?location={zip}&status=for_sale&sort=newest&limit=50
 */
export async function fetchRealtorListingsByZip(
  zip: string
): Promise<RealtorSearchHome[]> {
  if (!API_KEY) {
    throw new Error('RAPIDAPI_KEY is not set in environment variables');
  }

  const url = `https://${API_HOST}/properties/v3/list`;
  
  const requestBody = {
    limit: 200,
    offset: 0,
    postal_code: zip,
    status: ['for_sale', 'ready_to_build', 'coming_soon'],
    sort: {
      direction: 'desc',
      field: 'list_date'
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': API_HOST,
    },
    body: JSON.stringify(requestBody),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `Realtor Search API error: ${res.status} ${res.statusText} ${text}`
    );
  }

  const json = await res.json();

  // Check for API errors
  if (!json.status && json.errors?.location) {
    throw new Error(`Location not available: ${zip}. Try a different ZIP code.`);
  }

  const results = json?.data?.home_search?.results ?? [];
  return results as RealtorSearchHome[];
}

/**
 * Map a RealtorSearchHome object → RawProperty used by your scoring engine + UI.
 */
export function mapRealtorResultToRawProperty(
  r: RealtorSearchHome,
  zipFallback: string
): RawProperty {
  const addr = r.location?.address;

  const images = (r.photos || [])
    .map((p) => p.href)
    .filter((href): href is string => !!href);

  const primaryPhoto = r.primary_photo?.href || images[0];

  const baths =
    r.description?.baths_consolidated != null
      ? Number(r.description.baths_consolidated)
      : undefined;

  return {
    id: r.listing_id || r.property_id,
    address: addr?.line || 'Unknown address',
    city: addr?.city || '',
    state: addr?.state_code || addr?.state || '',
    zip: addr?.postal_code || zipFallback,
    listPrice: r.list_price,
    beds: r.description?.beds,
    baths,
    sqft: r.description?.sqft,
    yearBuilt: undefined,          // not provided by this endpoint
    hoaMonthly: undefined,         // not provided by this endpoint
    imageUrl: primaryPhoto,
    images,
    externalUrl: r.href,
    latitude: addr?.coordinate?.lat,
    longitude: addr?.coordinate?.lon,
  };
}
