// app/api/investment-properties/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPropertyDataProvider } from '@/app/lib/data';
import { InvestmentSearchParams } from '@/app/lib/types/investment';
import { scoreProperty } from '@/app/lib/investment/analyzer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const params: InvestmentSearchParams = {
      zip: String(body.zip),
      minPrice: body.minPrice ? Number(body.minPrice) : undefined,
      maxPrice: body.maxPrice ? Number(body.maxPrice) : undefined,
      minBeds: body.minBeds ? Number(body.minBeds) : undefined,
      minBaths: body.minBaths ? Number(body.minBaths) : undefined,
      propertyTypes: body.propertyTypes || [],
      strategy: body.strategy || 'rental',
      timeHorizonYears: Number(body.timeHorizonYears || 5),
    };

    if (!/^\d{5}$/.test(params.zip)) {
      return NextResponse.json({ error: 'Invalid ZIP code' }, { status: 400 });
    }

    const provider = getPropertyDataProvider();
    const rawProperties = await provider.searchProperties(params);

    const scored = rawProperties
      .map((p) => scoreProperty(p, params))
      .sort((a, b) => b.score - a.score)
      .slice(0, 50); // cap results

    return NextResponse.json({ results: scored });
  } catch (err: any) {
    console.error('Search error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
