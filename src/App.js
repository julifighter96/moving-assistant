import React, { useState, useCallback, useEffect  } from 'react';
import { Home, ClipboardList, Settings, Check, Plus, MapPin, LogOut, Users } from 'lucide-react';
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
import { AuthProvider, useAuth } from './context/AuthContext';
import MovingCalculation from './components/MovingCalculation';
import TourPlanner from './components/TourPlanner';
import RouteNavigation from './components/RouteNavigation';
import EmployeeScheduling from './pages/EmployeeScheduling';
import OfflineIndicator from './components/OfflineIndicator';
import { offlineStorage } from './services/offlineStorage';
import { syncService } from './services/syncService';
import { apiWrapper } from './services/apiWrapper';
import CustomerInventoryEditor from './components/CustomerInventoryEditor';
import ShareLinkButton from './components/ShareLinkButton';

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
  { id: 0, label: 'Wählen Sie einen Deal zum Start', path: '/deal-selection' },
  { id: 1, label: 'Grundlegende Umzugsinformationen', path: '/move-information' },
  { id: 2, label: 'Räume und Inventar', path: '/rooms-and-items' },
  { id: 3, label: 'Zusätzliche Details', path: '/additional-details' },
  { id: 4, label: 'Umzugsberechnung', path: '/calculation' },
  { id: 5, label: 'Angebot erstellen', path: '/offer-creation' },
  { id: 6, label: 'Beladungssimulation', path: '/loading-simulation' },
  { id: 'tour-planner', label: 'Tourenplanung', path: '/tour-planner' },
  { id: 'admin', label: 'Admin', path: '/admin' }
];

