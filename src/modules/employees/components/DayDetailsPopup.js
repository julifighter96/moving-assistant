import React from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const DayDetailsPopup = ({ date, moves, assignments, employees, onClose, onMoveSelect }) => {
  // Gruppiere Assignments nach Umzügen
  const getAssignedEmployees = (moveId) => {
    return assignments
      .filter(a => a.inspection_id === moveId)
      .map(a => employees.find(e => e.id === a.employee_id))
      .filter(Boolean);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2">
              Tagesübersicht
            </h2>
            <p className="text-gray-600">
              {format(date, 'EEEE, d. MMMM yyyy', { locale: de })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {moves.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Keine Umzüge an diesem Tag</p>
          ) : (
            moves.map(move => {
              const assignedEmployees = getAssignedEmployees(move.id);
              return (
                <div 
                  key={move.id}
                  className="bg-white border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => onMoveSelect(move)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{move.customer_name}</h3>
                      <p className="text-gray-600">{move.address}</p>
                      <p className="text-gray-500 text-sm mt-1">{move.notes}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                        move.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        move.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {move.status === 'pending' ? 'Ausstehend' : 
                         move.status === 'completed' ? 'Abgeschlossen' : 
                         move.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">
                      Zugewiesene Mitarbeiter ({assignedEmployees.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {assignedEmployees.map(employee => (
                        <span 
                          key={employee.id}
                          className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-sm"
                        >
                          {employee.first_name} {employee.last_name}
                        </span>
                      ))}
                      {assignedEmployees.length === 0 && (
                        <span className="text-gray-500 text-sm">
                          Keine Mitarbeiter zugewiesen
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default DayDetailsPopup; 