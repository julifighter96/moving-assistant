import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Building, Calendar, Clock, MapPin, Save, Truck, X, Users, Filter, ChevronDown, ChevronUp, Navigation } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// Mitarbeiter-Übersicht Panel Komponente
const EmployeeOverviewPanel = ({ availableEmployees, loadingEmployees, selectedDate, onEmployeeAdd, assignedEmployees }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Filtere bereits zugewiesene Mitarbeiter aus
  const availableToAdd = availableEmployees.filter(emp => 
    !assignedEmployees.some(assigned => assigned.id === emp.id)
  );
  
  const availableCount = availableToAdd.filter(emp => emp.isAvailable).length;
  const busyCount = availableToAdd.filter(emp => !emp.isAvailable).length;
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-md mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left hover:bg-gray-50 p-3 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold flex items-center">
            <Building className="mr-2 h-6 w-6 text-primary" />
            Mitarbeiter-Übersicht
          </h3>
          {!loadingEmployees && (
            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              {availableCount} verfügbar, {busyCount} verplant
            </span>
          )}
        </div>
      </button>
      
      {isExpanded && (
        <div className="mt-4 space-y-3">
          {loadingEmployees ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-500 mt-3">Lade Mitarbeiter...</p>
            </div>
          ) : availableToAdd.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {availableEmployees.length === 0 
                ? 'Keine Mitarbeiter für dieses Datum gefunden.' 
                : 'Alle verfügbaren Mitarbeiter sind bereits zugewiesen.'}
            </div>
          ) : (
            <>
              {/* Verfügbare Mitarbeiter */}
              {availableToAdd.filter(emp => emp.isAvailable).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    Verfügbar ({availableToAdd.filter(emp => emp.isAvailable).length})
                  </h4>
                  <div className="space-y-2">
                    {availableToAdd.filter(emp => emp.isAvailable).map(employee => (
                      <div 
                        key={employee.id}
                        className="border border-green-200 rounded-lg p-4 bg-green-50 hover:bg-green-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-gray-900 text-base">{employee.name}</span>
                              <span className="text-green-600 text-sm font-medium">✓ Verfügbar</span>
                            </div>
                            {/* Skills anzeigen */}
                            {employee.eigenschaften && Object.keys(employee.eigenschaften).length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {employee.eigenschaften.personal_properties_Fhrerscheinklasse && (
                                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                                    🚗 {employee.eigenschaften.personal_properties_Fhrerscheinklasse}
                                  </span>
                                )}
                                {employee.eigenschaften.personal_properties_Klavierträger === 'Ja' && (
                                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded font-medium">
                                    🎹 Klavierträger
                                  </span>
                                )}
                                {employee.eigenschaften.personal_properties_Vorarbeiter === 'Ja' && (
                                  <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded font-medium">
                                    👷 Vorarbeiter
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => onEmployeeAdd({ 
                              id: employee.id, 
                              name: employee.name,
                              isAvailable: true 
                            })}
                            className="ml-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                          >
                            Hinzufügen
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Verplante Mitarbeiter */}
              {availableToAdd.filter(emp => !emp.isAvailable).length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-yellow-700 mb-3 flex items-center">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                    Verplant ({availableToAdd.filter(emp => !emp.isAvailable).length})
                  </h4>
                  <div className="space-y-2">
                    {availableToAdd.filter(emp => !emp.isAvailable).map(employee => (
                      <div 
                        key={employee.id}
                        className="border border-yellow-200 rounded-lg p-4 bg-yellow-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-gray-900 text-base">{employee.name}</span>
                              <span className="text-yellow-600 text-sm font-medium">⚠️ Verplant</span>
                            </div>
                            {/* Termine anzeigen */}
                            {employee.termine && employee.termine.length > 0 && (
                              <div className="text-sm text-gray-600">
                                <details className="cursor-pointer">
                                  <summary className="hover:text-gray-800 font-medium">
                                    {employee.termine.length} Termin{employee.termine.length > 1 ? 'e' : ''}
                                  </summary>
                                  <div className="mt-2 pl-3 space-y-1 border-l-2 border-yellow-300">
                                    {employee.termine.slice(0, 3).map((termin, idx) => (
                                      <div key={idx} className="text-sm">
                                        • {termin.startzeit || '?'} - {termin.endzeit || '?'}: {termin.terminart || 'Termin'}
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => onEmployeeAdd({ 
                              id: employee.id, 
                              name: employee.name,
                              isAvailable: false 
                            })}
                            className="ml-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                            title="Trotzdem hinzufügen (Überbuchung!)"
                          >
                            Trotzdem +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

const TourEmployeeAssignment = ({ tourData, onBack, onComplete }) => {
  const [assignedEmployees, setAssignedEmployees] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestSyncing, setIsTestSyncing] = useState(false);
  
  // Neue States für erweiterte Filter
  const [showFilters, setShowFilters] = useState(false);
  const [showTourDetails, setShowTourDetails] = useState(true);
  const [filters, setFilters] = useState({
    driverLicenses: [],
    pianoCarrier: null,
    foreman: null,
    assembly: null,
    hasCar: null,
    onlyAvailable: true, // Standard: nur verfügbare
  });
  
  // Transport-Arten pro Station
  const [stationTransportTypes, setStationTransportTypes] = useState({});
  
  // Rollen pro Mitarbeiter (Index -> Rollen-Array)
  const [employeeRoles, setEmployeeRoles] = useState({});
  
  // Mehrere Fahrzeuge pro Tour
  const [tourVehicles, setTourVehicles] = useState([]);
  const [selectedTourVehicles, setSelectedTourVehicles] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  
  // Transport-Arten Liste mit korrekten Terminart-IDs aus Stressfrei
  const transportTypes = [
    { 
      id: 'umzug', 
      name: 'Umzugsausführung', 
      icon: '📦',
      terminartId: '3a4df8a1-2387-11e8-839c-00113241b9d5'
    },
    { 
      id: 'klavier_abholung_lieferung', 
      name: 'Klaviertransport (Abholung und Lieferung)', 
      icon: '🎹',
      terminartId: '67179cb2-69c0-4a86-abe9-241f0a000e94'
    },
    { 
      id: 'klavier_nur_abholung', 
      name: 'Klaviertransport (nur Abholung)', 
      icon: '🎹',
      terminartId: '633441963-9de8-46b0-9627-1a8270a0e45b'
    },
    { 
      id: 'fluegel_abholung_lieferung', 
      name: 'Flügeltransport (Abholung und Lieferung)', 
      icon: '🎹',
      terminartId: '67179e8d-abe0-4916-a00b-236a0a000e94'
    },
    { 
      id: 'fluegel_nur_abholung', 
      name: 'Flügeltransport (nur Abholung)', 
      icon: '🎹',
      terminartId: '67179cd1-9ce8-47cd-9010-23eb0a000e94'
    },
    { 
      id: 'fluegel_nur_lieferung', 
      name: 'Flügeltransport (nur Lieferung)', 
      icon: '🎹',
      terminartId: '67179dc8-72dc-4110-8eb5-24a0a000e94'
    },
    { 
      id: 'maschinen', 
      name: 'Maschinennutzung', 
      icon: '⚙️',
      terminartId: '612f3c50-06e4-463d-824a-0e020a000e5a'
    },
    { 
      id: 'kartonanlief', 
      name: 'Kartonanlieferung', 
      icon: '📦',
      terminartId: '1c4ba741-2387-11e8-839c-00113241b9d5'
    },
    { 
      id: 'kartonabhol', 
      name: 'Kartonabholung', 
      icon: '📦',
      terminartId: '67179e4b-4168-4a61-95b1-24db0a000e94'
    },
    { 
      id: 'besichtigung', 
      name: 'Besichtigung', 
      icon: '👁️',
      terminartId: '5e3a990f-bd5c-4e44-b6da-403e0a000e93'
    },
  ];
  
  // Verfügbare Rollen (aus ROLLEN_REFERENZ.md)
  const availableRoles = [
    { id: 'Monteur', name: 'Monteur', icon: '🔧', description: 'Standard Montage/Umzug' },
    { id: 'Fahrer', name: 'Fahrer', icon: '🚗', description: 'Reiner Transport' },
    { id: 'Transportfachkraft', name: 'Transportfachkraft', icon: '📦', description: 'Spezialtransporte' },
    { id: 'Umzugskoordinator', name: 'Umzugskoordinator', icon: '📋', description: 'Koordination' },
    { id: 'Vorarbeiter_Fahrer', name: 'Vorarbeiter & Fahrer', icon: '👷', description: 'Führungsverantwortung' },
  ];

  // Konstanten aus .env
  // WICHTIG: URL muss "/api" am Anfang haben - API ist unter /api/sptimeschedule erreichbar
  // WICHTIG: URLs müssen über den Proxy gehen (lolworlds.online/api/...)
  const SPTIMESCHEDULE_API_URL = process.env.REACT_APP_SPTIMESCHEDULE_API_URL || 'https://lolworlds.online/api/sptimeschedule/saveSptimeschedule';
  const SERVICEPROVIDER_API_URL = process.env.REACT_APP_SERVICEPROVIDER_API_URL || 'https://lolworlds.online/api/serviceprovider/getServiceprovider';
  const SFS_API_TOKEN = process.env.REACT_APP_SFS_API_TOKEN;
  const DEFAULT_KENNZEICHEN = process.env.REACT_APP_DEFAULT_KENNZEICHEN || 'KA-RD 1234';
  
  // Fahrzeug-Typen für Touren (echte IDs und Kennzeichen)
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
  
  // Verfügbare Führerscheinklassen
  const licenseClasses = ['B', 'C1', 'C', 'CE', 'C1E', 'BE'];

  // Führerscheinklasse togglen
  const toggleLicense = (license) => {
    setFilters(prev => ({
      ...prev,
      driverLicenses: prev.driverLicenses.includes(license)
        ? prev.driverLicenses.filter(l => l !== license)
        : [...prev.driverLicenses, license]
    }));
  };

  // Filter zurücksetzen
  const resetFilters = () => {
    setFilters({
      driverLicenses: [],
      pianoCarrier: null,
      foreman: null,
      assembly: null,
      hasCar: null,
      onlyAvailable: true,
    });
  };

  // Lade verfügbare Mitarbeiter
  const fetchAvailableEmployees = useCallback(async () => {
    if (!tourData?.selectedDate) return;

    setLoadingEmployees(true);
    
    try {
      const dateStr = format(tourData.selectedDate, 'yyyy-MM-dd');
      
      // Baue die Skill-Anforderungen basierend auf den Filtern auf
      const skillRequirements = {};

      // Führerschein-Filter
      if (filters.driverLicenses.length > 0) {
        skillRequirements.personal_properties_Fhrerscheinklasse = filters.driverLicenses;
      } else {
        // Standard: C1 oder höher für Touren
        skillRequirements.personal_properties_Fhrerscheinklasse = ["C1", "C", "CE", "C1E"];
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
        date_from: dateStr,
        date_to: dateStr,
        skill: skillRequirements,
        joins: [
          "Vertraege",
          "Eigenschaften",
          "Termine"
        ]
      };

      if (!SFS_API_TOKEN) {
        console.error('❌ Kein API-Token konfiguriert! Bitte REACT_APP_SFS_API_TOKEN in .env setzen.');
        setAvailableEmployees([]);
        setLoadingEmployees(false);
        return;
      }

      const response = await axios.post(SERVICEPROVIDER_API_URL, requestBody, {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': SFS_API_TOKEN  // Direktes Token ohne "Bearer"
        }
      });

      if (response.data && Array.isArray(response.data)) {
        let employees = response.data
          .filter(item => {
            // Nur aktive Mitarbeiter laden (sp_teammember: null)
            const eigenschaften = item.Eigenschaften || {};
            return eigenschaften.sp_teammember === null;
          })
          .map(item => {
            const emp = item.Teammitglied || item;
            
            return {
              id: emp.Id || emp.id || emp.personalid || emp.uuid,
              name: emp.name || `${emp.Vorname || emp.vorname || ''} ${emp.Nachname || emp.nachname || ''}`.trim() || 'Unbekannt',
              eigenschaften: item.Eigenschaften || emp.Eigenschaften || {},
              vertraege: item.Vertraege || emp.Vertraege || [],
              termine: item.Termine || emp.Termine || [],
              isAvailable: !item.Termine || item.Termine.length === 0 || 
                           !item.Termine.some(termin => termin.datum === dateStr)
            };
          });

        // Filtere nach Verfügbarkeit
        if (filters.onlyAvailable) {
          employees = employees.filter(emp => emp.isAvailable);
        }

        setAvailableEmployees(employees);
      } else {
        setAvailableEmployees([]);
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der Mitarbeiter:', error);
      setAvailableEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  }, [tourData?.selectedDate, filters, SERVICEPROVIDER_API_URL, SFS_API_TOKEN]);

  useEffect(() => {
    fetchAvailableEmployees();
  }, [fetchAvailableEmployees]);

  // Lade verfügbare Fahrzeuge
  const fetchAvailableVehicles = useCallback(async () => {
    if (!SFS_API_TOKEN) {
      console.error('❌ Kein API-Token konfiguriert! Bitte REACT_APP_SFS_API_TOKEN in .env setzen.');
      return;
    }

    setLoadingVehicles(true);
    
    try {
      const dateStr = format(tourData.selectedDate, 'yyyy-MM-dd');
      
      const requestBody = {
        date_from: dateStr,
        date_to: dateStr,
        joins: [
          "Vertraege",
          "Eigenschaften",
          "Termine"
        ]
      };

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
              isAvailable: !item.Termine || item.Termine.length === 0 || 
                           !item.Termine.some(termin => termin.datum === dateStr)
            };
          });

        setAvailableVehicles(vehicles);
        console.log(`✅ [API] ServiceProvider - ${vehicles.length} Fahrzeuge geladen`);
      } else {
        setAvailableVehicles([]);
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der Fahrzeuge:', error);
      setAvailableVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  }, [tourData?.selectedDate, SERVICEPROVIDER_API_URL, SFS_API_TOKEN]);

  // Initialisiere Fahrzeuge basierend auf Tour-Daten
  useEffect(() => {
    if (tourData) {
      fetchAvailableVehicles();
      // Standard: Ein 3.5t LKW pro Tour
      const defaultVehicles = [{ ...vehicleTypes.find(v => v.id === '910'), index: 1 }];
      setTourVehicles(defaultVehicles);
      setSelectedTourVehicles(defaultVehicles);
    }
  }, [tourData, fetchAvailableVehicles]);

  // Mitarbeiter hinzufügen
  const handleEmployeeAdd = useCallback((employee) => {
    setAssignedEmployees(prev => {
      const newEmployees = [...prev, employee];
      // Setze Standard-Rolle für neuen Mitarbeiter
      const newIndex = newEmployees.length - 1;
      setEmployeeRoles(prevRoles => ({
        ...prevRoles,
        [newIndex]: ['Monteur'] // Standard-Rolle
      }));
      return newEmployees;
    });
  }, []);

  // Mitarbeiter entfernen
  const handleEmployeeRemove = useCallback((index) => {
    setAssignedEmployees(prev => {
      const newEmployees = prev.filter((_, i) => i !== index);
      // Reorganisiere Rollen-Indizes
      const newRoles = {};
      newEmployees.forEach((_, newIndex) => {
        const oldIndex = prev.findIndex((emp, oldIdx) => 
          oldIdx >= (oldIdx < index ? newIndex : newIndex + 1) && 
          emp.id === newEmployees[newIndex].id
        );
        if (employeeRoles[oldIndex > index ? oldIndex : oldIndex]) {
          newRoles[newIndex] = employeeRoles[oldIndex > index ? oldIndex : oldIndex];
        }
      });
      setEmployeeRoles(newRoles);
      return newEmployees;
    });
  }, [employeeRoles]);
  
  // Rolle für Mitarbeiter ändern
  const handleRoleChange = useCallback((employeeIndex, role) => {
    setEmployeeRoles(prev => ({
      ...prev,
      [employeeIndex]: [role] // Immer als Array
    }));
  }, []);
  
  // Mehrere Rollen für Mitarbeiter togglen
  const toggleEmployeeRole = useCallback((employeeIndex, role) => {
    setEmployeeRoles(prev => {
      const currentRoles = prev[employeeIndex] || ['Monteur'];
      const hasRole = currentRoles.includes(role);
      
      if (hasRole) {
        // Entferne Rolle (mindestens eine Rolle muss bleiben)
        const newRoles = currentRoles.filter(r => r !== role);
        return {
          ...prev,
          [employeeIndex]: newRoles.length > 0 ? newRoles : ['Monteur']
        };
      } else {
        // Füge Rolle hinzu
        return {
          ...prev,
          [employeeIndex]: [...currentRoles, role]
        };
      }
    });
  }, []);

  // TEST: API-Pfad-Debugging mit verschiedenen Pfadvariationen
  const handleTestApiPaths = useCallback(async () => {
    console.log('🔍 ========== API-PFAD-DEBUGGING ==========');
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
        url: SPTIMESCHEDULE_API_URL,
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
      kommentar: '[API-PFAD-TEST] Test-Termin für Pfad-Debugging',
      rolle: ['Monteur'],
      kennzeichen: DEFAULT_KENNZEICHEN
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
            'Authorization': SFS_API_TOKEN
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
    let summaryMessage = `🔍 API-PFAD-DEBUGGING ABGESCHLOSSEN\n\n`;
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
    
  }, [SPTIMESCHEDULE_API_URL, SFS_API_TOKEN, DEFAULT_KENNZEICHEN]);

  // TEST: Nur Termine an SPTimeSchedule senden (ohne Pipedrive)
  const handleTestSync = useCallback(async () => {
    if (assignedEmployees.length === 0) {
      alert('⚠️ Bitte weisen Sie mindestens einen Mitarbeiter zu.');
      return;
    }

    if (selectedTourVehicles.length === 0) {
      alert('⚠️ Bitte wählen Sie mindestens ein Fahrzeug aus.');
      return;
    }

    setIsTestSyncing(true);

    try {
      console.log('🧪 TEST-SYNC: Sende Termine an SPTimeSchedule (ohne Pipedrive)...');
      
      const appointments = [];
      
      // Für jedes Fahrzeug
      selectedTourVehicles.forEach((vehicle, vehicleIndex) => {
        // Für jeden Mitarbeiter
        assignedEmployees.forEach((employee, employeeIndex) => {
          const employeeRolle = employeeRoles[employeeIndex] || ['Monteur'];
          
          // Prüfe ob Mitarbeiter bereits Termine an diesem Tag hat
          const existingAppointments = employee.termine?.filter(termin => 
            termin.datum === format(tourData.selectedDate, 'yyyy-MM-dd')
          ) || [];

          // Erstelle einen Termin pro Station
          tourData.stations?.forEach((station, stationIndex) => {
            const transportType = stationTransportTypes[stationIndex];
            
            // Bestimme Terminart basierend auf Transport-Art
            let terminartId = vehicle.terminartId || tourData.selectedTerminartId || '3a4df8a1-2387-11e8-839c-00113241b9d5'; // Standard: Umzugsausführung
          
            if (transportType) {
              // Finde die Transport-Art und nutze ihre terminartId
              const selectedTransportType = transportTypes.find(t => t.id === transportType);
              if (selectedTransportType && selectedTransportType.terminartId) {
                terminartId = selectedTransportType.terminartId;
                console.log(`🎯 Station ${stationIndex + 1}: Transport-Art "${selectedTransportType.name}" → Terminart: ${terminartId}`);
              }
            }
            
            const stationDeal = tourData.tourDeals?.find(deal => 
              station.legDescription.includes(deal.title?.split(' ')[0]) ||
              station.legDescription.includes(deal.originAddress?.split(',')[0]) ||
              station.legDescription.includes(deal.destinationAddress?.split(',')[0])
            ) || tourData.tourDeals?.[0];
            
            // Formatiere Zeiten korrekt (HH:MM:SS)
            const formatTime = (time) => {
              if (!time) return '08:00:00';
              return time.length === 5 ? `${time}:00` : time;
            };
            
            // Berechne die Dauer der Station
            const calculateDuration = (startTime, endTime) => {
              const start = new Date(`2000-01-01T${startTime}:00`);
              const end = new Date(`2000-01-01T${endTime}:00`);
              const diffMs = end - start;
              return Math.floor(diffMs / (1000 * 60)); // Minuten
            };
            
            // Berechne Start- und Endzeit für diese Station
            let stationStart = formatTime(station.startTime);
            let stationEnd = station.endTime 
              ? formatTime(station.endTime) 
              : formatTime(station.startTime); // Falls keine Endzeit, nutze Startzeit

            // Berechne Dauer der Station
            const stationDuration = calculateDuration(stationStart, stationEnd);
            
            // Finde den nächsten freien Zeitraum für diese Station
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
                
                if (gapMinutes >= stationDuration) {
                  stationStart = currentEnd;
                  const gapStartTime = new Date(gapStart.getTime() + 1 * 60 * 1000); // +1 Minute Puffer
                  const newEndTime = new Date(gapStartTime.getTime() + stationDuration * 60 * 1000);
                  stationEnd = newEndTime.toTimeString().slice(0, 8);
                  foundGap = true;
                  break;
                }
              } else {
                // Nach dem letzten Termin
                const lastEnd = new Date(`2000-01-01T${currentEnd}:00`);
                const newStart = new Date(lastEnd.getTime() + 15 * 60 * 1000); // +15 Minuten Puffer
                const newEnd = new Date(newStart.getTime() + stationDuration * 60 * 1000);
                
                stationStart = newStart.toTimeString().slice(0, 8);
                stationEnd = newEnd.toTimeString().slice(0, 8);
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
              const newEnd = new Date(newStart.getTime() + stationDuration * 60 * 1000);
              
              stationStart = newStart.toTimeString().slice(0, 8);
              stationEnd = newEnd.toTimeString().slice(0, 8);
            }
          }

            console.log(`📅 [TEST] ${employee.name} (${vehicle.name}) - Station ${stationIndex + 1}: ${stationStart} - ${stationEnd} (${stationDuration} Min)`);
            
            const kommentar = `[TEST] Tour: ${tourData.tourId} | Fahrzeug: ${vehicle.name} (${vehicle.kennzeichen}) | Station ${stationIndex + 1}/${tourData.stations.length} | ${station.legDescription} | Dauer: ${stationDuration} Min`;
            
            appointments.push({
              personalid: employee.id,
              terminart: terminartId,
              vorgangsno: stationDeal?.dealId?.toString() || 'TEST',
              angebotsno: stationDeal?.id?.toString() || 'TEST',
              datum: format(tourData.selectedDate, 'yyyy-MM-dd'),
              startzeit: stationStart,
              endzeit: stationEnd,
              kommentar: kommentar.substring(0, 500),
              rolle: employeeRolle,
              kennzeichen: vehicle.kennzeichen
            });
          });
        });
      });

      console.log('📤 TEST-SYNC: Sende', appointments.length, 'Termine...');
      console.log('═══════════════════════════════════════════');
      console.log('📋 VOLLSTÄNDIGER PAYLOAD:');
      console.log(JSON.stringify(appointments, null, 2));
      console.log('═══════════════════════════════════════════');
      console.log('🌐 API URL:', SPTIMESCHEDULE_API_URL);
      console.log('🔑 API Token vorhanden?', !!SFS_API_TOKEN);
      console.log('🔑 API Token (erste 20 Zeichen):', SFS_API_TOKEN?.substring(0, 20) + '...');
      console.log('═══════════════════════════════════════════');

      // KORREKTES FORMAT: Authorization mit Token direkt (ohne "Bearer")
      const response = await axios.post(SPTIMESCHEDULE_API_URL, appointments, {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': SFS_API_TOKEN  // Direktes Token ohne "Bearer"
        }
      });

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

      if (response && (response.status === 200 || response.status === 201)) {
        const transportCounts = {};
        Object.values(stationTransportTypes).forEach(type => {
          if (type) transportCounts[type] = (transportCounts[type] || 0) + 1;
        });
        
        let testMessage = `✅ TEST ERFOLGREICH!\n\n`;
        testMessage += `API Response Status: ${response.status}\n`;
        testMessage += `${appointments.length} Termine an SPTimeSchedule gesendet:\n`;
        testMessage += `• ${assignedEmployees.length} Mitarbeiter\n`;
        testMessage += `• ${tourData.stations?.length || 0} Stationen pro Mitarbeiter\n\n`;
        
        if (Object.keys(transportCounts).length > 0) {
          testMessage += 'Transport-Arten:\n';
          Object.entries(transportCounts).forEach(([type, count]) => {
            const typeInfo = transportTypes.find(t => t.id === type);
            testMessage += `  • ${typeInfo?.icon || ''} ${typeInfo?.name || type}: ${count}×\n`;
          });
        }
        
        testMessage += `\n⚠️ HINWEIS: Dies war ein TEST.\n`;
        testMessage += `Die Tour wurde NICHT in Pipedrive gespeichert.\n`;
        testMessage += `Die Termine sollten im Kalender sichtbar sein!\n`;
        testMessage += `\nResponse: ${JSON.stringify(response.data).substring(0, 100)}...`;
        
        alert(testMessage);
      } else {
        console.warn('⚠️ Unerwarteter Status:', response?.status);
        throw new Error(`Status ${response?.status || 'undefined'}`);
      }
    } catch (error) {
      console.error('═══════════════════════════════════════════');
      console.error('❌ TEST-SYNC FEHLER:');
      console.error('Error Message:', error.message);
      console.error('Error Response:', error.response?.data);
      console.error('Error Status:', error.response?.status);
      console.error('Error Headers:', error.response?.headers);
      console.error('Full Error:', error);
      console.error('═══════════════════════════════════════════');
      
      let errorMessage = `❌ TEST fehlgeschlagen!\n\n`;
      errorMessage += `Fehler: ${error.message}\n`;
      
      if (error.response) {
        errorMessage += `\nHTTP Status: ${error.response.status}\n`;
        errorMessage += `Server-Antwort: ${JSON.stringify(error.response.data)}\n`;
      }
      
      errorMessage += `\n🔍 Prüfen Sie:\n`;
      errorMessage += `1. Browser-Konsole (F12) für Details\n`;
      errorMessage += `2. API-Token in .env korrekt?\n`;
      errorMessage += `3. Mitarbeiter-IDs gültig?\n`;
      errorMessage += `4. Terminarten-IDs korrekt?\n`;
      
      alert(errorMessage);
    } finally {
      setIsTestSyncing(false);
    }
  }, [assignedEmployees, tourData, stationTransportTypes, transportTypes, employeeRoles, SPTIMESCHEDULE_API_URL, SFS_API_TOKEN, DEFAULT_KENNZEICHEN, availableRoles]);

  // Tour speichern (falls noch nicht gespeichert)
  const saveTourToPipedrive = useCallback(async () => {
    const apiToken = process.env.REACT_APP_PIPEDRIVE_API_TOKEN;
    const apiUrl = process.env.REACT_APP_PIPEDRIVE_API_URL || 'https://api.pipedrive.com/v1';
    const TARGET_PHASE_ID = 25;
    const PROJECT_TOUR_DATE_FIELD_KEY = "3c7b83b905a2d762409414672a4aa1450e966d49";
    const PROJECT_TOUR_ID_FIELD_KEY = "7cfa771db86bba5afa46a05a82ff66734524c981";
    
    // API Keys für Datum, Startzeit und Endzeit
    const START_TIME_FIELD_KEY = "f1f4075cad46accd63b6b3e396deb452727078e2";
    const DATE_FIELD_KEY = "c9993f8e353d54015c7a15e8b653cf88e594f5fb";
    const END_TIME_FIELD_KEY = "32934b3ccd3a0d8c6d88c34a9782790ba0c8d7cf";

    if (!apiToken) {
      throw new Error('Pipedrive API Token nicht konfiguriert');
    }

    const tourDateFormatted = format(tourData.selectedDate, 'dd.MM.yyyy', { locale: de });
    // Formatiere Datum für Pipedrive (YYYY-MM-DD)
    const tourDateForPipedrive = format(tourData.selectedDate, 'yyyy-MM-dd');
    
    let successCount = 0;
    let errorCount = 0;

    const updatePromises = tourData.tourDeals.map(async (deal) => {
      const projectId = deal.id;
      if (!projectId) {
        console.warn("Überspringe Deal ohne Projekt-ID:", deal.title);
        errorCount++;
        return;
      }

      // Finde die Station, die zu diesem Deal gehört
      let dealStartTime = null;
      let dealEndTime = null;
      
      if (tourData.stations && Array.isArray(tourData.stations)) {
        // Suche in den Stationen nach diesem Deal
        for (const station of tourData.stations) {
          // Prüfe ob der Deal-Titel oder Adressen in der Station-Description vorkommen
          const dealTitleMatch = station.legDescription && deal.title && 
            station.legDescription.includes(deal.title.split(' ')[0]);
          const dealOriginMatch = deal.originAddress && station.legDescription &&
            station.legDescription.includes(deal.originAddress.split(',')[0]);
          const dealDestMatch = deal.destinationAddress && station.legDescription &&
            station.legDescription.includes(deal.destinationAddress.split(',')[0]);
          
          if (dealTitleMatch || dealOriginMatch || dealDestMatch) {
            dealStartTime = station.startTime; // z.B. "08:30"
            dealEndTime = station.endTime; // z.B. "10:45"
            console.log(`📅 [EmployeeAssignment] Deal "${deal.title}" gehört zu Station: ${dealStartTime} - ${dealEndTime}`);
            break;
          }
        }
      }

      const updateData = {
        phase_id: TARGET_PHASE_ID,
        [PROJECT_TOUR_DATE_FIELD_KEY]: tourDateFormatted,
        [PROJECT_TOUR_ID_FIELD_KEY]: tourData.tourId,
        // Neue Felder für Datum, Startzeit und Endzeit
        [DATE_FIELD_KEY]: tourDateForPipedrive,
      };

      // Füge Startzeit hinzu, falls gefunden
      if (dealStartTime) {
        // Konvertiere Zeitformat zu HH:MM:SS falls nötig
        const startTimeFormatted = dealStartTime.length === 5 ? `${dealStartTime}:00` : dealStartTime;
        updateData[START_TIME_FIELD_KEY] = startTimeFormatted;
      }

      // Füge Endzeit hinzu, falls gefunden
      if (dealEndTime) {
        // Konvertiere Zeitformat zu HH:MM:SS falls nötig
        const endTimeFormatted = dealEndTime.length === 5 ? `${dealEndTime}:00` : dealEndTime;
        updateData[END_TIME_FIELD_KEY] = endTimeFormatted;
      }

      try {
        const response = await axios.put(
          `${apiUrl}/projects/${projectId}?api_token=${apiToken}`,
          updateData
        );
        if (response.data && response.data.success) {
          successCount++;
          const timeInfo = dealStartTime && dealEndTime 
            ? ` - Zeiten: ${dealStartTime} bis ${dealEndTime}` 
            : ' - Keine Zeiten gefunden';
          console.log(`✅ [EmployeeAssignment] Projekt ${projectId} (${deal.title}) erfolgreich aktualisiert${timeInfo}`);
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`Fehler beim Aktualisieren von Projekt ${projectId}:`, error);
        errorCount++;
      }
    });

    await Promise.all(updatePromises);

    return { successCount, errorCount };
  }, [tourData]);

  // Termine speichern (und ggf. Tour)
  const handleSaveAssignment = useCallback(async () => {
    if (assignedEmployees.length === 0) {
      alert('Bitte weisen Sie mindestens einen Mitarbeiter zu.');
      return;
    }

    if (selectedTourVehicles.length === 0) {
      alert('⚠️ Bitte wählen Sie mindestens ein Fahrzeug aus.');
      return;
    }

    setIsSaving(true);

    try {
      // Sammle Ergebnisse für finale Meldung
      const results = {
        tourSaved: false,
        appointmentsSaved: false,
        errors: []
      };

      // 1. Tour in Pipedrive speichern (falls noch nicht gespeichert)
      if (!tourData.isSaved) {
        console.log('📝 Speichere Tour in Pipedrive...');
        const tourSaveResult = await saveTourToPipedrive();
        console.log(`✅ Tour gespeichert: ${tourSaveResult.successCount} Projekte aktualisiert, ${tourSaveResult.errorCount} Fehler`);
        results.tourSaved = tourSaveResult.successCount > 0;
        if (tourSaveResult.errorCount > 0) {
          results.errors.push(`${tourSaveResult.errorCount} Projekte konnten nicht aktualisiert werden`);
        }
      }

      // 2. Termine für Mitarbeiter buchen - JEDE STATION ALS SEPARATER TERMIN
      console.log('📅 Buche Termine für Mitarbeiter...');
      
      const appointments = [];
      
      // Für jedes Fahrzeug
      selectedTourVehicles.forEach((vehicle, vehicleIndex) => {
        // Für jeden Mitarbeiter
        assignedEmployees.forEach((employee, employeeIndex) => {
          const employeeRolle = employeeRoles[employeeIndex] || ['Monteur'];
          
          // Prüfe ob Mitarbeiter bereits Termine an diesem Tag hat
          const existingAppointments = employee.termine?.filter(termin => 
            termin.datum === format(tourData.selectedDate, 'yyyy-MM-dd')
          ) || [];

          // Erstelle einen Termin pro Station
          tourData.stations?.forEach((station, stationIndex) => {
            const transportType = stationTransportTypes[stationIndex];
            
            // Bestimme Terminart basierend auf Transport-Art
            let terminartId = vehicle.terminartId || tourData.selectedTerminartId || '3a4df8a1-2387-11e8-839c-00113241b9d5'; // Standard: Umzugsausführung
          
            if (transportType) {
              // Finde die Transport-Art und nutze ihre terminartId
              const selectedTransportType = transportTypes.find(t => t.id === transportType);
              if (selectedTransportType && selectedTransportType.terminartId) {
                terminartId = selectedTransportType.terminartId;
                console.log(`🎯 PRODUKTIV - Station ${stationIndex + 1}: "${selectedTransportType.name}" → ${terminartId}`);
              }
            }
          
            // Finde zugehörigen Deal für diese Station
            const stationDeal = tourData.tourDeals?.find(deal => 
              station.legDescription.includes(deal.title?.split(' ')[0]) ||
              station.legDescription.includes(deal.originAddress?.split(',')[0]) ||
              station.legDescription.includes(deal.destinationAddress?.split(',')[0])
            ) || tourData.tourDeals?.[0]; // Fallback auf ersten Deal
          
            // Formatiere Zeiten korrekt (HH:MM:SS)
            const formatTime = (time) => {
              if (!time) return '08:00:00';
              return time.length === 5 ? `${time}:00` : time;
            };
            
            // Berechne die Dauer der Station
            const calculateDuration = (startTime, endTime) => {
              const start = new Date(`2000-01-01T${startTime}:00`);
              const end = new Date(`2000-01-01T${endTime}:00`);
              const diffMs = end - start;
              return Math.floor(diffMs / (1000 * 60)); // Minuten
            };
            
            // Berechne Start- und Endzeit für diese Station
            let stationStart = formatTime(station.startTime);
            let stationEnd = station.endTime 
              ? formatTime(station.endTime) 
              : formatTime(station.startTime);

            // Berechne Dauer der Station
            const stationDuration = calculateDuration(stationStart, stationEnd);
            
            // Finde den nächsten freien Zeitraum für diese Station
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
                
                if (gapMinutes >= stationDuration) {
                  stationStart = currentEnd;
                  const gapStartTime = new Date(gapStart.getTime() + 1 * 60 * 1000); // +1 Minute Puffer
                  const newEndTime = new Date(gapStartTime.getTime() + stationDuration * 60 * 1000);
                  stationEnd = newEndTime.toTimeString().slice(0, 8);
                  foundGap = true;
                  break;
                }
              } else {
                // Nach dem letzten Termin
                const lastEnd = new Date(`2000-01-01T${currentEnd}:00`);
                const newStart = new Date(lastEnd.getTime() + 15 * 60 * 1000); // +15 Minuten Puffer
                const newEnd = new Date(newStart.getTime() + stationDuration * 60 * 1000);
                
                stationStart = newStart.toTimeString().slice(0, 8);
                stationEnd = newEnd.toTimeString().slice(0, 8);
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
              const newEnd = new Date(newStart.getTime() + stationDuration * 60 * 1000);
              
              stationStart = newStart.toTimeString().slice(0, 8);
              stationEnd = newEnd.toTimeString().slice(0, 8);
            }
          }

          console.log(`📅 [PRODUKTIV] ${employee.name} (${vehicle.name}) - Station ${stationIndex + 1}: ${stationStart} - ${stationEnd} (${stationDuration} Min)`);
          
          const kommentar = `Tour: ${tourData.tourId} | Fahrzeug: ${vehicle.name} (${vehicle.kennzeichen}) | Station ${stationIndex + 1}/${tourData.stations.length} | ${station.legDescription} | Dauer: ${stationDuration} Min`;
          
          appointments.push({
            personalid: employee.id,
            terminart: terminartId,
            vorgangsno: stationDeal?.dealId?.toString() || '',
            angebotsno: stationDeal?.id?.toString() || '',
            datum: format(tourData.selectedDate, 'yyyy-MM-dd'),
            startzeit: stationStart,
            endzeit: stationEnd,
            kommentar: kommentar.substring(0, 500),
            rolle: employeeRolle,
            kennzeichen: vehicle.kennzeichen
          });
          });
        });
      });
      
      console.log('📤 PRODUKTIV-SYNC: Sende', appointments.length, 'Termine...');
      console.log('═══════════════════════════════════════════');
      console.log('📋 PAYLOAD:');
      console.log(JSON.stringify(appointments, null, 2));
      console.log('═══════════════════════════════════════════');

      const response = await axios.post(SPTIMESCHEDULE_API_URL, appointments, {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': SFS_API_TOKEN  // Direktes Token ohne "Bearer"
        }
      });
      
      console.log('═══════════════════════════════════════════');
      console.log('✅ RESPONSE STATUS:', response.status);
      console.log('📦 RESPONSE DATA:', response.data);
      console.log('═══════════════════════════════════════════');
      
      // Prüfe ob Response HTML ist
      const isHtml = typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>');
      if (isHtml) {
        throw new Error('Auth fehlgeschlagen - API gibt Login-Seite zurück');
      }

      if (response.status === 200 || response.status === 201) {
        console.log('✅ Termine erfolgreich gebucht');
        results.appointmentsSaved = true;
      } else {
        console.warn('⚠️ Termin-Buchung fehlgeschlagen:', response.status);
        results.errors.push(`Termine: Status ${response.status}`);
      }

      // Erstelle detaillierte Erfolgsmeldung
      let successMessage = '✅ Erfolgreich gespeichert!\n\n';
      
      if (results.tourSaved) {
        successMessage += '✅ Tour in Pipedrive gespeichert\n';
      }
      
      if (results.appointmentsSaved) {
        const totalAppointments = assignedEmployees.length * selectedTourVehicles.length * (tourData.stations?.length || 0);
        successMessage += `✅ ${totalAppointments} Kalendertermine gebucht\n`;
        successMessage += `   → ${assignedEmployees.length} Mitarbeiter × ${selectedTourVehicles.length} Fahrzeuge × ${tourData.stations?.length || 0} Stationen\n`;
        successMessage += `   → Jede Station als separater Termin mit eigener Transport-Art\n`;
        
        // Zeige Fahrzeuge an
        if (selectedTourVehicles.length > 0) {
          successMessage += '   → Fahrzeuge: ';
          successMessage += selectedTourVehicles.map(vehicle => 
            `${vehicle.icon} ${vehicle.name} (${vehicle.kennzeichen})`
          ).join(', ');
          successMessage += '\n';
        }
        
        // Zeige Transport-Arten an
        const transportCounts = {};
        Object.values(stationTransportTypes).forEach(type => {
          if (type) transportCounts[type] = (transportCounts[type] || 0) + 1;
        });
        if (Object.keys(transportCounts).length > 0) {
          successMessage += '   → Transport-Arten: ';
          successMessage += Object.entries(transportCounts).map(([type, count]) => {
            const typeInfo = transportTypes.find(t => t.id === type);
            return `${typeInfo?.icon || ''} ${typeInfo?.name || type} (${count}×)`;
          }).join(', ');
          successMessage += '\n';
        }
        
        // Zeige Mitarbeiter mit Rollen
        successMessage += '\nMitarbeiter & Rollen:\n';
        assignedEmployees.forEach((emp, idx) => {
          const roles = employeeRoles[idx] || ['Monteur'];
          const roleNames = roles.map(roleId => {
            const roleInfo = availableRoles.find(r => r.id === roleId);
            return roleInfo ? `${roleInfo.icon} ${roleInfo.name}` : roleId;
          }).join(', ');
          successMessage += `  • ${emp.name}: ${roleNames}\n`;
        });
      }
      
      if (results.errors.length > 0) {
        successMessage += '\n⚠️ Warnungen:\n' + results.errors.map(e => `  • ${e}`).join('\n');
      }
      
      successMessage += `\nTour: "${tourData.tourId}"`;

      alert(successMessage);
      onComplete?.(assignedEmployees);
      
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert(`❌ Fehler beim Speichern: ${error.message || error.response?.data?.message || 'Unbekannter Fehler'}`);
    } finally {
      setIsSaving(false);
    }
  }, [assignedEmployees, tourData, DEFAULT_KENNZEICHEN, SPTIMESCHEDULE_API_URL, SFS_API_TOKEN, onComplete, saveTourToPipedrive, stationTransportTypes, transportTypes, employeeRoles, availableRoles]);

  if (!tourData) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Keine Tour-Daten verfügbar.</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Zurück
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Zurück zur Tourenplanung
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mitarbeiterplanung für Tour</h1>
            <p className="text-gray-600 mt-2">Weisen Sie Mitarbeiter für die Tour zu</p>
          </div>
          <div className="text-sm text-gray-500 bg-blue-50 px-4 py-2 rounded-lg">
            💡 Tipp: Für eine umfassende Mitarbeiterübersicht nutzen Sie das 
            <span className="font-semibold text-blue-700"> Personalmanagement-Modul</span>
          </div>
        </div>
      </div>

      {/* Hinweis: Tour noch nicht gespeichert */}
      {!tourData.isSaved && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded-r-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 font-medium">
                ℹ️ Tour noch nicht gespeichert
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Die Tour wird beim Speichern der Mitarbeiter-Zuweisung automatisch in Pipedrive gespeichert.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tour-Informationen - Neu gestaltet */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Truck className="h-7 w-7 text-primary" />
              {tourData.tourName || tourData.tourId}
              {!tourData.isSaved && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded border border-yellow-300 font-semibold">
                  Nicht gespeichert
                </span>
              )}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-medium">Datum</span>
                </div>
                <div className="font-semibold text-gray-900">{format(tourData.selectedDate, 'dd.MM.yyyy', { locale: de })}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-medium">Startzeit</span>
                </div>
                <div className="font-semibold text-gray-900">{tourData.tourStartTime || '08:00'} Uhr</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <MapPin className="h-4 w-4" />
                  <span className="text-xs font-medium">Stationen</span>
                </div>
                <div className="font-semibold text-gray-900">{tourData.stations?.length || 0} Stationen</div>
              </div>
              {tourData.totalDuration && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-medium">Gesamtdauer</span>
                  </div>
                  <div className="font-semibold text-gray-900">{tourData.totalDuration} Min</div>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowTourDetails(!showTourDetails)}
            className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            title={showTourDetails ? 'Details ausblenden' : 'Details anzeigen'}
          >
            {showTourDetails ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
          </button>
        </div>

        {/* Tour-Details aufklappbar */}
        {showTourDetails && tourData.stations && tourData.stations.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Navigation className="mr-2 h-5 w-5 text-primary" />
              Stationen-Übersicht
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {tourData.stations.map((station, idx) => (
                <div key={idx} className="bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    {/* Station Nummer */}
                    <div className="flex-shrink-0">
                      <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                        {idx + 1}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* Adresse */}
                      <div className="font-semibold text-gray-900 mb-2 flex items-center justify-between">
                        <span className="truncate">{station.legDescription}</span>
                      </div>
                      
                      {/* Transport-Art Auswahl */}
                      <div className="mb-3">
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Transport-Art:</label>
                        <select
                          value={stationTransportTypes[idx] || ''}
                          onChange={(e) => setStationTransportTypes(prev => ({ ...prev, [idx]: e.target.value }))}
                          className="w-full text-sm p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                        >
                          <option value="">Nicht angegeben</option>
                          {transportTypes.map(type => (
                            <option key={type.id} value={type.id}>
                              {type.icon} {type.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Zeitinformationen */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        <div className="bg-blue-50 rounded px-2 py-1.5">
                          <div className="text-gray-600 font-medium">Ankunft</div>
                          <div className="text-gray-900 font-semibold">{station.startTime}</div>
                        </div>
                        {station.duration > 0 && (
                          <>
                            <div className="bg-orange-50 rounded px-2 py-1.5">
                              <div className="text-gray-600 font-medium">Arbeit</div>
                              <div className="text-gray-900 font-semibold">{station.duration} Min</div>
                            </div>
                            <div className="bg-green-50 rounded px-2 py-1.5">
                              <div className="text-gray-600 font-medium">Fertig</div>
                              <div className="text-gray-900 font-semibold">{station.endTime}</div>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {station.drivingTime > 0 && (
                        <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                          <span>🚗</span>
                          <span>Fahrtzeit: {station.drivingTime} Min</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter-Bereich */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Mitarbeiter-Filterkriterien
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-primary hover:text-primary-dark font-medium"
          >
            {showFilters ? 'Filter ausblenden' : 'Filter anzeigen'}
          </button>
        </div>

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
              {filters.driverLicenses.length === 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Standard: C1, C, CE, C1E werden gesucht
                </p>
              )}
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
                    onChange={(e) => setFilters(prev => ({ ...prev, onlyAvailable: e.target.checked }))}
                    className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Nur verfügbare Mitarbeiter</span>
                </label>
              </div>
            </div>

            {/* Filter-Aktionen */}
            <div className="flex justify-between pt-4 border-t">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Filter zurücksetzen
              </button>
              <button
                onClick={fetchAvailableEmployees}
                disabled={loadingEmployees}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {loadingEmployees ? 'Lädt...' : 'Filter anwenden'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Linke Spalte: Mitarbeiter-Übersicht */}
        <div className="lg:col-span-2">
          <EmployeeOverviewPanel
            availableEmployees={availableEmployees}
            loadingEmployees={loadingEmployees}
            selectedDate={tourData.selectedDate}
            onEmployeeAdd={handleEmployeeAdd}
            assignedEmployees={assignedEmployees}
          />
        </div>

        {/* Rechte Spalte: Zugewiesene Mitarbeiter */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-md sticky top-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Users className="mr-2 h-6 w-6 text-primary" />
              Zugewiesene Mitarbeiter
            </h3>
            
            {/* Fahrzeugauswahl für Tour */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                <Truck className="mr-2 h-4 w-4" />
                Fahrzeuge für diese Tour
              </h4>
              
              {loadingVehicles ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-blue-600 mt-2">Lade Fahrzeuge...</p>
                </div>
              ) : availableVehicles.length === 0 ? (
                <div className="text-center py-4 text-blue-600">
                  <p className="text-sm">Keine Fahrzeuge verfügbar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableVehicles.map((vehicle, index) => (
                    <label key={index} className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      vehicle.isAvailable 
                        ? 'border-green-200 bg-green-50 hover:bg-green-100' 
                        : 'border-yellow-200 bg-yellow-50'
                    }`}>
                      <input
                        type="checkbox"
                        checked={selectedTourVehicles.some(v => v.id === vehicle.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTourVehicles(prev => [...prev, { ...vehicle, index: 1 }]);
                          } else {
                            setSelectedTourVehicles(prev => prev.filter(v => v.id !== vehicle.id));
                          }
                        }}
                        className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🚛</span>
                          <span className="font-medium text-gray-900">{vehicle.name}</span>
                          {vehicle.isAvailable ? (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Verfügbar</span>
                          ) : (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Verplant</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">ID: {vehicle.id}</div>
                        {vehicle.termine && vehicle.termine.length > 0 && (
                          <div className="text-xs text-yellow-600 mt-1">
                            {vehicle.termine.length} Termin{vehicle.termine.length > 1 ? 'e' : ''} an diesem Tag
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-blue-700 mt-2">
                💡 Wählen Sie die Fahrzeuge aus, die für diese Tour verwendet werden sollen.
              </p>
            </div>
            
            {assignedEmployees.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-16 w-16 mx-auto mb-3 text-gray-300" />
                <p>Keine Mitarbeiter zugewiesen</p>
                <p className="text-sm mt-2">Wählen Sie Mitarbeiter aus der Liste</p>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {assignedEmployees.map((employee, index) => {
                  const currentRoles = employeeRoles[index] || ['Monteur'];
                  
                  return (
                    <div 
                      key={index}
                      className={`rounded-lg border-2 ${
                        employee.isAvailable === false 
                          ? 'bg-yellow-50 border-yellow-300' 
                          : 'bg-green-50 border-green-300'
                      }`}
                    >
                      {/* Mitarbeiter-Header */}
                      <div className="flex items-center justify-between p-3 border-b border-gray-200">
                        <div className="flex-1">
                          <span className="font-semibold text-gray-900">{employee.name}</span>
                          {employee.isAvailable === false && (
                            <div className="text-xs text-yellow-700 mt-1 flex items-center">
                              <span>⚠️ Bereits verplant</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleEmployeeRemove(index)}
                          className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                          title="Mitarbeiter entfernen"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      
                      {/* Rollenauswahl */}
                      <div className="p-3 bg-white bg-opacity-50">
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Rolle(n) für diese Tour:
                        </label>
                        
                        {/* Primäre Rolle - Dropdown */}
                        <select
                          value={currentRoles[0]}
                          onChange={(e) => handleRoleChange(index, e.target.value)}
                          className="w-full text-sm p-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white mb-2"
                        >
                          {availableRoles.map(role => (
                            <option key={role.id} value={role.id}>
                              {role.icon} {role.name} - {role.description}
                            </option>
                          ))}
                        </select>
                        
                        {/* Zusätzliche Rollen */}
                        <details className="text-xs">
                          <summary className="cursor-pointer text-gray-600 hover:text-gray-900 font-medium">
                            + Zusätzliche Rollen hinzufügen
                          </summary>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {availableRoles.filter(role => role.id !== currentRoles[0]).map(role => (
                              <button
                                key={role.id}
                                onClick={() => toggleEmployeeRole(index, role.id)}
                                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                                  currentRoles.includes(role.id)
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                {role.icon} {role.name}
                              </button>
                            ))}
                          </div>
                        </details>
                        
                        {/* Anzeige der aktuellen Rollen */}
                        {currentRoles.length > 1 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {currentRoles.map(roleId => {
                              const role = availableRoles.find(r => r.id === roleId);
                              return (
                                <span key={roleId} className="text-xs bg-primary text-white px-2 py-0.5 rounded">
                                  {role?.icon} {role?.name}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Aktionen */}
            <div className="space-y-3 pt-4 border-t">
              {/* API-Pfad-Debug Button */}
              <button
                onClick={handleTestApiPaths}
                className="w-full flex items-center justify-center px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-semibold border-2 border-purple-600"
                title="Teste verschiedene API-Pfadvariationen um den richtigen zu finden"
              >
                <Navigation className="mr-2 h-5 w-5" />
                🔍 API-PFAD-DEBUG: Teste verschiedene Pfade
              </button>
              
              {/* Test-Sync Button */}
              <button
                onClick={handleTestSync}
                disabled={assignedEmployees.length === 0 || isTestSyncing || isSaving}
                className="w-full flex items-center justify-center px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold border-2 border-orange-600"
                title="Nur Termine testen - OHNE Pipedrive zu speichern"
              >
                <Clock className="mr-2 h-5 w-5" />
                {isTestSyncing ? 'Teste...' : '🧪 TEST: Nur Termine an Stressfrei senden'}
              </button>
              
              {/* Normaler Speichern Button */}
              <button
                onClick={handleSaveAssignment}
                disabled={assignedEmployees.length === 0 || isSaving || isTestSyncing}
                className="w-full flex items-center justify-center px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                <Save className="mr-2 h-5 w-5" />
                {isSaving ? 'Speichern...' : (
                  tourData.isSaved 
                    ? 'Mitarbeiter zuweisen und Termine buchen'
                    : 'Tour speichern + Mitarbeiter zuweisen'
                )}
              </button>
              
              <button
                onClick={onBack}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Abbrechen
              </button>
            </div>

            {/* Informations-Boxen */}
            <div className="mt-4 space-y-2">
              {/* API-Pfad-Debug Info */}
              <div className="p-3 bg-purple-50 border-2 border-purple-300 rounded-lg">
                <p className="text-xs font-semibold text-purple-900 mb-2">🔍 API-PFAD-DEBUG:</p>
                <p className="text-xs text-purple-800 mb-2">
                  Der <strong>lila Button</strong> testet verschiedene API-Pfadvariationen automatisch.
                  Er sendet einen Test-Mitarbeiter an 5 verschiedene URLs und zeigt Ihnen, welche funktionieren.
                </p>
                <details className="text-xs mt-2">
                  <summary className="cursor-pointer text-purple-700 font-semibold hover:text-purple-900">
                    📋 Was wird getestet?
                  </summary>
                  <div className="mt-2 pl-3 space-y-1 text-purple-700 border-l-2 border-purple-300">
                    <div><strong>Getestete Pfade:</strong></div>
                    <div className="pl-2">• Aktueller Pfad (aus .env)</div>
                    <div className="pl-2">• Mit /api/ Präfix</div>
                    <div className="pl-2">• Ohne /api/ Präfix</div>
                    <div className="pl-2">• Direkt zu Stressfrei</div>
                    <div className="pl-2">• Stressfrei ohne /api/</div>
                    
                    <div className="mt-2"><strong>Ergebnisse:</strong></div>
                    <div className="pl-2">• ✅ Erfolgreiche Pfade (JSON-Response)</div>
                    <div className="pl-2">• 🌐 HTML-Responses (Login-Seiten)</div>
                    <div className="pl-2">• ❌ Fehlerhafte Pfade</div>
                    
                    <div className="mt-2 text-purple-600 font-semibold">
                      💡 Öffnen Sie die Browser-Konsole (F12) für detaillierte Logs!
                    </div>
                  </div>
                </details>
              </div>
              
              {assignedEmployees.length > 0 && (
                <>
                  {/* Test-Info */}
                  <div className="p-3 bg-orange-50 border-2 border-orange-300 rounded-lg">
                    <p className="text-xs font-semibold text-orange-900 mb-2">🧪 TEST-Modus:</p>
                    <p className="text-xs text-orange-800 mb-2">
                      Der orange Button sendet <strong>nur die Termine</strong> an Stressfrei zum Testen.
                      Die Tour wird <strong>NICHT in Pipedrive gespeichert</strong>.
                      Alle Termine erscheinen aber im Kalender mit "[TEST]" im Kommentar.
                    </p>
                    <details className="text-xs mt-2">
                      <summary className="cursor-pointer text-orange-700 font-semibold hover:text-orange-900">
                        📋 So debuggen Sie (Konsole öffnen)
                      </summary>
                      <div className="mt-2 pl-3 space-y-1 text-orange-700 border-l-2 border-orange-300">
                        <div><strong>1. Browser-Konsole öffnen:</strong></div>
                        <div className="pl-2">• Drücken Sie <kbd className="bg-orange-200 px-1 rounded">F12</kbd></div>
                        <div className="pl-2">• Oder Rechtsklick → "Untersuchen" → Tab "Console"</div>
                        
                        <div className="mt-2"><strong>2. Nach Test-Button Klick suchen Sie:</strong></div>
                        <div className="pl-2">• <code>📤 TEST-SYNC: Sende X Termine...</code></div>
                        <div className="pl-2">• <code>📋 VOLLSTÄNDIGER PAYLOAD:</code> (Ihre Daten)</div>
                        <div className="pl-2">• <code>✅ RESPONSE STATUS: 200</code> (Erfolg!)</div>
                        <div className="pl-2">• <code>📦 RESPONSE DATA:</code> (Server-Antwort)</div>
                        
                        <div className="mt-2"><strong>3. Bei Fehler:</strong></div>
                        <div className="pl-2">• <code>❌ TEST-SYNC FEHLER</code> zeigt das Problem</div>
                        <div className="pl-2">• Kopieren Sie alle Logs zwischen den Linien <code>═══</code></div>
                        
                        <div className="mt-2 text-orange-600 font-semibold">
                          💡 Siehe DEBUG_TERMINE.md für vollständige Anleitung!
                        </div>
                      </div>
                    </details>
                  </div>
                </>
              )}
              
              {assignedEmployees.length > 0 && (
                <>
                  {/* Was wird gespeichert */}
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-semibold text-blue-900 mb-2">📦 Was wird gespeichert:</p>
                    <ul className="text-xs text-blue-800 space-y-1">
                      {!tourData.isSaved && <li>✅ Tour in Pipedrive ({tourData.tourDeals?.length || 0} Projekte)</li>}
                      <li>✅ {assignedEmployees.length * selectedTourVehicles.length * (tourData.stations?.length || 0)} separate Kalendertermine</li>
                      <li>✅ {assignedEmployees.length} Mitarbeiter × {selectedTourVehicles.length} Fahrzeuge × {tourData.stations?.length || 0} Stationen</li>
                      <li>✅ Jede Station mit eigener Terminart (Transport-Art)</li>
                      <li>✅ Jedes Fahrzeug mit eigenem Kennzeichen</li>
                    </ul>
                  </div>

                  {/* Termin-Details */}
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs font-semibold text-green-900 mb-2">📅 Pro Station wird gespeichert:</p>
                    <div className="text-xs text-green-800 space-y-1">
                      <div>• <strong>Terminart:</strong> Basierend auf Transport-Art</div>
                      <div>• <strong>Zeiten:</strong> Start & Ende der Station</div>
                      <div>• <strong>Vorgangsno:</strong> Pipedrive Deal-ID</div>
                      <div>• <strong>Rollen:</strong> Mitarbeiter-spezifisch</div>
                      <div>• <strong>Kommentar:</strong> Tour + Station-Details</div>
                    </div>
                    {Object.keys(stationTransportTypes).length > 0 && (
                      <div className="mt-2 pt-2 border-t border-green-200 text-xs text-green-700">
                        <span className="font-semibold">Terminarten-Mapping: </span>
                        {Object.entries(
                          Object.values(stationTransportTypes).reduce((acc, type) => {
                            if (type) acc[type] = (acc[type] || 0) + 1;
                            return acc;
                          }, {})
                        ).map(([type, count]) => {
                          const typeInfo = transportTypes.find(t => t.id === type);
                          return `${typeInfo?.icon || ''} ${typeInfo?.name || type} (${count}×)`;
                        }).join(', ')}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourEmployeeAssignment;

