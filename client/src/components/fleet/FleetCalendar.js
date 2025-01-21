import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/de';
import 'react-big-calendar/lib/css/react-big-calendar.css';

moment.locale('de');
const localizer = momentLocalizer(moment);

const FleetCalendar = () => {
  const [events, setEvents] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Lade LKWs und ihre Buchungen
        const trucksResponse = await fetch('/moving-assistant/api/trucks');
        const trucksData = await trucksResponse.json();
        setTrucks(trucksData);

        // Konvertiere Buchungen in Kalenderevents
        const calendarEvents = trucksData.flatMap(truck => {
          if (truck.current_order_id) {
            return [{
              title: `${truck.type} (${truck.license_plate})`,
              start: new Date(truck.current_order_start),
              end: new Date(truck.current_order_end),
              resource: truck
            }];
          }
          return [];
        });

        setEvents(calendarEvents);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching fleet data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const eventStyleGetter = (event) => {
    let style = {
      backgroundColor: '#3174ad'
    };

    if (event.resource.status === 'maintenance') {
      style.backgroundColor = '#dc3545';
    }

    return { style };
  };

  if (loading) {
    return <div>Lade Flottendaten...</div>;
  }

  return (
    <div className="fleet-calendar">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        eventPropGetter={eventStyleGetter}
        views={['month', 'week', 'day']}
        messages={{
          next: "Vor",
          previous: "Zurück",
          today: "Heute",
          month: "Monat",
          week: "Woche",
          day: "Tag"
        }}
      />
    </div>
  );
};

export default FleetCalendar; 