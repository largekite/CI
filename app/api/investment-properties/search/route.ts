// app/api/investment-properties/search/route.ts
import { NextResponse } from 'next/server';

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
    } = body;

    const listings = await fetchRealtorListingsByZip(zip);

    // (optionally filter further in your own code)
    const filtered = listings.filter((l) => {
      if (minPrice && l.list_price < minPrice) return false;
      if (maxPrice && l.list_price > maxPrice) return false;
      if (minBeds && (l.description?.beds || 0) < minBeds) return false;
      if (minBaths && Number(l.description?.baths_consolidated || 0) < minBaths)
        return false;
      return true;
    });

    const rawProperties = filtered.map((r) => mapRealtorResultToRawProperty(r, zip));

    // here you run your investment metric engine to get ScoredProperty[]
    const scored = rawProperties.map((p) =>
      scoreProperty(p, {
        strategy,
        horizonYears: timeHorizonYears,
      })
    );

    return NextResponse.json({ results: scored });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}
