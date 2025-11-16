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

    // 1. Fetch from RapidAPI Realtor
    const realtorResults = await fetchRealtorListingsByZip(zip);

    // 2. Pre-filter based on user's criteria
    const filtered = realtorResults.filter((l) => {
      if (minPrice && l.list_price < minPrice) return false;
      if (maxPrice && l.list_price > maxPrice) return false;

      const beds = l.description?.beds ?? 0;
      if (minBeds && beds < minBeds) return false;

      const baths = Number(l.description?.baths_consolidated ?? 0);
      if (minBaths && baths < minBaths) return false;

      return true;
    });

    // 3. Convert Realtor API shape → RawProperty
    const rawProperties: RawProperty[] = filtered.map((r) =>
      mapRealtorResultToRawProperty(r, zip)
    );

    // 4. Score properties → ScoredProperty[]
    const scored: ScoredProperty[] = rawProperties.map((p) =>
      evaluateProperty(p, {
        strategy,
        horizonYears: timeHorizonYears || 5,
        assumptions: DEFAULT_ASSUMPTIONS,
      })
    );

    return NextResponse.json({ results: scored });
  } catch (err: any) {
    console.error('Investment search error:', err);
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}
