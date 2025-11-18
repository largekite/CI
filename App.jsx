import React, { useState, useEffect } from 'react';
import PropertyCard from './PropertyCard';
import { searchProperties } from './api';
import './PropertyCard.css';

const App = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await searchProperties({ city: 'Los Angeles', state_code: 'CA' });
        setProperties(data.properties || []);
      } catch (err) {
        setError(err.message);
        // Fallback to sample data
        setProperties([sampleProperty]);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  const sampleProperty = {
    property_id: "2225916317",
    listing_id: "2988583478",
    status: "for_sale",
    photo_count: 32,
    branding: [{
      name: "COMPASS"
    }],
    location: {
      address: {
        city: "Los Angeles",
        line: "564 N Irving Blvd",
        street_name: "Irving",
        street_number: "564",
        street_suffix: "Blvd",
        country: "USA",
        postal_code: "90004",
        state_code: "CA",
        state: "California"
      },
      coordinate: {
        lat: 34.080879,
        lon: -118.318479
      }
    },
    description: {
      type: "single_family",
      beds: 2,
      baths: 1,
      lot_sqft: 5101,
      sqft: 1291,
      baths_full: 1
    },
    virtual_tours: [{
      href: "https://564nirving.com",
      matterport: false
    }],
    advertisers: [{
      name: "Carla Winnie",
      email: "CarlaWinnie@gmail.com",
      href: "http://www.carlawinnieproperties.com/",
      slogan: "Showing you the way home.",
      type: "seller"
    }],
    primary_photo: {
      href: "https://ap.rdcpix.com/fa5bd8211384eea93bc24e55271c197al-m642405395s.jpg"
    },
    list_price: 1559000,
    estimate: {
      estimate: 1686100
    },
    last_sold_date: "2018-04-13",
    list_date: "2025-11-14T18:00:40.000000Z",
    last_sold_price: 1400000
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading properties...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1>Property Listings</h1>
      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }}>
        {properties.map(property => (
          <PropertyCard key={property.property_id} property={property} />
        ))}
      </div>
    </div>
  );
};

export default App;