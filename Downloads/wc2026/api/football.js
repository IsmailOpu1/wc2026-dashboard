export default async function handler(req, res) {
  const { endpoint, ...queryParams } = req.query;
  
  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint parameter is required' });
  }

  // Construct the target URL
  const url = new URL(`https://api.football-data.org/v4/${endpoint}`);
  
  // Append any query parameters (like status, season)
  Object.keys(queryParams).forEach(key => {
    url.searchParams.append(key, queryParams[key]);
  });

  // Get the API key from Vercel's environment variables
  // We check both names just in case you named it either way in Vercel
  const apiKey = process.env.VITE_FOOTBALL_API_KEY || process.env.FOOTBALL_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: API Key missing' });
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'X-Auth-Token': apiKey
      }
    });

    const data = await response.json();
    
    // Enable Edge Caching on Vercel CDN to protect the API key from rate limits
    if (response.status === 200) {
      res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=60');
    }
    
    // Pass the exact status code from the football API (e.g., 429 if rate limited)
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
