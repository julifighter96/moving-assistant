import React from 'react';

const EventDetailsPanel = ({ event, onClose, onUpdate }) => {
  const handleRemoveEmployee = async (employeeId) => {
    try {
      await fetch(`/moving-assistant/api/assignments/${event.resource.id}/employees/${employeeId}`, {
        method: 'DELETE'
      });
      onUpdate();
    } catch (error) {
      console.error('Error removing employee:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">
            Team {event.resource.team_name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Zeitraum</h3>
            <p className="text-gray-600">
              {new Date(event.start).toLocaleString()} - 
              {new Date(event.end).toLocaleString()}
            </p>
          </div>

          <div>
            <h3 className="font-medium">Teammitglieder</h3>
            <div className="space-y-2 mt-2">
              {event.resource.employees?.map(employee => (
                <div
                  key={employee.id}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded"
                >
                  <span>
                    {employee.first_name} {employee.last_name}
                  </span>
                  <button
                    onClick={() => handleRemoveEmployee(employee.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Entfernen
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium">Umzugsauftrag</h3>
            <p className="text-gray-600">
              {event.resource.inspection?.deal_id || 'Kein Auftrag zugewiesen'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPanel; 