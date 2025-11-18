'use client';

import { useState } from 'react';

export default function SimpleInvestmentFinder() {
  const [form, setForm] = useState({
    zip: '',
    minPrice: '',
    maxPrice: '',
    strategy: 'CASH_FLOW'
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/investment-properties/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zip: form.zip,
          minPrice: form.minPrice ? Number(form.minPrice) : undefined,
          maxPrice: form.maxPrice ? Number(form.maxPrice) : undefined,
          strategy: form.strategy,
          timeHorizonYears: 5
        })
      });
      
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px', color: '#1f2937' }}>Investment Property Finder</h1>
      
      <form onSubmit={handleSubmit} style={{ 
        background: 'white', 
        padding: '30px', 
        borderRadius: '12px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              ZIP Code
            </label>
            <input
              type="text"
              value={form.zip}
              onChange={(e) => setForm({...form, zip: e.target.value})}
              placeholder="63040"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Min Price
            </label>
            <input
              type="number"
              value={form.minPrice}
              onChange={(e) => setForm({...form, minPrice: e.target.value})}
              placeholder="200000"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Max Price
            </label>
            <input
              type="number"
              value={form.maxPrice}
              onChange={(e) => setForm({...form, maxPrice: e.target.value})}
              placeholder="500000"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
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
              <option value="CASH_FLOW">Buy & Hold Rental</option>
              <option value="APPRECIATION">Appreciation</option>
              <option value="SHORT_TERM_RENTAL">Short-Term Rental</option>
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
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Searching...' : 'Find Properties'}
        </button>
      </form>

      {results.length > 0 && (
        <div style={{ display: 'grid', gap: '20px' }}>
          {results.map((item) => (
            <div key={item.property.id} style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'grid',
              gridTemplateColumns: '200px 1fr auto',
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
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#1f2937' }}>
                  {item.property.address}
                </h3>
                <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>
                  {item.property.city}, {item.property.state} {item.property.zip}
                </p>
                <p style={{ margin: '0', fontSize: '14px', color: '#374151' }}>
                  {item.property.beds} beds • {item.property.baths} baths • {item.property.sqft?.toLocaleString()} sqft
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
                  ${item.property.listPrice.toLocaleString()}
                </div>
                <div style={{ fontSize: '14px', color: '#059669', marginBottom: '4px' }}>
                  Cap Rate: {(item.metrics.capRate * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: '14px', color: '#0891b2' }}>
                  Score: {item.score}/100
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}