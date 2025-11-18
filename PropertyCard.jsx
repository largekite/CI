import React from 'react';

const PropertyCard = ({ property }) => {
  const formatPrice = (price) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(price);

  return (
    <div className="property-card">
      <img src={property.primary_photo.href} alt="Property" className="property-image" />
      
      <div className="property-content">
        <div className="price">{formatPrice(property.list_price)}</div>
        
        <div className="address">
          {property.location.address.line}, {property.location.address.city}, {property.location.address.state_code} {property.location.address.postal_code}
        </div>
        
        <div className="property-details">
          <span>{property.description.beds} beds</span>
          <span>{property.description.baths} baths</span>
          <span>{property.description.sqft?.toLocaleString()} sqft</span>
        </div>
        
        <div className="agent-info">
          <strong>{property.advertisers[0].name}</strong>
          <div>{property.branding[0].name}</div>
        </div>
        
        {property.virtual_tours?.length > 0 && (
          <a href={property.virtual_tours[0].href} target="_blank" rel="noopener noreferrer" className="virtual-tour">
            Virtual Tour
          </a>
        )}
      </div>
    </div>
  );
};

export default PropertyCard;