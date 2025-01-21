import React from 'react';
import { Routes, Route } from 'react-router-dom';
import InspectionModule from '../InspectionModule';
import InspectionOverview from '../components/InspectionOverview';
import DailyRoutePlanner from '../components/DailyRoutePlanner';
import DealViewer from '../components/DealViewer';

const InspectionRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<InspectionModule />} />
      <Route path="/overview" element={<InspectionOverview />} />
      <Route path="/route-planner" element={<DailyRoutePlanner />} />
      <Route path="/deals" element={<DealViewer />} />
    </Routes>
  );
};

export default InspectionRoutes; 