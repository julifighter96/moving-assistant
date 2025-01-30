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
      const response = await fetch('/api/admin/rooms');
      console.log('Admin getRooms response:', response);
      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }
      const data = await response.json();
      console.log('Admin getRooms data:', data);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error in getRooms:', error);
      return [];
    }
  },

  async getItems(roomName) {
    try {
      console.log('Getting items for room:', roomName);
      const response = await fetch(`/api/admin/items/${roomName}`);
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      const data = await response.json();
      if (data.items && typeof data.items === 'string') {
        try {
          return JSON.parse(data.items);
        } catch (e) {
          console.error('Error parsing items JSON:', e);
          return [];
        }
      }
      console.log('Items data:', data);
      return data;
    } catch (error) {
      console.error('Error in getItems:', error);
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
  },

  async getPackMaterials() {
    try {
      const response = await fetch('/api/admin/pack-materials');
      if (!response.ok) {
        throw new Error('Failed to fetch pack materials');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error in getPackMaterials:', error);
      return [];
    }
  },

  async getMaterialAssignments() {
    try {
      const response = await fetch('/api/admin/material-assignments');
      if (!response.ok) {
        throw new Error('Failed to fetch material assignments');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error in getMaterialAssignments:', error);
      return [];
    }
  },

  async getMaterialStatistics() {
    try {
      const response = await fetch('/api/admin/material-statistics');
      if (!response.ok) {
        throw new Error('Failed to fetch material statistics');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error in getMaterialStatistics:', error);
      return [];
    }
  }
};