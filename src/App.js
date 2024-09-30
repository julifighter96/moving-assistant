import React, { useState, useCallback } from 'react';
import DealViewer from './components/DealViewer';
import RoomSelector from './components/RoomSelector';
import RoomItemsSelector from './components/RoomItemsSelector';
import AdditionalInfoComponent from './components/AdditionalInfoComponent';
import OfferComponent from './components/OfferComponent';

const INITIAL_ROOMS = ['Wohnzimmer', 'Schlafzimmer', 'Küche', 'Badezimmer'];

const DEFAULT_ROOM_DATA = {
  items: [
    { name: 'TV-Bank', quantity: 0 },
    { name: 'Stuhl', quantity: 0 },
    { name: 'Fernseher', quantity: 0 },
    { name: 'Sessel', quantity: 0 },
    { name: 'Schrank', quantity: 0 },
  ],
  packMaterials: [
    { name: 'Umzugskartons (Standard)', quantity: 0 },
    { name: 'Bücherkartons (Bücher&Geschirr)', quantity: 0 },
    { name: 'Kleiderkisten', quantity: 0 },
  ],
  totalVolume: 0,
  estimatedWeight: 0,
};

function App() {
  const [currentView, setCurrentView] = useState('dealViewer');
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [dealData, setDealData] = useState(null);
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [currentRoom, setCurrentRoom] = useState(INITIAL_ROOMS[0]);
  const [roomsData, setRoomsData] = useState(() => {
    const initialRoomsData = {};
    INITIAL_ROOMS.forEach(room => {
      initialRoomsData[room] = { ...DEFAULT_ROOM_DATA };
    });
    return initialRoomsData;
  });
  const [additionalInfo, setAdditionalInfo] = useState(null);

  const handleStartInspection = (deal) => {
    setSelectedDealId(deal.id);
    setDealData(deal);
    setCurrentView('roomSelector');
  };

  const handleRoomChange = useCallback((room) => {
    setCurrentRoom(room);
  }, []);

  const handleUpdateRoomData = useCallback((roomName, data) => {
    setRoomsData(prevData => {
      const newData = { ...prevData };
      newData[roomName] = data;
      return newData;
    });
  }, []);

  const handleCompleteInspection = () => {
    setCurrentView('additionalInfo');
  };

  const handleAdditionalInfoComplete = (info) => {
    setAdditionalInfo(info);
    setCurrentView('offer');
  };

  return (
    <div className="App bg-gray-100 min-h-screen py-8">
      <div className="max-w-2xl mx-auto">
        {currentView === 'dealViewer' && (
          <DealViewer onStartInspection={handleStartInspection} />
        )}
        {currentView === 'roomSelector' && (
          <>
            <RoomSelector
              rooms={rooms}
              currentRoom={currentRoom}
              onRoomChange={handleRoomChange}
            />
            <RoomItemsSelector
              key={currentRoom}
              roomName={currentRoom}
              onUpdateRoom={handleUpdateRoomData}
              initialData={roomsData[currentRoom]}
            />
            <button
              className="w-full bg-green-500 text-white p-2 rounded-md mt-6 hover:bg-green-600 transition duration-200"
              onClick={handleCompleteInspection}
            >
              Besichtigung abschließen
            </button>
          </>
        )}
        {currentView === 'additionalInfo' && (
          <AdditionalInfoComponent onComplete={handleAdditionalInfoComplete} />
        )}
        {currentView === 'offer' && (
          <OfferComponent 
            inspectionData={{ rooms: roomsData, additionalInfo }}
            dealId={selectedDealId}
            
          />
        )}
      </div>
    </div>
  );
}

export default App;