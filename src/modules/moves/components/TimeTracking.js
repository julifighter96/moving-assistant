import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const TimeTracking = ({ executionId, status }) => {
  const [timeRecords, setTimeRecords] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (executionId) {
      fetchTimeRecords();
      // Aktualisiere Zeiterfassung alle 30 Sekunden
      const fetchInterval = setInterval(fetchTimeRecords, 30000);
      return () => clearInterval(fetchInterval);
    }
  }, [executionId]);

  // Timer für laufende Zeit
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTimeRecords = async () => {
    try {
      const response = await fetch(`/api/moves/${executionId}/time-records`);
      if (!response.ok) throw new Error('Fehler beim Laden der Zeiterfassung');
      const data = await response.json();
      setTimeRecords(data);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    // Konvertiere den UTC String zu lokalem Datum
    const date = new Date(dateString);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDuration = (start, end, breakStart, breakEnd) => {
    if (!start) return '0:00';
    
    // Konvertiere zu lokaler Zeit
    const startTime = new Date(start);
    const localStartTime = new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000);
    const endTime = end ? new Date(end) : new Date();
    const localEndTime = end ? 
      new Date(endTime.getTime() - endTime.getTimezoneOffset() * 60000) : 
      endTime;
    
    // Berechne die Differenz in Millisekunden
    let diffMs = localEndTime - localStartTime;
    
    // Ziehe Pausenzeit ab wenn vorhanden
    if (breakStart && (breakEnd || status === 'paused')) {
      const breakStartTime = new Date(breakStart);
      const localBreakStartTime = new Date(breakStartTime.getTime() - breakStartTime.getTimezoneOffset() * 60000);
      const breakEndTime = breakEnd ? new Date(breakEnd) : new Date();
      const localBreakEndTime = breakEnd ? 
        new Date(breakEndTime.getTime() - breakEndTime.getTimezoneOffset() * 60000) : 
        breakEndTime;
      diffMs -= (localBreakEndTime - localBreakStartTime);
    }
    
    // Konvertiere zu Stunden und Minuten
    const diffSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Clock className="w-5 h-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-semibold">Zeiterfassung</h3>
        </div>
        <p className="text-center text-gray-500">Lade Zeiterfassung...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Clock className="w-5 h-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-semibold">Zeiterfassung</h3>
        </div>
        <p className="text-center text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <Clock className="w-5 h-5 text-gray-500 mr-2" />
        <h3 className="text-lg font-semibold">Zeiterfassung</h3>
      </div>

      <div className="space-y-4">
        {timeRecords.map(record => (
          <div
            key={record.id}
            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <p className="font-medium">{record.employee_name}</p>
              <p className="text-sm text-gray-500">
                Start: {formatTime(record.start_time)}
              </p>
              {record.break_start && status === 'paused' && (
                <p className="text-sm text-yellow-600">
                  Pause seit: {formatTime(record.break_start)}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">
                {formatDuration(record.start_time, record.end_time, record.break_start, record.break_end)}
              </p>
              {status === 'paused' && !record.break_end && (
                <p className="text-sm text-yellow-600">Pause</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimeTracking; 