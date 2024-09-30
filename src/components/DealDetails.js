import React, { useState, useEffect } from 'react';
import { getDeal, updateDeal } from '../services/pipedriveService';

const DealDetails = ({ dealId }) => {
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDeal();
  }, [dealId]);

  const fetchDeal = async () => {
    try {
      setLoading(true);
      const dealData = await getDeal(dealId);
      setDeal(dealData);
    } catch (err) {
      setError('Failed to fetch deal');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDeal = async (e) => {
    e.preventDefault();
    try {
      const updatedDeal = await updateDeal(dealId, {
        title: deal.title,
        value: deal.value,
        // Fügen Sie hier weitere Felder hinzu
      });
      setDeal(updatedDeal);
    } catch (err) {
      setError('Failed to update deal');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!deal) return null;

  return (
    <div>
      <h2>{deal.title}</h2>
      <form onSubmit={handleUpdateDeal}>
        <input
          type="text"
          value={deal.title}
          onChange={(e) => setDeal({...deal, title: e.target.value})}
        />
        <input
          type="number"
          value={deal.value}
          onChange={(e) => setDeal({...deal, value: e.target.value})}
        />
        <button type="submit">Update Deal</button>
      </form>
    </div>
  );
};

export default DealDetails;