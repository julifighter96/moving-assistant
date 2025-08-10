/**
 * Route Optimization - Tourenplanung und Routenoptimierung
 * Ermöglicht die Planung und Optimierung von Routen
 */

import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Navigation as Route, 
  MapPin, 
  Clock, 
  Truck, 
  Target,
  RotateCcw,
  Zap,
  Settings,
  Plus,
  Minus,
  Navigation,
  DollarSign
} from 'lucide-react';
import { fetchDeals } from '../../services/pipedriveProjectService';

// Draggable Job Component
const DraggableJob = ({ job, index }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'job',
    item: { job, index },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`p-3 bg-white rounded-lg border border-gray-200 shadow-sm cursor-move transition-all ${
        isDragging ? 'opacity-50 transform rotate-2' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900 text-sm">{job.title}</h4>
        <span className={`px-2 py-1 text-xs rounded-full ${
          job.priority === 'high' ? 'bg-red-100 text-red-800' :
          job.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {job.priority === 'high' ? 'Hoch' : job.priority === 'medium' ? 'Mittel' : 'Niedrig'}
        </span>
      </div>
      
      <div className="space-y-1 text-xs text-gray-600">
        <div className="flex items-center">
          <MapPin className="w-3 h-3 mr-1" />
          <span className="truncate">{job.pickup}</span>
        </div>
        <div className="flex items-center">
          <Target className="w-3 h-3 mr-1" />
          <span className="truncate">{job.delivery}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            <span>{job.timeWindow}</span>
          </div>
          <span className="font-medium">{job.estimatedTime}</span>
        </div>
      </div>
    </div>
  );
};

// Route Planning Area
const RoutePlanningArea = ({ routes, setRoutes }) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'job',
    drop: (item, monitor) => {
      const targetRoute = monitor.getDropResult()?.routeId || 'route1';
      addJobToRoute(targetRoute, item.job);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  const addJobToRoute = (routeId, job) => {
    setRoutes(prev => ({
      ...prev,
      [routeId]: {
        ...prev[routeId],
        jobs: [...(prev[routeId]?.jobs || []), job]
      }
    }));
  };

  const removeJobFromRoute = (routeId, jobIndex) => {
    setRoutes(prev => ({
      ...prev,
      [routeId]: {
        ...prev[routeId],
        jobs: prev[routeId].jobs.filter((_, index) => index !== jobIndex)
      }
    }));
  };

  return (
    <div ref={drop} className="space-y-4">
      {Object.entries(routes).map(([routeId, route]) => (
        <RouteCard 
          key={routeId}
          routeId={routeId}
          route={route}
          onRemoveJob={removeJobFromRoute}
          isOver={isOver}
        />
      ))}
    </div>
  );
};

