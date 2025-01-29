import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_PIPEDRIVE_API_URL,
  params: { api_token: process.env.REACT_APP_PIPEDRIVE_API_TOKEN }
});

export const pipedriveService = {
  async getDeal(dealId) {
    if (!dealId) {
      throw new Error('No deal ID provided');
    }

    // Ensure dealId is a string and validate it
    const id = dealId?.toString();
    if (!id || id === '[object Object]') {
      throw new Error('Invalid deal ID');
    }

    try {
      console.log(`Fetching deal with ID: ${id}`);
      const response = await api.get(`/deals/${id}`);
      
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
  },

  async addNoteToDeal(dealId, content) {
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
  }
};

// For backward compatibility
export const getDeal = pipedriveService.getDeal;
export const addNoteToDeal = pipedriveService.addNoteToDeal;