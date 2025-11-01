import React, { useState, useEffect, useRef } from 'react';
import { Clock, Package, Truck, Users, Plus, Minus, MapPin, ChevronDown, X } from 'lucide-react';
import { adminService } from '../services/adminService';
import { getDeal } from '../services/pipedriveService';
import { AVAILABLE_TRUCKS } from './MovingTruckSimulator';

// --- Pipedrive Field API Keys ---

// Nur noch der Fahrzeug-Key wird statisch verwendet
const PIPEDRIVE_KEY_FAHRZEUGE = '7ef0bad215357130769f5d26e0b47c5c55da239d'; // Fahrzeuge (Multiple options field key)

// Alle anderen Keys werden dynamisch über pipedrive_field aus der Datenbank geladen

const MovingCalculation = ({ roomsData, additionalInfo, onComplete }) => {
  const [totalVolume, setTotalVolume] = useState(0);
  const [packingTime, setPackingTime] = useState(0);
  const [unpackingTime, setUnpackingTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState([]);
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState({});
  const [laborCosts, setLaborCosts] = useState({
    byType: {},
    total: 0
  });
  const [loadingTime, setLoadingTime] = useState(0);
  const [loadingTimePerUnit, setLoadingTimePerUnit] = useState(0);

  // Neue State-Variablen für Fahrtberechnung
  const [travelCosts, setTravelCosts] = useState(0);
  const [routeDetails, setRouteDetails] = useState(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  // Neue State-Variablen für Google Maps
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const directionsServiceRef = useRef(null);
  const googleRef = useRef(null);

  // Füge neue State-Variablen für Adressen hinzu
  const [locations, setLocations] = useState({
    origin: '',
    destination: ''
  });

  // Füge einen State für dealId hinzu (oder hole ihn aus den Props)
  const [dealId, setDealId] = useState(null);

  // API-Keys für die Adressen aus MoveInformationComponent
  const ADDRESS_KEYS = {
    pickup: '07c3da8804f7b96210e45474fba35b8691211ddd',
    delivery: '9cb4de1018ec8404feeaaaf7ee9b293c78c44281'
  };

  // Füge einen State für die Fahrzeit in Minuten hinzu
  const [travelTimeMinutes, setTravelTimeMinutes] = useState(0);

  // Neue State-Variablen für Materialien hinzufügen
  const [packMaterials, setPackMaterials] = useState({});
  const [materialCosts, setMaterialCosts] = useState(0);

  // Neue State-Variable für Materialpreise
  const [materialPrices, setMaterialPrices] = useState({});

  // Definition der Office-Adresse als Konstante am Anfang der Komponente
  const OFFICE_ADDRESS = "Greschbachstraße 29, 76229 Karlsruhe";

  // Füge State für die vollständige Route hinzu
  const [completeRoute, setCompleteRoute] = useState(null);

  // Füge State für die selected trucks hinzu
  const [selectedTrucks, setSelectedTrucks] = useState([]);
  const [isTruckDropdownOpen, setIsTruckDropdownOpen] = useState(false);
  const truckDropdownRef = useRef(null);

  // --- State for calculated driver counts ---
  const [calculatedDrivers, setCalculatedDrivers] = useState({
    '12T': 0,
    '7.5T': 0,
    '3.5T': 0,
  });

  // Add new state variables for editable times
  const [editableTimes, setEditableTimes] = useState({
    setup: 0,
    dismantle: 0,
    loading: 0,
    travel: 0
  });

  // Berechnung und Laden der Preisdaten beim Laden der Komponente
  useEffect(() => {
    calculateMovingMetrics();
  }, [roomsData, loadingTimePerUnit, additionalInfo]);

  useEffect(() => {
    loadPrices();
  }, []);

  useEffect(() => {
    // Dealoptionale ID aus den additionalInfo oder aus einem anderen Prop extrahieren
    const dealIdFromProps = additionalInfo?.dealId;
    
    if (dealIdFromProps) {
      console.log("Gefundene dealId:", dealIdFromProps);
      setDealId(dealIdFromProps);
      fetchAddressData(dealIdFromProps);
    } else {
      console.log("Keine dealId gefunden - Adressabruf nicht möglich");
    }
  }, [additionalInfo]);

  useEffect(() => {
    try {
      const savedAddresses = sessionStorage.getItem('movingAddresses');
      if (savedAddresses) {
        const parsedAddresses = JSON.parse(savedAddresses);
        console.log("Adressen aus SessionStorage geladen:", parsedAddresses);
        
        setLocations({
          origin: parsedAddresses.origin || '',
          destination: parsedAddresses.destination || ''
        });
      } else {
        console.log("Keine gespeicherten Adressen im SessionStorage gefunden");
      }
    } catch (error) {
      console.error("Fehler beim Laden der Adressen aus SessionStorage:", error);
    }
  }, []);

  const loadPrices = async () => {
    try {
      // Alle Preiseinträge laden
      const priceData = await adminService.getPrices();
      
      // Zur Debug-Ausgabe in der Konsole
      console.log("Alle geladenen Preiseinträge:", priceData);
      
      // Alle Preiseinträge speichern
      setPrices(priceData);
      
      // Nur Stundensätze (hourly_rate) als Mitarbeitertypen verwenden
      const hourlyRates = priceData.filter(price => price.type === 'hourly_rate');
      console.log("🔍 Gefilterte Stundensätze (hourly_rate):", hourlyRates);
      
      // Detaillierte Logs für jeden Mitarbeitertyp
      hourlyRates.forEach(rate => {
        console.log(`👤 Mitarbeitertyp: ${rate.name}`);
        console.log(`   - ID: ${rate.id}`);
        console.log(`   - Preis: ${rate.price}€/h`);
        console.log(`   - pipedrive_field: ${rate.pipedrive_field || 'NICHT GESETZT'}`);
        console.log(`   - Typ: ${rate.type}`);
      });
      
      // Ladezeit pro 5m³ finden
      const loadingTimeEntry = priceData.find(
        price => price.type === 'loading_time' || 
                price.name.includes('Ladezeit') || 
                price.name.includes('Beladezeit')
      );
      
      // Materialpreise extrahieren (Typ 'material')
      const materials = priceData.filter(price => price.type === 'material');
      console.log("Gefundene Materialpreise:", materials);
      
      // Speichere Materialpreise in einem leicht zugänglichen Format
      const materialPriceMap = {};
      materials.forEach(material => {
        materialPriceMap[material.name] = material.price || 0;
      });
      setMaterialPrices(materialPriceMap);
      
      if (loadingTimeEntry) {
        console.log("Gefundene Ladezeit-Konfiguration:", loadingTimeEntry);
        // Direkter Zugriff auf den price-Wert aus dem gefundenen Eintrag
        const loadingTimeValue = loadingTimeEntry.price || 0;
        console.log("Setze loadingTimePerUnit auf:", loadingTimeValue);
        setLoadingTimePerUnit(loadingTimeValue);
        
        // Berechne Ladezeit basierend auf Gesamtvolumen (aufgerundet auf 5m³-Einheiten)
        const volumeUnits = Math.ceil(totalVolume / 5);
        const calculatedLoadingTime = volumeUnits * loadingTimeValue;
        setLoadingTime(calculatedLoadingTime);
        
        // Aktualisiere Gesamtdauer
        setTotalDuration(prevDuration => prevDuration + calculatedLoadingTime);
      } else {
        console.warn("Keine Ladezeit-Konfiguration gefunden");
      }
      
      console.log("📤 Setze employeeTypes:", hourlyRates);
      setEmployeeTypes(hourlyRates);
      
      // Initialisiere selectedEmployees mit Standardwerten
      const initialSelection = {};
      hourlyRates.forEach(type => {
        // Stelle sicher, dass die ID als String verwendet wird (für Konsistenz)
        const stringId = String(type.id);
        initialSelection[stringId] = 0;
        console.log(`🔧 Initialisiere Mitarbeitertyp: ${type.name} (ID: ${type.id} -> ${stringId})`);
      });
      
      // Basierend auf Volumen einen empfohlenen Anfangswert setzen
      if (totalVolume > 0 && hourlyRates.length > 0) {
        const firstTypeId = String(hourlyRates[0].id); // Konvertiere zu String für Konsistenz
        const recommendedCount = Math.max(2, Math.ceil(totalVolume / 15));
        initialSelection[firstTypeId] = recommendedCount;
        console.log(`🎯 Setze empfohlene Anzahl für ${hourlyRates[0].name}: ${recommendedCount} Personen (basierend auf Volumen: ${totalVolume})`);
      }
      
      console.log("📋 Finale initiale Auswahl:", initialSelection);
      setSelectedEmployees(initialSelection);
      
      // Debug: Zeige initiale Mitarbeiterauswahl
      console.log("🎯 Initiale Mitarbeiterauswahl:", initialSelection);
      Object.entries(initialSelection).forEach(([typeId, count]) => {
        if (count > 0) {
          const employeeType = hourlyRates.find(type => type.id === typeId);
          console.log(`   - ${employeeType?.name || 'UNBEKANNT'}: ${count} Personen`);
        }
      });
    } catch (error) {
      console.error('Fehler beim Laden der Preisdaten:', error);
    }
  };

  const calculateMovingMetrics = () => {
    setLoading(true);
    
    // Berechnung des Gesamtvolumens
    let volume = 0;
    // Berechnung der Auf- und Abbauzeiten
    let setupTime = 0;
    let dismantleTime = 0;
    
    console.log("Berechne Umzugsmetriken:", roomsData);
    console.log("AdditionalInfo für Karton-Berechnung:", additionalInfo);
    
    // Durch alle Räume und deren Gegenstände iterieren
    Object.values(roomsData).forEach(room => {
      // 1. Volumen und Zeiten für Möbel (items) berechnen
      if (room.items && Array.isArray(room.items)) {
        room.items.forEach(item => {
          // Nur Gegenstände berücksichtigen, die tatsächlich im Umzug enthalten sind
          if (item.quantity && item.quantity > 0) {
            // Typen sicherstellen
            const width = parseFloat(item.width) || 0;
            const length = parseFloat(item.length) || 0;
            const height = parseFloat(item.height) || 0;
            const setupTimeValue = parseInt(item.setupTime) || 0;
            const dismantleTimeValue = parseInt(item.dismantleTime) || 0;
            const quantity = parseInt(item.quantity);
            
            // Volumen berechnen (Breite * Länge * Höhe in m³)
            const itemVolume = (width * length * height / 1000000) * quantity;
            volume += itemVolume;
            
            // Debug-Ausgabe für die Zeitberechnung
            console.log(`Item ${item.name} (${quantity}x): Setup=${setupTimeValue}min, Dismantle=${dismantleTimeValue}min`);
            
            // Aufbau- und Abbauzeiten summieren (in Minuten)
            setupTime += setupTimeValue * quantity;
            dismantleTime += dismantleTimeValue * quantity;
          }
        });
      }
      
      // 2. Volumen für Packmaterialien (packMaterials) berechnen
      if (room.packMaterials && Array.isArray(room.packMaterials)) {
        room.packMaterials.forEach(material => {
          if (material.quantity && material.quantity > 0) {
            // Prüfen ob material ein Karton ist, für den Volumen berechnet werden soll
            if (['Umzugskartons (Standard)', 'Bücherkartons (Bücher&Geschirr)', 'Kleiderkisten'].includes(material.name)) {
              // Finde die Konfiguration (inkl. Maße) für dieses Material in den geladenen Preisen
              const priceConfig = prices?.find(p => p.name === material.name);
              
              if (priceConfig?.length && priceConfig?.width && priceConfig?.height) {
                const materialVolume = (priceConfig.length * priceConfig.width * priceConfig.height) / 1000000; // cm³ to m³
                volume += materialVolume * material.quantity;
                console.log(`Packmaterial ${material.name} (${material.quantity}x): Volumen=${(materialVolume * material.quantity).toFixed(3)}m³`);
              } else {
                console.warn(`Keine Maße für Packmaterial gefunden: ${material.name}`);
              }
            }
          }
        });
      }
    });
    
    // Ersetze automatisch berechnete Karton-Volumina durch manuell eingegebene Werte
    if (additionalInfo && Array.isArray(additionalInfo)) {
      const umzugskartons = additionalInfo.find(
        f => f.name === 'Anzahl Umzugskartons' && f.type === 'number'
      )?.value || 0;
      
      const porzellankartons = additionalInfo.find(
        f => f.name === 'Anzahl Porzellankartons' && f.type === 'number'
      )?.value || 0;

      if (umzugskartons > 0 || porzellankartons > 0) {
        // Standard Umzugskarton: 60x40x40 cm = 0.096 m³
        const umzugskartonVolume = 0.096;
        // Porzellankarton: 50x30x30 cm = 0.045 m³
        const porzellankartonVolume = 0.045;

        const umzugskartonsVolume = umzugskartons * umzugskartonVolume;
        const porzellankartonsVolume = porzellankartons * porzellankartonVolume;
        
        // Entferne automatisch berechnete Karton-Volumina und ersetze sie durch manuelle Werte
        // Zuerst entfernen wir die automatisch berechneten Karton-Volumina
        Object.values(roomsData).forEach(room => {
          if (room.packMaterials && Array.isArray(room.packMaterials)) {
            room.packMaterials.forEach(material => {
              if (['Umzugskartons (Standard)', 'Bücherkartons (Bücher&Geschirr)', 'Kleiderkisten'].includes(material.name) && material.quantity > 0) {
                const priceConfig = prices?.find(p => p.name === material.name);
                if (priceConfig?.length && priceConfig?.width && priceConfig?.height) {
                  const materialVolume = (priceConfig.length * priceConfig.width * priceConfig.height) / 1000000;
                  volume -= materialVolume * material.quantity; // Entferne automatisch berechnetes Volumen
                }
              }
            });
          }
        });
        
        // Dann füge die manuell eingegebenen Karton-Volumina hinzu
        volume += umzugskartonsVolume + porzellankartonsVolume;
        
        console.log('Replaced automatic carton volumes with manual values:', {
          umzugskartons,
          porzellankartons,
          umzugskartonsVolume: umzugskartonsVolume.toFixed(3),
          porzellankartonsVolume: porzellankartonsVolume.toFixed(3),
          totalManualVolume: (umzugskartonsVolume + porzellankartonsVolume).toFixed(3)
        });
      }
    }
    
    console.log(`Berechnete Werte (inkl. Packmaterialien und Kartons): Volumen=${volume.toFixed(2)}m³, Setup=${setupTime}min, Dismantle=${dismantleTime}min`);
    
    // Werte setzen
    setTotalVolume(volume);
    setPackingTime(setupTime);
    setUnpackingTime(dismantleTime);
    
    // Berechne Ladezeit mit dem aktuellen loadingTimePerUnit-Wert und dem *neuen* Gesamtvolumen
    const volumeUnits = Math.ceil(volume / 5);
    console.log(`Berechne Ladezeit: ${volumeUnits} Einheiten × ${loadingTimePerUnit} Minuten = ${volumeUnits * loadingTimePerUnit} Minuten`);
    const calculatedLoadingTime = volumeUnits * loadingTimePerUnit;
    setLoadingTime(calculatedLoadingTime);
    
    // Gesamtdauer mit Ladezeit (Fahrtzeit wird später hinzugefügt)
    setTotalDuration(setupTime + dismantleTime + calculatedLoadingTime);
    
    setLoading(false);
  };

  const handleEmployeeChange = (typeId, change) => {
    console.log(`🔄 Mitarbeiter-Änderung: typeId=${typeId}, change=${change}`);
    
    setSelectedEmployees(prev => {
      const newValue = Math.max(0, (prev[typeId] || 0) + change);
      const employeeType = employeeTypes.find(type => type.id === typeId);
      
      console.log(`   - Mitarbeitertyp: ${employeeType?.name || 'UNBEKANNT'}`);
      console.log(`   - Alter Wert: ${prev[typeId] || 0}`);
      console.log(`   - Neuer Wert: ${newValue}`);
      console.log(`   - pipedrive_field: ${employeeType?.pipedrive_field || 'NICHT GESETZT'}`);
      
      return {
        ...prev,
        [typeId]: newValue
      };
    });
  };

  const getTotalEmployees = () => {
    return Object.values(selectedEmployees).reduce((sum, count) => sum + count, 0);
  };

  const getTimePerEmployee = () => {
    const totalEmployees = getTotalEmployees();
    if (!totalEmployees) return 0;
    
    // Nur Arbeitszeit (ohne Fahrtzeit) wird pro Mitarbeiter reduziert
    const workDurationWithoutTravel = packingTime + unpackingTime + loadingTime;
    const travelDuration = travelTimeMinutes; // Fahrtzeit bleibt konstant (bereits komplette Route)
    
    // Arbeitszeit pro Mitarbeiter + konstante Fahrtzeit
    return Math.round(workDurationWithoutTravel / totalEmployees + travelDuration);
  };

  const calculateLaborCosts = (duration = totalDuration) => {
    if (!employeeTypes.length) return;
    
    // Arbeitszeit ohne Fahrtzeit berechnen
    const workDurationWithoutTravel = packingTime + unpackingTime + loadingTime;
    
    // Fahrtzeit (diese bleibt konstant unabhängig von der Mitarbeiteranzahl)
    const travelDuration = travelTimeMinutes;
    
    const totalEmployees = getTotalEmployees();
    
    if (!totalEmployees) {
      setLaborCosts({ byType: {}, total: 0 });
      return;
    }
    
    // Kosten pro Mitarbeitertyp berechnen
    const byType = {};
    let total = 0;
    
    // Berechne die durchschnittliche Zeit pro Mitarbeiter (ohne Fahrtzeit)
    const workTimePerEmployee = workDurationWithoutTravel / Math.max(1, totalEmployees);
    
    // Gesamtzeit pro Mitarbeiter = Arbeitszeit/Mitarbeiteranzahl + Fahrzeit
    const timePerEmployee = workTimePerEmployee + travelDuration;
    
    employeeTypes.forEach(type => {
      const count = selectedEmployees[type.id] || 0;
      if (!count) return;
      
      const hours = timePerEmployee / 60; // Umrechnung in Stunden
      const cost = count * type.price * hours;
      
      byType[type.id] = {
        count,
        hourlyRate: type.price,
        hours,
        cost
      };
      
      total += cost;
    });
    
    setLaborCosts({ byType, total });
  };

  useEffect(() => {
    console.log("🔄 calculateLaborCosts useEffect ausgelöst");
    console.log("   selectedEmployees:", selectedEmployees);
    console.log("   employeeTypes:", employeeTypes);
    calculateLaborCosts();
  }, [selectedEmployees, totalDuration, employeeTypes]);

  // Callback für die Preisberechnung aus MovingPriceCalculator
  const handlePriceCalculated = (price) => {
    setTravelCosts(parseFloat(price));
  };
  
  // Callback für die Routenberechnung
  const handleRouteCalculated = (routeData) => {
    setRouteDetails(routeData);
  };
  
  // Aktualisiere die Gesamtkosten, wenn sich die Reisekosten ändern
  useEffect(() => {
    // Aktualisiere die Gesamtkosten
    const newTotal = laborCosts.total + travelCosts;
    setLaborCosts(prev => ({...prev, total: newTotal}));
  }, [travelCosts]);

  // Funktion zum Abrufen der Adressen vom Server
  const fetchAddressData = async (id) => {
    if (!id) return;
    
    console.log("Hole Adressen für Deal:", id);
    
    try {
      const dealData = await getDeal(id);
      console.log("Erhaltene Deal-Daten:", dealData);
      
      // Extrahiere Adressen mit denselben API-Keys wie in MoveInformationComponent
      const pickupAddress = dealData[ADDRESS_KEYS.pickup];
      const deliveryAddress = dealData[ADDRESS_KEYS.delivery];
      
      console.log("Gefundene Adressen aus API:", {
        pickup: pickupAddress,
        delivery: deliveryAddress
      });
      
      // Setze die Adressen, wenn sie existieren
      if (pickupAddress || deliveryAddress) {
        setLocations(prev => ({
          origin: pickupAddress || prev.origin,
          destination: deliveryAddress || prev.destination
        }));
      }
    } catch (error) {
      console.error("Fehler beim Abrufen der Deal-Daten:", error);
    }
  };

  // Vereinfachte useEffect für Google Maps
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.onload = () => {
        setMapsLoaded(true);
        googleRef.current = window.google;
        directionsServiceRef.current = new window.google.maps.DirectionsService();
      };
      document.body.appendChild(script);
      
      return () => {
        document.body.removeChild(script);
      };
    } else {
      setMapsLoaded(true);
      googleRef.current = window.google;
      directionsServiceRef.current = new window.google.maps.DirectionsService();
    }
  }, []);

  // Füge eine useEffect-Funktion hinzu, die automatisch die Route berechnet, 
  // wenn sich die Adressen ändern
  useEffect(() => {
    if (locations.origin && locations.destination && mapsLoaded && directionsServiceRef.current) {
      console.log("Adressen geändert, berechne Route automatisch:", locations);
      calculateRoute();
    }
  }, [locations, mapsLoaded]);

  // Aktualisiere die calculateRoute-Funktion für die Office-basierte Berechnung
  const calculateRoute = () => {
    if (!directionsServiceRef.current) {
      console.log("DirectionsService ist noch nicht verfügbar");
      return;
    }
    
    if (!locations.origin || !locations.destination) {
      console.log("Keine vollständigen Adressen verfügbar");
      return;
    }
    
    console.log("Berechne komplette Route: Office -> Beladeadresse -> Entladeadresse -> Office");
    
    setIsCalculatingRoute(true);
    
    // Erstelle Wegpunkte für die vollständige Route
    const waypoints = [
      {
        location: locations.origin,
        stopover: true
      },
      {
        location: locations.destination,
        stopover: true
      }
    ];
    
    const request = {
      origin: OFFICE_ADDRESS,        // Starte vom Office
      destination: OFFICE_ADDRESS,   // Kehre zum Office zurück
      waypoints: waypoints,          // Über Belade- und Entladeadresse
      optimizeWaypoints: false,      // Beladeadresse muss vor Entladeadresse kommen
      travelMode: googleRef.current.maps.TravelMode.DRIVING
    };

    directionsServiceRef.current.route(request, (result, status) => {
      setIsCalculatingRoute(false);
      
      if (status === "OK") {
        // Speichere die vollständige Route
        setCompleteRoute(result.routes[0]);
        
        // Berechne Gesamtdistanz und -zeit
        const route = result.routes[0];
        const totalDistance = route.legs.reduce((sum, leg) => sum + leg.distance.value, 0) / 1000; // in km
        const totalDurationSeconds = route.legs.reduce((sum, leg) => sum + leg.duration.value, 0);
        const totalDurationMinutes = totalDurationSeconds / 60;
        
        console.log(`Komplette Route berechnet: ${totalDistance.toFixed(1)}km, ${Math.round(totalDurationMinutes)} Minuten`);
        
        // Setze die Fahrzeit für die Gesamtkostenberechnung
        setTravelTimeMinutes(totalDurationMinutes);
        
        // Berechne Fahrtkosten basierend auf Distanz
        const BASE_PRICE = 500;
        const PRICE_PER_KM = 2.5;
        const estimatedPrice = (BASE_PRICE + (totalDistance * PRICE_PER_KM)).toFixed(2);
        setTravelCosts(parseFloat(estimatedPrice));
        
        // Setze vereinfachte Routendetails für die UI
        setRouteDetails({
          origin: locations.origin,
          destination: locations.destination,
          distance: `${totalDistance.toFixed(1)} km`,
          duration: `${Math.floor(totalDurationMinutes / 60)}h ${Math.round(totalDurationMinutes % 60)}min`,
          durationMinutes: totalDurationMinutes,
          // Füge Details zur Office-Route hinzu
          officeOrigin: OFFICE_ADDRESS,
          // Segmente der Route für detaillierte Anzeige
          segments: [
            {
              from: OFFICE_ADDRESS,
              to: locations.origin,
              distance: route.legs[0].distance.text,
              duration: route.legs[0].duration.text
            },
            {
              from: locations.origin,
              to: locations.destination,
              distance: route.legs[1].distance.text,
              duration: route.legs[1].duration.text
            },
            {
              from: locations.destination,
              to: OFFICE_ADDRESS,
              distance: route.legs[2].distance.text,
              duration: route.legs[2].duration.text
            }
          ]
        });
        
        // Aktualisiere die Gesamtdauer mit der korrekten Fahrzeit
        updateTotalDurationWithTravelTime(totalDurationMinutes);
        
      } else {
        console.error("Routenberechnung fehlgeschlagen:", status);
      }
    });
  };

  // Aktualisiere die Funktion zum Berechnen der Gesamtzeit
  const updateTotalDurationWithTravelTime = (minutes) => {
    // Die gesamte Fahrzeit (bereits mit Hin- und Rückweg berechnet)
    const totalTravelMinutes = minutes;
    
    // Aktualisiere die Gesamtdauer: Auf- und Abbauzeit + Ladezeit + Fahrzeit
    const newTotalDuration = packingTime + unpackingTime + loadingTime + totalTravelMinutes;
    
    console.log(`Aktualisiere Gesamtdauer: Aufbau (${packingTime}) + Abbau (${unpackingTime}) + Laden (${loadingTime}) + Fahrt (${totalTravelMinutes}) = ${newTotalDuration} Minuten`);
    
    setTotalDuration(newTotalDuration);
    
    // Da sich die Gesamtzeit geändert hat, aktualisiere auch die Personalkosten
    calculateLaborCosts(newTotalDuration);
  };

  // Extrahiere Packmaterialien aus roomsData und additionalInfo und berechne Kosten
  useEffect(() => {
    if (!roomsData || Object.keys(materialPrices).length === 0) return;
    
    const materials = {};
    
    // Durchlaufe alle Räume und sammle Packmaterialien
    Object.values(roomsData).forEach(room => {
      if (room.packMaterials && Array.isArray(room.packMaterials)) {
        room.packMaterials.forEach(material => {
          materials[material.name] = (materials[material.name] || 0) + material.quantity;
        });
      }
    });
    
    // Ersetze automatisch berechnete Karton-Mengen durch manuell eingegebene Werte
    if (additionalInfo && Array.isArray(additionalInfo)) {
      const umzugskartons = additionalInfo.find(
        f => f.name === 'Anzahl Umzugskartons' && f.type === 'number'
      )?.value || 0;
      
      const porzellankartons = additionalInfo.find(
        f => f.name === 'Anzahl Porzellankartons' && f.type === 'number'
      )?.value || 0;

      // Ersetze die automatisch berechneten Kartons durch die manuell eingegebenen Werte
      if (umzugskartons > 0) {
        materials['Umzugskartons (Standard)'] = umzugskartons;
        console.log(`Replaced automatic Umzugskartons with manual value: ${umzugskartons}`);
      }
      
      if (porzellankartons > 0) {
        materials['Bücherkartons (Bücher&Geschirr)'] = porzellankartons;
        console.log(`Replaced automatic Porzellankartons with manual value: ${porzellankartons}`);
      }
    }
    
    setPackMaterials(materials);
    
    // Berechne die Kosten anhand der Preise aus der Datenbank
    const materialCost = Object.entries(materials).reduce((total, [name, quantity]) => {
      // Verwende den Preis aus der Datenbank, oder 0 wenn nicht gefunden
      const price = materialPrices[name] || 0;
      console.log(`Material: ${name}, Menge: ${quantity}, Preis: ${price}€/Stück`);
      return total + price * quantity;
    }, 0);
    
    console.log(`Gesamte Materialkosten (inkl. manueller Kartons): ${materialCost}€`);
    setMaterialCosts(materialCost);
    
  }, [roomsData, materialPrices, additionalInfo]);

  // Effect to close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (truckDropdownRef.current && !truckDropdownRef.current.contains(event.target)) {
        setIsTruckDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handler for truck selection change
  const handleTruckSelectionChange = (kennzeichen) => {
    setSelectedTrucks(prevSelected =>
      prevSelected.includes(kennzeichen)
        ? prevSelected.filter(k => k !== kennzeichen) // Remove if already selected
        : [...prevSelected, kennzeichen] // Add if not selected
    );
  };

  // Function to get truck names from selected kennzeichen
  const getSelectedTruckNames = () => {
    return selectedTrucks
      .map(kennzeichen => Object.values(AVAILABLE_TRUCKS).find(truck => truck.kennzeichen === kennzeichen)?.name)
      .filter(Boolean)
      .join(', ');
  };

  // Helper function to categorize trucks for driver assignment
  const getTruckDriverCategory = (truckName) => {
    if (!truckName) return null;
    const lowerCaseName = truckName.toLowerCase();
    if (lowerCaseName.includes('12 tonner')) return '12T';
    if (lowerCaseName.includes('7,5 tonner') || lowerCaseName.includes('7.5 tonner') || lowerCaseName.includes('7,49 tonner')) return '7.5T';
    if (lowerCaseName.includes('ducato') || lowerCaseName.includes('mercedes 3,5 t') || lowerCaseName.includes('renault') || lowerCaseName.includes('3,5 tonner') || lowerCaseName.includes('3.5 tonner') || lowerCaseName.includes('3,49 tonner')) return '3.5T';
    return null; // Or a default category if needed
  };

  // --- Function to calculate driver counts based on selected trucks ---
  const calculateDriverCounts = () => {
    let count12T = 0;
    let count7_5T = 0;
    let count3_5T = 0;

    const selectedTruckDetails = selectedTrucks.map(kennzeichen =>
        Object.values(AVAILABLE_TRUCKS).find(truck => truck.kennzeichen === kennzeichen)
    ).filter(Boolean);

    selectedTruckDetails.forEach(truck => {
        const category = getTruckDriverCategory(truck.name);
        switch (category) {
            case '12T': count12T++; break;
            case '7.5T': count7_5T++; break;
            case '3.5T': count3_5T++; break;
            default: break; // Already warned in getTruckDriverCategory if needed
        }
    });

    setCalculatedDrivers({
        '12T': count12T,
        '7.5T': count7_5T,
        '3.5T': count3_5T,
    });
  };

  // --- useEffect to recalculate driver counts when trucks change ---
  useEffect(() => {
    calculateDriverCounts();
  }, [selectedTrucks]); // Dependency array includes selectedTrucks

  // Update handleContinue (calculation logic is now separate)
  const handleContinue = () => {
    console.log("🚀 handleContinue aufgerufen");
    console.log("   Aktuelle employeeTypes:", employeeTypes);
    console.log("   Aktuelle selectedEmployees:", selectedEmployees);
    
    // Use the state values for calculated drivers
    const driverCount12T = calculatedDrivers['12T'];
    const driverCount7_5T = calculatedDrivers['7.5T'];
    const driverCount3_5T = calculatedDrivers['3.5T'];

    const selectedTruckDetails = selectedTrucks.map(kennzeichen =>
        Object.values(AVAILABLE_TRUCKS).find(truck => truck.kennzeichen === kennzeichen)
    ).filter(Boolean);

    // --- Prepare Pipedrive Specific Data ---
    const pipedriveData = {
      // Fahrzeuge - Übertrage die IDs der ausgewählten Fahrzeuge
      [PIPEDRIVE_KEY_FAHRZEUGE]: selectedTrucks.map(kennzeichen => {
        const truck = Object.values(AVAILABLE_TRUCKS).find(t => t.kennzeichen === kennzeichen);
        console.log(`🚛 Fahrzeug gefunden:`, truck);
        console.log(`🚛 Fahrzeug-ID:`, truck?.id);
        return truck ? truck.id : kennzeichen; // Übertrage die ID, nicht den Namen
      }),
      
      // Fahrer werden jetzt dynamisch über pipedrive_field aus der Datenbank übertragen
      
      // Manuell ausgewählte Mitarbeiter (nach Typ)
      ...Object.entries(selectedEmployees).reduce((acc, [typeId, count]) => {
        console.log(`🔍 Verarbeite Mitarbeitertyp: typeId=${typeId}, count=${count}`);
        
        console.log(`🔍 Suche nach typeId: ${typeId} (Typ: ${typeof typeId})`);
        console.log(`🔍 Verfügbare employeeTypes:`, employeeTypes.map(t => ({ id: t.id, type: typeof t.id, name: t.name })));
        
        const employeeType = employeeTypes.find(type => type.id === typeId);
        console.log(`📋 Gefundener Mitarbeitertyp:`, employeeType);
        
        // Fallback: Versuche String-zu-Number Konvertierung
        if (!employeeType) {
          const numericTypeId = parseInt(typeId);
          console.log(`🔄 Versuche numerische Suche: ${numericTypeId}`);
          const numericEmployeeType = employeeTypes.find(type => type.id === numericTypeId);
          console.log(`📋 Numerischer Mitarbeitertyp:`, numericEmployeeType);
          
          if (numericEmployeeType) {
            console.log(`✅ Gefunden mit numerischer Suche!`);
            // Verwende den gefundenen Typ für die weitere Verarbeitung
            const foundType = numericEmployeeType;
            if (foundType && count > 0) {
              console.log(`✅ Mitarbeitertyp gefunden und count > 0: ${foundType.name}`);
              
              // Priorität 1: Verwende pipedrive_field aus der Datenbank
              if (foundType.pipedrive_field) {
                console.log(`🎯 Verwende pipedrive_field für ${foundType.name}: ${foundType.pipedrive_field} = ${count}`);
                acc[foundType.pipedrive_field] = count;
                console.log(`📤 Hinzugefügt zu Pipedrive-Data:`, { [foundType.pipedrive_field]: count });
                return acc;
              }
              
              console.log(`⚠️ Kein pipedrive_field für ${foundType.name}, versuche statische Mapping`);
              
              // Keine statischen Keys mehr - nur noch pipedrive_field aus der Datenbank
              console.warn(`❌ Kein pipedrive_field für Mitarbeitertyp: ${foundType.name} - bitte in der Datenbank konfigurieren`);
            }
            return acc;
          }
        }
        
        if (employeeType && count > 0) {
          console.log(`✅ Mitarbeitertyp gefunden und count > 0: ${employeeType.name}`);
          
          // Priorität 1: Verwende pipedrive_field aus der Datenbank
          if (employeeType.pipedrive_field) {
            console.log(`🎯 Verwende pipedrive_field für ${employeeType.name}: ${employeeType.pipedrive_field} = ${count}`);
            acc[employeeType.pipedrive_field] = count; // Als Zahl übertragen
            console.log(`📤 Hinzugefügt zu Pipedrive-Data:`, { [employeeType.pipedrive_field]: count });
            return acc;
          }
          
          console.log(`⚠️ Kein pipedrive_field für ${employeeType.name} - bitte in der Datenbank konfigurieren`);
          
          // Keine statischen Keys mehr - nur noch pipedrive_field aus der Datenbank
          console.warn(`❌ Kein pipedrive_field für Mitarbeitertyp: ${employeeType.name} - bitte in der Datenbank konfigurieren`);
        } else {
          console.log(`⏭️ Überspringe Mitarbeitertyp: employeeType=${!!employeeType}, count=${count}`);
        }
        return acc;
      }, {}),
      

    };

    console.log("📊 FINALE PIPEDRIVE-DATEN:", pipedriveData);
    
    // Debug-Ausgabe für Fahrzeuge
    console.log("🚛 Fahrzeug-Debug:");
    console.log(`   - selectedTrucks (Kennzeichen): ${JSON.stringify(selectedTrucks)}`);
    console.log(`   - Pipedrive-Fahrzeuge (IDs): ${JSON.stringify(pipedriveData[PIPEDRIVE_KEY_FAHRZEUGE])}`);
    
    // Debug-Ausgabe für Fahrer (dynamisch über pipedrive_field)
    console.log("👨‍💼 Fahrer-Debug:");
    console.log(`   - Fahrer werden jetzt dynamisch über pipedrive_field übertragen`);
    
    // Debug-Ausgabe für Mitarbeitertypen
    console.log("👥 Mitarbeitertypen-Debug:");
    employeeTypes.forEach(type => {
      console.log(`   - ${type.name}: pipedrive_field=${type.pipedrive_field || 'NICHT GESETZT'}`);
    });
    
    // Debug-Ausgabe für ausgewählte Mitarbeiter
    console.log("✅ Ausgewählte Mitarbeiter:");
    console.log("   selectedEmployees:", selectedEmployees);
    console.log("   employeeTypes:", employeeTypes);
    
    Object.entries(selectedEmployees).forEach(([typeId, count]) => {
      if (count > 0) {
        console.log(`   🔍 Suche Mitarbeitertyp für typeId: ${typeId}`);
        const employeeType = employeeTypes.find(type => type.id === typeId);
        console.log(`   📋 Gefundener Typ:`, employeeType);
        
        if (employeeType) {
          console.log(`   ✅ ${employeeType.name}: ${count} Personen (pipedrive_field: ${employeeType.pipedrive_field || 'NICHT GESETZT'})`);
        } else {
          console.error(`   ❌ FEHLER: Kein Mitarbeitertyp gefunden für typeId: ${typeId}`);
          console.log(`   🔍 Verfügbare employeeTypes IDs:`, employeeTypes.map(t => t.id));
        }
      }
    });
    
    // Finale Pipedrive-Übersicht
    console.log("🎯 PIPEDRIVE-ÜBERTRAGUNG ZUSAMMENFASSUNG:");
    console.log("   Alle Keys die übertragen werden:");
    Object.entries(pipedriveData).forEach(([key, value]) => {
      console.log(`   - ${key}: ${JSON.stringify(value)}`);
    });

    // --- Prepare the final result object ---
    const result = {
      totalVolume,
      packingTime,
      unpackingTime,
      totalDuration,
      team: {
        employees: selectedEmployees,
        employeeTypes: employeeTypes,
        totalCount: getTotalEmployees(),
        timePerEmployee: getTimePerEmployee(),
        laborCosts: laborCosts,
        calculatedDrivers: calculatedDrivers
      },
      travel: {
        costs: travelCosts,
        routeDetails: routeDetails
      },
      packMaterials,
      materialCosts,
      travelTimeMinutes,
      selectedTrucks: selectedTruckDetails,
      totalCost: laborCosts.total + materialCosts,
      pipedriveUpdateData: pipedriveData
    };

    console.log("Final result object passed to onComplete:", result);
    console.log("pipedriveUpdateData in result:", result.pipedriveUpdateData);
    console.log("pipedriveUpdateData keys:", Object.keys(result.pipedriveUpdateData || {}));
    onComplete(result);
  };

  // Update useEffect to initialize editable times when calculated times change
  useEffect(() => {
    setEditableTimes({
      setup: packingTime,
      dismantle: unpackingTime,
      loading: loadingTime,
      travel: travelTimeMinutes
    });
  }, [packingTime, unpackingTime, loadingTime, travelTimeMinutes]);

  // Add handler for time changes
  const handleTimeChange = (type, value) => {
    const newValue = Math.max(0, parseInt(value) || 0);
    setEditableTimes(prev => ({
      ...prev,
      [type]: newValue
    }));

    // Update total duration when any time changes
    const newTotal = Object.values({
      ...editableTimes,
      [type]: newValue
    }).reduce((sum, time) => sum + time, 0);

    setTotalDuration(newTotal);
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 pb-4 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-center text-gray-800">
            Umzugsberechnung
          </h2>
        </div>
        
        <div className="p-4 lg:p-6">
          {loading ? (
            <div className="text-center py-24">
              <div className="animate-spin h-12 w-12 mb-6 mx-auto border-4 border-primary border-t-transparent rounded-full"></div>
              <p className="text-gray-600 text-lg">Berechne Umzugsdetails...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Linke Spalte: Umzugsdetails und Fahrtzeit */}
              <div className="space-y-8">
                {/* 1. Umzugsvolumen */}
                <div className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Package className="h-5 w-5 text-primary mr-3" />
                    Umzugsvolumen
                  </h3>
                  <div className="bg-gray-50 p-5 rounded-lg">
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium text-gray-700">Gesamtvolumen</span>
                      <span className="text-lg font-semibold text-primary">{totalVolume.toFixed(2)} m³</span>
                    </div>
                  </div>
                </div>
                
                {/* 2. Adresseingabe und Fahrtzeit */}
                <div className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Truck className="h-5 w-5 text-primary mr-3" />
                    Transportdetails
                  </h3>
                  <div className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start-Adresse
                        </label>
                        <input
                          id="origin-input"
                          type="text"
                          value={locations.origin}
                          onChange={(e) => setLocations(prev => ({...prev, origin: e.target.value}))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                          placeholder="Beladeadresse..."
                          ref={(input) => {
                            if (input && !input.getAttribute('data-autocomplete-initialized') && window.google) {
                              const autocomplete = new window.google.maps.places.Autocomplete(input, {
                                types: ['address'],
                                componentRestrictions: { country: 'de' }
                              });
                              autocomplete.addListener('place_changed', () => {
                                const place = autocomplete.getPlace();
                                if (place.formatted_address) {
                                  setLocations(prev => ({...prev, origin: place.formatted_address}));
                                }
                              });
                              input.setAttribute('data-autocomplete-initialized', 'true');
                            }
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ziel-Adresse
                        </label>
                        <input
                          id="destination-input"
                          type="text"
                          value={locations.destination}
                          onChange={(e) => setLocations(prev => ({...prev, destination: e.target.value}))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                          placeholder="Entladeadresse..."
                          ref={(input) => {
                            if (input && !input.getAttribute('data-autocomplete-initialized') && window.google) {
                              const autocomplete = new window.google.maps.places.Autocomplete(input, {
                                types: ['address'],
                                componentRestrictions: { country: 'de' }
                              });
                              autocomplete.addListener('place_changed', () => {
                                const place = autocomplete.getPlace();
                                if (place.formatted_address) {
                                  setLocations(prev => ({...prev, destination: place.formatted_address}));
                                }
                              });
                              input.setAttribute('data-autocomplete-initialized', 'true');
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Truck Selection Dropdown */}
                    <div className="relative" ref={truckDropdownRef}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fahrzeugauswahl (bestimmt Fahreranzahl)
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsTruckDropdownOpen(!isTruckDropdownOpen)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors flex justify-between items-center text-left bg-white"
                      >
                        <span className="text-gray-700 truncate pr-2">
                          {selectedTrucks.length > 0
                            ? `${selectedTrucks.length} Fahrzeug(e) ausgewählt: ${getSelectedTruckNames()}`
                            : 'Fahrzeuge auswählen...'}
                        </span>
                        <ChevronDown size={18} className={`text-gray-500 transition-transform ${isTruckDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isTruckDropdownOpen && (
                        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {Object.values(AVAILABLE_TRUCKS).map(truck => (
                            <label
                              key={truck.kennzeichen}
                              className="flex items-center px-4 py-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                            >
                              <input
                                type="checkbox"
                                checked={selectedTrucks.includes(truck.kennzeichen)}
                                onChange={() => handleTruckSelectionChange(truck.kennzeichen)}
                                className="mr-3 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                              />
                              <div className="flex-grow">
                                <span className="font-medium text-gray-800">{truck.name}</span>
                                <p className="text-xs text-gray-500">{truck.kennzeichen} ({truck.length}m x {truck.width}m x {truck.height}m)</p>
                              </div>
                            </label>
                          ))}
                           <button
                              onClick={() => setIsTruckDropdownOpen(false)}
                              className="sticky bottom-0 w-full bg-gray-50 hover:bg-gray-100 text-center py-2 text-sm text-gray-600 border-t"
                           >
                             Schließen
                           </button>
                        </div>
                      )}
                    </div>

                    {isCalculatingRoute ? (
                      <div className="flex items-center justify-center py-4 bg-gray-50 rounded-lg">
                        <div className="animate-spin h-5 w-5 mr-2 border-2 border-primary border-t-transparent rounded-full"></div>
                        <span>Berechne Route...</span>
                      </div>
                    ) : routeDetails ? (
                      <div className="bg-gray-50 p-5 rounded-lg">
                        <h4 className="font-medium mb-4 text-gray-800">Komplette Routenplanung:</h4>
                        
                        <div className="space-y-5">
                          <div className="flex items-start bg-white p-3 rounded-lg shadow-sm">
                            <div className="bg-primary text-white rounded-full h-7 w-7 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">1</div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">Office → Beladeadresse</p>
                              <p className="text-gray-600 mt-1">{routeDetails.segments[0].distance} • {routeDetails.segments[0].duration}</p>
                              <p className="text-xs text-gray-500">{OFFICE_ADDRESS} → {locations.origin}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start bg-white p-3 rounded-lg shadow-sm">
                            <div className="bg-primary text-white rounded-full h-7 w-7 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">2</div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">Beladeadresse → Entladeadresse</p>
                              <p className="text-gray-600 mt-1">{routeDetails.segments[1].distance} • {routeDetails.segments[1].duration}</p>
                              <p className="text-xs text-gray-500">{locations.origin} → {locations.destination}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start bg-white p-3 rounded-lg shadow-sm">
                            <div className="bg-primary text-white rounded-full h-7 w-7 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">3</div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">Entladeadresse → Office</p>
                              <p className="text-gray-600 mt-1">{routeDetails.segments[2].distance} • {routeDetails.segments[2].duration}</p>
                              <p className="text-xs text-gray-500">{locations.destination} → {OFFICE_ADDRESS}</p>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-gray-200 bg-white p-4 rounded-lg shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-gray-700">Gesamtstrecke:</span>
                              <span className="font-bold text-primary">{routeDetails.distance}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-700">Gesamtfahrzeit:</span>
                              <span className="font-bold text-primary">{routeDetails.duration}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-lg text-gray-500">
                        {locations.origin && locations.destination ? 
                          "Route wird berechnet..." : 
                          "Bitte geben Sie die Belade- und Entladeadresse ein"}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 3. Zeitaufwand */}
                <div className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Clock className="h-5 w-5 text-primary mr-3" />
                    Zeitaufwand
                  </h3>
                  <div className="bg-gray-50 p-5 rounded-lg">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-gray-200">
                        <span className="text-gray-700">Aufbauzeit</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editableTimes.setup}
                            onChange={(e) => handleTimeChange('setup', e.target.value)}
                            className="w-20 p-1 border border-gray-300 rounded text-right"
                            min="0"
                          />
                          <span className="text-gray-500">Min.</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center py-3 border-b border-gray-200">
                        <span className="text-gray-700">Abbauzeit</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editableTimes.dismantle}
                            onChange={(e) => handleTimeChange('dismantle', e.target.value)}
                            className="w-20 p-1 border border-gray-300 rounded text-right"
                            min="0"
                          />
                          <span className="text-gray-500">Min.</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center py-3 border-b border-gray-200">
                        <span className="text-gray-700">Ladezeit</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editableTimes.loading}
                            onChange={(e) => handleTimeChange('loading', e.target.value)}
                            className="w-20 p-1 border border-gray-300 rounded text-right"
                            min="0"
                          />
                          <span className="text-gray-500">Min.</span>
                        </div>
                      </div>
                      
                      {routeDetails && (
                        <div className="flex justify-between items-center py-3 border-b border-gray-200">
                          <span className="text-gray-700">Fahrtzeit (Hin & Rück)</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={editableTimes.travel}
                              onChange={(e) => handleTimeChange('travel', e.target.value)}
                              className="w-20 p-1 border border-gray-300 rounded text-right"
                              min="0"
                            />
                            <span className="text-gray-500">Min.</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center py-3 mt-1 bg-white rounded-lg p-3 shadow-sm">
                        <span className="font-semibold text-gray-800">Gesamtzeit</span>
                        <span className="font-bold text-lg text-primary">{totalDuration} Minuten</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Packmaterialien */}
                <div className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Package className="h-5 w-5 text-primary mr-3" />
                    Packmaterialien
                  </h3>
                  
                  {Object.entries(packMaterials).length > 0 ? (
                    <div className="bg-gray-50 p-5 rounded-lg">
                      {Object.entries(packMaterials).map(([name, quantity]) => {
                        // Prüfe ob diese Menge aus additionalInfo stammt
                        const isFromAdditionalInfo = additionalInfo && Array.isArray(additionalInfo) && (
                          (name === 'Umzugskartons (Standard)' && additionalInfo.find(f => f.name === 'Anzahl Umzugskartons' && f.type === 'number')?.value > 0) ||
                          (name === 'Bücherkartons (Bücher&Geschirr)' && additionalInfo.find(f => f.name === 'Anzahl Porzellankartons' && f.type === 'number')?.value > 0)
                        );
                        
                        return (
                          <div key={name} className="flex justify-between items-center py-3 border-b border-gray-200 last:border-0">
                            <div>
                              <span className="text-gray-700">{name}</span>
                              {isFromAdditionalInfo && (
                                <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                  + manuell
                                </span>
                              )}
                              {materialPrices[name] ? (
                                <p className="text-sm text-gray-500">
                                  à {materialPrices[name].toFixed(2)}€
                                </p>
                              ) : null}
                            </div>
                            <span className="font-semibold">{quantity}x</span>
                          </div>
                        );
                      })}
                      
                      <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-300 bg-white rounded-lg p-3 shadow-sm">
                        <span className="font-semibold text-gray-800">Materialkosten:</span>
                        <span className="font-bold text-primary">{materialCosts.toFixed(2)}€</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
                      Keine Packmaterialien ausgewählt
                    </div>
                  )}
                </div>
              </div>
              
              {/* Rechte Spalte: Personalkosten und Gesamtkosten */}
              <div className="space-y-8">
                {/* 4. Personalaufwand */}
                <div className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Users className="h-5 w-5 text-primary mr-3" />
                    Personalaufwand
                  </h3>

                  {/* --- Display Selected Trucks for Pipedrive --- */}
                  {selectedTrucks.length > 0 && (
                    <div className="mb-6 bg-purple-50 border border-purple-200 p-4 rounded-lg">
                        <h4 className="font-medium mb-3 text-purple-800">Ausgewählte Fahrzeuge (für Pipedrive):</h4>
                        <div className="space-y-2 text-sm">
                            {selectedTrucks.map(kennzeichen => {
                              const truck = Object.values(AVAILABLE_TRUCKS).find(t => t.kennzeichen === kennzeichen);
                              return (
                                <div key={kennzeichen} className="flex justify-between">
                                    <span className="text-gray-700">{truck?.name || kennzeichen}:</span>
                                    <span className="font-mono text-purple-600">{kennzeichen}</span>
                                </div>
                              );
                            })}
                        </div>
                        <p className="text-xs text-purple-600 mt-3 italic">Diese Fahrzeuge werden an Pipedrive übertragen.</p>
                    </div>
                  )}

                  {/* --- Display Calculated Drivers --- */}
                  <div className="mb-6 bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <h4 className="font-medium mb-3 text-blue-800">Benötigte Fahrer (automatisch):</h4>
                      <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                              <span className="text-gray-700">Fahrer 12T (C, CE):</span>
                              <span className="font-semibold text-blue-700">{calculatedDrivers['12T']}</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="text-gray-700">Fahrer 7,49T (C1, C, CE):</span>
                              <span className="font-semibold text-blue-700">{calculatedDrivers['7.5T']}</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="text-gray-700">Fahrer 3,49T (B, BE, C1, C, CE):</span>
                              <span className="font-semibold text-blue-700">{calculatedDrivers['3.5T']}</span>
                          </div>
                      </div>
                      <p className="text-xs text-blue-600 mt-3 italic">Basierend auf der Fahrzeugauswahl. Diese werden automatisch in Pipedrive eingetragen.</p>
                  </div>

                  {/* --- Manual Employee Selection --- */}
                  <h4 className="font-medium mb-4 text-gray-700">Zusätzliches Personal manuell hinzufügen:</h4>
                  
                  {/* Pipedrive-Keys Debug-Info */}
                  {employeeTypes.some(type => type.pipedrive_field) && (
                    <div className="mb-4 bg-green-50 border border-green-200 p-3 rounded-lg">
                      <h5 className="font-medium text-green-800 mb-2">Pipedrive-Integration aktiv:</h5>
                      <div className="space-y-1 text-sm">
                        {employeeTypes
                          .filter(type => type.pipedrive_field)
                          .map(type => (
                            <div key={type.id} className="flex justify-between">
                              <span className="text-green-700">{type.name}:</span>
                              <span className="font-mono text-green-600">{type.pipedrive_field}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  <div className="bg-gray-50 p-5 rounded-lg">
                    {employeeTypes.map(type => (
                      // Filter out driver types if they should ONLY be calculated automatically
                      // Or keep them if manual override/addition is desired
                      // Example: Filter out based on name
                      // !type.name.toLowerCase().includes('fahrer') && (
                      <div key={type.id} className="flex justify-between items-center py-3 border-b border-gray-200 last:border-0">
                        <div>
                          <span className="font-medium text-gray-800">{type.name}</span>
                          <p className="text-sm text-gray-500">
                            Stundensatz: {type.price.toFixed(2)}€/h
                          </p>
                          {type.pipedrive_field && (
                            <p className="text-xs text-green-600 font-mono">
                              Pipedrive: {type.pipedrive_field}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center">
                          <button
                            onClick={() => handleEmployeeChange(type.id, -1)}
                            className="p-1.5 rounded-md bg-gray-200 hover:bg-gray-300 transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="mx-3 w-8 text-center font-semibold">{selectedEmployees[type.id] || 0}</span>
                          <button
                            onClick={() => handleEmployeeChange(type.id, 1)}
                            className="p-1.5 rounded-md bg-gray-200 hover:bg-gray-300 transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                      // )
                    ))}

                    <div className="flex justify-between items-center mt-5 pt-3 border-t border-gray-300 bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex items-center text-gray-800">
                        <Users className="mr-2 h-5 w-5 text-primary" />
                        <span className="font-semibold">Gesamtteam (manuell gewählt)</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-primary">{getTotalEmployees()} Personen</span>
                        <div className="text-sm text-gray-600 mt-1">
                          <div>Arbeitszeit: ~{Math.round((packingTime + unpackingTime + loadingTime) / Math.max(1, getTotalEmployees()))} Min./Person</div>
                          <div>Fahrtzeit: {Math.round(travelTimeMinutes)} Min. (konstant)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 5. Kostenrechnung */}
                <div className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979a1 1 0 10-1.472 1.342L8.6 9.979 6.5 12.088a1 1 0 101.414 1.414L10 11.414l2.086 2.088a1 1 0 001.414-1.414l-2.086-2.088 1.336-1.658a1 1 0 10-1.472-1.342L9.414 8.979l-1.658-1.658a.997.997 0 00-.02-.02z" clipRule="evenodd" />
                    </svg>
                    Kostenübersicht
                  </h3>
                  <div className="bg-gray-50 p-5 rounded-lg">
                    {employeeTypes.map(type => {
                      const typeData = laborCosts.byType[type.id] || { count: 0, hourlyRate: 0, hours: 0, cost: 0 };
                      if (typeData.count === 0) return null;
                      
                      return (
                        <div key={`cost-${type.id}`} className="flex justify-between items-center py-3 border-b border-gray-200 last:border-0">
                          <div>
                            <span className="font-medium text-gray-800">{type.name}</span>
                            <p className="text-sm text-gray-500">
                              {typeData.count} × {typeData.hourlyRate.toFixed(2)}€/h × {typeData.hours.toFixed(1)}h
                            </p>
                          </div>
                          <div className="font-bold text-right text-gray-800">
                            {typeData.cost.toFixed(2)}€
                          </div>
                        </div>
                      );
                    })}
                    
                    <div className="flex justify-between items-center py-3 border-b border-gray-200">
                      <span className="font-medium text-gray-700">Personalkosten</span>
                      <span className="font-semibold">{laborCosts.total.toFixed(2)}€</span>
                    </div>

                    {materialCosts > 0 && (
                      <div className="flex justify-between items-center py-3 border-b border-gray-200">
                        <span className="font-medium text-gray-700">Materialkosten</span>
                        <span className="font-semibold">{materialCosts.toFixed(2)}€</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center py-4 mt-3 bg-primary bg-opacity-10 rounded-lg p-4">
                      <span className="font-bold text-gray-900">Gesamtpreis</span>
                      <span className="text-xl font-bold text-primary">{(laborCosts.total + materialCosts).toFixed(2)}€</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-gray-200 flex justify-end">
            <button
                onClick={handleContinue}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-colors"
                disabled={loading} // Disable button while loading/calculating
            >
                Berechnung abschließen & Weiter
            </button>
        </div>
      </div>
    </div>
  );
};

export default MovingCalculation; 