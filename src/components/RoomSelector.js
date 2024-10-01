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
    <div className="mb-4">
      <h2 className="text-xl font-semibold mb-2">Raumauswahl</h2>
      <div className="flex flex-wrap gap-2 mb-2">
        {rooms.map((room) => (
          <button
            key={room}
            className={`px-4 py-2 rounded-md ${
              currentRoom === room
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => onRoomChange(room)}
          >
            {room}
          </button>
        ))}
      </div>
      <div className="flex mt-2">
        <input
          type="text"
          value={newRoom}
          onChange={(e) => setNewRoom(e.target.value)}
          placeholder="Neuer Raum"
          className="flex-grow p-2 border border-gray-300 rounded-l-md"
        />
        <button
          onClick={handleAddRoom}
          className="bg-green-500 text-white p-2 rounded-r-md hover:bg-green-600 transition duration-200"
        >
          Raum hinzufügen
        </button>
      </div>
    </div>
  );
};

export default RoomSelector;