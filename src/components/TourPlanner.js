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

  // Debug-Log für die Stockwerk-Daten
  useEffect(() => {
    if (deal && !deal.schlaileType) {
      console.log(`[DEBUG] PipedriveDeal Rendering: Deal ${deal.id}`, {
        originFloor: deal.originFloor,
        destinationFloor: deal.destinationFloor,
        schlaileType: deal.schlaileType
      });
    }
  }, [deal]);

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
            
            {/* Stockwerk-Informationen für Nicht-Schlaile-Deals */}
            {!deal.schlaileType && (
              <>
                {deal.originFloor && (
                  <div className="flex items-start text-gray-600">
                    <Building className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
                    <span className="flex-1">
                      <strong>Stockwerk Abholung:</strong> {deal.originFloor}
                    </span>
          </div>
                )}
                
                {deal.destinationFloor && (
                  <div className="flex items-start text-gray-600">
                    <Building className="w-4 h-4 mr-2 mt-0.5 text-purple-600" />
                    <span className="flex-1">
                      <strong>Stockwerk Lieferung:</strong> {deal.destinationFloor}
                    </span>
                  </div>
                )}
                
                {/* Debug-Info direkt im UI - nur während der Entwicklung */}
                <div className="text-xs text-gray-400 mt-1 italic">
                  Debug: originFloor={deal.originFloor || 'leer'}, destFloor={deal.destinationFloor || 'leer'}
                </div>
              </>
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
  onCalculatePianoPrice,
  dealSpecificData,
  onGrandPianoSizeChange,
  optimizedRoute, // NEU: Route übergeben für Logik
  onDealTypeChange
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
              // Automatische Erkennung als Fallback
              const autoDetectedIsPiano = deal.title?.toLowerCase().includes('piano');
              const autoDetectedIsGrandPiano = deal.title?.toLowerCase().includes('flügel');

              // Manuell ausgewählter Typ oder 'auto'
              const selectedType = dealSpecificData[deal.id]?.type || 'auto';

              // Bestimme den effektiven Typ für die Anzeige/Berechnung
              let effectiveType = 'other';
              if (selectedType === 'piano') {
                effectiveType = 'piano';
              } else if (selectedType === 'grand_piano') {
                effectiveType = 'grand_piano';
              } else if (selectedType === 'auto') {
                if (autoDetectedIsGrandPiano) effectiveType = 'grand_piano';
                else if (autoDetectedIsPiano) effectiveType = 'piano';
              }

              const isEffectivelyGrandPiano = effectiveType === 'grand_piano';
              const isEffectivelyPiano = effectiveType === 'piano';
              const isTypeDetermined = isEffectivelyPiano || isEffectivelyGrandPiano; // Ist der Typ klar?

              const calculation = pianoCalculations[deal.id];
              const grandPianoSize = dealSpecificData[deal.id]?.size;
              const isSchlaileDeal = !!deal.schlaileType;

              // --- NEU: Angepasste Bedingung für Anzeige ---
              // Zeige UI, wenn Typ bestimmt ist ODER wenn es ein Schlaile Deal ist
              // (Bei Schlaile braucht der User die UI, um den Typ ggf. auszuwählen)
              const shouldDisplayCalculationSection = isTypeDetermined || isSchlaileDeal;

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
                  {/* Preisberechnung UI */}
                  {shouldDisplayCalculationSection && ( // Verwende die neue Bedingung
                    <div className="mt-1 ml-4 text-xs space-y-2">
                      {/* Dropdown für Typauswahl (immer anzeigen, wenn Section sichtbar) */}
                      <div className="flex items-center gap-2">
                        <label htmlFor={`dealType-${deal.id}`} className="text-xs font-medium text-gray-600">Typ:</label>
                        <select
                          id={`dealType-${deal.id}`}
                          value={selectedType}
                          onChange={(e) => onDealTypeChange(deal.id, e.target.value)}
                          className="p-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="auto">Automatisch (Titel)</option>
                          <option value="piano">Klavier</option>
                          <option value="grand_piano">Flügel</option>
                        </select>
                      </div>

                      {/* Eingabefeld für Größe (nur wenn effektiv Flügel) */}
                      {isEffectivelyGrandPiano && (
                        <div className="flex items-center gap-2">
                           <label htmlFor={`grandPianoSize-${deal.id}`} className="text-xs font-medium text-gray-600">Größe (cm):</label>
                           <input
                             type="number"
                             id={`grandPianoSize-${deal.id}`}
                             value={grandPianoSize ?? ''}
                             onChange={(e) => onGrandPianoSizeChange(deal.id, e.target.value)}
                             placeholder="z.B. 180"
                             min="1"
                             className="w-20 p-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                           />
                        </div>
                      )}

                      {/* Button und Ergebnis-Anzeige */}
                      {!calculation || (!calculation.result && !calculation.error && !calculation.loading) ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCalculatePianoPrice(deal);
                          }}
                          className={`px-2 py-1 rounded text-xs ${isEffectivelyGrandPiano ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : (isEffectivelyPiano ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')} disabled:opacity-50 disabled:cursor-not-allowed`}
                          // --- NEU: Angepasste Deaktivierungslogik ---
                          disabled={
                            // Deaktivieren, wenn Typ noch nicht bestimmt ist
                            !isTypeDetermined ||
                            // ODER wenn Flügel und Größe fehlt
                            (isEffectivelyGrandPiano && (grandPianoSize === undefined || grandPianoSize <= 0))
                          }
                          title={
                             // Hinweis, wenn Typ fehlt
                             (!isTypeDetermined ? "Bitte Typ (Klavier/Flügel) auswählen. " : "") +
                             // Hinweis, wenn Größe fehlt
                             (isEffectivelyGrandPiano && (grandPianoSize === undefined || grandPianoSize <= 0) ? "Bitte Flügelgröße eingeben. " : "") +
                             // Hinweis für Schlaile Schätzung
                             (isSchlaileDeal && !optimizedRoute ? "Berechnet vorläufige Distanz. Für exakten Preis bitte Route optimieren." : "")
                          }
                        >
                          {/* Angepasster Button-Text */}
                          {!isTypeDetermined ? 'Typ auswählen...' : (isEffectivelyGrandPiano ? 'Flügelpreis berechnen' : 'Klavierpreis berechnen')}
                          {/* Schlaile Schätzung Indikator */}
                          {isSchlaileDeal && !optimizedRoute && <span className="ml-1 text-orange-600">*</span>}
                        </button>
                      ) : calculation.loading ? (
                        <span className="text-gray-500 italic">Berechne Preis...</span>
                      ) : calculation.error ? (
                        <span className="text-red-600" title={calculation.error}>Fehler: {calculation.error}</span>
                      ) : calculation.result ? (
                        <div className={`p-2 rounded border ${isEffectivelyGrandPiano ? 'bg-purple-50 border-purple-100' : 'bg-indigo-50 border-indigo-100'}`}>
                          <div className="font-semibold text-sm mb-1">
                            <span className={isEffectivelyGrandPiano ? 'text-purple-800' : 'text-indigo-800'}>
                                {calculation.result.calculation_type}: {calculation.result.gross_sum} €
                            </span>
                          </div>
                          <div className="text-xs text-gray-700 space-y-0.5">
                             <div>Netto: {calculation.result.net_sum} €</div>
                             <div>(Basis<span className="text-gray-500">({calculation.result.distance_km}km)</span>: {calculation.result.base_price}€</div>
                             <div>+ Etage<span className="text-gray-500">({calculation.result.floor_count}x{calculation.result.floor_surcharge_rate}€)</span>: {calculation.result.floor_surcharge}€</div>
                             <div>+ KM<span className="text-gray-500">({isEffectivelyGrandPiano ? `${calculation.result.distance_km}km*${calculation.result.km_rate}€` : `je 10km*${calculation.result.km_rate}€`})</span>: {calculation.result.km_surcharge}€)</div>
                          </div>
                          {/* NEU: Hinweis, wenn Schätzung verwendet wurde */}
                          {calculation.result.distance_source === 'direct_calculation_schlaile_fallback' && (
                            <p className="text-orange-600 text-[10px] italic mt-1">
                              *Distanz geschätzt. Ggf. nach Routenoptimierung neu berechnen.
                            </p>
                          )}
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
  const PIANO_FLOOR_COUNT_FIELD_KEY = "384e703f3b71a344cbff7adf46f2eab3ff28c0a0"; // Stockwerk-Feld für normale Transporte
  const GRAND_PIANO_SIZE_FIELD_KEY = "DEINE_PIPEDRIVE_FLUEGELGROESSE_FELD_ID";
  
  // Neue Konstanten für die Stockwerk-Felder
  const ORIGIN_FLOOR_FIELD_KEY = "9e4e07bce884e21671546529b564da98ceb4765a";
  const DESTINATION_FLOOR_FIELD_KEY = "72cfdc30fa0621d1d6947cf408409e44c6bb40d6";
  // Neues Feld für Schlaile-Lieferung Stockwerk
  const SCHLAILE_DELIVERY_FLOOR_FIELD_KEY = "2c2118401f79c6d3276e7bce4aaa41e4decd7592";
  
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
  // Erweitere dealSpecificData: { dealId: { size?: number, type?: 'auto' | 'piano' | 'grand_piano' } }
  const [dealSpecificData, setDealSpecificData] = useState({});

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
            let schlaileMatched = false; // Flag
            // --- ENDE VERSTÄRKTES DEBUGGING ---

            if (schlaileTransportType === SCHLAILE_TYPE_DELIVERY) {
              // --- VERSTÄRKTES DEBUGGING ---
              schlaileMatched = true;
              // --- ENDE VERSTÄRKTES DEBUGGING ---
              // Lieferung VON Schlaile: Start ist die feste Schlaile-Adresse
              originAddressFinal = SCHLAILE_FIXED_ADDRESS;
              // Zieladresse (destinationAddressFinal) bleibt die Standardadresse des Deals

            } else if (schlaileTransportType === SCHLAILE_TYPE_PICKUP) {
              // --- VERSTÄRKTES DEBUGGING ---
              schlaileMatched = true;
              // --- ENDE VERSTÄRKTES DEBUGGING ---
              // Abholung BEI Kunde für Schlaile: Ziel ist die feste Schlaile-Adresse
              destinationAddressFinal = SCHLAILE_FIXED_ADDRESS;
              // Abholadresse (originAddressFinal) bleibt die Standardadresse des Deals
            }


            // Flügelgröße aus Pipedrive lesen (optional)
            const grandPianoSizeRaw = dealData.data[GRAND_PIANO_SIZE_FIELD_KEY];
            const initialGrandPianoSize = grandPianoSizeRaw ? parseInt(grandPianoSizeRaw, 10) : undefined;
            if (initialGrandPianoSize !== undefined && !isNaN(initialGrandPianoSize)) {
                // Nur Größe initial setzen, Typ bleibt 'auto' (oder undefined)
                setDealSpecificData(prev => ({
                    ...prev,
                    [project.id]: { ...(prev[project.id] || {}), size: initialGrandPianoSize }
                }));
            }

            // Stockwerk-Informationen abrufen
            const originFloor = dealData.data[ORIGIN_FLOOR_FIELD_KEY] || '';
            const destinationFloor = dealData.data[DESTINATION_FLOOR_FIELD_KEY] || '';
            // Schlaile-spezifisches Stockwerk-Feld
            const schlaileDeliveryFloor = dealData.data[SCHLAILE_DELIVERY_FLOOR_FIELD_KEY] || '';

            // Debug-Logs für Stockwerk-Felder
            console.log(`[DEBUG] Deal ${dealId} Stockwerk-Felder:`, {
              originFloorKey: ORIGIN_FLOOR_FIELD_KEY,
              originFloorValue: dealData.data[ORIGIN_FLOOR_FIELD_KEY],
              destinationFloorKey: DESTINATION_FLOOR_FIELD_KEY,
              destinationFloorValue: dealData.data[DESTINATION_FLOOR_FIELD_KEY],
              schlaileDeliveryFloorKey: SCHLAILE_DELIVERY_FLOOR_FIELD_KEY,
              schlaileDeliveryFloorValue: dealData.data[SCHLAILE_DELIVERY_FLOOR_FIELD_KEY],
              schlaileType: schlaileTransportType
            });

            // Erstelle das Objekt in der Variable
            dealObjectToAdd = {
              id: project.id,
              dealId: dealId,
              title: project.title || dealData.data.title,
              organization: dealData.data.org_name,
              moveDate: moveDate || project.start_date,
              originAddress: originAddressFinal,
              destinationAddress: destinationAddressFinal,
              value: dealData.data.value,
              currency: dealData.data.currency,
              region: getRegionNameFromPhaseId(project.phase_id),
              projectStartDate: project.start_date,
              projectEndDate: project.end_date,
              schlaileType: schlaileTransportType || null,
              [PIANO_FLOOR_COUNT_FIELD_KEY]: dealData.data[PIANO_FLOOR_COUNT_FIELD_KEY] || 0,
              // Stockwerk-Felder
              originFloor: originFloor,
              destinationFloor: destinationFloor,
              // Schlaile-spezifisches Stockwerk-Feld
              [SCHLAILE_DELIVERY_FLOOR_FIELD_KEY]: schlaileDeliveryFloor
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
              schlaileType: null,
              [PIANO_FLOOR_COUNT_FIELD_KEY]: 0,
              originFloor: '',
              destinationFloor: '',
              [SCHLAILE_DELIVERY_FLOOR_FIELD_KEY]: '',
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
            schlaileType: null,
            [PIANO_FLOOR_COUNT_FIELD_KEY]: 0,
            originFloor: '',
            destinationFloor: '',
            [SCHLAILE_DELIVERY_FLOOR_FIELD_KEY]: '',
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
            schlaileType: null,
            [PIANO_FLOOR_COUNT_FIELD_KEY]: 0,
            originFloor: '',
            destinationFloor: '',
            [SCHLAILE_DELIVERY_FLOOR_FIELD_KEY]: '',
          };
      }

      // Logge das Objekt, *bevor* es hinzugefügt wird (wenn es erstellt wurde)
      if (dealObjectToAdd) {
        resultArray.push(dealObjectToAdd); // Füge das Objekt zum Array hinzu
      } else {
         console.warn(`Projekt ${project.id}: Kein Objekt zum Hinzufügen erstellt.`);
      }
    } // Ende der for...of Schleife

    // Das return resultArray sollte *nach* der Schleife stehen
    return resultArray;
  }, [getRegionNameFromPhaseId, SCHLAILE_TRANSPORT_TYPE_KEY, PIANO_FLOOR_COUNT_FIELD_KEY, GRAND_PIANO_SIZE_FIELD_KEY, ORIGIN_FLOOR_FIELD_KEY, DESTINATION_FLOOR_FIELD_KEY, SCHLAILE_DELIVERY_FLOOR_FIELD_KEY]);

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
        setAllDeals(data);
        filterDeals(data, searchQuery, showDateFilter ? selectedDate : null);
        setLoading(false);
        return;
      } else {
        localStorage.removeItem(cacheKey);
      }
    }

    let allProjectsWithDetails = [];

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
         setOptimizedRoute(null);
         setLoadingRoute(false);
         return;
      }


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

      // --- STUFE 2: Logische Sequenz mit Schlaile erstellen ---
      let finalSequence = [OFFICE_ADDRESS];
      let pendingSchlaileVisit = false;
      let visitedAddressesForDeal = new Map();

      const addSchlaileIfNeeded = () => {
        if (pendingSchlaileVisit && finalSequence[finalSequence.length - 1] !== SCHLAILE_FIXED_ADDRESS) {
          finalSequence.push(SCHLAILE_FIXED_ADDRESS);
          pendingSchlaileVisit = false;
        }
      };

      optimizedCustomerOrder.forEach(customerAddress => {
        const dealInfos = addressToDealInfo.get(customerAddress) || [];
        dealInfos.forEach(info => {
            const visitKey = `${info.dealId}-${info.type}`;
            if (visitedAddressesForDeal.has(visitKey)) return;


            if (info.type === 'delivery_from_schlaile') {
              addSchlaileIfNeeded();
              if (finalSequence[finalSequence.length - 1] !== SCHLAILE_FIXED_ADDRESS) {
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

      window.open(googleMapsUrl, '_blank');
    } catch (error) {
      console.error("Fehler beim Erstellen der Google Maps URL:", error);
      alert("Ein Fehler ist beim Erstellen des Google Maps Links aufgetreten.");
    }
  };

  // Google Directions Service Initialisierung
  useEffect(() => {
    if (window.google && window.google.maps && !directionsService) {
      setDirectionsService(new window.google.maps.DirectionsService());
    } else if (!window.google || !window.google.maps) {
      const existingScript = document.getElementById('googleMapsScript');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'googleMapsScript';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
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
          continue; // Gehe zum nächsten Leg in der Schleife
        }
        // Andernfalls (wenn das vorherige Leg NICHT bei Schlaile endete),
        // behalte dieses Leg, da es den *ersten* Stopp bei Schlaile in einer Sequenz darstellt.
      }

      // Behalte das aktuelle Leg (entweder kein Schlaile->Schlaile oder der erste Stopp bei Schlaile)
      filtered.push(currentLeg);
    }
    return filtered;

  }, [optimizedRoute]); // Abhängigkeit von optimizedRoute (SCHLAILE_FIXED_ADDRESS und OFFICE_ADDRESS sind Konstanten)
  // --- ENDE NEU ---

  // Funktion zum Aktualisieren der Flügelgröße (bleibt gleich)
  const handleGrandPianoSizeChange = (dealId, size) => {
    const newSize = size === '' ? undefined : parseInt(size, 10);
    setDealSpecificData(prev => ({
      ...prev,
      [dealId]: { ...(prev[dealId] || {}), size: isNaN(newSize) ? undefined : newSize }
    }));
    // Berechnung zurücksetzen
    setPianoCalculations(prev => {
        const newState = {...prev};
        if (newState[dealId]) {
            delete newState[dealId].result;
            delete newState[dealId].error;
        }
        return newState;
    });
  };

  // --- NEU: Funktion zum Aktualisieren des Deal-Typs ---
  const handleDealTypeChange = (dealId, type) => {
    setDealSpecificData(prev => ({
      ...prev,
      [dealId]: { ...(prev[dealId] || {}), type: type } // type ist 'auto', 'piano', oder 'grand_piano'
    }));
    // Berechnung zurücksetzen, da sich der Typ geändert hat
    setPianoCalculations(prev => {
        const newState = {...prev};
        if (newState[dealId]) {
            delete newState[dealId].result;
            delete newState[dealId].error;
        }
        return newState;
    });
  };
  // --- ENDE NEU ---

  // --- ANGEPASST: Funktion zur Klavier/Flügelpreis-Berechnung ---
  const handleCalculatePianoPrice = useCallback(async (deal) => {
    const dealId = deal.id;
    if (!directionsService) {
      alert("Google Maps Service nicht bereit.");
      return;
    }

    setPianoCalculations(prev => ({ ...prev, [dealId]: { loading: true } }));

    const origin = deal.originAddress; // Kunden- oder Schlaile-Adresse (je nach Typ)
    const destination = deal.destinationAddress; // Kunden- oder Schlaile-Adresse (je nach Typ)
    
    // --- KORRIGIERT: Stockwerk-Berechnung mit Berücksichtigung der Pipedrive-Felder ---
    const floorCountRaw = deal[PIANO_FLOOR_COUNT_FIELD_KEY];
    let floorCount = parseInt(floorCountRaw || "0", 10);
    
    const isSchlaileDeal = !!deal.schlaileType;
    
    if (isSchlaileDeal) {
      // Für Schlaile-Deals: Summe aus originFloor und schlaileDeliveryFloor
      let originFloorValue = 0;
      let schlaileDeliveryFloorValue = 0;
      
      console.log(`[DEBUG] Schlaile-Transport Stockwerk-Werte für Deal ${dealId}:`, {
        origin: deal.originFloor,
        schlaileDelivery: deal[SCHLAILE_DELIVERY_FLOOR_FIELD_KEY],
        schlaileType: deal.schlaileType,
        pianoPipedriveFloorCount: floorCountRaw
      });
      
      // Versuche, originFloor zu parsen und verwende den absoluten Wert
      if (deal.originFloor) {
        const parsed = parseInt(deal.originFloor, 10);
        if (!isNaN(parsed)) {
          // Verwende den absoluten Wert (negative Werte werden positiv)
          originFloorValue = Math.abs(parsed);
        }
      }
      
      // Versuche, schlaileDeliveryFloor zu parsen und verwende den absoluten Wert
      if (deal[SCHLAILE_DELIVERY_FLOOR_FIELD_KEY]) {
        const parsed = parseInt(deal[SCHLAILE_DELIVERY_FLOOR_FIELD_KEY], 10);
        if (!isNaN(parsed)) {
          // Verwende den absoluten Wert (negative Werte werden positiv)
          schlaileDeliveryFloorValue = Math.abs(parsed);
        }
      }
      
      // Summiere die Stockwerke (beide als absolute Werte)
      const totalFloors = originFloorValue + schlaileDeliveryFloorValue;
      
      console.log(`[DEBUG] Berechnete Stockwerk-Summe für Schlaile-Transport Deal ${dealId}:`, {
        originFloorValue,
        schlaileDeliveryFloorValue,
        originalFloorCount: floorCount,
        totalFloors: totalFloors
      });
      
      // Überschreibe die floorCount mit der Summe aus beiden Feldern
      floorCount = totalFloors;
    } else {
      // Für Nicht-Schlaile-Deals: Summe aus originFloor und destinationFloor
      let originFloorValue = 0;
      let destinationFloorValue = 0;
      
      console.log(`[DEBUG] Stockwerk-Werte für Deal ${dealId}:`, {
        origin: deal.originFloor,
        destination: deal.destinationFloor,
        pianoPipedriveFloorCount: floorCountRaw
      });
      
      // Versuche, originFloor zu parsen und verwende den absoluten Wert
      if (deal.originFloor) {
        const parsed = parseInt(deal.originFloor, 10);
        if (!isNaN(parsed)) {
          // Verwende den absoluten Wert (negative Werte werden positiv)
          originFloorValue = Math.abs(parsed);
        }
      }
      
      // Versuche, destinationFloor zu parsen und verwende den absoluten Wert
      if (deal.destinationFloor) {
        const parsed = parseInt(deal.destinationFloor, 10);
        if (!isNaN(parsed)) {
          // Verwende den absoluten Wert (negative Werte werden positiv)
          destinationFloorValue = Math.abs(parsed);
        }
      }
      
      // Summiere die Stockwerke (beide als absolute Werte)
      const totalFloors = originFloorValue + destinationFloorValue;
      
      console.log(`[DEBUG] Berechnete Stockwerk-Summe für Deal ${dealId}:`, {
        originFloorValue,
        destinationFloorValue,
        originalFloorCount: floorCount,
        totalFloors: totalFloors
      });
      
      // Überschreibe die floorCount mit der Summe aus beiden Feldern
      floorCount = totalFloors;
    }
    // --- ENDE KORRIGIERT: Stockwerk-Berechnung ---
    
    const customerAddress = deal.schlaileType === SCHLAILE_TYPE_PICKUP
                             ? deal.originAddress // Bei Abholung ist Origin der Kunde
                             : deal.schlaileType === SCHLAILE_TYPE_DELIVERY
                             ? deal.destinationAddress // Bei Lieferung ist Dest der Kunde
                             : null; // Sollte nicht vorkommen, wenn isSchlaileDeal true ist

    // Rest der Funktion bleibt unverändert...

    // --- Typbestimmung (Klavier/Flügel) ---
    const selectedType = dealSpecificData[dealId]?.type || 'auto';
    let isGrandPiano;
    // ... (Logik für isGrandPiano bleibt gleich) ...
     if (selectedType === 'grand_piano') { isGrandPiano = true; }
     else if (selectedType === 'piano') { isGrandPiano = false; }
     else { isGrandPiano = deal.title?.toLowerCase().includes('flügel'); }

    const grandPianoSizeCm = dealSpecificData[dealId]?.size;
    if (isGrandPiano && (grandPianoSizeCm === undefined || grandPianoSizeCm <= 0)) {
      setPianoCalculations(prev => ({ ...prev, [dealId]: { loading: false, error: "Bitte geben Sie eine gültige Flügelgröße (> 0 cm) ein." } }));
      return;
    }
    // --- ENDE Typbestimmung ---

    let distanceInKm = NaN;
    let distanceSource = 'unknown'; // Start mit unbekannt

    try {
      // --- Distanzermittlung ---

      if (isSchlaileDeal) {
        // --- Fall 1: Schlaile Transport ---
        if (optimizedRoute && optimizedRoute.legs /*...*/) {
          // --- Fall 1a: Schlaile mit optimierter Route ---
          // ... (Logik zum Finden von foundLeg bleibt gleich) ...
          let foundLeg = null;
          // ... (Code zum Finden des Legs basierend auf deal.schlaileType, customerAddress, SCHLAILE_FIXED_ADDRESS) ...
          const waypoints = optimizedRoute.request?.waypoints || [];
          const order = optimizedRoute.waypoint_order || [];
          let startIndex = -1, endIndex = -1;

          if (deal.schlaileType === SCHLAILE_TYPE_PICKUP) { // Kunde -> Schlaile
              // Finde Index des Kunden (origin) und von Schlaile (destination) in der optimierten Route
              startIndex = order.findIndex(i => waypoints[i]?.location?.query === origin);
              endIndex = order.findIndex(i => waypoints[i]?.location?.query === destination); // Schlaile ist Ziel
          } else if (deal.schlaileType === SCHLAILE_TYPE_DELIVERY) { // Schlaile -> Kunde
              // Finde Index von Schlaile (origin) und des Kunden (destination)
              startIndex = order.findIndex(i => waypoints[i]?.location?.query === origin); // Schlaile ist Start
              endIndex = order.findIndex(i => waypoints[i]?.location?.query === destination);
          }

          // Finde den Leg, der diesem Schritt entspricht
          // Der Index im 'legs'-Array entspricht dem Index des Start-Waypoints in der 'order'-Liste
          if (startIndex !== -1 && startIndex < optimizedRoute.legs.length) {
              // Überprüfe grob, ob die Adressen übereinstimmen (kann ungenau sein!)
              const legCandidate = optimizedRoute.legs[startIndex];
              const legStartAddress = legCandidate.start_address;
              const legEndAddress = legCandidate.end_address;

              // Einfacher Check, ob Teile der Adressen übereinstimmen
              const isStartMatch = legStartAddress.includes(origin.split(',')[0]);
              const isEndMatch = legEndAddress.includes(destination.split(',')[0]);

              if (isStartMatch && isEndMatch) {
                  foundLeg = legCandidate;
              } else {
                   console.warn(`[Schlaile Preis] Leg ${startIndex} Adressen (${legStartAddress} -> ${legEndAddress}) passen nicht exakt zu Deal (${origin} -> ${destination}). Prüfe Logik.`);
                   // Optional: Strengere Prüfung oder andere Logik zum Finden des Legs
              }
          } else {
              console.warn(`[Schlaile Preis] Konnte Start-Index (${startIndex}) für Deal ${dealId} in optimierter Route nicht finden.`);
          }
          // --- Ende Leg-Suche ---


          if (foundLeg && typeof foundLeg.distance?.value === 'number') {
            distanceInKm = Math.round(foundLeg.distance.value / 100) / 10;
            distanceSource = 'optimized_route';
          } else {
            // --- Fall 1b: Schlaile ohne optimierte Route (oder Leg nicht gefunden) -> Fallback ---
            console.warn(`[Schlaile Preis] Konnte passenden Leg oder Distanz in optimierter Route für Deal ${dealId} nicht finden. Fallback zur Direktberechnung (Kunde <-> Schlaile).`);
            distanceSource = 'direct_calculation_schlaile_fallback';
            if (!origin || !destination) {
                setPianoCalculations(prev => ({ ...prev, [dealId]: { loading: false, error: "Start- oder Zieladresse für Schlaile-Fallback fehlt." } }));
                return;
            }
            const request = { origin, destination, travelMode: window.google.maps.TravelMode.DRIVING };
            const response = await directionsService.route(request);
            if (!response?.routes?.[0]?.legs?.[0]?.distance?.value) {
              throw new Error("Keine gültige Distanz im Schlaile-Routen-Fallback gefunden.");
            }
            distanceInKm = Math.round(response.routes[0].legs[0].distance.value / 100) / 10;
          }
        } else {
             // --- Fall 1b (explizit): Schlaile ohne optimierte Route -> Fallback ---
             distanceSource = 'direct_calculation_schlaile_fallback';
             if (!origin || !destination) {
                 setPianoCalculations(prev => ({ ...prev, [dealId]: { loading: false, error: "Start- oder Zieladresse für Schlaile-Fallback fehlt." } }));
                 return;
             }
             const request = { origin, destination, travelMode: window.google.maps.TravelMode.DRIVING };
             const response = await directionsService.route(request);
             if (!response?.routes?.[0]?.legs?.[0]?.distance?.value) {
               throw new Error("Keine gültige Distanz im Schlaile-Routen-Fallback gefunden.");
             }
             distanceInKm = Math.round(response.routes[0].legs[0].distance.value / 100) / 10;
        }
        // --- Ende Fall 1: Schlaile Transport ---

      } else {
        // --- Fall 2: Normaler (Nicht-Schlaile) Transport ---
        distanceSource = 'direct_calculation_office_pickup_delivery';

    if (!origin || !destination) {
      setPianoCalculations(prev => ({ ...prev, [dealId]: { loading: false, error: "Start- oder Zieladresse fehlt im Deal." } }));
      return;
    }
        if (!OFFICE_ADDRESS) {
             console.error("Büroadresse (OFFICE_ADDRESS) ist nicht definiert!");
             setPianoCalculations(prev => ({ ...prev, [dealId]: { loading: false, error: "Konfigurationsfehler: Büroadresse fehlt." } }));
             return;
    }

    try {
            // 1. API-Aufruf: Büro -> Abholung (origin)
            const request1 = { origin: OFFICE_ADDRESS, destination: origin, travelMode: window.google.maps.TravelMode.DRIVING };
            const response1 = await directionsService.route(request1);
            if (!response1?.routes?.[0]?.legs?.[0]?.distance?.value) {
                throw new Error(`Keine gültige Distanz für Büro -> Abholung (${origin}) gefunden.`);
            }
            const distance1_meters = response1.routes[0].legs[0].distance.value;

            // 2. API-Aufruf: Abholung (origin) -> Lieferung (destination)
            const request2 = { origin: origin, destination: destination, travelMode: window.google.maps.TravelMode.DRIVING };
            const response2 = await directionsService.route(request2);
            if (!response2?.routes?.[0]?.legs?.[0]?.distance?.value) {
                throw new Error(`Keine gültige Distanz für Abholung (${origin}) -> Lieferung (${destination}) gefunden.`);
            }
            const distance2_meters = response2.routes[0].legs[0].distance.value;

            // Distanzen addieren und in km umrechnen
            const totalDistanceMeters = distance1_meters + distance2_meters;
            distanceInKm = Math.round(totalDistanceMeters / 100) / 10;

        } catch (apiError) {
            console.error("Fehler bei der Distanzberechnung (Büro->Abholung->Lieferung):", apiError);
            throw new Error(`Fehler bei Distanzberechnung: ${apiError.message}`);
        }
        // --- Ende Fall 2: Normaler Transport ---
      }
      // --- ENDE Distanzermittlung ---

      // --- Prüfung auf gültige Distanz ---
      if (isNaN(distanceInKm) || typeof distanceInKm !== 'number') {
          console.error(`[Preisberechnung Fehler] Ungültiger Distanzwert für Deal ${dealId}:`, distanceInKm);
          throw new Error(`Konnte keine gültige Distanz ermitteln (${distanceSource}).`);
      }
      // --- ENDE Prüfung ---


      // --- Preisberechnung basierend auf distanceInKm ---
      let basePrice = 0;
      let floorSurcharge = 0;
      let kmSurcharge = 0;
      let calculationType = isGrandPiano ? 'Flügel' : 'Klavier';
      let sizeInfo = '';
      let floorSurchargeRate = 0;
      let kmRate = 0;

      if (isGrandPiano) {
         sizeInfo = ` (${grandPianoSizeCm} cm)`;
         kmRate = 0.55; // Sicherstellen, dass kmRate hier zugewiesen wird
         kmSurcharge = distanceInKm * kmRate;
         if (grandPianoSizeCm < 200) {
             calculationType += ' (< 200cm)';
             floorSurchargeRate = 52.00; // Sicherstellen, dass floorSurchargeRate hier zugewiesen wird
             floorSurcharge = floorCount * floorSurchargeRate;
             const priceTableGrandSmall = [
                { maxKm: 20, price: 427.50 }, { maxKm: 30, price: 457.50 },
                { maxKm: 40, price: 457.50 }, { maxKm: 50, price: 517.50 },
                { maxKm: 60, price: 517.50 }, { maxKm: 70, price: 607.50 },
                { maxKm: 80, price: 607.50 }, { maxKm: 90, price: 727.50 },
                { maxKm: 100, price: 727.50 }, { maxKm: 110, price: 877.50 },
                { maxKm: 120, price: 877.50 }, { maxKm: Infinity, price: 877.50 }
             ];
             // Wichtig: Sicherstellen, dass basePrice immer zugewiesen wird
             basePrice = priceTableGrandSmall[priceTableGrandSmall.length - 1].price; // Fallback auf letzten Wert
             for (const entry of priceTableGrandSmall) {
                 if (distanceInKm <= entry.maxKm) {
                     basePrice = entry.price;
                     break;
                 }
             }
         } else { // >= 200cm
             calculationType += ' (>= 200cm)';
             floorSurchargeRate = 62.00; // Sicherstellen, dass floorSurchargeRate hier zugewiesen wird
             floorSurcharge = floorCount * floorSurchargeRate;
             const priceTableGrandLarge = [
                { maxKm: 20, price: 528.00 }, { maxKm: 30, price: 558.00 },
                { maxKm: 40, price: 558.00 }, { maxKm: 50, price: 558.00 },
                { maxKm: 60, price: 618.00 }, { maxKm: 70, price: 708.00 },
                { maxKm: 80, price: 708.00 }, { maxKm: 90, price: 828.00 },
                { maxKm: 100, price: 828.00 }, { maxKm: 110, price: 978.00 },
                { maxKm: 120, price: 978.00 }, { maxKm: Infinity, price: 978.00 }
             ];
             // Wichtig: Sicherstellen, dass basePrice immer zugewiesen wird
             basePrice = priceTableGrandLarge[priceTableGrandLarge.length - 1].price; // Fallback auf letzten Wert
             for (const entry of priceTableGrandLarge) {
                 if (distanceInKm <= entry.maxKm) {
                     basePrice = entry.price;
                     break;
                 }
             }
         }
      } else { // Klavier
         calculationType = 'Klavier';
         floorSurchargeRate = 35.00; // Sicherstellen, dass floorSurchargeRate hier zugewiesen wird
         kmRate = 5.50; // Sicherstellen, dass kmRate hier zugewiesen wird
         floorSurcharge = floorCount * floorSurchargeRate;
         kmSurcharge = Math.ceil(distanceInKm / 10) * kmRate;
         const calculatePianoBasePrice = (distanceKm) => {
             const priceTablePiano = [
          { maxKm: 19, price: 300.00 }, { maxKm: 29, price: 325.00 },
          { maxKm: 39, price: 350.00 }, { maxKm: 49, price: 375.00 },
                { maxKm: 59, price: 400.00 }, { maxKm: 69, price: 400.00 },
          { maxKm: 79, price: 425.00 }, { maxKm: 89, price: 450.00 },
          { maxKm: 99, price: 475.00 }, { maxKm: Infinity, price: 500.00 }
        ];
             // Wichtig: Sicherstellen, dass immer ein Preis zurückgegeben wird
             let calculatedPrice = priceTablePiano[priceTablePiano.length - 1].price; // Fallback
             for (const entry of priceTablePiano) {
                 if (distanceKm <= entry.maxKm) {
                     calculatedPrice = entry.price;
                     break;
                 }
             }
             return calculatedPrice;
         };
         basePrice = calculatePianoBasePrice(distanceInKm); // Sicherstellen, dass basePrice zugewiesen wird
      }

      // Sicherstellen, dass alle Variablen Zahlen sind, bevor toFixed aufgerufen wird
      // (Obwohl die obigen Zuweisungen dies abdecken sollten, ist dies eine zusätzliche Sicherheit)
      if ([basePrice, floorSurcharge, kmSurcharge, floorSurchargeRate, kmRate].some(val => typeof val !== 'number' || isNaN(val))) {
          console.error(`[Preisberechnung Fehler] Mindestens eine Preiskomponente ist keine Zahl für Deal ${dealId}:`, { basePrice, floorSurcharge, kmSurcharge, floorSurchargeRate, kmRate });
          throw new Error("Fehler bei der Berechnung der Preiskomponenten.");
      }


      const netSum = basePrice + floorSurcharge + kmSurcharge;
      const vatRate = 0.19;
      const vatAmount = netSum * vatRate;
      const grossSum = netSum + vatAmount;

      const resultData = {
        // ... (Felder wie distance_km, distance_source, etc.) ...
        distance_km: distanceInKm.toFixed(1),
        distance_source: distanceSource,
        calculation_type: calculationType + sizeInfo,
        base_price: basePrice.toFixed(2), // Sicher, da basePrice jetzt immer eine Zahl sein sollte
        floor_count: floorCount,
        floor_surcharge_rate: floorSurchargeRate.toFixed(2), // Sicher
        floor_surcharge: floorSurcharge.toFixed(2), // Sicher
        km_rate: kmRate.toFixed(2), // Sicher
        km_surcharge: kmSurcharge.toFixed(2), // Sicher
        net_sum: netSum.toFixed(2), // Sicher
        vat_amount: vatAmount.toFixed(2), // Sicher
        gross_sum: grossSum.toFixed(2), // Sicher
        // ... (Restliche Felder) ...
      };

      setPianoCalculations(prev => ({ ...prev, [dealId]: { loading: false, result: resultData } }));

    } catch (error) {
      console.error(`Fehler bei Preis-Berechnung für Deal ${dealId}:`, error);
      // Zeige die spezifische Fehlermeldung im UI an
      setPianoCalculations(prev => ({ ...prev, [dealId]: { loading: false, error: error.message || "Unbekannter Fehler bei Preisberechnung" } }));
    }
  }, [
      // ... Abhängigkeiten bleiben gleich ...
      directionsService,
      PIANO_FLOOR_COUNT_FIELD_KEY,
      dealSpecificData,
      optimizedRoute,
      SCHLAILE_FIXED_ADDRESS,
      SCHLAILE_TYPE_PICKUP,
      SCHLAILE_TYPE_DELIVERY,
      OFFICE_ADDRESS
  ]);
  // --- ENDE ANGEPASST ---

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
            dealSpecificData={dealSpecificData}
            onGrandPianoSizeChange={handleGrandPianoSizeChange}
            optimizedRoute={optimizedRoute} // NEU: Route übergeben
            onDealTypeChange={handleDealTypeChange}
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