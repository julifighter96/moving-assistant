/* eslint-disable no-unused-vars */
import React, { useState, useCallback, useEffect  } from 'react';
import DealViewer from './components/DealViewer';
import MoveInformationComponent from './components/MoveInformationComponent';
import RoomSelector from './components/RoomSelector';
import RoomItemsSelector from './components/RoomItemsSelector';
import AdditionalInfoComponent from './components/AdditionalInfoComponent';
import OfferComponent from './components/OfferComponent';
import SuccessPopup from '../shared//components/SuccessPopup';
import logo from '../shared/assets/images/Riedlin-Logo-512px_Neu.webp';
import AIAnalysisTab from './components/AIAnalysisTab';
import DailyRoutePlanner from './components/DailyRoutePlanner';
import { adminService } from './services/adminService';
import AdminPanel from './components/AdminPanel';
import InspectionOverview from './components/InspectionOverview';
import MovingTruckSimulator, { TRUCK_DIMENSIONS, autoPackItems } from './components/MovingTruckSimulator';
import { useAuth } from '../../context/AuthContext';
import TabletHeader from '../shared/components/TabletHeader';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

// Simple icon components
const IconWrapper = ({ children, className = "" }) => (
  <div className={`w-5 h-5 ${className}`}>{children}</div>
);

const Home = () => <IconWrapper>🏠</IconWrapper>;
const ClipboardList = () => <IconWrapper>📋</IconWrapper>;
const Settings = () => <IconWrapper>⚙️</IconWrapper>;
const Check = () => <IconWrapper>✓</IconWrapper>;
const Plus = () => <IconWrapper>+</IconWrapper>;
const MapPin = () => <IconWrapper>📍</IconWrapper>;

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

