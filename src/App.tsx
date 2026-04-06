import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme as antTheme } from 'antd';
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
import MapPage from './pages/Map/Map';
import Engine from './pages/Engine/Engine';
import Screen from './pages/Screen/Screen';

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    {/* Data screen — standalone, no layout */}
    <Route path="/screen" element={<RequireAuth><Screen /></RequireAuth>} />
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
      <Route path="map" element={<MapPage />} />
      <Route path="engine" element={<Engine />} />
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
      algorithm: antTheme.darkAlgorithm,
      token: {
        colorPrimary: '#00d4aa',
        colorLink: '#00d4aa',
        colorBgBase: '#0f1117',
        colorBgContainer: '#1a1d2e',
        colorBgElevated: '#1a1d2e',
        colorBorder: '#2a2d3e',
        colorBorderSecondary: '#2a2d3e',
        colorText: '#e8eaf0',
        colorTextSecondary: '#8892a4',
        colorTextTertiary: '#4a5568',
        borderRadius: 8,
        borderRadiusLG: 12,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif",
      },
      components: {
        Layout: { headerBg: '#141720', siderBg: '#141720', bodyBg: '#0f1117' },
        Menu: { darkItemBg: 'transparent', darkSubMenuItemBg: 'transparent', darkItemSelectedBg: 'rgba(0,212,170,0.12)', itemSelectedColor: '#00d4aa', itemHoverColor: '#e8eaf0', itemColor: '#8892a4' },
        Card: { colorBgContainer: '#1a1d2e', colorBorderSecondary: '#2a2d3e' },
        Table: { colorBgContainer: '#1a1d2e', headerBg: '#1e2235', borderColor: '#2a2d3e', rowHoverBg: '#1e2235' },
        Input: { colorBgContainer: '#12152a', colorBorder: '#2a2d3e', activeBorderColor: '#00d4aa', hoverBorderColor: '#00d4aa' },
        Select: { colorBgContainer: '#12152a', colorBorder: '#2a2d3e' },
        Button: { colorPrimary: '#00d4aa', colorPrimaryHover: '#00e8bc', colorPrimaryText: '#000' },
        Modal: { contentBg: '#1a1d2e', headerBg: '#1a1d2e' },
        Slider: { trackBg: '#00d4aa', handleColor: '#00d4aa', railBg: '#2a2d3e' },
        Steps: { colorPrimary: '#00d4aa' },
        Tabs: { inkBarColor: '#00d4aa', itemActiveColor: '#00d4aa', itemSelectedColor: '#00d4aa' },
        DatePicker: { colorBgContainer: '#12152a', colorBorder: '#2a2d3e' },
        Progress: { defaultColor: '#00d4aa' },
      },
    }}
  >
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  </ConfigProvider>
);

export default App;
