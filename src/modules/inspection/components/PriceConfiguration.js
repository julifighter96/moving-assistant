import React, { useState, useEffect } from 'react';
import { adminService } from '../../../services/adminService';
import { Package, Edit, Save, X } from 'lucide-react';

const PriceConfiguration = () => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPrice, setEditingPrice] = useState(null);

  const loadPrices = async () => {
    try {
      setLoading(true);
      const loadedPrices = await adminService.getPrices();
      setPrices(Array.isArray(loadedPrices) ? loadedPrices : []);
      setError(null);
    } catch (err) {
      console.error('Error loading prices:', err);
      setError('Fehler beim Laden der Preise');
      setPrices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrices();
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

  if (loading && !prices.length) {
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

      {Array.isArray(prices) && prices.length > 0 ? (
        prices.map((price) => (
          <div
            key={price.id}
            className="bg-white shadow-sm rounded-lg overflow-hidden"
          >
            {editingPrice?.id === price.id ? (
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-medium">
                    <Package className="h-5 w-5" />
                    {price.name}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    {isPackagingMaterial(price.name) && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Länge (cm)
                          </label>
                          <input
                            type="number"
                            value={editingPrice.length || 0}
                            onChange={(e) => setEditingPrice({
                              ...editingPrice,
                              length: parseFloat(e.target.value) || 0
                            })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Breite (cm)
                          </label>
                          <input
                            type="number"
                            value={editingPrice.width || 0}
                            onChange={(e) => setEditingPrice({
                              ...editingPrice,
                              width: parseFloat(e.target.value) || 0
                            })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Höhe (cm)
                          </label>
                          <input
                            type="number"
                            value={editingPrice.height || 0}
                            onChange={(e) => setEditingPrice({
                              ...editingPrice,
                              height: parseFloat(e.target.value) || 0
                            })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                            min="0"
                          />
                        </div>
                      </>
                    )}
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
                      {isPackagingMaterial(price.name) && price.length && price.width && price.height && (
                        <p className="mt-1">
                          Maße: {price.length} × {price.width} × {price.height} cm
                        </p>
                      )}
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
          Keine Preise verfügbar
        </div>
      )}
    </div>
  );
};

export default PriceConfiguration;