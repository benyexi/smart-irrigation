// User settings page — profile form, notification switches, API key display
import React, { useState } from 'react';
import {
  Card, Form, Input, Button, Switch, Row, Col, Typography, Divider, message, Space,
} from 'antd';
import { CopyOutlined, KeyOutlined, SaveOutlined } from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';

const { Title, Text } = Typography;

const MOCK_API_KEY = 'sk-irr-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [notifyWechat, setNotifyWechat] = useState(true);
  const [notifySms, setNotifySms] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [saving, setSaving] = useState(false);

  const copyApiKey = () => {
    navigator.clipboard.writeText(MOCK_API_KEY).then(() => {
      message.success('API 密钥已复制到剪贴板');
    });
  };

  const onSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      message.success('个人信息已保存');
    }, 800);
  };

  return (
    <div className="page-container">
      <Title level={4} style={{ marginBottom: 16 }}>用户设置</Title>

      <Row gutter={[16, 16]}>
        {/* ── Profile form ── */}
        <Col xs={24} lg={14}>
          <Card title="个人信息" style={{ borderRadius: 8 }}>
            <Form
              layout="vertical"
              initialValues={{
                name: user?.name ?? '管理员',
                phone: user?.phone ?? '13800138000',
                email: user?.email ?? 'admin@zhiguan.com',
                organization: user?.organization ?? '智灌云科技有限公司',
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="姓名" name="name" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="手机号" name="phone">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="邮箱" name="email">
                    <Input type="email" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="单位" name="organization">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={onSave}
              >
                保存修改
              </Button>
            </Form>
          </Card>
        </Col>

        {/* ── Right column ── */}
        <Col xs={24} lg={10}>
          {/* Notification settings */}
          <Card title="通知设置" style={{ borderRadius: 8, marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Text>💬 微信通知</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>通过微信公众号推送报警消息</Text>
                </Col>
                <Col>
                  <Switch
                    checked={notifyWechat}
                    onChange={setNotifyWechat}
                    checkedChildren="开"
                    unCheckedChildren="关"
                  />
                </Col>
              </Row>
              <Divider style={{ margin: '0' }} />
              <Row justify="space-between" align="middle">
                <Col>
                  <Text>📱 短信通知</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>通过短信发送报警提醒</Text>
                </Col>
                <Col>
                  <Switch
                    checked={notifySms}
                    onChange={setNotifySms}
                    checkedChildren="开"
                    unCheckedChildren="关"
                  />
                </Col>
              </Row>
              <Divider style={{ margin: '0' }} />
              <Row justify="space-between" align="middle">
                <Col>
                  <Text>📧 邮件通知</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>通过邮件发送详细报警报告</Text>
                </Col>
                <Col>
                  <Switch
                    checked={notifyEmail}
                    onChange={setNotifyEmail}
                    checkedChildren="开"
                    unCheckedChildren="关"
                  />
                </Col>
              </Row>
            </Space>
          </Card>

          {/* API key */}
          <Card
            title={<><KeyOutlined /> API 密钥</>}
            style={{ borderRadius: 8 }}
          >
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
              用于第三方系统集成，请妥善保管，不要泄露给他人。
            </Text>
            <Input.Password
              value={MOCK_API_KEY}
              readOnly
              addonAfter={
                <Button
                  type="text"
                  icon={<CopyOutlined />}
                  size="small"
                  onClick={copyApiKey}
                  style={{ padding: '0 4px' }}
                >
                  复制
                </Button>
              }
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Settings;
