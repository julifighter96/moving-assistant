import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { MapPin, Calendar, Truck, X, Clock, Search, ChevronRight, Globe, Milestone, Building, Home } from 'lucide-react';
import axios from 'axios';
import { format, parseISO, isValid } from 'date-fns';
import { de } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// Konstanten können hier außerhalb bleiben, wenn sie wirklich global sind
const OFFICE_ADDRESS = "Greschbachstraße 29, 76229 Karlsruhe";
const SCHLAILE_FIXED_ADDRESS = "Kaiserstraße 175, 76133 Karlsruhe, Deutschland";
const SCHLAILE_TYPE_DELIVERY = "148";
const SCHLAILE_TYPE_PICKUP = "149";

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

  // Funktion zum Extrahieren des Objekt-Typs und Setzen eines Icons
  const getObjectTypeIcon = (title) => {
    if (!title) return null;
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('piano')) {
      return <span title="Piano" className="ml-2">🎹</span>; // Klavier-Emoji
    } else if (lowerTitle.includes('flügel')) {
      // Kein direktes Flügel-Emoji, wir nehmen wieder Klavier oder einen Text
      return <span title="Flügel" className="ml-2">🎹<span className="text-xs font-semibold">F</span></span>; // Klavier + F
    }
    return null; // Kein Typ gefunden
  };

  const objectIcon = getObjectTypeIcon(deal.title);

  return (
    <div
      ref={isDraggable ? drag : null}
      className={`p-4 mb-2 rounded-lg border ${isDragging ? 'opacity-50 border-dashed' : 'border-gray-200'} 
                 ${isDraggable ? 'cursor-grab bg-white' : 'bg-primary-50'}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 flex items-center">
            <span>{deal.title}</span>
            {objectIcon}
            {/* Schlaile Indikator */}
            {deal.schlaileType && (
              <span title={`Schlaile ${deal.schlaileType}`} className="ml-2 px-1.5 py-0.5 bg-yellow-200 text-yellow-800 text-xs font-semibold rounded">
                S
              </span>
            )}
          </h3>
          
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
const TourArea = ({
  isOver,
  drop,
  tourDeals,
  onRemoveDeal,
  selectedDate,
  onDateChange,
  tourName,
  onTourNameChange,
  handleSaveTour,
  handleCalculateRoute,
  isSavingTour,
  pianoCalculations,
  onCalculatePianoPrice
}) => {
  return (
    <div
      ref={drop}
      className={`bg-white p-4 rounded-xl border ${isOver ? 'border-primary border-dashed' : 'border-gray-200'} shadow-sm h-full flex flex-col`}
    >
      <div className="mb-4">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
          <h3 className="text-lg font-semibold flex items-center">
            <Truck className="mr-2 h-5 w-5 text-primary" />
            Tourplanung
          </h3>
          <button
            onClick={handleSaveTour}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            disabled={!selectedDate || !isValid(selectedDate) || tourDeals.length === 0 || isSavingTour}
          >
            {isSavingTour ? 'Speichern...' : 'Tour speichern'}
          </button>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[150px]">
            <label htmlFor="tourDate" className="block text-xs font-medium text-gray-500 mb-1">Datum</label>
            <DatePicker
              id="tourDate"
              selected={selectedDate}
              onChange={onDateChange}
              dateFormat="dd.MM.yyyy"
              locale={de}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              wrapperClassName="w-full"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="tourName" className="block text-xs font-medium text-gray-500 mb-1">Tourname (optional)</label>
            <input
              id="tourName"
              type="text"
              value={tourName}
              onChange={(e) => onTourNameChange(e.target.value)}
              placeholder={`z.B. Tour ${selectedDate && isValid(selectedDate) ? format(selectedDate, 'dd.MM', { locale: de }) : ''}`}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
        </div>
      </div>
      <div className={`flex-grow min-h-[200px] rounded-lg mb-4 flex items-center justify-center ${tourDeals.length === 0 ? 'border-2 border-dashed border-gray-300 bg-gray-50' : ''}`}>
        {tourDeals.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p className="mb-2">Ziehen Sie Aufträge hierher</p>
            <Truck size={40} className="mx-auto text-gray-400" />
          </div>
        ) : (
          <div className="w-full space-y-3 overflow-y-auto max-h-[calc(100vh-450px)] pr-2">
            {tourDeals.map((deal) => {
              const isPianoDeal = deal.title?.toLowerCase().includes('piano') || deal.title?.toLowerCase().includes('flügel');
              const calculation = pianoCalculations[deal.id];

              return (
                <div key={deal.id} className="relative group">
                  <PipedriveDeal deal={deal} isDraggable={false} />
                  <button
                    onClick={() => onRemoveDeal(deal.id)}
                    className="absolute top-1 right-1 p-1 bg-white bg-opacity-70 rounded-full text-gray-500 hover:text-red-600 hover:bg-opacity-100 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Aus Tour entfernen"
                  >
                    <X size={16} />
                  </button>
                  {isPianoDeal && !deal.schlaileType && (
                    <div className="mt-1 ml-4 text-xs">
                      {!calculation || (!calculation.result && !calculation.error && !calculation.loading) ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCalculatePianoPrice(deal);
                          }}
                          className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 text-xs"
                        >
                          Klavierpreis berechnen
                        </button>
                      ) : calculation.loading ? (
                        <span className="text-gray-500 italic">Berechne Preis...</span>
                      ) : calculation.error ? (
                        <span className="text-red-600" title={calculation.error}>Fehler bei Preisberechnung</span>
                      ) : calculation.result ? (
                        <div className="bg-indigo-50 p-2 rounded border border-indigo-100">
                          <span className="font-semibold text-indigo-800">Klavierpreis: {calculation.result.gross_sum} €</span>
                          <span className="text-gray-600 ml-2">(Netto: {calculation.result.net_sum} €, Basis: {calculation.result.base_price}€, Etage: {calculation.result.floor_surcharge}€, KM: {calculation.result.km_surcharge}€)</span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
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
              onClick={() => handleCalculateRoute(tourDeals)}
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

// Hilfsfunktion zum Korrigieren der Wegpunktreihenfolge (AUßERHALB der Komponente)
const fixWaypointOrder = (optimizedOrder, requestWaypoints, allLocations) => {
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
        // Verletzung gefunden: Lieferung vor Abholung
        const pickupLocation = allLocations.find(l => l.dealId === locationInfo.dealId && l.type === 'pickup');
        if (!pickupLocation) {
          console.error(`Zugehöriger Pickup für Deal ${locationInfo.dealId} nicht gefunden!`);
          continue;
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

     // Füge die Delivery nach dem Pickup wieder ein
     correctedOrder.splice(currentPickupIndexInOrder + 1, 0, deliveryWaypointIndex);
  }

  return { correctedOrder, orderChanged };
};

// Definiere TourPlannerContent als eigenständige Komponente
const TourPlannerContent = () => {
  // --- KONSTANTEN FÜR PROJEKT-UPDATES HIER DEFINIEREN ---
  const PROJECT_TOUR_DATE_FIELD_KEY = "3c7b83b905a2d762409414672a4aa1450e966d49";
  const PROJECT_TOUR_ID_FIELD_KEY = "7cfa771db86bba5afa46a05a82ff66734524c981";
  const TARGET_PHASE_ID = 25;
  const SCHLAILE_TRANSPORT_TYPE_KEY = "7a2f7e7908160ae7e6288c0a238b74328a5eb4af";
  const PIANO_FLOOR_COUNT_FIELD_KEY = "DEINE_PIPEDRIVE_STOCKWERK_FELD_ID"; // <-- BITTE ERSETZEN!
  const OFFICE_POSTAL_PREFIX = OFFICE_ADDRESS.match(/\b(\d{2})\d{3}\b/)?.[1] || "76";
  // --- ENDE KONSTANTEN ---

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
  const [isSavingTour, setIsSavingTour] = useState(false);
  const [tourName, setTourName] = useState('');
  const [pianoCalculations, setPianoCalculations] = useState({}); // { dealId: { result: data, loading: bool, error: string } }

  // Drop-Zone für die Tour
  const [{ isOver }, drop] = useDrop({
    accept: 'deal',
    drop: (item) => {
      if (!tourDeals.some(d => d.id === item.deal.id)) {
        setTourDeals(prev => [...prev, item.deal]);
        setOptimizedRoute(null);
      } else {
        alert("Dieser Auftrag ist bereits in der Tour enthalten.");
      }
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
    for (const project of projectsData) {
      let dealObjectToAdd = null;
      try {
        if (project.deal_ids && project.deal_ids.length > 0) {
          const dealId = project.deal_ids[0];
          const dealResponse = await fetch(`https://api.pipedrive.com/v1/deals/${dealId}?api_token=${apiToken}`);
          const dealData = await dealResponse.json();

          if (dealData.success && dealData.data) {
            // Definiere die bekannten Feld-IDs hier
            const knownFieldIds = {
              originAddress: process.env.REACT_APP_PIPEDRIVE_ADDRESS_FIELD_KEY || '07c3da8804f7b96210e45474fba35b8691211ddd', // Fallback-Key, falls ENV nicht gesetzt
              destinationAddress: process.env.REACT_APP_PIPEDRIVE_DELIVERY_ADDRESS_FIELD_KEY || '9cb4de1018ec8404feeaaaf7ee9b293c78c44281', // Fallback-Key
              moveDate: process.env.REACT_APP_PIPEDRIVE_MOVE_DATE_FIELD_KEY || '949696aa9d99044db90383a758a74675587ed893' // Fallback-Key
            };

            let originAddress = dealData.data[knownFieldIds.originAddress] || '';
            let destinationAddress = dealData.data[knownFieldIds.destinationAddress] || '';
            let moveDate = dealData.data[knownFieldIds.moveDate] || '';

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

            // Standardadressen zuerst holen
            let originAddressFinal = originAddress.trim();
            let destinationAddressFinal = destinationAddress.trim();
            const schlaileTransportType = dealData.data[SCHLAILE_TRANSPORT_TYPE_KEY];

            // --- VERSTÄRKTES DEBUGGING ---
            console.log(`[Schlaile Check] Deal ${dealId}: Wert='${schlaileTransportType}', Typ=${typeof schlaileTransportType}. Vergleich mit DELIVERY='${SCHLAILE_TYPE_DELIVERY}' (Typ=${typeof SCHLAILE_TYPE_DELIVERY}), PICKUP='${SCHLAILE_TYPE_PICKUP}' (Typ=${typeof SCHLAILE_TYPE_PICKUP})`);
            let schlaileMatched = false; // Flag
            // --- ENDE VERSTÄRKTES DEBUGGING ---

            if (schlaileTransportType === SCHLAILE_TYPE_DELIVERY) {
              // --- VERSTÄRKTES DEBUGGING ---
              console.log(`[Schlaile Check] Deal ${dealId}: Matched DELIVERY ('${schlaileTransportType}')`);
              schlaileMatched = true;
              // --- ENDE VERSTÄRKTES DEBUGGING ---
              // Lieferung VON Schlaile: Start ist die feste Schlaile-Adresse
              originAddressFinal = SCHLAILE_FIXED_ADDRESS;
              console.log(`[Schlaile Assign] Deal ${dealId}: Set originAddressFinal to SCHLAILE_FIXED_ADDRESS: '${originAddressFinal}'`); // Log nach Zuweisung
              // Zieladresse (destinationAddressFinal) bleibt die Standardadresse des Deals

            } else if (schlaileTransportType === SCHLAILE_TYPE_PICKUP) {
              // --- VERSTÄRKTES DEBUGGING ---
              console.log(`[Schlaile Check] Deal ${dealId}: Matched PICKUP ('${schlaileTransportType}')`);
              schlaileMatched = true;
              // --- ENDE VERSTÄRKTES DEBUGGING ---
              // Abholung BEI Kunde für Schlaile: Ziel ist die feste Schlaile-Adresse
              destinationAddressFinal = SCHLAILE_FIXED_ADDRESS;
              console.log(`[Schlaile Assign] Deal ${dealId}: Set destinationAddressFinal to SCHLAILE_FIXED_ADDRESS: '${destinationAddressFinal}'`); // Log nach Zuweisung
              // Abholadresse (originAddressFinal) bleibt die Standardadresse des Deals
            }

            // --- VERSTÄRKTES DEBUGGING ---
            if (!schlaileMatched && schlaileTransportType) {
                console.log(`[Schlaile Check] Deal ${dealId}: NO MATCH for type '${schlaileTransportType}'`);
            }
            console.log(`[Schlaile Final Addr] Deal ${dealId}: Before object creation - Origin='${originAddressFinal}', Dest='${destinationAddressFinal}'`);
            // --- ENDE VERSTÄRKTES DEBUGGING ---

            // Erstelle das Objekt in der Variable
            dealObjectToAdd = {
              id: project.id,
              dealId: dealId,
              title: project.title || dealData.data.title,
              organization: dealData.data.org_name,
              moveDate: moveDate || project.start_date,
              originAddress: originAddressFinal, // Die ggf. überschriebene Adresse
              destinationAddress: destinationAddressFinal, // Die ggf. überschriebene Adresse
              value: dealData.data.value,
              currency: dealData.data.currency,
              region: getRegionNameFromPhaseId(project.phase_id),
              projectStartDate: project.start_date,
              projectEndDate: project.end_date,
              schlaileType: schlaileTransportType || null,
              [PIANO_FLOOR_COUNT_FIELD_KEY]: dealData.data[PIANO_FLOOR_COUNT_FIELD_KEY] || 0
            };

          } else {
            // Erstelle ein Fallback-Objekt
            dealObjectToAdd = {
              id: project.id,
              dealId: dealId, // dealId ist hier bekannt
              title: project.title,
              region: getRegionNameFromPhaseId(project.phase_id),
              moveDate: project.start_date,
              projectStartDate: project.start_date,
              projectEndDate: project.end_date,
              originAddress: '',
              destinationAddress: '',
              schlaileType: null
            };
          }
        } else {
          // Erstelle ein Fallback-Objekt, wenn keine Deal-IDs vorhanden sind
          dealObjectToAdd = {
            id: project.id,
            dealId: null, // Keine Deal-ID
            title: project.title,
            region: getRegionNameFromPhaseId(project.phase_id),
            moveDate: project.start_date,
            projectStartDate: project.start_date,
            projectEndDate: project.end_date,
            originAddress: '',
            destinationAddress: '',
            schlaileType: null
          };
        }
        await new Promise(resolve => setTimeout(resolve, 50));

      } catch (error) {
        console.error(`Fehler bei der Verarbeitung von Projekt ${project.id}:`, error);
        // Erstelle ein Fehler-Fallback-Objekt
         dealObjectToAdd = {
            id: project.id,
            dealId: project.deal_ids?.[0] || null, // Versuche, die Deal-ID zu bekommen
            title: project.title + " (Fehler bei Verarbeitung)",
            region: getRegionNameFromPhaseId(project.phase_id),
            moveDate: project.start_date,
            projectStartDate: project.start_date,
            projectEndDate: project.end_date,
            originAddress: '',
            destinationAddress: '',
            schlaileType: null
          };
      }

      // Logge das Objekt, *bevor* es hinzugefügt wird (wenn es erstellt wurde)
      if (dealObjectToAdd) {
        console.log(`[Schlaile Debug] Projekt ${project.id} (Deal ${dealObjectToAdd.dealId}): Objekt verarbeitet -> Origin: '${dealObjectToAdd.originAddress}', Dest: '${dealObjectToAdd.destinationAddress}', SchlaileType: '${dealObjectToAdd.schlaileType}'`);
        resultArray.push(dealObjectToAdd); // Füge das Objekt zum Array hinzu
      } else {
         console.warn(`Projekt ${project.id}: Kein Objekt zum Hinzufügen erstellt.`);
      }
    } // Ende der for...of Schleife

    // Das return resultArray sollte *nach* der Schleife stehen
    return resultArray;
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

  // Tour speichern - ÜBERARBEITET
  const handleSaveTour = useCallback(async () => {
    if (!selectedDate || !isValid(selectedDate)) {
      alert("Bitte wählen Sie ein gültiges Datum aus, um die Tour zu speichern.");
      return;
    }
    if (tourDeals.length === 0) {
      alert("Bitte fügen Sie zuerst Aufträge zur Tour hinzu.");
      return;
    }

    setIsSavingTour(true); // Start loading

    // --- Datum im gewünschten Format (dd.MM.yyyy) ---
    const tourDateFormatted = format(selectedDate, 'dd.MM.yyyy', { locale: de });
    // --- Tour ID: Eingegebener Name oder generierte ID ---
    const finalTourId = tourName.trim() !== ''
      ? tourName.trim()
      : `Tour-${format(selectedDate, 'yyyy-MM-dd')}-${tourDeals.length}-${Date.now()}`; // Fallback ID

    const apiToken = process.env.REACT_APP_PIPEDRIVE_API_TOKEN;
    const apiUrl = process.env.REACT_APP_PIPEDRIVE_API_URL || 'https://api.pipedrive.com/v1';

    if (!apiToken) {
        alert("Pipedrive API Token nicht konfiguriert. Speichern nicht möglich.");
        setIsSavingTour(false);
        return;
    }

    let successCount = 0;
    let errorCount = 0;

    const updatePromises = tourDeals.map(async (deal) => {
      const projectId = deal.id;
      if (!projectId) {
        console.warn("Überspringe Deal ohne Projekt-ID:", deal.title);
        errorCount++;
        return;
      }

      const updateData = {
        phase_id: TARGET_PHASE_ID,
        [PROJECT_TOUR_DATE_FIELD_KEY]: tourDateFormatted, // Korrigiertes Datumsformat
        [PROJECT_TOUR_ID_FIELD_KEY]: finalTourId, // Verwendet den eingegebenen Namen oder Fallback
      };

      try {
        const response = await axios.put(
          `${apiUrl}/projects/${projectId}?api_token=${apiToken}`,
          updateData
        );
        if (response.data && response.data.success) {
          console.log(`Projekt ${projectId} (Deal: ${deal.dealId}) erfolgreich aktualisiert.`);
          successCount++;
        } else {
          console.error(`Fehler beim Aktualisieren von Projekt ${projectId}. Antwort:`, response.data);
          errorCount++;
        }
      } catch (error) {
        console.error(`Fehler beim Aktualisieren von Projekt ${projectId}:`, error.response ? error.response.data : error.message);
        errorCount++;
      }
    });

    await Promise.all(updatePromises);

    setIsSavingTour(false); // End loading

    if (errorCount === 0) {
      alert(`Tour "${finalTourId}" für ${tourDateFormatted} gespeichert und ${successCount} Projekte erfolgreich aktualisiert!`);
    } else {
      alert(`Tour "${finalTourId}" für ${tourDateFormatted} gespeichert. ${successCount} Projekte aktualisiert, ${errorCount} Fehler aufgetreten. Details siehe Konsole.`);
    }
  }, [selectedDate, tourDeals, tourName, TARGET_PHASE_ID, PROJECT_TOUR_DATE_FIELD_KEY, PROJECT_TOUR_ID_FIELD_KEY]);

  // calculateOptimizedRoute (useCallback bleibt, aber fixWaypointOrder ist jetzt stabil)
  const calculateOptimizedRoute = useCallback(async () => {
    if (!directionsService || tourDeals.length === 0) {
      setOptimizedRoute(null);
      setLoadingRoute(false);
      return;
    }
    setLoadingRoute(true);

    try {
      // --- STUFE 1: Kundenadressen für Optimierung vorbereiten ---
      const customerAddresses = new Set();
      const addressToDealInfo = new Map();

      tourDeals.forEach(deal => {
        const isSchlailePickup = deal.schlaileType === SCHLAILE_TYPE_PICKUP;
        const isSchlaileDelivery = deal.schlaileType === SCHLAILE_TYPE_DELIVERY;

        const origin = deal.originAddress;
        const destination = deal.destinationAddress;

        // Nur gültige Adressen hinzufügen
        const isValidAddress = (addr) => typeof addr === 'string' && addr.trim().length > 3;

        if (isSchlailePickup) {
          if (isValidAddress(origin)) {
            customerAddresses.add(origin);
            if (!addressToDealInfo.has(origin)) addressToDealInfo.set(origin, []);
            addressToDealInfo.get(origin).push({ dealId: deal.id, type: 'pickup_to_schlaile' });
          } else {
             console.warn(`Ungültige Origin-Adresse für Schlaile Pickup Deal ${deal.id}`);
          }
        } else if (isSchlaileDelivery) {
          if (isValidAddress(destination)) {
            customerAddresses.add(destination);
            if (!addressToDealInfo.has(destination)) addressToDealInfo.set(destination, []);
            addressToDealInfo.get(destination).push({ dealId: deal.id, type: 'delivery_from_schlaile' });
          } else {
             console.warn(`Ungültige Destination-Adresse für Schlaile Delivery Deal ${deal.id}`);
          }
        } else {
          // Normaler Umzug
          if (isValidAddress(origin)) {
             customerAddresses.add(origin);
             if (!addressToDealInfo.has(origin)) addressToDealInfo.set(origin, []);
             addressToDealInfo.get(origin).push({ dealId: deal.id, type: 'normal_origin' });
          } else {
             console.warn(`Ungültige Origin-Adresse für normalen Deal ${deal.id}`);
          }
          if (isValidAddress(destination)) {
             customerAddresses.add(destination);
             if (!addressToDealInfo.has(destination)) addressToDealInfo.set(destination, []);
             addressToDealInfo.get(destination).push({ dealId: deal.id, type: 'normal_dest' });
          } else {
             console.warn(`Ungültige Destination-Adresse für normalen Deal ${deal.id}`);
          }
        }
      });

      const waypointsForOptimization = Array.from(customerAddresses).map(addr => ({ location: addr, stopover: true }));

      if (waypointsForOptimization.length === 0) {
         console.log("Keine gültigen Kundenadressen für Optimierung gefunden.");
         setOptimizedRoute(null);
         setLoadingRoute(false);
         return;
      }

      // --- STUFE 1: Google Optimierung der Kundenadressen ---
      console.log("[Route Logic] Starte Optimierung für Kundenadressen:", waypointsForOptimization);
      const optimizationRequest = {
        origin: OFFICE_ADDRESS,
        destination: OFFICE_ADDRESS,
        waypoints: waypointsForOptimization,
        optimizeWaypoints: true,
        travelMode: window.google.maps.TravelMode.DRIVING,
      };

      const optimizationResponse = await directionsService.route(optimizationRequest);
      if (!optimizationResponse || !optimizationResponse.routes || optimizationResponse.routes.length === 0) {
          throw new Error("Keine Route von der Optimierungs-API erhalten.");
      }
      const optimizedCustomerOrder = optimizationResponse.routes[0].waypoint_order.map(index => waypointsForOptimization[index].location);
      console.log("[Route Logic] Optimierte Kundenreihenfolge:", optimizedCustomerOrder);

      // --- STUFE 2: Logische Sequenz mit Schlaile erstellen ---
      let finalSequence = [OFFICE_ADDRESS];
      let pendingSchlaileVisit = false;
      let visitedAddressesForDeal = new Map();

      const addSchlaileIfNeeded = () => {
        if (pendingSchlaileVisit && finalSequence[finalSequence.length - 1] !== SCHLAILE_FIXED_ADDRESS) {
          console.log("[Route Logic] Füge fälligen Schlaile-Besuch hinzu.");
          finalSequence.push(SCHLAILE_FIXED_ADDRESS);
          pendingSchlaileVisit = false;
        }
      };

      optimizedCustomerOrder.forEach(customerAddress => {
        const dealInfos = addressToDealInfo.get(customerAddress) || [];
        dealInfos.forEach(info => {
            const visitKey = `${info.dealId}-${info.type}`;
            if (visitedAddressesForDeal.has(visitKey)) return;

            console.log(`[Route Logic] Verarbeite Adresse: ${customerAddress.substring(0,20)}... für Deal ${info.dealId} (${info.type})`);

            if (info.type === 'delivery_from_schlaile') {
              addSchlaileIfNeeded();
              if (finalSequence[finalSequence.length - 1] !== SCHLAILE_FIXED_ADDRESS) {
                 console.log("[Route Logic] Füge Schlaile vor Lieferung hinzu.");
                 finalSequence.push(SCHLAILE_FIXED_ADDRESS);
              }
              finalSequence.push(customerAddress);
              visitedAddressesForDeal.set(visitKey, true);
            } else if (info.type === 'pickup_to_schlaile') {
              addSchlaileIfNeeded();
              finalSequence.push(customerAddress);
              pendingSchlaileVisit = true;
              visitedAddressesForDeal.set(visitKey, true);
            } else {
              addSchlaileIfNeeded();
              finalSequence.push(customerAddress);
              visitedAddressesForDeal.set(visitKey, true);
            }
        });
      });

      addSchlaileIfNeeded();

      if (finalSequence[finalSequence.length - 1] !== OFFICE_ADDRESS) {
         finalSequence.push(OFFICE_ADDRESS);
      }

      finalSequence = finalSequence.filter((addr, index, self) => index === 0 || addr !== self[index - 1]);
      console.log("[Route Logic] Finale Sequenz erstellt:", finalSequence);

      // --- STUFE 3: Finale Route für die feste Sequenz abrufen ---
      if (finalSequence.length <= 1) {
         console.warn("[Route Logic] Finale Sequenz zu kurz, keine Route berechenbar.");
         setOptimizedRoute(null);
         setLoadingRoute(false);
         return;
      }

      const finalWaypoints = finalSequence.slice(1, -1).map(addr => ({ location: addr, stopover: true }));
      const finalRouteRequest = {
        origin: finalSequence[0],
        destination: finalSequence[finalSequence.length - 1],
        waypoints: finalWaypoints,
        optimizeWaypoints: false,
        travelMode: window.google.maps.TravelMode.DRIVING,
      };

      console.log("[Route Logic] Starte finale Routenberechnung für feste Sequenz.");
      const finalRouteResponse = await directionsService.route(finalRouteRequest);
      if (!finalRouteResponse || !finalRouteResponse.routes || finalRouteResponse.routes.length === 0) {
          throw new Error("Keine Route von der finalen Routenberechnungs-API erhalten.");
      }

      const finalRouteResult = finalRouteResponse.routes[0];
      finalRouteResult.custom_waypoint_order = finalSequence; // Speichere die *gesamte* Sequenz

      // TODO: Bessere stopType Zuordnung basierend auf finalSequence und addressToDealInfo
      finalRouteResult.legs.forEach((leg, index) => {
          leg.stopType = 'intermediate'; // Platzhalter
          const startAddr = finalSequence[index];
          const endAddr = finalSequence[index + 1];

          if (startAddr === OFFICE_ADDRESS) leg.stopType = 'office_start';
          else if (endAddr === OFFICE_ADDRESS) leg.stopType = 'office_return';
          else if (startAddr === SCHLAILE_FIXED_ADDRESS) leg.stopType = 'delivery'; // Lieferung VON Schlaile
          else if (endAddr === SCHLAILE_FIXED_ADDRESS) leg.stopType = 'pickup'; // Abholung ZU Schlaile
          // Hier könnte man noch feiner differenzieren, wenn nötig
      });

      setOptimizedRoute(finalRouteResult);

    } catch (error) {
      console.error("Fehler bei der Routenberechnung:", error);
      alert(`Fehler bei der Routenberechnung: ${error.message}`);
      setOptimizedRoute(null);
    } finally {
      setLoadingRoute(false);
    }
  }, [directionsService, tourDeals, OFFICE_ADDRESS, SCHLAILE_FIXED_ADDRESS, SCHLAILE_TYPE_PICKUP, SCHLAILE_TYPE_DELIVERY]);

  // useEffect Hook, der die Route neu berechnet
  useEffect(() => {
    if (tourDeals.length > 0 && directionsService) {
      calculateOptimizedRoute();
    } else if (tourDeals.length === 0) {
      setOptimizedRoute(null);
      setLoadingRoute(false);
    }
  }, [tourDeals, directionsService, calculateOptimizedRoute]);

  // handleOpenRouteInGoogleMaps (angepasst, um die gesamte Sequenz zu verwenden)
  const handleOpenRouteInGoogleMaps = () => {
    if (!optimizedRoute || !optimizedRoute.custom_waypoint_order || optimizedRoute.custom_waypoint_order.length < 2) {
      alert("Route wurde noch nicht berechnet oder ist ungültig.");
      console.error("OptimizedRoute oder custom_waypoint_order fehlen oder sind zu kurz:", optimizedRoute);
      return;
    }

    try {
      const fullSequence = optimizedRoute.custom_waypoint_order;
      const origin = fullSequence[0];
      const destination = fullSequence[fullSequence.length - 1];
      const waypointsInSequence = fullSequence.slice(1, -1);

      // --- Filtere die Wegpunkte für den Google Maps Link (Schlaile nur einmal) ---
      const filteredWaypointsForMap = [];
      const schlaileAddedToMap = new Set();

      for (const address of waypointsInSequence) { // Iteriere nur über die Wegpunkte
        if (address === SCHLAILE_FIXED_ADDRESS) {
          if (!schlaileAddedToMap.has(SCHLAILE_FIXED_ADDRESS)) {
            filteredWaypointsForMap.push(address);
            schlaileAddedToMap.add(SCHLAILE_FIXED_ADDRESS);
          }
        } else {
          filteredWaypointsForMap.push(address);
        }
      }
      // --- ENDE Filtern ---

      const waypoints = filteredWaypointsForMap.map(addr => encodeURIComponent(addr));
      const waypointsStr = waypoints.length > 0 ? `&waypoints=${waypoints.join('|')}` : '';
      // WICHTIG: &dirflg=h entfernen, da wir Google die *optimierte* Reihenfolge geben, nicht die manuell korrigierte
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${waypointsStr}&travelmode=driving`;

      console.log("[Google Maps Link] Gefilterte Wegpunkte für Link:", filteredWaypointsForMap);
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

  // --- NEU: Berechne die gefilterte Liste der Legs für die Anzeige ---
  const filteredLegsForDisplay = useMemo(() => {
    if (!optimizedRoute || !optimizedRoute.legs) {
      return [];
    }

    const originalLegs = optimizedRoute.legs;
    const filtered = [];

    for (let i = 0; i < originalLegs.length; i++) {
      const currentLeg = originalLegs[i];
      const isCurrentLegSchlaileToSchlaile =
        currentLeg.start_address?.includes(SCHLAILE_FIXED_ADDRESS.split(',')[0]) &&
        currentLeg.end_address?.includes(SCHLAILE_FIXED_ADDRESS.split(',')[0]) &&
        currentLeg.distance?.value < 100; // Schlaile -> Schlaile mit kurzer Distanz

      if (isCurrentLegSchlaileToSchlaile) {
        // Prüfe das vorherige Leg
        const previousLeg = i > 0 ? originalLegs[i - 1] : null;
        const didPreviousLegEndAtSchlaile =
          previousLeg?.end_address?.includes(SCHLAILE_FIXED_ADDRESS.split(',')[0]);

        // Entferne das aktuelle Leg NUR, wenn das vorherige auch bei Schlaile endete
        if (didPreviousLegEndAtSchlaile) {
          // Dies ist ein redundanter, aufeinanderfolgender Schlaile->Schlaile Schritt - überspringen
          console.log(`[Route Display Filter] Entferne redundantes Schlaile->Schlaile Leg bei Index ${i}`);
          continue; // Gehe zum nächsten Leg in der Schleife
        }
        // Andernfalls (wenn das vorherige Leg NICHT bei Schlaile endete),
        // behalte dieses Leg, da es den *ersten* Stopp bei Schlaile in einer Sequenz darstellt.
      }

      // Behalte das aktuelle Leg (entweder kein Schlaile->Schlaile oder der erste Stopp bei Schlaile)
      filtered.push(currentLeg);
    }
    console.log("[Route Display Filter] Original Legs:", originalLegs.length, "Gefilterte Legs für Anzeige:", filtered.length);
    return filtered;

  }, [optimizedRoute]); // Abhängigkeit von optimizedRoute (SCHLAILE_FIXED_ADDRESS und OFFICE_ADDRESS sind Konstanten)
  // --- ENDE NEU ---

  // --- NEU: Funktion zur Klavierpreis-Berechnung ---
  const handleCalculatePianoPrice = useCallback(async (deal) => {
    const dealId = deal.id;
    if (!directionsService) {
      alert("Google Maps Service nicht bereit.");
      return;
    }

    // Set loading state
    setPianoCalculations(prev => ({ ...prev, [dealId]: { loading: true } }));

    const origin = deal.originAddress;
    const destination = deal.destinationAddress;
    const floorCountRaw = deal[PIANO_FLOOR_COUNT_FIELD_KEY]; // Wert aus Pipedrive holen
    const floorCount = parseInt(floorCountRaw || "0", 10);

    if (!origin || !destination) {
      setPianoCalculations(prev => ({ ...prev, [dealId]: { loading: false, error: "Start- oder Zieladresse fehlt im Deal." } }));
      return;
    }
    if (PIANO_FLOOR_COUNT_FIELD_KEY === "DEINE_PIPEDRIVE_STOCKWERK_FELD_ID") {
        console.warn("Platzhalter für Stockwerk-Feld-ID noch nicht ersetzt!");
        // Optional: Hier einen Fehler setzen oder mit 0 Stockwerken weiterrechnen
        // setPianoCalculations(prev => ({ ...prev, [dealId]: { loading: false, error: "Stockwerk-Feld-ID nicht konfiguriert." } }));
        // return;
    }

    try {
      // Direkte Distanzberechnung zwischen Origin und Destination des Deals
      const request = {
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      };
      const response = await directionsService.route(request);

      if (!response || !response.routes || response.routes.length === 0 || !response.routes[0].legs || response.routes[0].legs.length === 0) {
        throw new Error("Keine Route zwischen Start und Ziel gefunden.");
      }

      const leg = response.routes[0].legs[0];
      const distanceInMeters = leg.distance.value;
      const distanceInKm = Math.round(distanceInMeters / 100) / 10; // Auf eine Nachkommastelle

      // Preisberechnung basierend auf der Kilometertabelle
      const calculatePrice = (distanceKm) => {
        const priceTable = [
          { maxKm: 19, price: 300.00 }, { maxKm: 29, price: 325.00 },
          { maxKm: 39, price: 350.00 }, { maxKm: 49, price: 375.00 },
          { maxKm: 59, price: 400.00 }, { maxKm: 69, price: 400.00 }, // Annahme: 60-69km ist auch 400€
          { maxKm: 79, price: 425.00 }, { maxKm: 89, price: 450.00 },
          { maxKm: 99, price: 475.00 }, { maxKm: Infinity, price: 500.00 }
        ];
        for (const entry of priceTable) {
          if (distanceKm <= entry.maxKm) return entry.price;
        }
        return priceTable[priceTable.length - 1].price; // Fallback
      };

      const basePrice = calculatePrice(distanceInKm);
      const floorSurchargeRate = 35.00;
      const floorSurcharge = floorCount * floorSurchargeRate;
      const kmRate = 5.50;
      const kmSurcharge = Math.ceil(distanceInKm / 10) * kmRate;
      const netSum = basePrice + floorSurcharge + kmSurcharge;
      const vatRate = 0.19;
      const vatAmount = netSum * vatRate;
      const grossSum = netSum + vatAmount;

      const resultData = {
        distance_km: distanceInKm.toFixed(1),
        base_price: basePrice.toFixed(2),
        floor_count: floorCount,
        floor_surcharge_rate: floorSurchargeRate.toFixed(2),
        floor_surcharge: floorSurcharge.toFixed(2),
        km_surcharge: kmSurcharge.toFixed(2),
        net_sum: netSum.toFixed(2),
        vat_amount: vatAmount.toFixed(2),
        gross_sum: grossSum.toFixed(2),
        origin_address: origin,
        destination_address: destination
      };

      // Ergebnis speichern
      setPianoCalculations(prev => ({ ...prev, [dealId]: { loading: false, result: resultData } }));

    } catch (error) {
      console.error(`Fehler bei Klavierpreis-Berechnung für Deal ${dealId}:`, error);
      setPianoCalculations(prev => ({ ...prev, [dealId]: { loading: false, error: error.message || "Unbekannter Fehler" } }));
    }
  }, [directionsService, PIANO_FLOOR_COUNT_FIELD_KEY]); // Abhängigkeiten
  // --- ENDE NEU ---

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
                    isDraggable={!!((deal.originAddress && deal.destinationAddress) || deal.schlaileType)}
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
            selectedDate={selectedDate}
            onDateChange={(date) => setSelectedDate(date)}
            tourName={tourName}
            onTourNameChange={(name) => setTourName(name)}
            handleSaveTour={handleSaveTour}
            handleCalculateRoute={calculateOptimizedRoute}
            isSavingTour={isSavingTour}
            pianoCalculations={pianoCalculations}
            onCalculatePianoPrice={handleCalculatePianoPrice}
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
                Klicken Sie auf "Route berechnen".
              </div>
            )}
            {!loadingRoute && !optimizedRoute && tourDeals.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                Fügen Sie Aufträge zur Tour hinzu, um die Route zu berechnen.
              </div>
            )}
            {optimizedRoute && filteredLegsForDisplay.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-medium bg-gray-50 p-2 rounded">
                  <span>Gesamt:</span>
                  <div className="text-right">
                    {optimizedRoute?.routes?.[0]?.legs && (
                      <>
                        <div>{(optimizedRoute.routes[0].legs.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0) / 1000).toFixed(1)} km</div>
                        <div className="text-xs text-gray-500">{Math.round(optimizedRoute.routes[0].legs.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0) / 60)} min Fahrzeit</div>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-1 max-h-[300px] overflow-y-auto text-sm">
                  {filteredLegsForDisplay.map((leg, index, displayedArray) => (
                      <div key={index} className="flex items-center justify-between p-2 border-b last:border-b-0">
                        <div className="flex items-center space-x-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                            (index === 0 && leg.start_address?.includes(OFFICE_ADDRESS.split(',')[0])) ? 'bg-green-500 text-white' :
                            (index === displayedArray.length - 1 && leg.end_address?.includes(OFFICE_ADDRESS.split(',')[0])) ? 'bg-green-500 text-white' :
                            leg.stopType === 'pickup' ? 'bg-blue-500 text-white' :
                            leg.stopType === 'delivery' ? 'bg-orange-500 text-white' :
                            'bg-gray-400 text-white'
                          }`}>
                            {(index === 0 && leg.start_address?.includes(OFFICE_ADDRESS.split(',')[0])) ? 'S' :
                             (index === displayedArray.length - 1 && leg.end_address?.includes(OFFICE_ADDRESS.split(',')[0])) ? 'Z' :
                             leg.stopType === 'pickup' ? <Building size={12}/> :
                             leg.stopType === 'delivery' ? <Home size={12}/> :
                             index + 1}
                          </span>
                          <span className="truncate max-w-[180px]" title={leg.start_address}>
                            {(index === 0 && leg.start_address?.includes(OFFICE_ADDRESS.split(',')[0])) ? 'Büro' : leg.start_address?.split(',')[0] ?? '?'}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="truncate max-w-[180px]" title={leg.end_address}>
                            {(index === displayedArray.length - 1 && leg.end_address?.includes(OFFICE_ADDRESS.split(',')[0])) ? 'Büro' : leg.end_address?.split(',')[0] ?? '?'}
                          </span>
                        </div>
                        <div className="text-right text-xs whitespace-nowrap">
                          {/* --- Bedingung entfernt, um Distanz/Dauer IMMER anzuzeigen --- */}
                          {/* {!(index === 0 && leg.start_address?.includes(OFFICE_ADDRESS.split(',')[0])) && ( */}
                            <>
                              <div>{leg.distance?.text ?? '-'}</div>
                              <div className="text-gray-500">{leg.duration?.text ?? '-'}</div>
                            </>
                          {/* )} */}
                          {/* --- Die separate "Start"-Anzeige kann entfernt werden, da jetzt die Daten angezeigt werden --- */}
                          {/* {(index === 0 && leg.start_address?.includes(OFFICE_ADDRESS.split(',')[0])) && (
                             <div>Start</div>
                          )} */}
                        </div>
                      </div>
                  ))}
                </div>
                 {/* Button zum Öffnen in Google Maps */}
                 <button
                    onClick={handleOpenRouteInGoogleMaps}
                    className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
                    disabled={loadingRoute || !optimizedRoute} // Deaktivieren während Laden oder wenn keine Route
                  >
                    <MapPin className="w-4 h-4" />
                    In Google Maps öffnen
                  </button>
              </div>
            )}
             {/* Fallback-Anzeige, wenn nach Filterung keine Legs mehr übrig sind */}
             {optimizedRoute?.legs && filteredLegsForDisplay.length === 0 && !loadingRoute && (
                 <div className="text-center py-4 text-gray-500 text-sm">
                    Keine gültigen Routenschritte nach Filterung gefunden.
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