/**
 * OrdersMap - Kartenansicht aller Aufträge mit Routen
 * Zeigt alle Aufträge auf einer Karte mit Routen zwischen Abholung und Lieferung
 * Verwendet Google Maps API für bessere Stabilität
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  MapPin, 
  Target, 
  Truck, 
  Eye, 
  Info,
  ZoomIn,
  ZoomOut,
  Navigation,
  Layers,
  List,
  X
} from 'lucide-react';

const OrdersMap = ({ 
  orders = [], 
  selectedOrder = null, 
  onOrderSelect = () => {}, 
  onShowDetails = () => {} 
}) => {
  const mapRef = useRef();
  const mapInstanceRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const markersRef = useRef(new Map()); // Cache for markers
  
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter] = useState({ lat: 51.1657, lng: 10.4515 }); // Deutschland Zentrum
  const [mapZoom] = useState(6);
  const [geocodedOrders, setGeocodedOrders] = useState(new Map()); // Cache for geocoded orders
  const [showOrdersList, setShowOrdersList] = useState(true);
  const [currentRoute, setCurrentRoute] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Google Maps API laden
  const loadGoogleMapsAPI = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'demo-key';
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places`;
      script.async = true;
      script.defer = true;
      
      const timeout = setTimeout(() => {
        reject(new Error('Google Maps API loading timeout'));
      }, 30000);

      script.onload = () => {
        clearTimeout(timeout);
        setTimeout(() => {
          if (window.google && window.google.maps) {
            resolve();
          } else {
            reject(new Error('Google Maps API nicht vollständig initialisiert'));
          }
        }, 500);
      };

      script.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load Google Maps API'));
      };

      document.head.appendChild(script);
    });
  }, []);

  // Karte initialisieren
  const initializeMap = useCallback(async () => {
    try {
      if (!window.google || !window.google.maps) {
        await loadGoogleMapsAPI();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (!window.google || !window.google.maps) {
        throw new Error('Google Maps API nicht vollständig geladen');
      }

      // Google Maps Karte erstellen
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: mapZoom,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      // Directions Service und Renderer initialisieren
      directionsServiceRef.current = new window.google.maps.DirectionsService();
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        suppressMarkers: true, // Wir erstellen unsere eigenen Marker
        polylineOptions: {
          strokeColor: '#3B82F6',
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      });

      directionsRendererRef.current.setMap(mapInstanceRef.current);

      setIsMapReady(true);
      setIsLoading(false);

    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      setError('Fehler beim Laden der Karte. Überprüfen Sie die Google Maps API Konfiguration.');
      setIsLoading(false);
    }
  }, [loadGoogleMapsAPI, mapZoom, mapCenter]);

  // Adressen geocodieren mit Google Geocoding API
  const geocodeAddress = useCallback(async (address) => {
    try {
      if (!window.google || !window.google.maps) {
        throw new Error('Google Maps API nicht verfügbar');
      }

      const geocoder = new window.google.maps.Geocoder();
      
      return new Promise((resolve, reject) => {
        geocoder.geocode({ address: address }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            const lat = location.lat();
            const lng = location.lng();
            
            // Validierung der Koordinaten
            if (typeof lat === 'number' && typeof lng === 'number' && 
                !isNaN(lat) && !isNaN(lng) && 
                lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
              resolve({
                lat: lat,
                lng: lng,
                address: results[0].formatted_address
              });
            } else {
              reject(new Error('Invalid coordinates returned from geocoding'));
            }
          } else if (status === 'OVER_QUERY_LIMIT') {
            // Rate limiting - warte und versuche es erneut
            console.warn('Google Geocoding rate limit reached, waiting before retry...');
            setTimeout(() => {
              geocoder.geocode({ address: address }, (retryResults, retryStatus) => {
                if (retryStatus === 'OK' && retryResults[0]) {
                  const location = retryResults[0].geometry.location;
                  const lat = location.lat();
                  const lng = location.lng();
                  
                  if (typeof lat === 'number' && typeof lng === 'number' && 
                      !isNaN(lat) && !isNaN(lng) && 
                      lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                    resolve({
                      lat: lat,
                      lng: lng,
                      address: retryResults[0].formatted_address
                    });
                  } else {
                    reject(new Error('Invalid coordinates returned from geocoding retry'));
                  }
                } else {
                  reject(new Error(`Geocoding retry failed: ${retryStatus}`));
                }
              });
            }, 2000);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }, []);

  // Einzelnen Auftrag geocodieren und cachen
  const geocodeOrder = useCallback(async (order) => {
    // Prüfen ob bereits gecacht
    if (geocodedOrders.has(order.id)) {
      return geocodedOrders.get(order.id);
    }

    setIsGeocoding(true);
    
    try {
      console.log(`Geocoding order: ${order.title}`);
      
      // Verzögerung vor dem Geocoding um Rate Limiting zu vermeiden
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const pickup = await geocodeAddress(order.pickup.address);
      
      // Verzögerung zwischen Pickup und Delivery Geocoding
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const delivery = await geocodeAddress(order.delivery.address);
      
      if (pickup && delivery) {
        const geocodedOrder = {
          ...order,
          pickup: { ...order.pickup, coordinates: pickup },
          delivery: { ...order.delivery, coordinates: delivery }
        };
        
        // In Cache speichern
        setGeocodedOrders(prev => new Map(prev).set(order.id, geocodedOrder));
        
        console.log(`Order geocoded successfully: ${order.title}`);
        return geocodedOrder;
      } else {
        console.warn(`Geocoding failed for order: ${order.title}`);
        return null;
      }
    } catch (error) {
      console.error(`Error geocoding order: ${order.title}`, error);
      return null;
    } finally {
      setIsGeocoding(false);
    }
  }, [geocodedOrders, geocodeAddress]);

  // Route zwischen zwei Punkten berechnen
  const calculateRoute = useCallback(async (start, end) => {
    try {
      if (!directionsServiceRef.current) {
        throw new Error('Directions service nicht verfügbar');
      }

      return new Promise((resolve, reject) => {
        const request = {
          origin: new window.google.maps.LatLng(start.lat, start.lng),
          destination: new window.google.maps.LatLng(end.lat, end.lng),
          travelMode: window.google.maps.TravelMode.DRIVING
        };

        directionsServiceRef.current.route(request, (result, status) => {
          if (status === 'OK') {
            resolve(result);
          } else if (status === 'OVER_QUERY_LIMIT') {
            // Rate limiting - warte und versuche es erneut
            console.warn('Google Directions rate limit reached, waiting before retry...');
            setTimeout(() => {
              directionsServiceRef.current.route(request, (retryResult, retryStatus) => {
                if (retryStatus === 'OK') {
                  resolve(retryResult);
                } else {
                  reject(new Error(`Directions retry failed: ${retryStatus}`));
                }
              });
            }, 2000);
          } else {
            reject(new Error(`Directions failed: ${status}`));
          }
        });
      });
    } catch (error) {
      console.error('Routing error:', error);
      return null;
    }
  }, []);

  // Auftrag auf der Karte anzeigen
  const showOrderOnMap = useCallback(async (order) => {
    if (!isMapReady || !mapInstanceRef.current) return;

    try {
      // Validierung der Koordinaten
      if (!order.pickup?.coordinates?.lat || !order.pickup?.coordinates?.lng ||
          !order.delivery?.coordinates?.lat || !order.delivery?.coordinates?.lng) {
        console.error('Invalid coordinates for order:', order);
        return;
      }

      // Alle bestehenden Marker entfernen
      markersRef.current.forEach(marker => {
        if (marker && marker.map) {
          marker.map = null;
        }
      });
      markersRef.current.clear();

      // Route löschen
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setDirections({ routes: [] });
      }

      // Koordinaten validieren und sicherstellen, dass sie Zahlen sind
      const pickupLat = parseFloat(order.pickup.coordinates.lat);
      const pickupLng = parseFloat(order.pickup.coordinates.lng);
      const deliveryLat = parseFloat(order.delivery.coordinates.lat);
      const deliveryLng = parseFloat(order.delivery.coordinates.lng);

      if (isNaN(pickupLat) || isNaN(pickupLng) || isNaN(deliveryLat) || isNaN(deliveryLng)) {
        console.error('Invalid coordinate values:', { pickupLat, pickupLng, deliveryLat, deliveryLng });
        return;
      }

      // Einfache Standard-Marker mit benutzerdefinierten Icons erstellen
      const pickupMarker = new window.google.maps.Marker({
        position: { lat: pickupLat, lng: pickupLng },
        map: mapInstanceRef.current,
        title: `Abholung: ${order.title}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        },
        label: {
          text: 'M',
          color: '#FFFFFF',
          fontSize: '12px',
          fontWeight: 'bold'
        }
      });

      const deliveryMarker = new window.google.maps.Marker({
        position: { lat: deliveryLat, lng: deliveryLng },
        map: mapInstanceRef.current,
        title: `Lieferung: ${order.title}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#EF4444',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        },
        label: {
          text: 'L',
          color: '#FFFFFF',
          fontSize: '12px',
          fontWeight: 'bold'
        }
      });

      // Marker in Cache speichern
      markersRef.current.set('pickup', pickupMarker);
      markersRef.current.set('delivery', deliveryMarker);

      // Route berechnen und anzeigen
      const routeResult = await calculateRoute(
        { lat: pickupLat, lng: pickupLng },
        { lat: deliveryLat, lng: deliveryLng }
      );
      
      if (routeResult && directionsRendererRef.current) {
        directionsRendererRef.current.setDirections(routeResult);
        setCurrentRoute(routeResult);
      }

      // Karte auf die Route zoomen
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(new window.google.maps.LatLng(pickupLat, pickupLng));
      bounds.extend(new window.google.maps.LatLng(deliveryLat, deliveryLng));
      
      mapInstanceRef.current.fitBounds(bounds);

    } catch (error) {
      console.error('Error showing order on map:', error);
    }
  }, [isMapReady, calculateRoute]);

  // Karte zentrieren
  const centerMap = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(mapCenter);
      mapInstanceRef.current.setZoom(mapZoom);
    }
  }, [mapCenter, mapZoom]);

  // Auftrag auswählen und auf Karte anzeigen
  const handleOrderSelect = useCallback(async (order) => {
    onOrderSelect(order);
    
    // Prüfen ob bereits gecacht
    let geocodedOrder = geocodedOrders.get(order.id);
    
    if (!geocodedOrder) {
      // Geocodieren wenn noch nicht gecacht
      geocodedOrder = await geocodeOrder(order);
    }
    
    if (geocodedOrder) {
      showOrderOnMap(geocodedOrder);
    }
  }, [onOrderSelect, geocodedOrders, geocodeOrder, showOrderOnMap]);

  // Karte initialisieren
  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  // Auftrag auf der Karte anzeigen wenn sich selectedOrder ändert
  useEffect(() => {
    if (selectedOrder && geocodedOrders.has(selectedOrder.id)) {
      const geocodedOrder = geocodedOrders.get(selectedOrder.id);
      showOrderOnMap(geocodedOrder);
    }
  }, [selectedOrder, geocodedOrders, showOrderOnMap]);

  return (
    <div className="relative w-full h-full flex">
      {/* Orders List Sidebar */}
      <div className={`${showOrdersList ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-200 overflow-hidden`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Aufträge</h3>
            <button
              onClick={() => setShowOrdersList(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto h-full">
          {orders.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Keine Aufträge verfügbar
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {orders.map((order) => {
                const isGeocoded = geocodedOrders.has(order.id);
                const isSelected = selectedOrder?.id === order.id;
                
                return (
                  <div
                    key={order.id}
                    onClick={() => handleOrderSelect(order)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{order.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {order.customer?.name || 'Unbekannter Kunde'}
                        </p>
                        <div className="flex items-center mt-2 space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            order.priority === 'high' ? 'bg-red-100 text-red-800' :
                            order.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {order.priority === 'high' ? 'Hoch' :
                             order.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status === 'completed' ? 'Abgeschlossen' :
                             order.status === 'in_progress' ? 'Aktiv' : 'Ausstehend'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {isGeocoding && isSelected && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        )}
                        {isGeocoded && (
                          <div className="w-2 h-2 bg-green-500 rounded-full" title="Geocodiert"></div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onShowDetails(true);
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center text-xs text-gray-600">
                        <MapPin className="w-3 h-3 mr-2 text-blue-500" />
                        <span className="truncate">{order.pickup.address}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-600">
                        <Target className="w-3 h-3 mr-2 text-red-500" />
                        <span className="truncate">{order.delivery.address}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div 
          ref={mapRef} 
          className="w-full h-full bg-gray-100 rounded-lg overflow-hidden"
        />
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-90">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Karte wird geladen...</p>
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

        {/* Toggle Orders List Button */}
        {!showOrdersList && (
          <button
            onClick={() => setShowOrdersList(true)}
            className="absolute top-4 left-4 bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            title="Auftragsliste anzeigen"
          >
            <List className="w-4 h-4 text-gray-600" />
          </button>
        )}

        {/* Map Controls */}
        {isMapReady && (
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            <button
              onClick={centerMap}
              className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
              title="Karte zentrieren"
            >
              <Navigation className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}

        {/* Legend */}
        {isMapReady && currentRoute && (
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
            <h4 className="font-medium text-gray-900 mb-2 text-sm">Legende</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span>Abholung</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span>Lieferung</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span>Route</span>
              </div>
            </div>
          </div>
        )}

        {/* Order Info */}
        {isMapReady && selectedOrder && currentRoute && (
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
            <h4 className="font-medium text-gray-900 mb-2 text-sm">Aktueller Auftrag</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="font-medium text-gray-900">{selectedOrder.title}</div>
              <div>Kunde: {selectedOrder.customer?.name}</div>
              <div>Priorität: {selectedOrder.priority}</div>
              <div>Status: {selectedOrder.status}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersMap;
