import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_PIPEDRIVE_API_URL,
  params: { api_token: process.env.REACT_APP_PIPEDRIVE_API_TOKEN }
});

export const getDeal = async (dealId) => {
  try {
    const response = await api.get(`/deals/${dealId}`);
    return response.data;  // Return the entire response data, not just data.data
  } catch (error) {
    console.error('Error fetching deal:', error);
    throw error;
  }
};