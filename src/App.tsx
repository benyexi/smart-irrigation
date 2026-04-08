import React from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ConfigProvider, theme as antTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AppLayout from './components/Layout/AppLayout';

import Alerts from './pages/Alerts/Alerts';
import Dashboard from './pages/Dashboard/Dashboard';
import Engine from './pages/Engine/Engine';
import History from './pages/History/History';
import Knowledge from './pages/Knowledge/Knowledge';
import Login from './pages/Login/Login';
import MapPage from './pages/Map/Map';
import Monitor from './pages/Monitor/Monitor';
import Screen from './pages/Screen/Screen';
import Settings from './pages/Settings/Settings';
import Sites from './pages/Sites';

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route
      path="/screen"
      element={(
        <RequireAuth>
          <Screen />
        </RequireAuth>
      )}
    />
    <Route
      path="/"
      element={(
        <RequireAuth>
          <AppLayout />
        </RequireAuth>
      )}
    >
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="monitor" element={<Monitor />} />
      <Route path="sites" element={<Sites />} />
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
        colorInfo: '#00d4aa',
        colorSuccess: '#00d4aa',
        colorWarning: '#ff6b35',
        colorError: '#ff4757',
        colorLink: '#00d4aa',
        colorBgBase: '#0f1117',
        colorBgLayout: '#0f1117',
        colorBgContainer: '#1a1d2e',
        colorBgElevated: '#1a1d2e',
        colorBorder: '#2a2d3e',
        colorBorderSecondary: '#2a2d3e',
        colorText: '#e8eaf0',
        colorTextSecondary: '#8892a4',
        colorTextTertiary: '#4a5568',
        borderRadius: 8,
        borderRadiusLG: 12,
        borderRadiusSM: 6,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', sans-serif",
      },
      components: {
        Layout: {
          headerBg: '#141720',
          siderBg: '#141720',
          bodyBg: '#0f1117',
        },
        Menu: {
          darkItemBg: 'transparent',
          darkSubMenuItemBg: 'transparent',
          darkItemSelectedBg: 'rgba(0,212,170,0.15)',
          itemSelectedColor: '#00d4aa',
          itemHoverColor: '#e8eaf0',
          itemColor: '#8892a4',
        },
        Card: {
          colorBgContainer: '#1a1d2e',
          colorBorderSecondary: '#2a2d3e',
        },
        Table: {
          colorBgContainer: '#1a1d2e',
          headerBg: '#1e2235',
          borderColor: '#2a2d3e',
          rowHoverBg: '#1e2235',
        },
        Input: {
          colorBgContainer: '#0f1117',
          colorBorder: '#2a2d3e',
          activeBorderColor: '#00d4aa',
          hoverBorderColor: '#00d4aa',
        },
        Select: {
          colorBgContainer: '#0f1117',
          colorBorder: '#2a2d3e',
          optionSelectedBg: 'rgba(0,212,170,0.15)',
          optionActiveBg: 'rgba(0,212,170,0.1)',
        },
        Button: {
          colorPrimary: '#00d4aa',
          colorPrimaryHover: '#00e8bc',
          colorPrimaryActive: '#00c39c',
          colorPrimaryText: '#0f1117',
        },
        Modal: {
          contentBg: '#1a1d2e',
          headerBg: '#1a1d2e',
          footerBg: '#1a1d2e',
        },
        Slider: {
          trackBg: '#00d4aa',
          railBg: '#2a2d3e',
          handleColor: '#00d4aa',
        },
        Steps: {
          colorPrimary: '#00d4aa',
        },
        Tabs: {
          inkBarColor: '#00d4aa',
          itemSelectedColor: '#00d4aa',
          itemActiveColor: '#00d4aa',
          itemHoverColor: '#00d4aa',
        },
        DatePicker: {
          colorBgContainer: '#0f1117',
          colorBorder: '#2a2d3e',
          activeBorderColor: '#00d4aa',
        },
        Progress: {
          defaultColor: '#00d4aa',
          remainingColor: '#2a2d3e',
        },
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
