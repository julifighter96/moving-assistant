import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import { format, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import "react-datepicker/dist/react-datepicker.css";

const DealViewer = ({ onStartInspection, onAssignDealEmployees }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedDeal, setSelectedDeal] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeeError, setEmployeeError] = useState(null);
  const [empStartDate, setEmpStartDate] = useState(new Date());
  const [empEndDate, setEmpEndDate] = useState(addDays(new Date(), 7));

  const fetchDeals = async (term = '') => {
    setLoading(true);
    setError(null);
    try {
      const apiToken = process.env.REACT_APP_PIPEDRIVE_API_TOKEN;
      const url = `https://api.pipedrive.com/v1/deals/search?term=${encodeURIComponent(term)}&api_token=${apiToken}`;
      const response = await axios.get(url);
      setDeals(response.data.data.items || []);
    } catch (err) {
      setError('Fehler beim Laden der Deals');
      console.error('Error fetching deals:', err);
    } finally {
      setLoading(false);
    }
  };

  // Lade offene Deals ohne Suchbegriff
  const fetchOpenDeals = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiToken = process.env.REACT_APP_PIPEDRIVE_API_TOKEN;
      const url = `https://api.pipedrive.com/v1/deals?status=open&limit=50&api_token=${apiToken}`;
      const response = await axios.get(url);
      // Normalisiere in das gleiche Format wie search (items mit .item)
      const items = (response.data?.data || []).map(d => ({ item: d }));
      setDeals(items);
    } catch (err) {
      setError('Fehler beim Laden offener Deals');
      console.error('Error fetching open deals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      const timeoutId = setTimeout(() => {
        fetchDeals(searchTerm);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setDeals([]);
    }
  }, [searchTerm]);

  // Mitarbeiter vom Serviceprovider laden
  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    setEmployeeError(null);
    try {
      const SERVICEPROVIDER_API_URL = process.env.REACT_APP_SERVICEPROVIDER_API_URL || 'https://lolworlds.online/api/serviceprovider/getServiceprovider';
      const SFS_API_TOKEN = process.env.REACT_APP_SFS_API_TOKEN;
      if (!SFS_API_TOKEN) {
        throw new Error('Kein API-Token konfiguriert (REACT_APP_SFS_API_TOKEN)');
      }

      const dateFrom = format(empStartDate, 'yyyy-MM-dd');
      const dateTo = format(empEndDate, 'yyyy-MM-dd');

      const requestBody = {
        date_from: dateFrom,
        date_to: dateTo,
        joins: ["Vertraege", "Eigenschaften", "Termine"]
      };

      const response = await axios.post(SERVICEPROVIDER_API_URL, requestBody, {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': SFS_API_TOKEN
        }
      });

      const list = Array.isArray(response.data) ? response.data.map(item => {
        const emp = item.Teammitglied || item;
        return {
          id: emp.Id || emp.id || emp.personalid || emp.uuid,
          name: emp.name || `${emp.Vorname || emp.vorname || ''} ${emp.Nachname || emp.nachname || ''}`.trim() || 'Unbekannt',
          eigenschaften: item.Eigenschaften || emp.Eigenschaften || {},
          termine: item.Termine || emp.Termine || []
        };
      }) : [];
      setEmployees(list);
    } catch (err) {
      console.error('Fehler beim Laden der Mitarbeiter:', err);
      setEmployeeError('Fehler beim Laden der Mitarbeiter');
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const toggleEmployeeSelection = (emp) => {
    setSelectedEmployees(prev => {
      const exists = prev.find(e => e.id === emp.id);
      if (exists) {
        return prev.filter(e => e.id !== emp.id);
      }
      return [...prev, emp];
    });
  };

  const handleTransferToStressfrei = () => {
    if (!selectedDeal) return;
    if (onAssignDealEmployees) {
      onAssignDealEmployees(selectedDeal.item, selectedEmployees);
    } else {
      console.log('Übertragung vorbereitet (Demo):', {
        deal: selectedDeal.item,
        employees: selectedEmployees
      });
      alert('Mitarbeiter-Zuordnung wurde vorbereitet (Demo).');
    }
  };

  const formatCurrency = (value, currency) => {
    if (!value) return '0,00 €';
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: currency || 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
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

  return (
    <div className="bg-white rounded-lg p-6">      
      <div className="mb-6 flex gap-3 items-center">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Deal suchen (Name, ID, etc.)"
          className="flex-1 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
        />
        <button
          onClick={fetchOpenDeals}
          className="px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          Offene Deals laden
        </button>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-8 mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-500">Lade Deals...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
          </svg>
          {error}
        </div>
      )}

      {deals.length > 0 && (
        <div className="space-y-3">
          {deals.map((deal) => (
            <button 
              key={deal.item.id}
              onClick={() => {
                setSelectedDeal(deal);
                setSelectedEmployees([]);
                onStartInspection(deal.item);
              }}
              className="w-full text-left bg-gray-50 hover:bg-blue-50 p-4 rounded-lg border border-gray-200 hover:border-primary transition-all duration-200"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {deal.item.title}
                    </h3>
                    {renderStatus(deal.item.status)}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      ID: {deal.item.id}
                    </span>
                    <span className="font-medium text-primary">
                      {formatCurrency(deal.item.value, deal.item.currency)}
                    </span>
                    {deal.item.org_name && (
                      <span className="text-gray-500">
                        {deal.item.org_name}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-primary hover:text-primary-dark flex items-center">
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

      {!loading && deals.length === 0 && searchTerm && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <p className="text-gray-500 text-lg">Keine Deals gefunden</p>
          <p className="text-gray-400 text-sm mt-1">Versuchen Sie es mit einem anderen Suchbegriff</p>
        </div>
      )}

      {/* Mitarbeiter-Zuordnung für ausgewählten Deal */}
      {selectedDeal && (
        <div className="mt-8 border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold">Mitarbeiter für Deal zuordnen</h4>
              <p className="text-sm text-gray-500">{selectedDeal.item.title} (ID: {selectedDeal.item.id})</p>
            </div>
            <button
              onClick={() => onStartInspection && onStartInspection(selectedDeal.item)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Zur Inspektion
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Von Datum</label>
              <DatePicker
                selected={empStartDate}
                onChange={(date) => setEmpStartDate(date)}
                dateFormat="dd.MM.yyyy"
                locale={de}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bis Datum</label>
              <DatePicker
                selected={empEndDate}
                onChange={(date) => setEmpEndDate(date)}
                dateFormat="dd.MM.yyyy"
                locale={de}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchEmployees}
                disabled={loadingEmployees}
                className="w-full md:w-auto px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {loadingEmployees ? 'Lade Mitarbeiter...' : 'Mitarbeiter laden'}
              </button>
            </div>
          </div>

          {employeeError && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4">
              {employeeError}
            </div>
          )}

          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 max-h-80 overflow-auto">
            {loadingEmployees && (
              <div className="text-gray-500">Mitarbeiter werden geladen...</div>
            )}
            {!loadingEmployees && employees.length === 0 && (
              <div className="text-gray-500">Keine Mitarbeiter gefunden. Passen Sie den Zeitraum an.</div>
            )}
            {!loadingEmployees && employees.length > 0 && (
              <ul className="divide-y">
                {employees.map(emp => (
                  <li key={emp.id} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{emp.name}</div>
                      <div className="text-xs text-gray-500">
                        {emp.eigenschaften?.personal_properties_Fhrerscheinklasse && (
                          <span>FS: {emp.eigenschaften.personal_properties_Fhrerscheinklasse}</span>
                        )}
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!selectedEmployees.find(e => e.id === emp.id)}
                        onChange={() => toggleEmployeeSelection(emp)}
                        className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      Auswählen
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Ausgewählt: <span className="font-medium">{selectedEmployees.length}</span>
            </div>
            <button
              onClick={handleTransferToStressfrei}
              disabled={selectedEmployees.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              An Stressfrei übertragen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealViewer;