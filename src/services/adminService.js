// services/adminService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

let priceCache = null;

export const adminService = {
  async addRoom(name) {
    // Add leading slash if missing in API_URL
    const url = API_URL.endsWith('/') 
      ? `${API_URL}admin/rooms`
      : `${API_URL}/admin/rooms`;
      
    const response = await axios.post(url, { name });
    return response.data;
  },

  async getRooms() {
    try {
      const response = await axios.get(`${API_URL}/admin/rooms`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching rooms:', error.response || error);
      return [];
    }
  },

  async getItems(room) {
    try {
      const response = await axios.get(`${API_URL}/admin/items`, {
        params: { room }
      });
      
      if (!Array.isArray(response.data)) {
        console.warn('Response is not an array:', response.data);
        return [];
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching items for room "${room}":`, error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Status:', error.response.status);
      }
      return [];
    }
  },

  async addItem(item) {
    return await axios.post(`${API_URL}/admin/items`, {
      name: item.name,
      volume: item.volume,
      width: item.width,
      length: item.length,
      height: item.height,
      room: item.room 
    });
  },
  
  async updateItem(id, item) {
    return await axios.put(`${API_URL}/admin/items/${id}`, {
      name: item.name,
      volume: item.volume,
      width: item.width,
      length: item.length,
      height: item.height
    });
  },
  async getPrices() {
    try {
      const response = await axios.get(`${API_URL}/admin/prices`);
      // Sicherstellen dass wir ein Array zurückgeben
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching prices:', error);
      return [];
    }
  },

  // In adminService.js
async updatePrice(id, priceData) {
  try {
    const response = await axios.put(`${API_URL}/admin/prices/${id}`, priceData);
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