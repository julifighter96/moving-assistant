// src/App.js
import React, { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import LoginWrapper from './modules/inspection/components/LoginWrapper';
import ModulePortal from './modules/inspection/components/ModulePortal';
import InspectionModule from './modules/inspection/InspectionModule';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import EmployeeModule from './modules/employees/EmployeeModule';
import InspectionRoutes from './modules/inspection/routes/InspectionRoutes';
import FleetCalendar from './modules/fleet/components/FleetCalendar';
import FleetOverview from './modules/fleet/components/FleetOverview';
import TruckDetails from './modules/fleet/components/TruckDetails';
import TruckForm from './modules/fleet/components/TruckForm';
import FleetModule from './modules/fleet/FleetModule';

const App = () => {
  const { isAuthenticated } = useAuth();
  const [currentModule, setCurrentModule] = useState('portal'); // 'portal' oder 'inspection'

  useEffect(() => {
    console.log('App.js - Auth Status:', { isAuthenticated });
  }, [isAuthenticated]);

  const handleBackToPortal = () => {
    console.log('Navigating back to portal');
    setCurrentModule('portal');
  };

  return (
    <Router>
      <Routes>
        {isAuthenticated ? (
          <>
            {console.log('App.js - Rendering authenticated content', { currentModule })}
            <Route path="/" element={
              currentModule === 'portal' ? 
                <ModulePortal onInspectionStart={() => setCurrentModule('inspection')} /> :
                <Navigate to="/inspection" />
            } />
            <Route path="/inspection/*" element={
              <InspectionModule onBack={handleBackToPortal} />
            } />
            <Route path="/employees/*" element={<EmployeeModule />} />
            <Route path="/inspections/*" element={<InspectionRoutes />} />
            {/* Fuhrpark Routen */}
            <Route path="/fleet/*" element={<FleetModule />} />
            <Route path="/fleet/new" element={<TruckForm />} />
            <Route path="/fleet/:id" element={<TruckDetails />} />
            {/* Redirect any unknown routes to home */}
            <Route path="*" element={<Navigate to="/" />} />
          </>
        ) : (
          <>
            {console.log('App.js - Rendering LoginWrapper')}
            <Route path="/" element={<LoginWrapper />} />
            {/* Redirect any route to login when not authenticated */}
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </Router>
  );
};

export default App;