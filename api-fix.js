// Correct Realtor API endpoint
const searchInvestmentProperties = async (params) => {
  const queryParams = new URLSearchParams({
    postal_code: params.zip,
    status: 'for_sale',
    limit: '20',
    sort: 'relevance',
    ...(params.minPrice && { price_min: params.minPrice }),
    ...(params.maxPrice && { price_max: params.maxPrice }),
    ...(params.minBeds && { beds_min: params.minBeds }),
    ...(params.minBaths && { baths_min: params.minBaths })
  });

  const response = await fetch(`https://realtor.p.rapidapi.com/properties/v3/list?${queryParams}`, {
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'realtor.p.rapidapi.com'
    }
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
};

export default searchInvestmentProperties;