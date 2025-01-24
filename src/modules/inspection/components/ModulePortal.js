// src/modules/inspection/components/ModulePortal.js
import React, { useState } from 'react';
import { ClipboardList, Users, Truck, Package, BarChart3, Calendar, MapPin, Settings } from 'lucide-react';
import InspectionModule from '../InspectionModule';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import logo from '../../shared/assets/images/Riedlin-Logo-512px_Neu.webp';
import VehicleManagement from '../../../components/VehicleManagement/VehicleManagement';

const ModulePortal = ({ onInspectionStart }) => {
  const [activeModule, setActiveModule] = useState(null);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const modules = [
    {
      id: 'inspections',
      name: 'Besichtigungen & Planung',
      description: 'Umzugsbesichtigungen durchführen und Angebote erstellen',
      icon: ClipboardList,
      component: InspectionModule,
      onClick: () => navigate('/inspections/module/deals')
    },
    {
      id: 'personnel',
      name: 'Personalmanagement',
      description: 'Mitarbeiter- und Teameinsatzplanung',
      icon: Users,
      component: null,
      onClick: () => navigate('/employees')
    },
    {
      id: 'fleet',
      name: 'Fuhrpark',
      description: 'Fahrzeugverwaltung und Routenplanung',
      icon: Truck,
      component: VehicleManagement,
      onClick: () => navigate('/vehicles')
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
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 h-16 fixed top-0 left-0 right-0 z-50">
        <div className="h-full flex items-center justify-between px-6">
          <div className="flex items-center">
            <img 
              src={logo}
              alt="Riedlin Logo" 
              className="h-16 w-auto"
            />
            <span className="ml-3 text-2xl font-semibold text-neutral-900">
              Umzugshelfer
            </span>
          </div>
          
          <button
            onClick={logout}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            Abmelden
          </button>
        </div>
      </header>

      <div className="min-h-screen bg-gray-50 p-8 pt-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
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
                  onClick={module.onClick || (() => setActiveModule(module.id))}
                  disabled={!module.component && !module.onClick}
                  className={`p-6 bg-white rounded-xl shadow-sm border border-gray-200 
                             hover:border-primary hover:shadow-md transition-all duration-200
                             flex flex-col items-center text-center
                             ${!module.component && !module.onClick ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                >
                  <Icon className="w-12 h-12 mb-4 text-primary" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {module.name}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {module.description}
                  </p>
                  {!module.component && !module.onClick && (
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
    </div>
  );
};

export default ModulePortal;