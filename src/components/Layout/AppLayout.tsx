import React, { useState } from 'react';
import { Avatar, Badge, Layout, Menu, Tooltip } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  BellOutlined,
  BulbOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
  HistoryOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RadarChartOutlined,
  ReadOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';

const { Sider, Content, Header } = Layout;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '主控看板' },
  { key: '/monitor', icon: <RadarChartOutlined />, label: '实时监控' },
  { key: '/sites', icon: <AppstoreOutlined />, label: '站点管理' },
  { key: '/history', icon: <HistoryOutlined />, label: '历史数据' },
  { key: '/map', icon: <EnvironmentOutlined />, label: '站点地图' },
  { key: '/engine', icon: <BulbOutlined />, label: '决策引擎' },
  { key: '/knowledge', icon: <ReadOutlined />, label: '知识库' },
  { key: '/alerts', icon: <AlertOutlined />, label: '报警记录' },
  { key: '/settings', icon: <SettingOutlined />, label: '用户设置' },
  { key: '/screen', icon: <BarChartOutlined />, label: '数据大屏' },
];

const mobileTabItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '看板' },
  { key: '/monitor', icon: <RadarChartOutlined />, label: '监控' },
  { key: '/map', icon: <EnvironmentOutlined />, label: '地图' },
  { key: '/alerts', icon: <AlertOutlined />, label: '报警' },
  { key: '/screen', icon: <BarChartOutlined />, label: '大屏' },
];

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === '/screen') {
      const baseHref = window.location.href.split('#')[0];
      window.open(baseHref + '#/screen', '_blank');
      return;
    }
    navigate(key);
  };

  const currentLabel = menuItems.find((item) => item.key === location.pathname)?.label ?? '智灌云';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={240}
        collapsedWidth={64}
        collapsed={collapsed}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-base)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            borderBottom: '1px solid var(--border-base)',
            gap: 10,
            cursor: 'pointer',
            flexShrink: 0,
          }}
          onClick={() => navigate('/dashboard')}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <path d="M14 2 C14 2, 6 12, 6 17 A8 8 0 0 0 22 17 C22 12 14 2 14 2Z" fill="url(#dropGrad)" />
            <defs>
              <linearGradient id="dropGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00d4aa" />
                <stop offset="100%" stopColor="#4f9cf9" />
              </linearGradient>
            </defs>
          </svg>
          {collapsed ? null : (
            <div>
              <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>智灌云</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 10, lineHeight: 1.4 }}>Smart Irrigation</div>
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingTop: 8 }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            inlineCollapsed={collapsed}
          />
        </div>

        <div
          style={{
            borderTop: '1px solid var(--border-base)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <Avatar size={32} style={{ background: 'var(--primary)', color: '#0f1117', flexShrink: 0, fontWeight: 700 }}>
            {user?.name?.[0] ?? 'A'}
          </Avatar>
          {collapsed ? null : (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user?.name ?? '管理员'}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>系统管理员</div>
              </div>
              <Tooltip title="退出登录">
                <LogoutOutlined
                  style={{ color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16 }}
                  onClick={logout}
                />
              </Tooltip>
            </>
          )}
        </div>
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 64 : 240, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 99,
            height: 56,
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              onClick={() => setCollapsed((prev) => (prev ? false : true))}
              style={{ color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 18, padding: 4 }}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{currentLabel}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={3} size="small">
              <BellOutlined
                onClick={() => navigate('/alerts')}
                style={{ color: 'var(--text-secondary)', fontSize: 18, cursor: 'pointer' }}
              />
            </Badge>
            <div style={{ width: 1, height: 20, background: 'var(--border-base)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size={28} style={{ background: 'var(--primary)', color: '#0f1117', fontSize: 12, fontWeight: 700 }}>
                {user?.name?.[0] ?? 'A'}
              </Avatar>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{user?.name ?? '管理员'}</span>
            </div>
          </div>
        </Header>

        <Content style={{ background: 'var(--bg-base)', minHeight: 'calc(100vh - 56px)' }}>
          <Outlet />
        </Content>
      </Layout>

      <div className="mobile-tab-bar">
        {mobileTabItems.map((item) => (
          <div
            key={item.key}
            onClick={() => navigate(item.key)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '6px 12px',
              cursor: 'pointer',
              borderRadius: 8,
              color: location.pathname === item.key ? 'var(--primary)' : 'var(--text-secondary)',
              background: location.pathname === item.key ? 'var(--primary-dim)' : 'transparent',
            }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 10 }}>{item.label}</span>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default AppLayout;
