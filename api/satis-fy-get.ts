import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_BASE_URL = 'https://api.satis-fy.com/api/v1';
const BEARER_TOKEN = process.env.API_BEARER_TOKEN;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  // Validate Bearer token is configured
  if (!BEARER_TOKEN) {
    return res.status(500).json({
      error: 'API_BEARER_TOKEN is not configured on the server'
    });
  }

  // Extract job number from query parameter
  const { jobNumber } = req.query;

  if (!jobNumber || typeof jobNumber !== 'string') {
    return res.status(400).json({
      error: 'Missing required query parameter: jobNumber'
    });
  }

  // Construct the full API URL
  const apiUrl = `${API_BASE_URL}/easyjob/grouptext/getGroupText/${jobNumber}`;

  try {
    // Make the proxied request
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${BEARER_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `SATIS&FY API Error: ${response.status}`,
        message: errorText
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('SATIS&FY API Proxy Error:', error);
    return res.status(500).json({
      error: 'Failed to proxy request to SATIS&FY API',
      message: error.message
    });
  }
}
