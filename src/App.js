// src/App.js
import React from 'react';
import { useAuth } from './context/AuthContext';
import LoginWrapper from './modules/inspection/components/LoginWrapper';
import ModulePortal from './modules/inspection/components/ModulePortal';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import EmployeeModule from './modules/employees/EmployeeModule';
import InspectionRoutes from './modules/inspection/routes/InspectionRoutes';
import VehicleManagement from './components/VehicleManagement/VehicleManagement';
import SyncMoves from './modules/inspection/components/SyncMoves';
import InventoryManagement from './modules/inventory/InventoryManagement';
import MoveExecutionModule from './modules/moves/MoveExecutionModule';

const App = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<LoginWrapper />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<ModulePortal />} />
        <Route path="/inspections/*" element={<InspectionRoutes />} />
        <Route path="/employees/*" element={<EmployeeModule />} />
        <Route path="/vehicles" element={<VehicleManagement />} />
        <Route path="/sync-moves" element={<SyncMoves />} />
        <Route path="/inventory" element={<InventoryManagement />} />
        <Route path="/moves/*" element={<MoveExecutionModule />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;