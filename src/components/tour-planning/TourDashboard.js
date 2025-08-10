/**
 * Tour Dashboard - Live-Tracking der Fahrzeuge
 * Zeigt alle Fahrzeuge in Echtzeit auf einer Karte an
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Fuel, 
  Navigation as Route,
  Navigation,
  RefreshCw,
  Eye,
  Phone
} from 'lucide-react';

const TourDashboard = () => {
  const mapRef = useRef();
  const mapInstanceRef = useRef(null);
  const platformRef = useRef(null);
  const vehicleMarkersRef = useRef(new Map());
  
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [mapCenter] = useState({ lat: 49.0069, lng: 8.4037 }); // Karlsruhe
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isMapInitializing, setIsMapInitializing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

    // Lade echte Fahrzeugdaten von Traccar API
  useEffect(() => {
    fetchVehicleData();

    // Auto-refresh alle 30 Sekunden
    const interval = setInterval(fetchVehicleData, 30000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchVehicleData = async () => {
    try {
      console.log('[TourDashboard] Lade Fahrzeugdaten...');
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('[TourDashboard] Kein Auth-Token gefunden');
        setVehicles([]);
        return;
      }

      const response = await fetch('http://localhost:3001/api/tour-planning/trucks/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[TourDashboard] Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[TourDashboard] API Error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[TourDashboard] Fahrzeugdaten erhalten:', data);
      
      if (data.success && data.trucks) {
        const transformedVehicles = data.trucks.map(truck => ({
          id: truck.id,
          name: truck.name,
          driver: truck.attributes?.driver || 'Unbekannt',
          phone: truck.attributes?.phone || 'N/A',
          status: truck.status === 'online' ? 'active' : 'offline',
          position: {
            lat: truck.location.lat,
            lng: truck.location.lng
          },
          speed: Math.round(truck.location.speed || 0),
          fuel: truck.attributes?.fuel || 0,
          lastUpdate: new Date(truck.location.lastUpdate),
          currentJob: truck.attributes?.currentJob || 'Kein aktiver Auftrag',
          nextStop: truck.location.address || 'Unbekannt',
          estimatedArrival: truck.attributes?.estimatedArrival ? new Date(truck.attributes.estimatedArrival) : null
        }));
        
        setVehicles(transformedVehicles);
        
        if (transformedVehicles.length > 0 && !selectedVehicle) {
          setSelectedVehicle(transformedVehicles[0]);
        }
      }
    } catch (error) {
      console.error('[TourDashboard] Fehler beim Laden der Fahrzeugdaten:', error);
      
      // Keine Demo-Daten - nur echte Traccar-Daten verwenden
      setVehicles([]);
      setSelectedVehicle(null);
      console.log('[TourDashboard] Keine Fahrzeugdaten verfügbar - Traccar-Integration prüfen');
    }
  };

  // HERE Maps API laden und initialisieren
  const loadHereMapsAPI = useCallback(() => {
    return new Promise((resolve, reject) => {
      // Prüfe ob HERE Maps bereits geladen ist
      if (window.H && window.H.service && window.H.service.Platform) {
        console.log('[TourDashboard] HERE Maps API bereits geladen');
        resolve();
        return;
      }

      console.log('[TourDashboard] Lade HERE Maps API...');
      
      const scripts = [
        'https://js.api.here.com/v3/3.1/mapsjs-core.js',
        'https://js.api.here.com/v3/3.1/mapsjs-service.js',
        'https://js.api.here.com/v3/3.1/mapsjs-ui.js',
        'https://js.api.here.com/v3/3.1/mapsjs-mapevents.js'
      ];

      // Scripts werden sequenziell geladen

      const loadScript = (src) => {
        return new Promise((scriptResolve, scriptReject) => {
          // Prüfe ob Script bereits existiert
          const existingScript = document.querySelector(`script[src="${src}"]`);
          if (existingScript) {
            scriptResolve();
            return;
          }

          const script = document.createElement('script');
          script.src = src;
          script.async = false; // Sequential loading für HERE Maps
          script.onload = () => {
            console.log(`[TourDashboard] Script geladen: ${src}`);
            scriptResolve();
          };
          script.onerror = () => {
            console.error(`[TourDashboard] Fehler beim Laden: ${src}`);
            scriptReject(new Error(`Failed to load ${src}`));
          };
          document.head.appendChild(script);
        });
      };

      // Sequentiell laden (wichtig für HERE Maps)
      const loadSequentially = async () => {
        try {
          for (const src of scripts) {
            await loadScript(src);
          }
          
          // Warte bis HERE API vollständig verfügbar ist
          let attempts = 0;
          const maxAttempts = 50;
          
          const checkHereAPI = () => {
            attempts++;
            if (window.H && window.H.service && window.H.service.Platform) {
              console.log('[TourDashboard] HERE Maps API erfolgreich geladen');
              resolve();
            } else if (attempts < maxAttempts) {
              setTimeout(checkHereAPI, 100);
            } else {
              reject(new Error('HERE Maps API nicht verfügbar nach dem Laden'));
            }
          };
          
          checkHereAPI();
        } catch (error) {
          reject(error);
        }
      };

      loadSequentially();
    });
  }, []);

  // Karte initialisieren
  const initializeMap = useCallback(async () => {
    if (!mapRef.current || isMapInitializing || mapInstanceRef.current) {
      console.log('[TourDashboard] Karte bereits initialisiert oder wird initialisiert');
      return;
    }

    try {
      setIsMapInitializing(true);
      console.log('[TourDashboard] Initialisiere HERE Maps...');

      const hereApiKey = process.env.REACT_APP_HERE_API_KEY;
      if (!hereApiKey) {
        console.warn('[TourDashboard] HERE API Key nicht konfiguriert - verwende Fallback');
        setIsMapLoaded(true); // Zeige simulierte Karte
        return;
      }

      // HERE Maps API laden
      await loadHereMapsAPI();

      // Prüfe nochmals ob HERE verfügbar ist
      if (!window.H || !window.H.service || !window.H.service.Platform) {
        throw new Error('HERE Maps API nicht vollständig geladen');
      }

      console.log('[TourDashboard] HERE Maps API verfügbar, initialisiere Platform...');

      // Platform initialisieren
      platformRef.current = new window.H.service.Platform({
        'apikey': hereApiKey
      });

      const defaultLayers = platformRef.current.createDefaultLayers();

      // Warte bis DOM-Element bereit ist
      if (!mapRef.current || mapRef.current.offsetWidth === 0) {
        console.warn('[TourDashboard] Map container nicht bereit, warte...');
        setTimeout(() => initializeMap(), 100);
        return;
      }

      console.log('[TourDashboard] Map container bereit, erstelle Karte...');

      // Karte erstellen mit Interaktivität
      mapInstanceRef.current = new window.H.Map(
        mapRef.current,
        defaultLayers.vector.normal.map,
        {
          zoom: 11,
          center: mapCenter
        }
      );

      // WICHTIG: MapEvents und Behavior SOFORT nach Karten-Erstellung
      const mapEvents = new window.H.mapevents.MapEvents(mapInstanceRef.current);
      const behavior = new window.H.mapevents.Behavior(mapEvents);
      
      // UI Controls hinzufügen  
      const ui = window.H.ui.UI.createDefault(mapInstanceRef.current, defaultLayers);
      
      console.log('[TourDashboard] Karte mit Interaktivität erstellt');

      // Karte resizen nach kurzer Wartezeit
      setTimeout(() => {
        try {
          if (mapInstanceRef.current && mapInstanceRef.current.getViewPort()) {
            mapInstanceRef.current.getViewPort().resize();
            console.log('[TourDashboard] Karte resized und bereit');
          }
        } catch (error) {
          console.warn('[TourDashboard] Resize-Fehler:', error.message);
        }
      }, 100);

      setIsMapLoaded(true);
      console.log('[TourDashboard] HERE Maps erfolgreich initialisiert');

    } catch (error) {
      console.error('[TourDashboard] Fehler bei Karten-Initialisierung:', error);
      console.log('[TourDashboard] Verwende Fallback zu simulierter Karte');
      setIsMapLoaded(true); // Fallback zur simulierten Karte
    } finally {
      setIsMapInitializing(false);
    }
  }, [loadHereMapsAPI, mapCenter, isMapInitializing]);

  // Fahrzeug-Marker auf der Karte aktualisieren
  const updateVehicleMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !window.H) return;

    // Alle existierenden Marker entfernen
    vehicleMarkersRef.current.forEach(marker => {
      mapInstanceRef.current.removeObject(marker);
    });
    vehicleMarkersRef.current.clear();

    // Neue Marker für alle Fahrzeuge hinzufügen
    vehicles.forEach(vehicle => {
      if (vehicle.position && vehicle.position.lat && vehicle.position.lng) {
        const statusColor = vehicle.status === 'active' ? '#10b981' : vehicle.status === 'offline' ? '#ef4444' : '#f59e0b';
        
        const icon = new window.H.map.Icon(
          `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" fill="${statusColor}" stroke="white" stroke-width="3" opacity="0.9"/>
            <path d="M10 15h20l-2 10H12l-2-10z" fill="white"/>
            <rect x="8" y="22" width="5" height="3" fill="white"/>
            <rect x="27" y="22" width="5" height="3" fill="white"/>
            <text x="20" y="32" text-anchor="middle" fill="white" font-size="8" font-weight="bold">${vehicle.name.slice(0,3)}</text>
          </svg>`,
          { size: { w: 40, h: 40 }, anchor: { x: 20, y: 20 } }
        );

        const marker = new window.H.map.Marker(
          { lat: vehicle.position.lat, lng: vehicle.position.lng },
          { icon }
        );

        // Marker klickbar machen
        marker.setData({ vehicle: vehicle });
        
        // Click-Event für Marker hinzufügen
        marker.addEventListener('tap', (evt) => {
          const clickedVehicle = evt.target.getData().vehicle;
          setSelectedVehicle(clickedVehicle);
          
          // Info-Bubble anzeigen
          const bubble = new window.H.ui.InfoBubble(`
            <div style="padding: 10px; min-width: 200px;">
              <h4 style="margin: 0 0 8px 0; color: #1f2937;">${clickedVehicle.name}</h4>
              <p style="margin: 4px 0; color: #6b7280;"><strong>Fahrer:</strong> ${clickedVehicle.driver}</p>
              <p style="margin: 4px 0; color: #6b7280;"><strong>Status:</strong> ${getStatusText(clickedVehicle.status)}</p>
              <p style="margin: 4px 0; color: #6b7280;"><strong>Geschwindigkeit:</strong> ${clickedVehicle.speed || 0} km/h</p>
              <p style="margin: 4px 0; color: #6b7280;"><strong>Aktueller Job:</strong> ${clickedVehicle.currentJob || 'Kein aktiver Auftrag'}</p>
            </div>
          `, { lat: vehicle.position.lat, lng: vehicle.position.lng });
          
          // Alte Bubble schließen
          if (window.currentBubble) {
            window.currentBubble.close();
          }
          
          // Neue Bubble anzeigen
          const ui = mapInstanceRef.current.getUI();
          if (ui) {
            ui.addBubble(bubble);
            window.currentBubble = bubble;
          }
          
          console.log('[TourDashboard] Fahrzeug ausgewählt:', clickedVehicle.name);
        });

        mapInstanceRef.current.addObject(marker);
        vehicleMarkersRef.current.set(vehicle.id, marker);
      }
    });
  }, [vehicles]);

  // Karte initialisieren wenn Komponente mounted
  useEffect(() => {
    // Verhindern von doppelter Initialisierung
    if (mapInstanceRef.current) {
      console.log('[TourDashboard] Karte bereits vorhanden, überspringe Initialisierung');
      return;
    }

    // Warte bis Komponente vollständig gerendert ist
    const timer = setTimeout(() => {
      initializeMap();
    }, 100);

    return () => {
      clearTimeout(timer);
      // Cleanup nur wenn Component unmounted wird
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.dispose();
          mapInstanceRef.current = null;
          console.log('[TourDashboard] Karte cleanup durchgeführt');
        } catch (error) {
          console.warn('[TourDashboard] Cleanup Fehler:', error.message);
        }
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fahrzeug-Marker aktualisieren wenn sich Fahrzeuge ändern
  useEffect(() => {
    if (isMapLoaded && vehicles.length > 0 && mapInstanceRef.current) {
      updateVehicleMarkers();
    }
  }, [vehicles, isMapLoaded, updateVehicleMarkers]);

  // Update der letzten Aktualisierungszeit
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 1000); // Jede Sekunde für UI-Update

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'loading': return 'text-yellow-600 bg-yellow-100';
      case 'returning': return 'text-blue-600 bg-blue-100';
      case 'offline': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'loading': return 'Beladen';
      case 'returning': return 'Rückfahrt';
      case 'offline': return 'Offline';
      default: return 'Unbekannt';
    }
  };

  // Zur Fahrzeug-Position zoomen
  const zoomToVehicle = (vehicle) => {
    if (!mapInstanceRef.current || !vehicle.position) return;
    
    mapInstanceRef.current.setCenter({
      lat: vehicle.position.lat,
      lng: vehicle.position.lng
    });
    mapInstanceRef.current.setZoom(15); // Nah ranzoomen
    setSelectedVehicle(vehicle);
    
    console.log('[TourDashboard] Zoom zu Fahrzeug:', vehicle.name);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Fahrzeug-Dashboard</h2>
            <p className="text-gray-600">Live-Tracking und Flottenübersicht</p>
          </div>
          <div className="text-sm text-gray-500">
            Letzte Aktualisierung: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Main Content - Karte und Sidebar nebeneinander */}
      <div className="flex-1 flex overflow-hidden">
        {/* Karte - Hauptbereich mit fester Höhe */}
        <div className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Live-Karte</h3>
            </div>
            <div className="flex-1 p-4 flex flex-col">
              <div 
                ref={mapRef}
                className="w-[1500px] h-[1500px] bg-gray-100 rounded-lg relative mx-auto"
              >
                {!isMapLoaded ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      {isMapInitializing ? (
                        <>
                          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Karte wird geladen...</h3>
                          <p className="text-gray-500">HERE Maps wird initialisiert</p>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Live-Tracking Karte</h3>
                          <p className="text-gray-500 mb-4">Fahrzeuge werden in Echtzeit angezeigt</p>
                          <button 
                            onClick={initializeMap}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Karte laden
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : !mapInstanceRef.current ? (
                  // Fallback: Simulierte Karte wenn HERE Maps nicht verfügbar
                  <div className="w-full h-full bg-gradient-to-br from-blue-50 to-green-50 relative overflow-hidden rounded-lg">
                    <div className="absolute inset-0 opacity-20">
                      <div className="w-full h-full bg-gradient-to-r from-blue-200 via-green-200 to-blue-200"></div>
                    </div>
                    
                    {/* Simulierte Fahrzeug-Marker */}
                    {vehicles.map((vehicle, index) => (
                      <div
                        key={vehicle.id}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                          selectedVehicle?.id === vehicle.id ? 'scale-125 z-10' : 'z-5'
                        }`}
                        style={{
                          left: `${20 + index * 25}%`,
                          top: `${30 + index * 20}%`
                        }}
                        onClick={() => setSelectedVehicle(vehicle)}
                      >
                        <div className={`p-2 rounded-full ${getStatusColor(vehicle.status)} shadow-lg`}>
                          <Truck className="w-6 h-6" />
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-white px-2 py-1 rounded shadow text-xs font-medium whitespace-nowrap">
                          {vehicle.name}
                        </div>
                      </div>
                    ))}
                    
                    {/* Fallback Hinweis */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-1 rounded-full text-sm">
                      Simulierte Karte (HERE API nicht verfügbar)
                    </div>
                  </div>
                ) : null}

                {/* Fahrzeug-Details direkt in der Karte */}
                {selectedVehicle && (
                  <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 max-w-sm z-20">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className={`p-2 rounded-full ${getStatusColor(selectedVehicle.status)}`}>
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">{selectedVehicle.name}</h4>
                            <p className="text-xs text-gray-500">{selectedVehicle.driver}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedVehicle(null)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedVehicle.status)}`}>
                            {getStatusText(selectedVehicle.status)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Geschwindigkeit:</span>
                          <span className="text-gray-600">{selectedVehicle.speed} km/h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Batterie:</span>
                          <span className="text-gray-600">{selectedVehicle.fuel}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Job:</span>
                          <span className="text-gray-600 truncate max-w-32">{selectedVehicle.currentJob}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Nächster Stopp:</span>
                          <span className="text-gray-600 truncate max-w-32">{selectedVehicle.nextStop}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Map Controls - Unter der Karte */}
              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={fetchVehicleData}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Aktualisieren</span>
                  </button>
                  <button 
                    onClick={initializeMap}
                    className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Karte neu laden</span>
                  </button>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live-Tracking aktiv</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fahrzeug-Sidebar - Rechts */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-lg">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Fahrzeug-Übersicht</h3>
            <p className="text-sm text-gray-500">{vehicles.length} Fahrzeuge aktiv</p>
          </div>

          {/* Fahrzeug-Liste */}
          <div className="flex-1 overflow-y-auto">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className={`p-4 border-b border-gray-200 cursor-pointer transition-colors ${
                  selectedVehicle?.id === vehicle.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                }`}
                onClick={() => {
                  setSelectedVehicle(vehicle);
                  zoomToVehicle(vehicle);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${getStatusColor(vehicle.status)}`}>
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{vehicle.name}</h4>
                      <p className="text-sm text-gray-500">{vehicle.driver}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(vehicle.status)}`}>
                    {getStatusText(vehicle.status)}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Route className="w-4 h-4 mr-2" />
                    <span className="truncate">{vehicle.currentJob}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="truncate">{vehicle.nextStop}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{vehicle.estimatedArrival ? vehicle.estimatedArrival.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center text-gray-600">
                        <Fuel className="w-4 h-4 mr-1" />
                        <span>{vehicle.fuel}%</span>
                      </div>
                      
                      <div className="text-gray-600">
                        {vehicle.speed} km/h
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          zoomToVehicle(vehicle);
                        }}
                        className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        title="Zur Position zoomen"
                      >
                        <Navigation className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detailbereich entfernt - wird durch Popup auf der Karte ersetzt */}
        </div>
      </div>

            {/* Fahrzeug-Details werden jetzt direkt in der Karte angezeigt */}
    </div>
  );
};

export default TourDashboard;
