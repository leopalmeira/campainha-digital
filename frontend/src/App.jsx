import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminPanel from './pages/AdminPanel';
import VisitorCall from './pages/VisitorCall';
import ResidentDashboard from './pages/ResidentDashboard';
import AuthPage from './pages/AuthPage';
import MasterAdminDashboard from './pages/MasterAdminDashboard';
import PorteiroDashboard from './pages/PorteiroDashboard';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/login-cliente" element={<AuthPage clientOnly={true} defaultLoginType="code" />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/master-admin" element={<MasterAdminDashboard />} />
        <Route path="/chamada/:id" element={<VisitorCall />} />
        <Route path="/morador/:id" element={<ResidentDashboard />} />
        <Route path="/portaria" element={<PorteiroDashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
