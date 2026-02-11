'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

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

  useEffect(() => {
    // Use static rates since Freddie Mac API has CORS restrictions
    setMortgageRates({ rate30: 6.5, rate15: 5.8 });
  }, []);

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
          <Link href="/" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '14px' }}>Back to Home</Link>
          <button className="hamburger" aria-label="Menu">☰</button>
        </nav>
      </header>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%)',
        padding: '48px 20px'
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
        padding: '32px',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.05)',
        marginBottom: '32px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{
            margin: '0 0 8px 0',
            color: '#1e293b',
            fontSize: '20px',
            fontWeight: '600'
          }}>
            Search Properties
          </h2>
          <p style={{
            margin: 0,
            color: '#64748b',
            fontSize: '14px'
          }}>
            Enter location and criteria to find investment opportunities
          </p>
        </div>

        {/* Input Mode Selector */}
        <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#1e293b', fontSize: '15px' }}>
            How would you like to search?
          </label>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setInputMode('city')}
              style={{
                padding: '10px 20px',
                background: inputMode === 'city' ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : '#f1f5f9',
                color: inputMode === 'city' ? 'white' : '#475569',
                border: '1px solid',
                borderColor: inputMode === 'city' ? '#2563eb' : '#cbd5e1',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              City / ZIP Code
            </button>
            <button
              type="button"
              onClick={() => setInputMode('property')}
              style={{
                padding: '10px 20px',
                background: inputMode === 'property' ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : '#f1f5f9',
                color: inputMode === 'property' ? 'white' : '#475569',
                border: '1px solid',
                borderColor: inputMode === 'property' ? '#2563eb' : '#cbd5e1',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Specific Property (Address or Link)
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: inputMode === 'property' ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
          {/* Property Input (Address or URL) */}
          {inputMode === 'property' && (
            <div style={{ position: 'relative' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#334155',
                fontSize: '14px'
              }}>
                Property Address or Listing URL
              </label>
              <input
                type="text"
                value={propertyInput}
                onChange={(e) => handlePropertySearch(e.target.value)}
                placeholder="123 Main St, City, State OR https://www.zillow.com/homedetails/..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  background: '#ffffff'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2563eb';
                  e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#cbd5e1';
                  e.target.style.boxShadow = 'none';
                  setTimeout(() => setShowAddressSuggestions(false), 200);
                }}
              />
              {showAddressSuggestions && addressSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  marginTop: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  {addressSuggestions.map((suggestion: any, idx) => (
                    <div
                      key={idx}
                      onClick={() => selectAddress(suggestion)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: idx < addressSuggestions.length - 1 ? '1px solid #f3f4f6' : 'none',
                        fontSize: '14px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      {suggestion.display}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>
                Enter a property address or paste a Zillow/Redfin URL
              </div>
            </div>
          )}

          {/* City/ZIP Input */}
          {inputMode === 'city' && (
            <>
              <div style={{ position: 'relative' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#334155',
                  fontSize: '14px'
                }}>
                  Location
                </label>
                <input
                  type="text"
                  value={cityInput || form.location}
                  onChange={(e) => handleCitySearch(e.target.value)}
                  placeholder="City name or ZIP code"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    background: '#ffffff'
                  }}
                  onFocus={(e) => {
                    citySuggestions.length > 0 && setShowSuggestions(true);
                    e.target.style.borderColor = '#2563eb';
                    e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.boxShadow = 'none';
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                />
                {showSuggestions && citySuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    marginTop: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    {citySuggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        onClick={() => selectCity(suggestion)}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          borderBottom: idx < citySuggestions.length - 1 ? '1px solid #f3f4f6' : 'none',
                          fontSize: '14px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                      >
                        {suggestion.displayName}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Only show price range and strategy for city mode */}
          {inputMode === 'city' && (
            <>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#334155',
                  fontSize: '14px'
                }}>
                  Price Range
                </label>
                <select
                  onChange={handlePriceRangeChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    fontSize: '15px',
                    outline: 'none',
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2563eb';
                    e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  {priceRanges.map((range, idx) => (
                    <option key={idx} value={idx}>{range.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#334155',
                  fontSize: '14px'
                }}>
                  Investment Strategy
                </label>
                <select
                  value={form.strategy}
                  onChange={(e) => setForm({...form, strategy: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    fontSize: '15px',
                    outline: 'none',
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2563eb';
                    e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="rental">Buy & Hold Rental</option>
                  <option value="appreciation">Appreciation</option>
                  <option value="short_term_rental">Short-Term Rental</option>
                </select>
              </div>
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || (inputMode === 'city' && !form.location) || (inputMode === 'property' && !propertyInput)}
          style={{
            marginTop: '28px',
            padding: '14px 32px',
            background: (loading || (inputMode === 'city' && !form.location) || (inputMode === 'property' && !propertyInput)) ? '#94a3b8' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: (loading || (inputMode === 'city' && !form.location) || (inputMode === 'property' && !propertyInput)) ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s',
            boxShadow: (loading || (inputMode === 'city' && !form.location) || (inputMode === 'property' && !propertyInput)) ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.3)'
          }}
          onMouseEnter={(e) => {
            if (!loading && ((inputMode === 'city' && form.location) || (inputMode === 'property' && propertyInput))) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = (loading || (inputMode === 'city' && !form.location) || (inputMode === 'property' && !propertyInput)) ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.3)';
          }}
        >
          {loading && (
            <div style={{
              width: '18px',
              height: '18px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTop: '2px solid white',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
          )}
          {loading ? 'Analyzing...' : (inputMode === 'city' ? 'Find Properties' : 'Analyze This Property')}
        </button>
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
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          marginBottom: '24px',
          border: '1px solid #e2e8f0'
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
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(5, 150, 105, 0.3)';
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
                      ${item.property.listPrice.toLocaleString()}
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
                      ${item.metrics.estimatedRent.toLocaleString()}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontSize: '12px' }}>
                      ${item.metrics.projectedValueYearN.toLocaleString()}
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

      {/* Property Results */}
      {filteredResults.length > 0 && (
        <div style={{ display: 'grid', gap: '24px' }}>
          {filteredResults.map((item) => (
            <div key={item.property.id} style={{
              background: 'white',
              padding: '24px',
              borderRadius: '16px',
              boxShadow: selectedForComparison.has(item.property.id) ? '0 0 0 2px #059669, 0 4px 12px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #e2e8f0',
              transition: 'all 0.2s'
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
                      background: item.score >= 75 ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' : item.score >= 50 ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                      color: item.score >= 75 ? '#166534' : item.score >= 50 ? '#92400e' : '#991b1b',
                      border: item.score >= 75 ? '1px solid #bbf7d0' : item.score >= 50 ? '1px solid #fde68a' : '1px solid #fecaca'
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
                    {item.property.sqft && <span style={{ fontWeight: '500' }}>{item.property.sqft.toLocaleString()} sqft</span>}
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
                      ${item.property.listPrice.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      ${(item.property.listPrice * 0.2).toLocaleString()} down
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
                  background: item.score >= 75 ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' : item.score >= 50 ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: item.score >= 75 ? '1px solid #86efac' : item.score >= 50 ? '1px solid #fcd34d' : '1px solid #fca5a5'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    Investment Score
                  </div>
                  <div style={{
                    fontSize: '32px',
                    fontWeight: '700',
                    color: item.score >= 75 ? '#166534' : item.score >= 50 ? '#92400e' : '#991b1b'
                  }}>
                    {item.score}<span style={{ fontSize: '20px' }}>/100</span>
                  </div>
                </div>

                {/* Cap Rate */}
                <div style={{
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #bae6fd'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    Cap Rate
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#0369a1' }}>
                    {(item.metrics.capRate * 100).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Annual return on value
                  </div>
                </div>

                {/* Cash on Cash */}
                <div style={{
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #bbf7d0'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    Cash-on-Cash
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#15803d' }}>
                    {(item.metrics.cashOnCash * 100).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Annual return on cash
                  </div>
                </div>

                {/* Monthly Rent */}
                <div style={{
                  background: 'linear-gradient(135deg, #fefce8 0%, #fef08a 100%)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #fde047'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    Est. Monthly Rent
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#a16207' }}>
                    ${item.metrics.estimatedRent.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
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
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.3)';
                      }}
                    >
                      View Listing
                    </a>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => toggleFavorite(item.property.id)}
                    style={{
                      padding: '10px 16px',
                      background: favorites.has(item.property.id) ? '#dc2626' : '#f1f5f9',
                      color: favorites.has(item.property.id) ? 'white' : '#475569',
                      border: '1px solid',
                      borderColor: favorites.has(item.property.id) ? '#dc2626' : '#cbd5e1',
                      borderRadius: '10px',
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
                      padding: '10px 16px',
                      background: selectedForComparison.has(item.property.id) ? '#059669' : '#f1f5f9',
                      color: selectedForComparison.has(item.property.id) ? 'white' : '#475569',
                      border: '1px solid',
                      borderColor: selectedForComparison.has(item.property.id) ? '#059669' : '#cbd5e1',
                      borderRadius: '10px',
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