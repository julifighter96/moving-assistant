import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/de';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useNavigate } from 'react-router-dom';
import EmployeeCard from './EmployeeCard';
import MoveDetailsPopup from './MoveDetailsPopup';
import DayDetailsPopup from './DayDetailsPopup';

const localizer = momentLocalizer(moment);
moment.locale('de');

const getEventColor = (inspection, assignments) => {
  // Finde alle Assignments für diesen Umzug
  const inspectionAssignments = assignments.filter(a => a.inspection_id === inspection.id);
  const assignedEmployeesCount = inspectionAssignments.length;

  // Farbschema basierend auf Status und Mitarbeiteranzahl
  if (inspection.status === 'completed') {
    return '#10B981'; // Grün für abgeschlossene Umzüge
  } else if (inspection.status === 'cancelled') {
    return '#EF4444'; // Rot für stornierte Umzüge
  } else {
    // Farbabstufungen basierend auf der Anzahl zugewiesener Mitarbeiter
    if (assignedEmployeesCount === 0) {
      return '#F87171'; // Rot - keine Mitarbeiter
    } else if (assignedEmployeesCount < 2) {
      return '#FBBF24'; // Gelb - weniger als 2 Mitarbeiter
    } else if (assignedEmployeesCount < 3) {
      return '#60A5FA'; // Blau - 2 Mitarbeiter
    } else {
      return '#34D399'; // Grün - 3 oder mehr Mitarbeiter
    }
  }
};

const ColorLegend = () => (
  <div className="bg-white p-4 rounded-lg shadow mb-4">
    <h3 className="font-medium mb-2">Legende</h3>
    <div className="grid grid-cols-2 gap-4">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F87171' }}></div>
        <span className="text-sm">Keine Mitarbeiter</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FBBF24' }}></div>
        <span className="text-sm">1 Mitarbeiter</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#60A5FA' }}></div>
        <span className="text-sm">2 Mitarbeiter</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#34D399' }}></div>
        <span className="text-sm">3+ Mitarbeiter</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10B981' }}></div>
        <span className="text-sm">Abgeschlossen</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#EF4444' }}></div>
        <span className="text-sm">Storniert</span>
      </div>
    </div>
  </div>
);

const MoveScheduler = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [view, setView] = useState('week');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [employeesRes, inspectionsRes, assignmentsRes] = await Promise.all([
        fetch('/moving-assistant/api/employees'),
        fetch('/moving-assistant/api/inspections'),
        fetch('/moving-assistant/api/assignments')
      ]);

      const [employeesData, inspectionsData, assignmentsData] = await Promise.all([
        employeesRes.json(),
        inspectionsRes.json(),
        assignmentsRes.json()
      ]);

      setEmployees(employeesData || []);
      setInspections(inspectionsData || []);
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      
      console.log('Fetched assignments:', assignmentsData); // Debug-Log
    } catch (error) {
      console.error('Error fetching data:', error);
      setEmployees([]);
      setInspections([]);
      setAssignments([]);
    }
  };

  const handleEmployeeAssignment = async (employeeId, inspectionId, startDate, endDate) => {
    try {
      console.log('Assigning employee:', { employeeId, inspectionId, startDate, endDate }); // Debug-Log

      const response = await fetch('/moving-assistant/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          inspectionId,
          startDate,
          endDate
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign employee');
      }

      await fetchData(); // Aktualisiere die Daten
    } catch (error) {
      console.error('Error assigning employee:', error);
      setShowConflictWarning({
        type: 'error',
        message: 'Fehler beim Zuweisen des Mitarbeiters: ' + error.message
      });
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    try {
      console.log('Removing assignment:', assignmentId); // Debug-Log

      const response = await fetch(`/moving-assistant/api/assignments/${assignmentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to remove assignment');
      }

      await fetchData(); // Aktualisiere die Daten nach erfolgreicher Entfernung
    } catch (error) {
      console.error('Error removing assignment:', error);
      setShowConflictWarning({
        type: 'error',
        message: 'Fehler beim Entfernen des Mitarbeiters'
      });
    }
  };

  const calendarEvents = inspections.map(inspection => {
    const eventColor = getEventColor(inspection, assignments);
    return {
      id: inspection.id,
      title: `${inspection.customer_name} - ${inspection.address}`,
      start: new Date(`${inspection.moving_date}T08:00:00`),
      end: new Date(`${inspection.moving_date}T17:00:00`),
      resource: inspection,
      color: eventColor
    };
  });

  // Funktion zum Filtern der Umzüge für einen bestimmten Tag
  const getMovesForDate = (date) => {
    return inspections.filter(inspection => {
      const moveDate = new Date(inspection.moving_date);
      return moveDate.toDateString() === date.toDateString();
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold">Umzugsplanung</h1>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/moving-assistant/employees')}
                className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                Zurück zur Übersicht
              </button>
              <select
                className="border rounded px-3 py-1"
                value={view}
                onChange={(e) => setView(e.target.value)}
              >
                <option value="week">Wochenansicht</option>
                <option value="month">Monatsansicht</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <DndProvider backend={HTML5Backend}>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-3">
              <ColorLegend />
              {/* Mitarbeiterliste */}
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-4">Verfügbare Mitarbeiter</h2>
                <div className="space-y-2">
                  {employees.map(employee => (
                    <EmployeeCard
                      key={employee.id}
                      employee={employee}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Kalender */}
            <div className="col-span-9 bg-white rounded-lg shadow p-4">
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                views={['week', 'month']}
                view={view}
                onView={setView}
                style={{ height: 700 }}
                onSelectEvent={setSelectedEvent}
                selectable={true}
                onSelecting={() => true}
                onSelectSlot={(slotInfo) => {
                  const localDate = new Date(slotInfo.start);
                  setSelectedDate(localDate);
                }}
                droppable={false}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                eventPropGetter={(event) => ({
                  className: 'cursor-pointer',
                  style: {
                    backgroundColor: event.color,
                    borderRadius: '4px',
                    border: 'none',
                    color: 'white',
                    padding: '2px 5px'
                  }
                })}
                dayPropGetter={(date) => ({
                  className: 'cursor-pointer hover:bg-gray-50',
                  style: {
                    backgroundColor: 'white'
                  }
                })}
                popup={true}
                components={{
                  timeSlotWrapper: ({ children }) => (
                    <div className="cursor-pointer hover:bg-gray-50">
                      {children}
                    </div>
                  ),
                  eventWrapper: ({ event, children }) => (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const employeeData = JSON.parse(e.dataTransfer.getData('employee'));
                        handleEmployeeAssignment(
                          employeeData.id,
                          event.resource.id,
                          event.start,
                          event.end
                        );
                      }}
                    >
                      {children}
                    </div>
                  )
                }}
              />
            </div>
          </div>
        </DndProvider>

        {selectedEvent && (
          <MoveDetailsPopup
            inspection={selectedEvent.resource}
            onClose={() => setSelectedEvent(null)}
            employees={employees}
            assignments={assignments}
            onAssignEmployee={handleEmployeeAssignment}
            onRemoveEmployee={handleRemoveAssignment}
          />
        )}

        {selectedDate && (
          <DayDetailsPopup
            date={selectedDate}
            moves={getMovesForDate(selectedDate)}
            assignments={assignments}
            employees={employees}
            onClose={() => setSelectedDate(null)}
            onMoveSelect={(move) => {
              setSelectedDate(null);
              setSelectedEvent({ resource: move });
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MoveScheduler; 