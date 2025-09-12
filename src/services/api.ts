import { ApiResponse } from '../types/api';

const API_BASE_URL = 'https://api.satis-fy.com/api/v1/easyjob/grouptext/getGroupText';
const UPDATE_API_URL = 'https://api.satis-fy.com/api/v1/easyjob/grouptext/updateGroupText';
const BEARER_TOKEN = '96|9FmooTPmfJcyF4xbA1iuOsOVRHTiBQAYjg0rPRdI52bff494';

export const fetchGroupTextData = async (jobNumber: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${jobNumber}`, {
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
    const response = await fetch(UPDATE_API_URL, {
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