// services/adminService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

let priceCache = null;

// Funktion zur Berechnung des Volumens basierend auf Dimensionen
const calculateVolume = (item) => {
  if (!item.width || !item.length || !item.height) {
    return 0;
  }
  // Umrechnung von cm³ in m³
  return (item.width * item.length * item.height) / 1000000;
};

// Helper function to get the authentication token from localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

// Helper function to create headers with authentication
const getAuthHeaders = () => {
  return { 
    headers: { 
      Authorization: `Bearer ${getToken()}` 
    }
  };
};

export const adminService = {
  async addRoom(name) {
    // Add leading slash if missing in API_URL
    const url = API_URL.endsWith('/') 
      ? `${API_URL}admin/rooms`
      : `${API_URL}/admin/rooms`;
      
    const response = await axios.post(url, { name }, getAuthHeaders());
    return response.data;
  },

  async getRooms() {
    try {
      const response = await axios.get(`${API_URL}/admin/rooms`, getAuthHeaders());
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching rooms:', error.response || error);
      return [];
    }
  },

  async getItems(room) {
    try {
      const response = await axios.get(
        `${API_URL}/admin/items`, 
        { 
          ...getAuthHeaders(),
          params: { room }
        }
      );
      
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
    return await axios.post(
      `${API_URL}/admin/items`, 
      {
        name: item.name,
        volume: item.volume || calculateVolume(item),
        width: item.width || 0,
        length: item.length || 0,
        height: item.height || 0,
        setupTime: item.setupTime || 0,
        dismantleTime: item.dismantleTime || 0,
        room: item.room 
      }, 
      getAuthHeaders()
    );
  },
  
  async updateItem(id, item) {
    return await axios.put(
      `${API_URL}/admin/items/${id}`, 
      {
        name: item.name,
        volume: item.volume || calculateVolume(item),
        width: item.width || 0,
        length: item.length || 0,
        height: item.height || 0,
        setupTime: item.setupTime || 0,
        dismantleTime: item.dismantleTime || 0
      }, 
      getAuthHeaders()
    );
  },
  
  async getPrices() {
    try {
      const response = await axios.get(`${API_URL}/admin/prices`, getAuthHeaders());
      // Sicherstellen dass wir ein Array zurückgeben
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching prices:', error);
      return [];
    }
  },

  async updatePrice(id, priceData) {
    try {
      const response = await axios.put(`${API_URL}/admin/prices/${id}`, priceData, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error updating price:', error);
      throw error;
    }
  },

  getCachedPrices() {
    return priceCache;
  },

  // Add a new price (for hourly rates or loading times)
  async addPrice(priceData) {
    try {
      const response = await axios.post(`${API_URL}/admin/prices`, priceData, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error adding price:', error);
      throw error;
    }
  },

  // Check if a price with the given name already exists
  async checkPriceExists(name) {
    try {
      const response = await axios.get(
        `${API_URL}/admin/prices/check`, 
        {
          ...getAuthHeaders(),
          params: { name }
        }
      );
      return response.data.exists;
    } catch (error) {
      console.error('Error checking if price exists:', error);
      return false; // Assume it doesn't exist if there's an error
    }
  }
};