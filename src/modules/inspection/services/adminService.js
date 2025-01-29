// services/adminService.js
import axios from 'axios';

const BASE_URL = '/api/admin';

let priceCache = null;

export const adminService = {
  async addRoom(name) {
    try {
      console.log('Adding room:', name);
      const response = await fetch(`${BASE_URL}/rooms`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding room:', error);
      throw error;
    }
  },

  async getRooms() {
    try {
      console.log('Fetching rooms from:', `${BASE_URL}/rooms`);
      const response = await fetch(`${BASE_URL}/rooms`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw rooms response:', data);
      
      if (!data.rooms) {
        console.warn('No rooms property in response:', data);
        return [];
      }

      console.log('Returning rooms:', data.rooms);
      return data.rooms;
    } catch (error) {
      console.error('Error fetching rooms:', error);
      throw error;
    }
  },

  async getItems(room) {
    try {
      console.log('Fetching items for room:', room);
      const response = await fetch(`${BASE_URL}/items/${room}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Items response:', data);
      return data || [];
    } catch (error) {
      console.error('Error fetching items:', error);
      throw new Error('Failed to fetch items');
    }
  },

  async addItem(item) {
    try {
      const response = await fetch(`${BASE_URL}/items`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(item)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding item:', error);
      throw error;
    }
  },
  
  async updateItem(id, item) {
    try {
      const response = await fetch(`${BASE_URL}/items/${id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(item)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  },
  async getPrices() {
    try {
      console.log('Fetching prices...');
      const response = await fetch(`${BASE_URL}/prices`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Prices response:', data);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching prices:', error);
      return [];
    }
  },

  async updatePrice(id, price) {
    try {
      const response = await fetch(`${BASE_URL}/prices/${id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ price })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
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
      const response = await fetch(`${BASE_URL}/rooms`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Configuration response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching configuration:', error);
      throw error;
    }
  },

  async saveConfiguration(config) {
    try {
      const response = await fetch(`${BASE_URL}/rooms/bulk`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving admin configuration:', error);
      throw error;
    }
  }
};