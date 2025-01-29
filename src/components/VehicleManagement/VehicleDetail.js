import React, { useState, useEffect } from 'react';
import { X, Calendar, Tool, AlertTriangle } from 'lucide-react';
import { fetchVehicleBookings, updateVehicleStatus } from '../../services/vehicleService';

const VehicleDetail = ({ vehicle, onClose, onUpdate }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(
    vehicle.isNew ? {
      license_plate: '',
      type: '7.5t',
      loading_capacity: 0,
      length: 0,
      width: 0,
      height: 0,
      max_weight: 0,
      status: 'available'
    } : {
      ...vehicle
    }
  );

  useEffect(() => {
    if (!vehicle.isNew && vehicle.id) {
      loadBookings();
    }
  }, [vehicle.id, vehicle.isNew]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await fetchVehicleBookings(vehicle.id);
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (vehicle.isNew) {
        await fetch('/api/vehicles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      } else {
        await updateVehicleStatus(vehicle.id, formData.status);
      }
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error saving vehicle:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {vehicle.isNew ? 'Neuen LKW anlegen' : 'LKW Details'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Kennzeichen</label>
              <input
                type="text"
                value={formData.license_plate}
                onChange={(e) => setFormData({...formData, license_plate: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                disabled={!vehicle.isNew}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Typ</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                disabled={!vehicle.isNew}
              >
                <option value="7.5t">7,5t LKW</option>
                <option value="12t">12t LKW</option>
                <option value="18t">18t LKW</option>
              </select>
            </div>

            {/* Weitere Formularfelder für neue Fahrzeuge */}
            {vehicle.isNew && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ladekapazität (m³)</label>
                  <input
                    type="number"
                    value={formData.loading_capacity}
                    onChange={(e) => setFormData({...formData, loading_capacity: parseFloat(e.target.value)})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Länge (cm)</label>
                    <input
                      type="number"
                      value={formData.length}
                      onChange={(e) => setFormData({...formData, length: parseInt(e.target.value)})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Breite (cm)</label>
                    <input
                      type="number"
                      value={formData.width}
                      onChange={(e) => setFormData({...formData, width: parseInt(e.target.value)})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Höhe (cm)</label>
                    <input
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData({...formData, height: parseInt(e.target.value)})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Max. Gewicht (kg)</label>
                  <input
                    type="number"
                    value={formData.max_weight}
                    onChange={(e) => setFormData({...formData, max_weight: parseInt(e.target.value)})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                  />
                </div>
              </>
            )}

            {/* Status-Auswahl für alle Fahrzeuge */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              >
                <option value="available">Verfügbar</option>
                <option value="in_use">Im Einsatz</option>
                <option value="maintenance">In Wartung</option>
              </select>
            </div>
          </div>

          {/* Buchungen nur für bestehende Fahrzeuge anzeigen */}
          {!vehicle.isNew && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Aktuelle Buchungen</h3>
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : bookings.length > 0 ? (
                <div className="space-y-3">
                  {bookings.map(booking => (
                    <div key={booking.id} className="bg-white border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Deal #{booking.deal_id}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(booking.start_date).toLocaleDateString()} - 
                            {new Date(booking.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {booking.volume} m³ / {booking.weight} kg
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Keine aktuellen Buchungen
                </p>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
            >
              {vehicle.isNew ? 'LKW anlegen' : 'Änderungen speichern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetail; 