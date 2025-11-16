// app/lib/investment/realtor-provider.ts

import type { RawProperty } from './types';

const API_HOST = 'realtor.p.rapidapi.com';
const API_KEY = process.env.RAPIDAPI_KEY!;

// Shape based on your sample JSON
export interface RealtorSearchHome {
  property_id: string;
  listing_id: string;
  list_price: number;
  description?: {
    beds?: number;
    baths_consolidated?: string;
    sqft?: number;
  };
  location?: {
    address?: {
      line?: string;
      city?: string;
      state?: string;
      state_code?: string;
      postal_code?: string;
      coordinate?: { lat?: number; lon?: number };
    };
  };
  photos?: { href?: string }[];
  primary_photo?: { href?: string };
  href?: string;
}

/** Fetch Realtor listings for a ZIP */
export async function fetchRealtorListingsByZip(
  zip: string
): Promise<RealtorSearchHome[]> {
  const url = `https://realtor.p.rapidapi.com/properties/v3/list`;

  const payload = {
    limit: 50,
    offset: 0,
    postal_code: zip,
    status: ['for_sale'],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': API_HOST,
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();

  return json?.data?.home_search?.results ?? [];
}

/** Map Realtor response → RawProperty */
export function mapRealtorResultToRawProperty(
  r: RealtorSearchHome,
  zipFallback: string
): RawProperty {
  const addr = r.location?.address;

  const images = (r.photos || [])
    .map((p) => p.href)
    .filter((x): x is string => !!x);

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
    yearBuilt: undefined,
    hoaMonthly: undefined,
    imageUrl: primaryPhoto,
    images,
    externalUrl: r.href,
    latitude: addr?.coordinate?.lat,
    longitude: addr?.coordinate?.lon,
  };
}
