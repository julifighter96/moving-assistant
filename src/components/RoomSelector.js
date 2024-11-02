import React, { useState } from 'react';

const RoomSelector = ({ rooms, currentRoom, onRoomChange, onAddRoom }) => {
  const [newRoom, setNewRoom] = useState('');

  const handleAddRoom = () => {
    if (newRoom && !rooms.includes(newRoom)) {
      onAddRoom(newRoom);
      setNewRoom('');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-2">Räume</h2>
      
      {/* Room Grid */}
      <div className="grid grid-cols-1 gap-2">
        {rooms.map((room) => (
          <button
            key={room}
            onClick={() => onRoomChange(room)}
            className={`
              p-3 rounded-lg text-left transition-all duration-200
              ${currentRoom === room 
                ? 'bg-primary text-white' 
                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
              }
            `}
          >
            {room}
          </button>
        ))}
      </div>

      {/* Add New Room */}
      <div className="mt-4 flex">
        <input
          type="text"
          value={newRoom}
          onChange={(e) => setNewRoom(e.target.value)}
          placeholder="Neuer Raum"
          className="flex-grow p-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <button
          onClick={handleAddRoom}
          className="bg-green-500 text-white px-4 rounded-r-lg hover:bg-green-600 transition-colors"
        >
          +
        </button>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Räume:</span>
          <span className="font-medium">{rooms.length}</span>
        </div>
      </div>
    </div>
  );
};

export default RoomSelector;