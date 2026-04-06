// Login page — default credentials: admin / 123456
import React, { useState } from 'react';
import { Form, Input, Button, Card, Alert, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = ({ username, password }: { username: string; password: string }) => {
    setLoading(true);
    setTimeout(() => {
      const ok = login(username, password);
      if (ok) {
        navigate('/dashboard', { replace: true });
      } else {
        setError('账号或密码错误，请重试（默认：admin / 123456）');
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
        styles={{ body: { padding: '40px 40px 32px' } }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, lineHeight: 1 }}>💧</div>
          <Title level={2} style={{ color: '#52c41a', margin: '8px 0 4px', letterSpacing: 2 }}>
            智灌云
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            智能灌溉决策平台
          </Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError('')}
            style={{ marginBottom: 20 }}
          />
        )}

        <Form name="login" onFinish={onFinish} size="large" autoComplete="off">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入账号' }]}
            initialValue="admin"
          >
            <Input prefix={<UserOutlined />} placeholder="账号" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
            initialValue="123456"
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ height: 44, fontSize: 16 }}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

        <Text
          type="secondary"
          style={{ display: 'block', textAlign: 'center', marginTop: 20, fontSize: 12 }}
        >
          演示账号：admin &nbsp;|&nbsp; 密码：123456
        </Text>
      </Card>
    </div>
  );
};

export default Login;
