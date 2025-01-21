import React from 'react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

const MoveDetailsPopup = ({ inspection, onClose, employees, assignments, onAssignEmployee, onRemoveEmployee }) => {
  // Sicherstellen, dass assignments ein Array ist
  const assignmentsArray = Array.isArray(assignments) ? assignments : [];
  
  // Filtere verfügbare Mitarbeiter (die noch nicht zugewiesen sind)
  const assignedEmployeeIds = assignmentsArray
    .filter(a => a.inspection_id === inspection.id)
    .map(a => a.employee_id);
    
  // Prüfe ob ein Mitarbeiter zu einer bestimmten Zeit verfügbar ist
  const isEmployeeAvailable = (employeeId, date) => {
    const startTime = new Date(`${date}T08:00:00`);
    const endTime = new Date(`${date}T17:00:00`);

    // Prüfe alle bestehenden Assignments
    const hasConflict = assignmentsArray.some(assignment => {
      if (assignment.employee_id !== employeeId) return false;

      const assignmentStart = parseISO(assignment.start_datetime);
      const assignmentEnd = parseISO(assignment.end_datetime);

      // Prüfe ob sich die Zeiträume überschneiden
      return isWithinInterval(startTime, { start: assignmentStart, end: assignmentEnd }) ||
             isWithinInterval(endTime, { start: assignmentStart, end: assignmentEnd }) ||
             isWithinInterval(assignmentStart, { start: startTime, end: endTime });
    });

    return !hasConflict;
  };

  // Filtere verfügbare Mitarbeiter (die noch nicht zugewiesen sind und keine Zeitkonflikte haben)
  const availableEmployees = (Array.isArray(employees) ? employees : [])
    .filter(emp => 
      !assignedEmployeeIds.includes(emp.id) && 
      emp.status === 'active' &&
      isEmployeeAvailable(emp.id, inspection.moving_date)
    );

  const handleAssignEmployee = (employeeId) => {
    onAssignEmployee(
      employeeId,
      inspection.id,
      `${inspection.moving_date}T08:00:00`,
      `${inspection.moving_date}T17:00:00`
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2">
              {inspection.customer_name}
            </h2>
            <p className="text-gray-600">
              {format(new Date(inspection.moving_date), 'EEEE, d. MMMM yyyy', { locale: de })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Linke Spalte: Umzugsdetails */}
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-lg mb-2">Umzugsdetails</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Adresse</p>
                  <p className="font-medium">{inspection.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Notizen</p>
                  <p className="font-medium">{inspection.notes}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-sm ${
                    inspection.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    inspection.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {inspection.status === 'pending' ? 'Ausstehend' : 
                     inspection.status === 'completed' ? 'Abgeschlossen' : 
                     inspection.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Rechte Spalte: Mitarbeiterverwaltung */}
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-lg mb-2">Zugewiesene Mitarbeiter</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                {assignmentsArray
                  .filter(a => a.inspection_id === inspection.id)
                  .map(assignment => {
                    const employee = employees.find(e => e.id === assignment.employee_id);
                    return employee ? (
                      <div 
                        key={assignment.id} 
                        className="flex justify-between items-center p-2 bg-white rounded mb-2"
                      >
                        <span>{employee.first_name} {employee.last_name}</span>
                        <button
                          onClick={() => onRemoveEmployee(assignment.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Entfernen
                        </button>
                      </div>
                    ) : null;
                  })}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-lg mb-2">Verfügbare Mitarbeiter</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                {availableEmployees.length === 0 ? (
                  <p className="text-gray-500 text-sm">Keine weiteren Mitarbeiter verfügbar</p>
                ) : (
                  availableEmployees.map(employee => (
                    <div 
                      key={employee.id}
                      className="flex justify-between items-center p-2 bg-white rounded mb-2"
                    >
                      <span>{employee.first_name} {employee.last_name}</span>
                      <button
                        onClick={() => handleAssignEmployee(employee.id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Hinzufügen
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoveDetailsPopup; 