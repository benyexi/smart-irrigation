// Alerts page — unresolved / resolved tabs, mark as handled
import React, { useState } from 'react';
import {
  Card, Table, Tag, Button, Tabs, DatePicker, Row, Col, Typography, message, Space,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckOutlined } from '@ant-design/icons';
import { mockAlerts, type Alert } from '../../mock';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const levelColor: Record<string, string> = {
  error: 'red',
  warning: 'orange',
  info: 'blue',
};

const levelText: Record<string, string> = {
  error: '严重',
  warning: '警告',
  info: '提示',
};

const typeColor: Record<string, string> = {
  '土壤水分': 'green',
  '植物水分': 'lime',
  '土壤水势': 'cyan',
  '传感器': 'blue',
  '设备': 'orange',
};

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [activeTab, setActiveTab] = useState<'unresolved' | 'resolved'>('unresolved');

  const markHandled = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: '已处理' } : a))
    );
    message.success('已标记为处理完成');
  };

  const columns: ColumnsType<Alert> = [
    { title: '时间', dataIndex: 'time', key: 'time', width: 160 },
    { title: '站点', dataIndex: 'site', key: 'site', width: 180, ellipsis: true },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 90,
      render: (v: string) => <Tag color={typeColor[v] ?? 'default'}>{v}</Tag>,
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (v: string) => <Tag color={levelColor[v]}>{levelText[v]}</Tag>,
    },
    { title: '报警内容', dataIndex: 'content', key: 'content', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (v: string) => (
        <Tag color={v === '未处理' ? 'red' : 'green'}>{v}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, r) =>
        r.status === '未处理' ? (
          <Button
            size="small"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => markHandled(r.id)}
          >
            标记处理
          </Button>
        ) : (
          <Tag color="green">已完成</Tag>
        ),
    },
  ];

  const unresolved = alerts.filter((a) => a.status === '未处理');
  const resolved = alerts.filter((a) => a.status === '已处理');

  return (
    <div className="page-container">
      <Title level={4} style={{ marginBottom: 16 }}>报警记录</Title>

      <Card style={{ borderRadius: 8 }}>
        {/* Filter bar */}
        <Row gutter={12} style={{ marginBottom: 16 }}>
          <Col>
            <RangePicker style={{ width: 260 }} />
          </Col>
          <Col>
            <Space>
              <Tag color="red">严重 {unresolved.filter((a) => a.level === 'error').length}</Tag>
              <Tag color="orange">警告 {unresolved.filter((a) => a.level === 'warning').length}</Tag>
              <Tag color="blue">提示 {unresolved.filter((a) => a.level === 'info').length}</Tag>
            </Space>
          </Col>
        </Row>

        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as 'unresolved' | 'resolved')}
          items={[
            {
              key: 'unresolved',
              label: `未处理 (${unresolved.length})`,
              children: (
                <Table
                  columns={columns}
                  dataSource={unresolved}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 900 }}
                  rowClassName={(r) => r.level === 'error' ? 'ant-table-row-error' : ''}
                />
              ),
            },
            {
              key: 'resolved',
              label: `已处理 (${resolved.length})`,
              children: (
                <Table
                  columns={columns}
                  dataSource={resolved}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 900 }}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default Alerts;
