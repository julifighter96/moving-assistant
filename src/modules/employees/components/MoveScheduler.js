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
  const [moves, setMoves] = useState([]);
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
      const [employeesRes, assignmentsRes, movesRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/assignments'),
        fetch('/api/deals')
      ]);

      const [employeesData, assignmentsData, movesData] = await Promise.all([
        employeesRes.json(),
        assignmentsRes.json(),
        movesRes.json()
      ]);

      console.log('Fetched moves:', movesData);
      setEmployees(employeesData || []);
      setMoves(movesData || []);
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setEmployees([]);
      setMoves([]);
      setAssignments([]);
    }
  };

  const handleEmployeeAssignment = async (employeeId, moveId, startDate, endDate) => {
    try {
      console.log('Assigning employee:', {
        employeeId,
        moveId,
        startDate,
        endDate
      });

      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: employeeId,
          deal_id: moveId,
          start_datetime: startDate.toISOString(),
          end_datetime: endDate.toISOString(),
          task_type: 'moving'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Assignment failed:', data);
        throw new Error(data.error || 'Fehler beim Zuweisen des Mitarbeiters');
      }

      console.log('Assignment successful:', data);
      
      // Aktualisiere die Zuweisungen
      await fetchData();
      
      // Optional: Zeige Erfolgsmeldung
      alert('Mitarbeiter erfolgreich zugewiesen');
    } catch (error) {
      console.error('Error assigning employee:', error);
      alert(error.message);
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    try {
      console.log('Removing assignment:', assignmentId); // Debug-Log

      const response = await fetch(`/api/assignments/${assignmentId}`, {
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

  const calendarEvents = React.useMemo(() => {
    return moves.map(move => ({
      id: move.id,
      title: `Umzug: ${move.title}`,
      start: new Date(move.move_date),
      end: new Date(move.move_date),
      resource: move,
      allDay: true,
      eventType: 'move',
      color: getEventColor(move, assignments)
    }));
  }, [moves, assignments]);

  // Funktion zum Filtern der Umzüge für einen bestimmten Tag
  const getMovesForDate = (date) => {
    return moves.filter(move => {
      const moveDate = new Date(move.move_date);
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
                onClick={() => navigate('/employees')}
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
                views={['month', 'week']}
                defaultView="month"
                style={{ height: 700 }}
                onSelectEvent={setSelectedEvent}
                eventPropGetter={(event) => ({
                  style: {
                    backgroundColor: event.color,
                    borderRadius: '4px',
                    border: 'none',
                    color: 'white',
                    padding: '2px 5px'
                  }
                })}
                tooltipAccessor={event => {
                  if (event.eventType === 'move') {
                    return `${event.title}\nVon: ${event.resource.origin_address}\nNach: ${event.resource.destination_address}`;
                  }
                  return event.title;
                }}
                messages={{
                  week: 'Woche',
                  month: 'Monat',
                  today: 'Heute',
                  previous: 'Zurück',
                  next: 'Vor'
                }}
              />
            </div>
          </div>
        </DndProvider>

        {selectedEvent && (
          <MoveDetailsPopup
            move={selectedEvent.resource}
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