import React, { useState, useEffect } from 'react';
import { Calendar, List, Truck, Tool, Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VehicleCalendar from './VehicleCalendar';
import VehicleList from './VehicleList';
import VehicleDetail from './VehicleDetail';
import { fetchVehicles, checkVehicleAvailability } from '../../services/vehicleService';

const VehicleManagement = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [view, setView] = useState('calendar'); // 'calendar', 'list', 'detail'
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    minCapacity: '',
    maxCapacity: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [moves, setMoves] = useState([]);

  useEffect(() => {
    loadVehicles();
    const fetchMoves = async () => {
      try {
        const response = await fetch('/api/deals');
        if (!response.ok) throw new Error('Fehler beim Laden der Umzüge');
        const data = await response.json();
        setMoves(data);
      } catch (error) {
        console.error('Fehler beim Laden der Umzüge:', error);
      }
    };

    fetchMoves();
  }, []);

  const loadVehicles = async () => {
    try {
      console.log('Fetching vehicles...');
      setLoading(true);
      const response = await fetch('/api/vehicles');
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const text = await response.text();
        console.error('Error response:', text);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received vehicles data:', data);
      setVehicles(data);
      setError(null);
    } catch (err) {
      console.error('Error loading vehicles:', err);
      setError('Fehler beim Laden der Fahrzeuge: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    if (filters.type && vehicle.type !== filters.type) return false;
    if (filters.status && vehicle.status !== filters.status) return false;
    if (filters.minCapacity && vehicle.loadingCapacity < filters.minCapacity) return false;
    if (filters.maxCapacity && vehicle.loadingCapacity > filters.maxCapacity) return false;
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        {/* Header mit Zurück-Button */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Zurück zum Hauptmenü
          </button>
          <button
            onClick={() => setSelectedVehicle({ isNew: true })}
            className="flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark"
          >
            <Plus className="w-5 h-5 mr-2" />
            Neuen LKW anlegen
          </button>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">Fuhrparkmanagement</h1>
        
        {/* View Toggle */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setView('calendar')}
            className={`flex items-center px-4 py-2 rounded-lg ${
              view === 'calendar' ? 'bg-primary text-white' : 'bg-gray-100'
            }`}
          >
            <Calendar className="w-5 h-5 mr-2" />
            Kalender
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex items-center px-4 py-2 rounded-lg ${
              view === 'list' ? 'bg-primary text-white' : 'bg-gray-100'
            }`}
          >
            <List className="w-5 h-5 mr-2" />
            Liste
          </button>
        </div>

        {/* Filter Section */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              className="form-select"
              value={filters.type}
              onChange={(e) => handleFilterChange({ ...filters, type: e.target.value })}
            >
              <option value="">Alle Typen</option>
              <option value="7.5t">7,5t LKW</option>
              <option value="12t">12t LKW</option>
              <option value="18t">18t LKW</option>
            </select>
            
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => handleFilterChange({ ...filters, status: e.target.value })}
            >
              <option value="">Alle Status</option>
              <option value="available">Verfügbar</option>
              <option value="in_use">Im Einsatz</option>
              <option value="maintenance">In Wartung</option>
            </select>
            
            <input
              type="number"
              placeholder="Min. Kapazität (m³)"
              className="form-input"
              value={filters.minCapacity}
              onChange={(e) => handleFilterChange({ ...filters, minCapacity: e.target.value })}
            />
            
            <input
              type="number"
              placeholder="Max. Kapazität (m³)"
              className="form-input"
              value={filters.maxCapacity}
              onChange={(e) => handleFilterChange({ ...filters, maxCapacity: e.target.value })}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : (
        <div>
          {view === 'calendar' && (
            <VehicleCalendar 
              vehicles={filteredVehicles}
              moves={moves}
              onVehicleSelect={setSelectedVehicle}
            />
          )}
          
          {view === 'list' && (
            <VehicleList
              vehicles={filteredVehicles}
              onVehicleSelect={setSelectedVehicle}
            />
          )}
          
          {selectedVehicle && (
            <VehicleDetail
              vehicle={selectedVehicle}
              onClose={() => setSelectedVehicle(null)}
              onUpdate={loadVehicles}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default VehicleManagement; 