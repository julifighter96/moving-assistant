import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

const PriceConfiguration = () => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPrice, setEditingPrice] = useState(null);

  useEffect(() => {
    loadPrices();
  }, []);

  const loadPrices = async () => {
    try {
      setLoading(true);
      const loadedPrices = await adminService.getPrices();
      setPrices(loadedPrices);
    } catch (err) {
      setError('Fehler beim Laden der Preise');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrice = async (price) => {
    try {
      setLoading(true);
      await adminService.updatePrice(price.id, price.price);
      setEditingPrice(null);
      await loadPrices();
    } catch (err) {
      setError('Fehler beim Aktualisieren des Preises');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

 
  if (loading) {
    return <div>Lädt...</div>;
  }

  return (
    <div className="space-y-4">
      {prices.map((price) => (
        <div
          key={price.id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
        >
          {editingPrice?.id === price.id ? (
            <div className="flex w-full gap-4">
              <div className="flex-1">
                <span className="font-medium">{price.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={editingPrice.price}
                  onChange={(e) => setEditingPrice({
                    ...editingPrice,
                    price: parseFloat(e.target.value)
                  })}
                  className="w-32 rounded-md border-gray-300 px-3 py-2"
                  step="0.1"
                />
                <span className="text-gray-500">€</span>
                <button
                  onClick={() => handleUpdatePrice(editingPrice)}
                  className="px-4 py-2 bg-green-500 text-white rounded-md"
                >
                  Speichern
                </button>
                <button
                  onClick={() => setEditingPrice(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <span className="font-medium">{price.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-600">{price.price.toFixed(2)} €</span>
                <button
                  onClick={() => setEditingPrice(price)}
                  className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-md"
                >
                  Bearbeiten
                </button>
              </div>
            </>
          )}
        </div>
      ))}

      {error && (
        <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};

export default PriceConfiguration;