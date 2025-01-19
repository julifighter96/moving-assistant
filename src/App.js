import React, { useState, useCallback, useEffect  } from 'react';
import { Home, ClipboardList, Settings, Check, Plus, MapPin } from 'lucide-react';
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
import AIAnalysisTab from './components/AIAnalysisTab';
import DailyRoutePlanner from './components/DailyRoutePlanner';
import { adminService } from './services/adminService';
import AdminPanel from './components/AdminPanel';
import InspectionOverview from './components/InspectionOverview';
import MovingTruckSimulator, { TRUCK_DIMENSIONS, autoPackItems } from './components/MovingTruckSimulator';

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
  { label: 'Angebot erstellen', status: 'pending' },
  { label: 'Beladungssimulation', status: 'pending' },
  { label: 'Administration', status: 'pending', id: 'admin' }
];

const TabletHeader = ({ currentDeal,onAdminClick , onHomeClick, onInspectionsClick, onRouteClick  }) => {
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
          {/* Separate Buttons statt map */}
          <button 
            type="button"
            onClick={() => onHomeClick && onHomeClick()}
            className="h-12 px-4 flex items-center justify-center rounded-lg hover:bg-neutral-100 active:bg-neutral-200"
          >
            <Home className="h-6 w-6" />
            <span className="ml-2 text-base">Home</span>
          </button>

          <button 
            type="button"
            onClick = {() => onInspectionsClick && onInspectionsClick()}
            className="h-12 px-4 flex items-center justify-center rounded-lg hover:bg-neutral-100 active:bg-neutral-200"
          >
            <ClipboardList className="h-6 w-6" />

            <span className="ml-2 text-base">Inspektionen</span>
          </button>

          <button 
            type="button"
            className="h-12 px-4 flex items-center justify-center rounded-lg hover:bg-neutral-100 active:bg-neutral-200"
          >
            <Settings className="h-6 w-6" />
            <span className="ml-2 text-base">Settings</span>
          </button>
          <button 
            onClick={onRouteClick}
            className="h-12 px-4 flex items-center justify-center rounded-lg hover:bg-neutral-100 active:bg-neutral-200"
          >
            <MapPin className="h-6 w-6" />
            <span className="ml-2 text-base">Routen</span>
          </button>

          <button 
            type="button"
            onClick={() => onAdminClick && onAdminClick()}
            className="h-12 px-4 flex items-center justify-center rounded-lg hover:bg-neutral-100 active:bg-neutral-200"
          >
            <Settings className="h-6 w-6" />
            <span className="ml-2">Admin</span>
          </button>
        </nav>
      </div>
    </header>
  );
};



const calculateDimensions = (volume) => {
  // This is a simple estimation - adjust based on your needs
  const ratio = Math.cbrt(volume);
  return [
    ratio * 1.5, // width - typically wider
    ratio * 0.8, // height - typically shorter
    ratio * 1.2  // length - typically longer
  ];
};



