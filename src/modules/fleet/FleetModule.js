import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FleetCalendar from './components/FleetCalendar';
import FleetOverview from './components/FleetOverview';
import { PlusCircle, Calendar, ArrowLeft } from 'lucide-react';

const FleetModule = () => {
  const [view, setView] = useState('overview'); // 'overview' oder 'calendar'
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Zurück zum Hauptmenü
          </button>
          <h1 className="text-2xl font-bold">Fuhrpark Management</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setView(view === 'overview' ? 'calendar' : 'overview')}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 border rounded-md"
          >
            <Calendar className="w-5 h-5 mr-2" />
            {view === 'overview' ? 'Kalenderansicht' : 'Listenansicht'}
          </button>
          <button
            onClick={() => navigate('/fleet/new')}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Neuer LKW
          </button>
        </div>
      </div>

      {view === 'overview' ? <FleetOverview /> : <FleetCalendar />}
    </div>
  );
};

export default FleetModule; 