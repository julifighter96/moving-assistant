/**
 * HERE Routing API v8 Service for Moving Assistant
 * Adapted from Traccar integration for the Moving Assistant project
 */

const axios = require('axios');

class HereRoutingService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://router.hereapi.com/v8';
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    /**
     * Calculate routes using GET method
     * @param {Object} params - Routing parameters
     * @returns {Promise<Object>} Route response
     */
    async calculateRoutes(params) {
        try {
            const queryParams = this.buildQueryParams(params);
            queryParams.apikey = this.apiKey;
            
            console.log('HERE API Request Parameters:', JSON.stringify(queryParams, null, 2));
            
            const response = await axios.get(`${this.baseUrl}/routes`, {
                params: queryParams,
                headers: this.defaultHeaders
            });
            return response.data;
        } catch (error) {
            console.error('HERE Routing API Error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Build query parameters for the API request
     */
    buildQueryParams(params) {
        const queryParams = {};

        // Required parameters
        if (params.transportMode) queryParams.transportMode = params.transportMode;
        if (params.origin) queryParams.origin = params.origin;
        if (params.destination) queryParams.destination = params.destination;

        // Optional parameters
        if (params.via) {
            queryParams.via = Array.isArray(params.via) ? params.via : [params.via];
        }
        if (params.departureTime) queryParams.departureTime = params.departureTime;
        if (params.arrivalTime) queryParams.arrivalTime = params.arrivalTime;
        if (params.routingMode) queryParams.routingMode = params.routingMode;
        if (params.alternatives !== undefined) queryParams.alternatives = params.alternatives;
        if (params.units) queryParams.units = params.units;
        if (params.lang) queryParams.lang = params.lang;
        if (params.return) {
            queryParams.return = Array.isArray(params.return) ? params.return.join(',') : params.return;
        }
        if (params.spans) {
            queryParams.spans = Array.isArray(params.spans) ? params.spans.join(',') : params.spans;
        }

        // Vehicle parameters
        if (params.vehicle) {
            Object.keys(params.vehicle).forEach(key => {
                queryParams[`vehicle[${key}]`] = params.vehicle[key];
            });
        }

        // Traffic parameters
        if (params.traffic) {
            Object.keys(params.traffic).forEach(key => {
                queryParams[`traffic[${key}]`] = params.traffic[key];
            });
        }

        // Avoid parameters
        if (params.avoid) {
            Object.keys(params.avoid).forEach(key => {
                queryParams[`avoid[${key}]`] = params.avoid[key];
            });
        }

        return queryParams;
    }

    /**
     * Calculate car route with simplified parameters
     */
    async calculateCarRoute(options) {
        const params = {
            transportMode: 'car',
            origin: options.origin,
            destination: options.destination,
            via: options.via,
            alternatives: options.alternatives || 0,
            return: options.return || ['polyline', 'summary', 'instructions'],
            ...options
        };
        return this.calculateRoutes(params);
    }

    /**
     * Calculate truck route with truck-specific parameters
     */
    async calculateTruckRoute(options) {
        const params = {
            transportMode: 'truck',
            origin: options.origin,
            destination: options.destination,
            via: options.via,
            alternatives: options.alternatives || 0,
            return: options.return || ['polyline', 'summary', 'instructions'],
            vehicle: {
                type: 'truck',
                height: options.height || 400, // cm
                width: options.width || 250,   // cm
                length: options.length || 1200, // cm
                grossWeight: options.grossWeight || 7500, // kg
                ...options.vehicle
            },
            ...options
        };
        return this.calculateRoutes(params);
    }

    /**
     * Parse route response to extract useful information
     */
    parseRouteResponse(response) {
        if (!response.routes || response.routes.length === 0) {
            throw new Error('No routes found in response');
        }

        const route = response.routes[0];
        const summary = route.summary || {};
        
        return {
            distance: summary.length || 0, // meters
            duration: summary.duration || 0, // seconds
            polyline: route.polyline,
            instructions: route.instructions || [],
            sections: route.sections || [],
            summary: {
                distance: summary.length || 0,
                duration: summary.duration || 0,
                baseDuration: summary.baseDuration || 0,
                flags: summary.flags || [],
                text: summary.text || ''
            }
        };
    }

    /**
     * Calculate route for moving/relocation purposes
     * Optimized for moving trucks and logistics
     */
    async calculateMovingRoute(options) {
        const {
            origin,
            destination,
            via = [],
            truckSpecs = {},
            avoidTolls = false,
            avoidFerries = false,
            departureTime
        } = options;

        const params = {
            transportMode: 'truck',
            origin,
            destination,
            via,
            departureTime,
            return: ['polyline', 'summary', 'instructions', 'actions'],
            vehicle: {
                type: 'truck',
                height: truckSpecs.height || 350, // cm - standard moving truck
                width: truckSpecs.width || 245,   // cm
                length: truckSpecs.length || 750, // cm
                grossWeight: truckSpecs.weight || 7500, // kg
                ...truckSpecs
            },
            avoid: {
                features: [
                    ...(avoidTolls ? ['tollRoad'] : []),
                    ...(avoidFerries ? ['ferry'] : []),
                    'tunnel' // Generally avoid tunnels for large trucks
                ].join(',')
            },
            traffic: {
                mode: 'enabled'
            }
        };

        const response = await this.calculateRoutes(params);
        return this.parseRouteResponse(response);
    }

    /**
     * Calculate multiple routes for tour optimization
     */
    async calculateMultipleRoutes(routeRequests) {
        const promises = routeRequests.map(request => 
            this.calculateRoutes(request).catch(error => ({
                error: error.message,
                request
            }))
        );
        
        return Promise.all(promises);
    }
}

module.exports = HereRoutingService;
