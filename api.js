const API_CONFIG = {
  baseURL: 'https://realtor.p.rapidapi.com',
  headers: {
    'X-RapidAPI-Key': 'YOUR_API_KEY',
    'X-RapidAPI-Host': 'realtor.p.rapidapi.com'
  }
};

export const searchProperties = async (params) => {
  const queryParams = new URLSearchParams({
    city: params.city || 'Los Angeles',
    state_code: params.state_code || 'CA',
    limit: params.limit || '20',
    offset: params.offset || '0',
    sort: params.sort || 'relevance'
  });

  const response = await fetch(`${API_CONFIG.baseURL}/properties/v2/list-for-sale?${queryParams}`, {
    headers: API_CONFIG.headers
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};