// Helper function to get random colors for items
const getRandomColor = () => {
  const colors = [
    '#f87171', '#fb923c', '#fbbf24', '#a3e635', 
    '#22d3ee', '#818cf8', '#2dd4bf', '#4ade80'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
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
          {currentStep === 5 && "Beladungssimulation"}
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
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(INITIAL_ROOMS[0]);
  // Neuer State für Tab-Verwaltung
  const [roomsData, setRoomsData] = useState(() => {
    const initialRoomsData = {};
    rooms.forEach(room => {
      initialRoomsData[room] = {
        items: [],
        packMaterials: DEFAULT_PACK_MATERIALS,
        photos: [],
        totalVolume: 0,
        estimatedWeight: 0,
        notes: ''
      };
    });
    return initialRoomsData;
  });
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('standard');
  
  const [items, setItems] = useState([]);
  const [volumeReductions, setVolumeReductions] = useState({});
  
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        const configuredRooms = await adminService.getRooms();
  
        if (!Array.isArray(configuredRooms) || configuredRooms.length === 0) {
          console.warn('No rooms received, using default rooms');
          setRooms(INITIAL_ROOMS);
          return;
        }
  
        setRooms(configuredRooms.map(room => room.name));
        
        const initialRoomsData = {};
        
        for (const room of configuredRooms) {
          try {
            const items = await adminService.getItems(room.name);
  
            initialRoomsData[room.name] = {
              items: items.length > 0 ? items.map(item => ({
                ...item,
                quantity: 0,
                demontiert: false,
                duebelarbeiten: false
              })) : [],
              packMaterials: DEFAULT_PACK_MATERIALS,
              photos: [],
              totalVolume: 0,
              estimatedWeight: 0,
              notes: ''
            };
          } catch (error) {
            console.error(`Failed to load items for room ${room.name}:`, error);
            // Fallback to default items if available
            initialRoomsData[room.name] = {
              items: DEFAULT_ROOM_INVENTORY[room.name] || [],
              packMaterials: DEFAULT_PACK_MATERIALS,
              photos: [],
              totalVolume: 0,
              estimatedWeight: 0,
              notes: ''
            };
          }
        }
  
        setRoomsData(initialRoomsData);
  
        if (configuredRooms.length > 0) {
          setCurrentRoom(configuredRooms[0].name);
        }
      } catch (error) {
        console.error('Error in loadConfiguration:', error);
      }
    };
  
    loadConfiguration();
  }, []);

  const [additionalInfo, setAdditionalInfo] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  const handleRouteClick = () => {
    setCurrentStep('route-planner');
  };
  const handleStartInspection = useCallback((deal) => {
    setSelectedDealId(deal.id);
    setDealData(deal);
    setCurrentStep(1);
  }, []);

  const calculateTotalVolume = (roomData) => {
    return roomData.items.reduce((itemSum, item) => {
      const itemVolume = (item.length * item.width * item.height * item.quantity) / 1000000;
      return itemSum + itemVolume;
    }, 0);
  };

  const resetToStart = useCallback(async () => {
    setCurrentStep(0);
    setMoveInfo(null);
    setSelectedDealId(null);
    setDealData(null);
    
    try {
      const configuredRooms = await adminService.getRooms();
      const roomNames = configuredRooms.map(room => room.name);
      setRooms(roomNames);
      setCurrentRoom(roomNames[0]);

      const initialRoomsData = {};
      for (const room of configuredRooms) {
        try {
          const items = await adminService.getItems(room.name);
          initialRoomsData[room.name] = {
            items: items.map(item => ({
              ...item,
              quantity: 0,
              demontiert: false,
              duebelarbeiten: false
            })),
            packMaterials: DEFAULT_PACK_MATERIALS,
            totalVolume: 0,
            estimatedWeight: 0,
            notes: ''
          };
        } catch (error) {
          console.error(`Failed to load items for room ${room.name}:`, error);
          initialRoomsData[room.name] = {
            items: DEFAULT_ROOM_INVENTORY[room.name] || [],
            packMaterials: DEFAULT_PACK_MATERIALS,
            totalVolume: 0,
            estimatedWeight: 0,
            notes: ''
          };
        }
      }
      setRoomsData(initialRoomsData);
    } catch (error) {
      console.error('Error resetting to start:', error);
      // Fallback zu Default-Werten
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
    }
    
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
        notes: ''
      }
    }));
    setCurrentRoom(newRoom);
  }, []);

  // Handler für Volumenreduktionen
  const handleVolumeReductionChange = useCallback((itemName, value) => {
    console.log('Volumenreduktion geändert:', { itemName, value });
    setVolumeReductions(prev => {
      const newReductions = {
        ...prev,
        [itemName]: value
      };
      console.log('Neue volumeReductions:', newReductions);
      return newReductions;
    });
  }, []);

  // Funktion zum Erstellen der Items mit aktuellen volumeReductions
  const createItems = useCallback((roomsData, reductions) => {
    console.log('Creating items with dimensions:');
    
    const items = Object.entries(roomsData).flatMap(([roomName, roomData]) => 
      roomData.items
        .filter(item => item.quantity > 0)
        .flatMap(item => Array(item.quantity).fill().map((_, i) => {
          // Berechne zuerst das Volumen in m³
          const width = item.width / 100;   // cm zu m
          const height = item.height / 100;  // cm zu m
          const length = item.length / 100;  // cm zu m
          
          // Berechne den Reduktionsfaktor für die Kubikwurzel des Volumens
          const reductionFactor = reductions[item.name] || 1;
          const volumeReductionFactor = Math.cbrt(reductionFactor); // Kubikwurzel, da Volumen = Länge * Breite * Höhe

          // Reduziere jede Dimension mit der Kubikwurzel des Reduktionsfaktors
          const reducedWidth = width * volumeReductionFactor;
          const reducedHeight = height * volumeReductionFactor;
          const reducedLength = length * volumeReductionFactor;

          console.log('Item dimensions:', {
            name: item.name,
            originalCm: { width: item.width, height: item.height, length: item.length },
            originalVolume: (width * height * length),
            reductionFactor,
            reducedVolume: (reducedWidth * reducedHeight * reducedLength)
          });

          const row = Math.floor(i / 3);
          const col = i % 3;
          
          return {
            id: `${roomName}-${item.name}-${i}`,
            name: `${item.name} (${roomName})`,
            position: [
              -TRUCK_DIMENSIONS.width/3 + col * (TRUCK_DIMENSIONS.width/3),
              reducedHeight/2,
              -TRUCK_DIMENSIONS.length/2 + 1 + row * 2
            ],
            size: [reducedWidth, reducedHeight, reducedLength],
            color: '#' + Math.floor(Math.random()*16777215).toString(16)
          };
        }))
    );

    return items;
  }, []);

  // Effect für Updates wenn sich roomsData oder volumeReductions ändern
  useEffect(() => {
    if (currentStep === 5) {
      console.log('Step 5 erreicht, aktualisiere Items mit:', {
        roomsData,
        volumeReductions
      });
      setItems(createItems(roomsData, volumeReductions));
    }
  }, [currentStep, roomsData, volumeReductions, createItems]);

  const handleAutoPack = () => {
    console.log('Starting auto-pack with items:', items);
    const packed = autoPackItems(items, TRUCK_DIMENSIONS);
    console.log('Packed items:', packed);
    
    if (packed.length < items.length) {
      console.warn('Not all items could be placed:', {
        total: items.length,
        placed: packed.length
      });
    }

    setItems(packed); // Keine weitere Transformation nötig
  };

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
    if (typeof newStep === 'number' && newStep >= 0 && newStep < STEPS.length - 1) {
      setCurrentStep(newStep);
    } else if (newStep === 'admin') {
      setCurrentStep('admin');
    }
  };

  const handleFinish = () => {
    setTimeout(() => {
      resetToStart();
    }, 3000);
  };

  return (
    <LoginWrapper>
    <div className="min-h-screen bg-neutral-50">
      <TabletHeader currentDeal={dealData} 
      onAdminClick={() => setCurrentStep('admin')}
      onHomeClick={() => setCurrentStep(0)}
      onInspectionsClick={() => setCurrentStep('inspections')}
      onRouteClick={handleRouteClick}  
       />
      <main className="pt-20 px-6 pb-6">
        <div className="max-w-none mx-auto">
          {/* Step Progress */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
  <div className="flex justify-between">
    {STEPS.filter(step => step.id !== 'admin').map((step, index) => {
      const isCompleted = typeof currentStep === 'number' && index < currentStep;
      const isCurrent = currentStep === step.id;
                
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
    disabled={currentStep === 0 || currentStep === 'admin'}
    className="h-12 px-6 bg-primary text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed text-lg flex items-center justify-center min-w-[120px]"
  >
    Zurück
  </button>
  <div className="flex flex-col items-center">
    <span className="text-lg font-medium">
      {currentStep === 'admin' ? 'Administration' : `Schritt ${currentStep + 1} von ${STEPS.length - 1}`}
    </span>
    <span className="text-sm text-gray-500">
      {STEPS.find(step => step.id === currentStep)?.label}
    </span>
  </div>
  <button 
  onClick={() => handleStepChange(currentStep + 1)} 
  disabled={currentStep === STEPS.length - 2 || currentStep === 'admin' || currentStep === 4 || currentStep === 5}
  className={`h-12 px-6 bg-primary text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed text-lg flex items-center justify-center min-w-[120px] ${
    currentStep === 4 || currentStep === 5 ? 'hidden' : ''
  }`}
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
    {/* Left Sidebar */}
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
        
        <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium mb-2">Zusammenfassung</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Gesamtvolumen:</span>
            <span className="font-medium">
              {Object.values(roomsData || {}).reduce((sum, room) => {
                return sum + calculateTotalVolume(room);
              }, 0).toFixed(2)} m³
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
    
    {/* Main Content Area */}
    <div className="col-span-8">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between p-6">
            <div>
              <h2 className="text-xl font-semibold">{currentRoom}</h2>
              <p className="text-gray-500 mt-1">Inventar und Fotos für diesen Raum</p>
            </div>
          </div>
          <div className="px-6">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('standard')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'standard'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center ${
                  activeTab === 'ai'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                KI-Analyse
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  Beta
                </span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {activeTab === 'standard' ? (
            <RoomItemsSelector
              key={`${currentRoom}-standard`}
              roomName={currentRoom}
              onUpdateRoom={handleUpdateRoomData}
              initialData={roomsData[currentRoom]}
              onAddItem={handleAddItem}
            />
          ) : (
            <AIAnalysisTab
              key={`${currentRoom}-ai`}
              roomName={currentRoom}
              onAnalysisComplete={(analysisData) => {
                handleUpdateRoomData(currentRoom, {
                  items: analysisData.items.map(item => ({
                    name: item.name,
                    quantity: 1,
                    // Convert cm to m for internal storage
                    width: Math.round(item.width) ,
                    height: Math.round(item.height) ,
                    length: Math.round(item.length) ,
                    volume: (item.length * item.width * item.height), // cm³ to m³
                    demontiert: false,
                    duebelarbeiten: false,
                    description: item.description
                  })),
                  totalVolume: analysisData.totalVolume,
                  estimatedWeight: analysisData.totalVolume * 200,
                  analysisNotes: analysisData.description
                });
                              
                setActiveTab('standard');
                setShowPopup(true);
                setPopupMessage('KI-Analyse erfolgreich abgeschlossen!');
              }}
            />
          )}
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
                        setCurrentStep={setCurrentStep}
                        volumeReductions={volumeReductions}
                        onVolumeReductionChange={handleVolumeReductionChange}
                    />
                  </div>
                </div>
              )}
{currentStep === 5 && (
  <div className="bg-white rounded-lg shadow-sm">
    <div className="p-6 border-b border-gray-200">
      <h2 className="text-xl font-semibold">3D Beladungssimulation</h2>
      <p className="text-gray-500 mt-1">
        Planen Sie die optimale Beladung des Umzugswagens
      </p>
    </div>
    <div className="p-6">
      
      <div className="h-[calc(100vh-250px)]">
        <MovingTruckSimulator items={items} 
      setItems={setItems}/>
      </div>
    </div>
  </div>
)}
              {currentStep === 'admin' && (
  <div className="bg-white rounded-lg shadow-sm">
    <div className="p-6 border-b border-gray-200">
      <h2 className="text-xl font-semibold">Administration</h2>
      <p className="text-gray-500 mt-1">Verwalten Sie Räume und Gegenstände</p>
    </div>
    <div className="p-6">
      <AdminPanel 
        currentStep={currentStep}
        onUpdateRooms={setRooms} 
        onUpdateItems={(items) => setRoomsData(prev => ({
          ...prev,
          [currentRoom]: {
            ...prev[currentRoom],
            items
          }
        }))}
      />
    </div>
  </div>
)}

{currentStep === 'route-planner' && <DailyRoutePlanner />}



<button 
  type="button"
  onClick={() => handleRouteClick && handleRouteClick()}
  className="h-12 px-4 flex items-center justify-center rounded-lg hover:bg-neutral-100 active:bg-neutral-200"
>
 
</button>

{currentStep === 'inspections' && (
  <InspectionOverview />
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