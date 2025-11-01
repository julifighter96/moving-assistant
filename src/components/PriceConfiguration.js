import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { Package, Edit, Save, X, Users, Clock, Truck, Ban } from 'lucide-react';

const PriceConfiguration = () => {
  const [prices, setPrices] = useState([]);
  const [hourlyRates, setHourlyRates] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState([]);
  const [noParkingZones, setNoParkingZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPrice, setEditingPrice] = useState(null);
  const [editingHourlyRate, setEditingHourlyRate] = useState(null);
  const [editingLoadingTime, setEditingLoadingTime] = useState(null);
  const [editingNoParkingZone, setEditingNoParkingZone] = useState(null);
  const [activeTab, setActiveTab] = useState('materials');
  const [toast, setToast] = useState(null);

  const loadPrices = async () => {
    try {
      setLoading(true);
      const loadedPrices = await adminService.getPrices();
      
      // Separate prices into materials, hourly rates, loading times, and no parking zones
      const materials = [];
      const rates = [];
      const times = [];
      const zones = [];
      
      if (Array.isArray(loadedPrices)) {
        loadedPrices.forEach(price => {
          if (price.type === 'hourly_rate') {
            rates.push(price);
          } else if (price.type === 'loading_time') {
            times.push(price);
          } else if (price.type === 'no_parking_zone') {
            zones.push(price);
          } else {
            materials.push(price);
          }
        });
      }
      
      setPrices(materials);
      setHourlyRates(rates);
      setLoadingTimes(times);
      setNoParkingZones(zones);
      setError(null);
    } catch (err) {
      console.error('Error loading prices:', err);
      setError('Fehler beim Laden der Preise');
      setPrices([]);
      setHourlyRates([]);
      setLoadingTimes([]);
      setNoParkingZones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await loadPrices();
      
      // Wir prüfen noch, ob Preise fehlen, aber ohne Popup und Neuladen
      if (hourlyRates.length < 5 || loadingTimes.length < 3 || noParkingZones.length < 2) {
        console.log('Preise sind noch nicht vollständig initialisiert.');
        // Hier könnte man eine Anzeige integrieren, dass einige Preise noch fehlen
      }
    };
    
    initialize();
  }, []);

  const handleUpdatePrice = async (updatedPrice) => {
    try {
      setLoading(true);
      await adminService.updatePrice(updatedPrice.id, updatedPrice);
      setEditingPrice(null);
      await loadPrices();
    } catch (err) {
      setError('Fehler beim Aktualisieren des Preises');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateHourlyRate = async (updatedRate) => {
    console.log("[Frontend] Updating hourly rate with data:", updatedRate);
    try {
      setLoading(true);
      await adminService.updatePrice(updatedRate.id, updatedRate);
      console.log("[Frontend] Update successful, clearing edit state and reloading.");
      setEditingHourlyRate(null);
      await loadPrices();
    } catch (err) {
      setError('Fehler beim Aktualisieren des Stundensatzes');
      console.error("[Frontend] Error during update:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateLoadingTime = async (updatedTime) => {
    try {
      setLoading(true);
      await adminService.updatePrice(updatedTime.id, updatedTime);
      setEditingLoadingTime(null);
      await loadPrices();
    } catch (err) {
      setError('Fehler beim Aktualisieren der Ladezeit');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNoParkingZone = async (updatedZone) => {
    try {
      setLoading(true);
      await adminService.updatePrice(updatedZone.id, updatedZone);
      setEditingNoParkingZone(null);
      await loadPrices();
    } catch (err) {
      setError('Fehler beim Aktualisieren der Halteverbotszone');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHourlyRate = async () => {
    try {
      setLoading(true);
      const newRate = {
        name: 'Neuer Stundensatz',
        price: 0,
        type: 'hourly_rate'
      };
      await adminService.addPrice(newRate);
      setToast({ message: 'Neuer Stundensatz hinzugefügt. Bitte bearbeiten Sie ihn.', type: 'success' });
      await loadPrices();
    } catch (err) {
      console.error("Error adding hourly rate:", err);
      if (err.response && err.response.status === 409 && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
        setToast({ message: err.response.data.error, type: 'error' });
      } else {
        const defaultError = 'Fehler beim Hinzufügen des Stundensatzes.';
        setError(defaultError);
        setToast({ message: defaultError, type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePrice = async (priceId) => {
    if (!priceId) return;
    
    // Bestätigungsdialog
    if (!window.confirm('Möchten Sie diesen Stundensatz wirklich löschen?')) {
      return;
    }
    
    try {
      // Lösche den Preiseintrag über die API
      await adminService.deletePrice(priceId);
      
      // Lade alle Preisdaten neu
      await loadPrices();
      
      // Erfolgsmeldung
      setToast({
        message: 'Stundensatz erfolgreich gelöscht',
        type: 'success'
      });
    } catch (error) {
      console.error('Fehler beim Löschen des Stundensatzes:', error);
      setToast({
        message: `Fehler beim Löschen: ${error.message || 'Unbekannter Fehler'}`,
        type: 'error'
      });
    }
  };

  const closeToast = () => setToast(null);

  if (loading && !prices.length && !hourlyRates.length && !loadingTimes.length && !noParkingZones.length) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isPackagingMaterial = (name) => {
    return ['Umzugskartons (Standard)', 'Bücherkartons (Bücher&Geschirr)', 'Kleiderkisten'].includes(name);
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 p-4 rounded-md shadow-md ${
          toast.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {toast.message}
          <button 
            className="ml-2 text-gray-500 hover:text-gray-700"
            onClick={closeToast}
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('materials')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'materials'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Materialien</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('hourly_rates')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'hourly_rates'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Stundensätze</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('loading_times')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'loading_times'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Truck className="h-5 w-5" />
                <span>Be- und Entladezeiten</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('no_parking_zones')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'no_parking_zones'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Ban className="h-5 w-5" />
                <span>Halteverbotszonen</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'materials' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Materialien</h3>

      {Array.isArray(prices) && prices.length > 0 ? (
        prices.map((price) => (
          <div
            key={price.id}
            className="bg-white shadow-sm rounded-lg overflow-hidden"
          >
            {editingPrice?.id === price.id ? (
              <div className="p-6">
                <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Bezeichnung
                        </label>
                        <input
                          type="text"
                          value={editingPrice.name}
                          onChange={(e) => setEditingPrice({
                            ...editingPrice,
                            name: e.target.value
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        />
                  </div>
                  
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Preis (€)
                      </label>
                      <input
                        type="number"
                        value={editingPrice.price}
                        onChange={(e) => setEditingPrice({
                          ...editingPrice,
                          price: parseFloat(e.target.value) || 0
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        step="0.01"
                        min="0"
                      />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setEditingPrice(null)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={() => handleUpdatePrice(editingPrice)}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark"
                    >
                      Speichern
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900">
                        {price.name}
                      </h3>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-500">
                      <p className="font-medium text-primary">
                        {price.price.toFixed(2)} €
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setEditingPrice(price)}
                    className="p-2 text-gray-400 hover:text-primary rounded-full hover:bg-gray-50"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
              Keine Materialien verfügbar
            </div>
          )}
        </div>
      )}

      {activeTab === 'hourly_rates' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Stundensätze</h3>
            <button
              onClick={handleAddHourlyRate}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark disabled:opacity-50"
              disabled={loading}
            >
              Stundensatz hinzufügen
            </button>
          </div>
          
          {Array.isArray(hourlyRates) && hourlyRates.length > 0 ? (
            hourlyRates.map((rate) => (
              <div
                key={rate.id}
                className="bg-white shadow-sm rounded-lg overflow-hidden"
              >
                {editingHourlyRate?.id === rate.id ? (
                  <div className="p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Bezeichnung
                        </label>
                        <input
                          type="text"
                          value={editingHourlyRate.name}
                          onChange={(e) => setEditingHourlyRate({
                            ...editingHourlyRate,
                            name: e.target.value
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Stundensatz (€)
                        </label>
                        <input
                          type="number"
                          value={editingHourlyRate.price}
                          onChange={(e) => setEditingHourlyRate({
                            ...editingHourlyRate,
                            price: parseFloat(e.target.value) || 0
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                          step="0.01"
                          min="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Pipedrive-Feld
                        </label>
                        <input
                          type="text"
                          value={editingHourlyRate.pipedrive_field || ''}
                          onChange={(e) => setEditingHourlyRate({
                            ...editingHourlyRate,
                            pipedrive_field: e.target.value
                          })}
                          placeholder="z.B. field_1234567890abcdef"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Das zugehörige Pipedrive-Feld für diesen Stundensatz
                        </p>
                      </div>

                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setEditingHourlyRate(null)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Abbrechen
                        </button>
                        <button
                          onClick={() => handleUpdateHourlyRate(editingHourlyRate)}
                          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark"
                        >
                          Speichern
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-gray-400" />
                          <h3 className="text-lg font-medium text-gray-900">
                            {rate.name}
                          </h3>
                        </div>
                        
                        <div className="mt-2 text-sm text-gray-500">
                          <p className="font-medium text-primary">
                            {rate.price.toFixed(2)} €/h
                          </p>
                          {rate.pipedrive_field && (
                            <p className="text-xs text-gray-400 mt-1">
                              Pipedrive: {rate.pipedrive_field}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDeletePrice(rate.id)}
                          className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-50"
                          title="Stundensatz löschen"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setEditingHourlyRate(rate)}
                          className="p-2 text-gray-400 hover:text-primary rounded-full hover:bg-gray-50"
                          title="Stundensatz bearbeiten"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              Keine Stundensätze verfügbar
            </div>
          )}
        </div>
      )}

      {activeTab === 'loading_times' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Be- und Entladezeiten</h3>
          
          {Array.isArray(loadingTimes) && loadingTimes.length > 0 ? (
            loadingTimes.map((time) => (
              <div
                key={time.id}
                className="bg-white shadow-sm rounded-lg overflow-hidden"
              >
                {editingLoadingTime?.id === time.id ? (
                  <div className="p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Bezeichnung
                        </label>
                        <input
                          type="text"
                          value={editingLoadingTime.name}
                          onChange={(e) => setEditingLoadingTime({
                            ...editingLoadingTime,
                            name: e.target.value
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Zeit (Minuten)
                        </label>
                        <input
                          type="number"
                          value={editingLoadingTime.price}
                          onChange={(e) => setEditingLoadingTime({
                            ...editingLoadingTime,
                            price: parseFloat(e.target.value) || 0
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                          step="1"
                          min="0"
                        />
                      </div>

                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setEditingLoadingTime(null)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Abbrechen
                        </button>
                        <button
                          onClick={() => handleUpdateLoadingTime(editingLoadingTime)}
                          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark"
                        >
                          Speichern
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <Truck className="h-5 w-5 text-gray-400" />
                          <h3 className="text-lg font-medium text-gray-900">
                            {time.name}
                          </h3>
                        </div>
                        
                        <div className="mt-2 text-sm text-gray-500">
                          <p className="font-medium text-primary">
                            {time.price} Minuten
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setEditingLoadingTime(time)}
                        className="p-2 text-gray-400 hover:text-primary rounded-full hover:bg-gray-50"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              Keine Ladezeiten verfügbar
            </div>
          )}
        </div>
      )}

      {activeTab === 'no_parking_zones' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Halteverbotszonen</h3>
          
          {Array.isArray(noParkingZones) && noParkingZones.length > 0 ? (
            noParkingZones.map((zone) => (
              <div
                key={zone.id}
                className="bg-white shadow-sm rounded-lg overflow-hidden"
              >
                {editingNoParkingZone?.id === zone.id ? (
                  <div className="p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Bezeichnung
                        </label>
                        <input
                          type="text"
                          value={editingNoParkingZone.name}
                          onChange={(e) => setEditingNoParkingZone({
                            ...editingNoParkingZone,
                            name: e.target.value
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Preis (€)
                        </label>
                        <input
                          type="number"
                          value={editingNoParkingZone.price}
                          onChange={(e) => setEditingNoParkingZone({
                            ...editingNoParkingZone,
                            price: parseFloat(e.target.value) || 0
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                          step="0.01"
                          min="0"
                        />
                      </div>

                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setEditingNoParkingZone(null)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Abbrechen
                        </button>
                        <button
                          onClick={() => handleUpdateNoParkingZone(editingNoParkingZone)}
                          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark"
                        >
                          Speichern
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <Ban className="h-5 w-5 text-gray-400" />
                          <h3 className="text-lg font-medium text-gray-900">
                            {zone.name}
                          </h3>
                        </div>
                        
                        <div className="mt-2 text-sm text-gray-500">
                          <p className="font-medium text-primary">
                            {zone.price.toFixed(2)} €
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setEditingNoParkingZone(zone)}
                        className="p-2 text-gray-400 hover:text-primary rounded-full hover:bg-gray-50"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              Keine Halteverbotszonen verfügbar
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PriceConfiguration;