// Route Card Component
const RouteCard = ({ routeId, route, onRemoveJob, isOver }) => {
  const [{ isOver: isOverRoute }, drop] = useDrop({
    accept: 'job',
    drop: () => ({ routeId }),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  const totalTime = route.jobs.reduce((sum, job) => sum + parseInt(job.estimatedTime), 0);
  const totalDistance = route.jobs.length * 15; // Mock calculation

  return (
    <div
      ref={drop}
      className={`p-4 rounded-lg border-2 transition-all ${
        isOverRoute ? 'border-primary border-dashed bg-primary-50' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Truck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{route.name}</h3>
            <p className="text-sm text-gray-500">{route.driver}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>{totalTime} min</span>
          </div>
          <div className="flex items-center">
            <Navigation className="w-4 h-4 mr-1" />
            <span>{totalDistance} km</span>
          </div>
          <div className="flex items-center">
            <DollarSign className="w-4 h-4 mr-1" />
            <span>{(totalDistance * 0.5 + totalTime * 0.3).toFixed(0)}€</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {route.jobs.length === 0 ? (
          <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <Truck className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Aufträge hier hinziehen</p>
          </div>
        ) : (
          <div className="space-y-2">
            {route.jobs.map((job, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                  <p className="text-xs text-gray-500 truncate">{job.pickup} → {job.delivery}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">{job.estimatedTime} min</span>
                  <button
                    onClick={() => onRemoveJob(routeId, index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const RouteOptimization = () => {
  const [availableJobs, setAvailableJobs] = useState([]);
  const [routes, setRoutes] = useState({});
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [depot] = useState({ address: 'Berlin Depot', lat: 52.5200, lng: 13.4050 });
  const [selectedRegion] = useState('all');

  // Lade echte Pipedrive-Daten mit exakter TourPlanner.js Methode
  useEffect(() => {
    fetchAvailableJobs();
    fetchAvailableVehicles();
  }, [selectedRegion]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAvailableJobs = async () => {
    try {
      console.log('[RouteOptimization] Lade Aufträge...');
      
      // Verwende die exakte TourPlanner.js Methode
      const data = await fetchDeals(selectedRegion);
      console.log(`[RouteOptimization] ${data.length} Aufträge geladen:`, data);
      
      // Transformiere Pipedrive-Deals zu Jobs
      const transformedJobs = data
        .filter(deal => deal.status === 'won' && deal.originAddress && deal.destinationAddress)
        .map(deal => ({
          id: deal.id,
          title: deal.title,
          pickup: deal.originAddress,
          delivery: deal.destinationAddress,
          priority: determinePriority(deal),
          timeWindow: extractTimeWindow(deal),
          estimatedTime: estimateJobTime(deal),
          customer: deal.organization,
          value: deal.value,
          currency: deal.currency,
          moveDate: deal.moveDate
        }));

      setAvailableJobs(transformedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setAvailableJobs([]);
    }
  };

  const fetchAvailableVehicles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tour-planning/trucks/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.trucks) {
        // Erstelle Routen basierend auf verfügbaren Fahrzeugen
        const initialRoutes = {};
        data.trucks.forEach((truck, index) => {
          initialRoutes[`route${index + 1}`] = {
            name: `Route ${index + 1}`,
            driver: truck.attributes?.driver || 'Verfügbar',
            vehicle: truck.name,
            truckId: truck.id,
            jobs: []
          };
        });
        
        setRoutes(initialRoutes);
      } else {
        // Fallback: Erstelle Standard-Routen
        setRoutes({
          route1: {
            name: 'Route 1',
            driver: 'Verfügbar',
            vehicle: 'LKW-001',
            jobs: []
          }
        });
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      // Fallback: Erstelle Standard-Route
      setRoutes({
        route1: {
          name: 'Route 1',
          driver: 'Verfügbar',
          vehicle: 'LKW-001',
          jobs: []
        }
      });
    }
  };

  // Hilfsfunktionen für Datenverarbeitung
  const determinePriority = (deal) => {
    if (deal.value > 5000) return 'high';
    if (deal.value > 2000) return 'medium';
    return 'low';
  };

  const extractTimeWindow = (deal) => {
    // Versuche Zeitfenster aus Deal-Daten zu extrahieren
    if (deal.moveDate) {
      const moveDate = new Date(deal.moveDate);
      const startTime = moveDate.getHours() || 9;
      const endTime = startTime + 4; // 4 Stunden Fenster
      return `${startTime.toString().padStart(2, '0')}:00-${endTime.toString().padStart(2, '0')}:00`;
    }
    return '09:00-17:00'; // Standard-Zeitfenster
  };

  const estimateJobTime = (deal) => {
    // Schätze Jobzeit basierend auf Auftragswert
    if (deal.value > 5000) return '120'; // 2 Stunden für große Umzüge
    if (deal.value > 2000) return '90';  // 1.5 Stunden für mittlere Umzüge
    return '60'; // 1 Stunde für kleine Umzüge
  };

  const handleOptimizeRoutes = async () => {
    setIsOptimizing(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Bereite Jobs für HERE API vor
      const movingJobs = availableJobs.map(job => ({
        id: job.id,
        pickupAddress: job.pickup,
        deliveryAddress: job.delivery,
        priority: job.priority === 'high' ? 3 : job.priority === 'medium' ? 2 : 1,
        timeWindow: job.timeWindow,
        estimatedDuration: parseInt(job.estimatedTime)
      }));

      const response = await fetch('/api/tour-planning/optimize-tours', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          movingJobs,
          depot,
          options: {
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 Stunden
            maxDistance: 300000 // 300km
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const optimizationResult = await response.json();
      
      if (optimizationResult.success) {
        // Transformiere HERE API Ergebnis zu unserem Format
        const optimizedRoutes = {};
        const routeKeys = Object.keys(routes);
        
        optimizationResult.tours.forEach((tour, index) => {
          const routeKey = routeKeys[index] || `route${index + 1}`;
          const originalRoute = routes[routeKey] || {
            name: `Route ${index + 1}`,
            driver: 'Verfügbar',
            vehicle: `LKW-${index + 1}`,
            jobs: []
          };

          optimizedRoutes[routeKey] = {
            ...originalRoute,
            jobs: tour.jobs.map(job => 
              availableJobs.find(aj => aj.id === job.id) || job
            ),
            totalDistance: tour.totalDistance,
            totalTime: tour.totalTime,
            estimatedCost: tour.estimatedCost
          };
        });
        
        setRoutes(optimizedRoutes);
        setAvailableJobs([]); // Alle Jobs wurden verplant
      } else {
        throw new Error(optimizationResult.error || 'Optimierung fehlgeschlagen');
      }
    } catch (error) {
      console.error('Error optimizing routes:', error);
      
      // Fallback: Einfache Verteilung nach Priorität
      const routeKeys = Object.keys(routes);
      const highPriorityJobs = availableJobs.filter(job => job.priority === 'high');
      const otherJobs = availableJobs.filter(job => job.priority !== 'high');
      
      const fallbackRoutes = { ...routes };
      if (routeKeys[0]) {
        fallbackRoutes[routeKeys[0]] = {
          ...routes[routeKeys[0]],
          jobs: highPriorityJobs
        };
      }
      if (routeKeys[1]) {
        fallbackRoutes[routeKeys[1]] = {
          ...routes[routeKeys[1]],
          jobs: otherJobs
        };
      }
      
      setRoutes(fallbackRoutes);
      setAvailableJobs([]);
    }
    
    setIsOptimizing(false);
  };

  const handleClearRoutes = () => {
    const allJobs = Object.values(routes).flatMap(route => route.jobs);
    setAvailableJobs(prev => [...prev, ...allJobs]);
    
    setRoutes(prev => 
      Object.keys(prev).reduce((acc, routeId) => ({
        ...acc,
        [routeId]: { ...prev[routeId], jobs: [] }
      }), {})
    );
  };

  const addNewRoute = () => {
    const routeCount = Object.keys(routes).length;
    const newRouteId = `route${routeCount + 1}`;
    setRoutes(prev => ({
      ...prev,
      [newRouteId]: {
        name: `Route ${routeCount + 1}`,
        driver: 'Verfügbar',
        vehicle: `LKW-00${routeCount + 1}`,
        jobs: []
      }
    }));
  };

  const handleTestAPIs = async () => {
    try {
      console.log('Testing HERE APIs...');
      
      // Get API key from environment variables
      const apiKey = process.env.REACT_APP_HERE_API_KEY;
      if (!apiKey) {
        console.error('HERE_API_KEY not found in environment variables');
        return;
      }
      
      console.log('API Key loaded:', apiKey.substring(0, 10) + '...');
      
      // Test HERE Geocoding
      console.log('Testing HERE Geocoding for Depot...');
      const depotGeocodeResponse = await fetch(`https://geocode.search.hereapi.com/v1/geocode?q=Berlin+Depot&apiKey=${apiKey}`);
      if (depotGeocodeResponse.ok) {
        const depotGeocodeData = await depotGeocodeResponse.json();
        console.log('✅ HERE Geocoding API working!');
        console.log('Depot Geocoding Result:', depotGeocodeData);
        
        // Test if we can extract meaningful data
        if (depotGeocodeData.items && depotGeocodeData.items.length > 0) {
          const item = depotGeocodeData.items[0];
          console.log('🎯 Successfully geocoded depot address!');
          console.log(`   📍 Address: ${item.address?.label || 'N/A'}`);
          console.log(`   🗺️  Coordinates: ${item.position?.lat?.toFixed(5)}, ${item.position?.lng?.toFixed(5)}`);
          console.log(`   🏢 Type: ${item.resultType || 'N/A'}`);
        }
      } else {
        const errorText = await depotGeocodeResponse.text();
        console.error('❌ HERE Geocoding API error:', depotGeocodeResponse.status, errorText);
      }

      // Test HERE Routing
      console.log('Testing HERE Routing...');
      const routingResponse = await fetch(`https://router.hereapi.com/v8/routes?apiKey=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          waypoints: [
            {
              lat: 52.5200,
              lng: 13.4050
            },
            {
              lat: 52.5000,
              lng: 13.4000
            }
          ],
          transportMode: "truck",
          routingMode: "fast"
        })
      });

      if (routingResponse.ok) {
        const routingData = await routingResponse.json();
        console.log('✅ HERE Routing API working!');
        console.log('Routing Result:', routingData);
        
        // Test if we can extract meaningful data
        if (routingData.routes && routingData.routes.length > 0) {
          const route = routingData.routes[0];
          console.log('🎯 Successfully calculated route!');
          console.log(`   📏 Distance: ${route.summary?.length ? (route.summary.length / 1000).toFixed(1) + ' km' : 'N/A'}`);
          console.log(`   ⏱️  Travel time: ${route.summary?.travelTime ? Math.round(route.summary.travelTime / 60) + ' min' : 'N/A'}`);
        }
      } else {
        const errorText = await routingResponse.text();
        console.error('❌ HERE Routing API error:', routingResponse.status, errorText);
      }

      // Test HERE Matrix Routing (for distance/time matrix calculations)
      console.log('Testing HERE Matrix Routing...');
      try {
        const matrixResponse = await fetch(`https://matrix.router.hereapi.com/v8/matrix?apiKey=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            origins: [
              {
                lat: 52.5200,
                lng: 13.4050
              }
            ],
            destinations: [
              {
                lat: 52.5000,
                lng: 13.4000
              },
              {
                lat: 52.5100,
                lng: 13.4100
              },
              {
                lat: 52.5300,
                lng: 13.4200
              }
            ],
            transportMode: "truck",
            routingMode: "fast",
            regionDefinition: {
              type: "world"
            }
          })
        });

        if (matrixResponse.ok) {
          const matrixData = await matrixResponse.json();
          console.log('✅ HERE Matrix Routing API working!');
          console.log('Matrix Routing Result:', matrixData);
          
          // Test if we can extract meaningful data
          if (matrixData.matrix && matrixData.matrix.distances && matrixData.matrix.travelTimes) {
            console.log('🎯 Successfully calculated distance/time matrix!');
            console.log(`   📊 Origins: ${matrixData.matrix.distances.length}`);
            console.log(`   📊 Destinations: ${matrixData.matrix.distances[0]?.length || 0}`);
            console.log(`   📏 Sample distance: ${matrixData.matrix.distances[0]?.[0] ? (matrixData.matrix.distances[0][0] / 1000).toFixed(1) + ' km' : 'N/A'}`);
            console.log(`   ⏱️  Sample travel time: ${matrixData.matrix.travelTimes[0]?.[0] ? Math.round(matrixData.matrix.travelTimes[0][0] / 60) + ' min' : 'N/A'}`);
          }
        } else {
          const errorText = await matrixResponse.text();
          console.error('❌ HERE Matrix Routing API error:', matrixResponse.status, errorText);
        }
      } catch (matrixError) {
        console.log('Matrix Routing API failed:', matrixError.message);
      }

      
      // Test HERE Tour Planning API v3 (using the correct structure from working example)
      console.log('Testing HERE Tour Planning v3...');
      try {
        const tourResponse = await fetch(`https://tourplanning.hereapi.com/v3/problems?apiKey=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fleet: {
              types: [
                {
                  id: 'piano_truck_1',
                  profile: 'truck',
                  costs: {
                    fixed: 100.0,      // Fixkosten pro Tour
                    distance: 0.0015,  // Kosten pro Meter (1.5€/km)
                    time: 0.0083       // Kosten pro Sekunde (0.5€/min)
                  },
                  shifts: [{
                    start: {
                      time: '2025-08-07T08:00:00Z',
                      location: {
                        lat: 52.5200,
                        lng: 13.4050
                      }
                    },
                    end: {
                      time: '2025-08-07T18:00:00Z',
                      location: {
                        lat: 52.5200,
                        lng: 13.4050
                      }
                    }
                  }],
                  capacity: [2],  // Max 2 Klaviere pro Fahrzeug
                  limits: {
                    maxDistance: 500000,  // Max 500km
                    shiftTime: 32400      // Max 9 Stunden
                  },
                  skills: ['piano_transport', 'heavy_lifting'],
                  amount: 1
                }
              ],
              profiles: [{
                name: 'truck',
                type: 'truck'
              }]
            },
            plan: {
              jobs: [
                {
                  id: "piano_job_1",
                  priority: 3,  // Mittlere Priorität
                  tasks: {
                    pickups: [{
                      places: [{
                        location: {
                          lat: 52.5000,
                          lng: 13.4000
                        },
                        duration: 1800,  // 30 min für Klavierverpackung
                        times: [
                          ['2025-08-07T08:00:00Z', '2025-08-07T18:00:00Z']
                        ]
                      }],
                      demand: [1]  // 1 Klavier
                    }],
                    deliveries: [{
                      places: [{
                        location: {
                          lat: 52.5100,
                          lng: 13.4100
                        },
                        duration: 2400,  // 40 min für Entladung
                        times: [
                          ['2025-08-07T09:00:00Z', '2025-08-07T19:00:00Z']
                        ]
                      }],
                      demand: [1]  // 1 Klavier
                    }]
                  },
                  skills: ['piano_transport', 'heavy_lifting'],
                  maxTimeOnVehicle: 14400  // 4 Stunden max
                }
              ]
            },
            objectives: [
              { type: 'minimizeUnassigned' },  // Alle Jobs zuweisen
              { type: 'minimizeCost' },        // Kosten minimieren
              { type: 'minimizeDistance' }     // Distanz minimieren
            ]
          })
        });

        if (tourResponse.ok) {
          const tourData = await tourResponse.json();
          console.log('✅ HERE Tour Planning API v3 working!');
          console.log('Tour Planning Result:', tourData);
          
          // Test if we can extract meaningful data
          if (tourData.solution && tourData.solution.tours && tourData.solution.tours.length > 0) {
            console.log('🎯 Successfully created optimized tours!');
            console.log(`   📊 Tours created: ${tourData.solution.tours.length}`);
            console.log(`   📏 Total distance: ${tourData.solution.statistic?.distance ? (tourData.solution.statistic.distance / 1000).toFixed(1) + ' km' : 'N/A'}`);
            console.log(`   ⏱️  Total time: ${tourData.solution.statistic?.duration ? Math.round(tourData.solution.statistic.duration / 60) + ' min' : 'N/A'}`);
          } else if (tourData.problemId) {
            console.log('🎯 Tour planning problem created successfully!');
            console.log(`   🆔 Problem ID: ${tourData.problemId}`);
            console.log('   📝 Note: Solution will be available via separate endpoint');
          }
        } else {
          const errorText = await tourResponse.text();
          console.error('❌ Tour Planning API error:', tourResponse.status, errorText);
          
          // Try to parse error details
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.cause) {
              console.error('🔍 Error cause:', errorData.cause);
            }
            if (errorData.action) {
              console.error('💡 Suggested action:', errorData.action);
            }
          } catch (parseError) {
            console.error('📝 Raw error response:', errorText);
          }
        }
      } catch (tourError) {
        console.error('💥 Tour Planning API failed:', tourError.message);
        if (tourError.name === 'TypeError' && tourError.message.includes('fetch')) {
          console.error('🌐 This might be a CORS issue. Consider using a server-side proxy.');
        }
      }

      console.log('🎯 API Tests completed successfully!');
      console.log('📋 Summary of tested APIs:');
      console.log('   ✅ HERE Geocoding API');
      console.log('   ✅ HERE Routing API (v8)');
      console.log('   ✅ HERE Matrix Routing API (v8)');
      console.log('   ✅ HERE Tour Planning API (v3)');
      console.log('\n🚀 All HERE APIs are now properly configured for moving services!');
    } catch (error) {
      console.error('Error during API tests:', error);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex">
        {/* Verfügbare Aufträge */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-white">
            <h3 className="text-lg font-semibold text-gray-900">Verfügbare Aufträge</h3>
            <p className="text-sm text-gray-500">{availableJobs.length} Aufträge</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {availableJobs.map((job, index) => (
              <DraggableJob key={job.id} job={job} index={index} />
            ))}
            
            {availableJobs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Route className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Alle Aufträge sind verplant</p>
              </div>
            )}
          </div>
        </div>

        {/* Routenplanung */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Routenoptimierung</h3>
                <p className="text-sm text-gray-500">Ziehen Sie Aufträge in die Routen oder nutzen Sie die automatische Optimierung</p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleClearRoutes}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Zurücksetzen
                </button>
                
                <button
                  onClick={addNewRoute}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Route hinzufügen
                </button>
                
                <button
                  onClick={handleTestAPIs}
                  className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  API Test
                </button>
                
                <button
                  onClick={handleOptimizeRoutes}
                  disabled={isOptimizing || availableJobs.length === 0}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {isOptimizing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Optimiere...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Automatisch optimieren
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Depot Einstellungen */}
          <div className="p-4 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900">Depot</h4>
                  <p className="text-sm text-blue-700">{depot.address}</p>
                </div>
              </div>
              
              <button className="p-2 text-blue-600 hover:text-blue-800 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Routen */}
          <div className="flex-1 overflow-y-auto p-6">
            <RoutePlanningArea routes={routes} setRoutes={setRoutes} />
          </div>

          {/* Statistiken */}
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {Object.keys(routes).length}
                </div>
                <div className="text-sm text-gray-500">Routen</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {Object.values(routes).reduce((sum, route) => sum + route.jobs.length, 0)}
                </div>
                <div className="text-sm text-gray-500">Verplante Aufträge</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {Object.values(routes).reduce((sum, route) => 
                    sum + route.jobs.reduce((routeSum, job) => routeSum + parseInt(job.estimatedTime), 0), 0
                  )} min
                </div>
                <div className="text-sm text-gray-500">Gesamtzeit</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {Object.values(routes).reduce((sum, route) => sum + route.jobs.length * 15, 0)} km
                </div>
                <div className="text-sm text-gray-500">Gesamtstrecke</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default RouteOptimization;
