import React, { useState, useEffect } from 'react';
import { getDeal } from '../services/pipedriveService';
import axios from 'axios';

const DealViewer = ({ onStartInspection }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deals, setDeals] = useState([]);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDeals = async (term = '') => {
    setLoading(true);
    setError(null);
    try {
      const apiToken = process.env.REACT_APP_PIPEDRIVE_API_TOKEN;
      const url = `https://api.pipedrive.com/v1/deals/search?term=${encodeURIComponent(term)}&api_token=${apiToken}`;
      const response = await axios.get(url);
      setDeals(response.data.data.items || []);
    } catch (err) {
      setError('Failed to fetch deals');
      console.error('Error fetching deals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      fetchDeals(searchTerm);
    } else {
      setDeals([]);
    }
  }, [searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDeals(searchTerm);
  };

  const handleDealSelect = async (deal) => {
    setLoading(true);
    setError(null);
    try {
      const fullDealData = await getDeal(deal.item.id);
      setSelectedDeal(fullDealData);
      onStartInspection(fullDealData);  // Call onStartInspection with the full deal data
    } catch (err) {
      setError('Failed to fetch deal details');
      console.error('Error fetching deal details:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value, currency) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: currency || 'EUR' }).format(value);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Deal Suche und Auswahl</h2>
      
      <form onSubmit={handleSearch} className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Deal suchen (Name, ID, etc.)"
          className="w-full p-2 border border-gray-300 rounded-md mb-2"
        />
        <button 
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition duration-200"
        >
          Suchen
        </button>
      </form>

      {loading && <p className="text-center">Lade Deals...</p>}
      {error && <p className="text-center text-red-500">Fehler: {error}</p>}
      {deals.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2">Suchergebnisse</h3>
          <ul className="divide-y divide-gray-200">
            {deals.map((deal) => (
              <li 
                key={deal.item.id} 
                className="py-3 px-4 cursor-pointer hover:bg-blue-50 transition duration-150 ease-in-out rounded-md border border-transparent hover:border-blue-200 flex justify-between items-center"
                onClick={() => handleDealSelect(deal)}
              >
                <div>
                  <p className="font-medium text-blue-600">{deal.item.title}</p>
                  <p className="text-sm text-gray-600">
                    ID: {deal.item.id} | Wert: {formatCurrency(deal.item.value, deal.item.currency)}
                  </p>
                </div>
                <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedDeal && (
        <div className="bg-white shadow-md rounded-lg p-6 mt-4 border-2 border-blue-300">
          <h3 className="text-xl font-semibold mb-4 text-blue-600">{selectedDeal.title}</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Wert</p>
              <p className="font-medium">{formatCurrency(selectedDeal.value, selectedDeal.currency)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-medium">{selectedDeal.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phase</p>
              <p className="font-medium">{selectedDeal.stage_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Erwartetes Abschlussdatum</p>
              <p className="font-medium">{selectedDeal.expected_close_date || 'Nicht gesetzt'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Besitzer</p>
              <p className="font-medium">{selectedDeal.owner_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Organisation</p>
              <p className="font-medium">{selectedDeal.org_name || 'Nicht angegeben'}</p>
            </div>
          </div>
          <button 
            onClick={() => onStartInspection(selectedDeal)}
            className="w-full bg-green-500 text-white p-2 rounded-md hover:bg-green-600 transition duration-200 flex items-center justify-center"
          >
            <span>Besichtigung starten</span>
            <svg className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default DealViewer;