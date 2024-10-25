import React, { useState, useEffect, useMemo, useCallback } from 'react';
import RoomPhotoCapture from './RoomPhotoCapture';

const RoomItemsSelector = ({ roomName, onUpdateRoom, initialData, onAddItem }) => {
  const [items, setItems] = useState(initialData.items || []);
  const [packMaterials, setPackMaterials] = useState(initialData.packMaterials || []);
  const [newItem, setNewItem] = useState({ name: '', volume: 0, demontiert: false, duebelarbeiten: false });
  const [newPackMaterial, setNewPackMaterial] = useState({ name: '', quantity: 0 });

  const totalVolume = useMemo(() => {
    return items.reduce((total, item) => total + item.volume * item.quantity, 0);
  }, [items]);

  const estimatedWeight = useMemo(() => {
    return totalVolume * 200;
  }, [totalVolume]);

  // Update local state when initialData changes
  useEffect(() => {
    setItems(initialData.items || []);
    setPackMaterials(initialData.packMaterials || []);
  }, [initialData]);

  // Update parent component whenever data changes
  useEffect(() => {
    onUpdateRoom(roomName, {
      items,
      packMaterials,
      totalVolume,
      estimatedWeight
    });
  }, [roomName, items, packMaterials, totalVolume, estimatedWeight, onUpdateRoom]);

  const handleQuantityChange = useCallback((index, change, stateUpdater) => {
    stateUpdater(prevItems => {
      const newItems = prevItems.map((item, i) => 
        i === index ? { ...item, quantity: Math.max(0, item.quantity + change) } : item
      );
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

  const handleAddPackMaterial = useCallback(() => {
    if (newPackMaterial.name && !packMaterials.some(material => material.name === newPackMaterial.name)) {
      setPackMaterials(prevMaterials => [...prevMaterials, { ...newPackMaterial, quantity: 0 }]);
      onAddItem(newPackMaterial);
      setNewPackMaterial({ name: '', quantity: 0 });
    }
  }, [packMaterials, newPackMaterial, onAddItem]);

  const renderItemList = useCallback((itemList, stateUpdater, showVolume = false) => (
    <ul className="divide-y divide-gray-200">
      {itemList.map((item, index) => (
        <li key={item.name} className="flex items-center justify-between p-4">
          <span className="text-lg">{item.name}</span>
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
            {showVolume && (
              <>
                <input
                  type="number"
                  value={item.volume}
                  onChange={(e) => handleVolumeChange(index, e.target.value)}
                  className="w-20 p-1 border border-gray-300 rounded-md"
                  placeholder="Volumen (m³)"
                />
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
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  ), [handleQuantityChange, handleVolumeChange, handleCheckboxChange]);

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg">
      <div className="bg-blue-600 text-white p-4">
        <h2 className="text-xl font-semibold text-center mb-4">{roomName}</h2>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">Möbel</h3>
        {renderItemList(items, setItems, true)}
        
        <div className="flex mt-2">
          <input
            type="text"
            value={newItem.name}
            onChange={(e) => setNewItem({...newItem, name: e.target.value})}
            placeholder="Neuer Gegenstand"
            className="flex-grow p-2 border border-gray-300 rounded-l-md"
          />
          <input
            type="number"
            value={newItem.volume}
            onChange={(e) => setNewItem({...newItem, volume: parseFloat(e.target.value)})}
            placeholder="Volumen (m³)"
            className="w-32 p-2 border-t border-b border-gray-300"
          />
          <button
            onClick={handleAddItem}
            className="bg-green-500 text-white p-2 rounded-r-md hover:bg-green-600 transition-colors"
          >
            Hinzufügen
          </button>
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

        <RoomPhotoCapture 
          roomName={roomName}
        />
      </div>
    </div>
  );
};

export default RoomItemsSelector;