import React, { useState, useCallback } from 'react';
import { Home, ClipboardList, Settings, Check, Plus } from 'lucide-react';
import DealViewer from './components/DealViewer';
import MoveInformationComponent from './components/MoveInformationComponent';
import RoomSelector from './components/RoomSelector';
import RoomItemsSelector from './components/RoomItemsSelector';
import AdditionalInfoComponent from './components/AdditionalInfoComponent';
import OfferComponent from './components/OfferComponent';
import SuccessPopup from './components/SuccessPopup';
import LoginWrapper from './components/LoginWrapper';
import { theme } from './theme';
import logo from './assets/images/Riedlin-Logo-512px_Neu.webp';


const APP_VERSION = 'v1.0.1';
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
  { name: 'Packseide', quantity: 0, incrementBy: 10 } 
];

const STEPS = [
  { label: 'Deal auswählen', status: 'pending' },
  { label: 'Umzugsinformationen', status: 'pending' },
  { label: 'Räume & Gegenstände', status: 'pending' },
  { label: 'Zusätzliche Details', status: 'pending' },
  { label: 'Angebot erstellen', status: 'pending' }
];

const TabletHeader = ({ currentDeal }) => {
  return (
    <header className="bg-white border-b border-neutral-200 h-16 fixed top-0 left-0 right-0 z-50">
      <div className="h-full flex items-center justify-between px-6">
        <div className="flex items-center">
        <img 
            src={logo}
            alt="Riedlin Logo" 
            className="h-16 w-auto"  // Adjusted height for better visibility
          />
          <span className="ml-3 text-2xl font-semibold text-neutral-900">Umzugshelfer</span>
        </div>
        
        {currentDeal && (
          <div className="flex items-center px-4 py-2 bg-primary-light rounded-lg mr-4">
            <span className="text-primary font-medium">
              {currentDeal.title || 'Aktueller Deal'}
            </span>
          </div>
        )}
        
        <nav className="flex items-center space-x-2">
          {[
            { icon: Home, label: 'Home' },
            { icon: ClipboardList, label: 'Inspektionen' },
            { icon: Settings, label: 'Settings' }
          ].map(({ icon: Icon, label }) => (
            <button 
              key={label}
              className="h-12 px-4 flex items-center justify-center rounded-lg hover:bg-neutral-100 active:bg-neutral-200"
            >
              <Icon className="h-6 w-6" />
              <span className="ml-2 text-base">{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

const StepNavigation = ({ currentStep, totalSteps, onStepChange }) => {
  return (
    <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
      <button 
        onClick={() => onStepChange(currentStep - 1)} 
        disabled={currentStep === 0}
        className="h-12 px-6 bg-primary text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed text-lg flex items-center justify-center min-w-[120px]"
      >
        Zurück
      </button>
      <div className="flex flex-col items-center">
        <span className="text-lg font-medium">{`Schritt ${currentStep + 1} von ${totalSteps}`}</span>
        <span className="text-sm text-gray-500">
          {currentStep === 0 && "Deal auswählen"}
          {currentStep === 1 && "Umzugsinformationen"}
          {currentStep === 2 && "Räume & Gegenstände"}
          {currentStep === 3 && "Zusätzliche Informationen"}
          {currentStep === 4 && "Angebot erstellen"}
        </span>
      </div>
      <button 
        onClick={() => onStepChange(currentStep + 1)} 
        disabled={currentStep === totalSteps - 1}
        className="h-12 px-6 bg-primary text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed text-lg flex items-center justify-center min-w-[120px]"
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
    setCurrentRoom(room);
  }, []);

  const handleUpdateRoomData = useCallback((roomName, updatedRoomData) => {
    setRoomsData(prevData => ({
      ...prevData,
      [roomName]: {
        ...prevData[roomName],
        ...updatedRoomData
      }
    }));
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
    if (newStep >= 0 && newStep < STEPS.length) {
      setCurrentStep(newStep);
    }
  };

  return (
    <LoginWrapper>
    <div className="min-h-screen bg-neutral-50">
      <TabletHeader currentDeal={dealData} />
      
      <main className="pt-20 px-6 pb-6">
        <div className="max-w-none mx-auto">
          {/* Step Progress */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between">
              {STEPS.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                
                return (
                  <div key={step.label} className="flex flex-col items-center flex-1">
                    <div className="relative w-full">
                      {index !== 0 && (
                        <div 
                          className={`absolute left-0 right-1/2 top-4 h-1 -z-10 
                          ${isCompleted ? 'bg-primary' : 'bg-gray-200'}`}
                        />
                      )}
                      {index !== STEPS.length - 1 && (
                        <div 
                          className={`absolute left-1/2 right-0 top-4 h-1 -z-10 
                          ${index < currentStep ? 'bg-primary' : 'bg-gray-200'}`}
                        />
                      )}
                      <div className="flex justify-center">
                        <div 
                          className={`w-8 h-8 rounded-full flex items-center justify-center 
                          ${isCompleted ? 'bg-primary text-white' : 
                            isCurrent ? 'bg-primary-light border-2 border-primary' : 
                            'bg-gray-200'}`}
                        >
                          {isCompleted ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`mt-2 text-sm font-medium text-center
                      ${isCurrent ? 'text-primary' : 'text-gray-500'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CHANGE 1: Add Step Controls here */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex justify-between items-center">
            <button 
              onClick={() => handleStepChange(currentStep - 1)} 
              disabled={currentStep === 0}
              className="h-12 px-6 bg-primary text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed text-lg flex items-center justify-center min-w-[120px]"
            >
              Zurück
            </button>
            <div className="flex flex-col items-center">
              <span className="text-lg font-medium">{`Schritt ${currentStep + 1} von ${STEPS.length}`}</span>
              <span className="text-sm text-gray-500">{STEPS[currentStep].label}</span>
            </div>
            <button 
              onClick={() => handleStepChange(currentStep + 1)} 
              disabled={currentStep === STEPS.length - 1}
              className="h-12 px-6 bg-primary text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed text-lg flex items-center justify-center min-w-[120px]"
            >
              Weiter
            </button>
          </div>

          {/* Main Content Area */}
          {/* CHANGE 2: Remove the old StepNavigation component if it exists */}
          <div className="space-y-6">
            {currentStep === 0 && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold">Deal auswählen</h2>
                  <p className="text-gray-500 mt-1">Wählen Sie einen Deal aus oder suchen Sie nach einem bestimmten Deal</p>
                </div>
                <div className="p-6">
                  <DealViewer onStartInspection={handleStartInspection} />
                </div>
              </div>
            )}
              
              {currentStep === 1 && (
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold">Umzugsinformationen</h2>
                    <p className="text-gray-500 mt-1">Geben Sie die grundlegenden Informationen zum Umzug ein</p>
                  </div>
                  <div className="p-6">
                    <MoveInformationComponent 
                      dealId={selectedDealId} 
                      onComplete={handleMoveInfoComplete} 
                    />
                  </div>
                </div>
              )}
              
              {currentStep === 2 && (
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-4">
                    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                      <div className="mb-4">
                        <h2 className="text-xl font-semibold">Räume</h2>
                        <p className="text-gray-500 mt-1">Wählen Sie einen Raum aus oder fügen Sie einen neuen hinzu</p>
                      </div>
                      <RoomSelector
                        rooms={rooms}
                        currentRoom={currentRoom}
                        onRoomChange={handleRoomChange}
                        onAddRoom={handleAddRoom}
                      />
                      
                      {/* Quick Summary */}
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h3 className="text-lg font-medium mb-2">Zusammenfassung</h3>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Gesamtvolumen:</span>
                            <span className="font-medium">
                              {Object.values(roomsData).reduce((sum, room) => sum + room.totalVolume, 0).toFixed(2)} m³
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Räume:</span>
                            <span className="font-medium">{rooms.length}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-8">
                    <div className="bg-white rounded-lg shadow-sm">
                      <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold">{currentRoom}</h2>
                        <p className="text-gray-500 mt-1">Inventar und Fotos für diesen Raum</p>
                      </div>
                      <div className="p-6">
                        <RoomItemsSelector
                          key={currentRoom}
                          roomName={currentRoom}
                          onUpdateRoom={handleUpdateRoomData}
                          initialData={roomsData[currentRoom]}
                          onAddItem={handleAddItem}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {currentStep === 3 && (
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold">Zusätzliche Details</h2>
                    <p className="text-gray-500 mt-1">Ergänzende Informationen zum Umzug</p>
                  </div>
                  <div className="p-6">
                    <AdditionalInfoComponent onComplete={handleAdditionalInfoComplete} />
                  </div>
                </div>
              )}
              
              {currentStep === 4 && (
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold">Angebot erstellen</h2>
                    <p className="text-gray-500 mt-1">Überprüfen und finalisieren Sie das Angebot</p>
                  </div>
                  <div className="p-6">
                    <OfferComponent 
                      inspectionData={{ rooms: roomsData, additionalInfo, moveInfo }}
                      dealId={selectedDealId}
                      onComplete={handleOfferComplete}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
        
        <SuccessPopup 
          isVisible={showPopup}
          onClose={handleClosePopup}
          message={popupMessage}
        />
        
        
        
        <div className="fixed bottom-2 right-2 text-xs text-gray-500">
          {APP_VERSION}
        </div>
      </div>
    </LoginWrapper>
  );
}

export default App;