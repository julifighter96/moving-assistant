import React, { useEffect, useState } from 'react';
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
  const [moves, setMoves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [employeesRes, assignmentsRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/assignments')
      ]);

      const [employeesData, assignmentsData] = await Promise.all([
        employeesRes.json(),
        assignmentsRes.json()
      ]);

      setEmployees(employeesData);
      setAssignments(assignmentsData);

      // Fetch moves
      const movesResponse = await fetch('/api/deals');
      if (!movesResponse.ok) throw new Error('Fehler beim Laden der Umzüge');
      const movesData = await movesResponse.json();
      console.log('TeamScheduler - Received moves from API:', movesData);
      setMoves(movesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const allEvents = React.useMemo(() => {
    // Assignment events
    const assignmentEvents = assignments.map(assignment => ({
      id: assignment.id,
      title: `Team ${assignment.team_name || 'Zuweisung'}`,
      start: new Date(assignment.start_datetime),
      end: new Date(assignment.end_datetime),
      resource: assignment,
      eventType: 'assignment'
    }));

    // Move events - exactly like VehicleCalendar
    const moveEvents = moves.map(move => ({
      id: move.id,
      title: `Umzug: ${move.title}`,
      start: new Date(move.move_date),
      end: new Date(move.move_date),
      resource: move,
      allDay: true,
      eventType: 'move'
    }));

    return [...assignmentEvents, ...moveEvents];
  }, [assignments, moves]);

  const eventStyleGetter = (event) => {
    switch (event.eventType) {
      case 'move':
        return {
          style: {
            backgroundColor: '#dcfce7',
            borderColor: '#16a34a',
            color: '#166534',
            borderLeft: '4px solid #16a34a'
          }
        };
      case 'assignment':
        return {
          style: {
            backgroundColor: '#dbeafe',
            borderColor: '#2563eb',
            color: '#1e40af',
            borderLeft: '4px solid #2563eb'
          }
        };
      default:
        return {};
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <DndProvider backend={HTML5Backend}>
          <div className="grid grid-cols-12 gap-6">
            {/* Employee list */}
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

            {/* Calendar - exactly like VehicleCalendar */}
            <div className="col-span-9 bg-white rounded-lg shadow p-4">
              <Calendar
                localizer={localizer}
                events={allEvents}
                views={['month', 'week']}
                defaultView="month"
                style={{ height: 700 }}
                eventPropGetter={eventStyleGetter}
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
      </div>
    </div>
  );
};

export default TeamScheduler; 