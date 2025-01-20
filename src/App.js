// src/App.js
import React, { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import LoginWrapper from './modules/inspection/components/LoginWrapper';
import ModulePortal from './modules/inspection/components/ModulePortal';
import InspectionModule from './modules/inspection/InspectionModule';
import { BrowserRouter as Router } from 'react-router-dom';

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
      {isAuthenticated ? (
        <>
          {console.log('App.js - Rendering authenticated content', { currentModule })}
          {currentModule === 'portal' ? (
            <ModulePortal onInspectionStart={() => setCurrentModule('inspection')} />
          ) : (
            <InspectionModule onBack={handleBackToPortal} />
          )}
        </>
      ) : (
        <>
          {console.log('App.js - Rendering LoginWrapper')}
          <LoginWrapper />
        </>
      )}
    </Router>
  );
};

export default App;