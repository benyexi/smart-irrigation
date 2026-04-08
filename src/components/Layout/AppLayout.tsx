import React, { useEffect, useState } from 'react';
import { Layout, Menu, Avatar, Badge, Tooltip } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  DashboardOutlined, RadarChartOutlined, AppstoreOutlined,
  HistoryOutlined, ReadOutlined, AlertOutlined, SettingOutlined,
  LogoutOutlined, BellOutlined, EnvironmentOutlined, ExperimentOutlined,
  DotChartOutlined, MenuFoldOutlined, MenuUnfoldOutlined, ApiOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';

const { Sider, Content, Header } = Layout;

interface NavItem {
  key: string;
  icon: React.ReactNode;
  zh: string;
  en: string;
  mobileZh: string;
  mobileEn: string;
}

const navItems: NavItem[] = [
  { key: '/dashboard', icon: <DashboardOutlined />, zh: '主控看板', en: 'Dashboard', mobileZh: '看板', mobileEn: 'Dash' },
  { key: '/monitor', icon: <RadarChartOutlined />, zh: '实时监控', en: 'Monitor', mobileZh: '监控', mobileEn: 'Live' },
  { key: '/iot', icon: <ApiOutlined />, zh: 'IoT接入', en: 'IoT Access', mobileZh: '接入', mobileEn: 'IoT' },
  { key: '/sites', icon: <AppstoreOutlined />, zh: '站点管理', en: 'Site Management', mobileZh: '站点', mobileEn: 'Sites' },
  { key: '/history', icon: <HistoryOutlined />, zh: '历史数据', en: 'History', mobileZh: '历史', mobileEn: 'Data' },
  { key: '/map', icon: <EnvironmentOutlined />, zh: '站点地图', en: 'Site Map', mobileZh: '地图', mobileEn: 'Map' },
  { key: '/engine', icon: <ExperimentOutlined />, zh: '决策引擎', en: 'Decision Engine', mobileZh: '引擎', mobileEn: 'Engine' },
  { key: '/knowledge', icon: <ReadOutlined />, zh: '知识库', en: 'Knowledge', mobileZh: '知识', mobileEn: 'Wiki' },
  { key: '/alerts', icon: <AlertOutlined />, zh: '报警记录', en: 'Alerts', mobileZh: '报警', mobileEn: 'Alert' },
  { key: '/settings', icon: <SettingOutlined />, zh: '用户设置', en: 'Settings', mobileZh: '设置', mobileEn: 'Prefs' },
  { key: '/screen', icon: <DotChartOutlined />, zh: '数据大屏', en: 'Data Wall', mobileZh: '大屏', mobileEn: 'Wall' },
];

const menuItems = navItems.map((item) => ({
  key: item.key,
  icon: item.icon,
  label: (
    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, gap: 1 }}>
      <span style={{ fontSize: 13 }}>{item.zh}</span>
      <span style={{ fontSize: 10, opacity: 0.74 }}>{item.en}</span>
    </div>
  ),
}));

const mobileTabItems = navItems
  .filter((item) => ['/dashboard', '/monitor', '/screen', '/map', '/alerts'].includes(item.key))
  .map((item) => ({
    key: item.key,
    icon: item.icon,
    label: (
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05, textAlign: 'center' }}>
        <span style={{ fontSize: 10 }}>{item.mobileZh}</span>
        <span style={{ fontSize: 9, opacity: 0.72 }}>{item.mobileEn}</span>
      </span>
    ),
  }));

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const currentNav = navItems.find((item) => item.key === location.pathname);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={240}
        collapsedWidth={72}
        collapsed={collapsed}
        style={{
          position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
          display: 'flex', flexDirection: 'column',
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-base)',
          overflow: 'hidden',
        }}
      >
        <div style={{
          height: 72, display: 'flex', alignItems: 'center',
          padding: '0 16px',
          borderBottom: '1px solid var(--border-base)',
          gap: 10, cursor: 'pointer', flexShrink: 0,
        }} onClick={() => navigate('/dashboard')}>
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1366ff" />
                <stop offset="55%" stopColor="#3d7dff" />
                <stop offset="100%" stopColor="#6ea1ff" />
              </linearGradient>
            </defs>
            <rect x="2.5" y="2.5" width="25" height="25" rx="8.5" stroke="url(#brandGrad)" strokeWidth="1.4" />
            <circle cx="10.5" cy="19.5" r="2.1" fill="#1366ff" />
            <circle cx="15.1" cy="14.9" r="2.1" fill="#3d7dff" />
            <circle cx="19.8" cy="10.1" r="2.1" fill="#6ea1ff" />
            <path d="M10.5 19.5L15.1 14.9L19.8 10.1" stroke="url(#brandGrad)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {!collapsed && (
            <div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 620, fontSize: 16, lineHeight: 1.25, letterSpacing: 0 }}>智灌云</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 10, lineHeight: 1.45, letterSpacing: 0.24 }}>Irrigation Command</div>
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingTop: 8 }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems.map(item => ({ key: item.key, icon: item.icon, label: item.label }))}
            onClick={handleMenuClick}
            inlineCollapsed={collapsed}
          />
        </div>

        <div style={{
          borderTop: '1px solid var(--border-base)',
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
          flexShrink: 0,
        }}>
          <Avatar size={32} style={{ background: '#1366ff', color: '#ffffff', flexShrink: 0, fontWeight: 700 }}>
            {user?.name?.[0] ?? 'A'}
          </Avatar>
          {!collapsed && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name ?? '管理员'}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>系统管理员 / Administrator</div>
              </div>
              <Tooltip title="退出登录 / Sign Out">
                <LogoutOutlined style={{ color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16 }} onClick={logout} />
              </Tooltip>
            </>
          )}
        </div>
      </Sider>

      <Layout style={{ marginLeft: isMobile ? 0 : (collapsed ? 72 : 240), transition: 'margin-left 0.2s ease' }}>
        <Header style={{
          position: 'sticky', top: 0, zIndex: 99,
          height: 60, padding: '0 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div onClick={() => setCollapsed(!collapsed)} style={{ color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 18, padding: 4, lineHeight: 1 }}>
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 11, lineHeight: 1.35, letterSpacing: 0.12 }}>Operations Console</div>
              <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>
                {currentNav ? `${currentNav.zh} / ${currentNav.en}` : '智灌云 / Smart Irrigation'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 10px', borderRadius: 999, border: '1px solid var(--border-base)', background: 'rgba(15,157,128,0.08)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0f9d80', boxShadow: '0 0 8px rgba(15,157,128,0.45)' }} />
              <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>System Stable</span>
            </div>
            <Badge count={3} size="small">
              <BellOutlined onClick={() => navigate('/alerts')} style={{ color: 'var(--text-secondary)', fontSize: 18, cursor: 'pointer' }} />
            </Badge>
            <div style={{ width: 1, height: 20, background: 'var(--border-base)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size={28} style={{ background: '#1366ff', color: '#ffffff', fontSize: 12, fontWeight: 700 }}>
                {user?.name?.[0] ?? 'A'}
              </Avatar>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{user?.name ?? '管理员'}</span>
            </div>
          </div>
        </Header>

        <Content style={{ background: 'transparent', minHeight: 'calc(100vh - 60px)' }}>
          <Outlet />
        </Content>
      </Layout>

      <div className="mobile-tab-bar">
        {mobileTabItems.map(item => (
          <div key={item.key} onClick={() => navigate(item.key)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            padding: '6px 12px', cursor: 'pointer', borderRadius: 8,
            color: location.pathname === item.key ? 'var(--primary)' : 'var(--text-secondary)',
            background: location.pathname === item.key ? 'var(--primary-dim)' : 'transparent',
          }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default AppLayout;
