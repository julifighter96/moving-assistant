import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const FleetOverview = () => {
  const [trucks, setTrucks] = useState([]);
  const [filteredTrucks, setFilteredTrucks] = useState([]);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    minCapacity: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrucks();
  }, []);

  useEffect(() => {
    if (Array.isArray(trucks)) {
      applyFilters();
    }
  }, [trucks, filters]);

  const fetchTrucks = async () => {
    try {
      const response = await fetch('/moving-assistant/api/trucks');
      const data = await response.json();
      if (Array.isArray(data)) {
        setTrucks(data);
        setFilteredTrucks(data);
      } else {
        console.error('Received non-array data:', data);
        setTrucks([]);
        setFilteredTrucks([]);
      }
    } catch (error) {
      console.error('Error fetching trucks:', error);
      setTrucks([]);
      setFilteredTrucks([]);
    }
  };

  const applyFilters = () => {
    let filtered = [...trucks];

    if (filters.type) {
      filtered = filtered.filter(truck => 
        truck.type.toLowerCase().includes(filters.type.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(truck => 
        truck.status === filters.status
      );
    }

    if (filters.minCapacity) {
      filtered = filtered.filter(truck => 
        truck.loading_capacity >= parseInt(filters.minCapacity)
      );
    }

    setFilteredTrucks(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Fuhrpark Übersicht</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fahrzeugtyp
          </label>
          <input
            type="text"
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
            placeholder="z.B. Koffer"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Alle</option>
            <option value="available">Verfügbar</option>
            <option value="booked">Gebucht</option>
            <option value="maintenance">In Wartung</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min. Kapazität (kg)
          </label>
          <input
            type="number"
            name="minCapacity"
            value={filters.minCapacity}
            onChange={handleFilterChange}
            placeholder="z.B. 3500"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kennzeichen
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Typ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kapazität
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Maße (L×B×H)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.isArray(filteredTrucks) && filteredTrucks.map(truck => (
              <tr key={truck.id}>
                <td className="px-6 py-4 whitespace-nowrap">{truck.license_plate}</td>
                <td className="px-6 py-4 whitespace-nowrap">{truck.type}</td>
                <td className="px-6 py-4 whitespace-nowrap">{truck.loading_capacity} kg</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {truck.length}×{truck.width}×{truck.height} cm
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${truck.status === 'available' ? 'bg-green-100 text-green-800' : 
                      truck.status === 'booked' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'}`}
                  >
                    {truck.status === 'available' ? 'Verfügbar' :
                     truck.status === 'booked' ? 'Gebucht' : 'In Wartung'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => navigate(`/fleet/${truck.id}`)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FleetOverview; 