import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/de';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { X, Truck, MapPin, Calendar as CalendarIcon, User } from 'lucide-react';

moment.locale('de');
const localizer = momentLocalizer(moment);

const FleetCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [availableTrucks, setAvailableTrucks] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Korrigierte API-Route für Inspektionen
      const inspectionsResponse = await fetch('/moving-assistant/api/admin/inspections');
      const inspections = await inspectionsResponse.json();

      // Lade LKWs mit ihren Zuweisungen
      const trucksResponse = await fetch('/moving-assistant/api/trucks');
      const trucks = await trucksResponse.json();

      // Erstelle Kalenderevents aus den Inspektionen und LKW-Zuweisungen
      const calendarEvents = inspections.reduce((acc, inspection) => {
        if (!inspection.moving_date) return acc; // Überspringe Einträge ohne Datum

        // Finde alle LKWs, die diesem Umzug zugewiesen sind
        const assignedTrucks = trucks.filter(truck => 
          truck.current_order_id === inspection.id
        );

        // Wenn keine LKWs zugewiesen sind, zeige trotzdem den Umzug an
        if (assignedTrucks.length === 0) {
          acc.push({
            id: `inspection-${inspection.id}`,
            title: `${inspection.customer_name} (Kein LKW zugewiesen)`,
            start: new Date(inspection.moving_date),
            end: new Date(inspection.moving_date),
            resource: {
              inspection,
              needsTruck: true
            },
            allDay: true
          });
        } else {
          assignedTrucks.forEach(truck => {
            acc.push({
              id: `${truck.id}-${inspection.id}`,
              title: `${truck.type} (${truck.license_plate}) - ${inspection.customer_name}`,
              start: new Date(inspection.moving_date),
              end: new Date(inspection.moving_date),
              resource: {
                truck,
                inspection
              },
              allDay: true
            });
          });
        }

        return acc;
      }, []);

      setEvents(calendarEvents);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const eventStyleGetter = (event) => {
    let style = {
      backgroundColor: '#3174ad',
      borderRadius: '4px',
      opacity: 1,
      color: 'white',
      border: '0',
      display: 'block',
      padding: '4px 8px',
      fontSize: '0.9rem',
      fontWeight: '500',
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
    };

    if (event.resource.needsTruck) {
      style = {
        ...style,
        backgroundColor: '#fbbf24',
        color: '#000',
        border: '2px dashed #d97706',
      };
    } else if (event.resource.truck) {
      if (event.resource.truck.status === 'maintenance') {
        style.backgroundColor = '#ef4444';
      } else if (event.resource.truck.status === 'booked') {
        style.backgroundColor = '#22c55e';
      }
    }

    return { style };
  };

  const messages = {
    next: "Vor",
    previous: "Zurück",
    today: "Heute",
    month: "Monat",
    week: "Woche",
    day: "Tag",
    agenda: "Termine",
    date: "Datum",
    time: "Zeit",
    event: "Termin",
    noEventsInRange: "Keine Buchungen in diesem Zeitraum",
    allDay: "Ganztägig",
    work_week: "Arbeitswoche"
  };

  const handleSelectEvent = async (event) => {
    setSelectedEvent(event);
    
    if (event.resource.needsTruck) {
      try {
        const date = event.start.toISOString().split('T')[0];
        console.log('Fetching available trucks for date:', date);
        
        const response = await fetch(`/moving-assistant/api/trucks/available?date=${date}`);
        if (!response.ok) {
          throw new Error('Fehler beim Laden der verfügbaren LKWs');
        }
        
        const data = await response.json();
        console.log('Available trucks:', data);
        setAvailableTrucks(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching available trucks:', error);
        setAvailableTrucks([]);
        alert('Fehler beim Laden der verfügbaren LKWs: ' + error.message);
      }
    } else {
      setAvailableTrucks([]);
    }
  };

  const handleAssignTruck = async (truckId) => {
    try {
      console.log('Assigning truck:', truckId, 'to inspection:', selectedEvent.resource.inspection.id);
      
      const response = await fetch(`/moving-assistant/api/trucks/${truckId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inspectionId: selectedEvent.resource.inspection.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Zuweisen des LKWs');
      }

      // Aktualisiere die Kalenderansicht
      await fetchData();
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error assigning truck:', error);
      alert('Fehler beim Zuweisen des LKWs: ' + error.message);
    }
  };

  const handleUnassignTruck = async (truckId) => {
    try {
      const response = await fetch(`/moving-assistant/api/trucks/${truckId}/unassign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        await fetchData();
        setSelectedEvent(null);
      }
    } catch (error) {
      console.error('Error unassigning truck:', error);
    }
  };

  const formats = {
    dayFormat: 'dd DD.MM.',
    eventTimeRangeFormat: () => '',
    dayRangeHeaderFormat: ({ start, end }) => {
      return `${moment(start).format('DD. MMMM')} - ${moment(end).format('DD. MMMM YYYY')}`;
    },
    agendaHeaderFormat: ({ start, end }) => {
      return moment(start).format('DD.MM.YYYY');
    },
    agendaDateFormat: (date) => {
      return moment(date).format('DD.MM.YYYY');
    },
    agendaTimeFormat: 'HH:mm',
    agendaTimeRangeFormat: ({ start, end }) => {
      return moment(start).format('DD.MM.YYYY');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Lade Kalenderdaten...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] relative bg-white rounded-lg shadow-sm p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-medium">Umzugskalender</h2>
          <div className="flex items-center space-x-2 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#fbbf24] mr-1"></div>
              <span>Ohne LKW</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#22c55e] mr-1"></div>
              <span>Mit LKW</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#ef4444] mr-1"></div>
              <span>In Wartung</span>
            </div>
          </div>
        </div>
      </div>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 'calc(100% - 48px)' }}
        eventPropGetter={eventStyleGetter}
        views={['month', 'week', 'day', 'agenda']}
        messages={{
          ...messages,
          showMore: total => `+ ${total} weitere`,
          agenda: 'Termine',
          noEventsInRange: 'Keine Termine in diesem Zeitraum',
          allDay: 'Ganztägig'
        }}
        defaultView="week"
        onSelectEvent={handleSelectEvent}
        formats={formats}
        components={{
          agenda: {
            event: (props) => (
              <div className="rbc-agenda-event">
                <span className="text-gray-600 mr-4">
                  {moment(props.event.start).format('DD.MM.YYYY')}
                </span>
                <span>{props.event.title}</span>
              </div>
            )
          }
        }}
        tooltipAccessor={event => 
          `${event.resource.inspection.customer_name}\n` +
          `${event.resource.inspection.address}\n` +
          `${event.resource.truck ? `LKW: ${event.resource.truck.type} (${event.resource.truck.license_plate})` : 'Kein LKW zugewiesen'}`
        }
        popup
        selectable
        className="fleet-calendar"
      />

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Umzugsdetails</h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Kunde:</span>
                  <span>{selectedEvent.resource.inspection.customer_name}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Adresse:</span>
                  <span>{selectedEvent.resource.inspection.address}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Datum:</span>
                  <span>{moment(selectedEvent.start).format('DD.MM.YYYY')}</span>
                </div>

                {selectedEvent.resource.truck ? (
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium mb-2">Zugewiesener LKW</h3>
                        <div className="flex items-center space-x-2">
                          <Truck className="w-5 h-5 text-gray-500" />
                          <span>{selectedEvent.resource.truck.type}</span>
                          <span>({selectedEvent.resource.truck.license_plate})</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnassignTruck(selectedEvent.resource.truck.id)}
                        className="px-4 py-2 text-red-600 border border-red-600 rounded hover:bg-red-50"
                      >
                        LKW entfernen
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-medium mb-4">Verfügbare LKWs</h3>
                    <div className="space-y-2">
                      {availableTrucks.length > 0 ? (
                        availableTrucks.map(truck => (
                          <div key={truck.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center space-x-2">
                              <Truck className="w-5 h-5 text-gray-500" />
                              <span>{truck.type}</span>
                              <span className="text-gray-500">({truck.license_plate})</span>
                            </div>
                            <button
                              onClick={() => handleAssignTruck(truck.id)}
                              className="px-4 py-2 text-primary border border-primary rounded hover:bg-primary hover:text-white"
                            >
                              Zuweisen
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-500 py-4">
                          Keine verfügbaren LKWs für dieses Datum
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetCalendar; 