import React from 'react';
import { Routes, Route } from 'react-router-dom';
import EmployeeList from './components/EmployeeList';
import EmployeeDetail from './components/EmployeeDetail';
import QualificationManager from './components/QualificationManager';
import MoveScheduler from './components/MoveScheduler';
import TeamScheduler from './components/TeamScheduler';

const EmployeeModule = () => {
  return (
    <Routes>
      <Route path="/" element={<EmployeeList />} />
      <Route path="/new" element={<EmployeeDetail />} />
      <Route path="/schedule" element={<MoveScheduler />} />
      <Route path="/team-schedule" element={<TeamScheduler />} />
      <Route path="/:id" element={<EmployeeDetail />} />
      <Route path="/:id/qualifications" element={<QualificationManager />} />
    </Routes>
  );
};

export default EmployeeModule; 