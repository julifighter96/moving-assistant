// src/App.js
import React, { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import LoginWrapper from './modules/inspection/components/LoginWrapper';
import ModulePortal from './modules/inspection/components/ModulePortal';
import InspectionModule from './modules/inspection/InspectionModule';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import EmployeeModule from './modules/employees/EmployeeModule';
import InspectionRoutes from './modules/inspection/routes/InspectionRoutes';

const App = () => {
  console.log('App rendering...');
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Routes>
        {isAuthenticated ? (
          <>
            <Route path="/" element={<ModulePortal />} />
            <Route path="/inspections/*" element={<InspectionRoutes />} />
            <Route path="/employees/*" element={<EmployeeModule />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        ) : (
          <>
            <Route path="/" element={<LoginWrapper />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </Router>
  );
};

export default App;