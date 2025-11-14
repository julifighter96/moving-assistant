import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Save, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const CustomerInventoryEditor = ({ token }) => {
  const [roomsData, setRoomsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
  const [error, setError] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);

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
        setRoomsData(data.roomsData || {});
        
        // Set first room as current
        const roomNames = Object.keys(data.roomsData || {});
        if (roomNames.length > 0) {
          setCurrentRoom(roomNames[0]);
        }
        
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

  const roomNames = Object.keys(roomsData);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ihre Umzugsgutliste</h1>
              <p className="text-gray-600 mt-1">Bitte überprüfen und korrigieren Sie Ihre Möbelstücke</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${
                saving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white transition-colors`}
            >
              {saving ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  Speichern...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Speichern
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

          {/* Totals */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Gesamtvolumen</div>
              <div className="text-2xl font-bold text-gray-900">
                {totals.totalVolume.toFixed(2)} m³
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Geschätztes Gewicht</div>
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(totals.totalWeight)} kg
              </div>
            </div>
          </div>
        </div>

        {/* Room Tabs */}
        {roomNames.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="border-b border-gray-200">
              <div className="flex overflow-x-auto">
                {roomNames.map((roomName) => (
                  <button
                    key={roomName}
                    onClick={() => setCurrentRoom(roomName)}
                    className={`px-6 py-4 font-medium whitespace-nowrap border-b-2 transition-colors ${
                      currentRoom === roomName
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {roomName}
                  </button>
                ))}
              </div>
            </div>

            {/* Room Content */}
            {currentRoom && roomsData[currentRoom] && (
              <RoomEditor
                roomName={currentRoom}
                roomData={roomsData[currentRoom]}
                onUpdateRoom={handleUpdateRoom}
              />
            )}
          </div>
        )}

        {roomNames.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600">Keine Räume gefunden.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Room Editor Component
const RoomEditor = ({ roomName, roomData, onUpdateRoom }) => {
  const [items, setItems] = useState(roomData.items || []);
  const [packMaterials, setPackMaterials] = useState(roomData.packMaterials || []);
  const [notes, setNotes] = useState(roomData.notes || '');

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

  const handleAddItem = () => {
    setItems(prevItems => [...prevItems, {
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
    }]);
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">{roomName}</h3>

      {/* Items List */}
      <div className="space-y-3 mb-6">
        {items.map((item, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Item Name */}
              <div className="md:col-span-3">
                <input
                  type="text"
                  value={item.name || ''}
                  onChange={(e) => handleItemUpdate(index, 'name', e.target.value)}
                  placeholder="Möbelstück"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Dimensions */}
              <div className="md:col-span-6 grid grid-cols-4 gap-2">
                <input
                  type="number"
                  value={item.length || ''}
                  onChange={(e) => handleItemUpdate(index, 'length', parseFloat(e.target.value) || 0)}
                  placeholder="L (cm)"
                  className="p-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="number"
                  value={item.width || ''}
                  onChange={(e) => handleItemUpdate(index, 'width', parseFloat(e.target.value) || 0)}
                  placeholder="B (cm)"
                  className="p-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="number"
                  value={item.height || ''}
                  onChange={(e) => handleItemUpdate(index, 'height', parseFloat(e.target.value) || 0)}
                  placeholder="H (cm)"
                  className="p-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="number"
                  value={item.weight || ''}
                  onChange={(e) => handleItemUpdate(index, 'weight', parseFloat(e.target.value) || 0)}
                  placeholder="Gewicht (kg)"
                  className="p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              {/* Quantity */}
              <div className="md:col-span-2 flex items-center gap-2">
                <button
                  onClick={() => handleQuantityChange(index, -1)}
                  className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"
                >
                  -
                </button>
                <span className="w-12 text-center font-medium">{item.quantity || 0}</span>
                <button
                  onClick={() => handleQuantityChange(index, 1)}
                  className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"
                >
                  +
                </button>
              </div>

              {/* Remove Button */}
              <div className="md:col-span-1">
                <button
                  onClick={() => handleRemoveItem(index)}
                  className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-md text-sm"
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
        ))}

        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Keine Möbelstücke vorhanden
          </div>
        )}
      </div>

      {/* Add Item Button */}
      <button
        onClick={handleAddItem}
        className="mb-6 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
      >
        + Möbelstück hinzufügen
      </button>

      {/* Notes */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Notizen</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Zusätzliche Informationen für diesen Raum..."
          className="w-full p-2 border border-gray-300 rounded-md min-h-[100px]"
        />
      </div>

      {/* Room Totals */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Volumen</div>
          <div className="text-xl font-bold text-gray-900">
            {((roomData.totalVolume || 0).toFixed(2))} m³
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Gewicht</div>
          <div className="text-xl font-bold text-gray-900">
            {Math.round(roomData.estimatedWeight || 0)} kg
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerInventoryEditor;

