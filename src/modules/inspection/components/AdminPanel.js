import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import PriceConfiguration from './PriceConfiguration';

const AdminPanel = ({ onUpdateRooms, onUpdateItems }) => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [items, setItems] = useState([]);
  const [newRoom, setNewRoom] = useState('');
  const [newItem, setNewItem] = useState({
    name: '',
    volume: 0,
    width: 0,
    length: 0,
    height: 0
  });
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const data = await adminService.getConfiguration();
      console.log('Loaded configuration:', data);
      setRooms(data.rooms || []);
      if (data.rooms && data.rooms.length > 0 && !selectedRoom) {
        setSelectedRoom(data.rooms[0].name);
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      setError(error.message);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadItems = async () => {
      if (selectedRoom) {
        try {
          const loadedItems = await adminService.getItems(selectedRoom);
          if (Array.isArray(loadedItems)) {  // Prüfen ob es ein Array ist
            setItems(loadedItems);
          } else {
            setItems([]);  // Fallback zu leerem Array
            console.error('Loaded items is not an array:', loadedItems);
          }
        } catch (err) {
          console.error('Error loading items:', err);
          setError('Fehler beim Laden der Gegenstände');
          setItems([]);  // Fallback zu leerem Array im Fehlerfall
        }
      }
    };

    loadItems();
  }, [selectedRoom]);


  const handleUpdateItem = async (item) => {
    try {
      setLoading(true);
      setError(null);
      const itemData = {
        name: item.name,
        width: parseFloat(item.width) || 0,
        length: parseFloat(item.length) || 0,
        height: parseFloat(item.height) || 0,
        volume: parseFloat(item.width * item.length * item.height) || 0,
        room: selectedRoom
      };
      await adminService.updateItem(item.id, itemData);
      setEditingItem(null);
      await loadItems(selectedRoom);
      if (onUpdateItems) {
        onUpdateItems(await adminService.getItems(selectedRoom));
      }
    } catch (err) {
      setError('Fehler beim Aktualisieren des Gegenstands');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async () => {
    try {
      setLoading(true);
      const loadedRooms = await adminService.getRooms();
      setRooms(loadedRooms);
      if (loadedRooms.length > 0 && !selectedRoom) {
        setSelectedRoom(loadedRooms[0].name);
      }
    } catch (err) {
      setError('Fehler beim Laden der Räume');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async (roomName) => {
    try {
      setLoading(true);
      const loadedItems = await adminService.getItems(roomName);
      setItems(loadedItems);
    } catch (err) {
      setError('Fehler beim Laden der Gegenstände');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async () => {
    if (!newRoom.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      await adminService.addRoom(newRoom);
      setNewRoom('');
      await loadRooms();
      if (onUpdateRooms) {
        onUpdateRooms(await adminService.getRooms());
      }
    } catch (err) {
      setError('Fehler beim Hinzufügen des Raums');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name.trim() || !selectedRoom) return;

    try {
      setLoading(true);
      setError(null);
      const itemData = {
        name: newItem.name,
        width: parseFloat(newItem.width) || 0,
        length: parseFloat(newItem.length) || 0, 
        height: parseFloat(newItem.height) || 0,
        volume: parseFloat(newItem.volume) || 0,
        room: selectedRoom
      };
      await adminService.addItem(itemData);
      setNewItem({ name: '', volume: 0, width: 0, length: 0, height: 0 });
      await loadItems(selectedRoom);
      if (onUpdateItems) {
        onUpdateItems(await adminService.getItems(selectedRoom));
      }
    } catch (err) {
      setError('Fehler beim Hinzufügen des Gegenstands');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isAddItemDisabled = !selectedRoom || !newItem.name;

  if (loading && !rooms.length) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Räume Sektion */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Räume verwalten</h2>
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            value={newRoom}
            onChange={(e) => setNewRoom(e.target.value)}
            placeholder="Neuer Raum"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleAddRoom}
            disabled={loading}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-300"
          >
            {loading ? 'Lädt...' : 'Hinzufügen'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {Array.isArray(rooms) && rooms.map((room) => (  // Sicherstellen dass rooms ein Array ist
            <button
              key={room.id || room.name}  // Fallback für key
              onClick={() => setSelectedRoom(room.name)}
              className={`p-4 rounded-lg border ${
                selectedRoom === room.name
                  ? 'border-primary bg-primary-light text-primary'
                  : 'border-gray-200 hover:border-primary'
              }`}
            >
              {room.name}
            </button>
          ))}
        </div>
      </div>

       {/* Gegenstände Sektion */}
       {selectedRoom && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            Gegenstände für {selectedRoom}
          </h2>
          
          {/* Item Form */}
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Neuer Gegenstand</h3>
            <div className="grid grid-cols-5 gap-4 mb-6">
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                placeholder="Name des Gegenstands"
                className="col-span-2 p-2 border rounded"
              />
              <div className="col-span-3 grid grid-cols-3 gap-2">
                <input
                  type="number"
                  value={newItem.width}
                  onChange={(e) => setNewItem({...newItem, width: parseFloat(e.target.value)})}
                  placeholder="Breite (cm)"
                  className="p-2 border rounded"
                />
                <input
                  type="number"
                  value={newItem.length}
                  onChange={(e) => setNewItem({...newItem, length: parseFloat(e.target.value)})}
                  placeholder="Länge (cm)"
                  className="p-2 border rounded"
                />
                <input
                  type="number"
                  value={newItem.height}
                  onChange={(e) => setNewItem({...newItem, height: parseFloat(e.target.value)})}
                  placeholder="Höhe (cm)"
                  className="p-2 border rounded"
                />
              </div>
              <button
                onClick={handleAddItem}
                disabled={!newItem.name.trim() || !selectedRoom}
                className="px-6 py-2 bg-green-500 text-white rounded-r-md hover:bg-green-600 
                           disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Hinzufügen
              </button>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-4 px-4 py-2 bg-gray-100 rounded-t-lg font-medium">
            <div className="col-span-2">Name</div>
            <div>Breite (cm)</div>
            <div>Länge (cm)</div>
            <div>Höhe (cm)</div>
            <div>Aktionen</div>
          </div>

          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-6 gap-4 p-4 bg-white rounded-lg items-center">
                {editingItem?.id === item.id ? (
                  <>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={editingItem.name}
                        onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        value={editingItem.width || 0}
                        onChange={(e) => setEditingItem({...editingItem, width: parseFloat(e.target.value)})}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        value={editingItem.length || 0}
                        onChange={(e) => setEditingItem({...editingItem, length: parseFloat(e.target.value)})}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        value={editingItem.height || 0}
                        onChange={(e) => setEditingItem({...editingItem, height: parseFloat(e.target.value)})}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateItem(editingItem)}
                        className="px-3 py-1 bg-green-500 text-white rounded"
                      >
                        Speichern
                      </button>
                      <button
                        onClick={() => setEditingItem(null)}
                        className="px-3 py-1 bg-gray-500 text-white rounded"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-span-2 font-medium">{item.name}</div>
                    <div>{item.width || 0}</div>
                    <div>{item.length || 0}</div>
                    <div>{item.height || 0}</div>
                    <div>
                      <button
                        onClick={() => setEditingItem(item)}
                        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Bearbeiten
                      </button>
                    </div>
                  </>
                )}
              </div>
              
            ))}

            {!items.length && (
              <p className="text-gray-500 text-center py-4">
                Keine Gegenstände vorhanden
              </p>
            )}
            {/* Preiskonfiguration als neue Sektion am Ende */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Preiskonfiguration</h2>
              <p className="text-gray-500 mb-6">Verwalten Sie hier die Preise für Möbel und Materialien</p>
              <PriceConfiguration />
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default AdminPanel;