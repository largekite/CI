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
import { getMockProperties } from '@/app/lib/investment/mock-data';

export async function POST(req: Request) {
  try {
    console.log('🔍 Investment property search started');
    
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

    console.log('📋 Search parameters:', { zip, minPrice, maxPrice, minBeds, minBaths, strategy, timeHorizonYears });

    if (!zip) {
      return NextResponse.json(
        { error: 'ZIP code is required' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.RAPIDAPI_KEY || process.env.RAPIDAPI_KEY === 'your_rapidapi_key_here') {
      console.error('❌ RAPIDAPI_KEY not configured');
      return NextResponse.json(
        { 
          error: 'API key not configured. Please set RAPIDAPI_KEY in .env.local',
          details: 'Sign up at https://rapidapi.com/apidojo/api/realtor-search/ to get your API key'
        },
        { status: 500 }
      );
    }

    // 1) Fetch from RapidAPI (Realtor Search)
    console.log(`🏠 Fetching properties for ZIP: ${zip}`);
    const realtorResults = await fetchRealtorListingsByZip(zip);
    console.log(`📊 Found ${realtorResults.length} raw properties from API`);
    
    const filtered = realtorResults.filter((l) => {
      const price = l.list_price ?? 0;
      const rawBeds = l.description?.beds;
      const rawBaths = l.description?.baths_consolidated;
      const beds = typeof rawBeds === 'number' ? rawBeds : rawBeds != null ? Number(rawBeds) : undefined;
      const baths = typeof rawBaths === 'string' || typeof rawBaths === 'number' ? Number(rawBaths) : undefined;
      
      // Filter by ZIP if provided (flexible matching)
      const propertyZip = l.location?.address?.postal_code;
      if (zip && propertyZip && zip.length >= 3) {
        const zipPrefix = zip.substring(0, 3);
        if (!propertyZip.startsWith(zipPrefix)) {
          return false;
        }
      }
      
      // Price filters
      if (minPrice && price < minPrice) return false;
      if (maxPrice && price > maxPrice) return false;
      
      // Bed/bath filters
      if (minBeds && beds != null && beds < minBeds) return false;
      if (minBaths && baths != null && baths < minBaths) return false;
      
      return true;
    });
    
    const rawProperties = filtered.map((r) => mapRealtorResultToRawProperty(r, zip));

    // Score each property
    console.log(`🎯 Scoring ${rawProperties.length} properties with strategy: ${strategy}`);
    const scored: ScoredProperty[] = rawProperties.map((p) =>
      evaluateProperty(p, {
        strategy,
        horizonYears: timeHorizonYears || 5,
        assumptions: DEFAULT_ASSUMPTIONS,
      })
    );

    console.log(`✅ Successfully scored ${scored.length} properties`);
    return NextResponse.json({ results: scored });
  } catch (err: any) {
    console.error('❌ Investment property search error:', err);
    
    // Provide more specific error messages
    let errorMessage = 'Server error';
    let statusCode = 500;
    
    if (err.message?.includes('RAPIDAPI_KEY')) {
      errorMessage = 'API key configuration error';
      statusCode = 500;
    } else if (err.message?.includes('Realtor Search API error')) {
      errorMessage = 'External API error: ' + err.message;
      statusCode = 502;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: err.message,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  }
}
