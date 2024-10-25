import React, { useState, useCallback } from 'react';
import DealViewer from './components/DealViewer';
import MoveInformationComponent from './components/MoveInformationComponent';
import RoomSelector from './components/RoomSelector';
import RoomItemsSelector from './components/RoomItemsSelector';
import AdditionalInfoComponent from './components/AdditionalInfoComponent';
import OfferComponent from './components/OfferComponent';
import SuccessPopup from './components/SuccessPopup';
import LoginWrapper from './components/LoginWrapper';


const INITIAL_ROOMS = ['Wohnzimmer', 'Schlafzimmer', 'Küche', 'Badezimmer', 'Arbeitszimmer'];

const DEFAULT_ROOM_INVENTORY = {
  'Wohnzimmer': [
    { name: 'Sofa 2-Sitzer', quantity: 0, volume: 1.5 },
    { name: 'Sofa 3-Sitzer', quantity: 0, volume: 2 },
    { name: 'Sofatisch', quantity: 0, volume: 0.5 },
    { name: 'Schrank 2-türig', quantity: 0, volume: 1.5 },
    { name: 'Schrank 3-türig', quantity: 0, volume: 2 },
    { name: 'Tisch', quantity: 0, volume: 1 },
    { name: 'Stühle', quantity: 0, volume: 0.3 },
    { name: 'TV-Bank', quantity: 0, volume: 0.8 },
    { name: 'Sessel', quantity: 0, volume: 0.8 },
  ],
  'Schlafzimmer': [
    { name: 'Doppelbett', quantity: 0, volume: 2.5 },
    { name: 'Einzelbett', quantity: 0, volume: 1.5 },
    { name: 'Schrank 2-türig', quantity: 0, volume: 1.5 },
    { name: 'Schrank 3-türig', quantity: 0, volume: 2 },
    { name: 'Schrank 4-türig', quantity: 0, volume: 2.5 },
    { name: 'Nachtisch', quantity: 0, volume: 0.3 },
    { name: 'Kommode', quantity: 0, volume: 1 },
  ],
  'Küche': [
    { name: 'Unterschrank', quantity: 0, volume: 0.8 },
    { name: 'Oberschrank', quantity: 0, volume: 0.6 },
    { name: 'Hochschrank', quantity: 0, volume: 1.2 },
    { name: 'Kühlschrank', quantity: 0, volume: 1 },
    { name: 'Amerikanischer Kühlschrank', quantity: 0, volume: 1.5 },
  ],
  'Badezimmer': [
    { name: 'Waschmaschine / Trockner', quantity: 0, volume: 0.8 },
    { name: 'Regal', quantity: 0, volume: 0.5 },
  ],
  'Arbeitszimmer': [
    { name: 'Schreibtisch', quantity: 0, volume: 1 },
    { name: 'Schreibtischstuhl', quantity: 0, volume: 0.4 },
    { name: 'Regal', quantity: 0, volume: 0.8 },
    { name: 'Schrank 2-türig', quantity: 0, volume: 1.5 },
    { name: 'Schrank 3-türig', quantity: 0, volume: 2 },
  ],
};

const DEFAULT_PACK_MATERIALS = [
  { name: 'Umzugskartons (Standard)', quantity: 0 },
  { name: 'Bücherkartons (Bücher&Geschirr)', quantity: 0 },
  { name: 'Kleiderkisten', quantity: 0 },
];

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
      initialRoomsData[room] = {
        items: DEFAULT_ROOM_INVENTORY[room] || [],
        packMaterials: DEFAULT_PACK_MATERIALS,
        photos: [],
        totalVolume: 0,
        estimatedWeight: 0,
      };
    });
    return initialRoomsData;
  });
  const [additionalInfo, setAdditionalInfo] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  const handleStartInspection = useCallback((deal) => {
    setSelectedDealId(deal.id);
    setDealData(deal);
    setCurrentStep(1);
  }, []);

  const resetToStart = useCallback(() => {
    setCurrentStep(0);
    setMoveInfo(null);
    setSelectedDealId(null);
    setDealData(null);
    setRooms(INITIAL_ROOMS);
    setCurrentRoom(INITIAL_ROOMS[0]);
    setRoomsData(() => {
      const initialRoomsData = {};
      INITIAL_ROOMS.forEach(room => {
        initialRoomsData[room] = {
          items: DEFAULT_ROOM_INVENTORY[room] || [],
          packMaterials: DEFAULT_PACK_MATERIALS,
          totalVolume: 0,
          estimatedWeight: 0,
        };
      });
      return initialRoomsData;
    });
    setAdditionalInfo(null);
  }, []);

  const handleMoveInfoComplete = (info) => {
    setMoveInfo(info);
    setCurrentStep(2);
    setShowPopup(true);
    setPopupMessage('Umzugsinformationen erfolgreich aktualisiert!');
  };

  const handleRoomChange = useCallback((room) => {
    console.log('Switching to room:', room);
    console.log('Current room data:', roomsData[room]);
    setCurrentRoom(room);
  }, [roomsData]);

  const handleUpdateRoomData = useCallback((roomName, updatedRoomData) => {
    setRoomsData(prevData => {
      const newData = {
        ...prevData,
        [roomName]: {
          ...prevData[roomName],
          ...updatedRoomData
        }
      };
      console.log('Updated room data:', newData);
      return newData;
    });
  }, []);

  const handleAddRoom = useCallback((newRoom) => {
    setRooms(prevRooms => [...prevRooms, newRoom]);
    setRoomsData(prevData => ({
      ...prevData,
      [newRoom]: {
        items: [],
        packMaterials: DEFAULT_PACK_MATERIALS,
        photos: [],
        totalVolume: 0,
        estimatedWeight: 0,
      }
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

  const handleOfferComplete = () => {
    setShowPopup(true);
    setPopupMessage('Das Angebot wurde erfolgreich erstellt und der Deal aktualisiert.');
    setTimeout(() => {
      resetToStart();
    }, 3000);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const handleStepChange = (newStep) => {
    setCurrentStep(newStep);
  };

  return (
    <LoginWrapper>
    <div className="App bg-gray-100 min-h-screen py-8">
      <div className="max-w-2xl mx-auto">
        <SuccessPopup 
          isVisible={showPopup}
          onClose={handleClosePopup}
          message={popupMessage}
        />
        <StepNavigation 
          currentStep={currentStep} 
          totalSteps={5} 
          onStepChange={handleStepChange} 
        />
        {currentStep === 0 && <DealViewer onStartInspection={handleStartInspection} />}
        {currentStep === 1 && <MoveInformationComponent dealId={selectedDealId} onComplete={handleMoveInfoComplete} />}
        {currentStep === 2 && (
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
        )}
        {currentStep === 3 && <AdditionalInfoComponent onComplete={handleAdditionalInfoComplete} />}
        {currentStep === 4 && (
          <OfferComponent 
            inspectionData={{ rooms: roomsData, additionalInfo, moveInfo }}
            dealId={selectedDealId}
            onComplete={handleOfferComplete}
          />
        )}
      </div>
    </div>
    </LoginWrapper>
  );
}

export default App;