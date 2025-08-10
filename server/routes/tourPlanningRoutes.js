/**
 * Tour Planning API Routes for Moving Assistant
 * Handles all tour planning, route optimization, and tracking endpoints
 */

const express = require('express');
const router = express.Router();
const TourPlanningIntegrationService = require('../services/tourPlanningIntegrationService');
const { getIntegrationConfig, validateConfig, getFeatureAvailability } = require('../config/tourPlanningConfig');

// Initialize integration service
let integrationService = null;

// Middleware to ensure integration service is available
const ensureIntegrationService = (req, res, next) => {
    try {
        if (!integrationService) {
            if (!validateConfig()) {
                return res.status(500).json({
                    success: false,
                    error: 'Tour planning service not properly configured'
                });
            }
            integrationService = new TourPlanningIntegrationService(getIntegrationConfig());
        }
        next();
    } catch (error) {
        console.error('Error initializing integration service:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to initialize tour planning service'
        });
    }
};

/**
 * GET /api/tour-planning/status
 * Get service status and feature availability
 */
router.get('/status', (req, res) => {
    try {
        const features = getFeatureAvailability();
        const isConfigValid = validateConfig();
        
        res.json({
            success: true,
            status: isConfigValid ? 'ready' : 'configuration_error',
            features,
            services: {
                hereRouting: features.routing,
                hereTourOptimization: features.tourOptimization,
                traccarTracking: features.tracking
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/tour-planning/test
 * Test all integrated services
 */
router.post('/test', ensureIntegrationService, async (req, res) => {
    try {
        console.log('🧪 Testing tour planning integration...');
        const testResults = await integrationService.testIntegration();
        
        res.json({
            success: true,
            testResults,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error testing integration:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/tour-planning/calculate-route
 * Calculate optimized route for a single moving job
 */
router.post('/calculate-route', ensureIntegrationService, async (req, res) => {
    try {
        const { movingJob, options = {} } = req.body;
        
        if (!movingJob || !movingJob.pickupAddress || !movingJob.deliveryAddress) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: pickupAddress and deliveryAddress'
            });
        }

        console.log('🗺️ Calculating route for moving job...');
        const result = await integrationService.calculateMovingRoute(movingJob, options);
        
        res.json(result);
    } catch (error) {
        console.error('Error calculating route:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/tour-planning/optimize-tours
 * Optimize multiple moving jobs into efficient tours
 */
router.post('/optimize-tours', ensureIntegrationService, async (req, res) => {
    try {
        const { movingJobs, depot, options = {} } = req.body;
        
        if (!movingJobs || !Array.isArray(movingJobs) || movingJobs.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'movingJobs array is required and must not be empty'
            });
        }

        if (!depot || !depot.lat || !depot.lng) {
            return res.status(400).json({
                success: false,
                error: 'Depot location with lat and lng is required'
            });
        }

        console.log('🚚 Optimizing tours for multiple jobs...');
        const result = await integrationService.optimizeMovingTours(movingJobs, depot, options);
        
        res.json(result);
    } catch (error) {
        console.error('Error optimizing tours:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/tour-planning/trucks/status
 * Get real-time status of all moving trucks (requires Traccar)
 */
router.get('/trucks/status', ensureIntegrationService, async (req, res) => {
    try {
        const features = getFeatureAvailability();
        
        if (!features.tracking) {
            return res.status(400).json({
                success: false,
                error: 'Tracking service not available. Traccar not configured.'
            });
        }

        console.log('📡 Fetching truck status...');
        const result = await integrationService.getMovingTruckStatus();
        
        res.json(result);
    } catch (error) {
        console.error('Error fetching truck status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/tour-planning/trucks/:truckId/history
 * Get historical route data for a specific truck
 */
router.get('/trucks/:truckId/history', ensureIntegrationService, async (req, res) => {
    try {
        const { truckId } = req.params;
        const { date } = req.query;
        
        const features = getFeatureAvailability();
        
        if (!features.tracking) {
            return res.status(400).json({
                success: false,
                error: 'Tracking service not available. Traccar not configured.'
            });
        }

        if (!date) {
            return res.status(400).json({
                success: false,
                error: 'Date parameter is required (YYYY-MM-DD format)'
            });
        }

        console.log(`📊 Fetching route history for truck ${truckId}...`);
        const result = await integrationService.getTruckRouteHistory(parseInt(truckId), date);
        
        res.json(result);
    } catch (error) {
        console.error('Error fetching truck history:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/tour-planning/simulate-optimization
 * Simulate tour optimization with sample data (for testing)
 */
router.post('/simulate-optimization', ensureIntegrationService, async (req, res) => {
    try {
        const { jobCount = 5, depot } = req.body;
        
        // Generate sample moving jobs for testing
        const sampleJobs = [];
        for (let i = 1; i <= jobCount; i++) {
            sampleJobs.push({
                id: `sample_job_${i}`,
                pickupAddress: `Sample Pickup Address ${i}`,
                deliveryAddress: `Sample Delivery Address ${i}`,
                pickupCoordinates: {
                    lat: 52.5200 + (Math.random() - 0.5) * 0.1,
                    lng: 13.4050 + (Math.random() - 0.5) * 0.1
                },
                deliveryCoordinates: {
                    lat: 52.5200 + (Math.random() - 0.5) * 0.1,
                    lng: 13.4050 + (Math.random() - 0.5) * 0.1
                },
                priority: Math.floor(Math.random() * 5) + 1,
                inventory: {
                    totalItems: Math.floor(Math.random() * 50) + 10
                },
                floors: Math.floor(Math.random() * 4) + 1
            });
        }

        const defaultDepot = depot || {
            lat: 52.5200,
            lng: 13.4050,
            address: 'Berlin Depot'
        };

        console.log('🎯 Running simulation with sample data...');
        const result = await integrationService.optimizeMovingTours(sampleJobs, defaultDepot, {
            startTime: '2025-01-01T07:00:00Z',
            endTime: '2025-01-01T19:00:00Z'
        });
        
        res.json({
            ...result,
            simulation: true,
            sampleJobsGenerated: jobCount
        });
    } catch (error) {
        console.error('Error running simulation:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/tour-planning/config
 * Get current configuration (without sensitive data)
 */
router.get('/config', (req, res) => {
    try {
        const features = getFeatureAvailability();
        const config = getIntegrationConfig();
        
        res.json({
            success: true,
            features,
            config: {
                hereApiConfigured: !!config.hereApiKey,
                traccarConfigured: !!config.traccarConfig,
                debugMode: config.debug,
                movingDefaults: config.movingConfig
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