const TabletHeader = ({ currentDeal, onAdminClick, onHomeClick, onInspectionsClick, onRouteClick, onEmployeeClick }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-neutral-200 h-16 fixed top-0 left-0 right-0 z-50">
      <div className="h-full flex items-center justify-between px-6">
        <div className="flex items-center">
          <img 
            src={logo}
            alt="Riedlin Logo" 
            className="h-16 w-auto"
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
          <button 
            type="button"
            onClick={() => onHomeClick && onHomeClick()}
            className="h-12 px-4 flex items-center justify-center rounded-lg hover:bg-neutral-100 active:bg-neutral-200"
          >
            <Home className="h-6 w-6" />
            <span className="ml-2 text-base">Home</span>
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
            onClick={() => onEmployeeClick && onEmployeeClick()}
            className="h-12 px-4 flex items-center justify-center rounded-lg hover:bg-neutral-100 active:bg-neutral-200"
          >
            <Users className="h-6 w-6" />
            <span className="ml-2">Personal</span>
          </button>

          {user?.role === 'admin' && (
            <button 
              type="button"
              onClick={() => onAdminClick && onAdminClick()}
              className="h-12 px-4 flex items-center justify-center rounded-lg hover:bg-neutral-100 active:bg-neutral-200"
            >
              <Settings className="h-6 w-6" />
              <span className="ml-2">Admin</span>
            </button>
          )}

          {user && (
            <button 
              type="button"
              onClick={logout}
              className="h-12 px-4 flex items-center justify-center rounded-lg hover:bg-neutral-100 active:bg-neutral-200 text-red-600"
            >
              <LogOut className="h-6 w-6" />
              <span className="ml-2">Abmelden</span>
            </button>
          )}
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
          {currentStep === 4 && "Umzugsberechnung"}
          {currentStep === 5 && "Angebot erstellen"}
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

// Main App Component (without customer view check)
function AppContent() {
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
  
  const { user } = useAuth();

  const [calculationData, setCalculationData] = useState({
    totalVolume: 0,
    packingTime: 0,
    unpackingTime: 0,
    totalDuration: 0
  });

  // Füge einen State für die Preise hinzu
  const [prices, setPrices] = useState([]);

  // Lade die Preise beim Initialisieren der App
  useEffect(() => {
    const loadPrices = async () => {
      try {
        const loadedPrices = await adminService.getPrices();
        setPrices(loadedPrices);
      } catch (err) {
        console.error('Error loading prices:', err);
      }
    };
    loadPrices();
  }, []);

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
        
        // Load items for each room sequentially to avoid race conditions
        for (const room of configuredRooms) {
          try {
            console.log(`🔄 Loading items for room: "${room.name}"`);
            const items = await adminService.getItems(room.name);
            console.log(`✅ Loaded ${items.length} items for room: ${room.name}`, items.map(i => `${i.name} (room: ${i.room})`));
  
            // Verify items belong to correct room
            const itemsForThisRoom = items.filter(item => item.room === room.name);
            if (itemsForThisRoom.length !== items.length) {
              console.error(`⚠️ WARNING: Room "${room.name}" has ${items.length} items, but only ${itemsForThisRoom.length} belong to this room!`);
              console.error('Items with wrong room:', items.filter(item => item.room !== room.name));
            }
  
            // Create a deep copy of items array to avoid reference issues
            const roomItems = itemsForThisRoom.length > 0 ? itemsForThisRoom.map(item => ({
              id: item.id,
              name: item.name,
              width: item.width,
              length: item.length,
              height: item.height,
              volume: item.volume,
              room: item.room,
              weight: item.weight || 0,
              setupTime: item.setupTime || 0,
              dismantleTime: item.dismantleTime || 0,
              quantity: 0,
              demontiert: false,
              duebelarbeiten: false,
              remontiert: false,
              elektro: false
            })) : [];
            
            // Create a deep copy of pack materials array
            const roomPackMaterials = DEFAULT_PACK_MATERIALS.map(material => ({ ...material }));
            
            console.log(`💾 Storing ${roomItems.length} items for room "${room.name}":`, roomItems.map(i => `${i.name} (id: ${i.id})`));
            
            initialRoomsData[room.name] = {
              items: roomItems,
              packMaterials: roomPackMaterials,
              photos: [],
              totalVolume: 0,
              estimatedWeight: 0,
              notes: ''
            };
          } catch (error) {
            console.error(`❌ Failed to load items for room ${room.name}:`, error);
            // Fallback to default items if available
            initialRoomsData[room.name] = {
              items: (DEFAULT_ROOM_INVENTORY[room.name] || []).map(item => ({ ...item })),
              packMaterials: DEFAULT_PACK_MATERIALS.map(material => ({ ...material })),
              photos: [],
              totalVolume: 0,
              estimatedWeight: 0,
              notes: ''
            };
          }
        }
        
        console.log('📦 Initial roomsData structure:', Object.keys(initialRoomsData).map(room => ({
          room,
          itemCount: initialRoomsData[room].items.length,
          itemNames: initialRoomsData[room].items.map(i => i.name),
          itemIds: initialRoomsData[room].items.map(i => `${i.name}-${i.id}`)
        })));
        
        // Verify that each room has unique items
        const allItemNames = {};
        Object.keys(initialRoomsData).forEach(room => {
          initialRoomsData[room].items.forEach(item => {
            const key = `${item.name}-${item.id}`;
            if (!allItemNames[key]) {
              allItemNames[key] = [];
            }
            allItemNames[key].push(room);
          });
        });
        
        const duplicateItems = Object.keys(allItemNames).filter(key => allItemNames[key].length > 1);
        if (duplicateItems.length > 0) {
          console.error('⚠️ WARNING: Found items that appear in multiple rooms:', duplicateItems);
          duplicateItems.forEach(key => {
            console.error(`  - ${key} appears in rooms: ${allItemNames[key].join(', ')}`);
          });
        } else {
          console.log('✅ All rooms have unique items - no duplicates found');
        }
  
        // Only set roomsData if we don't have a selectedDealId (to avoid overwriting saved state)
        if (!selectedDealId) {
          console.log('💾 Setting initial roomsData (no deal selected)');
          setRoomsData(initialRoomsData);
        } else {
          console.log('⏸️ Skipping setRoomsData - deal selected, will load from saved state');
        }
  
        if (configuredRooms.length > 0) {
          setCurrentRoom(configuredRooms[0].name);
        }
      } catch (error) {
        console.error('Error in loadConfiguration:', error);
      }
    };
  
    loadConfiguration();
  }, [selectedDealId]);

  const [additionalInfo, setAdditionalInfo] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  // Offline-Support: Initialisiere Sync-Service und lade gespeicherten Zustand
  useEffect(() => {
    // Starte Auto-Sync
    syncService.startAutoSync(30000); // Alle 30 Sekunden

    // Lade gespeicherten Zustand wenn Deal ausgewählt
    const loadSavedState = async () => {
      if (selectedDealId) {
        try {
          const savedState = await offlineStorage.loadInspectionState(selectedDealId);
          if (savedState) {
            console.log('✅ Gespeicherter Zustand geladen für Deal:', selectedDealId);
            console.log('📦 Saved roomsData:', Object.keys(savedState.roomsData || {}).map(room => ({
              room,
              itemCount: savedState.roomsData[room]?.items?.length || 0,
              itemNames: savedState.roomsData[room]?.items?.map(i => i.name) || []
            })));
            
            // Stelle gespeicherten Zustand wieder her
            if (savedState.roomsData) {
              // First, load the correct items for each room from the database
              const configuredRooms = await adminService.getRooms();
              const correctItemsByRoom = {};
              
              for (const room of configuredRooms) {
                try {
                  const items = await adminService.getItems(room.name);
                  correctItemsByRoom[room.name] = items.map(item => ({
                    id: item.id,
                    name: item.name,
                    width: item.width,
                    length: item.length,
                    height: item.height,
                    volume: item.volume,
                    room: item.room,
                    weight: item.weight || 0,
                    setupTime: item.setupTime || 0,
                    dismantleTime: item.dismantleTime || 0
                  }));
                  console.log(`🔄 Loaded ${correctItemsByRoom[room.name].length} correct items for room "${room.name}"`);
                } catch (error) {
                  console.error(`❌ Failed to load items for room ${room.name}:`, error);
                  correctItemsByRoom[room.name] = [];
                }
              }
              
              // Create deep copy and merge with saved quantities
              const restoredRoomsData = {};
              Object.keys(savedState.roomsData).forEach(roomName => {
                const savedRoomData = savedState.roomsData[roomName];
                const correctItems = correctItemsByRoom[roomName] || [];
                
                // Merge saved quantities with correct items
                const mergedItems = correctItems.map(correctItem => {
                  // Find matching saved item by name and id
                  const savedItem = savedRoomData.items?.find(
                    si => si.name === correctItem.name && si.id === correctItem.id
                  ) || savedRoomData.items?.find(si => si.name === correctItem.name);
                  
                  if (savedItem) {
                    // Use saved item data but keep correct item properties
                    return {
                      ...correctItem,
                      quantity: savedItem.quantity || 0,
                      demontiert: savedItem.demontiert || false,
                      duebelarbeiten: savedItem.duebelarbeiten || false,
                      remontiert: savedItem.remontiert || false,
                      elektro: savedItem.elektro || false
                    };
                  } else {
                    // New item, use defaults
                    return {
                      ...correctItem,
                      quantity: 0,
                      demontiert: false,
                      duebelarbeiten: false,
                      remontiert: false,
                      elektro: false
                    };
                  }
                });
                
                restoredRoomsData[roomName] = {
                  ...savedRoomData,
                  items: mergedItems,
                  packMaterials: savedRoomData.packMaterials ? savedRoomData.packMaterials.map(material => ({ ...material })) : [],
                  photos: savedRoomData.photos ? [...savedRoomData.photos] : []
                };
                
                console.log(`✅ Restored room "${roomName}" with ${mergedItems.length} items:`, mergedItems.map(i => i.name));
              });
              
              console.log('💾 Restored roomsData with correct items:', Object.keys(restoredRoomsData).map(room => ({
                room,
                itemCount: restoredRoomsData[room].items.length,
                itemNames: restoredRoomsData[room].items.map(i => i.name)
              })));
              
              setRoomsData(restoredRoomsData);
            }
            if (savedState.moveInfo) {
              setMoveInfo(savedState.moveInfo);
            }
            if (savedState.additionalInfo) {
              setAdditionalInfo(savedState.additionalInfo);
            }
            if (savedState.calculationData) {
              setCalculationData(savedState.calculationData);
            }
            if (savedState.currentStep !== undefined) {
              setCurrentStep(savedState.currentStep);
            }
          }
        } catch (error) {
          console.error('Fehler beim Laden des gespeicherten Zustands:', error);
        }
      }
    };

    loadSavedState();

    return () => {
      syncService.stopAutoSync();
    };
  }, [selectedDealId]);

  // Auto-Save: Speichere Zustand automatisch bei Änderungen
  useEffect(() => {
    if (!selectedDealId) return;

    // Debounce: Speichere nur alle 2 Sekunden
    const timeoutId = setTimeout(async () => {
      try {
        // Create deep copy of roomsData to avoid reference issues
        const roomsDataCopy = {};
        Object.keys(roomsData).forEach(roomName => {
          const roomData = roomsData[roomName];
          roomsDataCopy[roomName] = {
            ...roomData,
            items: roomData.items ? roomData.items.map(item => ({ ...item })) : [],
            packMaterials: roomData.packMaterials ? roomData.packMaterials.map(material => ({ ...material })) : [],
            photos: roomData.photos ? [...roomData.photos] : []
          };
        });
        
        const stateToSave = {
          roomsData: roomsDataCopy,
          moveInfo: moveInfo ? { ...moveInfo } : null,
          additionalInfo: additionalInfo ? { ...additionalInfo } : null,
          calculationData: calculationData ? { ...calculationData } : null,
          currentStep,
          selectedDealId,
          timestamp: new Date().toISOString()
        };
        
        await offlineStorage.saveInspectionState(selectedDealId, stateToSave);
        console.log('💾 Auto-Save: Zustand gespeichert (deep copy)');
      } catch (error) {
        console.error('Fehler beim Auto-Save:', error);
      }
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  }, [roomsData, moveInfo, additionalInfo, calculationData, currentStep, selectedDealId]);

  const handleRouteClick = () => {
    setCurrentStep('route-selection');
  };
  const handleStartInspection = useCallback((deal) => {
    setSelectedDealId(deal.id);
    setDealData(deal);
    setCurrentStep(1);
  }, []);

  // Aktualisiere die calculateTotalVolume-Funktion, um auch Packmaterialien zu berücksichtigen
  const calculateTotalVolume = useCallback((roomData) => {
    // Berechne das Volumen der Möbel/Gegenstände
    const itemsVolume = roomData.items.reduce((itemSum, item) => {
      const itemVolume = (item.length * item.width * item.height * item.quantity) / 1000000;
      return itemSum + itemVolume;
    }, 0);
    
    // Berechne das Volumen der Packmaterialien
    const packMaterialsVolume = roomData.packMaterials ? roomData.packMaterials.reduce((total, material) => {
      // Prüfe ob material ein Karton ist
      if (['Umzugskartons (Standard)', 'Bücherkartons (Bücher&Geschirr)', 'Kleiderkisten'].includes(material.name)) {
        const priceConfig = prices?.find(p => p.name === material.name);
        if (priceConfig?.length && priceConfig?.width && priceConfig?.height) {
          const materialVolume = (priceConfig.length * priceConfig.width * priceConfig.height) / 1000000;
          return total + materialVolume * material.quantity;
        }
      }
      return total;
    }, 0) : 0;
    
    // Gib die Summe zurück
    return itemsVolume + packMaterialsVolume;
  }, [prices]);

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
    setVolumeReductions(prev => {
      const newReductions = {
        ...prev,
        [itemName]: value
      };
      return newReductions;
    });
  }, []);

  // Funktion zum Erstellen der Items mit aktuellen volumeReductions
  const createItems = useCallback((roomsData, reductions) => {
    
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
      setItems(createItems(roomsData, volumeReductions));
    }
  }, [currentStep, roomsData, volumeReductions, createItems]);

  const handleAutoPack = () => {
    const packed = autoPackItems(items, TRUCK_DIMENSIONS); 
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
    if (newStep === 'admin' && user?.role !== 'admin') {
      // Prevent access to admin step for non-admin users
      return;
    }
    
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

  // Add this new function to collect all items from all rooms
  const getAllExistingItems = useCallback(() => {
    const allItems = [];
    Object.values(roomsData).forEach(roomData => {
      roomData.items.forEach(item => {
        if (!allItems.some(existingItem => existingItem.name === item.name)) {
          allItems.push(item);
        }
      });
    });
    return allItems;
  }, [roomsData]);

  // Navigation für den nächsten Schritt
  const goToNextStep = () => {
    setCurrentStep(prevStep => Math.min(7, prevStep + 1)); // Verhindert Überschreitung der max Schritte
  };

  // Verarbeite MovingCalculation-Daten
  const handleCalculationComplete = (calculationResult) => {
    console.log("📊 MovingCalculation-Daten erhalten:", calculationResult);
    console.log("📊 pipedriveUpdateData:", calculationResult.pipedriveUpdateData);
    setCalculationData(calculationResult);
    setCurrentStep(5); // Gehe zu Schritt 5 (Angebot erstellen)
  };

  // Navigation für den vorherigen Schritt
  const goToPreviousStep = () => {
    setCurrentStep(prevStep => Math.max(1, prevStep - 1));
  };

  return (
    <LoginWrapper>
    <div className="min-h-screen bg-neutral-50">
      <TabletHeader currentDeal={dealData} 
      onAdminClick={() => setCurrentStep('admin')}
      onHomeClick={() => setCurrentStep(0)}
      onInspectionsClick={() => setCurrentStep('inspections')}
      onRouteClick={handleRouteClick}
      onEmployeeClick={() => setCurrentStep('employee-scheduling')}  
       />
      <main className="pt-20 px-6 pb-6">
        <div className="max-w-none mx-auto">
          {/* Step Progress - nur anzeigen, wenn weder admin, route noch tour-planner aktiv ist */}
          {currentStep !== 'admin' && currentStep !== 'route-selection' && currentStep !== 'tour-planner' && currentStep !== 'employee-scheduling' && (
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
          )}

          {/* Back/Forward Controls - nur anzeigen, wenn weder admin, route noch tour-planner aktiv ist */}
          {currentStep !== 'admin' && currentStep !== 'route-selection' && currentStep !== 'tour-planner' && currentStep !== 'employee-scheduling' && (
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex justify-between items-center">
              <button
                onClick={() => handleStepChange(currentStep - 1)} 
                disabled={currentStep === 0}
                className="h-12 px-6 bg-primary text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed text-lg flex items-center justify-center min-w-[120px]"
              >
                Zurück
              </button>
              <div className="flex flex-col items-center">
                <span className="text-lg font-medium">
                  {currentStep === 4 ? 'Umzugsberechnung' :
                   currentStep === 5 ? 'Angebot erstellen' :
                   currentStep === 6 ? 'Beladungssimulation' :
                   `Schritt ${currentStep + 1} von ${STEPS.length - 1}`}
                </span>
                <span className="text-sm text-gray-500">
                  {currentStep === 4 ? 'Volumen und Zeitaufwand für den Umzug' :
                   currentStep === 5 ? 'Überprüfen und finalisieren Sie das Angebot' :
                   currentStep === 6 ? 'Planen Sie die optimale Beladung des Umzugswagens' :
                   STEPS.find(step => step.id === currentStep)?.label}
                </span>
              </div>
              <button
                onClick={goToNextStep}
                disabled={currentStep === STEPS.length - 2 || currentStep === 'admin'}
                className="h-12 px-6 bg-primary text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed text-lg flex items-center justify-center min-w-[120px]"
              >
                {currentStep === 3 ? 'Zur Berechnung' : 
                 currentStep === 4 ? 'Zum Angebot' : 
                 currentStep === 5 ? 'Zur Beladung' : 
                 currentStep === 6 ? 'Abschließen' : 'Weiter'}
              </button>
            </div>
          )}

          {/* Main Content Area */}
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

                      {/* Share Link Button */}
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <ShareLinkButton 
                          dealId={selectedDealId} 
                          onImportData={(importedRoomsData) => {
                            console.log('Importing roomsData:', importedRoomsData);
                            console.log('Current roomsData:', roomsData);
                            
                            // Replace existing data with imported data (not merge, to get customer changes)
                            setRoomsData(prevData => {
                              const updated = { ...prevData };
                              
                              // Update or add rooms from imported data
                              Object.keys(importedRoomsData).forEach(roomName => {
                                updated[roomName] = {
                                  ...importedRoomsData[roomName],
                                  // Preserve packMaterials if not in imported data
                                  packMaterials: importedRoomsData[roomName].packMaterials || prevData[roomName]?.packMaterials || [],
                                };
                              });
                              
                              console.log('Updated roomsData:', updated);
                              return updated;
                            });
                            
                            // Also save to server
                            if (selectedDealId) {
                              const stateToSave = {
                                roomsData: importedRoomsData,
                                moveInfo,
                                additionalInfo,
                                calculationData,
                                currentStep,
                                selectedDealId,
                                timestamp: new Date().toISOString()
                              };
                              
                              // Save locally
                              offlineStorage.saveInspectionState(selectedDealId, stateToSave).catch(err => {
                                console.error('Error saving imported data locally:', err);
                              });
                              
                              // Try to sync to server
                              apiWrapper.saveInspection(selectedDealId, stateToSave).catch(err => {
                                console.error('Error syncing imported data to server:', err);
                              });
                            }
                            
                            setShowPopup(true);
                            setPopupMessage('Kundendaten erfolgreich importiert!');
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Main Content Area */}
                  <div className="col-span-8">
                    <div className="flex justify-between items-center mb-6">
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
                    
                    <div className="p-6">
                      {activeTab === 'standard' ? (
                        <RoomItemsSelector
                          key={`${currentRoom}-standard`}
                          roomName={currentRoom}
                          onUpdateRoom={handleUpdateRoomData}
                          initialData={roomsData[currentRoom] || { items: [], packMaterials: [], notes: '', totalVolume: 0, estimatedWeight: 0 }}
                          onAddItem={handleAddItem}
                          allExistingItems={getAllExistingItems()}
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
              )}
              
              {currentStep === 3 && (
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold">Zusätzliche Details</h2>
                    <p className="text-gray-500 mt-1">Ergänzende Informationen zum Umzug</p>
                  </div>
                  <div className="p-6">
                    <AdditionalInfoComponent 
                      onComplete={handleAdditionalInfoComplete}
                      roomsData={roomsData}
                    />
                  </div>
                </div>
              )}
              
              {currentStep === 4 && (
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold">Umzugsberechnung</h2>
                    <p className="text-gray-500 mt-1">Volumen und Zeitaufwand für den Umzug</p>
                  </div>
                  <div className="p-6">
                    <MovingCalculation 
                      roomsData={roomsData}
                      additionalInfo={additionalInfo}
                      onComplete={handleCalculationComplete}
                    />
                  </div>
                </div>
              )}
{currentStep === 5 && (
  <div className="bg-white rounded-lg shadow-sm">
    <div className="p-6 border-b border-gray-200">
      <h2 className="text-xl font-semibold">Angebot erstellen</h2>
      <p className="text-gray-500 mt-1">Überprüfen und finalisieren Sie das Angebot</p>
    </div>
    <div className="p-6">
      <OfferComponent 
        inspectionData={{ 
          rooms: roomsData, 
          additionalInfo, 
          moveInfo,
          calculationData // Füge die berechneten Daten hinzu
        }}
        dealId={selectedDealId}
        onComplete={handleOfferComplete}
        setCurrentStep={setCurrentStep}
        volumeReductions={volumeReductions}
        onVolumeReductionChange={handleVolumeReductionChange}
      />
    </div>
  </div>
)}
{currentStep === 6 && (
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
              {currentStep === 'admin' && user?.role === 'admin' ? (
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
) : currentStep === 'admin' ? (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <div className="text-center">
      <h2 className="text-xl font-semibold text-red-600">Zugriff verweigert</h2>
      <p className="text-gray-500 mt-2">Sie haben keine Berechtigung, auf diesen Bereich zuzugreifen.</p>
    </div>
  </div>
) : null}

{currentStep === 'route-selection' && (
  <RouteNavigation 
    onSelect={(plannerType) => setCurrentStep(plannerType)} 
  />
)}

{currentStep === 'route-planner' && <DailyRoutePlanner />}

{currentStep === 'tour-planner' && (
  <div className="bg-white rounded-lg shadow-sm">
    <TourPlanner />
  </div>
)}

{currentStep === 'inspections' && (
  <InspectionOverview />
)}

{currentStep === 'employee-scheduling' && (
  <EmployeeScheduling onBack={() => setCurrentStep(0)} />
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
        
        {/* Offline-Indikator */}
        <OfflineIndicator />
      </div>
    </LoginWrapper>
  );
}

// Wrapper component to check for customer token
function App() {
  // Check if this is a customer inventory view
  const urlParams = new URLSearchParams(window.location.search);
  let customerToken = urlParams.get('token');
  
  if (!customerToken && window.location.pathname.includes('/customer-inventory/')) {
    const pathParts = window.location.pathname.split('/customer-inventory/');
    customerToken = pathParts.length > 1 ? pathParts[1] : null;
  }

  // If customer token exists, show customer view
  if (customerToken) {
    return <CustomerInventoryEditor token={customerToken} />;
  }

  // Otherwise show normal app
  return <AppContent />;
}

// Wrap the App component with AuthProvider
const AppWithAuth = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default AppWithAuth;