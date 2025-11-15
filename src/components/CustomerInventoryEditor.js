import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Save, CheckCircle, AlertCircle, Loader, X, Package, Search, Home, Bed, Utensils, Bath, Briefcase, Car, Box, DoorOpen, Layers } from 'lucide-react';
import { adminService } from '../services/adminService';

const CustomerInventoryEditor = ({ token }) => {
  const [roomsData, setRoomsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
  const [error, setError] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [allExistingItems, setAllExistingItems] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editedRooms, setEditedRooms] = useState(new Set());

  // Helper function to create correct API URL
  const createApiUrl = (endpoint) => {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    // Remove trailing slashes from baseUrl
    const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
    // Remove leading slashes from endpoint
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    
    // Check if baseUrl already contains /api, if so, don't add it again
    if (cleanBaseUrl.endsWith('/api')) {
      // If endpoint starts with 'api/', remove it
      const endpointWithoutApi = cleanEndpoint.replace(/^api\//, '');
      return `${cleanBaseUrl}/${endpointWithoutApi}`;
    }
    
    // Otherwise, add endpoint as is
    return `${cleanBaseUrl}/${cleanEndpoint}`;
  };

  // Load inventory data
  useEffect(() => {
    const loadInventory = async () => {
      try {
        const url = createApiUrl(`api/inspections/shared/${token}`);
        const response = await fetch(url);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Link nicht gefunden oder abgelaufen');
          } else if (response.status === 410) {
            setError('Link ist abgelaufen');
          } else {
            setError('Fehler beim Laden der Daten');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log('Loaded inspection data:', data);
        console.log('roomsData:', data.roomsData);
        console.log('roomsData type:', typeof data.roomsData);
        console.log('roomsData keys:', data.roomsData ? Object.keys(data.roomsData) : 'none');
        
        // Ensure roomsData is an object
        const roomsDataObj = data.roomsData && typeof data.roomsData === 'object' ? data.roomsData : {};
        setRoomsData(roomsDataObj);
        
        // Load all rooms and items from public endpoints (no auth required)
        try {
          const roomsUrl = createApiUrl('api/public/rooms');
          const roomsResponse = await fetch(roomsUrl);
          if (roomsResponse.ok) {
            const configuredRooms = await roomsResponse.json();
            setRooms(configuredRooms.map(r => r.name));
          }
          
          // Load all items from all rooms
          const itemsUrl = createApiUrl('api/public/items');
          const itemsResponse = await fetch(itemsUrl);
          if (itemsResponse.ok) {
            const allItems = await itemsResponse.json();
            setAllExistingItems(allItems);
            console.log('Loaded all existing items:', allItems.length);
          } else {
            console.warn('Could not load items from public endpoint');
          }
        } catch (err) {
          console.error('Error loading rooms/items:', err);
        }
        
        // Don't set current room automatically - user will click on tiles
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading inventory:', err);
        setError('Fehler beim Laden der Daten');
        setLoading(false);
      }
    };

    if (token) {
      loadInventory();
    }
  }, [token]);

  // Save inventory data
  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveStatus(null);
    
    try {
      const url = createApiUrl(`api/inspections/shared/${token}`);
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomsData }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Speichern');
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error('Error saving inventory:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setSaving(false);
    }
  }, [token, roomsData]);

  // Update room data
  const handleUpdateRoom = useCallback((roomName, updatedData) => {
    setRoomsData(prev => ({
      ...prev,
      [roomName]: {
        ...prev[roomName],
        ...updatedData
      }
    }));
    // Mark room as edited
    setEditedRooms(prev => new Set([...prev, roomName]));
  }, []);

  // Calculate totals
  const totals = useMemo(() => {
    let totalVolume = 0;
    let totalWeight = 0;
    Object.values(roomsData).forEach(roomData => {
      totalVolume += roomData.totalVolume || 0;
      totalWeight += roomData.estimatedWeight || 0;
    });
    return { totalVolume, totalWeight };
  }, [roomsData]);

  // Filter rooms based on search query (must be before early returns)
  const filteredRoomNames = useMemo(() => {
    const allRooms = Object.keys(roomsData);
    if (!searchQuery.trim()) return allRooms;
    const query = searchQuery.toLowerCase();
    return allRooms.filter(roomName => 
      roomName.toLowerCase().includes(query)
    );
  }, [roomsData, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Lade Umzugsgutliste...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Fehler</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Get room icon based on room name
  const getRoomIcon = (roomName) => {
    const name = roomName.toLowerCase();
    if (name.includes('wohnzimmer') || name.includes('living')) return <Home className="h-6 w-6" />;
    if (name.includes('schlafzimmer') || name.includes('bedroom')) return <Bed className="h-6 w-6" />;
    if (name.includes('küche') || name.includes('kitchen')) return <Utensils className="h-6 w-6" />;
    if (name.includes('badezimmer') || name.includes('bath')) return <Bath className="h-6 w-6" />;
    if (name.includes('arbeitszimmer') || name.includes('office') || name.includes('study')) return <Briefcase className="h-6 w-6" />;
    if (name.includes('keller') || name.includes('cellar') || name.includes('basement')) return <Box className="h-6 w-6" />;
    if (name.includes('dachboden') || name.includes('attic')) return <Layers className="h-6 w-6" />;
    if (name.includes('flur') || name.includes('hallway') || name.includes('corridor')) return <DoorOpen className="h-6 w-6" />;
    if (name.includes('außen') || name.includes('outdoor') || name.includes('garten')) return <Car className="h-6 w-6" />;
    return <Package className="h-6 w-6" />;
  };

  // Get room color based on volume percentage
  const getRoomColor = (volume, totalVolume) => {
    if (totalVolume === 0) return 'blue';
    const percentage = (volume / totalVolume) * 100;
    if (percentage > 30) return 'blue';
    if (percentage > 15) return 'indigo';
    if (percentage > 5) return 'purple';
    return 'gray';
  };

  const roomNames = Object.keys(roomsData);

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Ihre Umzugsgutliste</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Bitte überprüfen und korrigieren Sie Ihre Möbelstücke</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                saving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white transition-colors`}
            >
              {saving ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span className="text-sm sm:text-base">Speichern...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span className="text-sm sm:text-base">Speichern</span>
                </>
              )}
            </button>
          </div>

          {/* Save Status */}
          {saveStatus && (
            <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
              saveStatus === 'success' 
                ? 'bg-green-50 text-green-800' 
                : 'bg-red-50 text-red-800'
            }`}>
              {saveStatus === 'success' ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span>Erfolgreich gespeichert!</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5" />
                  <span>Fehler beim Speichern. Bitte versuchen Sie es erneut.</span>
                </>
              )}
            </div>
          )}

          {/* Totals - Only Volume */}
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
            <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
              <div className="text-xs sm:text-sm text-gray-600 mb-1">Gesamtvolumen</div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {totals.totalVolume.toFixed(2)} m³
              </div>
            </div>
            {roomNames.length > 0 && (
              <div className="flex-1 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
                <div className="text-xs sm:text-sm text-gray-600 mb-1">Bearbeitete Räume</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  {editedRooms.size} / {roomNames.length}
                </div>
                <div className="w-full sm:w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(editedRooms.size / roomNames.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        {roomNames.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Räume durchsuchen..."
                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Room Tiles Grid */}
        {filteredRoomNames.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {filteredRoomNames.map((roomName) => {
              const roomData = roomsData[roomName];
              const itemCount = roomData?.items?.length || 0;
              const volume = roomData?.totalVolume || 0;
              const volumePercentage = totals.totalVolume > 0 
                ? ((volume / totals.totalVolume) * 100).toFixed(1) 
                : '0.0';
              const isEdited = editedRooms.has(roomName);
              const colorClass = getRoomColor(volume, totals.totalVolume);
              const colorMap = {
                blue: {
                  icon: 'bg-blue-100 text-blue-600 border-blue-200',
                  hover: 'hover:border-blue-300',
                  bar: 'bg-blue-500'
                },
                indigo: {
                  icon: 'bg-indigo-100 text-indigo-600 border-indigo-200',
                  hover: 'hover:border-indigo-300',
                  bar: 'bg-indigo-500'
                },
                purple: {
                  icon: 'bg-purple-100 text-purple-600 border-purple-200',
                  hover: 'hover:border-purple-300',
                  bar: 'bg-purple-500'
                },
                gray: {
                  icon: 'bg-gray-100 text-gray-600 border-gray-200',
                  hover: 'hover:border-gray-300',
                  bar: 'bg-gray-500'
                }
              };
              const colors = colorMap[colorClass];
              
              return (
                <button
                  key={roomName}
                  onClick={() => {
                    setCurrentRoom(roomName);
                    setIsModalOpen(true);
                  }}
                  className={`bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-lg transition-all duration-200 text-left border-2 border-transparent ${colors.hover} transform hover:-translate-y-1 relative overflow-hidden group active:scale-95`}
                >
                  {/* Edited Badge */}
                  {isEdited && (
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
                      <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
                        <CheckCircle className="h-3 w-3" />
                        <span className="hidden sm:inline">Bearbeitet</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className={`${colors.icon} rounded-xl p-2 sm:p-3 group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}>
                        {getRoomIcon(roomName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{roomName}</h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          {itemCount} {itemCount === 1 ? 'Möbelstück' : 'Möbelstücke'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                    <div className="flex items-end justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm text-gray-600">Volumen</div>
                        <div className="text-lg sm:text-xl font-bold text-gray-900 mt-1 truncate">
                          {volume.toFixed(2)} m³
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-gray-500">Anteil</div>
                        <div className="text-base sm:text-lg font-semibold text-gray-700">
                          {volumePercentage}%
                        </div>
                      </div>
                    </div>
                    {/* Volume Bar */}
                    <div className="mt-2 sm:mt-3 w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                      <div 
                        className={`${colors.bar} h-1.5 sm:h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${Math.min(volumePercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {filteredRoomNames.length === 0 && roomNames.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 text-center">
            <Search className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm sm:text-base text-gray-600 mb-2">Keine Räume gefunden, die "{searchQuery}" enthalten.</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-blue-600 hover:text-blue-700 text-sm sm:text-base"
            >
              Suche zurücksetzen
            </button>
          </div>
        )}


        {/* Room Editor Modal */}
        {isModalOpen && currentRoom && roomsData[currentRoom] && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4 animate-fadeIn"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsModalOpen(false);
              }
            }}
          >
            <div className="bg-white rounded-none sm:rounded-xl shadow-2xl max-w-4xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col animate-slideUp">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="bg-blue-100 rounded-lg p-2 flex-shrink-0">
                    {getRoomIcon(currentRoom)}
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{currentRoom}</h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0 ml-2"
                  aria-label="Schließen"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto">
                <RoomEditor
                  key={currentRoom}
                  roomName={currentRoom}
                  roomData={roomsData[currentRoom]}
                  onUpdateRoom={handleUpdateRoom}
                  allExistingItems={allExistingItems}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Room Editor Component
const RoomEditor = ({ roomName, roomData, onUpdateRoom, allExistingItems = [] }) => {
  const [items, setItems] = useState(roomData.items || []);
  const [packMaterials, setPackMaterials] = useState(roomData.packMaterials || []);
  const [notes, setNotes] = useState(roomData.notes || '');
  const [newItem, setNewItem] = useState({ 
    name: '', 
    quantity: 1,
    length: 0, 
    width: 0, 
    height: 0,
    weight: 0,
    demontiert: false,
    remontiert: false,
    duebelarbeiten: false,
    elektro: false
  });
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Update items when roomData changes (when switching rooms)
  useEffect(() => {
    setItems(roomData.items || []);
    setPackMaterials(roomData.packMaterials || []);
    setNotes(roomData.notes || '');
  }, [roomName, roomData]);

  // Recalculate totals when items change
  useEffect(() => {
    const totalVolume = items.reduce((total, item) => {
      const itemVolume = (item.length * item.width * item.height) / 1000000; // cm³ to m³
      return total + itemVolume * item.quantity;
    }, 0);

    const estimatedWeight = items.reduce((total, item) => {
      if (item.weight) {
        return total + (item.weight * item.quantity);
      }
      const itemVolume = (item.length * item.width * item.height) / 1000000;
      return total + (itemVolume * 200 * item.quantity); // 200 kg/m³ default
    }, 0);

    onUpdateRoom(roomName, {
      items,
      packMaterials,
      notes,
      totalVolume,
      estimatedWeight
    });
  }, [items, packMaterials, notes, roomName, onUpdateRoom]);

  const handleQuantityChange = (index, change) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      newItems[index] = {
        ...newItems[index],
        quantity: Math.max(0, newItems[index].quantity + change)
      };
      return newItems;
    });
  };

  const handleItemUpdate = (index, field, value) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };
      return newItems;
    });
  };

  const handleRemoveItem = (index) => {
    setItems(prevItems => prevItems.filter((_, i) => i !== index));
  };

  // Filter suggestions based on input
  const filterSuggestions = (input) => {
    if (!input) {
      setSearchResults([]);
      return;
    }
    
    const filteredItems = allExistingItems.filter(item => 
      item.name.toLowerCase().startsWith(input.toLowerCase()) &&
      !items.some(existingItem => existingItem.name === item.name)
    );
    
    setSearchResults(filteredItems);
    setShowSuggestions(true);
  };

  // Handle item selection from suggestions
  const handleSelectSuggestion = (suggestion) => {
    setNewItem({
      name: suggestion.name,
      quantity: 1,
      length: parseFloat(suggestion.length) || 0,
      width: parseFloat(suggestion.width) || 0,
      height: parseFloat(suggestion.height) || 0,
      weight: parseFloat(suggestion.weight) || 0,
      setupTime: parseInt(suggestion.setupTime) || 0,
      dismantleTime: parseInt(suggestion.dismantleTime) || 0,
      demontiert: false,
      remontiert: false,
      duebelarbeiten: false,
      elektro: false
    });
    setShowSuggestions(false);
  };

  const handleAddItem = () => {
    if (newItem.name && !items.some(item => item.name === newItem.name)) {
      setItems(prevItems => [...prevItems, { ...newItem, quantity: 1 }]);
      // Reset newItem
      setNewItem({ 
        name: '', 
        quantity: 1,
        length: 0, 
        width: 0, 
        height: 0,
        weight: 0,
        demontiert: false,
        remontiert: false,
        duebelarbeiten: false,
        elektro: false
      });
      setShowSuggestions(false);
    }
  };

  // Check if item is preset (exists in allExistingItems)
  const isPresetItem = useCallback((item) => {
    return allExistingItems.some(existingItem => 
      existingItem.name.toLowerCase() === item.name?.toLowerCase()
    );
  }, [allExistingItems]);

  return (
    <div className="p-4 sm:p-6">
      {/* Items List */}
      <div className="space-y-3 mb-4 sm:mb-6">
        {items.map((item, index) => {
          const isPreset = isPresetItem(item);
          
          return (
            <div key={index} className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-start sm:items-center">
                {/* Item Name */}
                <div className="sm:col-span-3">
                  <label className="block text-xs text-gray-500 mb-1 sm:hidden">Möbelstück</label>
                  <input
                    type="text"
                    value={item.name || ''}
                    onChange={(e) => handleItemUpdate(index, 'name', e.target.value)}
                    placeholder="Möbelstück"
                    disabled={isPreset}
                    className={`w-full p-2 text-sm sm:text-base border border-gray-300 rounded-md ${
                      isPreset ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    title={isPreset ? 'Voreingestelltes Item - Name nicht bearbeitbar' : ''}
                  />
                </div>

                {/* Dimensions */}
                <div className="sm:col-span-6 grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 sm:hidden">Länge</label>
                    <input
                      type="number"
                      value={item.length || ''}
                      onChange={(e) => handleItemUpdate(index, 'length', parseFloat(e.target.value) || 0)}
                      placeholder="L (cm)"
                      disabled={isPreset}
                      className={`w-full p-2 border border-gray-300 rounded-md text-sm ${
                        isPreset ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                      title={isPreset ? 'Voreingestelltes Item - Größe nicht bearbeitbar' : ''}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 sm:hidden">Breite</label>
                    <input
                      type="number"
                      value={item.width || ''}
                      onChange={(e) => handleItemUpdate(index, 'width', parseFloat(e.target.value) || 0)}
                      placeholder="B (cm)"
                      disabled={isPreset}
                      className={`w-full p-2 border border-gray-300 rounded-md text-sm ${
                        isPreset ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                      title={isPreset ? 'Voreingestelltes Item - Größe nicht bearbeitbar' : ''}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 sm:hidden">Höhe</label>
                    <input
                      type="number"
                      value={item.height || ''}
                      onChange={(e) => handleItemUpdate(index, 'height', parseFloat(e.target.value) || 0)}
                      placeholder="H (cm)"
                      disabled={isPreset}
                      className={`w-full p-2 border border-gray-300 rounded-md text-sm ${
                        isPreset ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                      title={isPreset ? 'Voreingestelltes Item - Größe nicht bearbeitbar' : ''}
                    />
                  </div>
                </div>

              {/* Quantity */}
              <div className="sm:col-span-2 flex items-center gap-2 justify-between sm:justify-start">
                <label className="block text-xs text-gray-500 sm:hidden">Menge</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(index, -1)}
                    className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 transition-colors"
                    aria-label="Menge reduzieren"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-medium text-sm sm:text-base">{item.quantity || 0}</span>
                  <button
                    onClick={() => handleQuantityChange(index, 1)}
                    className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 transition-colors"
                    aria-label="Menge erhöhen"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Remove Button */}
              <div className="sm:col-span-1 flex justify-end sm:justify-start">
                <button
                  onClick={() => handleRemoveItem(index)}
                  className="w-full sm:w-auto px-3 py-1.5 sm:py-1 text-red-600 hover:bg-red-50 rounded-md text-sm transition-colors"
                >
                  Entfernen
                </button>
              </div>
            </div>

            {/* Service Tags */}
            {(item.demontiert || item.remontiert || item.duebelarbeiten || item.elektro) && (
              <div className="flex gap-2 mt-2">
                {item.demontiert && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Demontiert</span>}
                {item.remontiert && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Remontiert</span>}
                {item.duebelarbeiten && <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">Dübelarbeiten</span>}
                {item.elektro && <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Elektro</span>}
              </div>
            )}
          </div>
          );
        })}

        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Keine Möbelstücke vorhanden
          </div>
        )}
      </div>

      {/* Add Item Form */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm sm:text-base font-semibold text-gray-700 mb-3">Neues Möbelstück hinzufügen</h4>
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={newItem.name}
              onChange={(e) => {
                setNewItem({...newItem, name: e.target.value});
                filterSuggestions(e.target.value);
              }}
              onFocus={() => {
                if (newItem.name) {
                  filterSuggestions(newItem.name);
                }
              }}
              placeholder="Möbelstück Name (z.B. 'Sofa')"
              className="w-full p-2 text-sm sm:text-base border border-gray-300 rounded-md"
            />
            {showSuggestions && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 sm:max-h-60 overflow-auto">
                {searchResults.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-2 hover:bg-gray-100 cursor-pointer flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0"
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    <span className="text-sm sm:text-base">{suggestion.name}</span>
                    <span className="text-xs sm:text-sm text-gray-500">
                      {suggestion.length}×{suggestion.width}×{suggestion.height}cm
                      {suggestion.weight ? ` • ${suggestion.weight}kg` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              value={newItem.length || ''}
              onChange={(e) => setNewItem({...newItem, length: parseFloat(e.target.value) || 0})}
              placeholder="Länge (cm)"
              className="p-2 border border-gray-300 rounded-md text-sm"
            />
            <input
              type="number"
              value={newItem.width || ''}
              onChange={(e) => setNewItem({...newItem, width: parseFloat(e.target.value) || 0})}
              placeholder="Breite (cm)"
              className="p-2 border border-gray-300 rounded-md text-sm"
            />
            <input
              type="number"
              value={newItem.height || ''}
              onChange={(e) => setNewItem({...newItem, height: parseFloat(e.target.value) || 0})}
              placeholder="Höhe (cm)"
              className="p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          
          <button
            onClick={handleAddItem}
            disabled={!newItem.name}
            className="w-full px-4 py-2.5 sm:py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            + Möbelstück hinzufügen
          </button>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-4 sm:mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Notizen</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Zusätzliche Informationen für diesen Raum..."
          className="w-full p-2 text-sm sm:text-base border border-gray-300 rounded-md min-h-[80px] sm:min-h-[100px]"
        />
      </div>

      {/* Room Totals - Only Volume */}
      <div className="mt-4 sm:mt-6">
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 inline-block w-full sm:w-auto">
          <div className="text-xs sm:text-sm text-gray-600 mb-1">Volumen</div>
          <div className="text-lg sm:text-xl font-bold text-gray-900">
            {((roomData.totalVolume || 0).toFixed(2))} m³
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerInventoryEditor;

