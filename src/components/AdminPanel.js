import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import PriceConfiguration from './PriceConfiguration';

const AdminPanel = ({ onUpdateRooms, onUpdateItems }) => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [items, setItems] = useState([]);
  const [newRoom, setNewRoom] = useState('');
  const [newItem, setNewItem] = useState({ name: '', volume: 0 });
  const [editingItem, setEditingItem] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lade Räume beim Komponenten-Mount
  useEffect(() => {
    loadRooms();
  }, []);

  // Lade Items wenn ein Raum ausgewählt wird
  useEffect(() => {
    if (selectedRoom) {
      loadItems(selectedRoom);
    }
  }, [selectedRoom]);

  const handleUpdateItem = async (item) => {
    try {
      setLoading(true);
      setError(null);
      await adminService.updateItem(item.id, item);
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
      await adminService.addItem({
        ...newItem,
        room: selectedRoom
      });
      setNewItem({ name: '', volume: 0 });
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
          {rooms.map((room) => (
            <button
              key={room.id}
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
          
          {/* Neuen Gegenstand hinzufügen */}
          <div className="flex gap-4 mb-6">
            {/* ... bestehender Code für neuen Gegenstand ... */}
          </div>

          {/* Liste der Gegenstände */}
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
              >
                {editingItem?.id === item.id ? (
                  // Bearbeitungsmodus
                  <div className="flex w-full gap-4">
                    <input
                      type="text"
                      value={editingItem.name}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        name: e.target.value
                      })}
                      className="flex-1 rounded-md border-gray-300 px-3 py-2"
                    />
                    <input
                      type="number"
                      value={editingItem.volume}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        volume: parseFloat(e.target.value) || 0
                      })}
                      className="w-32 rounded-md border-gray-300 px-3 py-2"
                    />
                    <button
                      onClick={() => handleUpdateItem(editingItem)}
                      className="px-4 py-2 bg-green-500 text-white rounded-md"
                    >
                      Speichern
                    </button>
                    <button
                      onClick={() => setEditingItem(null)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-md"
                    >
                      Abbrechen
                    </button>
                  </div>
                ) : (
                  // Anzeigemodus
                  <>
                    <span className="font-medium">{item.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600">{item.volume} m³</span>
                      <button
                        onClick={() => setEditingItem(item)}
                        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-md"
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