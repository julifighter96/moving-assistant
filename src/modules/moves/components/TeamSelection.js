import React, { useState, useEffect } from 'react';
import { Users, X } from 'lucide-react';

const TeamSelection = ({ moveId, currentTeam, onClose, onSave }) => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState(
    currentTeam.map(member => member.id)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching employees...'); // Debug log
      const response = await fetch('/moving-assistant/api/employees');
      if (!response.ok) throw new Error('Fehler beim Laden der Mitarbeiter');
      const data = await response.json();
      console.log('Received employees:', data); // Debug log
      setEmployees(data);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEmployee = (employeeId) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/moving-assistant/api/moves/${moveId}/team`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ team: selectedEmployees }),
      });

      if (!response.ok) throw new Error('Fehler beim Speichern des Teams');
      
      const updatedTeam = employees.filter(emp => 
        selectedEmployees.includes(emp.id)
      );
      onSave(updatedTeam);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <p className="text-center">Lade Mitarbeiter...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <p className="text-center text-red-600">{error}</p>
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Schließen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold">Team zusammenstellen</h2>
            <p className="text-sm text-gray-500">
              {employees.length} Mitarbeiter verfügbar
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {employees.map(employee => (
            <div
              key={employee.id}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer
                ${selectedEmployees.includes(employee.id)
                  ? 'bg-primary-50 border-primary'
                  : 'bg-gray-50 hover:bg-gray-100'
                }`}
              onClick={() => handleToggleEmployee(employee.id)}
            >
              <div>
                <p className="font-medium">
                  {employee.first_name} {employee.last_name}
                </p>
                <p className="text-sm text-gray-500">{employee.role}</p>
              </div>
              {selectedEmployees.includes(employee.id) && (
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center">
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            Team speichern
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamSelection; 