import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Users, Search, Filter, Calendar, X, Download, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import axios from 'axios';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const EmployeeScheduling = ({ onBack }) => {
  // State für Datum und Zeitraum
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(addDays(new Date(), 7));
  const [selectedDate, setSelectedDate] = useState(new Date());

  // State für Mitarbeiter
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dealsuche und Auswahl
  const [dealSearchTerm, setDealSearchTerm] = useState('');
  const [deals, setDeals] = useState([]);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [dealError, setDealError] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);

  // Auswahl von Mitarbeitern für den Deal
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [appointmentStartTime, setAppointmentStartTime] = useState('08:00');
  const [appointmentEndTime, setAppointmentEndTime] = useState('16:00');
  
  // Fahrzeuge aus Deal-Mehrfachauswahl
  const [dealVehicles, setDealVehicles] = useState([]);
  const [selectedVehicles, setSelectedVehicles] = useState([]);

  // Hilfsfunktionen
  const formatCurrency = (value, currency) => {
    if (!value) return '0,00 €';
    try {
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: currency || 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    } catch {
      return `${value} ${currency || 'EUR'}`;
    }
  };

  const renderStatus = (status) => {
    const statusStyles = {
      open: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800',
      won: 'bg-blue-100 text-blue-800',
      default: 'bg-gray-100 text-gray-800'
    };
    const statusLabels = {
      open: 'Offen',
      lost: 'Verloren',
      won: 'Gewonnen',
      default: 'Unbekannt'
    };
    const style = statusStyles[status] || statusStyles.default;
    const label = statusLabels[status] || statusLabels.default;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style}`}>
        {label}
      </span>
    );
  };

  // State für erweiterte Filter
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    // Führerscheinklassen
    driverLicenses: [],
    // Spezielle Fähigkeiten
    pianoCarrier: null, // null, 'Ja', 'Nein'
    foreman: null,
    assembly: null,
    hasCar: null,
    // Verfügbarkeit
    onlyAvailable: false,
    onlyBusy: false,
  });

  // Verfügbare Führerscheinklassen
  const licenseClasses = ['B', 'C1', 'C', 'CE', 'C1E', 'BE'];

  // API URLs
  // WICHTIG: URLs müssen über den Proxy gehen (lolworlds.online/api/...)
  const SERVICEPROVIDER_API_URL = process.env.REACT_APP_SERVICEPROVIDER_API_URL || 'https://lolworlds.online/api/serviceprovider/getServiceprovider';
  const SFS_API_TOKEN = process.env.REACT_APP_SFS_API_TOKEN;
  const PIPEDRIVE_API_TOKEN = process.env.REACT_APP_PIPEDRIVE_API_TOKEN;

  // Pipedrive benutzerdefinierte Feld-Keys (essentielle Planung)
  const PD_FIELD_DRIVER_12T = 'a1ee000b4ac48779cfb43f1319bd37250705ddaf';
  const PD_FIELD_DRIVER_7T5 = 'ebb714ecc0028be711b63573a871504b2268b58e';
  const PD_FIELD_DRIVER_3T5 = 'e6141bc6608c18bad305abbc4d7e871fe6451d8f';
  const PD_FIELD_MONTEURE = '20b3d99d25f0a4f3377e94f4731cd6089c421831';
  const PD_FIELD_HELPERS = '34b7e1187558cb432b19593871c7f8599de16b22';
  const PD_FIELD_PIANO = '92fe9d2c1d616504b461a2dfdc2e17f5bd73d754';
  const PD_FIELD_VEHICLES = '7ef0bad215357130769f5d26e0b47c5c55da239d';
  // Pipedrive Leistungsdatum (Projekt-/Servicedatum) Feld-Key – Format: Date
  const PD_FIELD_SERVICE_DATE = '949696aa9d99044db90383a758a74675587ed893';
  
  // Fahrzeug-Typen (echte IDs und Kennzeichen)
  const vehicleTypes = [
    { id: '907', name: '12 Tonner', icon: '🚛', kennzeichen: 'KA AR 577', terminartId: '3a4df8a1-2387-11e8-839c-00113241b9d5' },
    { id: '908', name: '7,5 Tonner', icon: '🚚', kennzeichen: 'KA AR 583', terminartId: '3a4df8a1-2387-11e8-839c-00113241b9d5' },
    { id: '909', name: '7,5 Tonner', icon: '🚚', kennzeichen: 'KA AR 578', terminartId: '3a4df8a1-2387-11e8-839c-00113241b9d5' },
    { id: '910', name: '3,5 Tonner', icon: '🚐', kennzeichen: 'KA AR 581', terminartId: '3a4df8a1-2387-11e8-839c-00113241b9d5' },
    { id: '911', name: '3,5 Tonner', icon: '🚐', kennzeichen: 'KA AR 579', terminartId: '3a4df8a1-2387-11e8-839c-00113241b9d5' },
    { id: '912', name: '3,5 Tonner', icon: '🚐', kennzeichen: 'KA AR 586', terminartId: '3a4df8a1-2387-11e8-839c-00113241b9d5' },
    { id: '913', name: 'Caddy', icon: '🚐', kennzeichen: 'KA AR 580', terminartId: '3a4df8a1-2387-11e8-839c-00113241b9d5' },
    { id: '914', name: 'Amarok', icon: '🚐', kennzeichen: 'KA AR 576', terminartId: '3a4df8a1-2387-11e8-839c-00113241b9d5' }
  ];
  

  const getDealCounts = (item) => {
    // Erweiterte Debug-Ausgabe
    console.log('🔍 Vollständiges Deal-Objekt:', item);
    console.log('🔍 Alle verfügbaren Felder:', Object.keys(item || {}));
    
    const rawValues = {
      [PD_FIELD_DRIVER_12T]: item?.[PD_FIELD_DRIVER_12T],
      [PD_FIELD_DRIVER_7T5]: item?.[PD_FIELD_DRIVER_7T5],
      [PD_FIELD_DRIVER_3T5]: item?.[PD_FIELD_DRIVER_3T5],
      [PD_FIELD_MONTEURE]: item?.[PD_FIELD_MONTEURE],
      [PD_FIELD_HELPERS]: item?.[PD_FIELD_HELPERS],
      [PD_FIELD_PIANO]: item?.[PD_FIELD_PIANO]
    };
    
    console.log('🔍 Deal-Rohdaten (Fahrer-Felder):', rawValues);
    console.log('🔍 Feld-Typen:', {
      driver12t: typeof rawValues[PD_FIELD_DRIVER_12T],
      driver7t5: typeof rawValues[PD_FIELD_DRIVER_7T5],
      driver3t5: typeof rawValues[PD_FIELD_DRIVER_3T5],
      monteure: typeof rawValues[PD_FIELD_MONTEURE],
      helpers: typeof rawValues[PD_FIELD_HELPERS],
      piano: typeof rawValues[PD_FIELD_PIANO]
    });
    
    // Robustere Konvertierung für verschiedene Datentypen
    const parseCount = (value) => {
      if (value === null || value === undefined || value === '') return 0;
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };
    
    const counts = {
      driver12t: parseCount(rawValues[PD_FIELD_DRIVER_12T]),
      driver7t5: parseCount(rawValues[PD_FIELD_DRIVER_7T5]),
      driver3t5: parseCount(rawValues[PD_FIELD_DRIVER_3T5]),
      monteure: parseCount(rawValues[PD_FIELD_MONTEURE]),
      helpers: parseCount(rawValues[PD_FIELD_HELPERS]),
      piano: parseCount(rawValues[PD_FIELD_PIANO])
    };
    
    console.log('📊 Berechnete Anforderungen:', counts);
    console.log('📊 Summe aller Fahrer:', counts.driver12t + counts.driver7t5 + counts.driver3t5);
    
    // Verarbeite Fahrzeug-Mehrfachauswahl aus Deal
    const vehicles = item?.[PD_FIELD_VEHICLES];
    if (vehicles) {
      console.log('🚗 Fahrzeug-Mehrfachauswahl aus Deal:', vehicles);
      let vehicleIds = [];
      
      if (Array.isArray(vehicles)) {
        vehicleIds = vehicles;
      } else if (typeof vehicles === 'string') {
        // Komma-getrennte String zu Array konvertieren
        vehicleIds = vehicles.split(',').map(v => v.trim()).filter(v => v);
      }
      
      console.log('🚗 Fahrzeug-IDs:', vehicleIds);
      
      // Finde entsprechende Fahrzeug-Typen
      const selectedVehicleTypes = vehicleIds.map(id => 
        vehicleTypes.find(vt => vt.id === id)
      ).filter(vt => vt); // Entferne undefined
      
      console.log('🚗 Gefundene Fahrzeug-Typen:', selectedVehicleTypes);
      return { ...counts, vehicles: selectedVehicleTypes };
    }
    
    return counts;
  };

  // State für Fahrzeuge
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // Lade Fahrzeuge mit Status und Verfügbarkeit
  const fetchVehicles = useCallback(async () => {
    if (!SFS_API_TOKEN) {
      console.error('❌ Kein API-Token konfiguriert! Bitte REACT_APP_SFS_API_TOKEN in .env setzen.');
      return;
    }

    setLoadingVehicles(true);

    try {
      const dateFrom = format(startDate, 'yyyy-MM-dd');
      const dateTo = format(endDate, 'yyyy-MM-dd');

      const requestBody = {
        date_from: dateFrom,
        date_to: dateTo,
        joins: [
          "Vertraege",
          "Eigenschaften",
          "Termine"
        ]
      };

      console.log(`📥 [API] ServiceProvider - Fahrzeuge laden (${dateFrom} bis ${dateTo})`);

      const response = await axios.post(SERVICEPROVIDER_API_URL, requestBody, {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': SFS_API_TOKEN
        }
      });

      if (response.data && Array.isArray(response.data)) {
        const vehicles = response.data
          .filter(item => {
            // Nur Fahrzeuge laden (staff_status_Fuhrpark_Maschinen: null)
            const eigenschaften = item.Eigenschaften || {};
            return eigenschaften['staff_status_Fuhrpark_Maschinen '] === null;
          })
          .map(item => {
            const emp = item.Teammitglied || item;
            
            return {
              id: emp.Id || emp.id || emp.personalid || emp.uuid,
              name: emp.name || `${emp.Vorname || emp.vorname || ''} ${emp.Nachname || emp.nachname || ''}`.trim() || 'Unbekannt',
              eigenschaften: item.Eigenschaften || emp.Eigenschaften || {},
              vertraege: item.Vertraege || emp.Vertraege || [],
              termine: item.Termine || emp.Termine || [],
              // Berechne Verfügbarkeit für den Zeitraum (wie bei Mitarbeitern)
              availabilityStatus: calculateAvailability(item.Termine || emp.Termine || [], startDate, endDate),
              // Zusätzliche Fahrzeug-spezifische Eigenschaften
              isVehicle: true,
              vehicleType: item.Eigenschaften?.vehicle_type || 'Unbekannt',
              status: item.Eigenschaften?.status || 'Verfügbar'
            };
          });

        setAvailableVehicles(vehicles);
        console.log(`✅ [API] ServiceProvider - ${vehicles.length} Fahrzeuge geladen`);
        return vehicles;
      } else {
        setAvailableVehicles([]);
        return [];
      }
    } catch (error) {
      console.error('❌ [API] ServiceProvider - Fehler beim Laden der Fahrzeuge:', error);
      setAvailableVehicles([]);
      return [];
    } finally {
      setLoadingVehicles(false);
    }
  }, [startDate, endDate, SERVICEPROVIDER_API_URL, SFS_API_TOKEN]);

  // Lizenzen pro Fahrer-Rolle, genutzt um Filter zu setzen und Auswahl zu zählen
  const getRequiredLicensesForRole = (roleKey) => {
    switch (roleKey) {
      case 'driver12t':
        return ['C', 'CE'];
      case 'driver7t5':
        return ['C1', 'C', 'CE'];
      case 'driver3t5':
        return ['B', 'BE', 'C1', 'C', 'CE'];
      default:
        return [];
    }
  };

  // Prüft, ob Mitarbeiter eine der geforderten Klassen besitzt
  const employeeHasAnyLicense = (employee, required) => {
    if (!required || required.length === 0) return false;
    const val = employee?.eigenschaften?.personal_properties_Fhrerscheinklasse;
    if (!val || typeof val !== 'string') return false;
    const empClasses = val.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
    return required.some(req => empClasses.includes(req));
  };

  const countSelectedForRole = (roleKey) => {
    return selectedEmployees.filter(e => Array.isArray(e.roles) && e.roles.includes(roleKey)).length;
  };

  const applyRoleFilter = (roleKey) => {
    // Setzt Filter abhängig von der Rolle und öffnet die Filtersektion
    const defaultFilters = {
      driverLicenses: [],
      pianoCarrier: null,
      foreman: null,
      assembly: null,
      hasCar: null,
      onlyAvailable: false,
      onlyBusy: false,
    };

    if (roleKey === 'monteure') {
      setFilters({ ...defaultFilters, assembly: 'Ja' });
      setShowFilters(true);
      return;
    }
    if (roleKey === 'piano') {
      setFilters({ ...defaultFilters, pianoCarrier: 'Ja' });
      setShowFilters(true);
      return;
    }
    if (roleKey === 'helpers') {
      // Helpers haben keinen speziellen Filter; alle anderen Filter zurücksetzen
      setFilters({ ...defaultFilters });
      setShowFilters(true);
      return;
    }
    const classes = getRequiredLicensesForRole(roleKey);
    if (classes.length > 0) {
      setFilters({ ...defaultFilters, driverLicenses: classes });
      setShowFilters(true);
    }
  };

  // Mitarbeiter laden
  const fetchEmployees = useCallback(async () => {
    if (!SFS_API_TOKEN) {
      console.error('❌ Kein API-Token konfiguriert! Bitte REACT_APP_SFS_API_TOKEN in .env setzen.');
      return;
    }

    setLoadingEmployees(true);

    try {
      const dateFrom = format(startDate, 'yyyy-MM-dd');
      const dateTo = format(endDate, 'yyyy-MM-dd');

      // Baue die Skill-Anforderungen basierend auf den Filtern auf
      const skillRequirements = {};

      // Führerschein-Filter
      if (filters.driverLicenses.length > 0) {
        skillRequirements.personal_properties_Fhrerscheinklasse = filters.driverLicenses;
      }

      // Auto-Filter
      if (filters.hasCar === 'Ja') {
        skillRequirements.personal_properties_Auto = 'Ja';
      }

      // Klavierträger-Filter
      if (filters.pianoCarrier === 'Ja') {
        skillRequirements.personal_properties_Klavierträger = 'Ja';
      }

      // Vorarbeiter-Filter
      if (filters.foreman === 'Ja') {
        skillRequirements.personal_properties_Vorarbeiter = 'Ja';
      }

      // Montagen-Filter
      if (filters.assembly === 'Ja') {
        skillRequirements.personal_properties_Montagen = 'Ja';
      }

      const requestBody = {
        date_from: dateFrom,
        date_to: dateTo,
        skill: Object.keys(skillRequirements).length > 0 ? skillRequirements : undefined,
        joins: [
          "Vertraege",
          "Eigenschaften",
          "Termine"
        ]
      };

      console.log(`📥 [API] ServiceProvider - Mitarbeiter laden (${dateFrom} bis ${dateTo})`);

      const response = await axios.post(SERVICEPROVIDER_API_URL, requestBody, {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': SFS_API_TOKEN  // Direktes Token ohne "Bearer"
        }
      });

      if (response.data && Array.isArray(response.data)) {
        const processedEmployees = response.data
          .filter(item => {
            // Nur aktive Mitarbeiter laden (sp_teammember: null) UND keine Fahrzeuge
            const eigenschaften = item.Eigenschaften || {};
            const isActiveEmployee = eigenschaften.sp_teammember === null;
            const isVehicle = eigenschaften['staff_status_Fuhrpark_Maschinen '] === null;
            
            // Nur aktive Mitarbeiter, die KEINE Fahrzeuge sind
            return isActiveEmployee && !isVehicle;
          })
          .map(item => {
            const emp = item.Teammitglied || item;
            
            return {
              id: emp.Id || emp.id || emp.personalid || emp.uuid,
              name: emp.name || `${emp.Vorname || emp.vorname || ''} ${emp.Nachname || emp.nachname || ''}`.trim() || 'Unbekannt',
              eigenschaften: item.Eigenschaften || emp.Eigenschaften || {},
              vertraege: item.Vertraege || emp.Vertraege || [],
              termine: item.Termine || emp.Termine || [],
              // Berechne Verfügbarkeit für den Zeitraum
              availabilityStatus: calculateAvailability(item.Termine || emp.Termine || [], startDate, endDate)
            };
          });

        const available = processedEmployees.filter(e => e.availabilityStatus.status === 'available').length;
        console.log(`✅ [API] ServiceProvider - ${processedEmployees.length} Mitarbeiter geladen (${available} verfügbar)`);
        setEmployees(processedEmployees);
        setFilteredEmployees(processedEmployees);
      } else {
        setEmployees([]);
        setFilteredEmployees([]);
      }
    } catch (error) {
      console.error('❌ [API] ServiceProvider - Fehler beim Laden der Mitarbeiter:', error);
      setEmployees([]);
      setFilteredEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  }, [startDate, endDate, filters, SERVICEPROVIDER_API_URL, SFS_API_TOKEN, selectedDeal]);

  // Aktualisiere die Liste automatisch bei Filter- oder Datumswechsel
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Lade Fahrzeuge beim Start und bei Datumsänderungen
  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Fahrzeug-Loading entfernt

  // Dealsuche (Pipedrive)
  const fetchDeals = async (term = '') => {
    if (!PIPEDRIVE_API_TOKEN) {
      console.error('❌ Kein Pipedrive API Token konfiguriert! Bitte REACT_APP_PIPEDRIVE_API_TOKEN in .env setzen.');
      return;
    }
    setLoadingDeals(true);
    setDealError(null);
    try {
      console.log(`📥 [API] Pipedrive - Deals suchen: "${term}"`);
      const url = `https://api.pipedrive.com/v1/deals/search?term=${encodeURIComponent(term)}&api_token=${PIPEDRIVE_API_TOKEN}`;
      const response = await axios.get(url);
      const items = response.data?.data?.items || [];
      console.log(`✅ [API] Pipedrive - ${items.length} Deals gefunden`);
      setDeals(items);
    } catch (err) {
      console.error('❌ [API] Pipedrive - Fehler beim Laden der Deals:', err);
      setDealError('Fehler beim Laden der Deals');
      setDeals([]);
    } finally {
      setLoadingDeals(false);
    }
  };

  const fetchOpenDeals = async () => {
    if (!PIPEDRIVE_API_TOKEN) {
      console.error('❌ Kein Pipedrive API Token konfiguriert! Bitte REACT_APP_PIPEDRIVE_API_TOKEN in .env setzen.');
      return;
    }
    setLoadingDeals(true);
    setDealError(null);
    try {
      console.log(`📥 [API] Pipedrive - Offene Deals laden`);
      const url = `https://api.pipedrive.com/v1/deals?status=open&limit=50&api_token=${PIPEDRIVE_API_TOKEN}`;
      const response = await axios.get(url);
      const items = (response.data?.data || []).map(d => ({ item: d }));
      console.log(`✅ [API] Pipedrive - ${items.length} offene Deals geladen`);
      setDeals(items);
    } catch (err) {
      console.error('❌ [API] Pipedrive - Fehler beim Laden offener Deals:', err);
      setDealError('Fehler beim Laden offener Deals');
      setDeals([]);
    } finally {
      setLoadingDeals(false);
    }
  };

  // Vollständige Deal-Details laden (inkl. benutzerdefinierter Felder)
  const fetchDealById = async (dealId) => {
    if (!PIPEDRIVE_API_TOKEN || !dealId) return null;
    try {
      console.log(`📥 [API] Pipedrive - Deal Details laden: ${dealId}`);
      const url = `https://api.pipedrive.com/v1/deals/${dealId}?api_token=${PIPEDRIVE_API_TOKEN}`;
      const response = await axios.get(url);
      const data = response.data?.data || null;
      if (data) {
        console.log(`✅ [API] Pipedrive - Deal Details geladen: ${data.title}`);
      }
      return data;
    } catch (err) {
      console.error('❌ [API] Pipedrive - Fehler beim Laden des Deals:', dealId, err);
      return null;
    }
  };

  // Flexible Datum-Parser für Leistungsdatum (unterstützt yyyy-MM-dd, yyyy-MM-dd HH:mm:ss, dd.MM.yyyy)
  const parseServiceDate = (raw) => {
    if (!raw) return null;
    if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
    const s = String(raw).trim();
    let d = new Date(s);
    if (!isNaN(d.getTime())) return d;
    // remove time part
    const dateOnly = s.split(/[T\s]/)[0];
    d = new Date(dateOnly);
    if (!isNaN(d.getTime())) return d;
    // dd.MM.yyyy
    const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (m) {
      const [_, dd, mm, yyyy] = m;
      const parsed = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  };

  // Live-Dealsuche mit Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      if (dealSearchTerm && dealSearchTerm.trim().length > 0) {
        fetchDeals(dealSearchTerm.trim());
      } else {
        setDeals([]);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [dealSearchTerm]);

  const toggleEmployeeSelection = (emp) => {
    setSelectedEmployees(prev => {
      const exists = prev.find(e => e.id === emp.id);
      if (exists) return prev.filter(e => e.id !== emp.id);
      return [...prev, { ...emp, roles: [] }];
    });
  };

  const isEmployeeSelected = (empId) => selectedEmployees.some(e => e.id === empId);
  const getSelectedEmployee = (empId) => selectedEmployees.find(e => e.id === empId);
  const toggleEmployeeRole = (empId, roleKey) => {
    setSelectedEmployees(prev => prev.map(e => {
      if (e.id !== empId) return e;
      const roles = Array.isArray(e.roles) ? [...e.roles] : [];
      const idx = roles.indexOf(roleKey);
      if (idx >= 0) {
        roles.splice(idx, 1);
      } else {
        roles.push(roleKey);
      }
      return { ...e, roles };
    }));
  };
  const employeeHasRole = (empId, roleKey) => {
    const e = getSelectedEmployee(empId);
    return !!e && Array.isArray(e.roles) && e.roles.includes(roleKey);
  };

  // API-Pfad-Debugging mit verschiedenen Pfadvariationen
  const handleTestApiPaths = useCallback(async () => {
    console.log('🔍 ========== API-PFAD-DEBUGGING (EmployeeScheduling) ==========');
    console.log('🔍 Teste verschiedene API-Pfadvariationen...');
    
    // Umgebungsvariablen loggen
    console.log('🔍 ========== UMWELTVARIABLEN ==========');
    console.log('REACT_APP_SPTIMESCHEDULE_API_URL:', process.env.REACT_APP_SPTIMESCHEDULE_API_URL);
    console.log('REACT_APP_SERVICEPROVIDER_API_URL:', process.env.REACT_APP_SERVICEPROVIDER_API_URL);
    console.log('REACT_APP_SFS_API_TOKEN vorhanden:', !!process.env.REACT_APP_SFS_API_TOKEN);
    console.log('REACT_APP_SFS_API_TOKEN (erste 20 Zeichen):', process.env.REACT_APP_SFS_API_TOKEN?.substring(0, 20) + '...');
    console.log('REACT_APP_DEFAULT_KENNZEICHEN:', process.env.REACT_APP_DEFAULT_KENNZEICHEN);
    
    // Verschiedene Pfadvariationen definieren
    const pathVariations = [
      {
        name: 'Aktueller Pfad (aus ENV)',
        url: process.env.REACT_APP_SPTIMESCHEDULE_API_URL || 'https://lolworlds.online/api/sptimeschedule/saveSptimeschedule',
        description: 'Verwendet die URL aus REACT_APP_SPTIMESCHEDULE_API_URL'
      },
      {
        name: 'Mit /api/ Präfix',
        url: 'https://lolworlds.online/api/sptimeschedule/saveSptimeschedule',
        description: 'Explizit mit /api/ am Anfang'
      },
      {
        name: 'Ohne /api/ Präfix',
        url: 'https://lolworlds.online/sptimeschedule/saveSptimeschedule',
        description: 'Ohne /api/ am Anfang'
      },
      {
        name: 'Direkt zu Stressfrei',
        url: 'https://www.stressfrei-solutions.de/dl2238205/backend/api/sptimeschedule/saveSptimeschedule',
        description: 'Direkt zur Stressfrei API (ohne Proxy)'
      },
      {
        name: 'Stressfrei ohne /api/',
        url: 'https://www.stressfrei-solutions.de/dl2238205/backend/sptimeschedule/saveSptimeschedule',
        description: 'Stressfrei ohne /api/ Präfix'
      }
    ];
    
    // Test-Mitarbeiter erstellen
    const testEmployee = {
      personalid: 'TEST-EMPLOYEE-001',
      terminart: '3a4df8a1-2387-11e8-839c-00113241b9d5', // Standard Umzugsausführung
      vorgangsno: 'TEST-DEAL-001',
      angebotsno: 'TEST-OFFER-001',
      datum: format(new Date(), 'yyyy-MM-dd'),
      startzeit: '08:00:00',
      endzeit: '12:00:00',
      kommentar: '[API-PFAD-TEST] Test-Termin für Pfad-Debugging (EmployeeScheduling)',
      rolle: ['Monteur'],
      kennzeichen: process.env.REACT_APP_DEFAULT_KENNZEICHEN || 'KA-RD 1234'
    };
    
    const testPayload = [testEmployee];
    
    console.log('🔍 ========== TEST-PAYLOAD ==========');
    console.log(JSON.stringify(testPayload, null, 2));
    
    const results = [];
    
    for (const variation of pathVariations) {
      console.log(`🔍 ========== TESTE: ${variation.name} ==========`);
      console.log(`URL: ${variation.url}`);
      console.log(`Beschreibung: ${variation.description}`);
      
      const startTime = Date.now();
      
      try {
        const response = await axios.post(variation.url, testPayload, {
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': process.env.REACT_APP_SFS_API_TOKEN
          },
          timeout: 10000 // 10 Sekunden Timeout
        });
        
        const duration = Date.now() - startTime;
        
        const result = {
          name: variation.name,
          url: variation.url,
          success: true,
          status: response.status,
          duration: duration,
          responseType: typeof response.data,
          isHtml: typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>'),
          responsePreview: typeof response.data === 'string' 
            ? response.data.substring(0, 200) + '...'
            : JSON.stringify(response.data).substring(0, 200) + '...',
          fullResponse: response.data
        };
        
        console.log(`✅ ERFOLG: ${variation.name}`);
        console.log(`Status: ${response.status}`);
        console.log(`Dauer: ${duration}ms`);
        console.log(`Response Type: ${typeof response.data}`);
        console.log(`Ist HTML: ${result.isHtml}`);
        console.log(`Response Preview: ${result.responsePreview}`);
        console.log(`📦 VOLLSTÄNDIGER RESPONSE:`, response.data);
        console.log(`🔍 RESPONSE IST EXAKT "true":`, response.data === true);
        console.log(`🔍 RESPONSE IST EXAKT "false":`, response.data === false);
        console.log(`🔍 RESPONSE STRING:`, JSON.stringify(response.data));
        
        results.push(result);
        
      } catch (error) {
        const duration = Date.now() - startTime;
        
        const result = {
          name: variation.name,
          url: variation.url,
          success: false,
          error: error.message,
          status: error.response?.status,
          duration: duration,
          responseType: typeof error.response?.data,
          isHtml: typeof error.response?.data === 'string' && error.response?.data?.includes('<!DOCTYPE html>'),
          responsePreview: error.response?.data 
            ? (typeof error.response.data === 'string' 
                ? error.response.data.substring(0, 200) + '...'
                : JSON.stringify(error.response.data).substring(0, 200) + '...')
            : 'Keine Response',
          fullError: error.response?.data
        };
        
        console.log(`❌ FEHLER: ${variation.name}`);
        console.log(`Error: ${error.message}`);
        console.log(`Status: ${error.response?.status}`);
        console.log(`Dauer: ${duration}ms`);
        console.log(`Response Type: ${typeof error.response?.data}`);
        console.log(`Ist HTML: ${result.isHtml}`);
        console.log(`Response Preview: ${result.responsePreview}`);
        
        results.push(result);
      }
      
      // Kurze Pause zwischen Tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('🔍 ========== ZUSAMMENFASSUNG ==========');
    
    // Erfolgreiche Tests
    const successfulTests = results.filter(r => r.success && !r.isHtml);
    const htmlResponses = results.filter(r => r.isHtml);
    const errors = results.filter(r => !r.success);
    
    console.log(`✅ Erfolgreiche Tests: ${successfulTests.length}`);
    successfulTests.forEach(r => {
      console.log(`  • ${r.name}: Status ${r.status}, ${r.duration}ms`);
    });
    
    console.log(`🌐 HTML-Responses (Login-Seiten): ${htmlResponses.length}`);
    htmlResponses.forEach(r => {
      console.log(`  • ${r.name}: ${r.url}`);
    });
    
    console.log(`❌ Fehler: ${errors.length}`);
    errors.forEach(r => {
      console.log(`  • ${r.name}: ${r.error}`);
    });
    
    // Detaillierte Ergebnisse anzeigen
    let summaryMessage = `🔍 API-PFAD-DEBUGGING ABGESCHLOSSEN (EmployeeScheduling)\n\n`;
    summaryMessage += `Getestete Pfade: ${pathVariations.length}\n`;
    summaryMessage += `✅ Erfolgreich: ${successfulTests.length}\n`;
    summaryMessage += `🌐 HTML-Responses: ${htmlResponses.length}\n`;
    summaryMessage += `❌ Fehler: ${errors.length}\n\n`;
    
    if (successfulTests.length > 0) {
      summaryMessage += `✅ FUNKTIONIERENDE PFADE:\n`;
      successfulTests.forEach(r => {
        summaryMessage += `• ${r.name}\n`;
        summaryMessage += `  URL: ${r.url}\n`;
        summaryMessage += `  Status: ${r.status}\n`;
        summaryMessage += `  Response: ${JSON.stringify(r.fullResponse)}\n`;
        summaryMessage += `  Response Type: ${r.responseType}\n\n`;
      });
    }
    
    if (htmlResponses.length > 0) {
      summaryMessage += `🌐 PFADE MIT LOGIN-SEITE (falsch):\n`;
      htmlResponses.forEach(r => {
        summaryMessage += `• ${r.name}\n`;
        summaryMessage += `  URL: ${r.url}\n\n`;
      });
    }
    
    if (errors.length > 0) {
      summaryMessage += `❌ FEHLERHAFTE PFADE:\n`;
      errors.forEach(r => {
        summaryMessage += `• ${r.name}: ${r.error}\n`;
      });
    }
    
    summaryMessage += `\n📋 VOLLSTÄNDIGE LOGS IN DER BROWSER-KONSOLE (F12)`;
    
    alert(summaryMessage);
    
  }, []);

  const handleTransferToStressfrei = useCallback(async () => {
    if (!selectedDeal) {
      alert('⚠️ Bitte wählen Sie einen Deal aus.');
      return;
    }
    
    if (selectedEmployees.length === 0) {
      alert('⚠️ Bitte wählen Sie mindestens einen Mitarbeiter aus.');
      return;
    }

    if (selectedVehicles.length === 0) {
      alert('⚠️ Bitte wählen Sie mindestens ein Fahrzeug aus.');
      return;
    }

    console.log(`📥 [TRANSFER] Mitarbeiter-Zuordnung für Deal ${selectedDeal.item.id} vorbereiten`);
    console.log(`✅ [TRANSFER] ${selectedEmployees.length} Mitarbeiter ausgewählt`);
    console.log(`🚗 [TRANSFER] ${selectedVehicles.length} Fahrzeuge ausgewählt`);

    try {
      // Berechne die Dauer basierend auf Start- und Endzeit
      const calculateDuration = (startTime, endTime) => {
        const start = new Date(`2000-01-01T${startTime}:00`);
        const end = new Date(`2000-01-01T${endTime}:00`);
        const diffMs = end - start;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return { hours: diffHours, minutes: diffMinutes, totalMinutes: Math.floor(diffMs / (1000 * 60)) };
      };

      const duration = calculateDuration(appointmentStartTime, appointmentEndTime);
      
      console.log(`⏰ [TRANSFER] Termin-Dauer berechnet: ${duration.hours}h ${duration.minutes}m (${duration.totalMinutes} Min)`);

      // Verwende das Start-Datum aus der Mitarbeiterplanung
      const dealDate = startDate;
      const dealDateString = format(dealDate, 'yyyy-MM-dd');
      
      console.log(`📅 [TRANSFER] Verwende Start-Datum: ${dealDateString}`);

        // Erstelle Termine für alle ausgewählten Mitarbeiter und Fahrzeuge
        const appointments = [];
        
        // Für jedes Fahrzeug
        selectedVehicles.forEach((vehicle, vehicleIndex) => {
          // Für jeden Mitarbeiter
          selectedEmployees.forEach(employee => {
          // Prüfe ob Mitarbeiter bereits Termine an diesem Tag hat
          const existingAppointments = employee.termine?.filter(termin => 
            termin.datum === dealDateString
          ) || [];

          // Finde den nächsten freien Zeitraum
          let appointmentStart = appointmentStartTime;
          let appointmentEnd = appointmentEndTime;

          if (existingAppointments.length > 0) {
            // Sortiere bestehende Termine nach Startzeit
            const sortedAppointments = existingAppointments.sort((a, b) => 
              a.startzeit?.localeCompare(b.startzeit) || 0
            );

            // Finde Lücke zwischen Terminen oder nach dem letzten Termin
            let foundGap = false;
            
            for (let i = 0; i < sortedAppointments.length; i++) {
              const currentAppointment = sortedAppointments[i];
              const nextAppointment = sortedAppointments[i + 1];
              
              const currentEnd = currentAppointment.endzeit || currentAppointment.startzeit;
              const nextStart = nextAppointment?.startzeit;
              
              // Prüfe ob zwischen currentEnd und nextStart genug Zeit ist
              if (nextStart) {
                const gapStart = new Date(`2000-01-01T${currentEnd}:00`);
                const gapEnd = new Date(`2000-01-01T${nextStart}:00`);
                const gapMinutes = (gapEnd - gapStart) / (1000 * 60);
                
                if (gapMinutes >= duration.totalMinutes) {
                  appointmentStart = currentEnd;
                  const gapStartTime = new Date(gapStart.getTime() + 1 * 60 * 1000); // +1 Minute Puffer
                  appointmentEnd = gapStartTime.toTimeString().slice(0, 5);
                  foundGap = true;
                  break;
                }
              } else {
                // Nach dem letzten Termin
                const lastEnd = new Date(`2000-01-01T${currentEnd}:00`);
                const newStart = new Date(lastEnd.getTime() + 15 * 60 * 1000); // +15 Minuten Puffer
                const newEnd = new Date(newStart.getTime() + duration.totalMinutes * 60 * 1000);
                
                appointmentStart = newStart.toTimeString().slice(0, 5);
                appointmentEnd = newEnd.toTimeString().slice(0, 5);
                foundGap = true;
                break;
              }
            }
            
            if (!foundGap) {
              // Keine Lücke gefunden, Termin am Ende des Tages
              const lastAppointment = sortedAppointments[sortedAppointments.length - 1];
              const lastEnd = lastAppointment.endzeit || lastAppointment.startzeit;
              const lastEndTime = new Date(`2000-01-01T${lastEnd}:00`);
              const newStart = new Date(lastEndTime.getTime() + 15 * 60 * 1000); // +15 Minuten Puffer
              const newEnd = new Date(newStart.getTime() + duration.totalMinutes * 60 * 1000);
              
              appointmentStart = newStart.toTimeString().slice(0, 5);
              appointmentEnd = newEnd.toTimeString().slice(0, 5);
            }
          }

          console.log(`📅 [TRANSFER] ${employee.name} (${vehicle.name}): ${appointmentStart} - ${appointmentEnd} (${duration.totalMinutes} Min) am ${dealDateString}`);

          // Finde das entsprechende Fahrzeug aus der verfügbaren Liste für Status-Info
          const vehicleFromList = availableVehicles.find(v => v.id === vehicle.id);
          const vehicleStatus = vehicleFromList ? vehicleFromList.availabilityStatus : null;
          
          appointments.push({
            personalid: employee.id,
            terminart: vehicle.terminartId || '3a4df8a1-2387-11e8-839c-00113241b9d5',
            vorgangsno: selectedDeal.item.id?.toString() || '',
            angebotsno: selectedDeal.item.id?.toString() || '',
            datum: dealDateString,
            startzeit: appointmentStart + ':00',
            endzeit: appointmentEnd + ':00',
            kommentar: `Deal: ${selectedDeal.item.title} | Fahrzeug: ${vehicle.name} (${vehicle.kennzeichen}) | Mitarbeiter: ${employee.name} | Dauer: ${duration.totalMinutes} Min`,
            rolle: employee.roles || ['Monteur'],
            kennzeichen: vehicle.kennzeichen,
            // Fahrzeug-Status für Planung hinzufügen
            fahrzeug_status: vehicleStatus?.status || 'unbekannt',
            fahrzeug_termine_anzahl: vehicleStatus?.appointments || 0,
            fahrzeug_verfuegbar: vehicleStatus?.status === 'available'
          });
          });
        });

      console.log('📤 [TRANSFER] Sende Termine an SPTimeSchedule...');
      console.log('═══════════════════════════════════════════');
      console.log('📋 VOLLSTÄNDIGER PAYLOAD:');
      console.log(JSON.stringify(appointments, null, 2));
      console.log('═══════════════════════════════════════════');

      const response = await axios.post(
        process.env.REACT_APP_SPTIMESCHEDULE_API_URL || 'https://lolworlds.online/api/sptimeschedule/saveSptimeschedule',
        appointments,
        {
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': process.env.REACT_APP_SFS_API_TOKEN
          }
        }
      );

      console.log('═══════════════════════════════════════════');
      console.log('✅ RESPONSE STATUS:', response.status);
      console.log('📦 RESPONSE DATA:', response.data);
      console.log('📦 RESPONSE TYPE:', typeof response.data);
      console.log('═══════════════════════════════════════════');

      // Prüfe ob Response HTML ist (Login-Seite)
      const isHtml = typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>');
      
      if (isHtml) {
        console.error('❌ API gibt HTML-Login-Seite zurück - Auth fehlgeschlagen!');
        throw new Error('Authentifizierung fehlgeschlagen - API gibt Login-Seite zurück. Token ungültig?');
      }

      if (response.status === 200 || response.status === 201) {
        let successMessage = `✅ Mitarbeiter erfolgreich zugewiesen!\n\n`;
        successMessage += `Deal: ${selectedDeal.item.title}\n`;
        successMessage += `Datum: ${format(startDate, 'dd.MM.yyyy', { locale: de })}\n`;
        successMessage += `Zeit: ${appointmentStartTime} - ${appointmentEndTime}\n`;
        successMessage += `Mitarbeiter: ${selectedEmployees.length}\n`;
        successMessage += `Fahrzeuge: ${selectedVehicles.length}\n`;
        successMessage += `Termine: ${appointments.length} (${selectedEmployees.length} Mitarbeiter × ${selectedVehicles.length} Fahrzeuge)\n\n`;
        
        // Fahrzeug-Status-Übersicht hinzufügen
        successMessage += `🚗 Fahrzeug-Status:\n`;
        selectedVehicles.forEach(vehicle => {
          const vehicleFromList = availableVehicles.find(v => v.id === vehicle.id);
          const status = vehicleFromList?.availabilityStatus?.status || 'unbekannt';
          const appointments = vehicleFromList?.availabilityStatus?.appointments || 0;
          successMessage += `• ${vehicle.name} (${vehicle.kennzeichen}): ${status === 'available' ? 'Verfügbar' : `${appointments} Termine`}\n`;
        });
        
        successMessage += `\nResponse: ${JSON.stringify(response.data)}`;
        
        alert(successMessage);
        
        // Reset nach erfolgreichem Transfer
        setSelectedEmployees([]);
        setSelectedVehicles([]);
        setSelectedDeal(null);
      } else {
        throw new Error(`Unerwarteter Status: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Fehler beim Übertragen zu Stressfrei:', error);
      
      let errorMessage = `❌ Fehler beim Übertragen!\n\n`;
      errorMessage += `Fehler: ${error.message}\n`;
      
      if (error.response) {
        errorMessage += `\nHTTP Status: ${error.response.status}\n`;
        errorMessage += `Server-Antwort: ${JSON.stringify(error.response.data)}\n`;
      }
      
      errorMessage += `\n🔍 Prüfen Sie:\n`;
      errorMessage += `1. Browser-Konsole (F12) für Details\n`;
      errorMessage += `2. API-Token in .env korrekt?\n`;
      errorMessage += `3. Mitarbeiter-IDs gültig?\n`;
      
      alert(errorMessage);
    }
  }, [selectedDeal, selectedEmployees, selectedVehicles, selectedDate, appointmentStartTime, appointmentEndTime]);

  // Verfügbarkeit berechnen (robust gegen verschiedene Feldschreibweisen)
  const calculateAvailability = (termine, start, end) => {
    if (!Array.isArray(termine) || termine.length === 0) {
      return { status: 'available', appointments: 0, details: [] };
    }

    const normalizeAppointment = (t) => {
      const dateStr = t.Datum || t.datum || t.date || t.Date;
      const startStr = t.Startzeit || t.startzeit || t.start || t.Start;
      const endStr = t.Endzeit || t.endzeit || t.end || t.End;
      const type = t.Terminart || t.terminart || t.type || 'Termin';
      return { date: dateStr, start: startStr, end: endStr, type };
    };

    const normalized = termine
      .map(normalizeAppointment)
      .filter(a => !!a.date);

    // Tagesgrenzen inklusiv setzen
    const startBound = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0);
    const endBound = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59);

    const relevantAppointments = normalized.filter(termin => {
      const appointmentDate = new Date(termin.date);
      if (isNaN(appointmentDate.getTime())) return false;
      return appointmentDate >= startBound && appointmentDate <= endBound;
    });

    if (relevantAppointments.length === 0) {
      return { status: 'available', appointments: 0, details: [] };
    }

    return {
      status: 'busy',
      appointments: relevantAppointments.length,
      details: relevantAppointments
    };
  };

  // Mitarbeiter filtern (reagiert auch auf alle Filteränderungen)
  useEffect(() => {
    let filtered = [...employees];

    // Textsuche
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(lowerQuery) ||
        emp.id.toLowerCase().includes(lowerQuery)
      );
    }

    // Verfügbarkeits-Filter
    if (filters.onlyAvailable) {
      filtered = filtered.filter(emp => emp.availabilityStatus.status === 'available');
    }
    if (filters.onlyBusy) {
      filtered = filtered.filter(emp => emp.availabilityStatus.status === 'busy');
    }

    setFilteredEmployees(filtered);
  }, [searchQuery, filters, employees]);

  // Initial laden
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Filter zurücksetzen
  const resetFilters = () => {
    setFilters({
      driverLicenses: [],
      pianoCarrier: null,
      foreman: null,
      assembly: null,
      hasCar: null,
      onlyAvailable: false,
      onlyBusy: false,
    });
    setSearchQuery('');
  };

  // Schnellauswahl-Buttons
  const setQuickDateRange = (type) => {
    const today = new Date();
    switch (type) {
      case 'today':
        setStartDate(today);
        setEndDate(today);
        break;
      case 'week':
        setStartDate(startOfWeek(today, { weekStartsOn: 1 }));
        setEndDate(endOfWeek(today, { weekStartsOn: 1 }));
        break;
      case 'month':
        setStartDate(new Date(today.getFullYear(), today.getMonth(), 1));
        setEndDate(new Date(today.getFullYear(), today.getMonth() + 1, 0));
        break;
      default:
        break;
    }
  };

  // Führerscheinklasse togglen
  const toggleLicense = (license) => {
    setFilters(prev => ({
      ...prev,
      driverLicenses: prev.driverLicenses.includes(license)
        ? prev.driverLicenses.filter(l => l !== license)
        : [...prev.driverLicenses, license]
    }));
  };

  // Export-Funktion
  const exportToCSV = () => {
    const csvContent = [
      ['ID', 'Name', 'Führerschein', 'Klavierträger', 'Vorarbeiter', 'Status', 'Termine im Zeitraum'].join(';'),
      ...filteredEmployees.map(emp => [
        emp.id,
        emp.name,
        emp.eigenschaften.personal_properties_Fhrerscheinklasse || '-',
        emp.eigenschaften.personal_properties_Klavierträger || '-',
        emp.eigenschaften.personal_properties_Vorarbeiter || '-',
        emp.availabilityStatus.status === 'available' ? 'Verfügbar' : 'Verplant',
        emp.availabilityStatus.appointments
      ].join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mitarbeiter_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="h-7 w-7 text-primary" />
                  Mitarbeiterplanung
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Mitarbeiterverfügbarkeit prüfen und planen
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportToCSV}
                disabled={filteredEmployees.length === 0}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              <button
                onClick={fetchEmployees}
                disabled={loadingEmployees}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loadingEmployees ? 'animate-spin' : ''}`} />
                Aktualisieren
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Deal-Auswahl */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Deal auswählen
            </h2>
            {selectedDeal && (
              <button
                onClick={() => { setSelectedDeal(null); setSelectedEmployees([]); }}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Auswahl löschen
              </button>
            )}
          </div>

          {!selectedDeal && (
            <div>
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={dealSearchTerm}
                  onChange={(e) => setDealSearchTerm(e.target.value)}
                  placeholder="Deal suchen (Name, ID, etc.)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  onClick={() => fetchDeals(dealSearchTerm)}
                  disabled={loadingDeals}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  Suchen
                </button>
                <button
                  onClick={fetchOpenDeals}
                  disabled={loadingDeals}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Offene Deals laden
                </button>
              </div>

              {dealError && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-3">{dealError}</div>
              )}

              {loadingDeals && (
                <div className="text-gray-500">Deals werden geladen...</div>
              )}

              {!loadingDeals && deals.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {deals.map(d => (
                    <button
                      key={d.item.id}
                       onClick={async () => {
                        // wenn die Suchantwort das Feld nicht enthält, Details nachladen
                        const full = await fetchDealById(d.item.id);
                         const chosen = full || d.item;
                         setSelectedDeal({ item: chosen });
                         // Leistungsdatum übernehmen
                         const serviceDateRaw = chosen?.[PD_FIELD_SERVICE_DATE];
                         const sd = parseServiceDate(serviceDateRaw);
                         if (sd) {
                           setStartDate(sd);
                           setEndDate(sd);
                         }
                        setSelectedEmployees([]);
                      }}
                      className="text-left bg-gray-50 hover:bg-blue-50 p-4 rounded-lg border border-gray-200 hover:border-primary transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-semibold text-gray-900">{d.item.title}</div>
                            {renderStatus(d.item.status)}
                          </div>
                          <div className="text-sm text-gray-600 flex flex-wrap gap-3">
                            <span className="bg-gray-100 px-2 py-0.5 rounded">ID: {d.item.id}</span>
                            {d.item.value != null && (
                              <span className="font-medium text-primary">{formatCurrency(d.item.value, d.item.currency)}</span>
                            )}
                            {d.item.org_name && <span>{d.item.org_name}</span>}
                            {d.item.owner_name && <span className="text-gray-500">Owner: {d.item.owner_name}</span>}
                          </div>
                          {/* Ressourcen-Badges */}
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            {(() => { const c = getDealCounts(d.item); return (
                              <>
                                {c.driver12t > 0 && (
                                  <button onClick={(e) => { e.stopPropagation(); applyRoleFilter('driver12t'); }} className="px-2 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200">
                                    12t Fahrer: {c.driver12t}
                                  </button>
                                )}
                                {c.driver7t5 > 0 && (
                                  <button onClick={(e) => { e.stopPropagation(); applyRoleFilter('driver7t5'); }} className="px-2 py-1 rounded bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
                                    7.5t Fahrer: {c.driver7t5}
                                  </button>
                                )}
                                {c.driver3t5 > 0 && (
                                  <button onClick={(e) => { e.stopPropagation(); applyRoleFilter('driver3t5'); }} className="px-2 py-1 rounded bg-cyan-100 text-cyan-800 hover:bg-cyan-200">
                                    3.5t Fahrer: {c.driver3t5}
                                  </button>
                                )}
                                {c.monteure > 0 && (
                                  <button onClick={(e) => { e.stopPropagation(); applyRoleFilter('monteure'); }} className="px-2 py-1 rounded bg-amber-100 text-amber-800 hover:bg-amber-200">
                                    Monteure: {c.monteure}
                                  </button>
                                )}
                                {c.helpers > 0 && (
                                  <button onClick={(e) => { e.stopPropagation(); applyRoleFilter('helpers'); }} className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                                    Umzugshelfer: {c.helpers}
                                  </button>
                                )}
                                {c.piano > 0 && (
                                  <button onClick={(e) => { e.stopPropagation(); applyRoleFilter('piano'); }} className="px-2 py-1 rounded bg-purple-100 text-purple-800 hover:bg-purple-200">
                                    Klavierträger: {c.piano}
                                  </button>
                                )}
                              </>
                            ); })()}
                          </div>
                        </div>
                        <span className="text-primary hover:text-primary-dark flex items-center whitespace-nowrap">
                          Auswählen
                          <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                          </svg>
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedDeal && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Ausgewählter Deal</div>
                   <div className="text-lg font-semibold">{selectedDeal.item?.title} (ID: {selectedDeal.item?.id})</div>
                   {(() => {
                     const raw = selectedDeal.item?.[PD_FIELD_SERVICE_DATE];
                     const sd = parseServiceDate(raw);
                     const display = sd ? format(sd, 'EEEE, dd.MM.yyyy', { locale: de }) : null;
                     return display ? (
                       <div className="mt-1 inline-flex items-center gap-2 px-2 py-1 rounded bg-primary-light text-primary text-xs font-medium">
                         <Calendar className="w-4 h-4" />
                         {display}
                       </div>
                     ) : null;
                   })()}
                  {/* Ressourcenübersicht */}
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {(() => { const c = getDealCounts(selectedDeal.item || {}); return (
                      <>
                        {c.driver12t > 0 && (
                          <button onClick={() => applyRoleFilter('driver12t')} className="px-2 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200">
                            🚛 12t Fahrer: {c.driver12t}
                            <span className="ml-2 text-[10px] bg-white/60 px-1 py-0.5 rounded">{countSelectedForRole('driver12t')} gewählt</span>
                          </button>
                        )}
                        {c.driver7t5 > 0 && (
                          <button onClick={() => applyRoleFilter('driver7t5')} className="px-2 py-1 rounded bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
                            🚚 7.5t Fahrer: {c.driver7t5}
                            <span className="ml-2 text-[10px] bg-white/60 px-1 py-0.5 rounded">{countSelectedForRole('driver7t5')} gewählt</span>
                          </button>
                        )}
                        {c.driver3t5 > 0 && (
                          <button onClick={() => applyRoleFilter('driver3t5')} className="px-2 py-1 rounded bg-cyan-100 text-cyan-800 hover:bg-cyan-200">
                            🚐 3.5t Fahrer: {c.driver3t5}
                            <span className="ml-2 text-[10px] bg-white/60 px-1 py-0.5 rounded">{countSelectedForRole('driver3t5')} gewählt</span>
                          </button>
                        )}
                        {c.monteure > 0 && (
                          <button onClick={() => applyRoleFilter('monteure')} className="px-2 py-1 rounded bg-amber-100 text-amber-800 hover:bg-amber-200">
                            🔧 Monteure: {c.monteure}
                            <span className="ml-2 text-[10px] bg-white/60 px-1 py-0.5 rounded">{countSelectedForRole('monteure')} gewählt</span>
                          </button>
                        )}
                        {c.helpers > 0 && (
                          <button onClick={() => applyRoleFilter('helpers')} className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                            👷 Umzugshelfer: {c.helpers}
                            <span className="ml-2 text-[10px] bg-white/60 px-1 py-0.5 rounded">{countSelectedForRole('helpers')} gewählt</span>
                          </button>
                        )}
                        {c.piano > 0 && (
                          <button onClick={() => applyRoleFilter('piano')} className="px-2 py-1 rounded bg-purple-100 text-purple-800 hover:bg-purple-200">
                            🎹 Klavierträger: {c.piano}
                            <span className="ml-2 text-[10px] bg-white/60 px-1 py-0.5 rounded">{countSelectedForRole('piano')} gewählt</span>
                          </button>
                        )}
                      </>
                    ); })()}
                  </div>
                  
                </div>
              </div>

              {/* Fahrzeugauswahl aus Deal */}
              {(() => {
                const dealCounts = getDealCounts(selectedDeal.item || {});
                if (dealCounts.vehicles && dealCounts.vehicles.length > 0) {
                  return (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        🚗 Fahrzeuge aus Deal-Auswahl:
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {dealCounts.vehicles.map((vehicle, index) => (
                          <label key={index} className="flex items-center p-3 border-2 border-blue-200 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                            <input
                              type="checkbox"
                              checked={selectedVehicles.some(v => v.id === vehicle.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedVehicles(prev => [...prev, vehicle]);
                                } else {
                                  setSelectedVehicles(prev => prev.filter(v => v.id !== vehicle.id));
                                }
                              }}
                              className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded mr-3"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{vehicle.icon}</span>
                                <span className="font-medium text-gray-900">{vehicle.name}</span>
                              </div>
                              <div className="text-sm text-gray-600">Kennzeichen: {vehicle.kennzeichen}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        💡 Wählen Sie die Fahrzeuge aus, die für diesen Deal verwendet werden sollen.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Startzeit</label>
                  <input
                    type="time"
                    value={appointmentStartTime}
                    onChange={(e) => setAppointmentStartTime(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Endzeit</label>
                  <input
                    type="time"
                    value={appointmentEndTime}
                    onChange={(e) => setAppointmentEndTime(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={handleTestApiPaths}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-semibold border-2 border-purple-600"
                    title="Teste verschiedene API-Pfadvariationen um den richtigen zu finden"
                  >
                    🔍 API-Debug
                  </button>
                  <button
                    onClick={handleTransferToStressfrei}
                    disabled={selectedEmployees.length === 0 || selectedVehicles.length === 0}
                    className="w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    An Stressfrei übertragen
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Filter-Bereich */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Such- und Filterkriterien
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-primary hover:text-primary-dark font-medium"
            >
              {showFilters ? 'Erweiterte Filter ausblenden' : 'Erweiterte Filter anzeigen'}
            </button>
          </div>

          {/* Zeitraum-Auswahl */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Von Datum</label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                dateFormat="dd.MM.yyyy"
                locale={de}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bis Datum</label>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                dateFormat="dd.MM.yyyy"
                locale={de}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Schnellauswahl</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setQuickDateRange('today')}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  Heute
                </button>
                <button
                  onClick={() => setQuickDateRange('week')}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  Diese Woche
                </button>
                <button
                  onClick={() => setQuickDateRange('month')}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  Dieser Monat
                </button>
              </div>
            </div>
          </div>

          {/* Suchleiste */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Nach Name oder ID suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Erweiterte Filter */}
          {showFilters && (
            <div className="space-y-6 pt-4 border-t">
              {/* Führerscheinklassen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Führerscheinklasse</label>
                <div className="flex flex-wrap gap-2">
                  {licenseClasses.map(license => (
                    <button
                      key={license}
                      onClick={() => toggleLicense(license)}
                      className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                        filters.driverLicenses.includes(license)
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                      }`}
                    >
                      Klasse {license}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spezielle Fähigkeiten */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Klavierträger</label>
                  <select
                    value={filters.pianoCarrier || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, pianoCarrier: e.target.value || null }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Alle</option>
                    <option value="Ja">Ja</option>
                    <option value="Nein">Nein</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vorarbeiter</label>
                  <select
                    value={filters.foreman || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, foreman: e.target.value || null }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Alle</option>
                    <option value="Ja">Ja</option>
                    <option value="Nein">Nein</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Montagen</label>
                  <select
                    value={filters.assembly || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, assembly: e.target.value || null }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Alle</option>
                    <option value="Ja">Ja</option>
                    <option value="Nein">Nein</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Eigenes Auto</label>
                  <select
                    value={filters.hasCar || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, hasCar: e.target.value || null }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Alle</option>
                    <option value="Ja">Ja</option>
                    <option value="Nein">Nein</option>
                  </select>
                </div>
              </div>

              {/* Verfügbarkeitsfilter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Verfügbarkeit</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.onlyAvailable}
                      onChange={(e) => setFilters(prev => ({ ...prev, onlyAvailable: e.target.checked, onlyBusy: false }))}
                      className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Nur verfügbare Mitarbeiter</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.onlyBusy}
                      onChange={(e) => setFilters(prev => ({ ...prev, onlyBusy: e.target.checked, onlyAvailable: false }))}
                      className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Nur verplante Mitarbeiter</span>
                  </label>
                </div>
              </div>

              {/* Filter zurücksetzen */}
              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Filter zurücksetzen
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Fahrzeug-Status */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              🚗 Fahrzeug-Status ({availableVehicles.length})
            </h2>
            {loadingVehicles && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Lade Fahrzeuge...
              </div>
            )}
          </div>

          {loadingVehicles ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-500 mt-2">Fahrzeuge werden geladen...</p>
            </div>
          ) : availableVehicles.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">🚗</div>
              <p className="text-gray-500">Keine Fahrzeuge verfügbar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableVehicles.map(vehicle => (
                <div
                  key={vehicle.id}
                  className={`border-2 rounded-lg p-4 transition-all hover:shadow-md ${
                    vehicle.availabilityStatus.status === 'available'
                      ? 'border-green-200 bg-green-50'
                      : 'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                        {vehicle.name}
                        {vehicle.availabilityStatus.status === 'available' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" title="Verfügbar" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-yellow-600" title="Verplant" />
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">ID: {vehicle.id}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      vehicle.availabilityStatus.status === 'available'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {vehicle.availabilityStatus.status === 'available' ? 'Verfügbar' : `${vehicle.availabilityStatus.appointments} Termin(e)`}
                    </div>
                  </div>

                  {/* Fahrzeug-Eigenschaften */}
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        🚗 {vehicle.vehicleType}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        📊 {vehicle.status}
                      </span>
                    </div>
                  </div>

                  {/* Termine */}
                  {vehicle.availabilityStatus.status === 'busy' && vehicle.availabilityStatus.details.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-yellow-200">
                      <details className="cursor-pointer">
                        <summary className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Termine im Zeitraum ({vehicle.availabilityStatus.appointments})
                        </summary>
                        <div className="mt-2 space-y-2 pl-6">
                          {vehicle.availabilityStatus.details.map((appointment, idx) => (
                            <div key={idx} className="text-sm text-gray-600">
                              <div className="font-medium">{format(new Date(appointment.date), 'dd.MM.yyyy', { locale: de })}</div>
                              <div className="text-xs text-gray-500">
                                {appointment.start} - {appointment.end} • {appointment.type}
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ergebnisse */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              👥 Mitarbeiter ({filteredEmployees.length})
            </h2>
            {loadingEmployees && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Lade Mitarbeiter...
              </div>
            )}
          </div>

          {loadingEmployees ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-500 mt-4">Mitarbeiter werden geladen...</p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Keine Mitarbeiter gefunden.</p>
              <p className="text-sm text-gray-400 mt-2">
                Passen Sie Ihre Suchkriterien an oder wählen Sie einen anderen Zeitraum.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredEmployees.map(employee => (
                <div
                  key={employee.id}
                  className={`border-2 rounded-lg p-4 transition-all hover:shadow-md ${
                    employee.availabilityStatus.status === 'available'
                      ? 'border-green-200 bg-green-50'
                      : 'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                        {employee.name}
                        {employee.availabilityStatus.status === 'available' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" title="Verfügbar" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-yellow-600" title="Verplant" />
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">ID: {employee.id}</p>
                    </div>
                    {selectedDeal && (
                      <div className="flex items-center gap-2 text-sm">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!selectedEmployees.find(e => e.id === employee.id)}
                            onChange={() => toggleEmployeeSelection(employee)}
                            className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                          />
                          Auswählen
                        </label>
                      </div>
                    )}
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      employee.availabilityStatus.status === 'available'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {employee.availabilityStatus.status === 'available' ? 'Verfügbar' : `${employee.availabilityStatus.appointments} Termin(e)`}
                    </div>
                  </div>

                  {/* Rollen-Zuordnung (sichtbar wenn ausgewählt) */}
                  {selectedDeal && isEmployeeSelected(employee.id) && (
                    <div className="mb-3">
                      <div className="text-xs text-gray-600 mb-1">Rolle im Umzug zuweisen:</div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <button onClick={() => toggleEmployeeRole(employee.id, 'driver12t')} className={`px-2 py-1 rounded border ${employeeHasRole(employee.id, 'driver12t') ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-700 border-blue-300'}`}>12t Fahrer</button>
                        <button onClick={() => toggleEmployeeRole(employee.id, 'driver7t5')} className={`px-2 py-1 rounded border ${employeeHasRole(employee.id, 'driver7t5') ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-700 border-indigo-300'}`}>7.5t Fahrer</button>
                        <button onClick={() => toggleEmployeeRole(employee.id, 'driver3t5')} className={`px-2 py-1 rounded border ${employeeHasRole(employee.id, 'driver3t5') ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-cyan-700 border-cyan-300'}`}>3.5t Fahrer</button>
                        <button onClick={() => toggleEmployeeRole(employee.id, 'monteure')} className={`px-2 py-1 rounded border ${employeeHasRole(employee.id, 'monteure') ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-amber-700 border-amber-300'}`}>Monteur</button>
                        <button onClick={() => toggleEmployeeRole(employee.id, 'helpers')} className={`px-2 py-1 rounded border ${employeeHasRole(employee.id, 'helpers') ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-700 border-emerald-300'}`}>Umzugshelfer</button>
                        <button onClick={() => toggleEmployeeRole(employee.id, 'piano')} className={`px-2 py-1 rounded border ${employeeHasRole(employee.id, 'piano') ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-700 border-purple-300'}`}>Klavierträger</button>
                      </div>
                    </div>
                  )}

                  {/* Eigenschaften */}
                  {employee.eigenschaften && Object.keys(employee.eigenschaften).length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-2">
                        {employee.eigenschaften.personal_properties_Fhrerscheinklasse && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            🚗 {employee.eigenschaften.personal_properties_Fhrerscheinklasse}
                          </span>
                        )}
                        {employee.eigenschaften.personal_properties_Klavierträger === 'Ja' && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                            🎹 Klavierträger
                          </span>
                        )}
                        {employee.eigenschaften.personal_properties_Vorarbeiter === 'Ja' && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                            👷 Vorarbeiter
                          </span>
                        )}
                        {employee.eigenschaften.personal_properties_Montagen === 'Ja' && (
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                            🔧 Montagen
                          </span>
                        )}
                        {employee.eigenschaften.personal_properties_Auto === 'Ja' && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                            🚙 Eigenes Auto
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Termine */}
                  {employee.availabilityStatus.status === 'busy' && employee.availabilityStatus.details.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-yellow-200">
                      <details className="cursor-pointer">
                        <summary className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Termine im Zeitraum ({employee.availabilityStatus.appointments})
                        </summary>
                        <div className="mt-2 space-y-2 pl-6">
                          {employee.availabilityStatus.details.map((appointment, idx) => (
                            <div key={idx} className="text-sm text-gray-600">
                              <div className="font-medium">{format(new Date(appointment.date), 'dd.MM.yyyy', { locale: de })}</div>
                              <div className="text-xs text-gray-500">
                                {appointment.start} - {appointment.end} • {appointment.type}
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeScheduling;

