import React, { useState, useEffect } from 'react';
import { Package, X, AlertTriangle } from 'lucide-react';

const MaterialUsage = ({ moveId, onClose, onComplete }) => {
  const [materials, setMaterials] = useState([]);
  const [usage, setUsage] = useState({});
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await fetch('/moving-assistant/api/materials');
      if (!response.ok) throw new Error('Fehler beim Laden der Materialien');
      const data = await response.json();
      setMaterials(data);
      
      // Initialisiere usage State mit allen Material-IDs
      const initialUsage = {};
      data.forEach(material => {
        initialUsage[material.id] = 0;
      });
      setUsage(initialUsage);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (materialId, quantity) => {
    const material = materials.find(m => m.id === materialId);
    if (quantity > material.current_stock) {
      return; // Verhindere Überschreitung des verfügbaren Bestands
    }
    
    setUsage(prev => ({
      ...prev,
      [materialId]: parseInt(quantity) || 0
    }));
  };

  const handleComplete = async () => {
    // Filtere nur Materialien mit Verbrauch > 0
    const materialUsage = Object.entries(usage)
      .filter(([_, quantity]) => quantity > 0)
      .map(([materialId, quantity]) => ({
        materialId: parseInt(materialId),
        quantity
      }));

    onComplete(materialUsage, notes);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6">
          <p className="text-center">Lade Materialien...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold">Materialverbrauch erfassen</h2>
            <p className="text-sm text-gray-500">
              Geben Sie die verwendeten Materialmengen ein
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
          {materials.map(material => (
            <div
              key={material.id}
              className={`p-4 rounded-lg border ${
                material.current_stock <= material.min_stock
                  ? 'border-yellow-300 bg-yellow-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium">{material.name}</h3>
                  <p className="text-sm text-gray-500">{material.type}</p>
                </div>
                {material.current_stock <= material.min_stock && (
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                )}
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Verfügbar: {material.current_stock} {material.unit}
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max={material.current_stock}
                    value={usage[material.id] || ''}
                    onChange={(e) => handleQuantityChange(material.id, e.target.value)}
                    className="w-20 px-2 py-1 border rounded-lg text-right"
                  />
                  <span className="text-sm text-gray-600">{material.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notizen
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            rows="3"
            placeholder="Optionale Notizen zum Materialverbrauch..."
          />
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Abbrechen
          </button>
          <button
            onClick={handleComplete}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            Umzug abschließen
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaterialUsage; 