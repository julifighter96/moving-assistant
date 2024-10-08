import React, { useState } from 'react';
import axios from 'axios';

const OpenDealsViewer = ({ onDealSelect }) => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDeals = async (term = '') => {
    setLoading(true);
    setError(null);
    try {
      const apiToken = process.env.REACT_APP_PIPEDRIVE_API_TOKEN;
      let url;
      if (term) {
        url = `https://api.pipedrive.com/v1/deals/search?term=${encodeURIComponent(term)}&api_token=${apiToken}`;
      } else {
        url = `https://api.pipedrive.com/v1/deals?status=open&api_token=${apiToken}`;
      }
      const response = await axios.get(url);
      const dealsData = term ? response.data.data.items : response.data.data;
      setDeals(dealsData || []);
    } catch (err) {
      setError('Failed to fetch deals');
      console.error('Error fetching deals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDeals(searchTerm);
  };

  const renderDealValue = (deal) => {
    const value = deal.value || deal.item?.value;
    const currency = deal.currency || deal.item?.currency;
    if (value === undefined || value === null) return 'N/A';
    return `${value} ${currency || ''}`.trim();
  };

  const getDealTitle = (deal) => {
    return deal.title || deal.item?.title || 'Unbenannter Deal';
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Deals</h2>
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search deals..."
            className="flex-grow p-2 border border-gray-300 rounded-l-md"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded-r-md hover:bg-blue-600 transition duration-200"
          >
            Suchen
          </button>
        </div>
      </form>
      <button
        onClick={() => fetchDeals()}
        className="mb-4 bg-green-500 text-white p-2 rounded-md hover:bg-green-600 transition duration-200"
      >
        Lade alle offenen Deals
      </button>
      {loading && <p>Loading deals...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {deals.length > 0 && (
        <ul className="divide-y divide-gray-200">
          {deals.map((deal, index) => (
            <li key={deal.id || deal.item?.id || index} className="py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">{getDealTitle(deal)}</h3>
                  <p className="text-sm text-gray-600">
                    Wert: {renderDealValue(deal)}
                  </p>
                </div>
                <button
                  onClick={() => onDealSelect(deal.item || deal)}
                  className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition duration-200"
                >
                  Deal auswählen
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {deals.length === 0 && !loading && <p>Keine Deals gefunden.</p>}
    </div>
  );
};

export default OpenDealsViewer;