import React from 'react';

const RoomSelector = ({ rooms, currentRoom, onRoomChange }) => {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold mb-2">Raumauswahl</h2>
      <div className="flex flex-wrap gap-2">
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
    </div>
  );
};

export default RoomSelector;