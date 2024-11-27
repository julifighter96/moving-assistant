import React, { useState } from 'react';
import { ClipboardList, Users, Truck, Package, BarChart3, Calendar, ArrowLeft } from 'lucide-react';
import App from '../App';
import logo from '../assets/images/Riedlin-Logo-512px_Neu.webp';

const ModulePortal = () => {
  const [activeModule, setActiveModule] = useState(null);

  const modules = [
    {
      id: 'inspections',
      name: 'Besichtigungen & Planung',
      description: 'Umzugsbesichtigungen durchführen und Angebote erstellen',
      icon: ClipboardList,
      component: App
    },
    {
      id: 'personnel',
      name: 'Personalmanagement',
      description: 'Mitarbeiter- und Teameinsatzplanung',
      icon: Users,
      component: null
    },
    {
      id: 'fleet',
      name: 'Fuhrpark',
      description: 'Fahrzeugverwaltung und Routenplanung',
      icon: Truck,
      component: null
    },
    {
      id: 'inventory',
      name: 'Materialwirtschaft',
      description: 'Bestandsverwaltung und Nachbestellung',
      icon: Package,
      component: null
    },
    {
      id: 'calendar',
      name: 'Terminplanung',
      description: 'Umzüge und Ressourcenplanung',
      icon: Calendar,
      component: null
    },
    {
      id: 'analytics',
      name: 'Statistiken & KPIs',
      description: 'Unternehmenskennzahlen und Auswertungen',
      icon: BarChart3,
      component: null
    }
  ];

  if (activeModule) {
    const ModuleComponent = modules.find(m => m.id === activeModule)?.component;
    if (ModuleComponent) {
      return <ModuleComponent onBack={() => setActiveModule(null)} />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <img 
              src={logo}
              alt="Riedlin Logo" 
              className="h-16 w-auto"
            />
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">Umzugsmanager</h1>
              <p className="text-gray-500">Wählen Sie ein Modul aus</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                disabled={!module.component}
                className={`p-6 bg-white rounded-xl shadow-sm border border-gray-200 
                           hover:border-primary hover:shadow-md transition-all duration-200
                           flex flex-col items-center text-center
                           ${!module.component ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
              >
                <Icon className="w-12 h-12 mb-4 text-primary" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {module.name}
                </h3>
                <p className="text-gray-500 text-sm">
                  {module.description}
                </p>
                {!module.component && (
                  <span className="mt-2 text-xs text-gray-400">
                    Demnächst verfügbar
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ModulePortal;