/**
 * Tour Planning Integration Service for Moving Assistant
 * Combines HERE Routing, HERE Tour Planning, and Traccar functionality
 * Specifically adapted for moving/relocation services
 */

const HereRoutingService = require('./hereRoutingService');
const HereTourPlanningService = require('./hereTourPlanningService');
const TraccarService = require('./traccarService');

class TourPlanningIntegrationService {
    constructor(config = {}) {
        // Initialize services with configuration
        this.hereRouting = new HereRoutingService(config.hereApiKey);
        this.hereTourPlanning = new HereTourPlanningService(config.hereApiKey);
        this.traccar = config.traccarConfig ? new TraccarService(config.traccarConfig) : null;
        
        this.config = config;
        console.log('🚚 Tour Planning Integration Service initialized');
    }

    /**
     * Calculate optimized route for a moving job
     * @param {Object} movingJob - Moving job details from the main app
     * @param {Object} options - Route options
     */
    async calculateMovingRoute(movingJob, options = {}) {
        try {
            const {
                pickupAddress,
                deliveryAddress,
                truckSpecs = {},
                departureTime,
                avoidTolls = false
            } = movingJob;

            console.log('🗺️ Calculating moving route...');
            console.log(`📍 From: ${pickupAddress}`);
            console.log(`📍 To: ${deliveryAddress}`);

            // Convert addresses to coordinates if needed
            const origin = await this.addressToCoordinates(pickupAddress);
            const destination = await this.addressToCoordinates(deliveryAddress);

            const route = await this.hereRouting.calculateMovingRoute({
                origin: `${origin.lat},${origin.lng}`,
                destination: `${destination.lat},${destination.lng}`,
                truckSpecs,
                departureTime,
                avoidTolls
            });

            return {
                success: true,
                route,
                movingJob: {
                    ...movingJob,
                    routeCalculated: true,
                    estimatedDistance: route.distance,
                    estimatedDuration: route.duration,
                    calculatedAt: new Date().toISOString()
                },
                summary: {
                    distance: `${(route.distance / 1000).toFixed(1)} km`,
                    duration: `${Math.round(route.duration / 60)} min`,
                    estimatedFuelCost: this.calculateFuelCost(route.distance),
                    tollsAvoided: avoidTolls
                }
            };
        } catch (error) {
            console.error('❌ Error calculating moving route:', error.message);
            throw error;
        }
    }

    /**
     * Optimize multiple moving jobs into efficient tours
     * @param {Array} movingJobs - Array of moving jobs
     * @param {Object} depot - Company depot/base location
     * @param {Object} options - Tour optimization options
     */
    async optimizeMovingTours(movingJobs, depot, options = {}) {
        try {
            console.log('🚚 Optimizing moving tours...');
            console.log(`📦 ${movingJobs.length} jobs to optimize`);

            // Convert moving jobs to HERE Tour Planning format
            const tourJobs = movingJobs.map((job, index) => ({
                id: job.id || `job_${index + 1}`,
                type: 'pickup_delivery',
                pickup: {
                    lat: job.pickupCoordinates?.lat || 52.5200,
                    lng: job.pickupCoordinates?.lng || 13.4050,
                    duration: this.calculatePickupDuration(job),
                    timeWindows: job.pickupTimeWindow ? [job.pickupTimeWindow] : undefined,
                    address: job.pickupAddress
                },
                delivery: {
                    lat: job.deliveryCoordinates?.lat || 52.5300,
                    lng: job.deliveryCoordinates?.lng || 13.4100,
                    duration: this.calculateDeliveryDuration(job),
                    timeWindows: job.deliveryTimeWindow ? [job.deliveryTimeWindow] : undefined,
                    address: job.deliveryAddress
                },
                priority: job.priority || 3,
                skills: ['moving', 'heavy_lifting'],
                originalJob: job
            }));

            const optimizedTour = await this.hereTourPlanning.optimizeMovingTour(tourJobs, depot, {
                ...options,
                vehicleProfile: 'truck',
                startTime: options.startTime || '2025-01-01T07:00:00Z',
                endTime: options.endTime || '2025-01-01T19:00:00Z',
                capacity: options.capacity || [50], // 50 cubic meters
                maxDistance: options.maxDistance || 300000 // 300km
            });

            // Enhance the result with moving-specific information
            const enhancedTour = await this.enhanceTourWithMovingData(optimizedTour, movingJobs);

            return {
                success: true,
                optimizedTour: enhancedTour,
                originalJobs: movingJobs,
                summary: {
                    totalJobs: movingJobs.length,
                    toursCreated: enhancedTour.tours.length,
                    totalDistance: `${(enhancedTour.summary.totalDistance / 1000).toFixed(1)} km`,
                    totalTime: `${Math.round(enhancedTour.summary.totalTime / 3600)} hours`,
                    estimatedCost: `${enhancedTour.summary.totalCost.toFixed(2)} €`,
                    trucksNeeded: enhancedTour.summary.vehiclesUsed,
                    efficiency: this.calculateTourEfficiency(enhancedTour, movingJobs)
                }
            };
        } catch (error) {
            console.error('❌ Error optimizing moving tours:', error.message);
            throw error;
        }
    }

