// src/modules/shared/components/TabletHeader.js
import React from 'react';
import { ArrowLeft, Home, ClipboardList, MapPin, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import logo from '../assets/images/Riedlin-Logo-512px_Neu.webp';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack || (() => navigate('/'))}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Zurück
            </button>
            {currentDeal && (
              <span className="text-sm text-gray-600">
                Deal: {currentDeal.id}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={onHomeClick}
              className="text-gray-600 hover:text-gray-900"
            >
              🏠 Home
            </button>
            <button
              onClick={onInspectionsClick}
              className="text-gray-600 hover:text-gray-900"
            >
              📋 Inspektionen
            </button>
            <button
              onClick={onRouteClick}
              className="text-gray-600 hover:text-gray-900"
            >
              📍 Route
            </button>
            <button
              onClick={onAdminClick}
              className="text-gray-600 hover:text-gray-900"
            >
              ⚙️ Admin
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TabletHeader;