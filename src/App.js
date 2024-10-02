import React, { useState, useCallback } from 'react';
import DealViewer from './components/DealViewer';
import MoveInformationComponent from './components/MoveInformationComponent';
import RoomSelector from './components/RoomSelector';
import RoomItemsSelector from './components/RoomItemsSelector';
import AdditionalInfoComponent from './components/AdditionalInfoComponent';
import OfferComponent from './components/OfferComponent';

const INITIAL_ROOMS = ['Wohnzimmer', 'Schlafzimmer', 'Küche', 'Badezimmer'];

const DEFAULT_ROOM_DATA = {
  items: [
    { name: 'TV-Bank', quantity: 0, volume: 0.5 },
    { name: 'Stuhl', quantity: 0, volume: 0.3 },
    { name: 'Fernseher', quantity: 0, volume: 0.2 },
    { name: 'Sessel', quantity: 0, volume: 0.8 },
    { name: 'Schrank', quantity: 0, volume: 2.0 },
  ],
  packMaterials: [
    { name: 'Umzugskartons (Standard)', quantity: 0 },
    { name: 'Bücherkartons (Bücher&Geschirr)', quantity: 0 },
    { name: 'Kleiderkisten', quantity: 0 },
  ],
  totalVolume: 0,
  estimatedWeight: 0,
};

const StepNavigation = ({ currentStep, totalSteps, onStepChange }) => {
  return (
    <div className="flex justify-between mb-4">
      <button 
        onClick={() => onStepChange(currentStep - 1)} 
        disabled={currentStep === 0}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
      >
        Zurück
      </button>
      <span>{`Schritt ${currentStep + 1} von ${totalSteps}`}</span>
      <button 
        onClick={() => onStepChange(currentStep + 1)} 
        disabled={currentStep === totalSteps - 1}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
      >
        Weiter
      </button>
    </div>
  );
};

function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [moveInfo, setMoveInfo] = useState(null);
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
    setCurrentStep(1);
  };

  const handleMoveInfoComplete = (info) => {
    setMoveInfo(info);
    setCurrentStep(2);
  };

  const handleRoomChange = useCallback((room) => {
    setCurrentRoom(room);
  }, []);

  const handleUpdateRoomData = useCallback((roomName, data) => {
    setRoomsData(prevData => ({
      ...prevData,
      [roomName]: data
    }));
  }, []);

  const handleAddRoom = useCallback((newRoom) => {
    setRooms(prevRooms => [...prevRooms, newRoom]);
    setRoomsData(prevData => ({
      ...prevData,
      [newRoom]: { ...DEFAULT_ROOM_DATA }
    }));
    setCurrentRoom(newRoom);
  }, []);

  const handleAddItem = useCallback((newItem) => {
    setRoomsData(prevData => {
      const updatedData = { ...prevData };
      Object.keys(updatedData).forEach(room => {
        if (newItem.volume !== undefined) {
          if (!updatedData[room].items.some(item => item.name === newItem.name)) {
            updatedData[room].items = [...updatedData[room].items, { 
              ...newItem, 
              quantity: 0, 
              demontiert: false, 
              duebelarbeiten: false 
            }];
          }
        } else {
          if (!updatedData[room].packMaterials.some(material => material.name === newItem.name)) {
            updatedData[room].packMaterials = [...updatedData[room].packMaterials, { ...newItem, quantity: 0 }];
          }
        }
      });
      return updatedData;
    });
  }, []);

  const handleAdditionalInfoComplete = (info) => {
    setAdditionalInfo(info);
    setCurrentStep(4);
  };

  const handleStepChange = (newStep) => {
    setCurrentStep(newStep);
  };

  const steps = [
    { component: <DealViewer onStartInspection={handleStartInspection} /> },
    { component: <MoveInformationComponent dealId={selectedDealId} onComplete={handleMoveInfoComplete} /> },
    { component: (
      <>
        <RoomSelector
          rooms={rooms}
          currentRoom={currentRoom}
          onRoomChange={handleRoomChange}
          onAddRoom={handleAddRoom}
        />
        <RoomItemsSelector
          key={currentRoom}
          roomName={currentRoom}
          onUpdateRoom={handleUpdateRoomData}
          initialData={roomsData[currentRoom]}
          onAddItem={handleAddItem}
        />
      </>
    ) },
    { component: <AdditionalInfoComponent onComplete={handleAdditionalInfoComplete} /> },
    { component: (
      <OfferComponent 
        inspectionData={{ rooms: roomsData, additionalInfo, moveInfo }}
        dealId={selectedDealId}
      />
    ) },
  ];

  return (
    <div className="App bg-gray-100 min-h-screen py-8">
      <div className="max-w-2xl mx-auto">
        <StepNavigation 
          currentStep={currentStep} 
          totalSteps={steps.length} 
          onStepChange={handleStepChange} 
        />
        {steps[currentStep].component}
      </div>
    </div>
  );
}

export default App;