import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const QualificationManager = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [qualifications, setQualifications] = useState([]);
  const [employeeQualifications, setEmployeeQualifications] = useState([]);
  const [newQualification, setNewQualification] = useState({
    qualificationId: '',
    acquiredDate: '',
    expiryDate: '',
    notes: ''
  });

  const fetchQualifications = React.useCallback(async () => {
    try {
      const response = await fetch('/moving-assistant/api/qualifications');
      if (!response.ok) {
        throw new Error('Failed to fetch qualifications');
      }
      const data = await response.json();
      setQualifications(data);
    } catch (error) {
      console.error('Error fetching qualifications:', error);
    }
  }, []);

  const fetchEmployeeQualifications = React.useCallback(async () => {
    try {
      const response = await fetch(`/moving-assistant/api/employee-qualifications/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch employee qualifications');
      }
      const data = await response.json();
      setEmployeeQualifications(data);
    } catch (error) {
      console.error('Error fetching employee qualifications:', error);
    }
  }, [id]);

  useEffect(() => {
    fetchQualifications();
    fetchEmployeeQualifications();
  }, [fetchQualifications, fetchEmployeeQualifications]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/moving-assistant/api/employee-qualifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: id,
          ...newQualification
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add qualification');
      }

      await fetchEmployeeQualifications();
      setNewQualification({
        qualificationId: '',
        acquiredDate: '',
        expiryDate: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error adding qualification:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold">Qualifikationen verwalten</h1>
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded"
            >
              Zurück zur Übersicht
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Add Qualification Form */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Neue Qualifikation hinzufügen</h2>
            <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Qualifikation
                </label>
                <select
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  value={newQualification.qualificationId}
                  onChange={(e) => setNewQualification({
                    ...newQualification,
                    qualificationId: e.target.value
                  })}
                  required
                >
                  <option value="">Bitte wählen</option>
                  {qualifications.map(qual => (
                    <option key={qual.id} value={qual.id}>{qual.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Erworben am
                </label>
                <input
                  type="date"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  value={newQualification.acquiredDate}
                  onChange={(e) => setNewQualification({
                    ...newQualification,
                    acquiredDate: e.target.value
                  })}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Gültig bis
                </label>
                <input
                  type="date"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  value={newQualification.expiryDate}
                  onChange={(e) => setNewQualification({
                    ...newQualification,
                    expiryDate: e.target.value
                  })}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Notizen
                </label>
                <textarea
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  value={newQualification.notes}
                  onChange={(e) => setNewQualification({
                    ...newQualification,
                    notes: e.target.value
                  })}
                  rows="3"
                />
              </div>

              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Hinzufügen
              </button>
            </form>
          </div>

          {/* Qualifications List */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Vorhandene Qualifikationen</h2>
            <div className="bg-white shadow-md rounded">
              {employeeQualifications.length === 0 ? (
                <p className="p-4 text-gray-500">Keine Qualifikationen vorhanden</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {employeeQualifications.map((qual) => (
                    <li key={qual.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{qual.name}</h3>
                          <p className="text-sm text-gray-500">
                            Erworben: {new Date(qual.acquired_date).toLocaleDateString()}
                          </p>
                          {qual.expiry_date && (
                            <p className="text-sm text-gray-500">
                              Gültig bis: {new Date(qual.expiry_date).toLocaleDateString()}
                            </p>
                          )}
                          {qual.notes && (
                            <p className="text-sm text-gray-600 mt-1">{qual.notes}</p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualificationManager; 