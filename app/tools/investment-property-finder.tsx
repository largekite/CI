'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { AreaAnalysis, PropertyAnalysis, ScoredProperty } from '@/app/lib/investment/types';

export default function SimpleInvestmentFinder() {
  const [form, setForm] = useState({
    location: '',
    minPrice: '',
    maxPrice: '',
    strategy: 'rental',
    propertyLink: ''
  });
  const [inputMode, setInputMode] = useState<'property' | 'city'>('city');
  const [propertyInput, setPropertyInput] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const priceRanges = [
    { label: 'Any', min: '', max: '' },
    { label: 'Under $200K', min: '', max: '200000' },
    { label: '$200K - $300K', min: '200000', max: '300000' },
    { label: '$300K - $400K', min: '300000', max: '400000' },
    { label: '$400K - $500K', min: '400000', max: '500000' },
    { label: '$500K - $750K', min: '500000', max: '750000' },
    { label: '$750K - $1M', min: '750000', max: '1000000' },
    { label: 'Over $1M', min: '1000000', max: '' }
  ];

  const handlePropertySearch = async (value: string) => {
    setPropertyInput(value);

    // If it looks like a URL, don't show suggestions
    if (value.startsWith('http')) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    if (value.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?street=${encodeURIComponent(value)}&country=USA&format=json&addressdetails=1&limit=8`, {
          headers: { 'User-Agent': 'LargeKiteCapital/1.0' }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            const suggestions = data.map((item: any) => ({
              display: item.display_name,
              address: item.address,
              lat: item.lat,
              lon: item.lon
            }));
            setAddressSuggestions(suggestions);
            setShowAddressSuggestions(true);
          } else {
            setAddressSuggestions([]);
          }
        }
      } catch (error) {
        console.error('Address search error:', error);
        setAddressSuggestions([]);
      }
    }, 300);

    setSearchTimeout(timeout);
  };

  const selectAddress = async (suggestion: any) => {
    setPropertyInput(suggestion.display);
    setShowAddressSuggestions(false);
    const zip = suggestion.address?.postcode?.split('-')[0] || '';
    if (zip) {
      setForm({...form, location: zip});
    } else {
      try {
        const zipRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${suggestion.lat}&lon=${suggestion.lon}&format=json`, {
          headers: { 'User-Agent': 'LargeKiteCapital/1.0' }
        });
        if (zipRes.ok) {
          const zipData = await zipRes.json();
          const foundZip = zipData.address?.postcode?.split('-')[0] || '';
          if (foundZip) {
            setForm({...form, location: foundZip});
          }
        }
      } catch (error) {
        console.error('Zip lookup error:', error);
      }
    }
  };

  const handleCitySearch = (value) => {
    setCityInput(value);

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // If it's a number, treat as ZIP code
    if (/^\d+$/.test(value)) {
      setForm({...form, location: value});
      setCitySuggestions([]);
      return;
    }

    // City name search with debounce
    if (value.length < 3) {
      setCitySuggestions([]);
      return;
    }

    // Debounce API call
    const timeout = setTimeout(async () => {
      try {
        const searchRes = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(value)}&country=USA&format=json&addressdetails=1&limit=5`, {
          headers: {
            'User-Agent': 'LargeKiteCapital/1.0'
          }
        });
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const suggestions = searchData
            .map(item => {
              const address = item.address || {};
              const city = address.city || address.town || address.village || item.display_name.split(',')[0];
              const county = address.county || '';
              const state = address['ISO3166-2-lvl4']?.split('-')[1] || address.state || '';
              return {
                city,
                county,
                state,
                zip: '',
                lat: item.lat,
                lon: item.lon,
                displayName: county ? `${city}, ${county}, ${state}` : `${city}, ${state}`
              };
            })
            .filter(item => item.state)
            .slice(0, 5);
          setCitySuggestions(suggestions);
          setShowSuggestions(suggestions.length > 0);
        }
      } catch (error) {
        console.error('City search error:', error);
      }
    }, 500);

    setSearchTimeout(timeout);
  };

  const selectCity = async (suggestion) => {
    setCityInput(`${suggestion.city}, ${suggestion.state}`);
    setShowSuggestions(false);
    
    if (suggestion.zip) {
      setForm({...form, location: suggestion.zip});
      return;
    }
    
    try {
      const zipRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${suggestion.lat}&lon=${suggestion.lon}&format=json`, {
        headers: {
          'User-Agent': 'LargeKiteCapital/1.0'
        }
      });
      if (zipRes.ok) {
        const zipData = await zipRes.json();
        const zip = zipData.address?.postcode?.split('-')[0] || '';
        if (zip) {
          setForm({...form, location: zip});
        }
      }
    } catch (error) {
      console.error('Zip lookup error:', error);
    }
  };

  const handlePriceRangeChange = (e) => {
    const range = priceRanges[e.target.value];
    setForm({...form, minPrice: range.min, maxPrice: range.max});
  };
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState(new Set());
  const [sortBy, setSortBy] = useState('score');
  const [minScore, setMinScore] = useState(0);
  const [selectedForComparison, setSelectedForComparison] = useState(new Set());
  const [showComparison, setShowComparison] = useState(false);
  const [mortgageRates, setMortgageRates] = useState({ rate30: 6.5, rate15: 5.8 });
  const [areaAnalysis, setAreaAnalysis] = useState<AreaAnalysis | 'loading' | 'error' | null>(null);
  const [analyses, setAnalyses] = useState<Record<string, PropertyAnalysis | 'loading' | 'error'>>({});

  useEffect(() => {
    // Use static rates since Freddie Mac API has CORS restrictions
    setMortgageRates({ rate30: 6.5, rate15: 5.8 });
  }, []);

  const handleAnalyze = async (item: ScoredProperty) => {
    const id = item.property.id;
    // Toggle off if already loaded
    if (analyses[id] && analyses[id] !== 'loading' && analyses[id] !== 'error') {
      setAnalyses(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }
    setAnalyses(prev => ({ ...prev, [id]: 'loading' }));
    try {
      const res = await fetch('/api/investment-properties/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property: item.property,
          metrics: item.metrics,
          score: item.score,
          strategy: form.strategy,
          areaContext: typeof areaAnalysis === 'object' && areaAnalysis !== null ? areaAnalysis : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setAnalyses(prev => ({ ...prev, [id]: data as PropertyAnalysis }));
    } catch {
      setAnalyses(prev => ({ ...prev, [id]: 'error' }));
    }
  };

  const fetchAreaAnalysis = async (city: string, state: string, zip: string, beds?: number) => {
    setAreaAnalysis('loading');
    try {
      const res = await fetch('/api/investment-properties/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, state, zip, beds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Market analysis failed');
      setAreaAnalysis(data as AreaAnalysis);
    } catch {
      setAreaAnalysis('error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults([]);
    setFilteredResults([]);

    try {
      let zipToUse = form.location;
      let isUrl = false;
      let addressForFilter = propertyInput; // This will be used for filtering

      // Handle property mode (address or URL)
      if (inputMode === 'property' && propertyInput) {
        // Check if it's a URL
        if (propertyInput.startsWith('http')) {
          isUrl = true;

          // Extract address from URL for filtering
          let extractedAddress = '';

          // Parse address from URL path
          // Zillow: /homedetails/123-Main-St-City-State-12345/
          // Redfin: /STATE/City/123-Main-St-12345/
          // Realtor: /realestateandhomes-detail/123-Main-St_City_State_12345

          const urlPath = propertyInput.split('?')[0]; // Remove query params
          const pathParts = urlPath.split('/').filter(p => p.length > 0);

          // Find the part that looks like an address (contains hyphens/underscores and digits)
          for (let part of pathParts) {
            if ((part.includes('-') || part.includes('_')) && /\d/.test(part)) {
              // This might be the address part
              // Convert URL format to readable address
              let fullAddress = part
                .replace(/_/g, ' ')  // Replace underscores with spaces
                .replace(/-/g, ' ')  // Replace hyphens with spaces
                .replace(/\s+/g, ' ') // Normalize spaces
                .trim();

              // Check if this looks like an address (has numbers and letters)
              if (/\d+/.test(fullAddress) && /[a-zA-Z]{2,}/.test(fullAddress)) {
                // Try to extract just the street address without city/state/ZIP
                // Pattern: starts with number, ends before city name or state abbreviation
                const parts = fullAddress.split(' ');

                // Find where the address likely ends (before city or 2-letter state code)
                let addressParts = [];
                for (let i = 0; i < parts.length; i++) {
                  const part = parts[i];

                  // Stop if we hit a 5-digit ZIP code
                  if (/^\d{5}$/.test(part)) {
                    break;
                  }

                  // Stop if we hit a 2-letter state code (likely all caps or title case)
                  if (i > 0 && /^[A-Z]{2}$/i.test(part) && parts[i-1]?.length > 2) {
                    break;
                  }

                  addressParts.push(part);
                }

                extractedAddress = addressParts.join(' ').trim();
                console.log('Extracted address from URL:', extractedAddress);
                addressForFilter = extractedAddress; // Use this for filtering
                break;
              }
            }
          }

          // Try multiple patterns to extract ZIP code from different listing sites
          let zipMatch = null;

          // Pattern 1: ZIP followed by underscore or slash (Zillow, Redfin)
          zipMatch = propertyInput.match(/\/(\d{5})(?:[_\/]|$)/);

          // Pattern 2: ZIP with hyphens or underscores around it (Realtor.com)
          if (!zipMatch) {
            zipMatch = propertyInput.match(/[_-]([A-Z]{2})[_-](\d{5})(?:[_\/-]|$)/);
            if (zipMatch) {
              zipMatch[1] = zipMatch[2]; // Use the ZIP from second capture group
            }
          }

          // Pattern 3: Any 5-digit number in the URL (fallback)
          if (!zipMatch) {
            const allNumbers = propertyInput.match(/\b(\d{5})\b/g);
            if (allNumbers && allNumbers.length > 0) {
              // Take the last 5-digit number (usually the ZIP)
              zipMatch = [null, allNumbers[allNumbers.length - 1]];
            }
          }

          if (zipMatch && zipMatch[1]) {
            zipToUse = zipMatch[1];
            setForm({...form, location: zipToUse});
            console.log('Extracted ZIP from URL:', zipToUse);
          } else {
            throw new Error('Could not extract ZIP code from URL. Please ensure the URL contains the property ZIP code.');
          }
        } else {
          // It's an address
          if (!zipToUse) {
            try {
              const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(propertyInput)}&country=USA&format=json&addressdetails=1&limit=1`, {
                headers: { 'User-Agent': 'LargeKiteCapital/1.0' }
              });
              if (response.ok) {
                const data = await response.json();
                if (data[0]?.address?.postcode) {
                  zipToUse = data[0].address.postcode.split('-')[0];
                  setForm({...form, location: zipToUse});
                }
              }
            } catch (err) {
              console.error('Failed to get ZIP:', err);
            }
          }
        }
      }

      if (!zipToUse) {
        throw new Error('Could not determine location. Please try a different search method.');
      }

      const res = await fetch('/api/investment-properties/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: zipToUse,
          minPrice: inputMode === 'city' ? (form.minPrice ? Number(form.minPrice) : undefined) : undefined,
          maxPrice: inputMode === 'city' ? (form.maxPrice ? Number(form.maxPrice) : undefined) : undefined,
          strategy: inputMode === 'city' ? form.strategy : 'rental',
          timeHorizonYears: 5,
          exactAddress: inputMode === 'property' ? addressForFilter : undefined,
          propertyUrl: inputMode === 'property' && isUrl ? propertyInput : undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Search failed');
      }

      let newResults = data.results || [];

      // For property mode, try to filter to exact match using the address
      if (inputMode === 'property' && addressForFilter && newResults.length > 1) {
        const addressLower = addressForFilter.toLowerCase();
        const streetNumberMatch = addressForFilter.match(/^\d+/);
        const streetNumber = streetNumberMatch ? streetNumberMatch[0] : '';

        // Normalize apartment/unit numbers for better matching
        const normalizeAptNumber = (addr: string) => {
          return addr
            .replace(/\b(apt|apartment|unit|ste|suite|#)\s*/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
        };

        const filtered = newResults.filter((item: any) => {
          const propAddr = item.property.address?.toLowerCase() || '';

          // Must start with the same street number
          if (streetNumber && !propAddr.startsWith(streetNumber)) {
            return false;
          }

          // Normalize both addresses for comparison
          const normalizedInput = normalizeAptNumber(addressLower);
          const normalizedProp = normalizeAptNumber(propAddr);

          // Extract significant words from the input (skip common street type suffixes)
          const inputWords = normalizedInput.replace(/^\d+[\s,]*/, '').split(/[\s,]+/);
          const streetWords = inputWords.filter((w: string) =>
            w.length > 1 &&
            !['dr', 'st', 'ave', 'rd', 'ln', 'ct', 'pl', 'blvd', 'pkwy', 'drive', 'street', 'avenue', 'road', 'lane', 'court', 'place', 'boulevard', 'parkway'].includes(w)
          );

          // Count how many significant words match
          const matches = streetWords.filter((word: string) => normalizedProp.includes(word));

          // For apartment addresses, require all words to match
          // For regular addresses, require at least the main street name
          const hasApartment = /\d+\s*[a-z]?\s*$/i.test(addressLower); // ends with a number (apt number)
          const requiredMatches = hasApartment ? streetWords.length : Math.max(1, streetWords.length - 1);

          return matches.length >= requiredMatches && streetWords.length > 0;
        });

        if (filtered.length > 0) {
          newResults = filtered;
          console.log(`✅ Filtered to ${filtered.length} matching properties for address: ${addressForFilter}`);
        } else {
          console.log(`⚠️ No exact matches found for "${addressForFilter}", showing all ${newResults.length} properties in ZIP ${zipToUse}`);
        }
      }

      setResults(newResults);
      applyFiltersAndSort(newResults);

      // Auto-trigger area analysis once per search using first result's location
      if (newResults.length > 0) {
        const first = newResults[0].property;
        setAreaAnalysis(null); // reset previous area
        setAnalyses({});       // reset previous property analyses
        fetchAreaAnalysis(first.city, first.state, first.zip, first.beds);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while searching');
      setResults([]);
      setFilteredResults([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = (data) => {
    let filtered = data.filter(item => item?.property?.listPrice && item.score >= minScore);
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price': return a.property.listPrice - b.property.listPrice;
        case 'capRate': return b.metrics.capRate - a.metrics.capRate;
        case 'cashOnCash': return b.metrics.cashOnCash - a.metrics.cashOnCash;
        default: return b.score - a.score;
      }
    });
    
    setFilteredResults(filtered);
  };

  const toggleFavorite = (id) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
  };

  const toggleComparison = (id) => {
    const newSelected = new Set(selectedForComparison);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else if (newSelected.size < 3) {
      newSelected.add(id);
    }
    setSelectedForComparison(newSelected);
  };

  // Re-apply filters when sort or filter changes
  useEffect(() => {
    if (results.length > 0) {
      applyFiltersAndSort(results);
    }
  }, [sortBy, minScore]);

  return (
    <>
      <header className="nav">
        <div className="brand">
          <Link href="/">LargeKite<span> Capital Intelligence</span></Link>
        </div>
        <nav className="links">
          <Link href="/#how-it-works">How It Works</Link>
          <Link href="/#methodology">Methodology</Link>
          <Link href="/#faq">FAQ</Link>
          <Link href="/" className="btn btn-primary btn-sm">Back to Home</Link>
          <button className="hamburger" aria-label="Menu">☰</button>
        </nav>
      </header>

      <div style={{
        minHeight: '100vh',
        background: '#fff',
        padding: '40px 20px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Page Header */}
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{
              margin: '0 0 12px 0',
              color: '#0f172a',
              fontSize: '36px',
              fontWeight: '700',
              letterSpacing: '-0.025em'
            }}>
              Investment Property Analyzer
            </h1>
            <p style={{
              margin: 0,
              color: '#64748b',
              fontSize: '18px',
              fontWeight: '400',
              maxWidth: '600px'
            }}>
              Make data-driven investment decisions with comprehensive property analysis
            </p>
          </div>
      
      {/* Search Form */}
      <form onSubmit={handleSubmit} style={{
        background: 'white',
        padding: '24px 28px 28px',
        borderRadius: '10px',
        marginBottom: '24px',
        border: '1px solid #e5e7eb'
      }}>

        {/* ── Unified Search Input ── */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ position: 'relative' }}>
            {/* Search icon */}
            <div style={{
              position: 'absolute', left: '16px', top: '50%',
              transform: 'translateY(-50%)', color: '#9ca3af',
              fontSize: '14px', pointerEvents: 'none', zIndex: 1
            }}>
              ⌕
            </div>

            {/* Single input — auto-detects ZIP / city / address / URL */}
            <input
              type="text"
              value={inputMode === 'property' ? propertyInput : (cityInput || form.location)}
              onChange={(e) => {
                const v = e.target.value;
                if (v.startsWith('http')) {
                  setInputMode('property');
                  handlePropertySearch(v);
                } else if (/^\d/.test(v) && !/\s/.test(v)) {
                  // Pure digits → treat as ZIP (city mode)
                  setInputMode('city');
                  handleCitySearch(v);
                } else if (/^\d+\s/.test(v)) {
                  // Starts with a number followed by space → likely an address
                  setInputMode('property');
                  handlePropertySearch(v);
                } else {
                  setInputMode('city');
                  handleCitySearch(v);
                }
              }}
              placeholder="City, ZIP code, address, or listing URL..."
              autoComplete="off"
              style={{
                width: '100%',
                padding: '13px 16px 13px 44px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.15s',
                background: '#f9fafb',
                color: '#111827',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#111827';
                e.target.style.background = '#fff';
                e.target.style.boxShadow = 'none';
                if (inputMode === 'city' && citySuggestions.length > 0) setShowSuggestions(true);
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.background = '#f9fafb';
                e.target.style.boxShadow = 'none';
                setTimeout(() => { setShowSuggestions(false); setShowAddressSuggestions(false); }, 200);
              }}
            />

            {/* Mode badge — auto-detected */}
            {(propertyInput || cityInput || form.location) && (
              <div style={{
                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '500',
                background: '#f3f4f6',
                color: '#9ca3af',
                letterSpacing: '0.03em', userSelect: 'none'
              }}>
                {inputMode === 'property'
                  ? (propertyInput.startsWith('http') ? 'LISTING URL' : 'ADDRESS')
                  : (/^\d{5}$/.test(form.location) ? 'ZIP CODE' : 'CITY')}
              </div>
            )}

            {/* City autocomplete dropdown */}
            {showSuggestions && citySuggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px',
                zIndex: 1000, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden'
              }}>
                {citySuggestions.map((s: any, idx) => (
                  <div key={idx} onClick={() => selectCity(s)} style={{
                    padding: '12px 16px', cursor: 'pointer', fontSize: '14px', color: '#1e293b',
                    borderBottom: idx < citySuggestions.length - 1 ? '1px solid #f1f5f9' : 'none',
                    display: 'flex', alignItems: 'center', gap: '10px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    <span style={{ color: '#9ca3af', fontSize: '13px' }}>→</span>
                    {s.displayName}
                  </div>
                ))}
              </div>
            )}

            {/* Address autocomplete dropdown */}
            {showAddressSuggestions && addressSuggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px',
                zIndex: 1000, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden'
              }}>
                {addressSuggestions.map((s: any, idx) => (
                  <div key={idx} onClick={() => selectAddress(s)} style={{
                    padding: '12px 16px', cursor: 'pointer', fontSize: '14px', color: '#1e293b',
                    borderBottom: idx < addressSuggestions.length - 1 ? '1px solid #f1f5f9' : 'none',
                    display: 'flex', alignItems: 'center', gap: '10px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    <span style={{ color: '#9ca3af', fontSize: '13px' }}>→</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.display}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Helper hint */}
          <div style={{
            display: 'flex', gap: '20px', marginTop: '10px', flexWrap: 'wrap'
          }}>
            {['Austin, TX', '90210', '123 Main St, Dallas', 'Zillow / Redfin URL'].map((text) => (
              <span key={text} style={{ fontSize: '12px', color: '#9ca3af' }}>
                {text}
              </span>
            ))}
          </div>
        </div>

        {/* ── Investment Strategy Cards (city mode only) ── */}
        {inputMode === 'city' && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              fontSize: '12px', fontWeight: '700', color: '#94a3b8',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px'
            }}>
              Investment Strategy
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[
                { value: 'rental',           icon: '🏘️', label: 'Buy & Hold',    sub: 'Steady rental income' },
                { value: 'appreciation',      icon: '📈', label: 'Appreciation',   sub: 'Long-term value growth' },
                { value: 'short_term_rental', icon: '🌴', label: 'Short-Term',     sub: 'Airbnb / VRBO' },
              ].map(({ value, icon, label, sub }) => {
                const active = form.strategy === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm({ ...form, strategy: value })}
                    style={{
                      padding: '12px 10px',
                      background: '#f9fafb',
                      border: `1.5px solid ${active ? '#111827' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'border-color 0.15s'
                    }}
                  >
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>{icon}</div>
                    <div style={{
                      fontSize: '13px', fontWeight: '600',
                      color: active ? '#111827' : '#4b5563'
                    }}>{label}</div>
                    <div style={{
                      fontSize: '11px', color: '#9ca3af',
                      marginTop: '2px'
                    }}>{sub}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Price Range Pills (city mode only) ── */}
        {inputMode === 'city' && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              fontSize: '12px', fontWeight: '700', color: '#94a3b8',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px'
            }}>
              Price Range
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {priceRanges.map((range, idx) => {
                const active = form.minPrice === range.min && form.maxPrice === range.max;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setForm({ ...form, minPrice: range.min, maxPrice: range.max })}
                    style={{
                      padding: '6px 14px',
                      background: active ? '#111827' : '#f9fafb',
                      color: active ? 'white' : '#4b5563',
                      border: `1px solid ${active ? '#111827' : '#e5e7eb'}`,
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '400',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {range.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Submit Button ── */}
        {(() => {
          const isDisabled = loading
            || (inputMode === 'city' && !form.location)
            || (inputMode === 'property' && !propertyInput);
          return (
            <button
              type="submit"
              disabled={isDisabled}
              style={{
                width: '100%',
                padding: '13px 32px',
                background: isDisabled ? '#e5e7eb' : '#111827',
                color: isDisabled ? '#9ca3af' : 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '500',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'background 0.15s'
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '16px', height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%', animation: 'spin 0.8s linear infinite'
                  }} />
                  Searching properties...
                </>
              ) : inputMode === 'property' ? (
                '→  Analyze This Property'
              ) : (
                '→  Find Investment Properties'
              )}
            </button>
          );
        })()}
      </form>

      {/* Error Display */}
      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {/* Results Controls */}
      {results.length > 0 && (
        <div style={{
          background: 'white',
          padding: '20px 24px',
          borderRadius: '10px',
          marginBottom: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{
                margin: '0 0 4px 0',
                color: '#1e293b',
                fontSize: '20px',
                fontWeight: '600'
              }}>
                Investment Opportunities
              </h3>
              <p style={{
                margin: 0,
                color: '#64748b',
                fontSize: '14px'
              }}>
                {filteredResults.length} {filteredResults.length === 1 ? 'property' : 'properties'} match your criteria
              </p>
            </div>
            {selectedForComparison.size > 0 && (
              <button
                onClick={() => setShowComparison(!showComparison)}
                style={{
                  padding: '9px 18px',
                  background: '#111827',
                  color: 'white',
                  border: 'none',
                  borderRadius: '7px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Compare Selected ({selectedForComparison.size})
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: '500',
                color: '#475569'
              }}>
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  fontSize: '14px',
                  outline: 'none',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="score">Investment Score</option>
                <option value="price">Price (Low to High)</option>
                <option value="capRate">Cap Rate</option>
                <option value="cashOnCash">Cash-on-Cash Return</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: '500',
                color: '#475569'
              }}>
                Minimum Score: {minScore}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  outline: 'none'
                }}
              />
              <div style={{
                fontSize: '12px',
                color: '#64748b',
                marginTop: '6px'
              }}>
                Showing {filteredResults.length} of {results.length} properties
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      {showComparison && selectedForComparison.size > 0 && (
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>Property Comparison</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px' }}>Property</th>
                  <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px' }}>Price</th>
                  <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px' }}>Score</th>
                  <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px' }}>Cap Rate</th>
                  <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px' }}>Cash-on-Cash</th>
                  <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px' }}>Est. Rent</th>
                  <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px' }}>5yr Value</th>
                  <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px' }}>Total Return</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.filter(item => selectedForComparison.has(item.property.id)).map((item) => (
                  <tr key={item.property.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px' }}>
                      <div style={{ fontWeight: '600', fontSize: '12px' }}>{item.property.address}</div>
                      <div style={{ fontSize: '10px', color: '#6b7280' }}>{item.property.beds}bd • {item.property.baths}ba</div>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: '600', fontSize: '12px' }}>
                      ${item.property.listPrice.toLocaleString('en-US')}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: '600', color: '#059669', fontSize: '12px' }}>
                      {item.score}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontSize: '12px' }}>
                      {(item.metrics.capRate * 100).toFixed(1)}%
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontSize: '12px' }}>
                      {(item.metrics.cashOnCash * 100).toFixed(1)}%
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontSize: '12px' }}>
                      ${item.metrics.estimatedRent.toLocaleString('en-US')}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontSize: '12px' }}>
                      ${item.metrics.projectedValueYearN.toLocaleString('en-US')}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontSize: '12px' }}>
                      {(((item.metrics.projectedValueYearN - item.property.listPrice) / item.property.listPrice) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Area Market Analysis Panel — auto-loaded after search */}
      {areaAnalysis !== null && filteredResults.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '10px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          marginBottom: '20px'
        }}>
          {/* Header */}
          <div style={{
            background: '#111827',
            padding: '12px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'white', fontWeight: '600', fontSize: '13px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Neighborhood & Market Analysis
              </span>
              {areaAnalysis !== 'loading' && areaAnalysis !== 'error' && (
                <span style={{
                  padding: '2px 9px', background: 'rgba(255,255,255,0.1)',
                  borderRadius: '20px', fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: '500'
                }}>
                  Live
                </span>
              )}
            </div>
            {areaAnalysis !== 'loading' && areaAnalysis !== 'error' && (
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                {filteredResults[0]?.property.city}, {filteredResults[0]?.property.state}
              </span>
            )}
          </div>

          {/* Loading */}
          {areaAnalysis === 'loading' && (
            <div style={{
              padding: '24px', display: 'flex', alignItems: 'center', gap: '16px',
              background: '#f9fafb'
            }}>
              <div style={{
                width: '20px', height: '20px',
                border: '2px solid #e5e7eb', borderTop: '2px solid #111827',
                borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0
              }} />
              <div>
                <div style={{ fontWeight: '500', color: '#374151', fontSize: '14px', marginBottom: '3px' }}>
                  Researching local market conditions...
                </div>
                <div style={{ color: '#9ca3af', fontSize: '13px' }}>
                  Searching population data, job market, rental rates, and economic trends
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {areaAnalysis === 'error' && (
            <div style={{
              padding: '16px 20px', background: '#fef2f2',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px'
            }}>
              <div style={{ color: '#dc2626', fontSize: '14px' }}>
                Market analysis failed. Check PERPLEXITY_API_KEY.
              </div>
              <button
                onClick={() => {
                  const p = filteredResults[0]?.property;
                  if (p) fetchAreaAnalysis(p.city, p.state, p.zip, p.beds);
                }}
                style={{
                  padding: '7px 14px', background: '#dc2626', color: 'white',
                  border: 'none', borderRadius: '8px', fontSize: '13px',
                  fontWeight: '600', cursor: 'pointer', flexShrink: 0
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Data */}
          {typeof areaAnalysis === 'object' && areaAnalysis !== null && (() => {
            const aa = areaAnalysis as AreaAnalysis;
            return (
              <div style={{ padding: '20px' }}>
                {/* Market Data Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                  gap: '12px', marginBottom: '16px'
                }}>
                  {[
                    { label: 'Population',   value: aa.marketData.populationTrend },
                    { label: 'Job Market',    value: aa.marketData.jobMarket },
                    { label: 'Median Income', value: aa.marketData.medianIncome },
                    { label: 'Home Values',   value: aa.marketData.homeValueTrend },
                    { label: 'Rent Trend',    value: aa.marketData.rentTrend },
                    { label: 'Vacancy Rate',  value: aa.marketData.vacancyRate },
                    { label: 'Development',   value: aa.marketData.developmentActivity },
                  ].map(({ label, value }) => (
                    <div key={label} style={{
                      background: '#f9fafb', borderRadius: '8px',
                      padding: '12px', border: '1px solid #e5e7eb'
                    }}>
                      <div style={{
                        fontSize: '11px', fontWeight: '500', color: '#9ca3af',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        marginBottom: '5px'
                      }}>
                        {label}
                      </div>
                      <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5', fontWeight: '500' }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Neighborhood Insights */}
                {aa.neighborhoodInsights.length > 0 && (
                  <div style={{
                    background: '#f9fafb', borderRadius: '8px',
                    border: '1px solid #e5e7eb', padding: '14px', marginBottom: '12px'
                  }}>
                    <div style={{
                      fontWeight: '600', color: '#374151', fontSize: '13px',
                      marginBottom: '10px'
                    }}>
                      Neighborhood Insights
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                      {aa.neighborhoodInsights.map((s, i) => (
                        <div key={i} style={{
                          display: 'flex', gap: '8px', alignItems: 'flex-start',
                          fontSize: '13px', color: '#4b5563', lineHeight: '1.5'
                        }}>
                          <span style={{ color: '#9ca3af', flexShrink: 0, marginTop: '2px' }}>—</span>
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Area Outlook */}
                <div style={{
                  background: '#f9fafb',
                  borderRadius: '8px', border: '1px solid #e5e7eb', padding: '14px'
                }}>
                  <div style={{
                    fontWeight: '600', color: '#374151', fontSize: '13px',
                    marginBottom: '7px'
                  }}>
                    5-Year Area Outlook
                  </div>
                  <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.7' }}>
                    {aa.areaOutlook}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Property Results */}
      {filteredResults.length > 0 && (
        <div style={{ display: 'grid', gap: '24px' }}>
          {filteredResults.map((item) => (
            <div key={item.property.id} style={{
              background: 'white',
              padding: '24px',
              borderRadius: '10px',
              border: selectedForComparison.has(item.property.id) ? '1.5px solid #111827' : '1px solid #e5e7eb',
              transition: 'border-color 0.15s'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', marginBottom: '20px' }}>
                {item.property.imageUrl && (
                  <img
                    src={item.property.imageUrl}
                    alt="Property"
                    style={{
                      width: '240px',
                      height: '160px',
                      objectFit: 'cover',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0'
                    }}
                  />
                )}

                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '20px',
                      color: '#0f172a',
                      fontWeight: '600',
                      flex: 1
                    }}>
                      {item.property.address}
                    </h3>
                    <span style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      background: '#f9fafb',
                      color: item.score >= 75 ? '#166534' : item.score >= 50 ? '#92400e' : '#991b1b',
                      border: '1px solid #e5e7eb'
                    }}>
                      {item.score >= 75 ? 'Excellent' : item.score >= 50 ? 'Good' : 'Fair'}
                    </span>
                  </div>
                  <p style={{
                    margin: '0 0 12px 0',
                    color: '#64748b',
                    fontSize: '15px'
                  }}>
                    {item.property.city}, {item.property.state} {item.property.zip}
                  </p>
                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    flexWrap: 'wrap',
                    fontSize: '14px',
                    color: '#475569'
                  }}>
                    <span style={{ fontWeight: '500' }}>{item.property.beds} beds</span>
                    {item.property.baths && <span style={{ fontWeight: '500' }}>{item.property.baths} baths</span>}
                    {item.property.sqft && <span style={{ fontWeight: '500' }}>{item.property.sqft.toLocaleString('en-US')} sqft</span>}
                    {item.property.sqft && item.property.listPrice && (
                      <span style={{ color: '#64748b' }}>
                        ${Math.round(item.property.listPrice / item.property.sqft)}/sqft
                      </span>
                    )}
                  </div>

                  <div style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>
                      ${item.property.listPrice.toLocaleString('en-US')}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      ${(item.property.listPrice * 0.2).toLocaleString('en-US')} down
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                marginBottom: '20px'
              }}>
                {/* Investment Score */}
                <div style={{
                  background: '#f9fafb',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '500', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                    Investment Score
                  </div>
                  <div style={{
                    fontSize: '30px', fontWeight: '700', letterSpacing: '-0.02em',
                    color: item.score >= 75 ? '#166534' : item.score >= 50 ? '#92400e' : '#991b1b'
                  }}>
                    {item.score}<span style={{ fontSize: '18px', color: '#9ca3af', fontWeight: '400' }}>/100</span>
                  </div>
                </div>

                {/* Cap Rate */}
                <div style={{
                  background: '#f9fafb',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '500', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                    Cap Rate
                  </div>
                  <div style={{ fontSize: '30px', fontWeight: '700', color: '#111827', letterSpacing: '-0.02em' }}>
                    {(item.metrics.capRate * 100).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                    Annual return on value
                  </div>
                </div>

                {/* Cash on Cash */}
                <div style={{
                  background: '#f9fafb',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '500', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                    Cash-on-Cash
                  </div>
                  <div style={{ fontSize: '30px', fontWeight: '700', color: '#16a34a', letterSpacing: '-0.02em' }}>
                    {(item.metrics.cashOnCash * 100).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                    Annual return on cash
                  </div>
                </div>

                {/* Monthly Rent */}
                <div style={{
                  background: '#f9fafb',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '500', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                    Est. Monthly Rent
                  </div>
                  <div style={{ fontSize: '30px', fontWeight: '700', color: '#111827', letterSpacing: '-0.02em' }}>
                    ${item.metrics.estimatedRent.toLocaleString('en-US')}
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                    Projected rental income
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '16px',
                borderTop: '1px solid #e2e8f0',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {item.property.externalUrl && (
                    <a
                      href={item.property.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '9px 18px',
                        background: '#111827',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '7px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      View Listing
                    </a>
                  )}

                  {/* AI Deep Analysis Button */}
                  <button
                    onClick={() => handleAnalyze(item)}
                    disabled={analyses[item.property.id] === 'loading'}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '9px 18px',
                      background: analyses[item.property.id] === 'loading'
                        ? '#e5e7eb'
                        : typeof analyses[item.property.id] === 'object'
                        ? '#374151'
                        : '#111827',
                      color: analyses[item.property.id] === 'loading' ? '#9ca3af' : 'white',
                      border: 'none',
                      borderRadius: '7px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: analyses[item.property.id] === 'loading' ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {analyses[item.property.id] === 'loading' ? (
                      <>
                        <div style={{
                          width: '14px', height: '14px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                          flexShrink: 0
                        }} />
                        Analyzing property...
                      </>
                    ) : typeof analyses[item.property.id] === 'object' ? (
                      <>Analysis Open</>
                    ) : (
                      <>Deep Analysis</>
                    )}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => toggleFavorite(item.property.id)}
                    style={{
                      padding: '9px 16px',
                      background: favorites.has(item.property.id) ? '#111827' : '#f9fafb',
                      color: favorites.has(item.property.id) ? 'white' : '#4b5563',
                      border: '1px solid',
                      borderColor: favorites.has(item.property.id) ? '#111827' : '#e5e7eb',
                      borderRadius: '7px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      transition: 'all 0.2s'
                    }}
                  >
                    {favorites.has(item.property.id) ? 'Saved' : 'Save'}
                  </button>

                  <button
                    onClick={() => toggleComparison(item.property.id)}
                    disabled={!selectedForComparison.has(item.property.id) && selectedForComparison.size >= 3}
                    style={{
                      padding: '9px 16px',
                      background: selectedForComparison.has(item.property.id) ? '#111827' : '#f9fafb',
                      color: selectedForComparison.has(item.property.id) ? 'white' : '#4b5563',
                      border: '1px solid',
                      borderColor: selectedForComparison.has(item.property.id) ? '#111827' : '#e5e7eb',
                      borderRadius: '7px',
                      cursor: (!selectedForComparison.has(item.property.id) && selectedForComparison.size >= 3) ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      opacity: (!selectedForComparison.has(item.property.id) && selectedForComparison.size >= 3) ? 0.5 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    {selectedForComparison.has(item.property.id) ? 'Selected' : 'Compare'}
                  </button>
                </div>
              </div>

              {/* AI Analysis Loading State */}
              {analyses[item.property.id] === 'loading' && (
                <div style={{
                  marginTop: '20px',
                  padding: '20px 24px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div style={{
                    width: '20px', height: '20px',
                    border: '2px solid #e5e7eb',
                    borderTop: '2px solid #111827',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    flexShrink: 0
                  }} />
                  <div>
                    <div style={{ fontWeight: '500', color: '#374151', fontSize: '14px', marginBottom: '4px' }}>
                      Analyzing this property...
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '13px' }}>
                      Comparing against local comps, evaluating investment metrics for {item.property.address}
                    </div>
                  </div>
                </div>
              )}

              {/* AI Analysis Error State */}
              {analyses[item.property.id] === 'error' && (
                <div style={{
                  marginTop: '20px',
                  padding: '16px 20px',
                  background: '#fef2f2',
                  borderRadius: '12px',
                  border: '1px solid #fecaca',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div style={{ color: '#dc2626', fontSize: '14px', fontWeight: '500' }}>
                    Analysis failed. Check that PERPLEXITY_API_KEY is set in .env.local and retry.
                  </div>
                  <button
                    onClick={() => handleAnalyze(item)}
                    style={{
                      padding: '8px 14px', background: '#dc2626', color: 'white',
                      border: 'none', borderRadius: '8px', fontSize: '13px',
                      fontWeight: '600', cursor: 'pointer', flexShrink: 0
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* AI Property Analysis Panel */}
              {typeof analyses[item.property.id] === 'object' && analyses[item.property.id] !== null && (() => {
                const analysis = analyses[item.property.id] as PropertyAnalysis;
                const verdictConfig = {
                  strong_buy: { label: 'Strong Buy', bg: '#14532d', color: '#bbf7d0' },
                  buy:         { label: 'Buy',         bg: '#166534', color: '#dcfce7' },
                  hold:        { label: 'Hold',        bg: '#92400e', color: '#fef3c7' },
                  pass:        { label: 'Pass',        bg: '#991b1b', color: '#fee2e2' },
                };
                const vc = verdictConfig[analysis.verdict] || verdictConfig.hold;

                return (
                  <div style={{
                    marginTop: '20px', borderRadius: '10px',
                    border: '1px solid #e5e7eb', overflow: 'hidden'
                  }}>
                    {/* Header */}
                    <div style={{
                      background: '#111827',
                      padding: '12px 20px', display: 'flex',
                      alignItems: 'center', justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: 'white', fontWeight: '600', fontSize: '13px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          Property Analysis
                        </span>
                        <span style={{
                          padding: '2px 9px', background: 'rgba(255,255,255,0.1)',
                          borderRadius: '20px', fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: '500'
                        }}>
                          Live
                        </span>
                      </div>
                      <button
                        onClick={() => handleAnalyze(item)}
                        style={{
                          background: 'rgba(255,255,255,0.15)', border: 'none',
                          color: 'white', borderRadius: '6px', padding: '4px 10px',
                          cursor: 'pointer', fontSize: '13px', fontWeight: '600'
                        }}
                      >
                        ✕ Close
                      </button>
                    </div>

                    {/* Verdict Banner */}
                    <div style={{
                      background: vc.bg, padding: '20px 24px',
                      display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap'
                    }}>
                      <div style={{
                        padding: '8px 22px', background: 'rgba(255,255,255,0.15)',
                        borderRadius: '8px', border: '1px solid rgba(255,255,255,0.25)',
                        fontSize: '22px', fontWeight: '800', color: vc.color, letterSpacing: '0.04em'
                      }}>
                        {vc.label.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ color: vc.color, fontSize: '13px', fontWeight: '500', marginBottom: '4px', opacity: 0.8 }}>
                          AI Confidence Score
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ color: vc.color, fontSize: '28px', fontWeight: '800' }}>
                            {analysis.confidenceScore}<span style={{ fontSize: '16px', opacity: 0.7 }}>/100</span>
                          </div>
                          <div style={{
                            flex: 1, height: '6px', background: 'rgba(255,255,255,0.15)',
                            borderRadius: '3px', minWidth: '80px'
                          }}>
                            <div style={{
                              width: `${analysis.confidenceScore}%`, height: '100%',
                              background: vc.color, borderRadius: '3px', transition: 'width 0.6s ease'
                            }} />
                          </div>
                        </div>
                      </div>
                      <div style={{ color: vc.color, fontSize: '14px', lineHeight: '1.6', maxWidth: '500px', opacity: 0.9 }}>
                        {analysis.summary}
                      </div>
                    </div>

                    <div style={{ padding: '24px', background: 'white' }}>
                      {/* Property vs. Market Highlights */}
                      {analysis.propertyHighlights && analysis.propertyHighlights.length > 0 && (
                        <div style={{
                          background: '#f9fafb',
                          borderRadius: '8px', border: '1px solid #e5e7eb',
                          padding: '16px', marginBottom: '16px'
                        }}>
                          <div style={{
                            fontWeight: '600', color: '#374151', fontSize: '13px',
                            marginBottom: '12px'
                          }}>
                            This Property vs. Market
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {analysis.propertyHighlights.map((h, i) => (
                              <div key={i} style={{
                                display: 'flex', gap: '10px', alignItems: 'flex-start',
                                fontSize: '13px', color: '#4b5563', lineHeight: '1.5'
                              }}>
                                <span style={{ color: '#9ca3af', flexShrink: 0, marginTop: '1px' }}>—</span>
                                {h}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bull + Bear */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '20px', marginBottom: '20px'
                      }}>
                        <div style={{
                          background: '#f0fdf4', borderRadius: '8px',
                          border: '1px solid #bbf7d0', padding: '18px'
                        }}>
                          <div style={{ fontWeight: '600', color: '#14532d', fontSize: '13px', marginBottom: '14px' }}>
                            Investment Strengths
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {analysis.bullCase.map((pt, i) => (
                              <div key={i}>
                                <div style={{ fontWeight: '600', color: '#166534', fontSize: '13px', marginBottom: '2px' }}>{pt.point}</div>
                                <div style={{ color: '#4b7c5a', fontSize: '13px', lineHeight: '1.5' }}>{pt.evidence}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div style={{
                          background: '#fef2f2', borderRadius: '8px',
                          border: '1px solid #fecaca', padding: '18px'
                        }}>
                          <div style={{ fontWeight: '600', color: '#7f1d1d', fontSize: '13px', marginBottom: '14px' }}>
                            Risks & Concerns
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {analysis.bearCase.map((pt, i) => (
                              <div key={i}>
                                <div style={{ fontWeight: '600', color: '#991b1b', fontSize: '13px', marginBottom: '2px' }}>{pt.point}</div>
                                <div style={{ color: '#7c3434', fontSize: '13px', lineHeight: '1.5' }}>{pt.evidence}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 5-Year Property Outlook */}
                      <div style={{
                        background: '#f9fafb',
                        borderRadius: '8px', border: '1px solid #e5e7eb', padding: '16px',
                        marginBottom: '16px'
                      }}>
                        <div style={{
                          fontWeight: '600', color: '#374151', fontSize: '13px',
                          marginBottom: '8px'
                        }}>
                          5-Year Property Outlook
                        </div>
                        <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.7' }}>
                          {analysis.fiveYearOutlook}
                        </div>
                      </div>

                      {/* Downside Scenario */}
                      {analysis.downsideScenario && (analysis.downsideScenario.vacancyAt10Pct || analysis.downsideScenario.rentDown10Pct || analysis.downsideScenario.rateUp1Pct) && (
                        <div style={{
                          background: '#fffbeb', borderRadius: '8px',
                          border: '1px solid #fde68a', padding: '16px', marginBottom: '16px'
                        }}>
                          <div style={{ fontWeight: '600', color: '#92400e', fontSize: '13px', marginBottom: '12px' }}>
                            Downside Stress Test
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {analysis.downsideScenario.vacancyAt10Pct && (
                              <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
                                <span style={{ color: '#d97706', flexShrink: 0, fontWeight: '600' }}>Vacancy 10%</span>
                                <span style={{ color: '#78350f', lineHeight: '1.5' }}>{analysis.downsideScenario.vacancyAt10Pct}</span>
                              </div>
                            )}
                            {analysis.downsideScenario.rentDown10Pct && (
                              <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
                                <span style={{ color: '#d97706', flexShrink: 0, fontWeight: '600' }}>Rent −10%</span>
                                <span style={{ color: '#78350f', lineHeight: '1.5' }}>{analysis.downsideScenario.rentDown10Pct}</span>
                              </div>
                            )}
                            {analysis.downsideScenario.rateUp1Pct && (
                              <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
                                <span style={{ color: '#d97706', flexShrink: 0, fontWeight: '600' }}>Rate +1%</span>
                                <span style={{ color: '#78350f', lineHeight: '1.5' }}>{analysis.downsideScenario.rateUp1Pct}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Behavioral Bias Checks */}
                      {analysis.biasChecks && analysis.biasChecks.length > 0 && (
                        <div style={{
                          background: 'white', borderRadius: '8px',
                          border: '1px solid #e5e7eb', padding: '16px'
                        }}>
                          <div style={{ fontWeight: '600', color: '#374151', fontSize: '13px', marginBottom: '12px' }}>
                            Investor Psychology Checks
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {analysis.biasChecks.map((check, i) => {
                              const biasLabels: Record<string, string> = {
                                recency_bias: 'Recency Bias',
                                loss_aversion: 'Loss Aversion',
                                confirmation_bias: 'Confirmation Bias',
                                mental_accounting: 'Mental Accounting',
                              };
                              return (
                                <div key={i} style={{
                                  display: 'flex', gap: '10px', alignItems: 'flex-start',
                                  padding: '10px 12px', borderRadius: '6px',
                                  background: check.triggered ? '#fef9c3' : '#f0fdf4',
                                  border: `1px solid ${check.triggered ? '#fde047' : '#bbf7d0'}`
                                }}>
                                  <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>
                                    {check.triggered ? '⚠' : '✓'}
                                  </span>
                                  <div>
                                    <div style={{ fontSize: '12px', fontWeight: '700', color: check.triggered ? '#854d0e' : '#166534', marginBottom: '2px' }}>
                                      {biasLabels[check.bias] ?? check.bias} — {check.flag}
                                    </div>
                                    <div style={{ fontSize: '12px', color: check.triggered ? '#713f12' : '#4b7c5a', lineHeight: '1.5' }}>
                                      {check.note}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
      </div>
    </>
  );
}