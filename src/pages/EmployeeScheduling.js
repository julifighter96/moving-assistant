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

      console.log('🔍 Suche Mitarbeiter mit Kriterien:', requestBody);

      const response = await axios.post(SERVICEPROVIDER_API_URL, requestBody, {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': SFS_API_TOKEN  // Direktes Token ohne "Bearer"
        }
      });

      if (response.data && Array.isArray(response.data)) {
        const processedEmployees = response.data.map(item => {
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

        console.log('✅ Mitarbeiter geladen:', processedEmployees.length);
        setEmployees(processedEmployees);
        setFilteredEmployees(processedEmployees);
      } else {
        setEmployees([]);
        setFilteredEmployees([]);
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der Mitarbeiter:', error);
      setEmployees([]);
      setFilteredEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  }, [startDate, endDate, filters, SERVICEPROVIDER_API_URL, SFS_API_TOKEN]);

  // Verfügbarkeit berechnen
  const calculateAvailability = (termine, start, end) => {
    if (!termine || termine.length === 0) {
      return { status: 'available', appointments: 0, details: [] };
    }

    const relevantAppointments = termine.filter(termin => {
      const appointmentDate = new Date(termin.datum);
      return appointmentDate >= start && appointmentDate <= end;
    });

    if (relevantAppointments.length === 0) {
      return { status: 'available', appointments: 0, details: [] };
    }

    return {
      status: 'busy',
      appointments: relevantAppointments.length,
      details: relevantAppointments.map(t => ({
        date: t.datum,
        start: t.startzeit,
        end: t.endzeit,
        type: t.terminart || 'Termin'
      }))
    };
  };

  // Mitarbeiter filtern
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
  }, [searchQuery, filters.onlyAvailable, filters.onlyBusy, employees]);

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

        {/* Ergebnisse */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Mitarbeiter ({filteredEmployees.length})
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
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      employee.availabilityStatus.status === 'available'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {employee.availabilityStatus.status === 'available' ? 'Verfügbar' : `${employee.availabilityStatus.appointments} Termin(e)`}
                    </div>
                  </div>

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

