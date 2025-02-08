import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import Toast from './Toast';
import ConfirmDialog from './ConfirmDialog';

// Hilfsfunktion zum Erstellen der korrekten API-URL
const createApiUrl = (endpoint) => {
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  // Entferne trailing slashes vom baseUrl und führende slashes vom endpoint
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  const finalUrl = `${cleanBaseUrl}/${cleanEndpoint}`; 
  return finalUrl;
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    userId: null,
    username: ''
  });
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(createApiUrl('admin/users'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const userData = Array.isArray(response.data) ? response.data : [];
      setUsers(userData);
      setError(null);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.response?.data?.message || 'Fehler beim Laden der Benutzer');
      setUsers([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handlePasswordChange = async (userId) => {
    if (!newPassword.trim()) {
      setError('Bitte geben Sie ein neues Passwort ein');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        createApiUrl(`admin/users/${userId}/password`),
        { password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingUser(null);
      setNewPassword('');
      setError(null);
      showToast('Passwort wurde erfolgreich geändert');
    } catch (error) {
      console.error('Error changing password:', error);
      setError(error.response?.data?.message || 'Fehler beim Ändern des Passworts');
      showToast(error.response?.data?.message || 'Fehler beim Ändern des Passworts', 'error');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        createApiUrl(`admin/users/${userId}/role`),
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchUsers();
      setError(null);
      showToast('Rolle wurde erfolgreich geändert');
    } catch (error) {
      console.error('Error changing role:', error);
      setError(error.response?.data?.message || 'Fehler beim Ändern der Rolle');
      showToast(error.response?.data?.message || 'Fehler beim Ändern der Rolle', 'error');
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      setError('Bitte füllen Sie alle Felder aus');
      showToast('Bitte füllen Sie alle Felder aus', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        createApiUrl('admin/users'),
        newUser,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNewUser({
        username: '',
        email: '',
        password: '',
        role: 'user'
      });
      setShowNewUserForm(false);
      setError(null);
      await fetchUsers();
      showToast('Benutzer wurde erfolgreich erstellt');
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error.response?.data?.message || 'Fehler beim Erstellen des Benutzers');
      showToast(error.response?.data?.message || 'Fehler beim Erstellen des Benutzers', 'error');
    }
  };

  const handleDeleteClick = (userId, username) => {
    setConfirmDialog({
      isOpen: true,
      userId,
      username
    });
  };

  const handleDeleteConfirm = async () => {
    const userId = confirmDialog.userId;
    try {
      const token = localStorage.getItem('token');
      const url = createApiUrl(`admin/users/${userId}`);

      const response = await axios.delete(
        url,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      await fetchUsers();
      setError(null);
      showToast('Benutzer wurde erfolgreich gelöscht');
    } catch (error) {
      console.error('Delete user error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        headers: error.config?.headers
      });

      let errorMessage = 'Fehler beim Löschen des Benutzers';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 404) {
        errorMessage = 'Benutzer wurde nicht gefunden';
      } else if (error.response?.status === 403) {
        errorMessage = 'Keine Berechtigung zum Löschen des Benutzers';
      }

      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setConfirmDialog({ isOpen: false, userId: null, username: '' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, userId: null, username: '' })}
        onConfirm={handleDeleteConfirm}
        title="Benutzer löschen"
        message={`Sind Sie sicher, dass Sie den Benutzer "${confirmDialog.username}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.`}
      />

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Benutzerverwaltung</h2>
            <p className="text-gray-500 mt-1">Verwalten Sie Benutzer und deren Berechtigungen</p>
          </div>
          <button
            onClick={() => setShowNewUserForm(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Neuer Benutzer
          </button>
        </div>

        {showNewUserForm && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium mb-4">Neuen Benutzer erstellen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Benutzername</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">E-Mail</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Passwort</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Rolle</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                >
                  <option value="user">Benutzer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowNewUserForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                Benutzer erstellen
              </button>
            </div>
          </div>
        )}

        <div className="p-6">
          <div className="overflow-x-auto">
            {users.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Keine Benutzer gefunden</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Benutzername
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      E-Mail
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rolle
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Erstellt am
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={user.id === currentUser?.id}
                          className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                        >
                          <option value="user">Benutzer</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingUser === user.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Neues Passwort"
                              className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                            />
                            <button
                              onClick={() => handlePasswordChange(user.id)}
                              className="p-2 text-green-600 hover:text-green-800"
                              title="Passwort speichern"
                            >
                              <Save className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingUser(null);
                                setNewPassword('');
                                setError(null);
                              }}
                              className="p-2 text-red-600 hover:text-red-800"
                              title="Abbrechen"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setEditingUser(user.id)}
                              className="p-2 text-blue-600 hover:text-blue-800"
                              title="Passwort ändern"
                            >
                              <Edit2 className="h-5 w-5" />
                            </button>
                            {user.id !== currentUser?.id && (
                              <button
                                onClick={() => handleDeleteClick(user.id, user.username)}
                                className="p-2 text-red-600 hover:text-red-800"
                                title="Benutzer löschen"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement; 