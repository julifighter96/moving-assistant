import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_PIPEDRIVE_API_URL,
  params: { api_token: process.env.REACT_APP_PIPEDRIVE_API_TOKEN }
});

export const getDeal = async (dealId) => {
  try {
    console.log(`Fetching deal with IDblalala: ${dealId}`);
    const response = await api.get(`/deals/${dealId}`);
    console.log('API response:', response.data);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch deal');
    }
    
    if (!response.data.data) {
      throw new Error('No deal data found');
    }
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching deal:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

export const addNoteToDeal = async (dealId, content) => {
  try {
    const response = await api.post('/notes', {
      content,
      deal_id: dealId
    });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to add note to deal');
    }
    return response.data;
  } catch (error) {
    console.error('Error adding note to deal:', error);
    throw error;
  }
};