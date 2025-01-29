// services/adminService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;
const BASE_URL = `${API_URL}/admin`;

let priceCache = null;

export const adminService = {
  async addRoom(name) {
    try {
      console.log('Adding room:', name);
      const response = await axios.post(`${BASE_URL}/rooms`, { name });
      return response.data;
    } catch (error) {
      console.error('Error adding room:', error);
      throw error;
    }
  },

  async getRooms() {
    try {
      console.log('Fetching rooms from:', `${BASE_URL}/rooms`);
      const response = await axios.get(`${BASE_URL}/rooms`);
      console.log('Rooms response:', response.data);
      return response.data.rooms || [];
    } catch (error) {
      console.error('Error fetching rooms:', error.response || error);
      return [];
    }
  },

  async getItems(room) {
    try {
      console.log(`Fetching items for room "${room}" from ${BASE_URL}/items/${room}`);
      const response = await axios.get(`${BASE_URL}/items/${room}`);
      console.log(`Items response for room "${room}":`, response.data);
      
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
    try {
      const response = await axios.post(`${BASE_URL}/items`, {
        name: item.name,
        volume: item.volume,
        width: item.width,
        length: item.length,
        height: item.height,
        room: item.room
      });
      return response.data;
    } catch (error) {
      console.error('Error adding item:', error);
      throw error;
    }
  },
  
  async updateItem(id, item) {
    try {
      const response = await axios.put(`${BASE_URL}/items/${id}`, {
        name: item.name,
        volume: item.volume,
        width: item.width,
        length: item.length,
        height: item.height
      });
      return response.data;
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  },

  async getPrices() {
    try {
      console.log('Fetching prices...');
      const response = await axios.get(`${BASE_URL}/prices`);
      console.log('Prices response:', response.data);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching prices:', error);
      return [];
    }
  },

  async updatePrice(id, priceData) {
    try {
      const response = await axios.put(`${BASE_URL}/prices/${id}`, priceData);
      return response.data;
    } catch (error) {
      console.error('Error updating price:', error);
      throw error;
    }
  },

  getCachedPrices() {
    return priceCache;
  },

  async getConfiguration() {
    try {
      console.log('Fetching configuration...');
      const response = await axios.get(`${BASE_URL}/rooms`);
      console.log('Configuration response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching configuration:', error);
      throw error;
    }
  },

  async saveConfiguration(config) {
    try {
      const response = await axios.post(`${BASE_URL}/rooms/bulk`, config);
      return response.data;
    } catch (error) {
      console.error('Error saving configuration:', error);
      throw error;
    }
  }
};