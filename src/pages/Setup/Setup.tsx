// Irrigation setup wizard — 4-step configuration flow
import React, { useState } from 'react';
import {
  Steps, Card, Form, Input, Select, InputNumber, Radio, Button, Table, Tag,
  Checkbox, Modal, Space, Typography, Row, Col, Divider, message,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

// ── Sensor row type ──────────────────────────────────────────────────────────
interface SensorRow {
  key: string;
  type: string;
  deviceId: string;
  location: string;
  mqttTopic: string;
  status: string;
}

const defaultSensors: SensorRow[] = [
  { key: '1', type: '土壤水分', deviceId: 'SM-40-001', location: '40cm深', mqttTopic: 'site001/sensor/soil_moisture_40cm', status: '待连接' },
  { key: '2', type: '液流计', deviceId: 'SF-001', location: '树干1.3m处', mqttTopic: 'site001/sensor/sap_flow', status: '待连接' },
  { key: '3', type: '气象站', deviceId: 'WS-001', location: '站点中央', mqttTopic: 'site001/sensor/weather', status: '待连接' },
];

const sensorTypes = ['土壤水分', '土壤水势', '气象站', '液流计', '茎径传感器', '流量计', '电磁阀'];

const alarmOptions = [
  { label: '土壤水分达到灌溉上下限阈值提醒', value: 'soil_threshold' },
  { label: '植物水分亏缺指标达到灌溉阈值提醒', value: 'plant_deficit' },
  { label: '电磁阀未开启报警', value: 'valve_fail' },
  { label: '过滤器堵塞报警', value: 'filter_block' },
  { label: '管道破裂报警', value: 'pipe_break' },
  { label: '电机异常报警', value: 'motor_fault' },
  { label: '传感器断电/失联报警', value: 'sensor_offline' },
];

const notifyOptions = [
  { label: '微信', value: 'wechat' },
  { label: '短信', value: 'sms' },
  { label: '邮件', value: 'email' },
];

// ── Decision mode cards ──────────────────────────────────────────────────────
const decisionModes = [
  {
    value: 'timer',
    title: '模式1：定时灌溉',
    desc: '设定开关时间和灌水量，按计划执行',
    form: (
      <Row gutter={16}>
        <Col span={12}><Form.Item label="开始时间" name="timer_start"><Input placeholder="06:00" /></Form.Item></Col>
        <Col span={12}><Form.Item label="结束时间" name="timer_end"><Input placeholder="07:00" /></Form.Item></Col>
        <Col span={12}><Form.Item label="灌水量 (m³)" name="timer_volume"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
      </Row>
    ),
  },
  {
    value: 'et0',
    title: '模式2：ET₀计算（FAO-56）',
    desc: '基于参考蒸散量，设置作物系数Kc，ETc-75%降雨量时触发',
    form: (
      <Row gutter={16}>
        <Col span={12}><Form.Item label="作物系数 Kc" name="kc"><InputNumber min={0} max={2} step={0.01} style={{ width: '100%' }} /></Form.Item></Col>
        <Col span={12}><Form.Item label="有效降雨系数 (%)" name="rain_factor"><InputNumber min={0} max={100} style={{ width: '100%' }} /></Form.Item></Col>
      </Row>
    ),
  },
  {
    value: 'moisture',
    title: '模式3：土壤含水率阈值',
    desc: '设置上下限，到下限开灌，到上限停灌',
    form: (
      <Row gutter={16}>
        <Col span={12}><Form.Item label="灌溉下限 (%)" name="moisture_min"><InputNumber min={0} max={60} style={{ width: '100%' }} /></Form.Item></Col>
        <Col span={12}><Form.Item label="灌溉上限 (%)" name="moisture_max"><InputNumber min={0} max={60} style={{ width: '100%' }} /></Form.Item></Col>
        <Col span={12}><Form.Item label="监测深度 (cm)" name="moisture_depth"><InputNumber min={10} max={200} style={{ width: '100%' }} /></Form.Item></Col>
      </Row>
    ),
  },
  {
    value: 'potential',
    title: '模式4：土壤水势阈值',
    desc: '设置灌溉起始水势阈值（kPa），更精准反映植物可用水',
    form: (
      <Row gutter={16}>
        <Col span={12}><Form.Item label="灌溉起始水势 (kPa)" name="potential_start"><InputNumber min={-200} max={0} style={{ width: '100%' }} /></Form.Item></Col>
        <Col span={12}><Form.Item label="停灌水势 (kPa)" name="potential_stop"><InputNumber min={-50} max={0} style={{ width: '100%' }} /></Form.Item></Col>
      </Row>
    ),
  },
  {
    value: 'plant',
    title: '模式5：植物水分亏缺指标',
    desc: '基于液流速率、茎径变化等生理指标，最智能的决策模式',
    form: (
      <Row gutter={16}>
        <Col span={12}><Form.Item label="液流速率阈值 (g/h)" name="sap_flow_threshold"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
        <Col span={12}><Form.Item label="茎径变化阈值 (mm)" name="stem_threshold"><InputNumber step={0.01} style={{ width: '100%' }} /></Form.Item></Col>
        <Col span={12}><Form.Item label="叶片膨压阈值 (MPa)" name="turgor_threshold"><InputNumber step={0.01} style={{ width: '100%' }} /></Form.Item></Col>
      </Row>
    ),
  },
];

// Steps items for Ant Design v5+
const stepItems = [
  { title: '基本信息' },
  { title: '传感器配置' },
  { title: '决策模式' },
  { title: '报警规则' },
];

// ── Component ────────────────────────────────────────────────────────────────
const Setup: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [sensors, setSensors] = useState<SensorRow[]>(defaultSensors);
  const [selectedMode, setSelectedMode] = useState<string>('moisture');
  const [alarmChecked, setAlarmChecked] = useState<string[]>(alarmOptions.map((a) => a.value));
  const [notifyMap, setNotifyMap] = useState<Record<string, string[]>>(
    Object.fromEntries(alarmOptions.map((a) => [a.value, ['wechat', 'sms']]))
  );
  const [successModal, setSuccessModal] = useState(false);
  const [form1] = Form.useForm();
  const [form3] = Form.useForm();

  // ── Sensor table ──
  const addSensor = () => {
    const key = Date.now().toString();
    setSensors((prev) => [
      ...prev,
      { key, type: '土壤水分', deviceId: '', location: '', mqttTopic: '', status: '待连接' },
    ]);
  };

  const updateSensor = (key: string, field: keyof SensorRow, value: string) => {
    setSensors((prev) =>
      prev.map((s) => {
        if (s.key !== key) return s;
        const updated = { ...s, [field]: value };
        if (field === 'type' || field === 'deviceId') {
          const topicMap: Record<string, string> = {
            '土壤水分': 'soil_moisture', '土壤水势': 'soil_potential',
            '气象站': 'weather', '液流计': 'sap_flow',
            '茎径传感器': 'stem_diameter', '流量计': 'flow_meter', '电磁阀': 'valve',
          };
          const t = field === 'type' ? value : s.type;
          const id = field === 'deviceId' ? value.toLowerCase().replace(/\s/g, '_') : s.deviceId.toLowerCase();
          updated.mqttTopic = `site001/sensor/${topicMap[t] ?? 'unknown'}${id ? '_' + id : ''}`;
        }
        return updated;
      })
    );
  };

  const removeSensor = (key: string) => setSensors((prev) => prev.filter((s) => s.key !== key));

  const sensorColumns: ColumnsType<SensorRow> = [
    { title: '序号', render: (_, __, i) => i + 1, width: 50 },
    {
      title: '传感器类型', dataIndex: 'type', width: 130,
      render: (v: string, r: SensorRow) => (
        <Select value={v} size="small" style={{ width: '100%' }}
          options={sensorTypes.map((t) => ({ value: t, label: t }))}
          onChange={(val) => updateSensor(r.key, 'type', val)} />
      ),
    },
    {
      title: '设备ID', dataIndex: 'deviceId', width: 120,
      render: (v: string, r: SensorRow) => (
        <Input value={v} size="small" onChange={(e) => updateSensor(r.key, 'deviceId', e.target.value)} />
      ),
    },
    {
      title: '安装位置/深度', dataIndex: 'location', width: 130,
      render: (v: string, r: SensorRow) => (
        <Input value={v} size="small" placeholder="如 40cm深" onChange={(e) => updateSensor(r.key, 'location', e.target.value)} />
      ),
    },
    {
      title: 'MQTT Topic', dataIndex: 'mqttTopic',
      render: (v: string, r: SensorRow) => (
        <Input value={v} size="small" onChange={(e) => updateSensor(r.key, 'mqttTopic', e.target.value)} />
      ),
    },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: () => <Tag color="default">待连接</Tag>,
    },
    {
      title: '操作', width: 60,
      render: (_: unknown, r: SensorRow) => (
        <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => removeSensor(r.key)} />
      ),
    },
  ];

  // ── Step content ──
  const stepContents = [
    // Step 1: Basic info
    (
      <Form form={form1} layout="vertical" style={{ maxWidth: 600 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="站点名称" name="siteName" rules={[{ required: true }]}>
              <Input placeholder="请输入站点名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="植物类型" name="plantType" rules={[{ required: true }]}>
              <Select options={['毛白杨','苹果','梨','玉米','小麦','其他'].map((v) => ({ value: v, label: v }))} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="土壤类型" name="soilType" rules={[{ required: true }]}>
              <Select options={['沙土','壤土','粘土','沙壤土'].map((v) => ({ value: v, label: v }))} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="气候区" name="climateZone" rules={[{ required: true }]}>
              <Select options={['暖温带半湿润','温带半干旱','亚热带湿润','其他'].map((v) => ({ value: v, label: v }))} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="种植面积（亩）" name="area" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="灌溉方式" name="irrigationMethod" rules={[{ required: true }]}>
              <Radio.Group>
                <Radio value="滴灌">滴灌</Radio>
                <Radio value="喷灌">喷灌</Radio>
                <Radio value="漫灌">漫灌</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    ),
    // Step 2: Sensor config
    (
      <div>
        <Table
          columns={sensorColumns}
          dataSource={sensors}
          rowKey="key"
          size="small"
          pagination={false}
          scroll={{ x: 800 }}
          style={{ marginBottom: 12 }}
        />
        <Button icon={<PlusOutlined />} onClick={addSensor} type="dashed">
          添加传感器
        </Button>
      </div>
    ),
    // Step 3: Decision mode
    (
      <Form form={form3} layout="vertical">
        <Radio.Group
          value={selectedMode}
          onChange={(e) => setSelectedMode(e.target.value)}
          style={{ width: '100%' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            {decisionModes.map((m) => (
              <Card
                key={m.value}
                size="small"
                style={{
                  borderRadius: 8,
                  border: selectedMode === m.value ? '2px solid #52c41a' : '1px solid #d9d9d9',
                  background: selectedMode === m.value ? '#f6ffed' : '#fff',
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedMode(m.value)}
              >
                <Radio value={m.value}>
                  <Text strong>{m.title}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>{m.desc}</Text>
                </Radio>
                {selectedMode === m.value && (
                  <div style={{ marginTop: 12, paddingLeft: 24 }}>
                    <Divider style={{ margin: '8px 0' }} />
                    {m.form}
                  </div>
                )}
              </Card>
            ))}
          </Space>
        </Radio.Group>
      </Form>
    ),
    // Step 4: Alarm rules
    (
      <div style={{ maxWidth: 700 }}>
        {alarmOptions.map((alarm) => (
          <Card key={alarm.value} size="small" style={{ marginBottom: 8, borderRadius: 6 }}>
            <Row align="middle" gutter={16}>
              <Col flex="auto">
                <Checkbox
                  checked={alarmChecked.includes(alarm.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setAlarmChecked((prev) => [...prev, alarm.value]);
                    } else {
                      setAlarmChecked((prev) => prev.filter((v) => v !== alarm.value));
                    }
                  }}
                >
                  {alarm.label}
                </Checkbox>
              </Col>
              <Col>
                <Checkbox.Group
                  options={notifyOptions}
                  value={notifyMap[alarm.value] ?? []}
                  onChange={(vals) =>
                    setNotifyMap((prev) => ({ ...prev, [alarm.value]: vals as string[] }))
                  }
                />
              </Col>
            </Row>
          </Card>
        ))}
      </div>
    ),
  ];

  const next = () => {
    if (current === 0) {
      form1.validateFields().then(() => setCurrent((c) => c + 1)).catch(() => {});
    } else {
      setCurrent((c) => c + 1);
    }
  };

  const prev = () => setCurrent((c) => c - 1);

  const save = () => {
    message.loading('正在保存配置...', 1);
    setTimeout(() => setSuccessModal(true), 1000);
  };

  return (
    <div className="page-container">
      <Title level={4} style={{ marginBottom: 24 }}>灌溉配置向导</Title>

      <Card style={{ borderRadius: 8 }}>
        <Steps current={current} items={stepItems} style={{ marginBottom: 32 }} />

        <div style={{ minHeight: 300 }}>{stepContents[current]}</div>

        <Divider />
        <Space>
          {current > 0 && <Button onClick={prev}>上一步</Button>}
          {current < stepContents.length - 1 && (
            <Button type="primary" onClick={next}>下一步</Button>
          )}
          {current === stepContents.length - 1 && (
            <Button type="primary" onClick={save}>保存配置</Button>
          )}
        </Space>
      </Card>

      <Modal
        open={successModal}
        onOk={() => setSuccessModal(false)}
        onCancel={() => setSuccessModal(false)}
        title={null}
        footer={<Button type="primary" onClick={() => setSuccessModal(false)}>完成</Button>}
        centered
      >
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <CheckCircleOutlined style={{ fontSize: 56, color: '#52c41a' }} />
          <Title level={3} style={{ marginTop: 16, color: '#52c41a' }}>配置保存成功！</Title>
          <Text type="secondary">灌溉配置已保存，系统将按新规则执行灌溉决策。</Text>
        </div>
      </Modal>
    </div>
  );
};

export default Setup;
