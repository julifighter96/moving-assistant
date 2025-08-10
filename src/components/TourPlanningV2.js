/**
 * Tour Planning v2 - Komplett neu strukturiert
 * Unterteilt in 3 Hauptbereiche: Dashboard, Tourenplanung, Aufträge
 */

import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation as Route, 
  FileText, 
  Truck,
  Navigation,
  Calendar,
  Settings
} from 'lucide-react';

// Import der drei Hauptkomponenten
import TourDashboard from './tour-planning/TourDashboard';
import RouteOptimization from './tour-planning/RouteOptimization';
import OrderManagement from './tour-planning/OrderManagement';

const TourPlanningV2 = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  // Simuliere Initialisierung
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const tabs = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: MapPin,
      description: 'Live-Tracking der Fahrzeuge'
    },
    {
      id: 'planning',
      name: 'Tourenplanung',
      icon: Route,
      description: 'Routenoptimierung & Planung'
    },
    {
      id: 'orders',
      name: 'Aufträge',
      icon: FileText,
      description: 'Auftragsverwaltung & Übersicht'
    }
  ];

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tourenplanung v2</h3>
          <p className="text-gray-500">Wird initialisiert...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Truck className="mr-3 h-7 w-7 text-primary" />
              Tourenplanung v2
            </h2>
            <p className="text-gray-500 mt-1">
              Professionelle Tourenplanung mit Live-Tracking und Optimierung
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon
                  className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${activeTab === tab.id ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500'}
                  `}
                />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'dashboard' && <TourDashboard />}
        {activeTab === 'planning' && <RouteOptimization />}
        {activeTab === 'orders' && <OrderManagement />}
      </div>

      {/* Status Bar */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>System Online</span>
            </div>
            <div className="flex items-center">
              <Navigation className="w-4 h-4 mr-1" />
              <span>HERE API Verbunden</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span>Letzte Aktualisierung: {new Date().toLocaleTimeString('de-DE')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourPlanningV2;