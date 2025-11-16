// app/api/investment-properties/search/route.ts

import { NextResponse } from 'next/server';
import {
  RawProperty,
  ScoredProperty,
  Strategy,
} from '@/app/lib/investment/types';
import {
  evaluateProperty,
  DEFAULT_ASSUMPTIONS,
} from '@/app/lib/investment/scoring';
import {
  fetchRealtorListingsByZip,
  mapRealtorResultToRawProperty,
} from '@/app/lib/investment/realtor-provider';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      zip,
      minPrice,
      maxPrice,
      minBeds,
      minBaths,
      strategy,
      timeHorizonYears,
    } = body as {
      zip: string;
      minPrice?: number;
      maxPrice?: number;
      minBeds?: number;
      minBaths?: number;
      strategy: Strategy;
      timeHorizonYears: number;
    };

    if (!zip) {
      return NextResponse.json(
        { error: 'ZIP code is required' },
        { status: 400 }
      );
    }

    // 1) Fetch from RapidAPI (Realtor Search)
    const realtorResults = await fetchRealtorListingsByZip(zip);

    // 2) Filter in-code based on inputs
    const filtered = realtorResults.filter((l) => {
      const price = l.list_price ?? 0;
      const beds = l.description?.beds ?? 0;
      const baths = Number(l.description?.baths_consolidated ?? 0);

      if (minPrice && price < minPrice) return false;
      if (maxPrice && price > maxPrice) return false;
      if (minBeds && beds < minBeds) return false;
      if (minBaths && baths < minBaths) return false;

      return true;
    });

    // 3) Map Realtor → RawProperty
    const rawProperties: RawProperty[] = filtered.map((r) =>
      mapRealtorResultToRawProperty(r, zip)
    );

    // 4) Score each property
    const scored: ScoredProperty[] = rawProperties.map((p) =>
      evaluateProperty(p, {
        strategy,
        horizonYears: timeHorizonYears || 5,
        assumptions: DEFAULT_ASSUMPTIONS,
      })
    );

    return NextResponse.json({ results: scored });
  } catch (err: any) {
    console.error('Investment property search error:', err);
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}