    /**
     * Track moving trucks in real-time (if Traccar is configured)
     */
    async getMovingTruckStatus() {
        if (!this.traccar) {
            throw new Error('Traccar service not configured');
        }

        try {
            console.log('📡 Fetching moving truck status...');
            const activeTrucks = await this.traccar.getActiveMovingTrucks();
            
            const truckStatus = activeTrucks.map(truck => ({
                id: truck.id,
                name: truck.name,
                status: truck.status.online ? 'online' : 'offline',
                location: {
                    lat: truck.lastPosition?.latitude,
                    lng: truck.lastPosition?.longitude,
                    address: truck.lastPosition?.address,
                    speed: truck.lastPosition?.speed || 0,
                    lastUpdate: truck.lastPosition?.fixTime
                },
                attributes: truck.attributes
            }));

            return {
                success: true,
                trucks: truckStatus,
                totalTrucks: truckStatus.length,
                onlineTrucks: truckStatus.filter(t => t.status === 'online').length
            };
        } catch (error) {
            console.error('❌ Error fetching truck status:', error.message);
            throw error;
        }
    }

    /**
     * Get historical route data for a truck
     */
    async getTruckRouteHistory(truckId, date) {
        if (!this.traccar) {
            throw new Error('Traccar service not configured');
        }

        try {
            console.log(`📊 Fetching route history for truck ${truckId}...`);
            const positions = await this.traccar.getTruckRoute(truckId, date);
            
            if (positions.length < 2) {
                return {
                    success: false,
                    message: 'Insufficient position data for route analysis'
                };
            }

            // Calculate route statistics
            const routeStats = this.calculateRouteStatistics(positions);
            
            return {
                success: true,
                truckId,
                date,
                positions: positions.length,
                route: {
                    positions,
                    statistics: routeStats,
                    startLocation: {
                        lat: positions[0].latitude,
                        lng: positions[0].longitude,
                        time: positions[0].fixTime,
                        address: positions[0].address
                    },
                    endLocation: {
                        lat: positions[positions.length - 1].latitude,
                        lng: positions[positions.length - 1].longitude,
                        time: positions[positions.length - 1].fixTime,
                        address: positions[positions.length - 1].address
                    }
                }
            };
        } catch (error) {
            console.error('❌ Error fetching truck route history:', error.message);
            throw error;
        }
    }

    /**
     * Test all integrated services
     */
    async testIntegration() {
        const results = {
            hereRouting: { status: 'pending', error: null },
            hereTourPlanning: { status: 'pending', error: null },
            traccar: { status: 'pending', error: null }
        };

        // Test HERE Routing
        try {
            await this.hereRouting.calculateCarRoute({
                origin: '52.5,13.4',
                destination: '52.6,13.5'
            });
            results.hereRouting.status = 'success';
        } catch (error) {
            results.hereRouting.status = 'error';
            results.hereRouting.error = error.message;
        }

        // Test HERE Tour Planning
        try {
            const mockJobs = [{
                id: 'test_job',
                type: 'service',
                location: { lat: 52.5200, lng: 13.4050 },
                duration: 1800
            }];
            const mockDepot = { lat: 52.5250, lng: 13.4075 };
            
            await this.hereTourPlanning.optimizeMovingPositions([
                { latitude: 52.5200, longitude: 13.4050 },
                { latitude: 52.5300, longitude: 13.4100 }
            ], mockDepot);
            results.hereTourPlanning.status = 'success';
        } catch (error) {
            results.hereTourPlanning.status = 'error';
            results.hereTourPlanning.error = error.message;
        }

        // Test Traccar (if configured)
        if (this.traccar) {
            try {
                await this.traccar.testConnection();
                results.traccar.status = 'success';
            } catch (error) {
                results.traccar.status = 'error';
                results.traccar.error = error.message;
            }
        } else {
            results.traccar.status = 'not_configured';
        }

        return results;
    }

    // Helper methods
    async addressToCoordinates(address) {
        // Simplified geocoding - in production, use HERE Geocoding API
        // For now, return mock coordinates
        return { lat: 52.5200, lng: 13.4050 };
    }

    calculatePickupDuration(job) {
        // Base duration: 30 minutes
        // Add time based on inventory size, floor, etc.
        let duration = 1800; // 30 minutes
        
        if (job.inventory) {
            duration += job.inventory.totalItems * 60; // 1 minute per item
        }
        
        if (job.floors && job.floors > 1) {
            duration += (job.floors - 1) * 600; // 10 minutes per additional floor
        }
        
        return Math.min(duration, 7200); // Max 2 hours
    }

    calculateDeliveryDuration(job) {
        // Delivery usually takes longer than pickup
        return this.calculatePickupDuration(job) * 1.3;
    }

    calculateFuelCost(distanceMeters) {
        const distanceKm = distanceMeters / 1000;
        const fuelConsumption = 25; // L/100km for moving truck
        const fuelPrice = 1.50; // €/L
        return (distanceKm * fuelConsumption / 100 * fuelPrice).toFixed(2);
    }

    calculateTourEfficiency(tour, originalJobs) {
        // Simple efficiency calculation
        const totalJobDistance = originalJobs.length * 50; // Assume 50km average per job
        const actualDistance = tour.summary.totalDistance / 1000;
        return Math.max(0, (1 - (actualDistance / totalJobDistance)) * 100).toFixed(1);
    }

    calculateRouteStatistics(positions) {
        if (positions.length < 2) return null;

        let totalDistance = 0;
        let maxSpeed = 0;
        let totalTime = 0;

        for (let i = 1; i < positions.length; i++) {
            const prev = positions[i - 1];
            const curr = positions[i];
            
            // Calculate distance between points (simplified)
            const distance = this.haversineDistance(
                prev.latitude, prev.longitude,
                curr.latitude, curr.longitude
            );
            totalDistance += distance;
            
            if (curr.speed > maxSpeed) {
                maxSpeed = curr.speed;
            }
        }

        const startTime = new Date(positions[0].fixTime);
        const endTime = new Date(positions[positions.length - 1].fixTime);
        totalTime = (endTime - startTime) / 1000; // seconds

        return {
            totalDistance: totalDistance, // meters
            totalTime: totalTime, // seconds
            maxSpeed: maxSpeed, // km/h
            averageSpeed: totalTime > 0 ? (totalDistance / 1000) / (totalTime / 3600) : 0,
            stops: this.detectStops(positions).length
        };
    }

    haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Earth's radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    detectStops(positions) {
        // Simple stop detection based on speed
        const stops = [];
        let currentStop = null;

        positions.forEach((pos, index) => {
            if (pos.speed < 5) { // Less than 5 km/h considered stopped
                if (!currentStop) {
                    currentStop = {
                        start: pos,
                        startIndex: index,
                        duration: 0
                    };
                }
            } else {
                if (currentStop) {
                    currentStop.end = positions[index - 1];
                    currentStop.endIndex = index - 1;
                    currentStop.duration = new Date(currentStop.end.fixTime) - new Date(currentStop.start.fixTime);
                    
                    if (currentStop.duration > 300000) { // Only count stops longer than 5 minutes
                        stops.push(currentStop);
                    }
                    currentStop = null;
                }
            }
        });

        return stops;
    }

    async enhanceTourWithMovingData(tour, originalJobs) {
        // Add moving-specific data to the optimized tour
        const enhancedTour = { ...tour };
        
        enhancedTour.tours = tour.tours.map(tourRoute => ({
            ...tourRoute,
            movingJobs: tourRoute.stops.map(stop => {
                // Find corresponding original job
                const jobId = stop.activities?.[0]?.jobId;
                const originalJob = originalJobs.find(job => job.id === jobId);
                return {
                    ...stop,
                    originalJob,
                    estimatedPackingTime: originalJob ? this.calculatePickupDuration(originalJob) : 0,
                    estimatedUnpackingTime: originalJob ? this.calculateDeliveryDuration(originalJob) : 0
                };
            })
        }));

        return enhancedTour;
    }
}

module.exports = TourPlanningIntegrationService;
