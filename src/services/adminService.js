// services/adminService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

let priceCache = null;

export const adminService = {
  async getRooms() {
    const response = await axios.get(`${API_URL}/api/admin/rooms`);
    return response.data;
  },

  async addRoom(name) {
    const response = await axios.post(`${API_URL}/api/admin/rooms`, { name });
    return response.data;
  },

  async getItems(room) {
    const response = await axios.get(`${API_URL}/api/admin/items`, { 
      params: { room } 
    });
    return response.data;
  },

  async addItem(item) {
    const response = await axios.post(`${API_URL}/api/admin/items`, item);
    return response.data;
  },
  async updateItem(id, item) {
    const response = await axios.put(`${API_URL}/api/admin/items/${id}`, {
      name: item.name,
      volume: item.volume
    });
    return response.data;
  },
  async getPrices() {
    const response = await axios.get(`${API_URL}/api/admin/prices`);
    return response.data;
  },

  async getPrices() {
    const response = await axios.get(`${API_URL}/api/admin/prices`);
    priceCache = response.data;
    return response.data;
  },

  getCachedPrices() {
    return priceCache;
  }
};