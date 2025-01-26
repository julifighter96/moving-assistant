import React, { useState } from 'react';
import { AlertTriangle, Plus, Package, Edit } from 'lucide-react';

const MaterialList = ({ materials, onUpdate }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditStockForm, setShowEditStockForm] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [stockChange, setStockChange] = useState({
    quantity: 0,
    movement_type: 'in',
    notes: ''
  });
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    type: '',
    current_stock: 0,
    min_stock: 0,
    unit: ''
  });

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/moving-assistant/api/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMaterial),
      });

      if (!response.ok) throw new Error('Fehler beim Erstellen des Materials');
      
      setShowAddForm(false);
      setNewMaterial({
        name: '',
        type: '',
        current_stock: 0,
        min_stock: 0,
        unit: ''
      });
      onUpdate();
    } catch (error) {
      console.error('Error adding material:', error);
    }
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/moving-assistant/api/materials/${selectedMaterial.id}/stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stockChange),
      });

      if (!response.ok) throw new Error('Fehler beim Aktualisieren des Bestands');
      
      setShowEditStockForm(false);
      setSelectedMaterial(null);
      setStockChange({ quantity: 0, movement_type: 'in', notes: '' });
      onUpdate();
    } catch (error) {
      console.error('Error updating stock:', error);
      alert(error.message);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Materialbestand</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
        >
          <Plus className="w-4 h-4 mr-2" />
          Material hinzufügen
        </button>
      </div>

      {/* Material Liste */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.map(material => (
          <div
            key={material.id}
            className={`p-4 rounded-lg border ${
              material.current_stock <= material.min_stock
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{material.name}</h3>
                <p className="text-sm text-gray-500">{material.type}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setSelectedMaterial(material);
                    setShowEditStockForm(true);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Bestand bearbeiten"
                >
                  <Edit className="w-4 h-4 text-gray-500" />
                </button>
                {material.current_stock <= material.min_stock && (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Aktueller Bestand:</span>
                <span className="font-medium">
                  {material.current_stock} {material.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Mindestbestand:</span>
                <span className="font-medium">
                  {material.min_stock} {material.unit}
                </span>
              </div>
            </div>

            {material.current_stock <= material.min_stock && (
              <div className="mt-4 p-2 bg-red-100 rounded text-sm text-red-800">
                Nachbestellung erforderlich!
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Material Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Neues Material hinzufügen</h3>
            <form onSubmit={handleAddMaterial}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={newMaterial.name}
                    onChange={(e) => setNewMaterial({...newMaterial, name: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Typ</label>
                  <select
                    value={newMaterial.type}
                    onChange={(e) => setNewMaterial({...newMaterial, type: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    required
                  >
                    <option value="">Typ auswählen...</option>
                    <option value="Verpackung">Verpackung</option>
                    <option value="Schutz">Schutz</option>
                    <option value="Werkzeug">Werkzeug</option>
                    <option value="Sonstiges">Sonstiges</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Aktueller Bestand</label>
                  <input
                    type="number"
                    min="0"
                    value={newMaterial.current_stock}
                    onChange={(e) => setNewMaterial({...newMaterial, current_stock: parseInt(e.target.value)})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mindestbestand</label>
                  <input
                    type="number"
                    min="0"
                    value={newMaterial.min_stock}
                    onChange={(e) => setNewMaterial({...newMaterial, min_stock: parseInt(e.target.value)})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Einheit</label>
                  <select
                    value={newMaterial.unit}
                    onChange={(e) => setNewMaterial({...newMaterial, unit: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    required
                  >
                    <option value="">Einheit auswählen...</option>
                    <option value="Stück">Stück</option>
                    <option value="Meter">Meter</option>
                    <option value="Rollen">Rollen</option>
                    <option value="Kartons">Kartons</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                  >
                    Hinzufügen
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Stock Form Modal */}
      {showEditStockForm && selectedMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Bestand bearbeiten: {selectedMaterial.name}</h3>
            <form onSubmit={handleStockUpdate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bewegungstyp</label>
                  <select
                    value={stockChange.movement_type}
                    onChange={(e) => setStockChange({...stockChange, movement_type: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    required
                  >
                    <option value="in">Wareneingang</option>
                    <option value="out">Warenausgang</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Menge</label>
                  <input
                    type="number"
                    min="1"
                    value={stockChange.quantity}
                    onChange={(e) => setStockChange({...stockChange, quantity: parseInt(e.target.value)})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Aktueller Bestand: {selectedMaterial.current_stock} {selectedMaterial.unit}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notiz</label>
                  <input
                    type="text"
                    value={stockChange.notes}
                    onChange={(e) => setStockChange({...stockChange, notes: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    placeholder="z.B. Neue Lieferung, Inventurkorrektur, etc."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditStockForm(false);
                      setSelectedMaterial(null);
                      setStockChange({ quantity: 0, movement_type: 'in', notes: '' });
                    }}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                  >
                    Speichern
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialList; 