import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/de';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useNavigate } from 'react-router-dom';
import EmployeeCard from './EmployeeCard';
import EventDetailsPanel from './EventDetailsPanel';
import ConflictWarning from './ConflictWarning';

const localizer = momentLocalizer(moment);
moment.locale('de');

const TeamScheduler = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [view, setView] = useState('week');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showConflictWarning, setShowConflictWarning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchInspections = async () => {
    try {
      const response = await fetch('/moving-assistant/api/inspections');
      if (!response.ok) {
        throw new Error('Failed to fetch inspections');
      }
      const data = await response.json();
      setInspections(data);
    } catch (error) {
      console.error('Error fetching inspections:', error);
    }
  };

  const fetchData = async () => {
    try {
      const [teamsRes, employeesRes, assignmentsRes] = await Promise.all([
        fetch('/moving-assistant/api/teams'),
        fetch('/moving-assistant/api/employees'),
        fetch('/moving-assistant/api/assignments')
      ]);

      const [teamsData, employeesData, assignmentsData] = await Promise.all([
        teamsRes.json(),
        employeesRes.json(),
        assignmentsRes.json()
      ]);

      await fetchInspections(); // Lade Inspektionen
      setTeams(teamsData);
      setEmployees(employeesData);
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const checkQualifications = (employeeId, inspectionId) => {
    // Implementiere Qualifikationsprüfung
    return true;
  };

  const checkAvailability = (employeeId, startDate, endDate) => {
    // Prüfe ob Mitarbeiter im Zeitraum verfügbar ist
    return true;
  };

  const handleEmployeeAssignment = (employeeId, teamId, startDate, endDate) => {
    if (!checkQualifications(employeeId, teamId)) {
      setShowConflictWarning({
        type: 'qualification',
        message: 'Mitarbeiter hat nicht die erforderlichen Qualifikationen'
      });
      return;
    }

    if (!checkAvailability(employeeId, startDate, endDate)) {
      setShowConflictWarning({
        type: 'availability',
        message: 'Mitarbeiter ist in diesem Zeitraum bereits verplant'
      });
      return;
    }

    // Speichere Zuweisung
    saveAssignment(employeeId, teamId, startDate, endDate);
  };

  const saveAssignment = async (employeeId, teamId, startDate, endDate) => {
    try {
      const response = await fetch('/moving-assistant/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          teamId,
          startDate,
          endDate
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save assignment');
      }

      fetchData(); // Aktualisiere Daten
    } catch (error) {
      console.error('Error saving assignment:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold">Team- und Einsatzplanung</h1>
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
            {/* Mitarbeiterliste */}
            <div className="col-span-3 bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-4">Mitarbeiter</h2>
              <div className="space-y-2">
                {employees.map(employee => (
                  <EmployeeCard
                    key={employee.id}
                    employee={employee}
                    onDragStart={() => {}}
                  />
                ))}
              </div>
            </div>

            {/* Kalender */}
            <div className="col-span-9 bg-white rounded-lg shadow p-4">
              <Calendar
                localizer={localizer}
                events={assignments.map(assignment => ({
                  title: `Team ${assignment.team_name}`,
                  start: new Date(assignment.start_datetime),
                  end: new Date(assignment.end_datetime),
                  resource: assignment
                }))}
                views={['week', 'month']}
                view={view}
                onView={setView}
                style={{ height: 700 }}
                onSelectEvent={setSelectedEvent}
                onDropFromOutside={handleEmployeeAssignment}
                droppable={true}
              />
            </div>
          </div>
        </DndProvider>

        {/* Details-Panel */}
        {selectedEvent && (
          <EventDetailsPanel
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onUpdate={fetchData}
          />
        )}

        {/* Konflikt-Warnung */}
        {showConflictWarning && (
          <ConflictWarning
            warning={showConflictWarning}
            onClose={() => setShowConflictWarning(null)}
          />
        )}
      </div>
    </div>
  );
};

export default TeamScheduler; 