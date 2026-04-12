import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin, theme as antTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider, useAuth } from './hooks/useAuth';
const AppLayout = lazy(() => import('./components/Layout/AppLayout'));
const Login = lazy(() => import('./pages/Login/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Monitor = lazy(() => import('./pages/Monitor/Monitor'));
const History = lazy(() => import('./pages/History/History'));
const Knowledge = lazy(() => import('./pages/Knowledge/Knowledge'));
const Alerts = lazy(() => import('./pages/Alerts/Alerts'));
const Settings = lazy(() => import('./pages/Settings/Settings'));
const MapPage = lazy(() => import('./pages/Map/Map'));
const Engine = lazy(() => import('./pages/Engine/Engine'));
const Screen = lazy(() => import('./pages/Screen/Screen'));
const Sites = lazy(() => import('./pages/Sites'));
const IoT = lazy(() => import('./pages/IoT/IoT'));
const Landing = lazy(() => import('./pages/Landing/Landing'));

const appTheme = {
  algorithm: antTheme.defaultAlgorithm,
  token: {
    colorPrimary: '#1366ff',
    colorInfo: '#1366ff',
    colorSuccess: '#0f9d80',
    colorWarning: '#c7962f',
    colorError: '#cf4453',
    colorLink: '#1366ff',
    colorBgBase: '#f2f4f8',
    colorBgLayout: '#f2f4f8',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBorder: 'rgba(15, 23, 42, 0.12)',
    colorBorderSecondary: 'rgba(15, 23, 42, 0.08)',
    colorText: '#111827',
    colorTextSecondary: '#334155',
    colorTextTertiary: '#64748b',
    borderRadius: 12,
    borderRadiusLG: 18,
    borderRadiusSM: 10,
    fontFamily: "'SF Pro Text', 'SF Pro Display', 'Inter', 'Avenir Next', 'PingFang SC', 'Hiragino Sans GB', sans-serif",
    boxShadow:
      '0 12px 34px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(19, 102, 255, 0.06)',
  },
  components: {
    Layout: {
      headerBg: 'rgba(248, 250, 253, 0.68)',
      siderBg: 'rgba(248, 250, 253, 0.72)',
      bodyBg: '#f2f4f8',
      triggerBg: 'rgba(248, 250, 253, 0.84)',
    },
    Menu: {
      itemBg: 'transparent',
      itemHoverBg: 'rgba(19, 102, 255, 0.07)',
      itemSelectedBg: 'rgba(19, 102, 255, 0.12)',
      itemSelectedColor: '#1366ff',
      itemHoverColor: '#111827',
      itemColor: '#334155',
      itemBorderRadius: 12,
    },
    Card: {
      colorBgContainer: 'rgba(255, 255, 255, 0.82)',
      colorBorderSecondary: 'rgba(15, 23, 42, 0.12)',
      boxShadowTertiary:
        '0 12px 34px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(19, 102, 255, 0.06)',
      headerBg: 'transparent',
    },
    Table: {
      colorBgContainer: 'rgba(255, 255, 255, 0.82)',
      headerBg: '#f2f5f9',
      borderColor: 'rgba(15, 23, 42, 0.12)',
      rowHoverBg: 'rgba(19, 102, 255, 0.05)',
    },
    Input: {
      colorBgContainer: '#f7fafd',
      colorBorder: 'rgba(15, 23, 42, 0.14)',
      activeBorderColor: '#1366ff',
      hoverBorderColor: '#1366ff',
      activeShadow: '0 0 0 3px rgba(19, 102, 255, 0.12)',
    },
    Button: {
      colorPrimary: '#1366ff',
      colorPrimaryHover: '#0f56d8',
      colorPrimaryActive: '#0b48b7',
      colorPrimaryText: '#ffffff',
      defaultBg: 'rgba(255, 255, 255, 0.78)',
      defaultBorderColor: 'rgba(15, 23, 42, 0.14)',
    },
    Modal: {
      contentBg: '#ffffff',
      headerBg: '#ffffff',
      footerBg: '#ffffff',
    },
    Slider: {
      trackBg: '#1366ff',
      handleColor: '#1366ff',
      railBg: 'rgba(15, 23, 42, 0.12)',
    },
    Steps: {
      colorPrimary: '#1366ff',
    },
    Tabs: {
      inkBarColor: '#1366ff',
      itemActiveColor: '#111827',
      itemSelectedColor: '#1366ff',
      itemHoverColor: '#1366ff',
    },
    DatePicker: {
      colorBgContainer: '#f7fafd',
      colorBorder: 'rgba(15, 23, 42, 0.14)',
      activeBorderColor: '#1366ff',
    },
    Progress: {
      defaultColor: '#1366ff',
      remainingColor: 'rgba(15, 23, 42, 0.1)',
    },
    Badge: {
      indicatorHeight: 8,
      statusSize: 8,
    },
  },
};

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const RouteFallback: React.FC = () => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
    }}
  >
    <Spin size="large" />
  </div>
);

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/landing" element={<Landing />} />
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
      <Route path="iot" element={<IoT />} />
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
    theme={appTheme}
  >
    <AuthProvider>
      <HashRouter>
        <Suspense fallback={<RouteFallback />}>
          <AppRoutes />
        </Suspense>
      </HashRouter>
    </AuthProvider>
  </ConfigProvider>
);

export default App;
