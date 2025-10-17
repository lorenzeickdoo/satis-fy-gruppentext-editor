import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_BASE_URL = 'https://api.satis-fy.com/api/v1';
const BEARER_TOKEN = process.env.API_BEARER_TOKEN;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Validate Bearer token is configured
  if (!BEARER_TOKEN) {
    return res.status(500).json({
      error: 'API_BEARER_TOKEN is not configured on the server'
    });
  }

  // Extract the path from the query parameter
  const { path } = req.query;
  const apiPath = Array.isArray(path) ? path.join('/') : path || '';

  // Construct the full API URL
  const apiUrl = `${API_BASE_URL}/easyjob/grouptext/${apiPath}`;

  try {
    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${BEARER_TOKEN}`,
      },
    };

    // Add body for PATCH/POST requests
    if (req.method === 'PATCH' || req.method === 'POST') {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Content-Type': 'application/json',
      };
      fetchOptions.body = JSON.stringify(req.body);
    }

    // Make the proxied request
    const response = await fetch(apiUrl, fetchOptions);

    // Get response text first to handle empty responses
    const text = await response.text();

    // Set status code
    res.status(response.status);

    // Return JSON if there's content, otherwise success message
    if (text) {
      const data = JSON.parse(text);
      return res.json(data);
    } else {
      return res.json({ success: true });
    }
  } catch (error: any) {
    console.error('SATIS&FY API Proxy Error:', error);
    return res.status(500).json({
      error: 'Failed to proxy request to SATIS&FY API',
      message: error.message
    });
  }
}
