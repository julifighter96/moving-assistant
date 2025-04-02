import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { MapPin, Calendar, Truck, X, Clock, Search, ChevronRight, Globe, Milestone, Building, Home } from 'lucide-react';
import axios from 'axios';
import { format, parseISO, isValid } from 'date-fns';
import { de } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// Definiere die PipedriveDeal und TourArea als separate Komponenten außerhalb der Hauptkomponente
const PipedriveDeal = ({ deal, index, isDraggable, onRemove }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'deal',
    item: { deal, index },
    canDrag: isDraggable,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={isDraggable ? drag : null}
      className={`p-4 mb-2 rounded-lg border ${isDragging ? 'opacity-50 border-dashed' : 'border-gray-200'} 
                 ${isDraggable ? 'cursor-grab bg-white' : 'bg-primary-50'}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{deal.title}</h3>
          
          <div className="mt-2 space-y-1 text-sm">
            {deal.projectStartDate && (
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                <span>Projekt: {deal.projectStartDate} bis {deal.projectEndDate || '?'}</span>
              </div>
            )}
            
            {deal.moveDate && (
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2 text-primary" />
                <span>{format(parseISO(deal.moveDate), 'dd.MM.yyyy', { locale: de })}</span>
              </div>
            )}
            
            {deal.originAddress && (
              <div className="flex items-start text-gray-600">
                <MapPin className="w-4 h-4 mr-2 mt-0.5 text-green-600" />
                <span className="flex-1">{deal.originAddress}</span>
              </div>
            )}
            
            {deal.destinationAddress && (
              <div className="flex items-start text-gray-600">
                <MapPin className="w-4 h-4 mr-2 mt-0.5 text-red-600" />
                <span className="flex-1">{deal.destinationAddress}</span>
              </div>
            )}

            {deal.region && (
              <div className="flex items-center mt-1">
                <Globe className="w-4 h-4 mr-2 text-blue-500" />
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                  {deal.region}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {!isDraggable && onRemove && (
          <button 
            onClick={() => onRemove(deal.id)}
            className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

// Tour Area Komponente mit Drop Funktionalität
const TourArea = ({ isOver, drop, tourDeals, onRemoveDeal, selectedDate, handleSaveTour, handleCalculateRoute }) => {
  return (
    <div 
      ref={drop}
      className={`bg-white p-4 rounded-xl border ${isOver ? 'border-primary border-dashed' : 'border-gray-200'} shadow-sm h-full`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Truck className="mr-2 h-5 w-5 text-primary" />
          {/* Prüfe, ob selectedDate gültig ist, bevor formatiert wird */}
          Geplante Tour für {selectedDate && isValid(selectedDate) ? format(selectedDate, 'dd.MM.yyyy', { locale: de }) : 'Datum auswählen'}
        </h3>
        
        <button
          onClick={handleSaveTour}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          disabled={!selectedDate || !isValid(selectedDate)}
        >
          Tour speichern
        </button>
      </div>
      
      <div className={`min-h-[200px] rounded-lg mb-4 flex items-center justify-center ${tourDeals.length === 0 ? 'border-2 border-dashed border-gray-300 bg-gray-50' : ''}`}>
        {tourDeals.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p>Ziehen Sie Aufträge hierher, um Ihre Tour zu planen</p>
          </div>
        ) : (
          <div className="w-full space-y-2">
            {tourDeals.map((deal, index) => (
              <div key={deal.id} className="flex items-center">
                <div className="mr-2 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <PipedriveDeal 
                    deal={deal} 
                    index={index}
                    isDraggable={false}
                    onRemove={onRemoveDeal}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {tourDeals.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-blue-900">Tourübersicht</h4>
              <p className="text-sm text-blue-700 mt-1">
                {tourDeals.length} Stationen • Reihenfolge anpassbar
              </p>
            </div>
            <button 
              onClick={handleCalculateRoute}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              Route berechnen
              <ChevronRight className="ml-1 h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Definiere TourPlannerContent als eigenständige Komponente
const TourPlannerContent = () => {
  const [allDeals, setAllDeals] = useState([]);
  const [filteredDeals, setFilteredDeals] = useState([]);
  const [tourDeals, setTourDeals] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [directionsService, setDirectionsService] = useState(null);

  // Drop-Zone für die Tour
  const [{ isOver }, drop] = useDrop({
    accept: 'deal',
    drop: (item) => {
      console.log("Deal gedropped:", item.deal?.title || item.deal?.id);
      setTourDeals(prevTourDeals => {
        const dealExists = prevTourDeals.some(d => d.id === item.deal.id);
        if (!dealExists) {
          console.log("Füge Deal zur Tour hinzu:", item.deal.id);
          return [...prevTourDeals, item.deal];
        }
        console.log("Deal existiert bereits in der Tour:", item.deal.id);
        return prevTourDeals;
      });
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  // Regionen Definition
  const REGIONS = useMemo(() => [
    { id: 'all', name: 'Alle Regionen', phase_id: null },
    { id: 'nord', name: 'Norden', phase_id: 19 },
    { id: 'sued', name: 'Süden', phase_id: 21 },
    { id: 'ost', name: 'Osten', phase_id: 22 },
    { id: 'west', name: 'Westen', phase_id: 23 },
    { id: 'ka', name: 'Karlsruhe', phase_id: 20 },
  ], []);

  const OFFICE_ADDRESS = "Greschbachstraße 15, 76229 Karlsruhe";
  const OFFICE_POSTAL_PREFIX = OFFICE_ADDRESS.match(/\b(\d{2})\d{3}\b/)?.[1] || "76";

  // Hilfsfunktion: Region (PLZ-Präfix) aus Adresse extrahieren
  const getRegionFromAddress = (address) => {
    if (!address) return null;
    const match = address.match(/\b(\d{2})\d{3}\b/);
    return match ? match[1] : null;
  };

  // Hilfsfunktion: Distanz-Score einer Region zum Büro (vereinfacht)
  const getRegionDistanceScore = (regionPrefix) => {
    if (!regionPrefix) return Infinity;
    return Math.abs(parseInt(regionPrefix, 10) - parseInt(OFFICE_POSTAL_PREFIX, 10));
  };

  // Regionname aus phase_id ermitteln
  const getRegionNameFromPhaseId = useCallback((phaseId) => {
    const region = REGIONS.find(r => r.phase_id === phaseId);
    return region ? region.name : 'Unbekannt';
  }, [REGIONS]);

  // Hilfsfunktion zur Verarbeitung von Projektdaten (Adressen extrahieren)
  const processProjects = useCallback(async (projectsData, resultArray, apiToken) => {
    console.log("processProjects aufgerufen mit", projectsData.length, "Projekten");

    for (const project of projectsData) {
      try {
        if (project.deal_ids && project.deal_ids.length > 0) {
          const dealId = project.deal_ids[0];
          const dealResponse = await fetch(`https://api.pipedrive.com/v1/deals/${dealId}?api_token=${apiToken}`);
          const dealData = await dealResponse.json();

          if (dealData.success && dealData.data) {
            let originAddress = '';
            let destinationAddress = '';
            let moveDate = '';

            const knownFieldIds = {
              originAddress: '07c3da8804f7b96210e45474fba35b8691211ddd',
              destinationAddress: '9cb4de1018ec8404feeaaaf7ee9b293c78c44281',
              moveDate: '949696aa9d99044db90383a758a74675587ed893'
            };

            // Versuche bekannte Felder
            originAddress = dealData.data[knownFieldIds.originAddress] || '';
            destinationAddress = dealData.data[knownFieldIds.destinationAddress] || '';
            moveDate = dealData.data[knownFieldIds.moveDate] || '';

            // Heuristik, falls bekannte Felder leer sind (optional, kann zu Fehlern führen)
            if ((!originAddress || !destinationAddress) && typeof dealData.data === 'object') {
              for (const [key, value] of Object.entries(dealData.data)) {
                if (key.length > 30 && typeof value === 'string' && value.trim().length > 5) {
                  if (!originAddress && (value.toLowerCase().includes('straße') || /\d{5}/.test(value))) {
                    originAddress = value;
                  } else if (!destinationAddress && (value.toLowerCase().includes('straße') || /\d{5}/.test(value))) {
                    destinationAddress = value;
                  }
                }
              }
            }

            resultArray.push({
              id: project.id,
              dealId: dealId,
              title: project.title || dealData.data.title,
              organization: dealData.data.org_name,
              moveDate: moveDate || project.start_date,
              originAddress: originAddress.trim(),
              destinationAddress: destinationAddress.trim(),
              value: dealData.data.value,
              currency: dealData.data.currency,
              region: getRegionNameFromPhaseId(project.phase_id),
              projectStartDate: project.start_date,
              projectEndDate: project.end_date
            });
          } else {
            console.warn(`Keine Deal-Daten für ID ${dealId} gefunden oder API-Fehler.`);
            resultArray.push({
              id: project.id,
              title: project.title,
              region: getRegionNameFromPhaseId(project.phase_id),
              moveDate: project.start_date,
              projectStartDate: project.start_date,
              projectEndDate: project.end_date,
              originAddress: '',
              destinationAddress: ''
            });
          }
        } else {
          resultArray.push({
            id: project.id,
            title: project.title,
            region: getRegionNameFromPhaseId(project.phase_id),
            moveDate: project.start_date,
            projectStartDate: project.start_date,
            projectEndDate: project.end_date,
            originAddress: '',
            destinationAddress: ''
          });
        }
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        console.error(`Fehler bei der Verarbeitung von Projekt ${project.id}:`, error);
      }
    }
  }, [getRegionNameFromPhaseId]);

  // Deal aus der Tour entfernen
  const handleRemoveDeal = (dealId) => {
    setTourDeals(prev => prev.filter(deal => deal.id !== dealId));
    setOptimizedRoute(null);
  };

  // Fetch-Logik mit API-Integration
  const fetchDeals = useCallback(async () => {
    setLoading(true);
    setAllDeals([]);
    setFilteredDeals([]);
    const apiToken = process.env.REACT_APP_PIPEDRIVE_API_TOKEN;
    if (!apiToken) {
      console.error("Pipedrive API Token nicht gefunden!");
      setLoading(false);
      return;
    }

    const cacheKeyBase = `projects_tourplanner`;
    const cacheKey = `${cacheKeyBase}_${selectedRegion}`;
    const cachedProjects = localStorage.getItem(cacheKey);
    const cacheDuration = 15 * 60 * 1000;

    if (cachedProjects) {
      const { data, timestamp } = JSON.parse(cachedProjects);
      if (Date.now() - timestamp < cacheDuration) {
        console.log(`Verwende gecachte Projekte für Region: ${selectedRegion}`);
        setAllDeals(data);
        filterDeals(data, searchQuery, showDateFilter ? selectedDate : null);
        setLoading(false);
        return;
      } else {
        console.log(`Cache für Region ${selectedRegion} abgelaufen.`);
        localStorage.removeItem(cacheKey);
      }
    }

    let allProjectsWithDetails = [];
    console.log(`Starte API-Abfrage für Region: ${selectedRegion}`);

    const regionsToFetch = selectedRegion === 'all'
      ? REGIONS.filter(r => r.id !== 'all' && r.phase_id !== null)
      : REGIONS.filter(r => r.id === selectedRegion && r.phase_id !== null);

    if (regionsToFetch.length === 0 && selectedRegion !== 'all') {
      console.warn(`Keine gültige Phase ID für Region ${selectedRegion} gefunden.`);
    }

    for (const region of regionsToFetch) {
      try {
        const projectsUrl = `https://api.pipedrive.com/v1/projects?status=open&phase_id=${region.phase_id}&api_token=${apiToken}&limit=100`;
        const projectsResponse = await fetch(projectsUrl);
        if (!projectsResponse.ok) {
          throw new Error(`API request failed with status ${projectsResponse.status}`);
        }
        const projectsData = await projectsResponse.json();

        if (projectsData.success && Array.isArray(projectsData.data) && projectsData.data.length > 0) {
          await processProjects(projectsData.data, allProjectsWithDetails, apiToken);
        } else if (!projectsData.success) {
          console.warn(`API-Anfrage für Region ${region.name} nicht erfolgreich:`, projectsData.error || 'Unbekannter Fehler');
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Fehler beim Laden der Projekte für Region ${region.name}:`, error);
      }
    }

    console.log("Insgesamt geladene Projekte mit Details:", allProjectsWithDetails.length);
    setAllDeals(allProjectsWithDetails);
    filterDeals(allProjectsWithDetails, searchQuery, showDateFilter ? selectedDate : null);
    localStorage.setItem(cacheKey, JSON.stringify({ data: allProjectsWithDetails, timestamp: Date.now() }));

    setLoading(false);
  }, [selectedRegion, REGIONS, processProjects, searchQuery, selectedDate, showDateFilter]);

  // Filtern der Deals nach Datum und Suchbegriff
  const filterDeals = useCallback((dealsToFilter, query, date) => {
    if (!Array.isArray(dealsToFilter)) {
      setFilteredDeals([]);
      return;
    }
    
    let filtered = [...dealsToFilter];
    
    // Nach Datum filtern
    if (date && showDateFilter) {
      const dateString = format(date, 'yyyy-MM-dd');
      filtered = filtered.filter(deal => {
        if (!deal) return false;
        return (deal.moveDate && deal.moveDate.startsWith(dateString)) ||
               (deal.projectStartDate === dateString);
      });
    }
    
    // Nach Suchbegriff filtern
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(deal =>
        (deal && (
          deal.title?.toLowerCase().includes(lowerQuery) ||
          deal.organization?.toLowerCase().includes(lowerQuery) ||
          deal.originAddress?.toLowerCase().includes(lowerQuery) ||
          deal.destinationAddress?.toLowerCase().includes(lowerQuery) ||
          deal.dealId?.toString().includes(lowerQuery)
        ))
      );
    }
    
    setFilteredDeals(filtered);
  }, [showDateFilter]);

  // Daten laden, wenn sich Region oder Datum ändert
  useEffect(() => {
    fetchDeals();
  }, [fetchDeals, selectedRegion]);

  // Wenn sich das Datum ändert, wenden wir nur den Filter an, ohne die Daten neu zu laden
  useEffect(() => {
    if (showDateFilter) {
      filterDeals(allDeals, searchQuery, selectedDate);
    }
  }, [selectedDate, showDateFilter]);

  // Region ändern
  const handleRegionChange = (regionId) => {
    console.log("Region geändert auf:", regionId);
    setSelectedRegion(regionId);
    setTourDeals([]);
    setOptimizedRoute(null);
  };

  // Tour speichern
  const handleSaveTour = () => {
    if (!selectedDate || !isValid(selectedDate)) {
      alert("Bitte wählen Sie ein gültiges Datum aus, um die Tour zu speichern.");
      return;
    }
    const tourName = format(selectedDate, 'yyyy-MM-dd');
    const currentTours = JSON.parse(localStorage.getItem('savedTours') || '{}');
    currentTours[tourName] = tourDeals.map(deal => deal.id);
    localStorage.setItem('savedTours', JSON.stringify(currentTours));
    alert(`Tour für ${format(selectedDate, 'dd.MM.yyyy', { locale: de })} gespeichert!`);
  };

  // Hilfsfunktion zum Korrigieren der Wegpunktreihenfolge
  const fixWaypointOrder = (optimizedOrder, requestWaypoints, allLocations) => {
    console.log("Korrigiere Wegpunktreihenfolge (falls nötig)...");
    let correctedOrder = [...optimizedOrder]; // Kopie erstellen
    const loadedItems = new Set();
    let orderChanged = false;
    let indicesToRemove = []; // Indizes, die verschoben werden

    // Erster Durchlauf: Identifiziere Pickups und finde Verletzungen
    for (let i = 0; i < correctedOrder.length; i++) {
      const waypointIndexInRequest = correctedOrder[i];
      const waypointLocation = requestWaypoints[waypointIndexInRequest].location;
      const locationInfo = allLocations.find(l => l.location === waypointLocation);

      if (!locationInfo) continue;

      if (locationInfo.type === 'pickup') {
        loadedItems.add(locationInfo.dealId);
      } else if (locationInfo.type === 'delivery') {
        if (!loadedItems.has(locationInfo.dealId)) {
          console.warn(`Verletzung gefunden: Lieferung ${locationInfo.dealId} (${locationInfo.location}) vor Abholung.`);
          // Finde den Index des Pickups in der *korrigierten* Reihenfolge
          const pickupLocation = allLocations.find(l => l.dealId === locationInfo.dealId && l.type === 'pickup');
          if (!pickupLocation) {
            console.error(`Zugehöriger Pickup für Deal ${locationInfo.dealId} nicht gefunden!`);
            continue; // Überspringe diese Korrektur
          }
          const pickupWaypointIndexInRequest = requestWaypoints.findIndex(wp => wp.location === pickupLocation.location);
          const pickupIndexInCorrectedOrder = correctedOrder.indexOf(pickupWaypointIndexInRequest);

          if (pickupIndexInCorrectedOrder === -1) {
             console.error(`Pickup-Index für Deal ${locationInfo.dealId} nicht in korrigierter Order gefunden!`);
             continue;
          }

          // Markiere den aktuellen Delivery-Index zum Verschieben
          indicesToRemove.push({ deliveryIndexInOrder: i, pickupIndexInOrder: pickupIndexInCorrectedOrder });
          orderChanged = true;
        }
      }
    }

    // Zweiter Durchlauf: Führe die Verschiebungen durch (rückwärts, um Indizes nicht zu stören)
    indicesToRemove.sort((a, b) => b.deliveryIndexInOrder - a.deliveryIndexInOrder); // Nach Index absteigend sortieren

    for (const { deliveryIndexInOrder, pickupIndexInOrder } of indicesToRemove) {
       // Entferne die Delivery aus der aktuellen Position
       const [deliveryWaypointIndex] = correctedOrder.splice(deliveryIndexInOrder, 1);

       // Finde den *neuen* Index des Pickups (könnte sich durch vorherige Splices verschoben haben)
       const currentPickupIndexInOrder = correctedOrder.indexOf(optimizedOrder[pickupIndexInOrder]); // Suche den ursprünglichen Pickup-Index

       if (currentPickupIndexInOrder === -1) {
           console.error("Pickup-Index nach Splice nicht mehr gefunden!");
           // Füge Delivery am Ende wieder hinzu als Fallback
           correctedOrder.push(deliveryWaypointIndex);
           continue;
       }

       // Füge die Delivery nach dem Pickup ein
       correctedOrder.splice(currentPickupIndexInOrder + 1, 0, deliveryWaypointIndex);
       console.log(`Delivery (Index ${deliveryWaypointIndex}) verschoben nach Pickup (Index ${optimizedOrder[pickupIndexInOrder]})`);
    }


    if (orderChanged) {
      console.log("Ursprüngliche Order:", optimizedOrder);
      console.log("Korrigierte Order:", correctedOrder);
    } else {
      console.log("Keine Korrektur der Reihenfolge notwendig.");
    }

    return { correctedOrder, orderChanged };
  };


  const calculateOptimizedRoute = useCallback(async (deals) => {
    if (!directionsService || deals.length === 0) {
      setOptimizedRoute(null);
      setLoadingRoute(false);
      return;
    }
    setLoadingRoute(true);
    console.log(`Starte Routenberechnung (Optimieren + Korrigieren) für ${deals.length} Deals.`);

    // 1. Locations sammeln (wie gehabt)
    const locations = deals.flatMap(deal => {
      const locs = [];
      if (deal.originAddress && deal.originAddress.trim()) locs.push({ location: deal.originAddress.trim(), type: 'pickup', dealId: deal.id, title: deal.title });
      if (deal.destinationAddress && deal.destinationAddress.trim()) locs.push({ location: deal.destinationAddress.trim(), type: 'delivery', dealId: deal.id, title: deal.title });
      return locs;
    }).filter(loc => loc.location);

    if (locations.length === 0) { /* ... Fehlerbehandlung ... */ return; }
    console.log(`Gefundene gültige Locations: ${locations.length}`);

    // 2. Erste Anfrage: Optimieren lassen
    const initialRequest = {
      origin: OFFICE_ADDRESS,
      destination: OFFICE_ADDRESS,
      waypoints: locations.map(loc => ({ location: loc.location, stopover: true })),
      optimizeWaypoints: true, // OPTIMIEREN!
      travelMode: window.google.maps.TravelMode.DRIVING,
    };

    let finalResult; // Das Ergebnis, das wir am Ende verwenden

    try {
      console.log("Sende initiale Optimierungsanfrage...");
      const initialResult = await new Promise((resolve, reject) => {
        directionsService.route(initialRequest, (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            resolve(result);
          } else {
            reject(new Error(`Initiale Directions request failed: ${status}`));
          }
        });
      });
      console.log("Initiale Optimierung erfolgreich:", initialResult);

      // 3. Ergebnis prüfen und ggf. korrigieren
      const optimizedOrder = initialResult.routes[0].waypoint_order;
      const { correctedOrder, orderChanged } = fixWaypointOrder(
        optimizedOrder,
        initialRequest.waypoints, // Die Wegpunkte, auf die sich optimizedOrder bezieht
        locations // Die Liste mit Typ/DealID Infos
      );

      // 4. Zweite Anfrage (falls nötig) mit korrigierter Reihenfolge
      if (orderChanged) {
        console.log("Reihenfolge wurde korrigiert. Sende zweite Anfrage für korrekte Legs...");
        const correctedWaypoints = correctedOrder.map(index => initialRequest.waypoints[index]); // Wegpunkte in korrigierter Reihenfolge

        const correctedRequest = {
          origin: OFFICE_ADDRESS,
          destination: OFFICE_ADDRESS,
          waypoints: correctedWaypoints, // Korrigierte Reihenfolge
          optimizeWaypoints: false, // NICHT MEHR OPTIMIEREN!
          travelMode: window.google.maps.TravelMode.DRIVING,
        };

        finalResult = await new Promise((resolve, reject) => {
          directionsService.route(correctedRequest, (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              // WICHTIG: Füge die korrigierte Order dem Ergebnis hinzu, da Google sie nicht liefert
              result.routes[0].waypoint_order = correctedOrder.map((_, i) => i); // Erzeuge eine 0, 1, 2... Sequenz
              result.corrected_waypoint_order_indices = correctedOrder; // Speichere die originalen Indizes
              resolve(result);
            } else {
              reject(new Error(`Korrigierte Directions request failed: ${status}`));
            }
          });
        });
        console.log("Zweite Anfrage (korrigierte Route) erfolgreich:", finalResult);

      } else {
        // Keine Korrektur nötig, verwende das erste Ergebnis
        finalResult = initialResult;
        finalResult.routes[0].waypoint_order = optimizedOrder; // Stelle sicher, dass die Order drin ist
      }

      // 5. Ergebnis verarbeiten (mit finalResult)
      const route = finalResult.routes[0];
      const finalWaypointOrder = route.waypoint_order; // Entweder die optimierte oder die 0,1,2... Sequenz
      const finalRequestWaypoints = finalResult.request.waypoints; // Die Wegpunkte der *letzten* Anfrage
      const originalLegs = route.legs;

      // Anreichern der Legs
      const enrichedLegs = originalLegs.map((leg, index) => {
        let stopType = 'unknown';
        let dealId = null;

        // Finde den Typ des Wegpunkts am *Ende* dieses Legs
        // Der Index in finalWaypointOrder bezieht sich auf finalRequestWaypoints
        if (index < finalWaypointOrder.length) {
           // Bei korrigierter Route ist finalWaypointOrder [0, 1, 2...], also index = orderedWaypointIndex
           const orderedWaypointIndex = finalWaypointOrder[index];
           const legEndLocation = finalRequestWaypoints[orderedWaypointIndex].location;
           // Finde die Infos in der ursprünglichen 'locations'-Liste
           const originalLocationInfo = locations.find(l => l.location === legEndLocation);
           stopType = originalLocationInfo?.type || 'unknown';
           dealId = originalLocationInfo?.dealId || null;
        } else if (index === originalLegs.length - 1) {
           stopType = 'office_return';
        }
        return { ...leg, stopType: stopType, dealId: dealId };
      });

      // Display Legs erstellen
      const displayLegs = [
         { /* ... Start-Leg ... */
            start_address: OFFICE_ADDRESS,
            end_address: enrichedLegs.length > 0 ? enrichedLegs[0].start_address : OFFICE_ADDRESS,
            distance: { text: 'Start', value: 0 },
            duration: { text: '', value: 0 },
            stopType: 'office_start',
            dealId: null
          },
         ...enrichedLegs
       ];

      // Custom Waypoint Order für die Anzeige (basierend auf der finalen Reihenfolge)
      let customWaypointDisplayOrder;
      if (orderChanged && finalResult.corrected_waypoint_order_indices) {
          // Nimm die gespeicherten Original-Indizes und hole die Locations aus der *initialen* Anfrage
          customWaypointDisplayOrder = finalResult.corrected_waypoint_order_indices.map(idx => initialRequest.waypoints[idx].location);
      } else {
          // Nimm die optimierte Order und hole die Locations aus der initialen Anfrage
          customWaypointDisplayOrder = optimizedOrder.map(idx => initialRequest.waypoints[idx].location);
      }


      setOptimizedRoute({
        ...finalResult,
        legs: displayLegs,
        request: finalResult.request, // Die Anfrage, die zu diesen Legs führte
        custom_waypoint_order: customWaypointDisplayOrder // Korrekte Reihenfolge für Anzeige
      });

    } catch (error) {
      console.error("Fehler bei der Routenberechnung:", error);
      alert(`Routenberechnung fehlgeschlagen: ${error.message}`);
      setOptimizedRoute(null);
    } finally {
      setLoadingRoute(false);
    }
  }, [directionsService, OFFICE_ADDRESS]);

  // useEffect Hook, der die Route neu berechnet
  useEffect(() => {
    console.log("useEffect für tourDeals ausgelöst. tourDeals:", tourDeals.length);
    if (tourDeals.length > 0 && directionsService) {
      console.log("Bedingungen erfüllt, rufe calculateOptimizedRoute auf.");
      calculateOptimizedRoute(tourDeals);
    } else if (tourDeals.length === 0) {
      console.log("Keine Deals mehr, lösche Route.");
      setOptimizedRoute(null);
      setLoadingRoute(false);
    } else {
      console.log("Warte auf Directions Service oder keine Deals vorhanden...");
    }
    // calculateOptimizedRoute aus Abhängigkeiten entfernt, da fixWaypointOrder jetzt außerhalb ist
    // und die Funktion selbst durch useCallback memoized ist.
  }, [tourDeals, directionsService]);

  // handleOpenRouteInGoogleMaps muss angepasst werden, um die custom_waypoint_order zu verwenden
  const handleOpenRouteInGoogleMaps = () => {
    console.log("Versuche Google Maps zu öffnen. Aktuelle optimizedRoute:", optimizedRoute);
    // Prüfe auf das Vorhandensein der custom_waypoint_order
    if (!optimizedRoute || !optimizedRoute.custom_waypoint_order || optimizedRoute.custom_waypoint_order.length === 0) {
      alert("Route wurde noch nicht berechnet oder ist ungültig.");
      console.error("OptimizedRoute oder custom_waypoint_order fehlen:", optimizedRoute);
      return;
    }

    try {
      const origin = OFFICE_ADDRESS;
      const destination = OFFICE_ADDRESS;

      // Verwende die custom_waypoint_order direkt
      const waypoints = optimizedRoute.custom_waypoint_order
        .map(addr => encodeURIComponent(addr)); // Kodiere die Adressen

      const waypointsStr = waypoints.length > 0 ? `&waypoints=${waypoints.join('|')}` : '';
      // WICHTIG: Füge &dirflg=h hinzu, da wir Google die *korrigierte* Reihenfolge vorgeben!
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${waypointsStr}&travelmode=driving&dirflg=h`;

      console.log("Öffne Google Maps mit URL (korrigierte Reihenfolge):", googleMapsUrl);
      window.open(googleMapsUrl, '_blank');
    } catch (error) {
      console.error("Fehler beim Erstellen der Google Maps URL:", error);
      alert("Ein Fehler ist beim Erstellen des Google Maps Links aufgetreten.");
    }
  };

  // Google Directions Service Initialisierung
  useEffect(() => {
    if (window.google && window.google.maps && !directionsService) {
      console.log("Initialisiere Google Directions Service...");
      setDirectionsService(new window.google.maps.DirectionsService());
    } else if (!window.google || !window.google.maps) {
      const existingScript = document.getElementById('googleMapsScript');
      if (!existingScript) {
        console.log("Lade Google Maps Script...");
        const script = document.createElement('script');
        script.id = 'googleMapsScript';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          console.log("Google Maps Script geladen.");
          if (window.google && window.google.maps) {
            setDirectionsService(new window.google.maps.DirectionsService());
          }
        };
        script.onerror = () => console.error("Fehler beim Laden des Google Maps Scripts.");
        document.body.appendChild(script);
      }
    }
  }, [directionsService]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Tourenplanung</h1>

      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center">
          <label htmlFor="region-selector" className="text-sm font-medium text-gray-700">
            Region:
          </label>
          <select
            id="region-selector"
            value={selectedRegion}
            onChange={(e) => handleRegionChange(e.target.value)}
            className="ml-2 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {REGIONS.map(region => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center">
          <input
            type="text"
            placeholder="Aufträge suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2">
          <div className="bg-white p-4 rounded-xl shadow-sm h-full flex flex-col">
            <div className="flex-grow max-h-[calc(100vh-350px)] overflow-y-auto p-1 -m-1">
              {loading ? (
                <div className="text-center py-20">
                  <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-4 text-gray-500">Lade Aufträge...</p>
                </div>
              ) : filteredDeals.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  Keine Aufträge für die aktuelle Auswahl gefunden.
                </div>
              ) : (
                filteredDeals.map((deal, index) => (
                  <PipedriveDeal
                    key={deal.id}
                    deal={deal}
                    index={index}
                    isDraggable={!!(deal.originAddress && deal.destinationAddress)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 flex flex-col gap-6">
          <TourArea
            isOver={isOver}
            drop={drop}
            tourDeals={tourDeals}
            onRemoveDeal={handleRemoveDeal}
            handleSaveTour={handleSaveTour}
            handleCalculateRoute={handleOpenRouteInGoogleMaps}
          />

          <div className="bg-white p-4 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Milestone className="mr-2 h-5 w-5 text-primary" />
              Optimierte Route
            </h3>
            {loadingRoute && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-gray-500 mt-2 text-sm">Berechne Route...</p>
              </div>
            )}
            {!loadingRoute && !optimizedRoute && tourDeals.length > 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                Route konnte nicht berechnet werden. Prüfen Sie die Adressen und die Browser-Konsole auf Fehler.
              </div>
            )}
            {!loadingRoute && !optimizedRoute && tourDeals.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                Fügen Sie Aufträge zur Tour hinzu, um die Route zu berechnen.
              </div>
            )}
            {optimizedRoute && optimizedRoute.legs && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-medium bg-gray-50 p-2 rounded">
                  <span>Gesamt:</span>
                  <div className="text-right">
                    {optimizedRoute.routes && optimizedRoute.routes[0] && optimizedRoute.routes[0].legs && (
                      <>
                        <div>{(optimizedRoute.routes[0].legs.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0) / 1000).toFixed(1)} km</div>
                        <div className="text-xs text-gray-500">{Math.round(optimizedRoute.routes[0].legs.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0) / 60)} min Fahrzeit</div>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-1 max-h-[300px] overflow-y-auto text-sm">
                  {optimizedRoute.legs.map((leg, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border-b last:border-b-0">
                      <div className="flex items-center space-x-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                          leg.stopType === 'office_start' ? 'bg-green-500 text-white' :
                          leg.stopType === 'pickup' ? 'bg-blue-500 text-white' :
                          leg.stopType === 'delivery' ? 'bg-orange-500 text-white' :
                          leg.stopType === 'office_return' ? 'bg-green-500 text-white' :
                          'bg-gray-400 text-white'
                        }`}>
                          {leg.stopType === 'office_start' ? 'S' :
                           leg.stopType === 'pickup' ? <Building size={12}/> :
                           leg.stopType === 'delivery' ? <Home size={12}/> :
                           leg.stopType === 'office_return' ? 'Z' :
                           index}
                        </span>
                        <span className="truncate max-w-[180px]" title={leg.start_address}>
                          {leg.stopType === 'office_start' ? 'Büro' : leg.start_address?.split(',')[0] ?? '?'}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="truncate max-w-[180px]" title={leg.end_address}>
                          {leg.stopType === 'office_return' ? 'Büro' : leg.end_address?.split(',')[0] ?? '?'}
                        </span>
                      </div>
                      <div className="text-right text-xs whitespace-nowrap">
                        {leg.stopType !== 'office_start' && (
                          <>
                            <div>{leg.distance?.text ?? '-'}</div>
                            <div className="text-gray-500">{leg.duration?.text ?? '-'}</div>
                          </>
                        )}
                        {leg.stopType === 'office_start' && (
                           <div>Start</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Hauptkomponente: Stellt nur den DndProvider bereit
const TourPlanner = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <TourPlannerContent />
    </DndProvider>
  );
};

export default TourPlanner; 