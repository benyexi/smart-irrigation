// Root component — React Router v6 routes
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AppLayout from './components/Layout/AppLayout';

import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Monitor from './pages/Monitor/Monitor';
import Setup from './pages/Setup/Setup';
import History from './pages/History/History';
import Knowledge from './pages/Knowledge/Knowledge';
import Alerts from './pages/Alerts/Alerts';
import Settings from './pages/Settings/Settings';

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route
      path="/"
      element={
        <RequireAuth>
          <AppLayout />
        </RequireAuth>
      }
    >
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="monitor" element={<Monitor />} />
      <Route path="setup" element={<Setup />} />
      <Route path="history" element={<History />} />
      <Route path="knowledge" element={<Knowledge />} />
      <Route path="alerts" element={<Alerts />} />
      <Route path="settings" element={<Settings />} />
    </Route>
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

const App: React.FC = () => (
  <ConfigProvider
    locale={zhCN}
    theme={{
      token: {
        colorPrimary: '#52c41a',
        colorLink: '#52c41a',
        borderRadius: 6,
      },
    }}
  >
    <AuthProvider>
      <BrowserRouter basename="/smart-irrigation">
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  </ConfigProvider>
);

export default App;
