// src/App.js
import React from 'react';
import { useAuth } from './context/AuthContext';
import LoginWrapper from './modules/inspection/components/LoginWrapper';
import ModulePortal from './modules/inspection/components/ModulePortal';

const App = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <ModulePortal /> : <LoginWrapper />;
};

export default App;