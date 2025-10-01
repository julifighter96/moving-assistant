
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { MapPin, Calendar, Truck, X, Clock, Search, ChevronRight, Globe, Milestone, Building, Home, GripVertical } from 'lucide-react';
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
      className={`p-3 rounded-lg border ${isDragging ? 'opacity-50 border-dashed' : 'border-gray-200'} 
                 ${isDraggable ? 'cursor-grab bg-white' : 'bg-primary-50'}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 flex items-center text-sm">
            <span className="truncate">{deal.title}</span>
            {objectIcon}
            {/* Schlaile Indikator */}
            {deal.schlaileType && (
              <span title={`Schlaile ${deal.schlaileType}`} className="ml-2 px-1.5 py-0.5 bg-yellow-200 text-yellow-800 text-xs font-semibold rounded">
                S
              </span>
            )}
          </h3>
          
          <div className="mt-1 space-y-1 text-xs">
            {deal.moveDate && (
              <div className="flex items-center text-gray-600">
                <Calendar className="w-3 h-3 mr-1 text-primary" />
                <span>{format(parseISO(deal.moveDate), 'dd.MM.yyyy', { locale: de })}</span>
              </div>
            )}
            
            {deal.originAddress && (
              <div className="flex items-start text-gray-600">
                <MapPin className="w-3 h-3 mr-1 mt-0.5 text-green-600 flex-shrink-0" />
                <span className="truncate text-xs">{deal.originAddress}</span>
              </div>
            )}
            
            {deal.destinationAddress && (
              <div className="flex items-start text-gray-600">
                <MapPin className="w-3 h-3 mr-1 mt-0.5 text-red-600 flex-shrink-0" />
                <span className="truncate text-xs">{deal.destinationAddress}</span>
              </div>
            )}

            {deal.region && (
              <div className="flex items-center">
                <Globe className="w-3 h-3 mr-1 text-blue-500" />
                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                  {deal.region}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {!isDraggable && onRemove && (
          <button 
            onClick={() => onRemove(deal.id)}
            className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 flex-shrink-0"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

// Sortierbarer Routenpunkt Komponente
const SortableRoutePoint = ({ leg, index, onMove, stationDuration, onDurationChange, calculatedTime, tourDeals, manualOperationType, onOperationTypeChange }) => {
  const ref = React.useRef(null);
  
  const [{ isDragging: isDraggingItem }, drag] = useDrag(() => ({
    type: 'route-point',
    item: { index },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [index]);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'route-point',
    hover: (draggedItem, monitor) => {
      if (!ref.current) return;
      
      const dragIndex = draggedItem.index;
      const hoverIndex = index;

      // Nicht ersetzen, wenn es das gleiche Element ist
      if (dragIndex === hoverIndex) return;

      // Bestimme die Mitte des Elements
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // Nur nach unten bewegen, wenn die Maus unter 50% ist
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      
      // Nur nach oben bewegen, wenn die Maus über 50% ist
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      // Führe die Bewegung durch
      onMove(dragIndex, hoverIndex);
      
      // Hinweis: Wir verändern das Item hier, um mehrfache Bewegungen zu vermeiden
      draggedItem.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [index, onMove]);

  // Verbinde drag und drop refs
  drag(drop(ref));

  // Verwende den effektiven Operationstyp aus dem Leg (wurde bereits in legsWithUpdatedPianos berechnet)
  const effectiveOperationType = leg.effectiveOperationType || leg.operationType || 'intermediate';

  return (
    <div className="border-b last:border-b-0 bg-white group">
      <div
        ref={ref}
        className={`flex items-center justify-between p-3 cursor-move hover:bg-gray-50 transition-colors ${
          isDraggingItem ? 'opacity-50 border-dashed' : ''
        } ${isOver ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
      >
        <div className="flex items-center space-x-3 flex-1">
          <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
              effectiveOperationType === 'beladung' ? 'bg-blue-500 text-white' :
              effectiveOperationType === 'entladung' ? 'bg-orange-500 text-white' :
              effectiveOperationType === 'neutral' ? 'bg-purple-500 text-white' :
              leg.stopType === 'pickup' ? 'bg-blue-500 text-white' :
              leg.stopType === 'delivery' ? 'bg-orange-500 text-white' :
              'bg-gray-500 text-white'
            }`}>
              {index + 1}
            </span>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            {/* Hauptadresse (Zieladresse = Station) */}
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="font-semibold text-base truncate max-w-[300px]" title={leg.end_address}>
                {leg.end_address?.split(',')[0] ?? '?'}
              </span>
              
              {/* Operation Type Badge */}
              {effectiveOperationType && (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  effectiveOperationType === 'beladung' ? 'bg-blue-100 text-blue-800' :
                  effectiveOperationType === 'entladung' ? 'bg-orange-100 text-orange-800' :
                  effectiveOperationType === 'neutral' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {effectiveOperationType === 'beladung' ? '↑ Beladung' : 
                   effectiveOperationType === 'entladung' ? '↓ Entladung' :
                   effectiveOperationType === 'neutral' ? '↕ Be- & Entladung' : 
                   effectiveOperationType}
                </span>
              )}
              
              {/* Zeige an, wenn mehrere Deals an dieser Adresse sind */}
              {leg.consolidatedDeals && leg.consolidatedDeals.length > 1 && (
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                  {leg.consolidatedDeals.length} Deals
                </span>
              )}
              
              {/* Zeige Klavierbeladung an */}
              {effectiveOperationType && (
                <span className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 ${
                  effectiveOperationType === 'beladung' ? 'bg-green-100 text-green-800' :
                  effectiveOperationType === 'entladung' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`} title={`${leg.pianoChange || ''} Klavier(e) | Geladen: ${leg.loadedPianosAfter || 0}`}>
                  🎹 {leg.loadedPianosAfter !== undefined ? leg.loadedPianosAfter : '-'}
                  {leg.pianoChange && leg.pianoChange !== '0' && (
                    <span className="text-[10px]">({leg.pianoChange})</span>
                  )}
                </span>
              )}
            </div>
            
            {/* Optionale Info: Vollständige Adresse (klein, grau) - nur bei hover sichtbar */}
            {leg.end_address && (
              <div className="mt-0.5 text-xs text-gray-400 truncate max-w-[350px] opacity-70 group-hover:opacity-100 transition-opacity" title={leg.end_address}>
                {leg.end_address}
              </div>
            )}
            
            {/* Zeige Details der konsolidierten Deals */}
            {leg.consolidatedDeals && leg.consolidatedDeals.length > 1 && (
              <div className="mt-1 text-xs text-gray-600">
                <details className="cursor-pointer">
                  <summary className="hover:text-gray-800">Details anzeigen ({leg.consolidatedDeals.length} Deals)</summary>
                  <div className="mt-1 pl-2 space-y-1">
                    {leg.consolidatedDeals.map((deal, dealIndex) => {
                      const dealInfo = tourDeals.find(d => d.id === deal.dealId);
                      return (
                        <div key={dealIndex} className="text-xs text-gray-500">
                          • {dealInfo?.title || `Deal ${deal.dealId}`} 
                          {deal.originalAddress !== leg.end_address && (
                            <span className="text-gray-400"> (urspr. {deal.originalAddress?.split(',')[0]})</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </details>
              </div>
            )}
            
            {/* Berechnete Zeit anzeigen */}
            {calculatedTime && (
              <div className="mt-1 flex flex-col gap-1 text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-blue-600" />
                  <span className="font-medium text-blue-700">
                    Ankunft: {calculatedTime.startTime}
                  </span>
                  {calculatedTime.drivingTime > 0 && (
                    <span className="text-gray-500">({calculatedTime.drivingTime} Min. Fahrt)</span>
                  )}
                </div>
                {calculatedTime.duration > 0 && (
                  <div className="flex items-center gap-2 ml-5">
                    <span className="font-medium text-green-700">
                      Fertig: {calculatedTime.endTime}
                    </span>
                    <span className="text-gray-500">({calculatedTime.duration} Min. Arbeit)</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="text-right text-xs whitespace-nowrap ml-2">
          <div>{leg.distance?.text ?? '-'}</div>
          <div className="text-gray-500">{leg.duration?.text ?? '-'}</div>
        </div>
      </div>
      
      {/* Dauer-Eingabe und Operationstyp-Auswahl für diese Station */}
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
        <div className="flex flex-wrap items-center gap-3">
          {/* Operationstyp-Auswahl */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600">
              Typ:
            </label>
            <select
              value={manualOperationType || 'auto'}
              onChange={(e) => onOperationTypeChange(index, e.target.value)}
              className={`px-2 py-1 border rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                manualOperationType && manualOperationType !== 'auto' 
                  ? 'bg-yellow-50 border-yellow-400 font-semibold' 
                  : 'bg-white border-gray-300'
              }`}
            >
              <option value="auto">🤖 Automatisch</option>
              <option value="beladung">↑ Beladung</option>
              <option value="entladung">↓ Entladung</option>
              <option value="neutral">↕ Be- & Entladung</option>
            </select>
            {manualOperationType && manualOperationType !== 'auto' && (
              <span className="text-xs text-yellow-700 font-medium">✏️ Manuell</span>
            )}
          </div>
          
          {/* Arbeitsdauer */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Arbeitsdauer:
            </label>
            <input
              type="number"
              value={stationDuration || ''}
              onChange={(e) => onDurationChange(index, e.target.value)}
              placeholder="0"
              min="0"
              className="w-16 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-xs text-gray-500">Min.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sortierbare Routenliste Komponente
const SortableRouteList = ({ optimizedRoute, filteredLegsForDisplay, loadingRoute, onRouteReorder, stationDurations, onDurationChange, calculatedTimes, totalDuration, tourDeals, manualOperationTypes, onOperationTypeChange }) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <Milestone className="mr-2 h-5 w-5 text-primary" />
        Stationen ({filteredLegsForDisplay.length})
      </h3>
      <div className="mb-3 space-y-1">
        <p className="text-xs text-gray-500">
          Ziehen Sie die Stationen, um die Reihenfolge manuell anzupassen
        </p>
        <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
          💡 Automatik: Abholadresse = ↑ Beladung, Lieferadresse = ↓ Entladung
        </p>
      </div>
      
      {optimizedRoute && filteredLegsForDisplay.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm font-medium bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
            <span className="font-semibold text-gray-700">Tourübersicht:</span>
            <div className="text-right">
              {optimizedRoute?.legs && (
                <>
                  <div className="font-semibold">{(optimizedRoute.legs.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0) / 1000).toFixed(1)} km</div>
                  <div className="text-xs text-gray-600">{Math.round(optimizedRoute.legs.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0) / 60)} min Fahrt</div>
                  {totalDuration && (
                    <div className="text-xs text-green-700 font-semibold mt-1">
                      + Arbeit = {totalDuration} Min. gesamt
                    </div>
                  )}
                  <div className="text-xs text-blue-700 font-semibold mt-1 flex items-center justify-end gap-1">
                    🎹 Max: {Math.max(...optimizedRoute.legs.map(leg => leg.loadedPianosAfter || 0), 0)}
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden shadow-sm">
            {filteredLegsForDisplay.map((leg, index, displayedArray) => (
              <SortableRoutePoint
                key={`route-point-${index}`}
                leg={leg}
                index={index}
                onMove={onRouteReorder}
                stationDuration={stationDurations[index]}
                onDurationChange={onDurationChange}
                calculatedTime={calculatedTimes[index]}
                tourDeals={tourDeals}
                manualOperationType={manualOperationTypes[index]}
                onOperationTypeChange={onOperationTypeChange}
              />
            ))}
          </div>
        </div>
      )}
      {/* Fallback-Anzeige, wenn nach Filterung keine Legs mehr übrig sind */}
      {optimizedRoute?.legs && filteredLegsForDisplay.length === 0 && !loadingRoute && (
        <div className="text-center py-4 text-gray-500 text-sm">
          Keine gültigen Routenschritte nach Filterung gefunden.
        </div>
      )}
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
  onDealTypeChange,
  tourStartTime,
  onTourStartTimeChange,
  assignedEmployees,
  onEmployeeAdd,
  onEmployeeRemove
}) => {
  return (
    <div
      ref={drop}
      className={`bg-white p-3 rounded-xl border ${isOver ? 'border-primary border-dashed' : 'border-gray-200'} shadow-sm flex flex-col`}
    >
      <div className="mb-3">
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
          <div className="flex-1 min-w-[120px]">
            <label htmlFor="tourStartTime" className="block text-xs font-medium text-gray-500 mb-1">Startzeit</label>
            <input
              id="tourStartTime"
              type="time"
              value={tourStartTime}
              onChange={(e) => onTourStartTimeChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
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
        
        {/* Mitarbeiter für die gesamte Tour */}
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-gray-700">Mitarbeiter für diese Tour:</span>
            
            {/* Bestehende Mitarbeiter anzeigen */}
            {assignedEmployees.map((employee, index) => (
              <div key={index} className="flex items-center gap-1 bg-white px-2 py-1 rounded border text-sm">
                <span className="font-medium">{employee.name}</span>
                <button
                  onClick={() => onEmployeeRemove(index)}
                  className="text-red-500 hover:text-red-700 ml-1"
                  title="Mitarbeiter entfernen"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            
            {/* Neuen Mitarbeiter hinzufügen */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onEmployeeAdd({
                    id: e.target.value,
                    name: e.target.options[e.target.selectedIndex].text
                  });
                  e.target.value = '';
                }
              }}
              className="px-2 py-1 border border-gray-300 rounded text-sm bg-white"
              defaultValue=""
            >
              <option value="">+ Mitarbeiter hinzufügen</option>
              <option value="emp1">Max Mustermann</option>
              <option value="emp2">Anna Schmidt</option>
              <option value="emp3">Tom Weber</option>
              <option value="emp4">Lisa Müller</option>
              <option value="emp5">Peter Klein</option>
            </select>
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
          <div className="w-full space-y-3 overflow-y-auto max-h-[400px] pr-2">
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
                {assignedEmployees.length > 0 && (
                  <span className="ml-2 text-green-700">
                    • {assignedEmployees.length} Mitarbeiter zugewiesen
                  </span>
                )}
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
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [map, setMap] = useState(null);
  const [isSavingTour, setIsSavingTour] = useState(false);
  const [tourName, setTourName] = useState('');
  const [pianoCalculations, setPianoCalculations] = useState({}); // { dealId: { result: data, loading: bool, error: string } }
  // Erweitere dealSpecificData: { dealId: { size?: number, type?: 'auto' | 'piano' | 'grand_piano' } }
  const [dealSpecificData, setDealSpecificData] = useState({});
  // Mitarbeiter für die gesamte Tour: [{ id: "emp1", name: "Max Mustermann" }]
  const [assignedEmployees, setAssignedEmployees] = useState([]);
  // Startzeit der Tour
  const [tourStartTime, setTourStartTime] = useState('08:00');
  // Dauer an jeder Station: { legIndex: durationInMinutes }
  const [stationDurations, setStationDurations] = useState({});
  // Manuelle Überschreibung der Operationstypen: { legIndex: 'beladung' | 'entladung' | 'auto' }
  const [manualOperationTypes, setManualOperationTypes] = useState({});

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

  // Route neu ordnen durch Drag & Drop (SYNCHRON für flüssiges Drag & Drop)
  const handleRouteReorder = useCallback((dragIndex, hoverIndex) => {
    if (!optimizedRoute?.legs) return;
    if (dragIndex === hoverIndex) return;
    
    setOptimizedRoute(prev => {
      if (!prev?.legs) return prev;
      
      // Arbeite direkt mit den Legs (keine Filterung für bessere Performance)
      const newLegs = [...prev.legs];
      const [removed] = newLegs.splice(dragIndex, 1);
      newLegs.splice(hoverIndex, 0, removed);
      
      // Berechne die Klavieranzahl für die neu sortierte Route neu - VEREINFACHTE LOGIK
      let currentLoadedPianos = 0;
      
      const isSchlaileAddr = (addr) => addr?.includes(SCHLAILE_FIXED_ADDRESS.split(',')[0]);
      const isOfficeAddr = (addr) => addr?.includes(OFFICE_ADDRESS.split(',')[0]);
      
      newLegs.forEach((leg, index) => {
        leg.loadedPianosBefore = currentLoadedPianos;
        
        const startAddr = leg.start_address;
        const endAddr = leg.end_address;
        
        let changeCount = 0;
        
        // Schlaile - kann mehrere Klaviere auf einmal haben
        if (isSchlaileAddr(endAddr)) {
          if (leg.consolidatedDeals && leg.consolidatedDeals.length > 0) {
            const deliveryDeals = leg.consolidatedDeals.filter(d => d.type === 'delivery_from_schlaile');
            const pickupDeals = leg.consolidatedDeals.filter(d => d.type === 'pickup_to_schlaile');
            
            if (deliveryDeals.length > 0) {
              changeCount = deliveryDeals.length;
              currentLoadedPianos += changeCount;
              leg.pianoChange = `+${changeCount}`;
              leg.operationType = 'beladung';
            } else if (pickupDeals.length > 0) {
              changeCount = pickupDeals.length;
              currentLoadedPianos -= changeCount;
              leg.pianoChange = `-${changeCount}`;
              leg.operationType = 'entladung';
            }
          } else {
            // Einzelne Fahrt zu Schlaile ohne consolidatedDeals
            if (currentLoadedPianos > 0 || leg.operationType === 'entladung') {
              changeCount = 1;
              currentLoadedPianos -= changeCount;
              leg.pianoChange = `-${changeCount}`;
              leg.operationType = 'entladung';
            } else if (leg.operationType === 'beladung') {
              changeCount = 1;
              currentLoadedPianos += changeCount;
              leg.pianoChange = `+${changeCount}`;
              leg.operationType = 'beladung';
            }
          }
          leg.loadedPianosAfter = currentLoadedPianos;
          return;
        }
        
        // Von Schlaile weg = Entladung - aber nicht zum Office
        if (isSchlaileAddr(startAddr) && !isSchlaileAddr(endAddr) && !isOfficeAddr(endAddr)) {
          changeCount = leg.consolidatedDeals ? leg.consolidatedDeals.length : 1;
          currentLoadedPianos -= changeCount;
          leg.pianoChange = `-${changeCount}`;
          leg.operationType = 'entladung';
          leg.loadedPianosAfter = currentLoadedPianos;
          return;
        }
        
        // Zum/Vom Office = Keine Be-/Entladung
        if (isOfficeAddr(startAddr) || isOfficeAddr(endAddr)) {
          leg.pianoChange = '0';
          leg.loadedPianosAfter = currentLoadedPianos;
          return;
        }
        
        // Normale Adressen - Origin = Beladung, Destination = Entladung
        if (leg.consolidatedDeals && leg.consolidatedDeals.length > 0) {
          const loadingDeals = leg.consolidatedDeals.filter(d => 
            d.type === 'normal_origin' || d.type === 'pickup_to_schlaile'
          );
          const unloadingDeals = leg.consolidatedDeals.filter(d => 
            d.type === 'normal_dest' || d.type === 'delivery_from_schlaile'
          );
          
          if (loadingDeals.length > 0) {
            changeCount = loadingDeals.length;
            currentLoadedPianos += changeCount;
            leg.pianoChange = `+${changeCount}`;
            leg.operationType = 'beladung';
          } else if (unloadingDeals.length > 0) {
            changeCount = unloadingDeals.length;
            currentLoadedPianos -= changeCount;
            leg.pianoChange = `-${changeCount}`;
            leg.operationType = 'entladung';
          }
        } else {
          // Fallback: Nutze vorhandenen operationType
          changeCount = 1;
          if (leg.operationType === 'beladung') {
            currentLoadedPianos += changeCount;
            leg.pianoChange = `+${changeCount}`;
          } else if (leg.operationType === 'entladung') {
            currentLoadedPianos -= changeCount;
            leg.pianoChange = `-${changeCount}`;
          } else {
            leg.pianoChange = '0';
          }
        }
        
        leg.loadedPianosAfter = currentLoadedPianos;
      });
      
      return {
        ...prev,
        legs: newLegs
      };
    });
  }, [optimizedRoute, SCHLAILE_FIXED_ADDRESS, OFFICE_ADDRESS]);

  // Hilfsfunktion zum Aktualisieren der tourDeals Reihenfolge
  const updateTourDealsOrder = useCallback((newSequence) => {
    if (!newSequence || newSequence.length <= 2) return; // Nur Start und Ende
    
    // Erstelle eine Map von Adressen zu Deals
    const addressToDealMap = new Map();
    tourDeals.forEach(deal => {
      if (deal.originAddress && !deal.originAddress.includes(OFFICE_ADDRESS.split(',')[0])) {
        addressToDealMap.set(deal.originAddress, deal);
      }
      if (deal.destinationAddress && !deal.destinationAddress.includes(OFFICE_ADDRESS.split(',')[0])) {
        addressToDealMap.set(deal.destinationAddress, deal);
      }
    });
    
    // Erstelle neue Reihenfolge basierend auf der Sequenz
    const newTourDealsOrder = [];
    const processedDeals = new Set();
    
    newSequence.forEach(address => {
      if (address === OFFICE_ADDRESS || address === SCHLAILE_FIXED_ADDRESS) return;
      
      const deal = addressToDealMap.get(address);
      if (deal && !processedDeals.has(deal.id)) {
        newTourDealsOrder.push(deal);
        processedDeals.add(deal.id);
      }
    });
    
    // Füge alle nicht verarbeiteten Deals am Ende hinzu (falls welche fehlen)
    tourDeals.forEach(deal => {
      if (!processedDeals.has(deal.id)) {
        newTourDealsOrder.push(deal);
      }
    });
    
    // Aktualisiere nur wenn sich die Reihenfolge geändert hat
    if (JSON.stringify(newTourDealsOrder.map(d => d.id)) !== JSON.stringify(tourDeals.map(d => d.id))) {
      setTourDeals(newTourDealsOrder);
    }
  }, [tourDeals, OFFICE_ADDRESS, SCHLAILE_FIXED_ADDRESS]);

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

  }, [optimizedRoute, SCHLAILE_FIXED_ADDRESS]); // Abhängigkeit von optimizedRoute
  // --- ENDE NEU ---

  // Mitarbeiter zur Tour hinzufügen
  const handleEmployeeAdd = useCallback((employee) => {
    setAssignedEmployees(prev => [...prev, employee]);
  }, []);

  // Mitarbeiter von der Tour entfernen
  const handleEmployeeRemove = useCallback((index) => {
    setAssignedEmployees(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Dauer an einer Station ändern
  const handleDurationChange = useCallback((legIndex, durationValue) => {
    const duration = durationValue === '' ? 0 : parseInt(durationValue, 10);
    setStationDurations(prev => ({
      ...prev,
      [legIndex]: isNaN(duration) ? 0 : duration
    }));
  }, []);

  // Operationstyp einer Station manuell ändern
  const handleOperationTypeChange = useCallback((legIndex, operationType) => {
    setManualOperationTypes(prev => ({
      ...prev,
      [legIndex]: operationType
    }));
  }, []);

  // Berechne die Klavierbeladung dynamisch - VEREINFACHTE LOGIK
  const legsWithUpdatedPianos = useMemo(() => {
    if (!filteredLegsForDisplay || filteredLegsForDisplay.length === 0) {
      return [];
    }

    const updatedLegs = filteredLegsForDisplay.map((leg, index) => {
      // Bestimme den effektiven Operationstyp
      const manualType = manualOperationTypes[index];
      const effectiveType = (manualType && manualType !== 'auto') ? manualType : leg.operationType;
      
      return {
        ...leg,
        effectiveOperationType: effectiveType
      };
    });

    // Berechne die Klavieranzahl neu
    let currentLoadedPianos = 0;
    
    console.log('[Klavierberechnung] === START ===');
    console.log('[Klavierberechnung] Anzahl Legs:', updatedLegs.length);
    updatedLegs.forEach((leg, i) => {
      console.log(`[Klavierberechnung] Leg ${i} hat consolidatedDeals:`, leg.consolidatedDeals?.length || 0, leg.consolidatedDeals);
    });
    
    // Hilfsfunktion: Ist Adresse Schlaile?
    const isSchlaileAddr = (addr) => addr?.includes(SCHLAILE_FIXED_ADDRESS.split(',')[0]);
    // Hilfsfunktion: Ist Adresse Office?
    const isOfficeAddr = (addr) => addr?.includes(OFFICE_ADDRESS.split(',')[0]);
    
    updatedLegs.forEach((leg, index) => {
      leg.loadedPianosBefore = currentLoadedPianos;
      
      const startAddr = leg.start_address;
      const endAddr = leg.end_address;
      const effectiveType = leg.effectiveOperationType;
      
      console.log(`[Klavierberechnung] Leg ${index}: ${startAddr?.split(',')[0]} → ${endAddr?.split(',')[0]}`);
      
      let changeCount = 0;
      
      // REGEL 1: Schlaile - kann mehrere Klaviere auf einmal haben
      if (isSchlaileAddr(endAddr)) {
        // Bei Schlaile ankommen
        console.log(`  → Schlaile erkannt, consolidatedDeals:`, leg.consolidatedDeals);
        if (leg.consolidatedDeals && leg.consolidatedDeals.length > 0) {
          // Zähle alle Deals an dieser Schlaile-Station
          const deliveryDeals = leg.consolidatedDeals.filter(d => d.type === 'delivery_from_schlaile');
          const pickupDeals = leg.consolidatedDeals.filter(d => d.type === 'pickup_to_schlaile');
          console.log(`  → deliveryDeals: ${deliveryDeals.length}, pickupDeals: ${pickupDeals.length}`);
          
          if (deliveryDeals.length > 0) {
            // Beladung von Schlaile für spätere Lieferungen
            changeCount = deliveryDeals.length;
            currentLoadedPianos += changeCount;
            leg.pianoChange = `+${changeCount}`;
            leg.effectiveOperationType = 'beladung';
            console.log(`  → Schlaile Beladung: +${changeCount}, Gesamt: ${currentLoadedPianos}`);
          } else if (pickupDeals.length > 0) {
            // Entladung bei Schlaile (Klaviere wurden vorher beim Kunden abgeholt)
            changeCount = pickupDeals.length;
            currentLoadedPianos -= changeCount;
            leg.pianoChange = `-${changeCount}`;
            leg.effectiveOperationType = 'entladung';
            console.log(`  → Schlaile Entladung: -${changeCount}, Rest: ${currentLoadedPianos}`);
          }
        } else {
          // Einzelne Fahrt zu Schlaile ohne consolidatedDeals
          // Wenn wir Klaviere geladen haben, werden sie bei Schlaile entladen
          if (currentLoadedPianos > 0 || effectiveType === 'entladung') {
            changeCount = 1;
            currentLoadedPianos -= changeCount;
            leg.pianoChange = `-${changeCount}`;
            leg.effectiveOperationType = 'entladung';
            console.log(`  → Schlaile Entladung (einzeln): -${changeCount}, Rest: ${currentLoadedPianos}`);
          } else if (effectiveType === 'beladung') {
            // Beladung bei Schlaile
            changeCount = 1;
            currentLoadedPianos += changeCount;
            leg.pianoChange = `+${changeCount}`;
            leg.effectiveOperationType = 'beladung';
            console.log(`  → Schlaile Beladung (einzeln): +${changeCount}, Gesamt: ${currentLoadedPianos}`);
          }
        }
        leg.loadedPianosAfter = currentLoadedPianos;
        return;
      }
      
      // REGEL 2: Von Schlaile weg = Lieferung (Entladung) - aber nicht zum Office
      if (isSchlaileAddr(startAddr) && !isSchlaileAddr(endAddr) && !isOfficeAddr(endAddr)) {
        changeCount = leg.consolidatedDeals ? leg.consolidatedDeals.length : 1;
        currentLoadedPianos -= changeCount;
        leg.pianoChange = `-${changeCount}`;
        leg.effectiveOperationType = 'entladung';
        leg.loadedPianosAfter = currentLoadedPianos;
        console.log(`  → Von Schlaile weg (Lieferung): -${changeCount}, Rest: ${currentLoadedPianos}`);
        return;
      }
      
      // REGEL 3: Zum/Vom Office = Keine Be-/Entladung
      if (isOfficeAddr(startAddr) || isOfficeAddr(endAddr)) {
        leg.pianoChange = '0';
        leg.loadedPianosAfter = currentLoadedPianos;
        console.log(`  → Office-Leg: Keine Änderung`);
        return;
      }
      
      // REGEL 4: Normale Adressen - Origin = Beladung, Destination = Entladung
      // Prüfe die consolidatedDeals um den Typ zu bestimmen
      if (leg.consolidatedDeals && leg.consolidatedDeals.length > 0) {
        // Zähle Beladungen (origin) und Entladungen (destination)
        const loadingDeals = leg.consolidatedDeals.filter(d => 
          d.type === 'normal_origin' || d.type === 'pickup_to_schlaile'
        );
        const unloadingDeals = leg.consolidatedDeals.filter(d => 
          d.type === 'normal_dest' || d.type === 'delivery_from_schlaile'
        );
        
        if (loadingDeals.length > 0) {
          // Beladung
          changeCount = loadingDeals.length;
          currentLoadedPianos += changeCount;
          leg.pianoChange = `+${changeCount}`;
          leg.effectiveOperationType = 'beladung';
          console.log(`  → Beladung: +${changeCount}, Gesamt: ${currentLoadedPianos}`);
        } else if (unloadingDeals.length > 0) {
          // Entladung
          changeCount = unloadingDeals.length;
          currentLoadedPianos -= changeCount;
          leg.pianoChange = `-${changeCount}`;
          leg.effectiveOperationType = 'entladung';
          console.log(`  → Entladung: -${changeCount}, Rest: ${currentLoadedPianos}`);
        }
      } else {
        // Fallback: Nutze den effectiveOperationType
        changeCount = 1;
        if (effectiveType === 'beladung') {
          currentLoadedPianos += changeCount;
          leg.pianoChange = `+${changeCount}`;
          console.log(`  → Beladung (effectiveType): +${changeCount}, Gesamt: ${currentLoadedPianos}`);
        } else if (effectiveType === 'entladung') {
          currentLoadedPianos -= changeCount;
          leg.pianoChange = `-${changeCount}`;
          console.log(`  → Entladung (effectiveType): -${changeCount}, Rest: ${currentLoadedPianos}`);
        } else {
          leg.pianoChange = '0';
          console.log(`  → Unbekannt: 0`);
        }
      }
      
      leg.loadedPianosAfter = currentLoadedPianos;
    });

    console.log('[Klavierberechnung] === ENDE ===');
    return updatedLegs;
  }, [filteredLegsForDisplay, manualOperationTypes, SCHLAILE_FIXED_ADDRESS, OFFICE_ADDRESS]);

  // Berechne die Zeiten für jede Station
  const calculatedTimes = useMemo(() => {
    if (!optimizedRoute?.legs || !tourStartTime || legsWithUpdatedPianos.length === 0) {
      return {};
    }

    const times = {};
    let currentTime = tourStartTime; // Format: "HH:MM"
    
    // Hilfsfunktion zum Hinzufügen von Minuten zu einer Zeit
    const addMinutes = (time, minutes) => {
      const [hours, mins] = time.split(':').map(Number);
      const totalMinutes = hours * 60 + mins + minutes;
      const newHours = Math.floor(totalMinutes / 60) % 24;
      const newMins = totalMinutes % 60;
      return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
    };

    legsWithUpdatedPianos.forEach((leg, index) => {
      const drivingTimeMinutes = leg.duration?.value ? Math.round(leg.duration.value / 60) : 0;
      const stationDuration = stationDurations[index] || 0;
      
      // KORRIGIERT: Zuerst fahren (Fahrtzeit addieren)
      currentTime = addMinutes(currentTime, drivingTimeMinutes);
      
      // Startzeit der Station = Ankunftszeit (nach Fahrt)
      const startTime = currentTime;
      
      // Arbeitszeit an der Station hinzufügen
      currentTime = addMinutes(currentTime, stationDuration);
      
      // Endzeit der Station = nach Arbeitszeit
      const endTime = currentTime;
      
      times[index] = {
        startTime: startTime, // Ankunftszeit an der Station
        endTime: endTime, // Fertigstellungszeit an der Station
        duration: stationDuration, // Arbeitsdauer an der Station
        drivingTime: drivingTimeMinutes // Fahrtzeit zu dieser Station
      };
    });

    return times;
  }, [optimizedRoute, tourStartTime, stationDurations, legsWithUpdatedPianos]);

  // Berechne die Gesamtdauer der Tour
  const totalTourDuration = useMemo(() => {
    if (!optimizedRoute?.legs || legsWithUpdatedPianos.length === 0) {
      return null;
    }

    // Summe aller Fahrtzeiten
    const totalDrivingTime = legsWithUpdatedPianos.reduce((sum, leg) => {
      return sum + (leg.duration?.value ? Math.round(leg.duration.value / 60) : 0);
    }, 0);

    // Summe aller Stationsdauern
    const totalStationTime = Object.values(stationDurations).reduce((sum, duration) => sum + (duration || 0), 0);

    return totalDrivingTime + totalStationTime;
  }, [optimizedRoute, stationDurations, legsWithUpdatedPianos]);

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

    // Erstelle eine Sequenz-Information basierend auf der aktuellen Reihenfolge
    const tourSequence = tourDeals.map((deal, index) => ({
      order: index + 1,
      dealId: deal.id,
      title: deal.title,
      address: deal.originAddress || deal.destinationAddress || 'Adresse unbekannt'
    }));

    // Erstelle Mitarbeiter-Information für die Tour
    const employeeInfo = assignedEmployees.map(emp => ({
      id: emp.id,
      name: emp.name
    }));

    // Erstelle Zeitinformationen für jede Station
    const stationTimeInfo = Object.entries(calculatedTimes).map(([index, time]) => {
      const legIndex = parseInt(index);
      const leg = legsWithUpdatedPianos[legIndex];
      
      // Versuche, die Deal-Informationen zu finden
      let stationDescription = 'Unbekannte Station';
      if (leg) {
        // Verwende die end_address als Ziel (da die Arbeitszeit dort stattfindet)
        stationDescription = leg.end_address?.split(',')[0] || 'Unbekannte Adresse';
        
        // Wenn consolidatedDeals vorhanden, füge Deal-Titel hinzu
        if (leg.consolidatedDeals && leg.consolidatedDeals.length > 0) {
          const dealTitles = leg.consolidatedDeals.map(cd => {
            const deal = tourDeals.find(d => d.id === cd.dealId);
            return deal ? deal.title : `Deal ${cd.dealId}`;
          }).join(', ');
          stationDescription = `${stationDescription} (${dealTitles})`;
        }
      }
      
      return {
        legIndex,
        legDescription: stationDescription,
        startTime: time.startTime, // Ankunftszeit
        endTime: time.endTime, // Fertigstellungszeit
        duration: time.duration, // Arbeitsdauer
        drivingTime: time.drivingTime // Fahrtzeit
      };
    });

    const updatePromises = tourDeals.map(async (deal, index) => {
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
        // Füge Reihenfolge-Information hinzu (falls ein entsprechendes Feld existiert)
        // tour_sequence: JSON.stringify(tourSequence), // Optional: Falls ein Feld für die Sequenz existiert
      };

      try {
        const response = await axios.put(
          `${apiUrl}/projects/${projectId}?api_token=${apiToken}`,
          updateData
        );
        if (response.data && response.data.success) {
          successCount++;
          console.log(`Projekt ${projectId} (${deal.title}) erfolgreich aktualisiert - Position ${index + 1} in der Tour`);
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

    // Zeige die gespeicherte Reihenfolge und Mitarbeiter-Zuweisungen in der Erfolgsmeldung
    const sequenceInfo = tourSequence.map(item => `${item.order}. ${item.title}`).join('\n');
    
    let employeeInfoText = '';
    if (employeeInfo.length > 0) {
      employeeInfoText = '\n\nMitarbeiter für diese Tour:\n' + 
        employeeInfo.map(emp => `  - ${emp.name}`).join('\n');
    }
    
    let timeInfoText = '';
    if (stationTimeInfo.length > 0 && tourStartTime) {
      timeInfoText = '\n\nZeitplan (Tour-Start: ' + tourStartTime + '):\n' + 
        stationTimeInfo.map(station => {
          let stationText = `${station.legDescription}:\n  `;
          stationText += `→ Ankunft: ${station.startTime}`;
          if (station.drivingTime > 0) {
            stationText += ` (${station.drivingTime} Min. Fahrt)`;
          }
          if (station.duration > 0) {
            stationText += `\n  → Fertig: ${station.endTime} (${station.duration} Min. Arbeit)`;
          }
          return stationText;
        }).join('\n\n');
      
      if (totalTourDuration) {
        timeInfoText += `\n\n===================\nGesamtdauer (Fahrt + Arbeit): ${totalTourDuration} Min.`;
      }
    }
    
    if (errorCount === 0) {
      alert(`Tour "${finalTourId}" für ${tourDateFormatted} gespeichert!\n\nReihenfolge:\n${sequenceInfo}${employeeInfoText}${timeInfoText}\n\n${successCount} Projekte erfolgreich aktualisiert.`);
    } else {
      alert(`Tour "${finalTourId}" für ${tourDateFormatted} gespeichert!\n\nReihenfolge:\n${sequenceInfo}${employeeInfoText}${timeInfoText}\n\n${successCount} Projekte aktualisiert, ${errorCount} Fehler aufgetreten. Details siehe Konsole.`);
    }
  }, [selectedDate, tourDeals, tourName, TARGET_PHASE_ID, PROJECT_TOUR_DATE_FIELD_KEY, PROJECT_TOUR_ID_FIELD_KEY, assignedEmployees, optimizedRoute, calculatedTimes, tourStartTime, totalTourDuration, legsWithUpdatedPianos]);

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
      const addressConsolidation = new Map(); // Map für Adressen-Zusammenfassung

      // Hilfsfunktion zum Normalisieren von Adressen für Vergleich
      const normalizeAddress = (address) => {
        if (!address) return '';
        return address.toLowerCase()
          .replace(/\s+/g, ' ') // Mehrfache Leerzeichen zu einem
          .replace(/[.,]/g, '') // Punkte und Kommas entfernen
          .trim();
      };

      // Hilfsfunktion zum Finden ähnlicher Adressen
      const findSimilarAddress = (newAddress, existingAddresses, dealType) => {
        const normalizedNew = normalizeAddress(newAddress);
        
        // Spezielle Behandlung für Schlaile-Adressen: Diese sollen IMMER konsolidiert werden
        if (newAddress === SCHLAILE_FIXED_ADDRESS) {
          for (const existing of existingAddresses) {
            if (existing === SCHLAILE_FIXED_ADDRESS) {
              return existing;
            }
          }
          return null; // Erste Schlaile-Adresse
        }
        
        // Für normale Adressen: Prüfe auf exakte Übereinstimmung oder sehr ähnliche Adressen
        for (const existing of existingAddresses) {
          const normalizedExisting = normalizeAddress(existing);
          // Prüfe auf exakte Übereinstimmung oder sehr ähnliche Adressen
          if (normalizedNew === normalizedExisting || 
              normalizedNew.includes(normalizedExisting.split(' ')[0]) ||
              normalizedExisting.includes(normalizedNew.split(' ')[0])) {
            return existing;
          }
        }
        return null;
      };

      tourDeals.forEach(deal => {
        const isSchlailePickup = deal.schlaileType === SCHLAILE_TYPE_PICKUP;
        const isSchlaileDelivery = deal.schlaileType === SCHLAILE_TYPE_DELIVERY;

        const origin = deal.originAddress;
        const destination = deal.destinationAddress;

        // Nur gültige Adressen hinzufügen
        const isValidAddress = (addr) => typeof addr === 'string' && addr.trim().length > 3;

        if (isSchlailePickup) {
          if (isValidAddress(origin)) {
            // Prüfe auf ähnliche Adressen
            const similarAddress = findSimilarAddress(origin, Array.from(customerAddresses), 'pickup_to_schlaile');
            const addressToUse = similarAddress || origin;
            
            if (similarAddress) {
              // Konsolidiere mit bestehender Adresse
              addressConsolidation.set(origin, similarAddress);
              console.log(`[Adress-Konsolidierung] ${origin} → ${similarAddress}`);
            } else {
              customerAddresses.add(origin);
            }
            
            if (!addressToDealInfo.has(addressToUse)) addressToDealInfo.set(addressToUse, []);
            addressToDealInfo.get(addressToUse).push({ dealId: deal.id, type: 'pickup_to_schlaile', originalAddress: origin });
          } else {
             console.warn(`Ungültige Origin-Adresse für Schlaile Pickup Deal ${deal.id}`);
          }
        } else if (isSchlaileDelivery) {
          if (isValidAddress(destination)) {
            // Prüfe auf ähnliche Adressen
            const similarAddress = findSimilarAddress(destination, Array.from(customerAddresses), 'delivery_from_schlaile');
            const addressToUse = similarAddress || destination;
            
            if (similarAddress) {
              // Konsolidiere mit bestehender Adresse
              addressConsolidation.set(destination, similarAddress);
              console.log(`[Adress-Konsolidierung] ${destination} → ${similarAddress}`);
            } else {
              customerAddresses.add(destination);
            }
            
            if (!addressToDealInfo.has(addressToUse)) addressToDealInfo.set(addressToUse, []);
            addressToDealInfo.get(addressToUse).push({ dealId: deal.id, type: 'delivery_from_schlaile', originalAddress: destination });
          } else {
             console.warn(`Ungültige Destination-Adresse für Schlaile Delivery Deal ${deal.id}`);
          }
        } else {
          // Normaler Umzug
          if (isValidAddress(origin)) {
            // Prüfe auf ähnliche Adressen
            const similarAddress = findSimilarAddress(origin, Array.from(customerAddresses), 'normal_origin');
            const addressToUse = similarAddress || origin;
            
            if (similarAddress) {
              // Konsolidiere mit bestehender Adresse
              addressConsolidation.set(origin, similarAddress);
              console.log(`[Adress-Konsolidierung] ${origin} → ${similarAddress}`);
            } else {
              customerAddresses.add(origin);
            }
            
            if (!addressToDealInfo.has(addressToUse)) addressToDealInfo.set(addressToUse, []);
            addressToDealInfo.get(addressToUse).push({ dealId: deal.id, type: 'normal_origin', originalAddress: origin });
          } else {
             console.warn(`Ungültige Origin-Adresse für normalen Deal ${deal.id}`);
          }
          if (isValidAddress(destination)) {
            // Prüfe auf ähnliche Adressen
            const similarAddress = findSimilarAddress(destination, Array.from(customerAddresses), 'normal_dest');
            const addressToUse = similarAddress || destination;
            
            if (similarAddress) {
              // Konsolidiere mit bestehender Adresse
              addressConsolidation.set(destination, similarAddress);
              console.log(`[Adress-Konsolidierung] ${destination} → ${similarAddress}`);
            } else {
              customerAddresses.add(destination);
            }
            
            if (!addressToDealInfo.has(addressToUse)) addressToDealInfo.set(addressToUse, []);
            addressToDealInfo.get(addressToUse).push({ dealId: deal.id, type: 'normal_dest', originalAddress: destination });
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

      // --- STUFE 2: Logische Sequenz mit Schlaile erstellen (OPTIMIERT) ---
      console.log('[Route-Optimierung] Schlaile-Strategie: Beladung ZUERST, Entladung ZULETZT');
      
      let finalSequence = [OFFICE_ADDRESS];
      let visitedAddressesForDeal = new Map();

      // Kategorisiere alle Adressen nach Typ
      const schlailePickupAddresses = []; // Adressen für pickup_to_schlaile (Kunde → Schlaile)
      const schlaileDeliveryAddresses = []; // Adressen für delivery_from_schlaile (Schlaile → Kunde)
      const normalAddresses = []; // Normale Umzüge
      
      optimizedCustomerOrder.forEach(customerAddress => {
        const dealInfos = addressToDealInfo.get(customerAddress) || [];
        dealInfos.forEach(info => {
          const visitKey = `${info.dealId}-${info.type}`;
          if (visitedAddressesForDeal.has(visitKey)) return;
          
          if (info.type === 'delivery_from_schlaile') {
            schlaileDeliveryAddresses.push({ address: customerAddress, info: info });
            visitedAddressesForDeal.set(visitKey, true);
          } else if (info.type === 'pickup_to_schlaile') {
            schlailePickupAddresses.push({ address: customerAddress, info: info });
            visitedAddressesForDeal.set(visitKey, true);
          } else {
            normalAddresses.push({ address: customerAddress, info: info });
            visitedAddressesForDeal.set(visitKey, true);
          }
        });
      });

      // STRATEGIE: Schlaile-Beladung ZUERST, Schlaile-Entladung ZULETZT
      
      // 1. Wenn es Schlaile-Lieferungen gibt (delivery_from_schlaile):
      //    → Schlaile als ERSTES besuchen, beladen, dann alle Lieferadressen
      if (schlaileDeliveryAddresses.length > 0) {
        console.log(`[Schlaile-Beladung ZUERST] ${schlaileDeliveryAddresses.length} Lieferung(en) von Schlaile`);
        finalSequence.push(SCHLAILE_FIXED_ADDRESS); // Schlaile ZUERST
        // Füge alle Lieferadressen hinzu
        schlaileDeliveryAddresses.forEach(item => {
          finalSequence.push(item.address);
        });
      }

      // 2. Füge normale Adressen in der Mitte hinzu (Pickups vor Deliveries)
      const normalPickups = normalAddresses.filter(item => item.info.type === 'normal_origin');
      const normalDeliveries = normalAddresses.filter(item => item.info.type === 'normal_dest');
      
      // Füge zuerst alle Pickups hinzu
      normalPickups.forEach(item => {
        finalSequence.push(item.address);
      });
      
      // Dann alle Deliveries
      normalDeliveries.forEach(item => {
        finalSequence.push(item.address);
      });

      // 3. Wenn es Schlaile-Abholungen gibt (pickup_to_schlaile):
      //    → Alle Abholadressen ZUERST besuchen, dann Schlaile als LETZTES
      if (schlailePickupAddresses.length > 0) {
        console.log(`[Schlaile-Entladung ZULETZT] ${schlailePickupAddresses.length} Abholung(en) zu Schlaile`);
        // Füge alle Abholadressen hinzu
        schlailePickupAddresses.forEach(item => {
          finalSequence.push(item.address);
        });
        finalSequence.push(SCHLAILE_FIXED_ADDRESS); // Schlaile ZULETZT
      }

      // 4. Rückkehr zum Büro
      if (finalSequence[finalSequence.length - 1] !== OFFICE_ADDRESS) {
         finalSequence.push(OFFICE_ADDRESS);
      }

      // Entferne Duplikate (falls vorhanden)
      finalSequence = finalSequence.filter((addr, index, self) => index === 0 || addr !== self[index - 1]);
      
      console.log('[Route-Sequenz]', finalSequence.map(addr => addr.split(',')[0]));

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

      // Erweiterte stopType Zuordnung basierend auf finalSequence und addressToDealInfo
      finalRouteResult.legs.forEach((leg, index) => {
          leg.stopType = 'intermediate'; // Platzhalter
          const startAddr = finalSequence[index];
          const endAddr = finalSequence[index + 1];

          // Zuerst: Bestimme die operationType basierend auf der Zieladresse
          if (endAddr === OFFICE_ADDRESS) {
              leg.stopType = 'office_return';
              // Keine operationType für Rückkehr zum Büro
          } else if (startAddr === SCHLAILE_FIXED_ADDRESS && endAddr !== SCHLAILE_FIXED_ADDRESS) {
              // Von Schlaile weg = Entladung (Lieferung)
              leg.stopType = 'delivery';
              leg.operationType = 'entladung';
              // Setze consolidatedDeals für Schlaile-Lieferungen
              const dealInfo = addressToDealInfo.get(endAddr);
              if (dealInfo && dealInfo.length > 0) {
                  leg.consolidatedDeals = dealInfo.map(info => ({
                      dealId: info.dealId,
                      type: info.type,
                      originalAddress: info.originalAddress
                  }));
              }
          } else if (endAddr === SCHLAILE_FIXED_ADDRESS && startAddr !== OFFICE_ADDRESS) {
              // Zu Schlaile hin (nicht vom Office) = Entladung bei Schlaile
              leg.stopType = 'pickup';
              leg.operationType = 'entladung';
              // Setze consolidatedDeals für Schlaile-Abholungen
              const dealInfo = addressToDealInfo.get(startAddr);
              if (dealInfo && dealInfo.length > 0) {
                  const pickupDeals = dealInfo.filter(info => info.type === 'pickup_to_schlaile');
                  if (pickupDeals.length > 0) {
                      leg.consolidatedDeals = pickupDeals.map(info => ({
                          dealId: info.dealId,
                          type: info.type,
                          originalAddress: info.originalAddress
                      }));
                  }
              }
          } else if (endAddr === SCHLAILE_FIXED_ADDRESS && startAddr === OFFICE_ADDRESS) {
              // Vom Office zu Schlaile = Beladung bei Schlaile
              leg.stopType = 'pickup';
              leg.operationType = 'beladung';
              // Sammle ALLE delivery_from_schlaile Deals für diesen Schlaile-Besuch
              const allSchlaileDeliveries = [];
              addressToDealInfo.forEach((dealInfos, address) => {
                  dealInfos.forEach(info => {
                      if (info.type === 'delivery_from_schlaile') {
                          allSchlaileDeliveries.push({
                              dealId: info.dealId,
                              type: info.type,
                              originalAddress: info.originalAddress
                          });
                      }
                  });
              });
              if (allSchlaileDeliveries.length > 0) {
                  leg.consolidatedDeals = allSchlaileDeliveries;
              }
          } else {
                // Normale Kundenadressen - prüfe ob es sich um Abholung oder Lieferung handelt
                const dealInfo = addressToDealInfo.get(endAddr);
                if (dealInfo && dealInfo.length > 0) {
                    const dealType = dealInfo[0].type;
                    
                    // Speichere konsolidierte Deals für die UI
                    leg.consolidatedDeals = dealInfo.map(info => ({
                      dealId: info.dealId,
                      type: info.type,
                      originalAddress: info.originalAddress
                    }));
                    
                    // KORRIGIERTE LOGIK: 
                    // - normal_origin und pickup_to_schlaile = BELADUNG (erste Adresse des Auftrags)
                    // - normal_dest und delivery_from_schlaile = ENTLADUNG (zweite Adresse des Auftrags)
                    if (dealType === 'pickup_to_schlaile' || dealType === 'normal_origin') {
                        leg.stopType = 'pickup';
                        leg.operationType = 'beladung'; // Erste Adresse = Beladung
                    } else if (dealType === 'delivery_from_schlaile' || dealType === 'normal_dest') {
                        leg.stopType = 'delivery';
                        leg.operationType = 'entladung'; // Zweite Adresse = Entladung
                    }
                } else {
                    // Fallback: Wenn keine Deal-Info vorhanden ist, verwende die Reihenfolge basierend auf der Adresse
                    // Prüfe ob die Adresse in den tourDeals als origin oder destination vorkommt
                    const dealWithOrigin = tourDeals.find(deal => deal.originAddress === endAddr);
                    const dealWithDestination = tourDeals.find(deal => deal.destinationAddress === endAddr);
                    
                    if (dealWithOrigin) {
                        // Wenn die End-Adresse als Origin-Adresse eines Deals gefunden wird = Beladung
                        leg.operationType = 'beladung';
                        leg.stopType = 'pickup';
                    } else if (dealWithDestination) {
                        // Wenn die End-Adresse als Destination-Adresse eines Deals gefunden wird = Entladung
                        leg.operationType = 'entladung';
                        leg.stopType = 'delivery';
                    } else {
                        // Letzter Fallback: Verwende Index-basierte Logik
                        const currentIndex = finalRouteResult.legs.indexOf(leg);
                        const isEvenIndex = currentIndex % 2 === 0;
                        
                        if (isEvenIndex) {
                            leg.operationType = 'beladung';
                            leg.stopType = 'pickup';
                        } else {
                            leg.operationType = 'entladung';
                            leg.stopType = 'delivery';
                        }
                    }
                }
          }
          
          // Setze visuelle Marker für Büro-Start (überschreibt operationType NICHT)
          if (startAddr === OFFICE_ADDRESS) {
              leg.stopType = 'office_start';
          }
      });

      // Berechne die Anzahl der geladenen Klaviere für jeden Leg
      let currentLoadedPianos = 0;
      
      // Zuerst: Finde heraus, wie viele Klaviere bei Schlaile geladen/entladen werden
      let schlaileLoadCount = 0; // Klaviere, die VON Schlaile zum Kunden geliefert werden (delivery_from_schlaile)
      let schlaileUnloadCount = 0; // Klaviere, die ZU Schlaile gebracht werden (pickup_to_schlaile)
      let schlaileLoadIndex = -1;
      let schlaileIsFirstStop = false;
      
      for (let i = 0; i < finalRouteResult.legs.length; i++) {
          const startAddr = finalSequence[i];
          const endAddr = finalSequence[i + 1];
          
          // Fall 1: Wenn wir BEI Schlaile ankommen (Ziel ist Schlaile)
          if (endAddr === SCHLAILE_FIXED_ADDRESS) {
              schlaileLoadIndex = i;
              
              // Zähle, wie viele Klaviere bei Schlaile ENTLADEN werden (pickup_to_schlaile)
              // Durchsuche ALLE vorherigen Legs nach pickup_to_schlaile Deals
              for (let j = 0; j < i; j++) {
                  const prevLeg = finalRouteResult.legs[j];
                  if (prevLeg.consolidatedDeals) {
                      const pickupDeals = prevLeg.consolidatedDeals.filter(deal => 
                          deal.type === 'pickup_to_schlaile'
                      );
                      schlaileUnloadCount += pickupDeals.length;
                  }
              }
              console.log(`[DEBUG] ${schlaileUnloadCount} Klaviere werden bei Schlaile ENTLADEN (pickup_to_schlaile, von allen vorherigen Stops)`);
              console.log(`[DEBUG] Schlaile gefunden bei Leg ${i}, zähle alle nachfolgenden Schlaile-Lieferungen...`);
              
              // Zähle ALLE Legs nach Schlaile, die delivery_from_schlaile sind
              // Die Route ist: Schlaile → Kunde1 → Kunde2 → Kunde3 (ohne Rückkehr zu Schlaile)
              for (let j = i + 1; j < finalRouteResult.legs.length; j++) {
                  const nextStartAddr = finalSequence[j];
                  const nextEndAddr = finalSequence[j + 1];
                  const nextLeg = finalRouteResult.legs[j];
                  
                  console.log(`[DEBUG] Leg ${j}: Start=${nextStartAddr?.split(',')[0]}, Ende=${nextEndAddr?.split(',')[0]}, operationType=${nextLeg.operationType}, consolidatedDeals=${nextLeg.consolidatedDeals?.length || 0}`);
                  
                  // Prüfe, ob dieses Leg eine Schlaile-Lieferung ist
                  let isSchlaileDelivery = false;
                  
                  // Option 1: Das erste Leg nach Schlaile startet bei Schlaile
                  if (j === i + 1 && nextStartAddr === SCHLAILE_FIXED_ADDRESS) {
                      isSchlaileDelivery = true;
                      console.log(`[DEBUG] Leg ${j} ist erste Lieferung direkt von Schlaile`);
                  }
                  // Option 2: Prüfe consolidatedDeals auf delivery_from_schlaile
                  else if (nextLeg.consolidatedDeals && nextLeg.consolidatedDeals.length > 0) {
                      const hasSchlaileDelivery = nextLeg.consolidatedDeals.some(deal => 
                          deal.type === 'delivery_from_schlaile'
                      );
                      if (hasSchlaileDelivery) {
                          isSchlaileDelivery = true;
                          console.log(`[DEBUG] Leg ${j} hat delivery_from_schlaile in consolidatedDeals`);
                      }
                  }
                  // Option 3: Prüfe, ob es eine Entladung ist und noch innerhalb der Schlaile-Lieferungskette
                  else if ((nextLeg.stopType === 'delivery' || nextLeg.operationType === 'entladung') && schlaileLoadCount < 10) {
                      // Prüfe, ob dieses Ziel eine bekannte Schlaile-Lieferadresse ist
                      // (Heuristik: Bis zur nächsten Beladung oder Rückkehr zum Büro)
                      const isBeforeNextPickup = !nextLeg.operationType || nextLeg.operationType === 'entladung';
                      if (isBeforeNextPickup && nextEndAddr !== OFFICE_ADDRESS) {
                          isSchlaileDelivery = true;
                          console.log(`[DEBUG] Leg ${j} ist wahrscheinlich eine Schlaile-Lieferung (Entladung zwischen Schlaile und nächster Beladung)`);
                      }
                  }
                  
                  if (isSchlaileDelivery) {
                      schlaileLoadCount += 1;
                  } else if (nextLeg.operationType === 'beladung' || nextEndAddr === OFFICE_ADDRESS) {
                      // Stoppe, wenn eine neue Beladung kommt oder wir zum Büro zurückkehren
                      console.log(`[DEBUG] Leg ${j}: Neue Beladung oder Büro-Rückkehr, stoppe Schlaile-Zählung`);
                      break;
                  }
              }
              
              // Log für bessere Nachvollziehbarkeit
              if (schlaileUnloadCount > 0 && schlaileLoadCount > 0) {
                  console.log(`[Schlaile Kombination] Bei Schlaile: ${schlaileUnloadCount} Klaviere ENTLADEN (pickup) + ${schlaileLoadCount} Klaviere BELADEN (delivery) = Netto ${schlaileLoadCount - schlaileUnloadCount} (Leg-Index: ${i})`);
              } else if (schlaileUnloadCount > 0) {
                  console.log(`[Schlaile Entladung] Bei Schlaile ${schlaileUnloadCount} Klaviere ENTLADEN (pickup_to_schlaile) (Leg-Index: ${i})`);
              } else if (schlaileLoadCount > 0) {
                  console.log(`[Schlaile Beladung] Bei Schlaile ${schlaileLoadCount} Klaviere BELADEN (delivery_from_schlaile) (Leg-Index: ${i})`);
              }
              break; // Nur einmal Schlaile besuchen
          }
          // Fall 2: Wenn Route direkt bei Schlaile STARTET (erster nicht-Büro Stop)
          else if (startAddr === SCHLAILE_FIXED_ADDRESS && schlaileLoadIndex === -1) {
              schlaileLoadIndex = i;
              schlaileIsFirstStop = true;
              // Zähle alle Legs, die VON Schlaile wegführen
              for (let j = i; j < finalRouteResult.legs.length; j++) {
                  const nextStartAddr = finalSequence[j];
                  if (nextStartAddr === SCHLAILE_FIXED_ADDRESS) {
                      const nextLeg = finalRouteResult.legs[j];
                      if (nextLeg.consolidatedDeals && nextLeg.consolidatedDeals.length > 0) {
                          const deliveryDeals = nextLeg.consolidatedDeals.filter(deal => 
                              deal.type === 'delivery_from_schlaile'
                          );
                          schlaileLoadCount += deliveryDeals.length;
                      } else if (nextLeg.stopType === 'delivery' || nextLeg.operationType === 'entladung') {
                          schlaileLoadCount += 1;
                      }
                  } else {
                      break;
                  }
              }
              
              // Log für bessere Nachvollziehbarkeit
              if (schlaileLoadCount > 0) {
                  console.log(`[Schlaile Beladung] Route startet bei Schlaile - ${schlaileLoadCount} Klaviere werden geladen (Leg-Index: ${i})`);
              }
              break;
          }
      }
      
      finalRouteResult.legs.forEach((leg, index) => {
          // Anzahl vor der Aktion an diesem Stop
          leg.loadedPianosBefore = currentLoadedPianos;
          
          // Bestimme, wie viele Klaviere an diesem Stop geladen/entladen werden
          let changeCount = 0;
          
          const startAddr = finalSequence[index];
          const endAddr = finalSequence[index + 1];
          
          // Fall 1: Wenn wir BEI Schlaile ankommen oder Route bei Schlaile startet
          if (index === schlaileLoadIndex && (schlaileLoadCount > 0 || schlaileUnloadCount > 0)) {
              // Bei Schlaile: Erst Entladung (pickup_to_schlaile), dann Beladung (delivery_from_schlaile)
              currentLoadedPianos -= schlaileUnloadCount; // Klaviere werden bei Schlaile abgegeben
              currentLoadedPianos += schlaileLoadCount;   // Klaviere werden für Lieferung geladen
              
              // Netto-Änderung berechnen
              const nettoChange = schlaileLoadCount - schlaileUnloadCount;
              changeCount = Math.abs(nettoChange);
              
              // Setze operationType basierend auf Netto-Änderung
              if (nettoChange > 0) {
                  leg.operationType = 'beladung'; // Mehr Beladung als Entladung
                  leg.pianoChange = `+${nettoChange}`;
              } else if (nettoChange < 0) {
                  leg.operationType = 'entladung'; // Mehr Entladung als Beladung
                  leg.pianoChange = `${nettoChange}`; // Negatives Vorzeichen bereits enthalten
              } else {
                  leg.operationType = 'neutral'; // Gleich viele Be- und Entladungen
                  leg.pianoChange = '±0';
              }
              
              console.log(`[Schlaile Operation] Leg ${index}: Entladen -${schlaileUnloadCount}, Beladen +${schlaileLoadCount}, Netto ${nettoChange > 0 ? '+' : ''}${nettoChange}, Gesamt: ${currentLoadedPianos}`);
          }
          // Fall 2: Von Schlaile weg = Entladung beim Kunden (nach dem Beladen)
          else if (startAddr === SCHLAILE_FIXED_ADDRESS && index > schlaileLoadIndex) {
              if (leg.consolidatedDeals && leg.consolidatedDeals.length > 0) {
                  changeCount = leg.consolidatedDeals.length;
              } else {
                  changeCount = 1;
              }
              leg.operationType = 'entladung';
              currentLoadedPianos -= changeCount;
              console.log(`[Schlaile Lieferung] Leg ${index}: -${changeCount} Klavier(e) an ${endAddr?.split(',')[0]}, Rest: ${currentLoadedPianos}`);
          }
          // Fall 3: Normale Beladung/Entladung (Nicht-Schlaile)
          else if (leg.operationType === 'beladung') {
              // Beladung bei originAddress (Kunde gibt Klavier ab)
              if (leg.consolidatedDeals && leg.consolidatedDeals.length > 0) {
                  changeCount = leg.consolidatedDeals.length;
              } else {
                  changeCount = 1; // Standard: 1 Klavier pro Beladung
              }
              currentLoadedPianos += changeCount;
              console.log(`[Normale Beladung] Leg ${index}: +${changeCount} Klavier(e) bei ${endAddr?.split(',')[0]}, Gesamt: ${currentLoadedPianos}`);
          } else if (leg.operationType === 'entladung') {
              // Entladung bei destinationAddress (Klavier wird beim Kunden abgeliefert)
              if (leg.consolidatedDeals && leg.consolidatedDeals.length > 0) {
                  changeCount = leg.consolidatedDeals.length;
              } else {
                  changeCount = 1; // Standard: 1 Klavier pro Entladung
              }
              currentLoadedPianos -= changeCount;
              console.log(`[Normale Entladung] Leg ${index}: -${changeCount} Klavier(e) bei ${endAddr?.split(',')[0]}, Rest: ${currentLoadedPianos}`);
          }
          
          // Anzahl nach der Aktion an diesem Stop
          leg.loadedPianosAfter = currentLoadedPianos;
          if (!leg.pianoChange) { // Nur setzen, wenn nicht schon gesetzt (Schlaile-Fall)
              leg.pianoChange = leg.operationType === 'beladung' ? `+${changeCount}` : 
                               leg.operationType === 'entladung' ? `-${changeCount}` : '0';
          }
      });

       setOptimizedRoute(finalRouteResult);

       // Zeige die Route auf der Karte an
       if (directionsRenderer) {
         const directionsResult = {
           routes: [finalRouteResult],
           request: finalRouteRequest
         };
         directionsRenderer.setDirections(directionsResult);
       }

     } catch (error) {
       console.error("Fehler bei der Routenberechnung:", error);
       alert(`Fehler bei der Routenberechnung: ${error.message}`);
       setOptimizedRoute(null);
     } finally {
       setLoadingRoute(false);
     }
   }, [directionsService, directionsRenderer, tourDeals, OFFICE_ADDRESS, SCHLAILE_FIXED_ADDRESS, SCHLAILE_TYPE_PICKUP, SCHLAILE_TYPE_DELIVERY]);

  // useEffect Hook, der die Route neu berechnet
  useEffect(() => {
    if (tourDeals.length > 0 && directionsService) {
      calculateOptimizedRoute();
    } else if (tourDeals.length === 0) {
      setOptimizedRoute(null);
      setLoadingRoute(false);
      // Karte leeren wenn keine Deals vorhanden
      if (directionsRenderer) {
        directionsRenderer.setDirections({ routes: [] });
      }
    }
  }, [tourDeals, directionsService, calculateOptimizedRoute, directionsRenderer]);

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

  // Google Maps Initialisierung (wie in DailyRoutePlanner)
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = initializeMap;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const initializeMap = () => {
    const mapInstance = new window.google.maps.Map(document.getElementById('tour-route-map'), {
      zoom: 7,
      center: { lat: 51.1657, lng: 10.4515 },
    });
    
    const directionsServiceInstance = new window.google.maps.DirectionsService();
    const directionsRendererInstance = new window.google.maps.DirectionsRenderer({
      map: mapInstance,
      draggable: false, // Deaktiviert Drag & Drop auf der Karte
      suppressMarkers: false, // Zeigt Marker für alle Wegpunkte
    });

    setMap(mapInstance);
    setDirectionsService(directionsServiceInstance);
    setDirectionsRenderer(directionsRendererInstance);
  };

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

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="space-y-6">
           <div className="bg-white p-4 rounded-xl shadow-sm">
             <h3 className="text-lg font-semibold mb-3 flex items-center">
               <Search className="mr-2 h-5 w-5 text-primary" />
               Verfügbare Aufträge
             </h3>
             <div className="max-h-[500px] overflow-y-auto">
               {loading ? (
                 <div className="text-center py-10">
                   <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                   <p className="mt-2 text-gray-500 text-sm">Lade Aufträge...</p>
                 </div>
               ) : filteredDeals.length === 0 ? (
                 <div className="text-center py-8 text-gray-500 text-sm">
                   Keine Aufträge für die aktuelle Auswahl gefunden.
                 </div>
               ) : (
                 <div className="space-y-2">
                   {filteredDeals.map((deal, index) => (
                     <div key={deal.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                       <PipedriveDeal
                         deal={deal}
                         index={index}
                         isDraggable={!!((deal.originAddress && deal.destinationAddress) || deal.schlaileType)}
                       />
                     </div>
                   ))}
                 </div>
               )}
             </div>
           </div>
         </div>

         <div className="space-y-4">
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
            optimizedRoute={optimizedRoute}
            onDealTypeChange={handleDealTypeChange}
            tourStartTime={tourStartTime}
            onTourStartTimeChange={setTourStartTime}
            assignedEmployees={assignedEmployees}
            onEmployeeAdd={handleEmployeeAdd}
            onEmployeeRemove={handleEmployeeRemove}
          />

           {/* Google Maps Karte */}
           <div className="bg-white p-3 rounded-xl shadow-sm">
             <h3 className="text-lg font-semibold mb-3 flex items-center">
               <MapPin className="mr-2 h-5 w-5 text-primary" />
               Interaktive Route
             </h3>
             <div className="h-[300px] bg-gray-100 rounded-lg">
               <div id="tour-route-map" className="w-full h-full rounded-lg"></div>
             </div>
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
             {optimizedRoute && (
               <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                 <p className="text-sm text-blue-800 mb-2">
                   <strong>Hinweis:</strong> Sie können die Wegpunkte auf der Karte per Drag & Drop verschieben, um die Route manuell anzupassen.
                 </p>
                 <button
                   onClick={handleOpenRouteInGoogleMaps}
                   className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
                   disabled={loadingRoute || !optimizedRoute}
                 >
                   <MapPin className="w-4 h-4" />
                   In Google Maps öffnen
                 </button>
               </div>
             )}
           </div>

           {/* Routenliste */}
           <SortableRouteList 
             optimizedRoute={optimizedRoute}
             filteredLegsForDisplay={legsWithUpdatedPianos}
             loadingRoute={loadingRoute}
             onRouteReorder={handleRouteReorder}
             stationDurations={stationDurations}
             onDurationChange={handleDurationChange}
             calculatedTimes={calculatedTimes}
             totalDuration={totalTourDuration}
             tourDeals={tourDeals}
             manualOperationTypes={manualOperationTypes}
             onOperationTypeChange={handleOperationTypeChange}
           />
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