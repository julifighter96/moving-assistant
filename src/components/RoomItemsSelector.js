import React, { useState, useEffect, useMemo, useCallback } from 'react';
import RoomPhotoCapture from './RoomPhotoCapture';
import { adminService } from '../services/adminService';
import { Info, ChevronDown } from 'lucide-react';

const RoomItemsSelector = ({ roomName, onUpdateRoom, initialData, onAddItem, allExistingItems = [] }) => {
  const [items, setItems] = useState(initialData.items || []);
  const [packMaterials, setPackMaterials] = useState(initialData.packMaterials || []);
  const [newPackMaterial, setNewPackMaterial] = useState({ name: '', quantity: 0 });
  const [notes, setNotes] = useState(initialData.notes || '');
  const [newItem, setNewItem] = useState({ 
    volume: 0, 
    demontiert: false, 
    duebelarbeiten: false,
    remontiert: false,  // new
    elektro: false,     // new
    name: '', 
    width: 0, 
    length: 0, 
    height: 0,
    weight: 0,  // Add weight field
    setupTime: 0,
    dismantleTime: 0
  });
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [prices, setPrices] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailedItem, setDetailedItem] = useState(null);
  const [openServiceDropdown, setOpenServiceDropdown] = useState(null);

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
  

  const [weightPerCubicMeter, setWeightPerCubicMeter] = useState(200);

  // Füge diesen useEffect hinzu um den konfigurierten Wert zu laden
  useEffect(() => {
    const fetchWeightConfig = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/prices`);
        const prices = await response.json();
        const weightConfig = prices.find(p => p.name === 'Gewicht pro m³ (kg)');
        if (weightConfig) {
          setWeightPerCubicMeter(weightConfig.price);
        }
      } catch (error) {
        console.error('Error loading weight configuration:', error);
      }
    };
    fetchWeightConfig();
  }, []);



  const totalVolume = useMemo(() => {
    const itemsVolume = items.reduce((total, item) => {
      const itemVolume = (item.length * item.width * item.height) / 1000000; // cm³ to m³
      return total + itemVolume * item.quantity;
    }, 0);

    const packMaterialsVolume = packMaterials.reduce((total, material) => {
      // Prüfen ob material ein Karton ist
      if (['Umzugskartons (Standard)', 'Bücherkartons (Bücher&Geschirr)', 'Kleiderkisten'].includes(material.name)) {
        const priceConfig = prices?.find(p => p.name === material.name);
        if (priceConfig?.length && priceConfig?.width && priceConfig?.height) {
          const materialVolume = (priceConfig.length * priceConfig.width * priceConfig.height) / 1000000;
          return total + materialVolume * material.quantity;
        }
      }
      return total;
    }, 0);

    return itemsVolume + packMaterialsVolume;
  }, [items, packMaterials, prices]);

  // Update local state when initialData changes
  useEffect(() => {
    setItems(initialData.items || []);
    setPackMaterials(initialData.packMaterials || []);
    setNotes(initialData.notes || '');
  }, [initialData]);

  // Aktualisiere die bestehende Gewichtsberechnung
  const estimatedWeight = useMemo(() => {
    const customWeights = items.reduce((total, item) => {
      if (item.weight) {
        return total + (item.weight * item.quantity);
      }
      return total;
    }, 0);

    const volumeBasedWeight = items.reduce((total, item) => {
      if (!item.weight) {
        const itemVolume = (item.length * item.width * item.height) / 1000000; // cm³ to m³
        return total + (itemVolume * weightPerCubicMeter * item.quantity);
      }
      return total;
    }, 0);

    return customWeights + volumeBasedWeight;
  }, [items, weightPerCubicMeter]);

  // Update parent component whenever data changes
  useEffect(() => {
    onUpdateRoom(roomName, {
      items,
      packMaterials,
      totalVolume: items.reduce((total, item) => 
        total + ((item.width || 0) * (item.length || 0) * (item.height || 0) * item.quantity), 0
      ),
      estimatedWeight,
      notes
    });
  }, [roomName, items, packMaterials, totalVolume, estimatedWeight, notes, onUpdateRoom]);

  const handleQuantityChange = useCallback((index, change, stateUpdater) => {
    stateUpdater(prevItems => {
      const newItems = prevItems.map((item, i) => {
        if (i === index) {
          const increment = item.name === 'Packseide' ? 10 : 1;
          return { 
            ...item, 
            quantity: Math.max(0, item.quantity + (change * increment))
          };
        }
        return item;
      });
      return newItems;
    });
  }, []);

  const handleVolumeChange = useCallback((index, newVolume) => {
    setItems(prevItems => {
      const newItems = prevItems.map((item, i) => 
        i === index ? { ...item, volume: parseFloat(newVolume) } : item
      );
      return newItems;
    });
  }, []);

  const handleCheckboxChange = useCallback((index, field) => {
    setItems(prevItems => {
      const newItems = prevItems.map((item, i) => 
        i === index ? { ...item, [field]: !item[field] } : item
      );
      console.log(`Service "${field}" for item at index ${index} changed to: ${!prevItems[index][field]}`);
      return newItems;
    });
  }, []);

  const handleAddItem = useCallback(() => {
    if (newItem.name && !items.some(item => item.name === newItem.name)) {
      setItems(prevItems => [...prevItems, { ...newItem, quantity: 0 }]);
      onAddItem(newItem);
      // Vollständiges Zurücksetzen aller newItem-Werte
      setNewItem({ 
        name: '', 
        volume: 0, 
        width: 0, 
        length: 0, 
        height: 0,
        weight: 0,
        demontiert: false, 
        duebelarbeiten: false,
        setupTime: 0,
        dismantleTime: 0
      });
    }
  }, [items, newItem, onAddItem]);

  const [editingItem, setEditingItem] = useState(null);

  const handleSaveEdit = (index) => {
    if (editingItem) {
      const updatedItems = [...items];
      updatedItems[index] = editingItem;
      setItems(updatedItems);
      setEditingItem(null);
    }
  };

  const handleAddPackMaterial = useCallback(() => {
    if (newPackMaterial.name && !packMaterials.some(material => material.name === newPackMaterial.name)) {
      setPackMaterials(prevMaterials => [...prevMaterials, { ...newPackMaterial, quantity: 0 }]);
      onAddItem(newPackMaterial);
      setNewPackMaterial({ name: '', quantity: 0 });
    }
  }, [packMaterials, newPackMaterial, onAddItem]);

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
      ...newItem,
      name: suggestion.name,
      width: parseFloat(suggestion.width) || 0,
      length: parseFloat(suggestion.length) || 0,
      height: parseFloat(suggestion.height) || 0,
      setupTime: parseInt(suggestion.setupTime) || 0,
      dismantleTime: parseInt(suggestion.dismantleTime) || 0,
    });
    setShowSuggestions(false);
  };

  const renderItemList = useCallback((itemList, stateUpdater, showVolume = false) => {
    const isPackagingMaterial = (name) => 
      ['Umzugskartons (Standard)', 'Bücherkartons (Bücher&Geschirr)', 'Kleiderkisten'].includes(name);
  
    return (
      <div className="space-y-2">
        {itemList.map((item, index) => {
          // Sicherstellen, dass item ein Objekt ist
          if (!item || typeof item !== 'object') {
            console.error('Invalid item in RoomItemsSelector:', item);
            return null;
          }
          
          // Stelle sicher, dass item.name ein String ist
          const itemName = item.name ? String(item.name) : 'Unbenannt';
          
          // Hole die Maße aus den prices wenn es ein Packmaterial ist
          const priceConfig = isPackagingMaterial(itemName) ? prices?.find(p => p.name === itemName) : null;
  
          return (
            <div className="p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="font-medium">{itemName}</span>
                  <button className="ml-2 text-blue-500 hover:text-blue-700" onClick={() => showItemDetails(item)}>
                    <Info size={16} />
                  </button>
                  
                  {/* Service-Tags */}
                  {(item.demontiert || item.remontiert || item.duebelarbeiten || item.elektro) && (
                    <div className="flex ml-2 gap-1">
                      {item.demontiert && <span className="px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">D</span>}
                      {item.remontiert && <span className="px-1 py-0.5 bg-green-100 text-green-800 text-xs rounded">R</span>}
                      {item.duebelarbeiten && <span className="px-1 py-0.5 bg-orange-100 text-orange-800 text-xs rounded">DÜ</span>}
                      {item.elektro && <span className="px-1 py-0.5 bg-purple-100 text-purple-800 text-xs rounded">E</span>}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex items-center">
                    <button
                      className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"
                      onClick={() => handleQuantityChange(index, -1, stateUpdater)}
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"
                      onClick={() => handleQuantityChange(index, 1, stateUpdater)}
                    >
                      +
                    </button>
                  </div>
                  
                  {/* Service-Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenServiceDropdown(openServiceDropdown === item.id ? null : item.id)}
                      className="px-3 py-1 border border-gray-300 rounded-md flex items-center text-sm"
                    >
                      <span>Services</span>
                      <ChevronDown size={14} className="ml-1" />
                    </button>
                    {openServiceDropdown === item.id && (
                      <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-2 w-48">
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={item.demontiert}
                              onChange={(e) => {
                                e.stopPropagation(); // Stop event propagation
                                handleCheckboxChange(index, 'demontiert');
                              }}
                              className="mr-2"
                            />
                            <span>Demontiert</span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={item.remontiert}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleCheckboxChange(index, 'remontiert');
                              }}
                              className="mr-2"
                            />
                            <span>Remontiert</span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={item.duebelarbeiten}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleCheckboxChange(index, 'duebelarbeiten');
                              }}
                              className="mr-2"
                            />
                            <span>Dübelarbeiten</span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={item.elektro}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleCheckboxChange(index, 'elektro');
                              }}
                              className="mr-2"
                            />
                            <span>Elektro</span>
                          </label>
                        </div>
                        
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <button 
                            className="w-full text-center text-sm text-blue-600"
                            onClick={(e) => {
                              e.stopPropagation(); // Stop event propagation
                              setOpenServiceDropdown(null);
                            }}
                          >
                            Schließen
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button onClick={() => setEditingItem(item)} className="px-3 py-1 text-blue-600 text-sm">
                    Bearbeiten
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [editingItem, handleQuantityChange, handleCheckboxChange, prices, openServiceDropdown]); 

  // Neue Methode zur Anzeige der Details
  const showItemDetails = (item) => {
    setDetailedItem(item);
    setShowDetailModal(true);
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg">
      <div className="bg-blue-600 text-white p-4">
        <h2 className="text-xl font-semibold text-center mb-4">{roomName}</h2>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">Möbel</h3>
        {renderItemList(items, setItems, true)}
    
<div className="space-y-2">
  <div className="flex gap-2 items-center relative">
    <div className="flex-grow relative">
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
        placeholder="Gegenstand Name"
        className="w-full p-2 border border-gray-300 rounded-md"
      />
      {showSuggestions && searchResults.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {searchResults.map((suggestion, index) => (
            <div
              key={index}
              className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <span>{suggestion.name}</span>
              <span className="text-sm text-gray-500">
                {suggestion.length}×{suggestion.width}×{suggestion.height}cm
                {suggestion.weight ? ` • ${suggestion.weight}kg` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
    
    <div className="flex items-center gap-1">
      <div className="relative flex-1">
        <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-600">
          Länge
        </label>
        <input
          type="number"
          value={newItem.length}
          onChange={(e) => setNewItem({...newItem, length: parseInt(e.target.value) || ''})}
          placeholder="cm"
          className="w-24 p-2 border border-gray-300 rounded-md text-center"
        />
      </div>
      <span className="text-gray-400">×</span>
      <div className="relative flex-1">
        <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-600">
          Breite
        </label>
        <input
          type="number"
          value={newItem.width}
          onChange={(e) => setNewItem({...newItem, width: parseInt(e.target.value) || ''})}
          placeholder="cm"
          className="w-24 p-2 border border-gray-300 rounded-md text-center"
        />
      </div>
      <span className="text-gray-400">×</span>
      <div className="relative flex-1">
        <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-600">
          Höhe
        </label>
        <input
          type="number"
          value={newItem.height}
          onChange={(e) => setNewItem({...newItem, height: parseInt(e.target.value) || ''})}
          placeholder="cm"
          className="w-24 p-2 border border-gray-300 rounded-md text-center"
        />
      </div>
      <div className="relative flex-1">
        <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-600">
          Gewicht
        </label>
        <input
          type="number"
          value={newItem.weight}
          onChange={(e) => setNewItem({...newItem, weight: parseInt(e.target.value) || ''})}
          placeholder="kg"
          className="w-24 p-2 border border-gray-300 rounded-md text-center"
        />
      </div>
    </div>
    <button
      onClick={handleAddItem}
      disabled={!newItem.name || !newItem.length || !newItem.width || !newItem.height}
      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 
                transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
    >
      Hinzufügen
    </button>
  </div>
</div>
        
        <h3 className="text-lg font-semibold mt-6 mb-2">Packmaterialien</h3>
        {renderItemList(packMaterials, setPackMaterials)}
        
        <div className="flex mt-2">
          <input
            type="text"
            value={newPackMaterial.name}
            onChange={(e) => setNewPackMaterial({...newPackMaterial, name: e.target.value})}
            placeholder="Neues Packmaterial"
            className="flex-grow p-2 border border-gray-300 rounded-l-md"
          />
          <button
            onClick={handleAddPackMaterial}
            className="bg-green-500 text-white p-2 rounded-r-md hover:bg-green-600 transition-colors"
          >
            Hinzufügen
          </button>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Volumen</h3>
          <div className="flex justify-between items-center">
            <span>Volumen (m³)</span>
            <span>{totalVolume.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span>Geschätztes Gewicht (kg)</span>
            <span>{Math.round(estimatedWeight)}</span>
          </div>
        </div>

        <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Raum Notizen</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Zusätzliche Informationen für diesen Raum..."
          className="w-full p-2 border border-gray-300 rounded-md min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
        <RoomPhotoCapture 
          roomName={roomName}
        />
      </div>

      {/* Modal für Detailansicht */}
      {showDetailModal && detailedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">{detailedItem.name}</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Maße:</span>
                <span>{detailedItem.length}×{detailedItem.width}×{detailedItem.height} cm</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Volumen:</span>
                <span>{((detailedItem.length * detailedItem.width * detailedItem.height) / 1000000).toFixed(2)} m³</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Gewicht:</span>
                <span>{detailedItem.weight || "-"} kg</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Aufbauzeit:</span>
                <span>{detailedItem.setupTime || 0} min</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Abbauzeit:</span>
                <span>{detailedItem.dismantleTime || 0} min</span>
              </div>
            </div>
            
            <button 
              className="mt-6 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              onClick={() => setShowDetailModal(false)}
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomItemsSelector;