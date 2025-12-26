'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SimpleInvestmentFinder() {
  const [form, setForm] = useState({
    location: '',
    minPrice: '',
    maxPrice: '',
    strategy: 'rental'
  });
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
    
    try {
      const res = await fetch('/api/investment-properties/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: form.location,
          minPrice: form.minPrice ? Number(form.minPrice) : undefined,
          maxPrice: form.maxPrice ? Number(form.maxPrice) : undefined,
          strategy: form.strategy,
          timeHorizonYears: 5
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Search failed');
      }
      

      
      const newResults = data.results || [];
      setResults(newResults);
      applyFiltersAndSort(newResults);
    } catch (err) {
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
          <Link href="/">LargeKite<span>Capital</span></Link>
        </div>
      </header>
      
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, color: '#1f2937' }}>Investment Property Finder</h1>
        <div style={{ 
          background: '#eff6ff', 
          padding: '12px 16px', 
          borderRadius: '8px', 
          border: '1px solid #bfdbfe',
          fontSize: '13px'
        }}>
          <div style={{ color: '#1e40af', fontWeight: '600', marginBottom: '4px' }}>Current Mortgage Rates:</div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div>
              <span style={{ color: '#1f2937', fontWeight: '700' }}>{mortgageRates.rate30.toFixed(2)}%</span>
              <span style={{ color: '#6b7280', fontSize: '12px', marginLeft: '4px' }}>30-yr</span>
            </div>
            <div>
              <span style={{ color: '#1f2937', fontWeight: '700' }}>{mortgageRates.rate15.toFixed(2)}%</span>
              <span style={{ color: '#6b7280', fontSize: '12px', marginLeft: '4px' }}>15-yr</span>
            </div>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} style={{ 
        background: 'white', 
        padding: '30px', 
        borderRadius: '12px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              City or ZIP Code
            </label>
            <input
              type="text"
              value={cityInput || form.location}
              onChange={(e) => handleCitySearch(e.target.value)}
              placeholder="Enter city name or ZIP"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
              onFocus={(e) => {
                citySuggestions.length > 0 && setShowSuggestions(true);
                e.target.style.borderColor = '#3b82f6';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
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
                borderRadius: '8px',
                marginTop: '4px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                {citySuggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    onClick={() => selectCity(suggestion)}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      borderBottom: idx < citySuggestions.length - 1 ? '1px solid #f3f4f6' : 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    {suggestion.displayName}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Price Range
            </label>
            <select
              onChange={handlePriceRangeChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                background: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            >
              {priceRanges.map((range, idx) => (
                <option key={idx} value={idx}>{range.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Strategy
            </label>
            <select
              value={form.strategy}
              onChange={(e) => setForm({...form, strategy: e.target.value})}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                background: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            >
              <option value="rental">Buy & Hold Rental</option>
              <option value="appreciation">Appreciation</option>
              <option value="short_term_rental">Short-Term Rental</option>
            </select>
          </div>

        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: '20px',
            padding: '12px 24px',
            background: loading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {loading && (
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid transparent',
              borderTop: '2px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          )}
          {loading ? 'Searching...' : 'Find Properties'}
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
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, color: '#1f2937' }}>Found {results.length} properties</h3>
            {selectedForComparison.size > 0 && (
              <button
                onClick={() => setShowComparison(!showComparison)}
                style={{
                  padding: '8px 16px',
                  background: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Compare ({selectedForComparison.size})
              </button>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '600' }}>Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="score">Investment Score</option>
                <option value="price">Price (Low to High)</option>
                <option value="capRate">Cap Rate</option>
                <option value="cashOnCash">Cash-on-Cash Return</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '600' }}>Min Score</label>
              <input
                type="range"
                min="0"
                max="100"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Score: {minScore}+ (Showing {filteredResults.length})</div>
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
        <div style={{ display: 'grid', gap: '20px' }}>
          {filteredResults.map((item) => (
            <div key={item.property.id} style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: selectedForComparison.has(item.property.id) ? '0 0 0 2px #059669' : '0 1px 3px rgba(0,0,0,0.1)',
              display: 'grid',
              gridTemplateColumns: '200px 1fr auto auto',
              gap: '20px',
              alignItems: 'center'
            }}>
              {item.property.imageUrl && (
                <img 
                  src={item.property.imageUrl} 
                  alt="Property"
                  style={{ width: '200px', height: '120px', objectFit: 'cover', borderRadius: '8px' }}
                />
              )}
              
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#1f2937' }}>
                    {item.property.address}
                  </h3>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: item.score >= 75 ? '#dcfce7' : item.score >= 50 ? '#fef3c7' : '#fee2e2',
                    color: item.score >= 75 ? '#166534' : item.score >= 50 ? '#92400e' : '#991b1b'
                  }}>
                    {item.score >= 75 ? '⭐ Excellent' : item.score >= 50 ? '✓ Good' : '⚠ Fair'}
                  </span>
                </div>
                <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>
                  {item.property.city}, {item.property.state} {item.property.zip}
                </p>
                <p style={{ margin: '0', fontSize: '14px', color: '#374151' }}>
                  {item.property.beds} beds{item.property.baths ? ` • ${item.property.baths} baths` : ''}{item.property.sqft ? ` • ${item.property.sqft.toLocaleString()} sqft` : ''}
                  {item.property.sqft && item.property.listPrice && (
                    <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                      (${Math.round(item.property.listPrice / item.property.sqft)}/sqft)
                    </span>
                  )}
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
                  ${item.property.listPrice.toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '12px' }}>
                  Down: ${(item.property.listPrice * 0.2).toLocaleString()} • Loan: ${(item.property.listPrice * 0.8).toLocaleString()}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#f59e0b', display: 'flex', flexDirection: 'column' }} title="Total cash needed to buy: 20% down payment + 3% closing costs">
                    <span style={{ fontWeight: '600' }}>${((item.property.listPrice * 0.2) + (item.property.listPrice * 0.03)).toLocaleString()}</span>
                    <span style={{ fontSize: '10px', color: '#6b7280' }}>Cash to Buy</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#8b5cf6', display: 'flex', flexDirection: 'column' }} title="Estimated monthly mortgage payment (principal + interest)">
                    <span style={{ fontWeight: '600' }}>${((item.property.listPrice * 0.8 * 0.007)).toLocaleString()}/mo</span>
                    <span style={{ fontSize: '10px', color: '#6b7280' }}>Mortgage</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#ec4899', display: 'flex', flexDirection: 'column' }} title="Monthly profit: Rent minus mortgage, taxes, insurance, and maintenance">
                    <span style={{ fontWeight: '600', color: (item.metrics.cashOnCash * (item.property.listPrice * 0.25) / 12) >= 0 ? '#059669' : '#dc2626' }}>
                      ${((item.metrics.cashOnCash * (item.property.listPrice * 0.25) / 12)).toLocaleString()}/mo
                    </span>
                    <span style={{ fontSize: '10px', color: '#6b7280' }}>Monthly Profit</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#059669', display: 'flex', flexDirection: 'column', position: 'relative' }} title="Annual return on total property value">
                    <span style={{ fontWeight: '600' }}>{(item.metrics.capRate * 100).toFixed(1)}%</span>
                    <span style={{ fontSize: '10px', color: '#6b7280' }}>Return on Value</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#0891b2', display: 'flex', flexDirection: 'column', position: 'relative' }} title="Annual return on your cash invested">
                    <span style={{ fontWeight: '600' }}>{(item.metrics.cashOnCash * 100).toFixed(1)}%</span>
                    <span style={{ fontSize: '10px', color: '#6b7280' }}>Return on Cash</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#7c2d12', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '600' }}>${item.metrics.estimatedRent.toLocaleString()}/mo</span>
                    <span style={{ fontSize: '10px', color: '#6b7280' }}>Monthly Rent</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#be185d', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '600' }}>${item.metrics.annualNOI.toLocaleString()}</span>
                    <span style={{ fontSize: '10px', color: '#6b7280' }}>Annual Profit</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#1e40af', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '600' }}>${item.metrics.projectedValueYearN.toLocaleString()}</span>
                    <span style={{ fontSize: '10px', color: '#6b7280' }}>Value in 5 Years</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#166534', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '600' }}>{(((item.metrics.projectedValueYearN - item.property.listPrice) / item.property.listPrice) * 100).toFixed(1)}%</span>
                    <span style={{ fontSize: '10px', color: '#6b7280' }}>5yr Gain</span>
                  </div>
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  padding: '8px 12px',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  background: item.score >= 75 ? '#dcfce7' : item.score >= 50 ? '#fef3c7' : '#fee2e2',
                  color: item.score >= 75 ? '#166534' : item.score >= 50 ? '#92400e' : '#991b1b',
                  textAlign: 'center'
                }}>
                  Score: {item.score}/100
                </div>
                {item.property.externalUrl && (
                  <a
                    href={item.property.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      background: '#3b82f6',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    View Listing →
                  </a>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => toggleFavorite(item.property.id)}
                  style={{
                    padding: '8px',
                    background: favorites.has(item.property.id) ? '#dc2626' : '#f3f4f6',
                    color: favorites.has(item.property.id) ? 'white' : '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {favorites.has(item.property.id) ? '❤️' : '🤍'}
                </button>
                
                <button
                  onClick={() => toggleComparison(item.property.id)}
                  disabled={!selectedForComparison.has(item.property.id) && selectedForComparison.size >= 3}
                  style={{
                    padding: '8px',
                    background: selectedForComparison.has(item.property.id) ? '#059669' : '#f3f4f6',
                    color: selectedForComparison.has(item.property.id) ? 'white' : '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    opacity: (!selectedForComparison.has(item.property.id) && selectedForComparison.size >= 3) ? 0.5 : 1
                  }}
                >
                  {selectedForComparison.has(item.property.id) ? '✓' : '+'}
                </button>
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
    </>
  );
}