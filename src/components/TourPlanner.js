import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { MapPin, Calendar, Truck, X, Clock, Search, ChevronRight, Globe } from 'lucide-react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
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
          Tour für {format(selectedDate, 'dd. MMMM yyyy', { locale: de })}
        </h3>
        
        <button
          onClick={handleSaveTour}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
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

// Hauptkomponente mit innerem Inhalt
const TourPlannerContent = () => {
  const [allDeals, setAllDeals] = useState([]);
  const [filteredDeals, setFilteredDeals] = useState([]);
  const [tourDeals, setTourDeals] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [tours, setTours] = useState({});
  const [currentTourName, setCurrentTourName] = useState(format(selectedDate, 'yyyy-MM-dd'));
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [showDateFilter, setShowDateFilter] = useState(false);

  // Drop-Zone für die Tour
  const [{ isOver }, drop] = useDrop({
    accept: 'deal',
    drop: (item) => {
      // Direkt die aktuelle tourDeals verwenden, nicht die geschlossene Variable
      const dealExists = tourDeals.some(d => d.id === item.deal.id);
      if (!dealExists) {
        setTourDeals(prev => [...prev, item.deal]);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  // Regionen Definition
  const REGIONS = [
    { id: 'all', name: 'Alle Regionen', phase_id: null },
    { id: 'nord', name: 'Norden', phase_id: 19 },
    { id: 'sued', name: 'Süden', phase_id: 21 },
    { id: 'ost', name: 'Osten', phase_id: 22 },
    { id: 'west', name: 'Westen', phase_id: 23 },
    { id: 'ka', name: 'Karlsruhe', phase_id: 20 },
  ];

  // Regionname aus phase_id ermitteln
  const getRegionNameFromPhaseId = (phaseId) => {
    if (!phaseId) return 'Unbekannt';
    const region = REGIONS.find(r => r.phase_id === parseInt(phaseId));
    return region ? region.name : 'Unbekannt';
  };

  // Hilfsfunktion zur Verarbeitung von Projektdaten
  const processProjects = async (projectsData, resultArray, apiToken) => {
    // Deal-Cache für diese Session
    const dealCache = {};
    
    console.log("processProjects aufgerufen mit", projectsData.length, "Projekten");
    
    // Sammeln aller Deal-IDs aus den Projekten
    const allDealIds = [];
    projectsData.forEach(project => {
      if (project.deal_ids && project.deal_ids.length > 0) {
        allDealIds.push(project.deal_ids[0]);
      }
    });
    
    console.log(`Gefundene Deal-IDs für Projekte:`, allDealIds.length);
    
    // Direkte Verarbeitung jedes Projekts mit seinem Deal
    for (const project of projectsData) {
      try {
        console.log(`Verarbeite Projekt: ${project.id} - ${project.title}`);
        
        if (project.deal_ids && project.deal_ids.length > 0) {
          const dealId = project.deal_ids[0];
          console.log(`Projekt ${project.id} hat Deal ID: ${dealId}`);
          
          // Deal-Details abrufen
          const dealResponse = await fetch(`https://api.pipedrive.com/v1/deals/${dealId}?api_token=${apiToken}`);
          const dealData = await dealResponse.json();
          
          if (dealData.success && dealData.data) {
            // Durchsuche alle benutzerdefinierten Felder in den Deal-Daten
            let originAddress = '';
            let destinationAddress = '';
            let moveDate = '';
            
            // Bekannte Feld-IDs als Fallback
            const knownFieldIds = {
              originAddress: '07c3da8804f7b96210e45474fba35b8691211ddd',
              destinationAddress: '9cb4de1018ec8404feeaaaf7ee9b293c78c44281',
              moveDate: '949696aa9d99044db90383a758a74675587ed893'
            };
            
            // Durchsuche alle Felder des Deals
            if (dealData.data) {
              // Logge alle benutzerdefinierten Felder zum Debugging
              console.log("Deal-Felder:", Object.keys(dealData.data).filter(key => key.length > 20));
              
              // Prüfe zuerst bekannte Feld-IDs
              if (dealData.data[knownFieldIds.originAddress]) {
                originAddress = dealData.data[knownFieldIds.originAddress];
                console.log(`Gefundene Ursprungsadresse über bekannte ID: ${originAddress}`);
              }
              
              if (dealData.data[knownFieldIds.destinationAddress]) {
                destinationAddress = dealData.data[knownFieldIds.destinationAddress];
                console.log(`Gefundene Zieladresse über bekannte ID: ${destinationAddress}`);
              }
              
              if (dealData.data[knownFieldIds.moveDate]) {
                moveDate = dealData.data[knownFieldIds.moveDate];
                console.log(`Gefundenes Umzugsdatum über bekannte ID: ${moveDate}`);
              }
              
              // Prüfe alle benutzerdefinierten Felder nach Adressinformationen
              // Falls die bekannten IDs nicht funktionieren
              if (!originAddress || !destinationAddress) {
                // Gehe alle möglichen Felder durch und suche nach Adressinformationen
                for (const [key, value] of Object.entries(dealData.data)) {
                  // Wenn es ein langes Feld ist (benutzerdefinierte Felder haben lange IDs)
                  if (key.length > 30 && typeof value === 'string') {
                    console.log(`Prüfe Feld ${key}: ${value.substring(0, 30)}...`);
                    
                    // Einfache Heuristik für Adressen (enthält Straße, Hausnummer, PLZ)
                    if (
                      !originAddress && 
                      (value.includes('straße') || value.includes('str.') || 
                       value.includes('Str') || /\d{5}/.test(value))
                    ) {
                      originAddress = value;
                      console.log(`Gefundene Ursprungsadresse heuristisch: ${originAddress}`);
                    } else if (
                      !destinationAddress && 
                      (value.includes('straße') || value.includes('str.') || 
                       value.includes('Str') || /\d{5}/.test(value))
                    ) {
                      destinationAddress = value;
                      console.log(`Gefundene Zieladresse heuristisch: ${destinationAddress}`);
                    }
                  }
                }
              }
            }
            
            console.log(`Extrahierte Daten für Deal ${dealId}:`, {
              originAddress,
              destinationAddress,
              moveDate
            });
            
            // Zum Resultarray hinzufügen
            resultArray.push({
              id: project.id,
              dealId: dealId,
              title: project.title || dealData.data.title,
              organization: dealData.data.org_name,
              moveDate: moveDate || project.start_date,
              originAddress: originAddress,
              destinationAddress: destinationAddress,
              value: dealData.data.value,
              currency: dealData.data.currency,
              region: getRegionNameFromPhaseId(project.phase_id),
              projectStartDate: project.start_date,
              projectEndDate: project.end_date
            });
          } else {
            console.log(`Keine Deal-Daten für ID ${dealId} gefunden`);
            resultArray.push({
              id: project.id,
              title: project.title,
              region: getRegionNameFromPhaseId(project.phase_id),
              moveDate: project.start_date,
              projectStartDate: project.start_date,
              projectEndDate: project.end_date
            });
          }
        } else {
          console.log(`Projekt ${project.id} hat keine verknüpften Deals`);
          resultArray.push({
            id: project.id,
            title: project.title,
            region: getRegionNameFromPhaseId(project.phase_id),
            moveDate: project.start_date,
            projectStartDate: project.start_date,
            projectEndDate: project.end_date
          });
        }
        
        // Kurze Pause zwischen API-Anfragen
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Fehler bei der Verarbeitung von Projekt ${project.id}:`, error);
      }
    }
    
    console.log(`Verarbeitete Projekte: ${resultArray.length}`);
  };

  // Deal aus der Tour entfernen
  const handleRemoveDeal = (dealId) => {
    setTourDeals(prev => prev.filter(deal => deal.id !== dealId));
  };

  // Fetch-Logik mit API-Integration
  const fetchDeals = useCallback(async () => {
    setLoading(true);
    
    try {
      // Laden wir die gespeicherten Tokens aus localStorage
      const apiToken = '6d56f23ce118508c71e09e0b9ede281e91a2f814'; // Diesen solltest du in einer .env Datei speichern
      
      // Cache-Key nur für die Region
      const cacheKey = `projects_${selectedRegion}`;
      const cachedProjects = localStorage.getItem(cacheKey);
      
      // Wenn gecachte Projekte existieren und nicht älter als 1 Stunde sind, verwenden wir diese
      if (cachedProjects) {
        const { data, timestamp } = JSON.parse(cachedProjects);
        if (Date.now() - timestamp < 60 * 60 * 1000) { // 1 Stunde Cache
          setAllDeals(data);
          // Keine Datumsfilterung beim Laden, nur bei der Anzeige
          filterDeals(data, searchQuery, null);
          setLoading(false);
          return;
        }
      }
      
      let allProjectsWithDetails = [];
      
      // Bei "Alle Regionen" alle relevanten Regionen abfragen
      if (selectedRegion === 'all') {
        // Alle relevanten Regionen durchlaufen und Projekte laden
        for (const region of REGIONS) {
          // Überspringen des "Alle Regionen"-Eintrags
          if (region.id === 'all' || region.phase_id === null) continue;
          
          // Projekte für diese Region laden
          const regionUrl = `https://api.pipedrive.com/v1/projects?status=open&phase_id=${region.phase_id}&api_token=${apiToken}&limit=100`;
          console.log(`Anfrage URL für Region ${region.name}:`, regionUrl);
          const regionResponse = await fetch(regionUrl);
          const regionData = await regionResponse.json();
          console.log(`Projekte in Region ${region.name}:`, regionData.data?.length || 0);
          
          if (regionData.success && Array.isArray(regionData.data)) {
            await processProjects(regionData.data, allProjectsWithDetails, apiToken);
          }
          
          // Kurze Pause zwischen API-Anfragen
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } else {
        // Nur die ausgewählte Region laden
        const region = REGIONS.find(r => r.id === selectedRegion);
        if (region && region.phase_id !== null) {
          const projectsUrl = `https://api.pipedrive.com/v1/projects?status=open&phase_id=${region.phase_id}&api_token=${apiToken}&limit=100`;
          console.log(`Anfrage URL für Region ${region.name}:`, projectsUrl);
          const projectsResponse = await fetch(projectsUrl);
          const projectsData = await projectsResponse.json();
          console.log(`Projekte in Region ${region.name}:`, projectsData.data?.length || 0);
          
          if (projectsData.success && Array.isArray(projectsData.data)) {
            await processProjects(projectsData.data, allProjectsWithDetails, apiToken);
          }
        }
      }
      
      console.log("Insgesamt geladene Projekte:", allProjectsWithDetails.length);
      
      // Speichere die Ergebnisse im localStorage Cache
      localStorage.setItem(cacheKey, JSON.stringify({
        data: allProjectsWithDetails,
        timestamp: Date.now()
      }));
      
      setAllDeals(allProjectsWithDetails);
      // Alle Projekte geladen, nur bei der Anzeige nach Datum filtern
      filterDeals(allProjectsWithDetails, searchQuery, null);
    } catch (error) {
      console.error('Error fetching deals', error);
      // Setze leere Arrays im Fehlerfall
      setAllDeals([]);
      setFilteredDeals([]);
    } finally {
      setLoading(false);
    }
  }, [selectedRegion, searchQuery, REGIONS]);

  // Filtern der Deals nach Datum und Suchbegriff
  const filterDeals = (deals, query, date) => {
    if (!Array.isArray(deals)) {
      setFilteredDeals([]);
      return;
    }
    
    let filtered = [...deals];
    
    // Nach Datum filtern
    if (date) {
      const dateString = format(date, 'yyyy-MM-dd');
      filtered = filtered.filter(deal => {
        if (!deal || !deal.moveDate) return false;
        
        // Zuerst versuchen wir das moveDate-Format (aus dem Deal)
        if (deal.moveDate && deal.moveDate.startsWith(dateString)) {
          return true;
        }
        
        // Alternativ das Projektdatum prüfen
        if (deal.projectStartDate === dateString || deal.projectEndDate === dateString) {
          return true;
        }
        
        // Check if date falls between project start and end date
        if (deal.projectStartDate && deal.projectEndDate) {
          const selectedDate = new Date(dateString);
          const startDate = new Date(deal.projectStartDate);
          const endDate = new Date(deal.projectEndDate);
          
          if (selectedDate >= startDate && selectedDate <= endDate) {
            return true;
          }
        }
        
        return false;
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
          deal.destinationAddress?.toLowerCase().includes(lowerQuery)
        ))
      );
    }
    
    setFilteredDeals(filtered);
  };

  // Suche ausführen
  const handleSearch = (value) => {
    setSearchQuery(value);
    filterDeals(allDeals, value, showDateFilter ? selectedDate : null);
  };

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
  };

  // Tour speichern
  const handleSaveTour = () => {
    const updatedTours = { ...tours, [currentTourName]: tourDeals };
    setTours(updatedTours);
    localStorage.setItem('savedTours', JSON.stringify(updatedTours));
    
    // Feedback für Benutzer
    alert('Tour gespeichert');
  };

  // Gespeicherte Touren laden
  useEffect(() => {
    const savedTours = localStorage.getItem('savedTours');
    if (savedTours) {
      setTours(JSON.parse(savedTours));
    }
  }, []);

  // Berechnet die Route und öffnet sie in Google Maps
  const handleCalculateRoute = () => {
    if (tourDeals.length < 2) {
      alert('Bitte fügen Sie mindestens zwei Stationen hinzu, um eine Route zu berechnen.');
      return;
    }
    
    // Erstelle einen Google Maps-Link mit allen Stationen
    const allAddresses = [];
    
    // Sammle alle Adressen von allen Deals in der Tour
    tourDeals.forEach(deal => {
      if (deal.originAddress) {
        allAddresses.push(encodeURIComponent(deal.originAddress));
      }
      
      if (deal.destinationAddress) {
        allAddresses.push(encodeURIComponent(deal.destinationAddress));
      }
    });
    
    // Filtere leere Adressen heraus
    const validAddresses = allAddresses.filter(address => address.trim() !== '');
    
    if (validAddresses.length < 2) {
      alert('Mindestens zwei gültige Adressen werden benötigt, um eine Route zu berechnen.');
      return;
    }
    
    // Erste Adresse als Startpunkt
    const origin = validAddresses[0];
    
    // Letzte Adresse als Ziel
    const destination = validAddresses[validAddresses.length - 1];
    
    // Alle Adressen dazwischen als Wegpunkte
    const waypoints = validAddresses.slice(1, validAddresses.length - 1);
    
    // Erstelle den Google Maps URL
    const waypointsStr = waypoints.length > 0 ? `&waypoints=${waypoints.join('|')}` : '';
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointsStr}&travelmode=driving`;
    
    // Hinweis, wenn die Route zu viele Wegpunkte enthält (Google Maps Limit ist etwa 10 Wegpunkte)
    if (waypoints.length > 10) {
      alert('Hinweis: Ihre Route enthält über 10 Wegpunkte. Google Maps zeigt möglicherweise nicht alle Stationen an.');
    }
    
    // Öffne den Link in einem neuen Tab
    window.open(googleMapsUrl, '_blank');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800">Tourenplanung</h2>
        <p className="text-gray-500 mt-1">Planen Sie Ihre Umzüge für bestimmte Tage</p>
      </div>
      
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Linke Spalte: Verfügbare Aufträge */}
          <div className="w-full md:w-1/2">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                <h3 className="text-lg font-semibold flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-primary" />
                  {showDateFilter 
                    ? `Aufträge für ${format(selectedDate, 'dd. MMMM yyyy', { locale: de })}`
                    : 'Alle verfügbaren Aufträge'}
                </h3>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="datumFilter"
                      checked={showDateFilter}
                      onChange={(e) => {
                        setShowDateFilter(e.target.checked);
                        filterDeals(allDeals, searchQuery, e.target.checked ? selectedDate : null);
                      }}
                      className="mr-2"
                    />
                    <label htmlFor="datumFilter">Datum filtern</label>
                  </div>
                  
                  {showDateFilter && (
                    <DatePicker
                      selected={selectedDate}
                      onChange={(date) => {
                        setSelectedDate(date);
                        filterDeals(allDeals, searchQuery, date);
                      }}
                      dateFormat="dd.MM.yyyy"
                      className="p-2 border rounded-md"
                      locale={de}
                    />
                  )}
                </div>
              </div>
              
              {/* Regionsfilter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region wählen
                </label>
                <div className="flex flex-wrap gap-2">
                  {REGIONS.map(region => (
                    <button
                      key={region.id}
                      onClick={() => handleRegionChange(region.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                        ${selectedRegion === region.id
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {region.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Aufträge suchen..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="mr-2 h-4 w-4 text-primary" />
                  <span>{filteredDeals.length} Aufträge gefunden</span>
                </div>
              </div>
              
              <div className="max-h-[600px] overflow-y-auto p-2">
                {loading ? (
                  <div className="text-center py-20">
                    <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-4 text-gray-500">Lade Aufträge...</p>
                  </div>
                ) : filteredDeals.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    Keine Aufträge gefunden für das ausgewählte Datum
                  </div>
                ) : (
                  filteredDeals.map((deal, index) => (
                    <PipedriveDeal 
                      key={deal.id} 
                      deal={deal} 
                      index={index}
                      isDraggable={true}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
          
          {/* Rechte Spalte: Geplante Tour */}
          <div className="w-full md:w-1/2">
            <TourArea 
              isOver={isOver}
              drop={drop}
              tourDeals={tourDeals}
              onRemoveDeal={handleRemoveDeal}
              selectedDate={selectedDate}
              handleSaveTour={handleSaveTour}
              handleCalculateRoute={handleCalculateRoute}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Hauptkomponente mit DndProvider
const TourPlanner = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <TourPlannerContent />
    </DndProvider>
  );
};

export default TourPlanner; 