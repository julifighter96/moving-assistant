import React, { useState, useEffect, useMemo } from 'react';

const ITEM_VOLUME_MAP = {
  'TV-Bank': 0.5,
  'Stuhl': 0.3,
  'Fernseher': 0.2,
  'Sessel': 0.8,
  'Schrank': 2.0,
};

const DEFAULT_ITEMS = [
  { name: 'TV-Bank', quantity: 0 },
  { name: 'Stuhl', quantity: 0 },
  { name: 'Fernseher', quantity: 0 },
  { name: 'Sessel', quantity: 0 },
  { name: 'Schrank', quantity: 0 },
];

const DEFAULT_PACK_MATERIALS = [
  { name: 'Umzugskartons (Standard)', quantity: 0 },
  { name: 'Bücherkartons (Bücher&Geschirr)', quantity: 0 },
  { name: 'Kleiderkisten', quantity: 0 },
];

const combineItems = (items) => {
  return items.reduce((acc, item) => {
    const existingItem = acc.find(i => i.name === item.name);
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      acc.push({ ...item });
    }
    return acc;
  }, []);
};

const RoomItemsSelector = ({ roomName, onUpdateRoom, initialData }) => {
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [packMaterials, setPackMaterials] = useState(DEFAULT_PACK_MATERIALS);

  useEffect(() => {
    if (initialData) {
      const combinedItems = combineItems([...DEFAULT_ITEMS, ...(initialData.items || [])]);
      const combinedPackMaterials = combineItems([...DEFAULT_PACK_MATERIALS, ...(initialData.packMaterials || [])]);
      setItems(combinedItems);
      setPackMaterials(combinedPackMaterials);
    }
  }, [initialData]);

  const handleQuantityChange = (index, change, stateUpdater, stateType) => {
    stateUpdater(prevItems => {
      const newItems = prevItems.map((item, i) => 
        i === index ? { ...item, quantity: Math.max(0, item.quantity + change) } : item
      );
      updateRoomData(newItems, stateType);
      return newItems;
    });
  };

  const totalVolume = useMemo(() => {
    return items.reduce((total, item) => {
      return total + (ITEM_VOLUME_MAP[item.name] || 0) * item.quantity;
    }, 0);
  }, [items]);

  const estimatedWeight = useMemo(() => {
    return totalVolume * 200;
  }, [totalVolume]);

  const updateRoomData = (newData, dataType) => {
    const updatedData = {
      items: dataType === 'items' ? newData : items,
      packMaterials: dataType === 'packMaterials' ? newData : packMaterials,
      totalVolume,
      estimatedWeight
    };
    onUpdateRoom(roomName, updatedData);
  };

  useEffect(() => {
    updateRoomData(items, 'items');
  }, [totalVolume, estimatedWeight]);

  const renderItemList = (itemList, stateUpdater, stateType) => (
    <ul className="divide-y divide-gray-200">
      {itemList.map((item, index) => (
        <li key={item.name} className="flex items-center justify-between p-4">
          <span className="text-lg">{item.name}</span>
          <div className="flex items-center">
            <button
              className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"
              onClick={() => handleQuantityChange(index, -1, stateUpdater, stateType)}
            >
              -
            </button>
            <span className="mx-2 w-8 text-center">{item.quantity}</span>
            <button
              className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"
              onClick={() => handleQuantityChange(index, 1, stateUpdater, stateType)}
            >
              +
            </button>
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg">
      <div className="bg-blue-600 text-white p-4">
        <h2 className="text-xl font-semibold text-center mb-4">{roomName}</h2>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">Möbel</h3>
        {renderItemList(items, setItems, 'items')}
        
        <h3 className="text-lg font-semibold mt-6 mb-2">Packmaterialien</h3>
        {renderItemList(packMaterials, setPackMaterials, 'packMaterials')}
        
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
      </div>
    </div>
  );
};

export default RoomItemsSelector;