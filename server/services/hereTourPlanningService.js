/**
 * HERE Tour Planning API v3 Service for Moving Assistant
 * Advanced route optimization for multiple stops and vehicles
 */

const axios = require('axios');

class HereTourPlanningService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://tourplanning.hereapi.com/v3';
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    /**
     * Optimize a tour for moving/relocation jobs
     * @param {Array} jobs - Array of pickup/delivery jobs
     * @param {Object} depot - Starting point/depot location
     * @param {Object} options - Additional optimization options
     * @returns {Promise<Object>} Optimized tour solution
     */
    async optimizeMovingTour(jobs, depot, options = {}) {
        try {
            const problem = this.createMovingTourProblem(jobs, depot, options);
            
            console.log('🚚 Starting moving tour optimization...');
            console.log(`📦 ${jobs.length} moving jobs to optimize`);
            
            const response = await axios.post(`${this.baseUrl}/problems?apikey=${this.apiKey}`, problem, {
                headers: this.defaultHeaders
            });
            
            console.log('📥 Received tour optimization response');
            return this.processSolution(response.data);
            
        } catch (error) {
            console.error('❌ Tour optimization error:', error.response?.data || error.message);
            if (error.response?.data) {
                console.log('📋 Full API response:', JSON.stringify(error.response.data, null, 2));
            }
            throw error;
        }
    }

    /**
     * Create tour problem JSON specifically for moving/relocation services
     */
    createMovingTourProblem(jobs, depot, options) {
        const problem = {
            // Vehicle fleet configuration for moving trucks
            fleet: {
                types: [
                    {
                        id: options.vehicleId || 'moving_truck_1',
                        profile: 'truck', // Always use truck profile for moving
                        costs: {
                            fixed: options.fixedCost || 150.0, // Higher fixed cost for trucks
                            distance: options.distanceCost || 0.002, // Higher distance cost
                            time: options.timeCost || 0.01 // Higher time cost
                        },
                        shifts: [{
                            start: {
                                time: options.startTime || '2025-01-01T07:00:00Z', // Earlier start
                                location: {
                                    lat: depot.lat,
                                    lng: depot.lng
                                }
                            },
                            end: {
                                time: options.endTime || '2025-01-01T19:00:00Z', // Later end
                                location: {
                                    lat: depot.lat,
                                    lng: depot.lng
                                }
                            }
                        }],
                        capacity: options.capacity || [50], // Higher capacity for moving trucks
                        limits: {
                            maxDistance: options.maxDistance || 300000, // 300km max for moving
                            shiftTime: options.maxShiftTime || 43200 // 12 hours max
                        },
                        skills: options.skills || ['moving', 'heavy_lifting'],
                        amount: options.vehicleAmount || 1
                    }
                ],
                profiles: [{
                    name: 'truck',
                    type: 'truck'
                }]
            },

            // Plan with all moving jobs
            plan: {
                jobs: jobs.map(job => this.createMovingJob(job))
            },

            // Optimization objectives for moving services
            objectives: [
                {
                    type: 'minimize-cost'
                },
                {
                    type: 'minimize-vehicles'
                }
            ]
        };

        return problem;
    }

    /**
     * Create a job object specifically for moving services
     */
    createMovingJob(job) {
        const jobObject = {
            id: job.id,
            priority: job.priority || 3,
            skills: job.skills || ['moving']
        };

        if (job.type === 'pickup_delivery') {
            // Pickup and delivery job (typical for moving)
            jobObject.pickups = [{
                places: [{
                    location: {
                        lat: job.pickup.lat,
                        lng: job.pickup.lng
                    },
                    duration: job.pickup.duration || 1800, // 30 min default for pickup
                    timeWindows: job.pickup.timeWindows || [{
                        earliest: '2025-01-01T08:00:00Z',
                        latest: '2025-01-01T18:00:00Z'
                    }]
                }],
                demand: job.pickup.demand || [1] // Volume/weight demand
            }];

            jobObject.deliveries = [{
                places: [{
                    location: {
                        lat: job.delivery.lat,
                        lng: job.delivery.lng
                    },
                    duration: job.delivery.duration || 2400, // 40 min default for delivery
                    timeWindows: job.delivery.timeWindows || [{
                        earliest: '2025-01-01T09:00:00Z',
                        latest: '2025-01-01T19:00:00Z'
                    }]
                }],
                demand: job.delivery.demand || [1]
            }];
        } else {
            // Service job (inspection, estimate, etc.)
            jobObject.services = [{
                places: [{
                    location: {
                        lat: job.location.lat,
                        lng: job.location.lng
                    },
                    duration: job.duration || 3600, // 1 hour default for service
                    timeWindows: job.timeWindows || [{
                        earliest: '2025-01-01T08:00:00Z',
                        latest: '2025-01-01T18:00:00Z'
                    }]
                }],
                demand: job.demand || [0] // No capacity needed for service
            }];
        }

        return jobObject;
    }

    /**
     * Process and format the optimization solution
     */
    processSolution(solution) {
        if (!solution.tours || solution.tours.length === 0) {
            throw new Error('No optimized tours found in solution');
        }

        const processedSolution = {
            tours: solution.tours.map(tour => ({
                vehicleId: tour.vehicleId,
                typeId: tour.typeId,
                shiftIndex: tour.shiftIndex,
                stops: tour.stops.map(stop => ({
                    location: stop.location,
                    time: {
                        arrival: stop.time.arrival,
                        departure: stop.time.departure
                    },
                    distance: stop.distance,
                    load: stop.load,
                    activities: stop.activities
                })),
                statistics: tour.statistic
            })),
            summary: {
                totalCost: solution.statistic?.cost || 0,
                totalDistance: solution.statistic?.distance || 0,
                totalTime: solution.statistic?.duration || 0,
                vehiclesUsed: solution.tours?.length || 0,
                jobsScheduled: this.countScheduledJobs(solution),
                unassignedJobs: solution.unassigned || []
            },
            raw: solution
        };

        return processedSolution;
    }

    /**
     * Count scheduled jobs in the solution
     */
    countScheduledJobs(solution) {
        let count = 0;
        solution.tours?.forEach(tour => {
            tour.stops?.forEach(stop => {
                count += stop.activities?.length || 0;
            });
        });
        return count;
    }

    /**
     * Optimize positions for moving trucks (simpler version)
     * @param {Array} positions - Array of positions to visit
     * @param {Object} depot - Starting depot location
     * @param {Object} options - Optimization options
     */
    async optimizeMovingPositions(positions, depot, options = {}) {
        // Convert positions to simple service jobs
        const jobs = positions.map((pos, index) => ({
            id: `position_${index + 1}`,
            type: 'service',
            location: {
                lat: pos.latitude || pos.lat,
                lng: pos.longitude || pos.lng
            },
            duration: options.serviceDuration || 1800, // 30 minutes default
            priority: pos.priority || 3,
            skills: ['moving']
        }));

        return this.optimizeMovingTour(jobs, depot, {
            ...options,
            vehicleProfile: 'truck'
        });
    }

    /**
     * Print tour summary for debugging
     */
    printTourSummary(solution) {
        console.log('\n🚚 === TOUR OPTIMIZATION SUMMARY ===');
        console.log(`💰 Total Cost: ${solution.summary.totalCost.toFixed(2)}€`);
        console.log(`📏 Total Distance: ${(solution.summary.totalDistance / 1000).toFixed(1)}km`);
        console.log(`⏱️  Total Time: ${Math.round(solution.summary.totalTime / 60)}min`);
        console.log(`🚛 Vehicles Used: ${solution.summary.vehiclesUsed}`);
        console.log(`✅ Jobs Scheduled: ${solution.summary.jobsScheduled}`);
        
        if (solution.summary.unassignedJobs.length > 0) {
            console.log(`❌ Unassigned Jobs: ${solution.summary.unassignedJobs.length}`);
        }

        solution.tours.forEach((tour, index) => {
            console.log(`\n🚛 Tour ${index + 1}:`);
            console.log(`   Stops: ${tour.stops.length}`);
            console.log(`   Distance: ${(tour.statistics?.distance / 1000 || 0).toFixed(1)}km`);
            console.log(`   Duration: ${Math.round((tour.statistics?.duration || 0) / 60)}min`);
        });
        console.log('=====================================\n');
    }

    /**
     * Export solution to JSON file
     */
    exportSolution(solution, filename = 'tour_solution.json') {
        const fs = require('fs');
        fs.writeFileSync(filename, JSON.stringify(solution, null, 2));
        console.log(`📄 Solution exported to ${filename}`);
    }
}

module.exports = HereTourPlanningService;
