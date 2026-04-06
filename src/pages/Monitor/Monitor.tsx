// Real-time monitoring page — sensor table, valve/pump controls, manual irrigation trigger
import React, { useState } from 'react';
import {
  Row, Col, Card, Table, Tag, Switch, Button, Modal, Tree, Typography, Space, message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { DataNode } from 'antd/es/tree';
import { ThunderboltOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { mockSensors, mockValves, mockPumps, mockSites, type Sensor } from '../../mock';

const { Title, Text } = Typography;

// Build site tree data
const treeData: DataNode[] = mockSites.map((s) => ({
  title: (
    <Space>
      <span>{s.name}</span>
      <Tag color={s.status === 'online' ? 'green' : s.status === 'warning' ? 'orange' : 'red'}>
        {s.status === 'online' ? '在线' : s.status === 'warning' ? '告警' : '离线'}
      </Tag>
    </Space>
  ),
  key: s.id,
  children: [
    { title: `植物类型：${s.plantType}`, key: `${s.id}-plant` },
    { title: `灌溉方式：${s.irrigationMethod}`, key: `${s.id}-method` },
    { title: `面积：${s.area} 亩`, key: `${s.id}-area` },
  ],
}));

const sensorColumns: ColumnsType<Sensor> = [
  { title: '设备ID', dataIndex: 'deviceId', key: 'deviceId', width: 110 },
  { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
  { title: '最新值', dataIndex: 'latestValue', key: 'latestValue', width: 120 },
  { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 160 },
  { title: '安装位置', dataIndex: 'location', key: 'location', width: 120 },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 80,
    render: (s: string) => (
      <Tag color={s === 'online' ? 'green' : 'red'}>{s === 'online' ? '在线' : '离线'}</Tag>
    ),
  },
];

const Monitor: React.FC = () => {
  const [valves, setValves] = useState(mockValves);
  const [pumps, setPumps] = useState(mockPumps);
  const [modalOpen, setModalOpen] = useState(false);
  const [irrigating, setIrrigating] = useState(false);

  const toggleValve = (id: string, checked: boolean) => {
    setValves((prev) => prev.map((v) => (v.id === id ? { ...v, status: checked } : v)));
    message.success(`${id} 已${checked ? '开启' : '关闭'}`);
  };

  const togglePump = (id: string, checked: boolean) => {
    setPumps((prev) => prev.map((p) => (p.id === id ? { ...p, status: checked } : p)));
    message.success(`${id} 已${checked ? '启动' : '停止'}`);
  };

  const handleManualIrrigate = () => {
    setIrrigating(true);
    setTimeout(() => {
      setIrrigating(false);
      setModalOpen(false);
      message.success('手动灌溉指令已下发，预计持续 30 分钟');
    }, 1500);
  };

  return (
    <div className="page-container">
      <Title level={4} style={{ marginBottom: 16 }}>实时监控</Title>

      <Row gutter={[16, 16]}>
        {/* ── Site tree ── */}
        <Col xs={24} md={6}>
          <Card title="站点列表" size="small" style={{ borderRadius: 8 }}>
            <Tree
              treeData={treeData}
              defaultExpandAll
              style={{ fontSize: 13 }}
            />
          </Card>
        </Col>

        {/* ── Right panel ── */}
        <Col xs={24} md={18}>
          {/* Sensor table */}
          <Card
            title="传感器状态"
            size="small"
            style={{ borderRadius: 8, marginBottom: 16 }}
          >
            <Table
              columns={sensorColumns}
              dataSource={mockSensors}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ x: 700 }}
            />
          </Card>

          {/* Valve & pump controls */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <Card title="阀门控制" size="small" style={{ borderRadius: 8 }}>
                <Row gutter={[12, 12]}>
                  {valves.map((v) => (
                    <Col span={12} key={v.id}>
                      <Card
                        size="small"
                        style={{
                          borderRadius: 6,
                          background: v.status ? '#f6ffed' : '#fafafa',
                          border: `1px solid ${v.status ? '#b7eb8f' : '#d9d9d9'}`,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Text strong style={{ fontSize: 13 }}>{v.name}</Text>
                            <br />
                            <Tag color={v.status ? 'green' : 'default'} style={{ marginTop: 4 }}>
                              {v.status ? '已开启' : '已关闭'}
                            </Tag>
                          </div>
                          <Switch
                            checked={v.status}
                            onChange={(c) => toggleValve(v.id, c)}
                            checkedChildren="开"
                            unCheckedChildren="关"
                          />
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>

            <Col xs={24} lg={10}>
              <Card title="泵控制" size="small" style={{ borderRadius: 8, marginBottom: 12 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {pumps.map((p) => (
                    <Card
                      key={p.id}
                      size="small"
                      style={{
                        borderRadius: 6,
                        background: p.status ? '#e6f7ff' : '#fafafa',
                        border: `1px solid ${p.status ? '#91d5ff' : '#d9d9d9'}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Text strong>{p.name}</Text>
                          <br />
                          <Tag color={p.status ? 'blue' : 'default'}>
                            {p.status ? '运行中' : '待机'}
                          </Tag>
                        </div>
                        <Switch
                          checked={p.status}
                          onChange={(c) => togglePump(p.id, c)}
                          checkedChildren="运行"
                          unCheckedChildren="停止"
                        />
                      </div>
                    </Card>
                  ))}
                </Space>
              </Card>

              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                block
                size="large"
                style={{ borderRadius: 8 }}
                onClick={() => setModalOpen(true)}
              >
                手动触发灌溉
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Manual irrigation confirm modal */}
      <Modal
        title={<><ThunderboltOutlined style={{ color: '#52c41a' }} /> 手动触发灌溉</>}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleManualIrrigate}
        okText="确认灌溉"
        cancelText="取消"
        confirmLoading={irrigating}
        okButtonProps={{ style: { background: '#52c41a', borderColor: '#52c41a' } }}
      >
        <p>即将手动触发灌溉，预计持续 <strong>30 分钟</strong>，灌水量约 <strong>45 m³</strong>。</p>
        <p style={{ color: '#888' }}>请确认当前灌溉条件满足要求，操作将被记录到系统日志。</p>
      </Modal>
    </div>
  );
};

export default Monitor;
