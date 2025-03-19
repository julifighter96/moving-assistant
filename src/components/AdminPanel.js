import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import PriceConfiguration from './PriceConfiguration';
import { Users, Home, DollarSign } from 'lucide-react';
import UserManagement from './UserManagement';

const AdminPanel = ({ onUpdateRooms, onUpdateItems }) => {
  const [rooms, setRooms] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [newRoom, setNewRoom] = useState('');
  const [newItem, setNewItem] = useState({ 
    name: '', 
    width: '', 
    length: '', 
    height: '', 
    setupTime: '', 
    dismantleTime: '' 
  });
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      loadItems(selectedRoom);
    }
  }, [selectedRoom]);

  const loadRooms = async () => {
    try {
      const loadedRooms = await adminService.getRooms();
      // Sicherstellen, dass die Raumdaten korrekt formatiert sind
      const formattedRooms = loadedRooms.map(room => ({
        id: room.id,
        name: String(room.name || '')
      }));
      
      setRooms(formattedRooms);
      onUpdateRooms(formattedRooms);
      setError(null);
    } catch (error) {
      setError('Fehler beim Laden der Räume');
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async (roomName) => {
    try {
      setLoading(true);
      const loadedItems = await adminService.getItems(roomName);
      setItems(loadedItems);
      onUpdateItems(loadedItems);
    } catch (error) {
      setError('Fehler beim Laden der Gegenstände');
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async () => {
    if (!newRoom.trim()) return;
    try {
      await adminService.addRoom(newRoom);
      setNewRoom('');
      await loadRooms();
    } catch (error) {
      setError('Fehler beim Hinzufügen des Raums');
      console.error(error);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name || !selectedRoom) return;
    try {
      await adminService.addItem({
        ...newItem,
        room: selectedRoom
      });
      setNewItem({ 
        name: '', 
        width: '', 
        length: '', 
        height: '', 
        setupTime: '', 
        dismantleTime: '' 
      });
      await loadItems(selectedRoom);
    } catch (error) {
      setError('Fehler beim Hinzufügen des Gegenstands');
      console.error(error);
    }
  };

  const handleUpdateItem = async (item) => {
    try {
      await adminService.updateItem(item.id, item);
      setEditingItem(null);
      await loadItems(selectedRoom);
    } catch (error) {
      setError('Fehler beim Aktualisieren des Gegenstands');
      console.error(error);
    }
  };

  if (loading && !rooms.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Benutzerverwaltung</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('rooms')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'rooms'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Home className="h-5 w-5" />
                <span>Räume & Gegenstände</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('prices')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'prices'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Preiskonfiguration</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'rooms' && (
            <div className="space-y-8">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Räume verwalten</h2>
                <div className="flex gap-4">
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
                      key={room.id || room.name}
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

              {selectedRoom && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">
                    Gegenstände für {selectedRoom}
                  </h2>
                  
                  <div className="grid grid-cols-6 gap-4">
                    <input
                      type="text"
                      value={newItem.name}
                      onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                      placeholder="Name des Gegenstands"
                      className="col-span-2 p-2 border rounded"
                    />
                    <input
                      type="number"
                      value={newItem.width}
                      onChange={(e) => setNewItem({...newItem, width: e.target.value})}
                      placeholder="Breite (cm)"
                      className="p-2 border rounded"
                    />
                    <input
                      type="number"
                      value={newItem.length}
                      onChange={(e) => setNewItem({...newItem, length: e.target.value})}
                      placeholder="Länge (cm)"
                      className="p-2 border rounded"
                    />
                    <input
                      type="number"
                      value={newItem.setupTime}
                      onChange={(e) => setNewItem({...newItem, setupTime: e.target.value})}
                      placeholder="Aufbauzeit (min)"
                      className="p-2 border rounded"
                    />
                    <input
                      type="number"
                      value={newItem.dismantleTime}
                      onChange={(e) => setNewItem({...newItem, dismantleTime: e.target.value})}
                      placeholder="Abbauzeit (min)"
                      className="p-2 border rounded"
                    />
                    <button
                      onClick={handleAddItem}
                      disabled={!newItem.name}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-300"
                    >
                      Hinzufügen
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="grid grid-cols-7 gap-4 px-4 py-2 bg-gray-100 rounded-t-lg font-medium">
                      <div className="col-span-2">Name</div>
                      <div>Breite (cm)</div>
                      <div>Länge (cm)</div>
                      <div>Aufbauzeit (min)</div>
                      <div>Abbauzeit (min)</div>
                      <div>Aktionen</div>
                    </div>

                    <div className="space-y-2">
                      {items.map((item) => (
                        <div key={item.id} className="grid grid-cols-7 gap-4 p-4 bg-white rounded-lg items-center">
                          {editingItem?.id === item.id ? (
                            <>
                              <input
                                type="text"
                                value={editingItem.name}
                                onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                                className="col-span-2 p-2 border rounded"
                              />
                              <input
                                type="number"
                                value={editingItem.width || ''}
                                onChange={(e) => setEditingItem({...editingItem, width: e.target.value})}
                                className="p-2 border rounded"
                              />
                              <input
                                type="number"
                                value={editingItem.length || ''}
                                onChange={(e) => setEditingItem({...editingItem, length: e.target.value})}
                                className="p-2 border rounded"
                              />
                              <input
                                type="number"
                                value={editingItem.setupTime || ''}
                                onChange={(e) => setEditingItem({...editingItem, setupTime: e.target.value})}
                                className="p-2 border rounded"
                              />
                              <input
                                type="number"
                                value={editingItem.dismantleTime || ''}
                                onChange={(e) => setEditingItem({...editingItem, dismantleTime: e.target.value})}
                                className="p-2 border rounded"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleUpdateItem(editingItem)}
                                  className="px-3 py-1 bg-primary text-white rounded hover:bg-primary-dark"
                                >
                                  Speichern
                                </button>
                                <button
                                  onClick={() => setEditingItem(null)}
                                  className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                                >
                                  Abbrechen
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="col-span-2 font-medium">{item.name}</div>
                              <div>{item.width || '-'}</div>
                              <div>{item.length || '-'}</div>
                              <div>{item.setupTime || '-'}</div>
                              <div>{item.dismantleTime || '-'}</div>
                              <div>
                                <button
                                  onClick={() => setEditingItem(item)}
                                  className="px-3 py-1 text-primary hover:bg-primary-light rounded"
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
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'prices' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Preiskonfiguration</h2>
              <PriceConfiguration />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;