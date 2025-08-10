import React from 'react';
import { MapPin, CalendarCheck, Navigation } from 'lucide-react';

const RouteNavigation = ({ onSelect }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Routenplanung</h2>
      <p className="text-gray-600 mb-6">Wählen Sie die gewünschte Art der Routenplanung</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          onClick={() => onSelect('tour-planner')}
          className="flex flex-col items-center bg-gray-50 hover:bg-primary-50 border border-gray-200 rounded-lg p-6 transition-colors"
        >
          <MapPin className="h-12 w-12 text-primary mb-3" />
          <h3 className="font-medium text-lg">Tourenplanung</h3>
          <p className="text-sm text-gray-500 text-center mt-2">
            Planen Sie Touren mit Drag & Drop aus beliebigen Projekten
          </p>
        </button>
        
        <button
          onClick={() => onSelect('route-planner')}
          className="flex flex-col items-center bg-gray-50 hover:bg-primary-50 border border-gray-200 rounded-lg p-6 transition-colors"
        >
          <CalendarCheck className="h-12 w-12 text-primary mb-3" />
          <h3 className="font-medium text-lg">Tagesroutenplaner</h3>
          <p className="text-sm text-gray-500 text-center mt-2">
            Sehen Sie alle Aufträge für einen bestimmten Tag
          </p>
        </button>
        
        <button
          onClick={() => onSelect('tour-planning-v2')}
          className="flex flex-col items-center bg-gray-50 hover:bg-primary-50 border border-gray-200 rounded-lg p-6 transition-colors"
        >
          <Navigation className="h-12 w-12 text-primary mb-3" />
          <h3 className="font-medium text-lg">Tourenplanung v2</h3>
          <p className="text-sm text-gray-500 text-center mt-2">
            Erweiterte Tourenplanung mit neuen Features
          </p>
        </button>
      </div>
    </div>
  );
};

export default RouteNavigation; 