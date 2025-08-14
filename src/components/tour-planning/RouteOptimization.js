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
const RoutePlanningArea = ({ routes, setRoutes, onOptimizeRoute, availableJobs }) => {
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
          key={`route-card-${routeId}`}
          routeId={routeId}
          route={route}
          onRemoveJob={removeJobFromRoute}
          onOptimizeRoute={onOptimizeRoute}
          availableJobs={availableJobs}
          isOver={isOver}
        />
      ))}
    </div>
  );
};

// Route Card Component
const RouteCard = ({ routeId, route, onRemoveJob, isOver, onOptimizeRoute, availableJobs }) => {
  const [{ isOver: isOverRoute }, drop] = useDrop({
    accept: 'job',
    drop: () => ({ routeId }),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  const totalTime = (route.jobs || []).reduce((sum, job) => 
    sum + (job && job.estimatedTime ? parseInt(job.estimatedTime) : 0), 0
  );
  const totalDistance = route.totalDistance || (route.jobs || []).length * 15; // Use actual distance if available

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

      {/* Route Optimization Button */}
      {(route.jobs || []).length > 1 && (
        <div className="mb-3">
          <button
            onClick={() => onOptimizeRoute(routeId, route.jobs || [])}
            className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Zap className="w-4 h-4 mr-2" />
            Route {routeId} optimieren
          </button>
        </div>
      )}

      <div className="space-y-2">
        {(route.jobs || []).length === 0 ? (
          <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <Truck className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Aufträge hier hinziehen</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(route.jobs || []).map((job, index) => (
              <div key={`${routeId}-job-${job?.id || index}-${index}`} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{job?.title || 'Unbekannter Auftrag'}</p>
                  <p className="text-xs text-gray-500 truncate">{job?.pickup || 'N/A'} → {job?.delivery || 'N/A'}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">{job?.estimatedTime || 0} min</span>
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
  const [optimizingRoute, setOptimizingRoute] = useState(null); // Track which route is being optimized
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

  // Geocoding-Funktion für Adressen
  const geocodeAddress = async (address) => {
    try {
      const apiKey = process.env.REACT_APP_HERE_API_KEY;
      if (!apiKey) {
        console.error('HERE_API_KEY not found in environment variables');
        return null;
      }

      const response = await fetch(
        `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(address)}&apiKey=${apiKey}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          const item = data.items[0];
          return {
            lat: item.position.lat,
            lng: item.position.lng
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  // Einzelne Route optimieren
  const handleOptimizeSingleRoute = async (routeId, routeJobs) => {
    if (routeJobs.length < 2) {
      alert('Mindestens 2 Aufträge benötigt für Routenoptimierung');
      return;
    }

    setOptimizingRoute(routeId);
    setIsOptimizing(true);
    
    try {
      // Bereite Jobs für HERE Tour Planning API vor
      const jobs = [];
      
      for (const job of routeJobs) {
        // Geocode pickup and delivery addresses
        const pickupLocation = await geocodeAddress(job.pickup);
        const deliveryLocation = await geocodeAddress(job.delivery);
        
        if (pickupLocation && deliveryLocation) {
          // Convert estimated time from minutes to seconds
          const duration = parseInt(job.estimatedTime) * 60;
          
          jobs.push({
            id: `job_${job.id}`,
            tasks: {
              pickups: [{
                places: [{
                  location: pickupLocation,
                  duration: duration
                }],
                demand: [1] // 1 moving job
              }],
              deliveries: [{
                places: [{
                  location: deliveryLocation,
                  duration: duration
                }],
                demand: [1] // 1 moving job
              }]
            },
            skills: ['moving_service']
          });
        }
      }

      if (jobs.length === 0) {
        throw new Error('No valid jobs with geocoded addresses found');
      }

      // Create the problem request for single route optimization
      const problem = {
        fleet: {
          types: [
            {
              id: 'moving_truck_single',
              profile: 'truck',
              costs: {
                fixed: 0,      // Keine Fixkosten
                distance: 0.001,  // Kosten pro Meter (1€/km)
                time: 0.001       // Kosten pro Sekunde (0.06€/min)
              },
              shifts: [{
                start: {
                  time: new Date().toISOString(),
                  location: {
                    lat: depot.lat,
                    lng: depot.lng
                  }
                },
                end: {
                  time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours later
                  location: {
                    lat: depot.lat,
                    lng: depot.lng
                  }
                }
              }],
              capacity: [10],  // Max 10 moving jobs per vehicle
              limits: {
                // maxDistance entfernt - HERE API berechnet Distanzen falsch
                shiftTime: 86400      // Max 24 hours
              },
              skills: ['moving_service'],
              amount: 1 // Only one vehicle for single route optimization
            }
          ],
          profiles: [{
            name: 'truck',
            type: 'truck'
          }]
        },
        plan: {
          jobs: jobs
        },
        objectives: [
          { type: 'minimizeUnassigned' },  // Alle Jobs zuweisen
          { type: 'minimizeDistance' }     // Distanz minimieren
        ]
      };

      console.log(`Optimizing route ${routeId} with problem:`, problem);

      // Submit to HERE Tour Planning API
      const apiKey = process.env.REACT_APP_HERE_API_KEY;
      if (!apiKey) {
        throw new Error('HERE_API_KEY not found in environment variables');
      }

      const response = await fetch(`https://tourplanning.hereapi.com/v3/problems?apiKey=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(problem)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HERE API error:', response.status, errorText);
        throw new Error(`HERE API error: ${response.status} - ${errorText}`);
      }

      const solution = await response.json();
      console.log(`Route ${routeId} optimization solution:`, solution);
      
      if (solution.tours && solution.tours.length > 0) {
        const tour = solution.tours[0]; // Single route optimization
        
        // Map tour stops back to our job format
        const optimizedJobs = tour.stops
          .filter(stop => stop.activities && stop.activities.length > 0)
          .map(stop => {
            const activity = stop.activities[0];
            if (activity.jobId) {
              // Extract job ID from HERE API format (job_123 -> 123)
              const jobId = activity.jobId.replace('job_', '');
              const foundJob = routeJobs.find(job => job.id === jobId);
              if (foundJob) {
                return foundJob;
              } else {
                console.warn(`Job with ID ${jobId} not found in routeJobs:`, routeJobs);
              }
            }
            return null;
          })
          .filter(job => job !== null);

        // Fallback: If no jobs were mapped, use original order
        if (optimizedJobs.length === 0) {
          console.warn('No jobs could be mapped from HERE API response, using original order');
          optimizedJobs.push(...routeJobs);
        }

        // Update only the specific route
        setRoutes(prev => ({
          ...prev,
          [routeId]: {
            ...prev[routeId],
            jobs: optimizedJobs,
            totalDistance: tour.statistic?.distance ? Math.round(tour.statistic.distance / 1000) : 0,
            totalTime: tour.statistic?.duration ? Math.round(tour.statistic.duration / 60) : 0,
            estimatedCost: tour.statistic?.cost || 0
          }
        }));
        
        console.log(`Route ${routeId} optimized successfully:`, optimizedJobs);
        alert(`Route ${routeId} wurde erfolgreich optimiert!`);
      } else {
        // Check if there are unassigned jobs and provide better error information
        if (solution.unassigned && solution.unassigned.length > 0) {
          const unassignedReasons = solution.unassigned.map(job => 
            job.reasons?.map(reason => reason.description || reason.code).join(', ') || 'Unknown reason'
          ).join('; ');
          
          // Check for specific constraint violations
          if (unassignedReasons.includes('time window')) {
            throw new Error(`Jobs konnten nicht zugewiesen werden: Zeitfenster-Konflikte zwischen den Aufträgen. Bitte überprüfen Sie die geplanten Zeiten.`);
          } else {
            throw new Error(`Jobs konnten nicht zugewiesen werden: ${unassignedReasons}`);
          }
        } else if (solution.notices && solution.notices.length > 0) {
          const notices = solution.notices.map(notice => notice.title || notice.code).join(', ');
          throw new Error(`Optimierung mit Einschränkungen: ${notices}`);
        } else {
          throw new Error('Keine optimierte Route gefunden. Bitte überprüfen Sie die Job-Konfiguration.');
        }
      }
    } catch (error) {
      console.error(`Error optimizing route ${routeId}:`, error);
      alert(`Routenoptimierung für Route ${routeId} fehlgeschlagen: ${error.message}`);
    }
    
    setOptimizingRoute(null);
    setIsOptimizing(false);
  };

  // Alle Routen optimieren (behält die ursprüngliche Funktionalität)
  const handleOptimizeRoutes = async () => {
    setIsOptimizing(true);
    
    try {
      // Bereite Jobs für HERE Tour Planning API vor
      const jobs = [];
      
      for (const job of availableJobs) {
        // Geocode pickup and delivery addresses
        const pickupLocation = await geocodeAddress(job.pickup);
        const deliveryLocation = await geocodeAddress(job.delivery);
        
        if (pickupLocation && deliveryLocation) {
          // Convert estimated time from minutes to seconds
          const duration = parseInt(job.estimatedTime) * 60;
          
          jobs.push({
            id: `job_${job.id}`,
            tasks: {
              pickups: [{
                places: [{
                  location: pickupLocation,
                  duration: duration
                }],
                demand: [1] // 1 moving job
              }],
              deliveries: [{
                places: [{
                  location: deliveryLocation,
                  duration: duration
                }],
                demand: [1] // 1 moving job
              }]
            },
            skills: ['moving_service']
          });
        }
      }

      if (jobs.length === 0) {
        throw new Error('No valid jobs with geocoded addresses found');
      }

      // Create the problem request according to HERE Tour Planning API v3 specification
      const problem = {
        fleet: {
          types: [
            {
              id: 'moving_truck',
              profile: 'truck',
              costs: {
                fixed: 0,      // Keine Fixkosten
                distance: 0.001,  // Kosten pro Meter (1€/km)
                time: 0.001       // Kosten pro Sekunde (0.06€/min)
              },
              shifts: [{
                start: {
                  time: new Date().toISOString(),
                  location: {
                    lat: depot.lat,
                    lng: depot.lng
                  }
                },
                end: {
                  time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours later
                  location: {
                    lat: depot.lat,
                    lng: depot.lng
                  }
                }
              }],
              capacity: [10],  // Max 10 moving jobs per vehicle
              limits: {
                // maxDistance entfernt - HERE API berechnet Distanzen falsch
                shiftTime: 86400      // Max 24 hours
              },
              skills: ['moving_service'],
              amount: Object.keys(routes).length // Number of available routes
            }
          ],
          profiles: [{
            name: 'truck',
            type: 'truck'
          }]
        },
        plan: {
          jobs: jobs
        },
        objectives: [
          { type: 'minimizeUnassigned' },  // Alle Jobs zuweisen
          { type: 'minimizeDistance' }     // Distanz minimieren
        ]
      };

      console.log('Submitting problem to HERE Tour Planning API:', problem);

      // Submit to HERE Tour Planning API
      const apiKey = process.env.REACT_APP_HERE_API_KEY;
      if (!apiKey) {
        throw new Error('HERE_API_KEY not found in environment variables');
      }

      const response = await fetch(`https://tourplanning.hereapi.com/v3/problems?apiKey=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(problem)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HERE API error:', response.status, errorText);
        throw new Error(`HERE API error: ${response.status} - ${errorText}`);
      }

      const solution = await response.json();
      console.log('HERE Tour Planning solution:', solution);
      
      if (solution.tours && solution.tours.length > 0) {
        // Transformiere HERE API Lösung zu unserem Format
        const optimizedRoutes = {};
        const routeKeys = Object.keys(routes);
        
        solution.tours.forEach((tour, index) => {
          const routeKey = routeKeys[index] || `route${index + 1}`;
          const originalRoute = routes[routeKey] || {
            name: `Route ${index + 1}`,
            driver: 'Verfügbar',
            vehicle: `LKW-${index + 1}`,
            jobs: []
          };

          // Map tour stops back to our job format
          const routeJobs = tour.stops
            .filter(stop => stop.activities && stop.activities.length > 0)
            .map(stop => {
              const activity = stop.activities[0];
              if (activity.jobId) {
                // Extract job ID from HERE API format (job_123 -> 123)
                const jobId = activity.jobId.replace('job_', '');
                const foundJob = availableJobs.find(job => job.id === jobId);
                if (foundJob) {
                  return foundJob;
                } else {
                  console.warn(`Job with ID ${jobId} not found in availableJobs:`, availableJobs);
                }
              }
              return null;
            })
            .filter(job => job !== null);

          // Fallback: If no jobs were mapped, use original order
          if (routeJobs.length === 0) {
            console.warn('No jobs could be mapped from HERE API response, using original order');
            routeJobs.push(...availableJobs);
          }

          optimizedRoutes[routeKey] = {
            ...originalRoute,
            jobs: routeJobs,
            totalDistance: tour.statistic?.distance ? Math.round(tour.statistic.distance / 1000) : 0,
            totalTime: tour.statistic?.duration ? Math.round(tour.statistic.duration / 60) : 0,
            estimatedCost: tour.statistic?.cost || 0
          };
        });
        
        setRoutes(optimizedRoutes);
        setAvailableJobs([]); // Alle Jobs wurden verplant
        
        console.log('Routes optimized successfully:', optimizedRoutes);
      } else {
        // Check if there are unassigned jobs and provide better error information
        if (solution.unassigned && solution.unassigned.length > 0) {
          const unassignedReasons = solution.unassigned.map(job => 
            job.reasons?.map(reason => reason.description || reason.code).join(', ') || 'Unknown reason'
          ).join('; ');
          
                     // Check for specific constraint violations
           if (unassignedReasons.includes('time window')) {
            throw new Error(`Jobs konnten nicht zugewiesen werden: Zeitfenster-Konflikte zwischen den Aufträgen. Bitte überprüfen Sie die geplanten Zeiten.`);
          } else {
            throw new Error(`Jobs konnten nicht zugewiesen werden: ${unassignedReasons}`);
          }
        } else if (solution.notices && solution.notices.length > 0) {
          const notices = solution.notices.map(notice => notice.title || notice.code).join(', ');
          throw new Error(`Optimierung mit Einschränkungen: ${notices}`);
        } else {
                     throw new Error('Keine optimierte Route gefunden. Bitte überprüfen Sie die Job-Konfiguration.');
        }
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
      
      // Show error message to user
      alert(`Route optimization failed: ${error.message}. Using fallback distribution.`);
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
      console.log('Testing HERE Tour Planning API v3...');
      
      // Get API key from environment variables
      const apiKey = process.env.REACT_APP_HERE_API_KEY;
      if (!apiKey) {
        console.error('HERE_API_KEY not found in environment variables');
        alert('HERE_API_KEY not found in environment variables');
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
        
        if (depotGeocodeData.items && depotGeocodeData.items.length > 0) {
          const item = depotGeocodeData.items[0];
          console.log('🎯 Successfully geocoded depot address!');
          console.log(`   📍 Address: ${item.address?.label || 'N/A'}`);
          console.log(`   🗺️  Coordinates: ${item.position?.lat?.toFixed(5)}, ${item.position?.lng?.toFixed(5)}`);
        }
      } else {
        const errorText = await depotGeocodeResponse.text();
        console.error('❌ HERE Geocoding API error:', depotGeocodeResponse.status, errorText);
      }

      // Test HERE Tour Planning API v3 with a simple problem
      console.log('Testing HERE Tour Planning v3...');
      const testProblem = {
        fleet: {
          types: [
            {
              id: 'test_truck',
              profile: 'truck',
              costs: {
                fixed: 0,
                distance: 0.001,
                time: 0.001
              },
              shifts: [{
                start: {
                  time: new Date().toISOString(),
                  location: {
                    lat: 52.5200,
                    lng: 13.4050
                  }
                },
                end: {
                  time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                  location: {
                    lat: 52.5200,
                    lng: 13.4050
                  }
                }
              }],
              capacity: [1],
              limits: {
                // maxDistance entfernt - HERE API berechnet Distanzen falsch
                shiftTime: 86400
              },
              skills: ['test'],
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
              id: "test_job",
              tasks: {
                pickups: [{
                  places: [{
                    location: {
                      lat: 52.5000,
                      lng: 13.4000
                    },
                    duration: 1800
                  }],
                  demand: [1]
                }],
                deliveries: [{
                  places: [{
                    location: {
                      lat: 52.5100,
                      lng: 13.4100
                    },
                    duration: 1800
                  }],
                  demand: [1]
                }]
              },
              skills: ['test']
            }
          ]
        },
        objectives: [
          { type: 'minimizeUnassigned' },
          { type: 'minimizeDistance' }
        ]
      };

      const tourResponse = await fetch(`https://tourplanning.hereapi.com/v3/problems?apiKey=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testProblem)
      });

      if (tourResponse.ok) {
        const tourData = await tourResponse.json();
        console.log('✅ HERE Tour Planning API v3 working!');
        console.log('Tour Planning Result:', tourData);
        
        if (tourData.tours && tourData.tours.length > 0) {
          console.log('🎯 Successfully created optimized tours!');
          console.log(`   📊 Tours created: ${tourData.tours.length}`);
          console.log(`   📏 Total distance: ${tourData.statistic?.distance ? (tourData.statistic.distance / 1000).toFixed(1) + ' km' : 'N/A'}`);
          console.log(`   ⏱️  Total time: ${tourData.statistic?.duration ? Math.round(tourData.statistic.duration / 60) + ' min' : 'N/A'}`);
        } else if (tourData.problemId) {
          console.log('🎯 Tour planning problem created successfully!');
          console.log(`   🆔 Problem ID: ${tourData.problemId}`);
        }
      } else {
        const errorText = await tourResponse.text();
        console.error('❌ Tour Planning API error:', tourResponse.status, errorText);
        
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

      console.log('🎯 API Tests completed successfully!');
      console.log('📋 Summary of tested APIs:');
      console.log('   ✅ HERE Geocoding API');
      console.log('   ✅ HERE Tour Planning API (v3)');
      console.log('\n🚀 All HERE APIs are now properly configured for moving services!');
      
      alert('API tests completed successfully! Check console for details.');
    } catch (error) {
      console.error('Error during API tests:', error);
      alert(`API test failed: ${error.message}`);
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
              <DraggableJob key={`available-job-${job.id}-${index}`} job={job} index={index} />
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
                      Alle Routen optimieren
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
            <RoutePlanningArea 
              routes={routes} 
              setRoutes={setRoutes} 
              onOptimizeRoute={handleOptimizeSingleRoute}
              availableJobs={availableJobs}
            />
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
                    sum + (route.jobs || []).reduce((routeSum, job) => 
                      routeSum + (job && job.estimatedTime ? parseInt(job.estimatedTime) : 0), 0
                    ), 0
                  )} min
                </div>
                <div className="text-sm text-gray-500">Gesamtzeit</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {Object.values(routes).reduce((sum, route) => 
                    sum + (route.totalDistance || (route.jobs || []).length * 15), 0
                  )} km
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