const InspectionModule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [moveInfo, setMoveInfo] = useState(null);
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [dealData, setDealData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(INITIAL_ROOMS[0]);
  const [roomsData, setRoomsData] = useState(() => {
    const initialRoomsData = {};
    INITIAL_ROOMS.forEach(room => {
      initialRoomsData[room] = {
        items: [],
        packMaterials: DEFAULT_PACK_MATERIALS.map(material => ({ ...material })),
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
  const handleStartInspection = (dealId, data) => {
    console.log('Starting inspection with:', { dealId, data });
    setSelectedDealId(dealId?.toString());
    setDealData(data);
    setCurrentStep(1);
  };

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

  const handleRoomChange = useCallback((roomName) => {
    setCurrentRoom(roomName);
    setRoomsData(prev => ({
      ...prev,
      [roomName]: prev[roomName] || {
        items: [],
        packMaterials: DEFAULT_PACK_MATERIALS.map(material => ({ ...material })),
        photos: [],
        totalVolume: 0,
        estimatedWeight: 0,
        notes: ''
      }
    }));
  }, []);

  const handleUpdateRoomData = useCallback((updatedRoomData) => {
    setRoomsData(prevData => ({
      ...prevData,
      [updatedRoomData.roomName]: {
        ...prevData[updatedRoomData.roomName],
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

  const [items, setItems] = useState([]);

  // Add effect to initialize items when step 5 is reached
  useEffect(() => {
    if (currentStep === 5) {
      const initialItems = Object.entries(roomsData).flatMap(([roomName, roomData]) => 
        roomData.items
          .filter(item => item.quantity > 0)
          .flatMap(item => Array(item.quantity).fill().map((_, i) => {
            const volume = parseFloat(item.volume) || 1;
            const estimatedDimensions = [
              Math.cbrt(volume) * 1.5,
              Math.cbrt(volume) * 0.8,
              Math.cbrt(volume) * 1.2
            ];
            const row = Math.floor(i / 3);
            const col = i % 3;
            
            return {
              id: `${roomName}-${item.name}-${i}`,
              name: `${item.name} (${roomName})`,
              position: [
                -TRUCK_DIMENSIONS.width/3 + col * (TRUCK_DIMENSIONS.width/3),
                estimatedDimensions[1]/2,
                -TRUCK_DIMENSIONS.length/2 + 1 + row * 2
              ],
              size: estimatedDimensions,
              color: '#' + Math.floor(Math.random()*16777215).toString(16)
            };
          }))
      );
      setItems(initialItems);
    }
  }, [currentStep, roomsData]);


  const handleAutoPack = () => {
    const packed = autoPackItems(items, TRUCK_DIMENSIONS);
    setItems(packed);
  };

  const getInitialItemPositions = (roomsData) => {
    const items = Object.entries(roomsData).flatMap(([roomName, roomData]) => 
      roomData.items
        .filter(item => item.quantity > 0)
        .flatMap(item => Array(item.quantity).fill().map((_, i) => ({
          id: `${roomName}-${item.name}-${i}`,
          name: `${item.name} (${roomName})`,
          position: [0, 0.4, 0],
          size: [
            item.width / 100,   // Convert width to meters
            item.height / 100,  // Convert height to meters
            item.length / 100   // Convert length to meters
          ],
          color: '#' + Math.floor(Math.random()*16777215).toString(16)
        })))
    );
  
    return items.map((item, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      return {
        ...item,
        position: [
          -TRUCK_DIMENSIONS.width/3 + col * (TRUCK_DIMENSIONS.width/3),
          item.size[1]/2,  // Using the converted height
          -TRUCK_DIMENSIONS.length/2 + 1 + row * 2
        ]
      };
    });
  };

useEffect(() => {
  if (currentStep === 5) {
    setItems(getInitialItemPositions(roomsData));
  }
}, [currentStep, roomsData]);

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

  useEffect(() => {
    console.log('InspectionModule - Mount', {
      isAuthenticated,
      currentStep,
      hasSelectedDeal: !!selectedDealId
    });
  }, []);

  useEffect(() => {
    console.log('InspectionModule - Auth Status Change:', { isAuthenticated });
  }, [isAuthenticated]);

  useEffect(() => {
    console.log('InspectionModule - Step Change:', { 
      currentStep,
      isAuthenticated 
    });
  }, [currentStep]);

  // Effekt zum Synchronisieren von Route und currentStep
  useEffect(() => {
    console.log('Route changed:', location.pathname);
    if (location.pathname.includes('/module/deals')) {
      setCurrentStep(0);
    } else if (location.pathname.includes('/module/admin')) {
      setCurrentStep('admin');
    }
  }, [location.pathname]);

  // Navigation Handler
  const handleNavigate = (path) => {
    console.log('Navigation requested to:', path);
    
    switch (path) {
      case '/moving-assistant':
        console.log('Attempting to navigate to portal...');
        try {
          navigate('/', { replace: true });
          console.log('Navigation to portal completed');
        } catch (error) {
          console.error('Error navigating to portal:', error);
        }
        break;
        
      case '/inspections':
        console.log('Attempting to navigate to inspections overview...');
        try {
          navigate('/inspections', { replace: true });
          console.log('Navigation to inspections completed');
        } catch (error) {
          console.error('Error navigating to inspections:', error);
        }
        break;
        
      case '/inspections/route':
        console.log('Attempting to navigate to route planner...');
        try {
          navigate('/inspections/route-planner', { replace: true });
          console.log('Navigation to route planner completed');
        } catch (error) {
          console.error('Error navigating to route planner:', error);
        }
        break;
        
      default:
        console.log('Default navigation to:', path);
        try {
          navigate(path, { replace: true });
          console.log('Default navigation completed');
        } catch (error) {
          console.error('Error in default navigation:', error);
        }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src={logo} alt="Logo" className="h-10 w-auto mr-4" />
              <h1 className="text-2xl font-bold">Umzugsbesichtigung</h1>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/inspections/module/deals', { replace: true })}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Besichtigung
              </button>
              <button
                onClick={() => handleNavigate('/inspections/route')}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Routenplanung
              </button>
              <button
                onClick={() => {
                  // Route aktualisieren und zum Admin-Bereich wechseln
                  navigate('/inspections/module/admin', { replace: true });
                  setCurrentStep('admin');
                }}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
              >
                Administration
              </button>
              <button
                onClick={() => {
                  console.log('Portal button clicked');
                  handleNavigate('/moving-assistant');
                }}
                className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                Zurück zum Portal
              </button>
            </div>
          </div>
          <div className="text-xs text-gray-500 text-right">
            Version {APP_VERSION}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {currentStep === 'admin' ? (
          <AdminPanel 
            onBack={() => {
              // Zurück zu den Deals navigieren
              navigate('/inspections/module/deals', { replace: true });
              setCurrentStep(0);
            }} 
          />
        ) : (
          <div>
            <StepNavigation 
              currentStep={currentStep} 
              totalSteps={STEPS.length - 1}
              onStepChange={handleStepChange}
            />
            
            <div className="mt-8">
              {currentStep === 0 && (
                <DealViewer onStartInspection={handleStartInspection} />
              )}
              {currentStep === 1 && (
                <MoveInformationComponent
                  dealId={selectedDealId}
                  dealData={dealData}
                  onComplete={handleMoveInfoComplete}
                />
              )}
              {currentStep === 2 && (
                <div className="grid grid-cols-4 gap-6">
                  <div className="col-span-1">
                    <RoomSelector
                      rooms={rooms}
                      currentRoom={currentRoom}
                      onRoomChange={handleRoomChange}
                      onAddRoom={handleAddRoom}
                    />
                  </div>
                  <div className="col-span-3">
                    <RoomItemsSelector
                      roomData={roomsData[currentRoom] || {
                        items: [],
                        packMaterials: DEFAULT_PACK_MATERIALS.map(material => ({ ...material })),
                        photos: [],
                        totalVolume: 0,
                        estimatedWeight: 0,
                        notes: ''
                      }}
                      onUpdateRoom={(data) => handleUpdateRoomData(data)}
                      onAddItem={handleAddItem}
                    />
                  </div>
                </div>
              )}
              {currentStep === 3 && (
                <AdditionalInfoComponent
                  onComplete={handleAdditionalInfoComplete}
                />
              )}
              {currentStep === 4 && (
                <OfferComponent
                  moveInfo={moveInfo}
                  roomsData={roomsData}
                  additionalInfo={additionalInfo}
                  dealId={selectedDealId}
                  volumeReductions={{}}
                  onVolumeReductionChange={(name, value) => {
                    // Handle volume reductions if needed
                  }}
                  onComplete={handleOfferComplete}
                  setCurrentStep={setCurrentStep}
                />
              )}
              {currentStep === 5 && (
                <MovingTruckSimulator
                  items={items}
                  onAutoPack={handleAutoPack}
                  onFinish={handleFinish}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {showPopup && (
        <SuccessPopup 
          message={popupMessage} 
          onClose={handleClosePopup}
        />
      )}
    </div>
  );
};

export default InspectionModule;