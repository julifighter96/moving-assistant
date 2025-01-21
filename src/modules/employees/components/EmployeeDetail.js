import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    hireDate: '',
    status: 'active'
  });

  const fetchEmployee = React.useCallback(async () => {
    try {
      const response = await fetch(`/moving-assistant/api/employees/${id}`);
      if (!response.ok) {
        throw new Error('Employee not found');
      }
      const data = await response.json();
      setFormData({
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        birthDate: data.birth_date || '',
        hireDate: data.hire_date || '',
        status: data.status || 'active'
      });
    } catch (error) {
      console.error('Error fetching employee:', error);
      alert('Fehler beim Laden des Mitarbeiters');
      navigate('/employees');
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      fetchEmployee();
    }
  }, [id, fetchEmployee]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Debug-Log für Request-Daten
      console.log('Sending employee data:', formData);

      const response = await fetch(
        id ? `/moving-assistant/api/employees/${id}` : '/moving-assistant/api/employees', 
        {
          method: id ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            birthDate: formData.birthDate || null,
            hireDate: formData.hireDate || null,
            status: formData.status
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save employee');
      }

      const savedEmployee = await response.json();
      console.log('Employee saved successfully:', savedEmployee);
      navigate('/employees');
    } catch (error) {
      console.error('Error saving employee:', error);
      // Hier könnte man auch einen Error-State hinzufügen und dem Benutzer anzeigen
      alert(`Fehler beim Speichern: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {id ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter'}
      </h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Vorname
            </label>
            <input
              type="text"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Nachname
            </label>
            <input
              type="text"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              E-Mail
            </label>
            <input
              type="email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Telefon
            </label>
            <input
              type="tel"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div className="mb-4 col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Adresse
            </label>
            <textarea
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              rows="3"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Geburtsdatum
            </label>
            <input
              type="date"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              value={formData.birthDate}
              onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Einstellungsdatum
            </label>
            <input
              type="date"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              value={formData.hireDate}
              onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Status
            </label>
            <select
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
            >
              <option value="active">Aktiv</option>
              <option value="inactive">Inaktiv</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={() => navigate('/employees')}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            disabled={loading}
          >
            Abbrechen
          </button>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            disabled={loading}
          >
            {loading ? 'Speichert...' : 'Speichern'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeDetail; 