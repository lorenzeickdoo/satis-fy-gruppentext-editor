import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_BASE_URL = 'https://api.satis-fy.com/api/v1';
const BEARER_TOKEN = process.env.API_BEARER_TOKEN;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow PATCH requests
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed. Use PATCH.' });
  }

  // Validate Bearer token is configured
  if (!BEARER_TOKEN) {
    return res.status(500).json({
      error: 'API_BEARER_TOKEN is not configured on the server'
    });
  }

  // Construct the full API URL
  const apiUrl = `${API_BASE_URL}/easyjob/grouptext/updateGroupText`;

  try {
    // Make the proxied request
    const response = await fetch(apiUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${BEARER_TOKEN}`,
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `SATIS&FY API Error: ${response.status}`,
        message: errorText
      });
    }

    // Check if response has content before parsing JSON
    const text = await response.text();
    if (text) {
      const data = JSON.parse(text);
      return res.status(200).json(data);
    } else {
      return res.status(200).json({ success: true });
    }
  } catch (error: any) {
    console.error('SATIS&FY API Proxy Error:', error);
    return res.status(500).json({
      error: 'Failed to proxy request to SATIS&FY API',
      message: error.message
    });
  }
}
