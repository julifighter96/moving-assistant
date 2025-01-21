// services/adminService.js
import axios from 'axios';

const BASE_URL = '/moving-assistant/api/admin';

let priceCache = null;

export const adminService = {
  async addRoom(name) {
    // Add leading slash if missing in API_URL
    const url = BASE_URL.endsWith('/') 
      ? `${BASE_URL}rooms`
      : `${BASE_URL}/rooms`;
      
    const response = await axios.post(url, { name });
    return response.data;
  },

  async getRooms() {
    const response = await fetch(`${BASE_URL}/rooms`);
    if (!response.ok) throw new Error('Failed to fetch rooms');
    return response.json();
  },

  async getItems(room) {
    const response = await fetch(`${BASE_URL}/items/${room}`);
    if (!response.ok) throw new Error('Failed to fetch items');
    return response.json();
  },

  async addItem(item) {
    return await axios.post(`${BASE_URL}/items`, {
      name: item.name,
      volume: item.volume,
      width: item.width,
      length: item.length,
      height: item.height
    });
  },
  
  async updateItem(id, item) {
    return await axios.put(`${BASE_URL}/items/${id}`, {
      name: item.name,
      volume: item.volume,
      width: item.width,
      length: item.length,
      height: item.height
    });
  },
  async getPrices() {
    try {
      console.log('Fetching prices...');
      const response = await axios.get(`${BASE_URL}/prices`);
      console.log('Prices response:', response.data);
      // Sicherstellen dass wir ein Array zurückgeben
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching prices:', error);
      return [];
    }
  },

  async updatePrice(id, price) {
    try {
      const response = await axios.put(`${BASE_URL}/prices/${id}`, { price });
      return response.data;
    } catch (error) {
      console.error('Error updating price:', error);
      throw error;
    }
  },

  getCachedPrices() {
    return priceCache;
  }
};