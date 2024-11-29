import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DealViewer = ({ onStartInspection }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deals, setDeals] = useState([]);
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
      setError('Fehler beim Laden der Deals');
      console.error('Error fetching deals:', err);
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
      <div className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Deal suchen (Name, ID, etc.)"
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
        />
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
              onClick={() => onStartInspection(deal.item)}
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
    </div>
  );
};

export default DealViewer;