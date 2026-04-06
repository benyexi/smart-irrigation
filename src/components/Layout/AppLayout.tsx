// Main application layout: fixed sidebar + top header
import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button, Typography } from 'antd';
import {
  DashboardOutlined,
  MonitorOutlined,
  SettingOutlined,
  HistoryOutlined,
  BookOutlined,
  AlertOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ControlOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '主控看板' },
  { key: '/monitor', icon: <MonitorOutlined />, label: '实时监控' },
  { key: '/setup', icon: <ControlOutlined />, label: '灌溉配置' },
  { key: '/history', icon: <HistoryOutlined />, label: '历史数据' },
  { key: '/knowledge', icon: <BookOutlined />, label: '知识库' },
  { key: '/alerts', icon: <AlertOutlined />, label: '报警记录' },
  { key: '/settings', icon: <UserOutlined />, label: '用户设置' },
];

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleMenuClick = ({ key }: { key: string }) => navigate(key);

  const userMenuItems = [
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '用户设置',
      onClick: () => navigate('/settings'),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => { logout(); navigate('/login'); },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* ── Sidebar ── */}
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={220}
        style={{
          background: '#001529',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          overflow: 'auto',
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/dashboard')}
        >
          <span style={{ fontSize: 24 }}>💧</span>
          {!collapsed && (
            <Text
              strong
              style={{
                color: '#52c41a',
                fontSize: 18,
                marginLeft: 10,
                letterSpacing: 1,
                whiteSpace: 'nowrap',
              }}
            >
              智灌云
            </Text>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>

      {/* ── Main ── */}
      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin-left 0.2s' }}>
        {/* ── Header ── */}
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 99,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16 }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={3} size="small">
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: 18 }} />}
                onClick={() => navigate('/alerts')}
              />
            </Badge>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar
                  size={32}
                  style={{ background: '#52c41a' }}
                  icon={<UserOutlined />}
                />
                <Text style={{ fontSize: 14 }}>{user?.name ?? 'admin'}</Text>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* ── Page Content ── */}
        <Content style={{ background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
