import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const TruckDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [truck, setTruck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTruckDetails();
  }, [id]);

  const fetchTruckDetails = async () => {
    try {
      setError(null);
      const response = await fetch(`/moving-assistant/api/trucks/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTruck(data);
    } catch (error) {
      console.error('Error fetching truck details:', error);
      setError('Fehler beim Laden der Fahrzeugdetails');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Lade Fahrzeugdetails...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">{error}</div>
        <button
          onClick={() => navigate('/fleet')}
          className="mt-4 text-indigo-600 hover:text-indigo-900"
        >
          ← Zurück zur Übersicht
        </button>
      </div>
    );
  }

  if (!truck) {
    return (
      <div className="p-6">
        <div>Fahrzeug nicht gefunden</div>
        <button
          onClick={() => navigate('/fleet')}
          className="mt-4 text-indigo-600 hover:text-indigo-900"
        >
          ← Zurück zur Übersicht
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Fahrzeugdetails</h2>
        <button
          onClick={() => navigate('/fleet')}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
        >
          ← Zurück zur Übersicht
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">{truck.type} ({truck.license_plate})</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold
              ${truck.status === 'available' ? 'bg-green-100 text-green-800' : 
                truck.status === 'booked' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-red-100 text-red-800'}`}
            >
              {truck.status === 'available' ? 'Verfügbar' :
               truck.status === 'booked' ? 'Gebucht' : 'In Wartung'}
            </span>
          </div>
        </div>
        
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Ladekapazität</dt>
              <dd className="mt-1 text-sm text-gray-900">{truck.loading_capacity} kg</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Maße (L×B×H)</dt>
              <dd className="mt-1 text-sm text-gray-900">{truck.length}×{truck.width}×{truck.height} cm</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Maximales Gewicht</dt>
              <dd className="mt-1 text-sm text-gray-900">{truck.max_weight} kg</dd>
            </div>
          </dl>
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-4">Buchungshistorie</h3>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Datum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kunde
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Adresse
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {truck.bookingHistory.map(booking => (
              <tr key={booking.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {booking.moving_date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {booking.customer_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {booking.address}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TruckDetails; 