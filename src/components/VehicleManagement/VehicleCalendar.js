import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

const VehicleCalendar = ({ vehicles, onVehicleSelect }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  };

  const getBookingsForDate = (date) => {
    return vehicles.flatMap(vehicle => 
      vehicle.bookings?.filter(booking => {
        const bookingStart = new Date(booking.start_date);
        const bookingEnd = new Date(booking.end_date);
        return date >= bookingStart && date <= bookingEnd;
      }).map(booking => ({
        ...booking,
        vehicle
      })) || []
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold">
            {currentDate.toLocaleString('de-DE', { month: 'long', year: 'numeric' })}
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-center py-2 text-sm font-medium">
            {day}
          </div>
        ))}
        
        {Array.from({ length: firstDayOfMonth }).map((_, index) => (
          <div key={`empty-${index}`} className="p-2" />
        ))}
        
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), index + 1);
          const bookings = getBookingsForDate(date);
          const isSelected = selectedDate.toDateString() === date.toDateString();
          
          return (
            <div
              key={index}
              onClick={() => setSelectedDate(date)}
              className={`p-2 border rounded cursor-pointer hover:bg-gray-50 ${
                isSelected ? 'bg-primary-50 border-primary' : ''
              }`}
            >
              <div className="text-sm">{index + 1}</div>
              {bookings.length > 0 && (
                <div className="mt-1">
                  {bookings.map((booking, i) => (
                    <div
                      key={i}
                      className="text-xs p-1 bg-primary-100 rounded truncate"
                      onClick={() => onVehicleSelect(booking.vehicle)}
                    >
                      {booking.vehicle.license_plate}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VehicleCalendar; 