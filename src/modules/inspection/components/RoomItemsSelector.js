import React, { useState, useEffect, useCallback } from 'react';
import RoomPhotoCapture from './RoomPhotoCapture';

const RoomItemsSelector = ({ roomData, onUpdateRoom, onAddItem }) => {
  const [expandedItems, setExpandedItems] = useState(true);
  const [newItem, setNewItem] = useState({
    name: '',
    volume: 0,
    width: 0,
    length: 0,
    height: 0
  });

  const handleAddItem = () => {
    if (!newItem.name) return;
    onAddItem(newItem);
    setNewItem({
      name: '',
      volume: 0,
      width: 0,
      length: 0,
      height: 0
    });
  };

  const handleItemChange = (itemId, changes) => {
    const updatedItems = roomData.items.map(item =>
      item.id === itemId ? { ...item, ...changes } : item
    );
    onUpdateRoom({ ...roomData, items: updatedItems });
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        {/* Header with item count */}
        <div className="bg-white p-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Gegenstände</h3>
          <span className="text-sm text-gray-600">
            {roomData?.items?.length || 0} Gegenstände
          </span>
        </div>

        {/* Add new item section */}
        <div className="bg-gray-50 p-4 border-t">
          <div className="grid grid-cols-5 gap-4">
            <input
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem({...newItem, name: e.target.value})}
              placeholder="Name des Gegenstands"
              className="col-span-2 p-2 border rounded"
            />
            <div className="col-span-3 grid grid-cols-3 gap-2">
              <input
                type="number"
                value={newItem.width}
                onChange={(e) => setNewItem({...newItem, width: parseFloat(e.target.value)})}
                placeholder="Breite (cm)"
                className="p-2 border rounded"
              />
              <input
                type="number"
                value={newItem.length}
                onChange={(e) => setNewItem({...newItem, length: parseFloat(e.target.value)})}
                placeholder="Länge (cm)"
                className="p-2 border rounded"
              />
              <input
                type="number"
                value={newItem.height}
                onChange={(e) => setNewItem({...newItem, height: parseFloat(e.target.value)})}
                placeholder="Höhe (cm)"
                className="p-2 border rounded"
              />
            </div>
            <button
              onClick={handleAddItem}
              disabled={!newItem.name.trim()}
              className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 
                        disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Hinzufügen
            </button>
          </div>
        </div>

        {/* Items list */}
        {expandedItems && roomData?.items?.length > 0 && (
          <div className="bg-white p-4 space-y-2">
            {roomData.items.map(item => (
              <div 
                key={item.id} 
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500">
                    {item.width}x{item.length}x{item.height}cm ({item.volume}m³)
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={item.quantity || 0}
                    onChange={(e) => handleItemChange(item.id, { quantity: parseInt(e.target.value) })}
                    className="w-20 p-2 border rounded"
                    min="0"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={item.demontiert || false}
                      onChange={(e) => handleItemChange(item.id, { demontiert: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    Demontiert
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}

        {(!roomData?.items || roomData.items.length === 0) && (
          <div className="bg-white p-4 text-center text-gray-500">
            Keine Gegenstände vorhanden
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomItemsSelector;