import { ApiResponse } from '../types/api';

// Read API configuration from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BEARER_TOKEN = import.meta.env.VITE_API_BEARER_TOKEN;

// Validate required environment variables
if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not configured in environment variables');
}
if (!BEARER_TOKEN) {
  throw new Error('VITE_API_BEARER_TOKEN is not configured in environment variables');
}

// Construct API endpoints
const GET_GROUP_TEXT_URL = `${API_BASE_URL}/easyjob/grouptext/getGroupText`;
const UPDATE_GROUP_TEXT_URL = `${API_BASE_URL}/easyjob/grouptext/updateGroupText`;

export const fetchGroupTextData = async (jobNumber: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${GET_GROUP_TEXT_URL}/${jobNumber}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${BEARER_TOKEN}`,
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage += ` - ${errorData.message}`;
        }
      } catch (parseError) {
        // If we can't parse the error response, use the generic message
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching group text data:', error);
    throw error;
  }
};

export const updateGroupText = async (groupId: number, clientText: string): Promise<any> => {
  try {
    const response = await fetch(UPDATE_GROUP_TEXT_URL, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${BEARER_TOKEN}`,
      },
      body: JSON.stringify({
        groupId: groupId,
        clientText: clientText
      })
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage += ` - ${errorData.message}`;
        }
      } catch (parseError) {
        // If we can't parse the error response, use the generic message
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating group text:', error);
    throw error;
  }
};