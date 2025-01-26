import React from 'react';

const MoveDetailsPopup = ({ 
  move, 
  onClose, 
  employees, 
  assignments, 
  onAssignEmployee, 
  onRemoveEmployee 
}) => {
  // Get assignments for this move
  const moveAssignments = assignments.filter(a => a.deal_id === move.id);
  
  // Get assigned employees
  const assignedEmployees = moveAssignments.map(assignment => {
    const employee = employees.find(e => e.id === assignment.employee_id);
    return {
      ...employee,
      assignmentId: assignment.id,
      startTime: assignment.start_datetime,
      endTime: assignment.end_datetime
    };
  }).filter(Boolean);

  const handleAssign = (employeeId) => {
    const moveDate = new Date(move.move_date);
    const startTime = new Date(moveDate);
    startTime.setHours(8, 0, 0);
    const endTime = new Date(moveDate);
    endTime.setHours(17, 0, 0);

    onAssignEmployee(employeeId, move.id, startTime, endTime);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">{move.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <p><strong>Datum:</strong> {new Date(move.move_date).toLocaleDateString()}</p>
          <p><strong>Von:</strong> {move.origin_address}</p>
          <p><strong>Nach:</strong> {move.destination_address}</p>
          {move.org_name && <p><strong>Organisation:</strong> {move.org_name}</p>}
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Zugewiesene Mitarbeiter</h3>
          {assignedEmployees.length > 0 ? (
            <ul className="space-y-2">
              {assignedEmployees.map(employee => (
                <li key={employee.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                  <span>{employee.first_name} {employee.last_name}</span>
                  <button
                    onClick={() => onRemoveEmployee(employee.assignmentId)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Entfernen
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Keine Mitarbeiter zugewiesen</p>
          )}
        </div>

        <div>
          <h3 className="font-semibold mb-2">Mitarbeiter zuweisen</h3>
          <div className="grid grid-cols-2 gap-2">
            {employees
              .filter(employee => !assignedEmployees.some(ae => ae.id === employee.id))
              .map(employee => (
                <button
                  key={employee.id}
                  onClick={() => handleAssign(employee.id)}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm"
                >
                  {employee.first_name} {employee.last_name}
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoveDetailsPopup; 