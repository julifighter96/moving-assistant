// src/modules/shared/components/TabletHeader.js
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

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
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              Zurück zum Portal
            </button>
          )}
          <img 
            src="/assets/images/Riedlin-Logo-512px_Neu.webp"
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
        
        <div className="flex items-center gap-4">
          {/* Navigation buttons */}
          <button
            onClick={logout}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            Abmelden
          </button>
        </div>
      </div>
    </header>
  );
};

export default TabletHeader;