/**
 * Traccar API Service for Moving Assistant
 * GPS tracking and fleet management integration
 */

const axios = require('axios');

class TraccarService {
    constructor(config) {
        this.baseURL = config.baseURL;
        this.debug = config.debug || false;
        
        // Axios instance with default configuration
        this.api = axios.create({
            baseURL: this.baseURL.endsWith('/') ? this.baseURL : this.baseURL + '/',
            timeout: 10000,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        // Setup authentication
        this.setupAuth(config);
        
        // Request/Response interceptors for debugging
        if (this.debug) {
            this.setupInterceptors();
        }
    }

    setupAuth(config) {
        if (config.apiKey) {
            // API Key authentication as default
            this.api.defaults.headers.common['Authorization'] = `Bearer ${config.apiKey}`;
        } else if (config.username && config.password) {
            // Basic Auth as fallback
            const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
            this.api.defaults.headers.common['Authorization'] = `Basic ${auth}`;
        }
    }

    setupInterceptors() {
        // Request Interceptor
        this.api.interceptors.request.use(request => {
            console.log(`🚀 ${request.method?.toUpperCase()} ${request.url}`);
            return request;
        });

        // Response Interceptor
        this.api.interceptors.response.use(
            response => {
                console.log(`✅ ${response.status} ${response.statusText}`);
                return response;
            },
            error => {
                console.error(`❌ ${error.response?.status || 'NETWORK'} ${error.response?.statusText || error.message}`);
                return Promise.reject(error);
            }
        );
    }

    // Authentication
    async testConnection() {
        try {
            console.log('🔍 Testing Traccar connection...');
            const response = await this.api.get('devices');
            console.log('✅ Connection successful');
            console.log(`📱 ${response.data.length} devices available`);
            return { 
                success: true, 
                message: 'Connection successful', 
                deviceCount: response.data.length 
            };
        } catch (error) {
            console.error('❌ Connection failed:', error.response?.status, error.response?.statusText);
            throw error;
        }
    }

    // Devices Management
    async getDevices() {
        try {
            const response = await this.api.get('devices');
            console.log(`📱 ${response.data.length} devices found`);
            return response.data.map(device => ({
                id: device.id,
                name: device.name,
                uniqueId: device.uniqueId,
                status: device.status,
                lastUpdate: device.lastUpdate,
                category: device.category,
                model: device.model,
                contact: device.contact,
                phone: device.phone,
                attributes: device.attributes
            }));
        } catch (error) {
            console.error('❌ Error fetching devices:', error.response?.data || error.message);
            throw error;
        }
    }

    async getDevice(id) {
        try {
            const response = await this.api.get(`devices/${id}`);
            console.log(`📱 Device ${id} retrieved`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching device ${id}:`, error.response?.data || error.message);
            throw error;
        }
    }

    async getDeviceStatus(id) {
        try {
            const device = await this.getDevice(id);
            const positions = await this.getDevicePositions(id, null, null, 1);
            
            return {
                id: device.id,
                name: device.name,
                status: device.status,
                online: device.status === 'online',
                lastUpdate: device.lastUpdate,
                lastPosition: positions[0] || null,
                attributes: device.attributes
            };
        } catch (error) {
            console.error(`❌ Error fetching device status ${id}:`, error.response?.data || error.message);
            throw error;
        }
    }

    // Positions
    async getDevicePositions(deviceId, from = null, to = null, limit = 100) {
        try {
            const params = { deviceId };
            
            if (from) params.from = from;
            if (to) params.to = to;
            if (limit) params.limit = limit;
            
            const response = await this.api.get('positions', { params });
            console.log(`📍 ${response.data.length} positions found for device ${deviceId}`);
            
            return response.data.map(position => ({
                id: position.id,
                deviceId: position.deviceId,
                protocol: position.protocol,
                serverTime: position.serverTime,
                deviceTime: position.deviceTime,
                fixTime: position.fixTime,
                outdated: position.outdated,
                valid: position.valid,
                latitude: position.latitude,
                longitude: position.longitude,
                altitude: position.altitude,
                speed: position.speed,
                course: position.course,
                address: position.address,
                accuracy: position.accuracy,
                network: position.network,
                attributes: position.attributes
            }));
        } catch (error) {
            console.error(`❌ Error fetching positions for device ${deviceId}:`, error.response?.data || error.message);
            throw error;
        }
    }

    async getLatestPositions() {
        try {
            const response = await this.api.get('positions');
            console.log(`📍 ${response.data.length} latest positions retrieved`);
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching latest positions:', error.response?.data || error.message);
            throw error;
        }
    }

    // Reports
    async getRouteReport(deviceId, from, to) {
        try {
            const params = {
                deviceId,
                from,
                to,
                type: 'route'
            };
            
            const response = await this.api.get('reports/route', { params });
            console.log(`📊 Route report generated for device ${deviceId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error generating route report for device ${deviceId}:`, error.response?.data || error.message);
            throw error;
        }
    }

    async getTripReport(deviceId, from, to) {
        try {
            const params = {
                deviceId,
                from,
                to,
                type: 'trips'
            };
            
            const response = await this.api.get('reports/trips', { params });
            console.log(`📊 Trip report generated for device ${deviceId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error generating trip report for device ${deviceId}:`, error.response?.data || error.message);
            throw error;
        }
    }

    async getStopsReport(deviceId, from, to) {
        try {
            const params = {
                deviceId,
                from,
                to,
                type: 'stops'
            };
            
            const response = await this.api.get('reports/stops', { params });
            console.log(`📊 Stops report generated for device ${deviceId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error generating stops report for device ${deviceId}:`, error.response?.data || error.message);
            throw error;
        }
    }

    // Events
    async getEvents(deviceId, from, to, type = null) {
        try {
            const params = { deviceId, from, to };
            if (type) params.type = type;
            
            const response = await this.api.get('events', { params });
            console.log(`📅 ${response.data.length} events found for device ${deviceId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching events for device ${deviceId}:`, error.response?.data || error.message);
            throw error;
        }
    }

    // Geofences
    async getGeofences() {
        try {
            const response = await this.api.get('geofences');
            console.log(`🗺️ ${response.data.length} geofences found`);
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching geofences:', error.response?.data || error.message);
            throw error;
        }
    }

    // Groups
    async getGroups() {
        try {
            const response = await this.api.get('groups');
            console.log(`👥 ${response.data.length} groups found`);
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching groups:', error.response?.data || error.message);
            throw error;
        }
    }

    // Users
    async getUsers() {
        try {
            const response = await this.api.get('users');
            console.log(`👤 ${response.data.length} users found`);
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching users:', error.response?.data || error.message);
            throw error;
        }
    }

    // Statistics
    async getStatistics() {
        try {
            const response = await this.api.get('statistics');
            console.log('📈 Statistics retrieved');
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching statistics:', error.response?.data || error.message);
            throw error;
        }
    }

    // Helper methods for Moving Assistant specific functionality
    async getMovingTrucks() {
        try {
            const devices = await this.getDevices();
            // Keine Filterung - zeige alle Geräte als Fahrzeuge
            console.log(`📱 Alle ${devices.length} Geräte werden als Fahrzeuge angezeigt`);
            return devices;
        } catch (error) {
            console.error('❌ Error fetching moving trucks:', error.message);
            throw error;
        }
    }

    async getActiveMovingTrucks() {
        try {
            const trucks = await this.getMovingTrucks();
            const allTrucks = [];
            
            for (const truck of trucks) {
                const status = await this.getDeviceStatus(truck.id);
                // Zeige alle Fahrzeuge, egal ob online oder offline
                allTrucks.push({
                    ...truck,
                    status: status,
                    lastPosition: status.lastPosition || null
                });
            }
            
            console.log(`🚛 ${allTrucks.length} Fahrzeuge gefunden (online und offline)`);
            return allTrucks;
        } catch (error) {
            console.error('❌ Error fetching active moving trucks:', error.message);
            throw error;
        }
    }

    async getTruckRoute(truckId, date) {
        try {
            const from = new Date(date);
            from.setHours(0, 0, 0, 0);
            
            const to = new Date(date);
            to.setHours(23, 59, 59, 999);
            
            const positions = await this.getDevicePositions(
                truckId, 
                from.toISOString(), 
                to.toISOString()
            );
            
            console.log(`🗺️ Retrieved ${positions.length} positions for truck ${truckId} on ${date}`);
            return positions;
        } catch (error) {
            console.error(`❌ Error fetching truck route for ${truckId}:`, error.message);
            throw error;
        }
    }
}

module.exports = TraccarService;
