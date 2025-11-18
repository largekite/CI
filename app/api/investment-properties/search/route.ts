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

// Simple in-memory cache
const cache = new Map<string, any>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function POST(req: Request) {
  try {
    console.log('🔍 Investment property search started');
    
    const body = await req.json();
    const {
      location,
      minPrice,
      maxPrice,
      minBeds,
      minBaths,
      strategy,
      timeHorizonYears,
    } = body as {
      location: string;
      minPrice?: number;
      maxPrice?: number;
      minBeds?: number;
      minBaths?: number;
      strategy: Strategy;
      timeHorizonYears: number;
    };

    console.log('📋 Search parameters:', { location, minPrice, maxPrice, minBeds, minBaths, strategy, timeHorizonYears });

    if (!location) {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      );
    }

    // Validate ZIP code format
    const zip = location;
    if (!/^\d{5}(-\d{4})?$/.test(location)) {
      return NextResponse.json(
        { error: 'Please enter a valid 5-digit ZIP code (e.g., 63040)' },
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

    // Create cache key for property data (excluding strategy)
    const cacheKey = JSON.stringify({ zip, minPrice, maxPrice, minBeds, minBaths });
    const now = Date.now();
    
    // Check cache first
    let rawProperties;
    const cached = cache.get(cacheKey);
    
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      console.log(`📋 Using cached data for ${zip}`);
      rawProperties = cached.rawProperties;
    } else {
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
        
        // Exclude pending/contingent properties
        const status = l.status?.toLowerCase();
        const flags = l.flags || {};
        const leadType = l.lead_attributes?.lead_type;
        
        // Check multiple indicators for pending/contingent status
        if (status && (
          status.includes('pending') || 
          status.includes('contingent') || 
          status.includes('sold') ||
          status.includes('under_contract') ||
          status.includes('contract') ||
          status === 'off_market'
        )) {
          return false;
        }
        
        // Check flags for pending indicators
        if (flags.is_pending || flags.is_contingent || flags.is_sold) {
          return false;
        }
        
        // Check if lead type indicates unavailable property
        if (leadType && (leadType.includes('pending') || leadType.includes('sold'))) {
          return false;
        }
        
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
      
      rawProperties = filtered.map((r) => mapRealtorResultToRawProperty(r, zip));
      
      // Cache the results
      cache.set(cacheKey, {
        rawProperties,
        timestamp: now
      });
    }
    


    // Score each property
    console.log(`🎯 Scoring ${rawProperties.length} properties with strategy: ${strategy}`);
    const scored: ScoredProperty[] = rawProperties.map((p) =>
      evaluateProperty(p, {
        strategy,
        horizonYears: timeHorizonYears || 5,
        assumptions: DEFAULT_ASSUMPTIONS,
      })
    );

    // Sort by highest score (best investments first)
    scored.sort((a, b) => b.score - a.score);

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
