import React, { useState, useEffect, useMemo, useCallback } from 'react';
import RoomPhotoCapture from './RoomPhotoCapture';

const RoomItemsSelector = ({ roomName, onUpdateRoom, initialData, onAddItem }) => {
  const [items, setItems] = useState(initialData.items || []);
  const [packMaterials, setPackMaterials] = useState(initialData.packMaterials || []);
  const [newPackMaterial, setNewPackMaterial] = useState({ name: '', quantity: 0 });
  const [notes, setNotes] = useState(initialData.notes || '');
  const [newItem, setNewItem] = useState({ 
    volume: 0, demontiert: false, duebelarbeiten: false,
    name: '', 
    width: 0, 
    length: 0, 
    height: 0 
  });
  

  const totalVolume = useMemo(() => {
    return items.reduce((total, item) => {
      const itemVolume = (item.length * item.width * item.height) / 1000000; // cm³ to m³
      return total + itemVolume * item.quantity;
    }, 0);
  }, [items]);

  const estimatedWeight = useMemo(() => {
    return totalVolume * 200;
  }, [totalVolume]);

  // Update local state when initialData changes
  useEffect(() => {
    setItems(initialData.items || []);
    setPackMaterials(initialData.packMaterials || []);
    setNotes(initialData.notes || '');
  }, [initialData]);

  // Update parent component whenever data changes
  useEffect(() => {
    onUpdateRoom(roomName, {
      items,
      packMaterials,
      totalVolume: items.reduce((total, item) => 
        total + ((item.width || 0) * (item.length || 0) * (item.height || 0) * item.quantity), 0
      ),
      estimatedWeight,
      notes
    });
  }, [roomName, items, packMaterials, totalVolume, estimatedWeight, notes, onUpdateRoom]);

  const handleQuantityChange = useCallback((index, change, stateUpdater) => {
    stateUpdater(prevItems => {
      const newItems = prevItems.map((item, i) => {
        if (i === index) {
          const increment = item.name === 'Packseide' ? 10 : 1;
          return { 
            ...item, 
            quantity: Math.max(0, item.quantity + (change * increment))
          };
        }
        return item;
      });
      return newItems;
    });
  }, []);

  const handleVolumeChange = useCallback((index, newVolume) => {
    setItems(prevItems => {
      const newItems = prevItems.map((item, i) => 
        i === index ? { ...item, volume: parseFloat(newVolume) } : item
      );
      return newItems;
    });
  }, []);

  const handleCheckboxChange = useCallback((index, field) => {
    setItems(prevItems => {
      const newItems = prevItems.map((item, i) => 
        i === index ? { ...item, [field]: !item[field] } : item
      );
      return newItems;
    });
  }, []);

  const handleAddItem = useCallback(() => {
    if (newItem.name && !items.some(item => item.name === newItem.name)) {
      setItems(prevItems => [...prevItems, { ...newItem, quantity: 0 }]);
      onAddItem(newItem);
      setNewItem({ name: '', volume: 0, demontiert: false, duebelarbeiten: false });
    }
  }, [items, newItem, onAddItem]);

  const [editingItem, setEditingItem] = useState(null);

  const handleSaveEdit = (index) => {
    if (editingItem) {
      const updatedItems = [...items];
      updatedItems[index] = editingItem;
      setItems(updatedItems);
      setEditingItem(null);
    }
  };

  const handleAddPackMaterial = useCallback(() => {
    if (newPackMaterial.name && !packMaterials.some(material => material.name === newPackMaterial.name)) {
      setPackMaterials(prevMaterials => [...prevMaterials, { ...newPackMaterial, quantity: 0 }]);
      onAddItem(newPackMaterial);
      setNewPackMaterial({ name: '', quantity: 0 });
    }
  }, [packMaterials, newPackMaterial, onAddItem]);

  const renderItemList = useCallback((itemList, stateUpdater, showVolume = false) => (
    <div className="space-y-2">

      {/* List items */}
      {itemList.map((item, index) => (
        <div key={item.name} className="flex items-center justify-between p-4 bg-white rounded-lg">
          <span className="text-lg">{item.name}</span>
          <div className="flex items-center gap-4">
            {editingItem?.name === item.name ? (
              <>
                <input
                  type="number"
                  value={editingItem.width}
                  onChange={(e) => setEditingItem({...editingItem, width: parseFloat(e.target.value)})}
                  className="w-20 p-2 border rounded"
                  placeholder="Breite (cm)"
                />
                <input
                  type="number"
                  value={editingItem.length}
                  onChange={(e) => setEditingItem({...editingItem, length: parseFloat(e.target.value)})}
                  className="w-20 p-2 border rounded"
                  placeholder="Länge (cm)"
                />
                <input
                  type="number"
                  value={editingItem.height}
                  onChange={(e) => setEditingItem({...editingItem, height: parseFloat(e.target.value)})}
                  className="w-20 p-2 border rounded"
                  placeholder="Höhe (cm)"
                />
                <button onClick={() => handleSaveEdit(index)} className="px-3 py-1 bg-green-500 text-white rounded">
                  Speichern
                </button>
                <button onClick={() => setEditingItem(null)} className="px-3 py-1 bg-gray-500 text-white rounded">
                  Abbrechen
                </button>
              </>
            ) : (
              <>
                <span>{item.length}x{item.width}x{item.height}cm</span>
                <div className="flex items-center space-x-4">
                  <button
                    className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"
                    onClick={() => handleQuantityChange(index, -1, stateUpdater)}
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"
                    onClick={() => handleQuantityChange(index, 1, stateUpdater)}
                  >
                    +
                  </button>
                </div>
                {showVolume && (
                  <div className="flex gap-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={item.demontiert}
                        onChange={() => handleCheckboxChange(index, 'demontiert')}
                        className="mr-2"
                      />
                      Demontiert
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={item.duebelarbeiten}
                        onChange={() => handleCheckboxChange(index, 'duebelarbeiten')}
                        className="mr-2"
                      />
                      Dübelarbeiten
                    </label>
                  </div>
                )}
                <button onClick={() => setEditingItem(item)} className="px-3 py-1 text-blue-600">
                  Bearbeiten
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  ), [editingItem, newItem, handleQuantityChange, handleCheckboxChange]);

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg">
      <div className="bg-blue-600 text-white p-4">
        <h2 className="text-xl font-semibold text-center mb-4">{roomName}</h2>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">Möbel</h3>
        {renderItemList(items, setItems, true)}
    
<div className="space-y-2">
  <div className="flex gap-2 items-center">
    <input
      type="text"
      value={newItem.name}
      onChange={(e) => setNewItem({...newItem, name: e.target.value})}
      placeholder="Gegenstand Name"
      className="flex-grow p-2 border border-gray-300 rounded-md"
    />
    <div className="flex items-center gap-1">
      <div className="relative flex-1">
        <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-600">
          Länge
        </label>
        <input
          type="number"
          value={newItem.length}
          onChange={(e) => setNewItem({...newItem, length: parseInt(e.target.value) || ''})}
          placeholder="cm"
          className="w-24 p-2 border border-gray-300 rounded-md text-center"
        />
      </div>
      <span className="text-gray-400">×</span>
      <div className="relative flex-1">
        <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-600">
          Breite
        </label>
        <input
          type="number"
          value={newItem.width}
          onChange={(e) => setNewItem({...newItem, width: parseInt(e.target.value) || ''})}
          placeholder="cm"
          className="w-24 p-2 border border-gray-300 rounded-md text-center"
        />
      </div>
      <span className="text-gray-400">×</span>
      <div className="relative flex-1">
        <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-600">
          Höhe
        </label>
        <input
          type="number"
          value={newItem.height}
          onChange={(e) => setNewItem({...newItem, height: parseInt(e.target.value) || ''})}
          placeholder="cm"
          className="w-24 p-2 border border-gray-300 rounded-md text-center"
        />
      </div>
    </div>
    <button
      onClick={handleAddItem}
      disabled={!newItem.name || !newItem.length || !newItem.width || !newItem.height}
      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 
                transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
    >
      Hinzufügen
    </button>
  </div>
</div>
        
        <h3 className="text-lg font-semibold mt-6 mb-2">Packmaterialien</h3>
        {renderItemList(packMaterials, setPackMaterials)}
        
        <div className="flex mt-2">
          <input
            type="text"
            value={newPackMaterial.name}
            onChange={(e) => setNewPackMaterial({...newPackMaterial, name: e.target.value})}
            placeholder="Neues Packmaterial"
            className="flex-grow p-2 border border-gray-300 rounded-l-md"
          />
          <button
            onClick={handleAddPackMaterial}
            className="bg-green-500 text-white p-2 rounded-r-md hover:bg-green-600 transition-colors"
          >
            Hinzufügen
          </button>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Volumen</h3>
          <div className="flex justify-between items-center">
            <span>Volumen (m³)</span>
            <span>{totalVolume.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span>Geschätztes Gewicht (kg)</span>
            <span>{Math.round(estimatedWeight)}</span>
          </div>
        </div>

        <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Raum Notizen</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Zusätzliche Informationen für diesen Raum..."
          className="w-full p-2 border border-gray-300 rounded-md min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
        <RoomPhotoCapture 
          roomName={roomName}
        />
      </div>
    </div>
  );
};

export default RoomItemsSelector;