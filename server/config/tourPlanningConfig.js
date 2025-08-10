/**
 * Tour Planning Configuration for Moving Assistant
 * Configuration management for HERE API and Traccar integration
 */

// Load environment variables from multiple possible locations
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.development') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const config = {
    // HERE Maps API Configuration
    here: {
        apiKey: process.env.HERE_API_KEY || process.env.REACT_APP_HERE_API_KEY || '',
        routingBaseUrl: 'https://router.hereapi.com/v8',
        tourPlanningBaseUrl: 'https://tourplanning.hereapi.com/v3',
        geocodingBaseUrl: 'https://geocode.search.hereapi.com/v1'
    },
    
    // Traccar API Configuration (optional)
    traccar: {
        baseURL: process.env.TRACCAR_BASE_URL || '',
        username: process.env.TRACCAR_USERNAME || '',
        password: process.env.TRACCAR_PASSWORD || '',
        apiKey: process.env.TRACCAR_API_KEY || '',
        debug: process.env.DEBUG === 'true' || false,
        enabled: !!(process.env.TRACCAR_BASE_URL && (process.env.TRACCAR_API_KEY || (process.env.TRACCAR_USERNAME && process.env.TRACCAR_PASSWORD)))
    },
    
    // Moving-specific configuration
    moving: {
        defaultTruckSpecs: {
            height: 350, // cm
            width: 245,  // cm
            length: 750, // cm
            weight: 7500 // kg
        },
        defaultServiceDurations: {
            pickup: 1800,   // 30 minutes
            delivery: 2400, // 40 minutes
            inspection: 3600 // 60 minutes
        },
        defaultWorkingHours: {
            start: '07:00:00',
            end: '19:00:00'
        },
        maxDailyDistance: 300000, // 300km
        maxShiftTime: 43200, // 12 hours
        fuelCost: {
            pricePerLiter: 1.50, // €/L
            consumptionPer100km: 25 // L/100km for moving truck
        }
    },
    
    // General Configuration
    debug: process.env.DEBUG === 'true' || false,
    timeout: parseInt(process.env.API_TIMEOUT) || 10000
};

/**
 * Validate configuration
 */
function validateConfig() {
    const errors = [];
    
    // HERE API Key validation
    if (!config.here.apiKey) {
        errors.push('HERE_API_KEY ist erforderlich für Routenberechnung und Tourenoptimierung');
    }
    
    // Traccar validation (only if enabled)
    if (config.traccar.baseURL && !config.traccar.apiKey && (!config.traccar.username || !config.traccar.password)) {
        errors.push('Traccar Authentifizierung erforderlich: Entweder TRACCAR_API_KEY oder TRACCAR_USERNAME/TRACCAR_PASSWORD');
    }
    
    if (errors.length > 0) {
        console.error('❌ Tour Planning Konfigurationsfehler:');
        errors.forEach(error => console.error(`   - ${error}`));
        
        console.log('\n📝 Erforderliche Umgebungsvariablen:');
        console.log('HERE_API_KEY=ihr_here_api_key (ERFORDERLICH)');
        console.log('TRACCAR_BASE_URL=https://ihre-traccar-instanz.com/api (OPTIONAL)');
        console.log('TRACCAR_API_KEY=ihr_traccar_api_key (OPTIONAL)');
        console.log('# ODER');
        console.log('TRACCAR_USERNAME=ihr_username (OPTIONAL)');
        console.log('TRACCAR_PASSWORD=ihr_passwort (OPTIONAL)');
        
        return false;
    }
    
    return true;
}

/**
 * Get configuration for the integration service
 */
function getIntegrationConfig() {
    return {
        hereApiKey: config.here.apiKey,
        traccarConfig: config.traccar.enabled ? config.traccar : null,
        movingConfig: config.moving,
        debug: config.debug
    };
}

/**
 * Check if specific features are available
 */
function getFeatureAvailability() {
    return {
        routing: !!config.here.apiKey,
        tourOptimization: !!config.here.apiKey,
        tracking: config.traccar.enabled,
        realTimeTracking: config.traccar.enabled
    };
}

module.exports = {
    config,
    validateConfig,
    getIntegrationConfig,
    getFeatureAvailability,
    
    // Helper functions
    getHereConfig: () => config.here,
    getTraccarConfig: () => config.traccar,
    getMovingConfig: () => config.moving,
    isDebug: () => config.debug,
    isTraccarEnabled: () => config.traccar.enabled
};
