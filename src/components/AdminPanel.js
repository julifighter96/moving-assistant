import React, { useState } from 'react';

const AdminPanel = ({ rooms, items, onUpdateRooms, onUpdateItems }) => {
  const [newRoom, setNewRoom] = useState('');
  const [newItem, setNewItem] = useState({ name: '', volume: 0 });

  const handleAddRoom = () => {
    if (newRoom && !rooms.includes(newRoom)) {
      onUpdateRooms([...rooms, newRoom]);
      setNewRoom('');
    }
  };

  const handleRemoveRoom = (roomToRemove) => {
    onUpdateRooms(rooms.filter(room => room !== roomToRemove));
  };

  const handleAddItem = () => {
    if (newItem.name && !items.some(item => item.name === newItem.name)) {
      onUpdateItems([...items, newItem]);
      setNewItem({ name: '', volume: 0 });
    }
  };

  const handleRemoveItem = (itemToRemove) => {
    onUpdateItems(items.filter(item => item.name !== itemToRemove));
  };

  const handleUpdateItemVolume = (index, newVolume) => {
    const updatedItems = [...items];
    updatedItems[index].volume = parseFloat(newVolume);
    onUpdateItems(updatedItems);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>
      
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Räume</h3>
        <ul className="mb-4">
          {rooms.map(room => (
            <li key={room} className="flex justify-between items-center mb-2">
              {room}
              <button onClick={() => handleRemoveRoom(room)} className="text-red-500">Entfernen</button>
            </li>
          ))}
        </ul>
        <div className="flex">
          <input
            type="text"
            value={newRoom}
            onChange={(e) => setNewRoom(e.target.value)}
            placeholder="Neuer Raum"
            className="flex-grow p-2 border border-gray-300 rounded-l-md"
          />
          <button
            onClick={handleAddRoom}
            className="bg-blue-500 text-white p-2 rounded-r-md hover:bg-blue-600 transition duration-200"
          >
            Hinzufügen
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2">Gegenstände</h3>
        <ul className="mb-4">
          {items.map((item, index) => (
            <li key={item.name} className="flex justify-between items-center mb-2">
              <span>{item.name}</span>
              <div className="flex items-center">
                <label className="mr-2">Volumen (m³):</label>
                <input
                  type="number"
                  value={item.volume}
                  onChange={(e) => handleUpdateItemVolume(index, e.target.value)}
                  className="w-20 p-1 border border-gray-300 rounded-md mr-2"
                />
                <button onClick={() => handleRemoveItem(item.name)} className="text-red-500">Entfernen</button>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex items-center">
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
            className="bg-blue-500 text-white p-2 rounded-r-md hover:bg-blue-600 transition duration-200"
          >
            Hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;