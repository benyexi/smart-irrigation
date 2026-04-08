import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Login.css';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = ({ username, password }: { username: string; password: string }) => {
    setLoading(true);
    setTimeout(() => {
      const ok = login(username, password);
      if (ok) {
        navigate('/dashboard');
      } else {
        message.error('账号或密码错误');
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="login-page">
      <div className="login-bg-orb orb-a" />
      <div className="login-bg-orb orb-b" />

      <section className="login-card">
        <div className="login-brand-row">
          <div className="login-mark" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <defs>
                <linearGradient id="loginMarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1366ff" />
                  <stop offset="60%" stopColor="#3d7dff" />
                  <stop offset="100%" stopColor="#6ea1ff" />
                </linearGradient>
              </defs>
              <rect x="2.2" y="2.2" width="21.6" height="21.6" rx="7.4" stroke="url(#loginMarkGrad)" strokeWidth="1.4" />
              <circle cx="9" cy="16.8" r="1.6" fill="#1366ff" />
              <circle cx="13" cy="12.8" r="1.6" fill="#3d7dff" />
              <circle cx="17.2" cy="8.6" r="1.6" fill="#6ea1ff" />
              <path d="M9 16.8L13 12.8L17.2 8.6" stroke="url(#loginMarkGrad)" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div className="login-brand-name">智灌云</div>
            <div className="login-brand-sub">Smart Irrigation</div>
          </div>
        </div>

        <h1 className="login-title">
          <span className="login-title-zh">智能灌溉决策平台</span>
          <span className="login-title-en">Smart Irrigation Platform</span>
        </h1>
        <p className="login-subtitle">
          <span className="login-subtitle-zh">面向商业化部署的实时监测与决策中枢</span>
          <span className="login-subtitle-en">Enterprise-grade monitoring and decision core for global deployment</span>
        </p>

        <Form
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ username: 'admin', password: '123456' }}
          autoComplete="off"
          className="login-form"
        >
          <Form.Item name="username" rules={[{ required: true }]}>
              <Input
                className="login-field"
                prefix={<UserOutlined />}
                placeholder="账号  Account"
                size="large"
                autoComplete="username"
                spellCheck={false}
            />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true }]}>
              <Input.Password
                className="login-field"
                prefix={<LockOutlined />}
                placeholder="密码  Password"
                size="large"
                autoComplete="current-password"
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
              <Button className="login-submit" type="primary" htmlType="submit" block size="large" loading={loading}>
                <span className="login-submit-label">
                  <span className="login-submit-zh">进入平台</span>
                  <span className="login-submit-en">Continue</span>
                </span>
                <ArrowRightOutlined />
              </Button>
            </Form.Item>
          </Form>

        <div className="login-footer">
          <span className="login-footer-zh">演示账号：admin  密码：123456</span>
          <span className="login-footer-en">Demo Account: admin  Password: 123456</span>
        </div>
      </section>
    </div>
  );
};

export default Login;
