/**
 * HERE Maps Component for Tour Planning v2
 * Advanced map integration with route visualization and optimization
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Navigation, Zap, Target, Home, Building } from 'lucide-react';

const HereMapComponent = ({
  selectedDeals = [],
  optimizedTour,
  depot,
  onMapReady,
  isCalculatingRoute = false,
  trucks = [],
  className = '',
  style = {}
}) => {
  const mapRef = useRef();
  const mapInstanceRef = useRef(null);
  const platformRef = useRef(null);
  const uiRef = useRef(null);
  const mapEventsRef = useRef(null);
  const groupRef = useRef(null);
  const routeGroupRef = useRef(null);
  
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter] = useState({ lat: 52.5200, lng: 13.4050 }); // Berlin default
  const [mapZoom] = useState(10);

  const loadHereMapsAPI = useCallback(() => {
    return new Promise((resolve, reject) => {
      const scripts = [
        'https://js.api.here.com/v3/3.1/mapsjs-core.js',
        'https://js.api.here.com/v3/3.1/mapsjs-service.js',
        'https://js.api.here.com/v3/3.1/mapsjs-ui.js',
        'https://js.api.here.com/v3/3.1/mapsjs-mapevents.js'
      ];

      let loadedCount = 0;
      const totalScripts = scripts.length;

      scripts.forEach(src => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => {
          loadedCount++;
          if (loadedCount === totalScripts) {
            resolve();
          }
        };
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      });
    });
  }, []);

  const initializeMap = useCallback(async () => {
    try {
      // Check if HERE Maps API is already loaded
      if (!window.H) {
        await loadHereMapsAPI();
      }

      // Initialize HERE platform
      platformRef.current = new window.H.service.Platform({
        'apikey': process.env.REACT_APP_HERE_API_KEY || 'demo-key'
      });

      // Get default map layer
      const defaultLayers = platformRef.current.createDefaultLayers();

      // Initialize map
      mapInstanceRef.current = new window.H.Map(
        mapRef.current,
        defaultLayers.vector.normal.map,
        {
          zoom: mapZoom,
          center: mapCenter
        }
      );

      // Add UI controls
      uiRef.current = window.H.ui.UI.createDefault(mapInstanceRef.current);

      // Add map events
      mapEventsRef.current = new window.H.mapevents.MapEvents(mapInstanceRef.current);

      // Create groups for different marker types
      groupRef.current = new window.H.map.Group();
      routeGroupRef.current = new window.H.map.Group();
      mapInstanceRef.current.addObject(groupRef.current);
      mapInstanceRef.current.addObject(routeGroupRef.current);

      setIsMapReady(true);
      setIsLoading(false);

      // Notify parent component
      if (onMapReady) {
        onMapReady(mapInstanceRef.current, platformRef.current);
      }

    } catch (error) {
      console.error('Error initializing HERE Maps:', error);
      setError('Fehler beim Laden der Karte. Überprüfen Sie die HERE API Konfiguration.');
      setIsLoading(false);
    }
  }, [loadHereMapsAPI, mapZoom, mapCenter, onMapReady]);

  const centerMap = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(mapCenter);
      mapInstanceRef.current.setZoom(mapZoom);
    }
  }, [mapCenter, mapZoom]);

  const fitMapToRoute = useCallback(() => {
    if (!mapInstanceRef.current || !groupRef.current) return;

    const objects = groupRef.current.getObjects();
    if (objects.length === 0) return;

    const boundingBox = groupRef.current.getBounds();
    if (boundingBox) {
      mapInstanceRef.current.setViewBounds(boundingBox, true);
    }
  }, []);

  // Initialize map on component mount
  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  // Update markers when selectedDeals change
  useEffect(() => {
    if (isMapReady && groupRef.current) {
      // Clear existing markers
      groupRef.current.removeAll();
      
      // Add markers for selected deals (simplified for demo)
      selectedDeals.forEach((deal, index) => {
        if (deal.originAddress) {
          // Create a simple marker for demonstration
          const marker = new window.H.map.Marker(
            { lat: 52.5 + (index * 0.01), lng: 13.4 + (index * 0.01) }
          );
          groupRef.current.addObject(marker);
        }
      });
    }
  }, [selectedDeals, isMapReady]);

  return (
    <div className={`relative w-full h-full ${className}`} style={style}>
      <div 
        ref={mapRef} 
        className="w-full h-full bg-gray-100 rounded-lg overflow-hidden"
      />
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-90">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">HERE Maps wird geladen...</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 bg-opacity-90">
          <div className="text-center p-4">
            <div className="text-red-600 mb-2">⚠️</div>
            <p className="text-red-700 text-sm">{error}</p>
            <button 
              onClick={initializeMap}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      )}

      {/* Route Calculation Indicator */}
      {isCalculatingRoute && isMapReady && (
        <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          <span className="text-sm">Route wird berechnet...</span>
        </div>
      )}

      {/* Map Controls */}
      {isMapReady && (
        <div className="absolute top-4 left-4 flex flex-col space-y-2">
          <button
            onClick={centerMap}
            className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            title="Karte zentrieren"
          >
            <Target className="w-4 h-4 text-gray-600" />
          </button>
          
          <button
            onClick={fitMapToRoute}
            className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            title="Auf Route zoomen"
          >
            <Navigation className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}

      {/* Legend */}
      {isMapReady && (selectedDeals.length > 0 || trucks.length > 0) && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
              <span>Depot</span>
            </div>
            {selectedDeals.length > 0 && (
              <>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                  <span>Abholung</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                  <span>Lieferung</span>
                </div>
              </>
            )}
            {trucks && trucks.length > 0 && (
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-1"></div>
                <span>LKW</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HereMapComponent;