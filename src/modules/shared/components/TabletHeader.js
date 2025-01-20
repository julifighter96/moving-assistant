// src/modules/shared/components/TabletHeader.js
import React from 'react';
import { ArrowLeft, Home, ClipboardList, MapPin, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import logo from '../assets/images/Riedlin-Logo-512px_Neu.webp';

const TabletHeader = ({ 
  currentDeal, 
  onAdminClick, 
  onHomeClick, 
  onInspectionsClick, 
  onRouteClick,
  onBack,
  title = "Umzugshelfer"
}) => {
  const { logout } = useAuth();

  return (
    <header className="bg-white border-b border-neutral-200 h-16 fixed top-0 left-0 right-0 z-50">
      <div className="h-full flex items-center justify-between px-6">
        <div className="flex items-center">
          {onBack && (
            <button
              onClick={onBack}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
            >
              ← Zurück zum Hauptmenü
            </button>
          )}
          <img 
            src={logo}
            alt="Riedlin Logo" 
            className="h-16 w-auto"
          />
          <span className="ml-3 text-2xl font-semibold text-neutral-900">
            {title}
          </span>
        </div>
        
        {currentDeal && (
          <div className="flex items-center px-4 py-2 bg-primary-light rounded-lg mr-4">
            <span className="text-primary font-medium">
              {currentDeal.title || 'Aktueller Deal'}
            </span>
          </div>
        )}
        
        <nav className="flex items-center space-x-2">
          <button 
            onClick={onHomeClick}
            className="h-12 px-4 flex items-center justify-center rounded-lg hover:bg-neutral-100 active:bg-neutral-200"
          >
            <Home className="h-6 w-6" />
            <span className="ml-2 text-base">Home</span>
          </button>

          <button 
            onClick={onInspectionsClick}
            className="h-12 px-4 flex items-center justify-center rounded-lg hover:bg-neutral-100 active:bg-neutral-200"
          >
            <ClipboardList className="h-6 w-6" />
            <span className="ml-2 text-base">Inspektionen</span>
          </button>

          <button 
            onClick={onRouteClick}
            className="h-12 px-4 flex items-center justify-center rounded-lg hover:bg-neutral-100 active:bg-neutral-200"
          >
            <MapPin className="h-6 w-6" />
            <span className="ml-2 text-base">Routen</span>
          </button>

          <button 
            onClick={onAdminClick}
            className="h-12 px-4 flex items-center justify-center rounded-lg hover:bg-neutral-100 active:bg-neutral-200"
          >
            <Settings className="h-6 w-6" />
            <span className="ml-2">Admin</span>
          </button>

          <button
            onClick={logout}
            className="h-12 px-4 flex items-center justify-center rounded-lg hover:bg-neutral-100 active:bg-neutral-200"
          >
            <LogOut className="h-6 w-6" />
            <span className="ml-2">Abmelden</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default TabletHeader;