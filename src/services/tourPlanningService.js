/**
 * Tour Planning Service for Moving Assistant Frontend
 * Handles communication with the tour planning backend APIs
 */

class TourPlanningService {
    constructor() {
        this.baseUrl = '/api/tour-planning';
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    /**
     * Add authentication token to request headers
     */
    getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            ...this.defaultHeaders,
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }

    /**
     * Make authenticated API request
     */
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: this.getAuthHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error(`Tour Planning API Error (${endpoint}):`, error);
            throw error;
        }
    }

    /**
     * Get service status and feature availability
     */
    async getStatus() {
        return this.makeRequest('/status');
    }

    /**
     * Test all integrated services
     */
    async testIntegration() {
        return this.makeRequest('/test', {
            method: 'POST'
        });
    }

    /**
     * Calculate optimized route for a single moving job
     */
    async calculateRoute(movingJob, options = {}) {
        return this.makeRequest('/calculate-route', {
            method: 'POST',
            body: JSON.stringify({
                movingJob,
                options
            })
        });
    }

    /**
     * Optimize multiple moving jobs into efficient tours
     */
    async optimizeTours(movingJobs, depot, options = {}) {
        return this.makeRequest('/optimize-tours', {
            method: 'POST',
            body: JSON.stringify({
                movingJobs,
                depot,
                options
            })
        });
    }

    /**
     * Get real-time status of all moving trucks
     */
    async getTruckStatus() {
        return this.makeRequest('/trucks/status');
    }

    /**
     * Get historical route data for a specific truck
     */
    async getTruckHistory(truckId, date) {
        return this.makeRequest(`/trucks/${truckId}/history?date=${date}`);
    }

    /**
     * Run simulation with sample data
     */
    async simulateOptimization(jobCount = 5, depot = null) {
        return this.makeRequest('/simulate-optimization', {
            method: 'POST',
            body: JSON.stringify({
                jobCount,
                depot
            })
        });
    }

    /**
     * Get current configuration
     */
    async getConfig() {
        return this.makeRequest('/config');
    }

    // Helper methods for common use cases

    /**
     * Calculate route for a deal from the main application
     */
    async calculateRouteForDeal(deal, options = {}) {
        const movingJob = {
            id: deal.id,
            pickupAddress: deal.fromAddress || deal.pickup_address,
            deliveryAddress: deal.toAddress || deal.delivery_address,
            pickupCoordinates: deal.fromCoordinates,
            deliveryCoordinates: deal.toCoordinates,
            priority: deal.priority || 3,
            inventory: deal.inventory,
            floors: deal.floors,
            truckSpecs: deal.truckSpecs,
            pickupTimeWindow: deal.pickupTimeWindow,
            deliveryTimeWindow: deal.deliveryTimeWindow
        };

        return this.calculateRoute(movingJob, options);
    }

    /**
     * Optimize tours for multiple deals
     */
    async optimizeToursForDeals(deals, companyDepot, options = {}) {
        const movingJobs = deals.map(deal => ({
            id: deal.id,
            pickupAddress: deal.fromAddress || deal.pickup_address,
            deliveryAddress: deal.toAddress || deal.delivery_address,
            pickupCoordinates: deal.fromCoordinates,
            deliveryCoordinates: deal.toCoordinates,
            priority: deal.priority || 3,
            inventory: deal.inventory,
            floors: deal.floors,
            pickupTimeWindow: deal.pickupTimeWindow,
            deliveryTimeWindow: deal.deliveryTimeWindow,
            originalDeal: deal
        }));

        return this.optimizeTours(movingJobs, companyDepot, options);
    }

    /**
     * Check if tour planning features are available
     */
    async checkFeatureAvailability() {
        try {
            const status = await this.getStatus();
            return {
                available: status.success && status.status === 'ready',
                features: status.features || {},
                services: status.services || {}
            };
        } catch (error) {
            return {
                available: false,
                error: error.message,
                features: {},
                services: {}
            };
        }
    }

    /**
     * Format distance for display
     */
    formatDistance(meters) {
        if (meters < 1000) {
            return `${Math.round(meters)}m`;
        }
        return `${(meters / 1000).toFixed(1)}km`;
    }

    /**
     * Format duration for display
     */
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}min`;
        }
        return `${minutes}min`;
    }

    /**
     * Format cost for display
     */
    formatCost(cost) {
        return `${cost.toFixed(2)}€`;
    }

    /**
     * Calculate estimated cost based on distance and time
     */
    calculateEstimatedCost(distanceMeters, durationSeconds) {
        const distanceKm = distanceMeters / 1000;
        const durationHours = durationSeconds / 3600;
        
        // Simple cost calculation
        const baseCost = 50; // Base cost per job
        const distanceCost = distanceKm * 0.50; // 0.50€ per km
        const timeCost = durationHours * 25; // 25€ per hour
        
        return baseCost + distanceCost + timeCost;
    }

    /**
     * Validate moving job data
     */
    validateMovingJob(movingJob) {
        const errors = [];
        
        if (!movingJob.pickupAddress) {
            errors.push('Pickup address is required');
        }
        
        if (!movingJob.deliveryAddress) {
            errors.push('Delivery address is required');
        }
        
        if (movingJob.pickupAddress === movingJob.deliveryAddress) {
            errors.push('Pickup and delivery addresses must be different');
        }
        
        return errors;
    }

    /**
     * Validate depot data
     */
    validateDepot(depot) {
        const errors = [];
        
        if (!depot || typeof depot !== 'object') {
            errors.push('Depot must be an object');
            return errors;
        }
        
        if (typeof depot.lat !== 'number' || depot.lat < -90 || depot.lat > 90) {
            errors.push('Valid depot latitude is required (-90 to 90)');
        }
        
        if (typeof depot.lng !== 'number' || depot.lng < -180 || depot.lng > 180) {
            errors.push('Valid depot longitude is required (-180 to 180)');
        }
        
        return errors;
    }

    /**
     * Get default depot for Berlin (fallback)
     */
    getDefaultDepot() {
        return {
            lat: 52.5200,
            lng: 13.4050,
            address: 'Berlin, Deutschland',
            name: 'Standard Depot'
        };
    }

    /**
     * Convert address string to approximate coordinates (mock implementation)
     * In production, this would use a proper geocoding service
     */
    async addressToCoordinates(address) {
        // Mock implementation - returns Berlin area coordinates
        const baseLatitude = 52.5200;
        const baseLongitude = 13.4050;
        
        // Add some variation based on address hash
        const hash = this.simpleHash(address);
        const latOffset = (hash % 100 - 50) * 0.001; // ±0.05 degrees
        const lngOffset = ((hash * 7) % 100 - 50) * 0.001;
        
        return {
            lat: baseLatitude + latOffset,
            lng: baseLongitude + lngOffset
        };
    }

    /**
     * Simple hash function for address variation
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Generate sample moving jobs for testing
     */
    generateSampleJobs(count = 5) {
        const sampleAddresses = [
            'Alexanderplatz, Berlin',
            'Potsdamer Platz, Berlin',
            'Brandenburg Gate, Berlin',
            'Checkpoint Charlie, Berlin',
            'East Side Gallery, Berlin',
            'Hackescher Markt, Berlin',
            'Kurfürstendamm, Berlin',
            'Prenzlauer Berg, Berlin',
            'Kreuzberg, Berlin',
            'Charlottenburg, Berlin'
        ];

        const jobs = [];
        for (let i = 0; i < count; i++) {
            const pickupIndex = Math.floor(Math.random() * sampleAddresses.length);
            let deliveryIndex = Math.floor(Math.random() * sampleAddresses.length);
            
            // Ensure pickup and delivery are different
            while (deliveryIndex === pickupIndex) {
                deliveryIndex = Math.floor(Math.random() * sampleAddresses.length);
            }

            jobs.push({
                id: `sample_job_${i + 1}`,
                pickupAddress: sampleAddresses[pickupIndex],
                deliveryAddress: sampleAddresses[deliveryIndex],
                priority: Math.floor(Math.random() * 5) + 1,
                inventory: {
                    totalItems: Math.floor(Math.random() * 50) + 10
                },
                floors: Math.floor(Math.random() * 4) + 1,
                estimatedVolume: Math.floor(Math.random() * 30) + 10
            });
        }

        return jobs;
    }
}

// Export singleton instance
export default new TourPlanningService();
