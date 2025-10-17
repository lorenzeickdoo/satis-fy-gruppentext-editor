import { ApiResponse } from '../types/api';

// Use serverless functions as proxy to keep API tokens secure
export const fetchGroupTextData = async (jobNumber: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(`/api/satis-fy-get?jobNumber=${encodeURIComponent(jobNumber)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
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
    const response = await fetch('/api/satis-fy-update', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
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

    // Check if response has content before parsing JSON
    const text = await response.text();
    if (text) {
      return JSON.parse(text);
    }
    return { success: true };
  } catch (error) {
    console.error('Error updating group text:', error);
    throw error;
  }
};