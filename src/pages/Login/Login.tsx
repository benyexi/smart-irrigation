import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = ({ username, password }: { username: string; password: string }) => {
    setLoading(true);
    setTimeout(() => {
      const ok = login(username, password);
      if (ok) { navigate('/dashboard'); }
      else { message.error('账号或密码错误'); setLoading(false); }
    }, 600);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', opacity: 0.18 }} viewBox="0 0 1440 320" preserveAspectRatio="none">
        <defs><linearGradient id="wg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#00d4aa"/><stop offset="100%" stopColor="#4f9cf9"/></linearGradient></defs>
        <path fill="url(#wg)" d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,138.7C672,128,768,160,864,181.3C960,203,1056,213,1152,197.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L0,320Z"/>
      </svg>
      <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', opacity: 0.08 }} viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="#4f9cf9" d="M0,256L60,240C120,224,240,192,360,186.7C480,181,600,203,720,213.3C840,224,960,224,1080,208C1200,192,1320,160,1380,144L1440,128L1440,320L0,320Z"/>
      </svg>
      {[...Array(10)].map((_, i) => (
        <div key={i} style={{ position: 'absolute', width: 3+i%3, height: 3+i%3, borderRadius: '50%', background: i%2===0?'var(--primary)':'var(--accent-blue)', opacity: 0.35, left: `${8+i*9}%`, top: `${15+(i%4)*18}%`, boxShadow: `0 0 8px ${i%2===0?'#00d4aa':'#4f9cf9'}` }} />
      ))}
      <div style={{ width: 400, background: 'var(--bg-card)', border: '1px solid var(--border-base)', borderRadius: 'var(--radius-lg)', padding: '40px 36px', boxShadow: '0 8px 40px rgba(0,0,0,0.5),0 0 60px rgba(0,212,170,0.08)', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none" style={{ display: 'block', margin: '0 auto 12px' }}>
            <path d="M26 4 C26 4, 10 22, 10 32 A16 16 0 0 0 42 32 C42 22 26 4 26 4Z" fill="url(#ld)"/>
            <defs><linearGradient id="ld" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#00d4aa"/><stop offset="100%" stopColor="#4f9cf9"/></linearGradient></defs>
          </svg>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--primary)', letterSpacing: 2 }}>智灌云</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, letterSpacing: 1 }}>Smart Irrigation Platform</div>
        </div>
        <Form layout="vertical" onFinish={onFinish} initialValues={{ username: 'admin', password: '123456' }}>
          <Form.Item name="username" rules={[{ required: true }]}>
            <Input prefix={<UserOutlined style={{ color: 'var(--text-muted)' }}/>} placeholder="账号" size="large" style={{ height: 46 }}/>
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true }]}>
            <Input.Password prefix={<LockOutlined style={{ color: 'var(--text-muted)' }}/>} placeholder="密码" size="large" style={{ height: 46 }}/>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button type="primary" htmlType="submit" block size="large" loading={loading} style={{ height: 46, fontSize: 16, fontWeight: 700, letterSpacing: 2 }}>登 录</Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center', marginTop: 16, color: 'var(--text-muted)', fontSize: 12 }}>演示账号：admin | 密码：123456</div>
      </div>
    </div>
  );
};
export default Login;
