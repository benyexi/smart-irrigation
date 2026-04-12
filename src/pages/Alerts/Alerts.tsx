// Alerts page — unresolved / resolved tabs, mark as handled
import React, { Suspense, lazy, useMemo, useState } from 'react';
import {
  Card, Tag, Tabs, Row, Col, Typography, message, Space, Skeleton,
} from 'antd';
import LiteDateRange from '../../components/Inputs/LiteDateRange';
import { mockAlerts, type Alert } from '../../mock';

const { Title } = Typography;
const AlertsTableSection = lazy(() => import('./components/AlertsTableSection'));

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [activeTab, setActiveTab] = useState<'unresolved' | 'resolved'>('unresolved');

  const markHandled = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: '已处理' } : a))
    );
    message.success('已标记为处理完成');
  };

  const unresolved = useMemo(() => alerts.filter((a) => a.status === '未处理'), [alerts]);
  const resolved = useMemo(() => alerts.filter((a) => a.status === '已处理'), [alerts]);

  return (
    <div className="page-container">
      <Title level={4} style={{ marginBottom: 16 }}>报警记录</Title>

      <Card style={{ borderRadius: 8 }}>
        {/* Filter bar */}
        <Row gutter={12} style={{ marginBottom: 16 }}>
          <Col>
            <LiteDateRange compact width={260} />
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
                <Suspense fallback={<Skeleton active paragraph={{ rows: 6 }} title={false} />}>
                  <AlertsTableSection alerts={unresolved} onMarkHandled={markHandled} />
                </Suspense>
              ),
            },
            {
              key: 'resolved',
              label: `已处理 (${resolved.length})`,
              children: (
                <Suspense fallback={<Skeleton active paragraph={{ rows: 6 }} title={false} />}>
                  <AlertsTableSection alerts={resolved} onMarkHandled={markHandled} />
                </Suspense>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default Alerts;
