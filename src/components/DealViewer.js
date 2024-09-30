import React, { useState } from 'react';
import { getDeal } from '../services/pipedriveService';
import OpenDealsViewer from './OpenDealsViewer';

const DealViewer = ({ onStartInspection }) => {
  const [dealId, setDealId] = useState('');
  const [dealData, setDealData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showOpenDeals, setShowOpenDeals] = useState(false);

  const handleFetchDeal = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDealData(null);

    try {
      const data = await getDeal(dealId);
      setDealData(data.data);
    } catch (err) {
      setError('Failed to fetch deal');
    } finally {
      setLoading(false);
    }
  };

  const handleDealSelect = (selectedDeal) => {
    setDealData(selectedDeal);
    setShowOpenDeals(false);
  };

  const formatCurrency = (value, currency) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(value);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Deal Viewer</h2>
      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => setShowOpenDeals(false)}
          className={`p-2 rounded-md ${!showOpenDeals ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Manual Entry
        </button>
        <button
          onClick={() => setShowOpenDeals(true)}
          className={`p-2 rounded-md ${showOpenDeals ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Deal Search
        </button>
      </div>
      
      {!showOpenDeals ? (
        <form onSubmit={handleFetchDeal} className="mb-6">
          <input
            type="text"
            value={dealId}
            onChange={(e) => setDealId(e.target.value)}
            placeholder="Enter Deal ID"
            className="w-full p-2 border border-gray-300 rounded-md mr-2"
          />
          <button 
            type="submit"
            className="mt-2 w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition duration-200"
          >
            Fetch Deal
          </button>
        </form>
      ) : (
        <OpenDealsViewer onDealSelect={handleDealSelect} />
      )}

      {loading && <p className="text-center">Loading...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      {dealData && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">{dealData.title}</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Value</p>
              <p className="font-medium">{formatCurrency(dealData.value, dealData.currency)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-medium">{dealData.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Stage</p>
              <p className="font-medium">{dealData.stage_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Expected Close Date</p>
              <p className="font-medium">{dealData.expected_close_date || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Owner</p>
              <p className="font-medium">{dealData.owner_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Organization</p>
              <p className="font-medium">{dealData.org_name || 'Not specified'}</p>
            </div>
          </div>
          <button 
            onClick={() => onStartInspection(dealData)}
            className="w-full bg-green-500 text-white p-2 rounded-md hover:bg-green-600 transition duration-200"
          >
            Start Inspection
          </button>
        </div>
      )}
    </div>
  );
};

export default DealViewer;