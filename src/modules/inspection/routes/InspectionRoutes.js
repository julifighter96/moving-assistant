import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import InspectionModule from '../InspectionModule';
import InspectionOverview from '../components/InspectionOverview';
import DailyRoutePlanner from '../components/DailyRoutePlanner';
import DealViewer from '../components/DealViewer';

const InspectionRoutes = () => {
  return (
    <Routes>
      {/* Hauptrouten */}
      <Route path="/" element={<InspectionOverview />} />
      <Route path="/module/*" element={<InspectionModule />} />
      <Route path="/route-planner" element={<DailyRoutePlanner />} />
      
      {/* Weiterleitungen */}
      <Route path="/module" element={<Navigate to="/inspections/module/deals" replace />} />
      <Route path="/module/admin" element={<InspectionModule />} />
      <Route path="*" element={<Navigate to="/inspections" replace />} />
    </Routes>
  );
};

export default InspectionRoutes; 