import React, { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/de';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { MapPin } from 'lucide-react';

const localizer = momentLocalizer(moment);
moment.locale('de');

const VehicleCalendar = ({ vehicles, onVehicleSelect }) => {
  const [moves, setMoves] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [bookings, setBookings] = useState([]);

  // Neue Funktion zum Laden der Buchungen
  const fetchBookings = async (vehicleId) => {
    try {
      const response = await fetch(`/moving-assistant/api/vehicles/${vehicleId}/bookings`);
      if (!response.ok) throw new Error('Fehler beim Laden der Buchungen');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }
  };

  // Lade alle Buchungen beim Start
  useEffect(() => {
    const loadAllBookings = async () => {
      const allBookings = await Promise.all(
        vehicles.map(vehicle => fetchBookings(vehicle.id))
      );
      const flatBookings = allBookings.flat();
      setBookings(flatBookings);
    };

    loadAllBookings();
  }, [vehicles]);

  useEffect(() => {
    const fetchMoves = async () => {
      try {
        const response = await fetch('/moving-assistant/api/deals');
        if (!response.ok) throw new Error('Fehler beim Laden der Umzüge');
        const data = await response.json();
        console.log('VehicleCalendar - Received moves from API:', data);
        setMoves(data);
      } catch (error) {
        console.error('Fehler beim Laden der Umzüge:', error);
      }
    };

    fetchMoves();
  }, []);

  const allEvents = React.useMemo(() => {
    // Fahrzeugbuchungen
    const bookingEvents = vehicles.flatMap(vehicle => 
      vehicle.bookings?.map(booking => ({
        id: booking.id,
        title: `${vehicle.license_plate}`,
        start: new Date(booking.start_date),
        end: new Date(booking.end_date),
        resource: { ...booking, vehicle },
        eventType: 'booking'
      })) || []
    );

    // Umzüge
    const moveEvents = moves.map(move => ({
      id: move.id,
      title: `Umzug: ${move.title}`,
      start: new Date(move.move_date),
      end: new Date(move.move_date),
      resource: move,
      allDay: true,
      eventType: 'move'
    }));

    return [...bookingEvents, ...moveEvents];
  }, [vehicles, moves]);

  const handleSelectEvent = (event) => {
    console.log('Selected event:', event);
    if (event.eventType === 'booking') {
      onVehicleSelect(event.resource.vehicle);
    } else if (event.eventType === 'move') {
      setSelectedEvent(event);
    }
  };

  const eventStyleGetter = (event) => {
    switch (event.eventType) {
      case 'move':
        return {
          style: {
            backgroundColor: '#dcfce7',
            borderColor: '#16a34a',
            color: '#166534',
            borderLeft: '4px solid #16a34a',
            cursor: 'pointer'
          }
        };
      case 'booking':
        return {
          style: {
            backgroundColor: '#dbeafe',
            borderColor: '#2563eb',
            color: '#1e40af',
            borderLeft: '4px solid #2563eb',
            cursor: 'pointer'
          }
        };
      default:
        return {};
    }
  };

  const handleAssignVehicle = async (moveId, vehicleId) => {
    try {
      console.log('Assigning vehicle:', {
        moveId,
        vehicleId,
        moveDate: selectedEvent.start
      });

      const response = await fetch('/moving-assistant/api/vehicles/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicle_id: vehicleId,
          deal_id: moveId,
          start_date: selectedEvent.start.toISOString().split('T')[0],
          end_date: selectedEvent.start.toISOString().split('T')[0]
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Booking failed:', data);
        throw new Error(data.error || 'Fehler beim Zuweisen des Fahrzeugs');
      }

      console.log('Booking successful:', data);
      
      // Aktualisiere die Buchungen für alle Fahrzeuge
      const allBookings = await Promise.all(
        vehicles.map(vehicle => fetchBookings(vehicle.id))
      );
      const flatBookings = allBookings.flat();
      setBookings(flatBookings);
      
      // Aktualisiere die Ansicht
      onVehicleSelect({ ...vehicles.find(v => v.id === vehicleId), bookings: data });
      
      // Schließe das Modal
      setSelectedEvent(null);
      
      // Zeige Erfolgsmeldung
      alert('Fahrzeug erfolgreich zugewiesen');
    } catch (error) {
      console.error('Error assigning vehicle:', error);
      alert(error.message);
    }
  };

  const handleRemoveVehicle = async (vehicleId, moveId) => {
    try {
      // Finde die Buchungs-ID
      const booking = vehicles
        .find(v => v.id === vehicleId)
        ?.bookings
        ?.find(b => b.deal_id === moveId);

      if (!booking) {
        throw new Error('Buchung nicht gefunden');
      }

      const response = await fetch(`/moving-assistant/api/vehicles/bookings/${booking.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Fehler beim Entfernen des Fahrzeugs');
      }

      // Aktualisiere die lokalen Daten
      const updatedVehicles = vehicles.map(vehicle => {
        if (vehicle.id === vehicleId) {
          return {
            ...vehicle,
            bookings: vehicle.bookings.filter(b => b.id !== booking.id)
          };
        }
        return vehicle;
      });

      // Aktualisiere die Ansicht
      onVehicleSelect(updatedVehicles.find(v => v.id === vehicleId));
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error removing vehicle:', error);
      alert('Fehler beim Entfernen des Fahrzeugs');
    }
  };

  // Render-Teil für zugewiesene Fahrzeuge im Modal
  const renderAssignedVehicles = () => {
    if (!selectedEvent || selectedEvent.eventType !== 'move') return null;

    const assignedVehicles = vehicles.filter(vehicle => 
      bookings.some(booking => 
        booking.vehicle_id === vehicle.id && 
        booking.deal_id === selectedEvent.resource.id
      )
    );

    return (
      <div className="mt-4">
        <h3 className="font-semibold mb-2">Zugewiesene Fahrzeuge</h3>
        {assignedVehicles.length > 0 ? (
          assignedVehicles.map(vehicle => (
            <div key={vehicle.id} className="flex justify-between items-center bg-gray-50 p-2 rounded mb-2">
              <span>{vehicle.license_plate} ({vehicle.type})</span>
              <button
                onClick={() => handleRemoveVehicle(vehicle.id, selectedEvent.resource.id)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Entfernen
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-500">Keine Fahrzeuge zugewiesen</p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <Calendar
        localizer={localizer}
        events={allEvents}
        views={['month', 'week']}
        defaultView="month"
        style={{ height: 700 }}
        onSelectEvent={handleSelectEvent}
        selectable={true}
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

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">{selectedEvent.title}</h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <p><strong>Datum:</strong> {selectedEvent.start.toLocaleDateString()}</p>
              {selectedEvent.eventType === 'move' && (
                <>
                  <p><strong>Von:</strong> {selectedEvent.resource.origin_address}</p>
                  <p><strong>Nach:</strong> {selectedEvent.resource.destination_address}</p>
                  {selectedEvent.resource.org_name && (
                    <p><strong>Organisation:</strong> {selectedEvent.resource.org_name}</p>
                  )}

                  {/* Fahrzeugzuweisung */}
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">Fahrzeug zuweisen</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {vehicles
                        .filter(vehicle => {
                          // Filtere bereits gebuchte Fahrzeuge für dieses Datum
                          const isBooked = vehicle.bookings?.some(booking => {
                            const bookingDate = new Date(booking.start_date);
                            const moveDate = selectedEvent.start;
                            return bookingDate.toDateString() === moveDate.toDateString();
                          });
                          return !isBooked;
                        })
                        .map(vehicle => (
                          <button
                            key={vehicle.id}
                            onClick={() => handleAssignVehicle(selectedEvent.resource.id, vehicle.id)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm flex items-center justify-between"
                          >
                            <span>{vehicle.license_plate}</span>
                            <span className="text-xs">
                              ({vehicle.type} - {vehicle.loading_capacity}m³)
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Zugewiesene Fahrzeuge */}
                  {renderAssignedVehicles()}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleCalendar; 