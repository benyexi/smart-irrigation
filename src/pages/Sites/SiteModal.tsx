import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Select,
  Slider,
  Space,
  Steps,
  Switch,
  Table,
  Tag,
  TimePicker,
  Tooltip,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { plantRecommendations } from '../../mock/knowledge';
import type { AlarmRule, ModeParams, Pipeline, Sensor, Site } from '../../types/site';
import { saveSite } from '../../utils/siteStorage';

type DrawMode = 'none' | 'pipe' | 'sprinkler';

interface SiteModalProps {
  open: boolean;
  initialSite: Site | null;
  onCancel: () => void;
  onSaved: (site: Site) => void;
}

interface BasicState {
  siteName: string;
  province: string;
  city: string;
  lat: number | undefined;
  lng: number | undefined;
  plantType: string;
  soilType: string;
  climateZone: string;
  area: number | undefined;
  irrigationType: Site['irrigationType'];
}

const provinces = [
  '北京市', '天津市', '上海市', '重庆市', '河北省', '山西省', '辽宁省', '吉林省', '黑龙江省',
  '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省', '河南省', '湖北省', '湖南省',
  '广东省', '海南省', '四川省', '贵州省', '云南省', '陕西省', '甘肃省', '青海省', '台湾省',
  '内蒙古自治区', '广西壮族自治区', '西藏自治区', '宁夏回族自治区', '新疆维吾尔自治区',
  '香港特别行政区', '澳门特别行政区',
];

const plantOptions = ['毛白杨', '苹果', '梨', '桃', '葡萄', '玉米', '小麦', '棉花', '其他'];
const soilOptions = ['沙土', '沙壤土', '壤土', '粘壤土', '粘土'];
const climateOptions = ['暖温带半湿润', '温带半干旱', '亚热带湿润', '其他'];

const referenceDepthOptions = ['20cm', '40cm', '60cm', '80cm'];

const sensorTypeOptions: Array<{ value: Sensor['type']; label: string }> = [
  { value: 'soil_moisture', label: '土壤水分' },
  { value: 'soil_potential', label: '土壤水势' },
  { value: 'weather_station', label: '气象站' },
  { value: 'sapflow', label: '液流计' },
  { value: 'stem_diameter', label: '茎径传感器' },
  { value: 'leaf_turgor', label: '叶片膨压' },
  { value: 'flow_meter', label: '流量计' },
  { value: 'valve', label: '电磁阀' },
  { value: 'pump', label: '水泵' },
];

const decisionModes: Array<{ id: 1 | 2 | 3 | 4 | 5; name: string; desc: string }> = [
  { id: 1, name: '定时灌溉', desc: '按时段和目标水量执行灌溉。' },
  { id: 2, name: 'ET₀计算法 FAO-56', desc: '按参考蒸散量和作物系数计算需水。' },
  { id: 3, name: '土壤含水率阈值', desc: '低于下限开灌，高于上限停灌。' },
  { id: 4, name: '土壤水势阈值', desc: '按水势阈值控制灌溉启停。' },
  { id: 5, name: '植物水分亏缺指标（推荐）', desc: '融合液流、茎径、膨压综合评分。' },
];

const systemAlarmDefs = [
  { key: 'valveNotOpen', label: '电磁阀未开启' },
  { key: 'filterBlocked', label: '过滤器堵塞（压差>0.05MPa）' },
  { key: 'pipeBreak', label: '管道破裂（流量偏差>30%）' },
  { key: 'pumpError', label: '水泵/电机异常' },
  { key: 'sensorOffline', label: '传感器断联（>30min）' },
];

const dataAlarmDefs = [
  { key: 'soilWaterHigh', label: '土壤含水率超上限' },
  { key: 'soilWaterLow', label: '土壤含水率低于下限' },
  { key: 'sapflowAbnormal', label: '液流速率异常（<50g/h）' },
  { key: 'stemShrink', label: '茎径收缩超阈值' },
  { key: 'et0High', label: 'ET₀连续3天>6mm' },
];

const alarmDefs = [...systemAlarmDefs, ...dataAlarmDefs];

const clamp = (value: number, min: number, max: number) => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const defaultBasicState = (): BasicState => ({
  siteName: '',
  province: '',
  city: '',
  lat: undefined,
  lng: undefined,
  plantType: '苹果',
  soilType: '壤土',
  climateZone: '暖温带半湿润',
  area: undefined,
  irrigationType: 'drip',
});

const defaultModeParams = (): ModeParams => ({
  rainDiscount: 0.75,
  referenceDepths: ['40cm'],
  weights: { sapflow: 40, stem: 35, turgor: 25 },
});

const defaultAlarmRules = (): AlarmRule[] =>
  alarmDefs.map((item) => ({
    key: item.key,
    enabled: true,
    notify: ['wechat'],
  }));

const mergeAlarmRules = (rules: AlarmRule[]): AlarmRule[] => {
  const ruleMap = new Map(rules.map((rule) => [rule.key, rule]));
  return alarmDefs.map((def) => {
    const existing = ruleMap.get(def.key);
    if (existing) return existing;
    return { key: def.key, enabled: true, notify: ['wechat'] };
  });
};

const sensorTypeLabel = (type: Sensor['type']) => {
  const target = sensorTypeOptions.find((item) => item.value === type);
  return target ? target.label : type;
};

const createSensor = (x = 50, y = 50): Sensor => ({
  id: makeId('sensor'),
  type: 'soil_moisture',
  deviceId: '',
  location: '',
  topic: '',
  x,
  y,
});

const createSiteId = () => {
  const cryptoAny = globalThis.crypto as Crypto | undefined;
  if (cryptoAny && typeof cryptoAny.randomUUID === 'function') {
    return cryptoAny.randomUUID();
  }
  return makeId('site');
};

const getCoordsFromEvent = (evt: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
  const rect = evt.currentTarget.getBoundingClientRect();
  const x = ((evt.clientX - rect.left) / rect.width) * 100;
  const y = ((evt.clientY - rect.top) / rect.height) * 100;
  return { x: clamp(x, 0, 100), y: clamp(y, 0, 100) };
};

const SiteModal: React.FC<SiteModalProps> = ({ open, initialSite, onCancel, onSaved }) => {
  const [step, setStep] = useState(0);
  const [basic, setBasic] = useState<BasicState>(defaultBasicState);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [decisionMode, setDecisionMode] = useState<Site['decisionMode']>(null);
  const [modeParams, setModeParams] = useState<ModeParams>(defaultModeParams);
  const [alarmRules, setAlarmRules] = useState<AlarmRule[]>(defaultAlarmRules);

  const [drawMode, setDrawMode] = useState<DrawMode>('none');
  const [pipeStart, setPipeStart] = useState<{ x: number; y: number } | null>(null);
  const [pipeHover, setPipeHover] = useState<{ x: number; y: number } | null>(null);
  const [dragSensorId, setDragSensorId] = useState<string | null>(null);
  const [addSensorAt, setAddSensorAt] = useState<{ x: number; y: number } | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (open === false) {
      return;
    }
    queueMicrotask(() => {
      setStep(0);
      setDrawMode('none');
      setPipeStart(null);
      setPipeHover(null);
      setDragSensorId(null);
      setAddSensorAt(null);

      if (initialSite) {
        setBasic({
          siteName: initialSite.name,
          province: initialSite.province,
          city: initialSite.city,
          lat: initialSite.lat,
          lng: initialSite.lng,
          plantType: initialSite.plantType,
          soilType: initialSite.soilType,
          climateZone: initialSite.climateZone,
          area: initialSite.area,
          irrigationType: initialSite.irrigationType,
        });
        setSensors(initialSite.sensors);
        setPipelines(initialSite.pipelines);
        setDecisionMode(initialSite.decisionMode);
        setModeParams({ ...defaultModeParams(), ...initialSite.modeParams });
        setAlarmRules(mergeAlarmRules(initialSite.alarmRules));
        return;
      }

      setBasic(defaultBasicState());
      setSensors([]);
      setPipelines([]);
      setDecisionMode(null);
      setModeParams(defaultModeParams());
      setAlarmRules(defaultAlarmRules());
    });
  }, [open, initialSite]);

  const recommendation = useMemo(() => plantRecommendations[basic.plantType], [basic.plantType]);

  const sensorTypeStats = useMemo(() => {
    const counts = new Map<Sensor['type'], number>();
    sensors.forEach((sensor) => {
      const prev = counts.get(sensor.type) ?? 0;
      counts.set(sensor.type, prev + 1);
    });
    return sensorTypeOptions
      .map((item) => ({ type: item.value, label: item.label, count: counts.get(item.value) ?? 0 }))
      .filter((item) => item.count > 0);
  }, [sensors]);

  const alarmRuleMap = useMemo(() => {
    const map = new Map<string, AlarmRule>();
    alarmRules.forEach((rule) => map.set(rule.key, rule));
    return map;
  }, [alarmRules]);

  const updateSensor = (id: string, patch: Partial<Sensor>) => {
    setSensors((prev) => prev.map((sensor) => (sensor.id === id ? { ...sensor, ...patch } : sensor)));
  };

  const updateModeParams = (patch: Partial<ModeParams>) => {
    setModeParams((prev) => ({ ...prev, ...patch }));
  };

  const updateAlarmRule = (key: string, patch: Partial<AlarmRule>) => {
    setAlarmRules((prev) =>
      prev.map((rule) => {
        if (rule.key === key) {
          return { ...rule, ...patch };
        }
        return rule;
      }),
    );
  };

  const generateTopic = (sensor: Sensor) => {
    const siteName = basic.siteName.trim();
    const deviceId = sensor.deviceId.trim();
    const topic = `site/${siteName}/${sensor.type}/${deviceId}`;
    updateSensor(sensor.id, { topic });
  };

  const onAddSensor = (x?: number, y?: number) => {
    const nextX = typeof x === 'number' ? x : 50;
    const nextY = typeof y === 'number' ? y : 50;
    setSensors((prev) => [...prev, createSensor(nextX, nextY)]);
    setAddSensorAt(null);
  };

  const onDeleteSensor = (id: string) => {
    setSensors((prev) => prev.filter((sensor) => sensor.id !== id));
  };

  const onSvgMouseMove = (evt: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const coords = getCoordsFromEvent(evt);
    if (drawMode === 'pipe' && pipeStart) {
      setPipeHover(coords);
    }
    if (dragSensorId) {
      setSensors((prev) =>
        prev.map((sensor) => {
          if (sensor.id === dragSensorId) {
            return { ...sensor, x: coords.x, y: coords.y };
          }
          return sensor;
        }),
      );
    }
  };

  const onSvgMouseUp = () => {
    setDragSensorId(null);
  };

  const onSvgClick = (evt: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const coords = getCoordsFromEvent(evt);

    if (drawMode === 'pipe') {
      if (pipeStart) {
        setPipelines((prev) => [
          ...prev,
          {
            id: makeId('pipe'),
            type: 'pipe',
            x1: pipeStart.x,
            y1: pipeStart.y,
            x2: coords.x,
            y2: coords.y,
          },
        ]);
        setPipeStart(null);
        setPipeHover(null);
      } else {
        setPipeStart(coords);
        setPipeHover(coords);
      }
      return;
    }

    if (drawMode === 'sprinkler') {
      setPipelines((prev) => [...prev, { id: makeId('sprinkler'), type: 'sprinkler', x: coords.x, y: coords.y }]);
      return;
    }

    setAddSensorAt(coords);
  };

  const onSetDrawMode = (mode: DrawMode) => {
    setDrawMode(mode);
    setPipeStart(null);
    setPipeHover(null);
    setAddSensorAt(null);
  };

  const onClearPipelines = () => {
    setPipelines([]);
    setPipeStart(null);
    setPipeHover(null);
  };

  const onModeSelect = (modeId: 1 | 2 | 3 | 4 | 5) => {
    setDecisionMode(modeId);
    if (modeId === 3 && recommendation) {
      updateModeParams({
        lowerLimit: recommendation.moistureRange[0],
        upperLimit: recommendation.moistureRange[1],
      });
    }
    if (modeId === 5) {
      const weights = modeParams.weights ?? { sapflow: 40, stem: 35, turgor: 25 };
      updateModeParams({ weights });
    }
  };

  const onWeightChange = (key: 'sapflow' | 'stem' | 'turgor', value: number) => {
    const current = modeParams.weights ?? { sapflow: 40, stem: 35, turgor: 25 };
    const next = { ...current };
    next[key] = clamp(Math.round(value), 0, 100);

    const otherKeys: Array<'sapflow' | 'stem' | 'turgor'> = ['sapflow', 'stem', 'turgor'].filter(
      (item): item is 'sapflow' | 'stem' | 'turgor' => item !== key,
    );

    const left = 100 - next[key];
    const baseSum = current[otherKeys[0]] + current[otherKeys[1]];

    if (baseSum > 0) {
      const first = Math.round((current[otherKeys[0]] / baseSum) * left);
      next[otherKeys[0]] = first;
      next[otherKeys[1]] = left - first;
    } else {
      next[otherKeys[0]] = Math.round(left / 2);
      next[otherKeys[1]] = left - next[otherKeys[0]];
    }

    updateModeParams({ weights: next });
  };

  const sensorColumns: ColumnsType<Sensor> = [
    {
      title: '类型',
      dataIndex: 'type',
      width: 140,
      render: (_, sensor) => (
        <Select
          value={sensor.type}
          style={{ width: 120 }}
          options={sensorTypeOptions}
          onChange={(value) => updateSensor(sensor.id, { type: value })}
        />
      ),
    },
    {
      title: '设备ID',
      dataIndex: 'deviceId',
      width: 100,
      render: (_, sensor) => (
        <Input
          value={sensor.deviceId}
          style={{ width: 80 }}
          onChange={(evt) => updateSensor(sensor.id, { deviceId: evt.target.value })}
        />
      ),
    },
    {
      title: '安装位置',
      dataIndex: 'location',
      width: 130,
      render: (_, sensor) => (
        <Input
          value={sensor.location}
          style={{ width: 110 }}
          onChange={(evt) => updateSensor(sensor.id, { location: evt.target.value })}
        />
      ),
    },
    {
      title: 'Topic',
      dataIndex: 'topic',
      width: 220,
      render: (_, sensor) => (
        <Space size={4}>
          <Input
            value={sensor.topic}
            style={{ width: 140 }}
            onChange={(evt) => updateSensor(sensor.id, { topic: evt.target.value })}
          />
          <Button size="small" onClick={() => generateTopic(sensor)}>
            生成
          </Button>
        </Space>
      ),
    },
    {
      title: 'X',
      dataIndex: 'x',
      width: 70,
      render: (_, sensor) => (
        <InputNumber
          min={0}
          max={100}
          value={sensor.x}
          style={{ width: 55 }}
          onChange={(value) => updateSensor(sensor.id, { x: typeof value === 'number' ? value : sensor.x })}
        />
      ),
    },
    {
      title: 'Y',
      dataIndex: 'y',
      width: 70,
      render: (_, sensor) => (
        <InputNumber
          min={0}
          max={100}
          value={sensor.y}
          style={{ width: 55 }}
          onChange={(value) => updateSensor(sensor.id, { y: typeof value === 'number' ? value : sensor.y })}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 70,
      render: (_, sensor) => (
        <Button danger size="small" onClick={() => onDeleteSensor(sensor.id)}>
          删除
        </Button>
      ),
    },
  ];

  const renderSensorIcon = (sensor: Sensor) => {
    const commonStyle = {
      cursor: 'grab',
    };

    if (sensor.type === 'soil_moisture' || sensor.type === 'soil_potential') {
      return (
        <g>
          <circle cx={sensor.x} cy={sensor.y} r={1.8} fill="#4f9cf9" style={commonStyle} />
          <line x1={sensor.x} y1={sensor.y + 1.8} x2={sensor.x} y2={sensor.y + 4.5} stroke="#4f9cf9" strokeWidth={0.8} />
          <line x1={sensor.x - 1.2} y1={sensor.y + 3.8} x2={sensor.x} y2={sensor.y + 4.8} stroke="#4f9cf9" strokeWidth={0.8} />
          <line x1={sensor.x + 1.2} y1={sensor.y + 3.8} x2={sensor.x} y2={sensor.y + 4.8} stroke="#4f9cf9" strokeWidth={0.8} />
        </g>
      );
    }

    if (sensor.type === 'weather_station') {
      return (
        <polygon
          points={`${sensor.x},${sensor.y - 2.2} ${sensor.x - 2.2},${sensor.y + 2} ${sensor.x + 2.2},${sensor.y + 2}`}
          fill="#ff6b35"
          style={commonStyle}
        />
      );
    }

    if (sensor.type === 'sapflow' || sensor.type === 'stem_diameter' || sensor.type === 'leaf_turgor') {
      return (
        <g>
          <circle cx={sensor.x} cy={sensor.y} r={1.8} fill="none" stroke="#00d4aa" strokeWidth={0.8} style={commonStyle} />
          <line x1={sensor.x - 1} y1={sensor.y} x2={sensor.x + 1} y2={sensor.y} stroke="#00d4aa" strokeWidth={0.8} />
          <line x1={sensor.x} y1={sensor.y - 1} x2={sensor.x} y2={sensor.y + 1} stroke="#00d4aa" strokeWidth={0.8} />
        </g>
      );
    }

    if (sensor.type === 'valve') {
      return <rect x={sensor.x - 1.5} y={sensor.y - 1.5} width={3} height={3} fill="#ff4757" style={commonStyle} />;
    }

    if (sensor.type === 'pump') {
      const points = Array.from({ length: 6 }).map((_, idx) => {
        const angle = (Math.PI / 3) * idx;
        return `${sensor.x + Math.cos(angle) * 2},${sensor.y + Math.sin(angle) * 2}`;
      });
      return <polygon points={points.join(' ')} fill="#4f9cf9" style={commonStyle} />;
    }

    return (
      <polygon
        points={`${sensor.x},${sensor.y - 2.2} ${sensor.x - 2.2},${sensor.y} ${sensor.x},${sensor.y + 2.2} ${sensor.x + 2.2},${sensor.y}`}
        fill="#ffd700"
        style={commonStyle}
      />
    );
  };

  const canNext = () => {
    if (step === 0) {
      return basic.siteName.trim().length > 0;
    }
    return true;
  };

  const saveCurrentSite = () => {
    if (basic.siteName.trim().length === 0) {
      message.warning('请先填写站点名称');
      setStep(0);
      return;
    }

    const now = new Date().toISOString();
    const id = initialSite ? initialSite.id : createSiteId();
    const status = initialSite
      ? initialSite.status
      : decisionMode === null
        ? 'pending'
        : 'running';

    const nextSite: Site = {
      id,
      name: basic.siteName.trim(),
      province: basic.province,
      city: basic.city,
      lat: typeof basic.lat === 'number' ? basic.lat : 0,
      lng: typeof basic.lng === 'number' ? basic.lng : 0,
      plantType: basic.plantType,
      soilType: basic.soilType,
      climateZone: basic.climateZone,
      area: typeof basic.area === 'number' ? basic.area : 0,
      irrigationType: basic.irrigationType,
      sensors,
      pipelines,
      decisionMode,
      modeParams,
      alarmRules,
      status,
      createdAt: initialSite ? initialSite.createdAt : now,
      updatedAt: now,
    };

    saveSite(nextSite);
    message.success('站点保存成功！');
    onSaved(nextSite);
  };

  const renderAlarmBlock = (title: string, defs: Array<{ key: string; label: string }>) => (
    <div className="site-alert-box">
      <div className="site-alert-title">{title}</div>
      {defs.map((item) => {
        const rule = alarmRuleMap.get(item.key) ?? { key: item.key, enabled: true, notify: ['wechat'] as const };
        return (
          <div className="site-alert-row" key={item.key}>
            <Switch
              checked={rule.enabled}
              onChange={(checked) => updateAlarmRule(item.key, { enabled: checked })}
            />
            <div className="site-alert-content">
              <div className="site-alert-label">{item.label}</div>
              <Checkbox.Group
                options={[
                  { label: '微信', value: 'wechat' },
                  { label: '短信', value: 'sms' },
                  { label: '邮件', value: 'email' },
                ]}
                value={rule.notify}
                onChange={(list) => updateAlarmRule(item.key, { notify: list as Array<'wechat' | 'sms' | 'email'> })}
              />
            </div>
          </div>
        );
      })}
    </div>
  );

  const weights = modeParams.weights ?? { sapflow: 40, stem: 35, turgor: 25 };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={1000}
      destroyOnClose
      className="site-modal"
      title={null}
    >
      <div className="site-modal-header">
        <Space direction="vertical" size={2}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#e8eaf0' }}>
            {initialSite ? '编辑站点配置' : '新建站点'}
          </div>
          <div style={{ fontSize: 12, color: '#8892a4' }}>站点管理 · Site Management</div>
        </Space>
      </div>

      <div className="site-modal-body">
        <Steps
          current={step}
          items={[
            { title: '基本信息' },
            { title: '传感器与平面图' },
            { title: '决策模式' },
            { title: '报警规则' },
          ]}
        />

        <div className="site-step-panel">
          {step === 0 && (
            <Form layout="horizontal" labelCol={{ span: 8 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="站点名称" required>
                    <Input
                      value={basic.siteName}
                      placeholder="如：陕西苹果示范园"
                      onChange={(evt) => setBasic((prev) => ({ ...prev, siteName: evt.target.value }))}
                    />
                  </Form.Item>
                  <Form.Item label="省份">
                    <Select
                      value={basic.province}
                      options={provinces.map((item) => ({ value: item, label: item }))}
                      onChange={(value) => setBasic((prev) => ({ ...prev, province: value }))}
                      showSearch
                    />
                  </Form.Item>
                  <Form.Item label="城市">
                    <Input
                      value={basic.city}
                      onChange={(evt) => setBasic((prev) => ({ ...prev, city: evt.target.value }))}
                    />
                  </Form.Item>
                  <Form.Item label="纬度">
                    <InputNumber
                      value={basic.lat}
                      precision={4}
                      style={{ width: '100%' }}
                      placeholder="如：36.5900"
                      onChange={(value) => setBasic((prev) => ({ ...prev, lat: typeof value === 'number' ? value : undefined }))}
                    />
                  </Form.Item>
                  <Form.Item label="经度">
                    <InputNumber
                      value={basic.lng}
                      precision={4}
                      style={{ width: '100%' }}
                      placeholder="如：109.4900"
                      onChange={(value) => setBasic((prev) => ({ ...prev, lng: typeof value === 'number' ? value : undefined }))}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item label="植物类型">
                    <Select
                      value={basic.plantType}
                      options={plantOptions.map((item) => ({ value: item, label: item }))}
                      onChange={(value) => setBasic((prev) => ({ ...prev, plantType: value }))}
                    />
                  </Form.Item>
                  <Form.Item label="土壤类型">
                    <Select
                      value={basic.soilType}
                      options={soilOptions.map((item) => ({ value: item, label: item }))}
                      onChange={(value) => setBasic((prev) => ({ ...prev, soilType: value }))}
                    />
                  </Form.Item>
                  <Form.Item label="气候分区">
                    <Select
                      value={basic.climateZone}
                      options={climateOptions.map((item) => ({ value: item, label: item }))}
                      onChange={(value) => setBasic((prev) => ({ ...prev, climateZone: value }))}
                    />
                  </Form.Item>
                  <Form.Item label="面积">
                    <InputNumber
                      min={0.1}
                      value={basic.area}
                      style={{ width: '100%' }}
                      addonAfter="亩"
                      onChange={(value) => setBasic((prev) => ({ ...prev, area: typeof value === 'number' ? value : undefined }))}
                    />
                  </Form.Item>
                  <Form.Item label="灌溉方式">
                    <Radio.Group
                      value={basic.irrigationType}
                      onChange={(evt) => setBasic((prev) => ({ ...prev, irrigationType: evt.target.value as Site['irrigationType'] }))}
                    >
                      <Radio value="drip">滴灌</Radio>
                      <Radio value="spray">喷灌</Radio>
                      <Radio value="flood">漫灌</Radio>
                    </Radio.Group>
                  </Form.Item>

                  {recommendation ? (
                    <Card className="site-plant-recommend" bordered={false}>
                      <h4>推荐参数</h4>
                      <p>适宜含水率范围：{recommendation.moistureRange[0]}% - {recommendation.moistureRange[1]}%</p>
                      <p>灌溉起始水势：{recommendation.startPotential} kPa</p>
                      <p>参考 Kc 值：{recommendation.kc}</p>
                    </Card>
                  ) : null}
                </Col>
              </Row>
            </Form>
          )}

          {step === 1 && (
            <div className="site-editor-layout">
              <div className="site-editor-left">
                <div className="site-sensor-summary">
                  {sensorTypeStats.map((item) => (
                    <Badge
                      key={item.type}
                      count={item.count}
                      style={{ backgroundColor: '#4f9cf9' }}
                      title={item.label}
                    />
                  ))}
                </div>

                <Table<Sensor>
                  size="small"
                  rowKey="id"
                  columns={sensorColumns}
                  dataSource={sensors}
                  pagination={false}
                  scroll={{ x: 860, y: 320 }}
                />

                <Button type="dashed" style={{ width: '100%', marginTop: 10 }} onClick={() => onAddSensor()}>
                  ＋ 添加传感器
                </Button>
              </div>

              <div className="site-editor-right">
                <div className="site-svg-wrap">
                  {addSensorAt ? (
                    <div
                      className="site-add-pop"
                      style={{ left: `${addSensorAt.x}%`, top: `${addSensorAt.y}%` }}
                    >
                      <Button size="small" type="primary" onClick={() => onAddSensor(addSensorAt.x, addSensorAt.y)}>
                        在此处添加传感器
                      </Button>
                    </div>
                  ) : null}

                  <svg
                    ref={svgRef}
                    viewBox="0 0 100 100"
                    onMouseMove={onSvgMouseMove}
                    onMouseUp={onSvgMouseUp}
                    onMouseLeave={onSvgMouseUp}
                    onClick={onSvgClick}
                  >
                    <rect x="0" y="0" width="100" height="100" fill="#0f1117" />
                    <rect x="1" y="1" width="98" height="98" fill="none" stroke="#00d4aa" strokeWidth="0.6" />

                    {Array.from({ length: 9 }).map((_, idx) => {
                      const pos = (idx + 1) * 10;
                      return (
                        <g key={`grid-${pos}`}>
                          <line x1={pos} y1={1} x2={pos} y2={99} stroke="#2a2d3e" strokeWidth={0.25} />
                          <line x1={1} y1={pos} x2={99} y2={pos} stroke="#2a2d3e" strokeWidth={0.25} />
                        </g>
                      );
                    })}

                    {pipelines.map((pipe) => {
                      if (pipe.type === 'pipe') {
                        return (
                          <line
                            key={pipe.id}
                            x1={pipe.x1}
                            y1={pipe.y1}
                            x2={pipe.x2}
                            y2={pipe.y2}
                            stroke="#4f9cf9"
                            strokeWidth={0.8}
                          />
                        );
                      }

                      const x = pipe.x ?? 50;
                      const y = pipe.y ?? 50;
                      return (
                        <g key={pipe.id}>
                          <circle cx={x} cy={y} r={1.2} fill="none" stroke="#4f9cf9" strokeWidth={0.8} />
                          {Array.from({ length: 8 }).map((__, rayIdx) => {
                            const angle = (Math.PI * 2 * rayIdx) / 8;
                            const x2 = x + Math.cos(angle) * 2.4;
                            const y2 = y + Math.sin(angle) * 2.4;
                            return <line key={`${pipe.id}-${rayIdx}`} x1={x} y1={y} x2={x2} y2={y2} stroke="#4f9cf9" strokeWidth={0.6} />;
                          })}
                        </g>
                      );
                    })}

                    {pipeStart && pipeHover ? (
                      <line
                        x1={pipeStart.x}
                        y1={pipeStart.y}
                        x2={pipeHover.x}
                        y2={pipeHover.y}
                        stroke="#4f9cf9"
                        strokeWidth={0.8}
                        strokeDasharray="1.2 1"
                      />
                    ) : null}

                    {sensors.map((sensor) => (
                      <g
                        key={sensor.id}
                        onMouseDown={(evt) => {
                          evt.stopPropagation();
                          setDragSensorId(sensor.id);
                        }}
                        onClick={(evt) => evt.stopPropagation()}
                      >
                        <title>{`${sensorTypeLabel(sensor.type)} / ${sensor.deviceId || '未填'} / ${sensor.location || '未填位置'}`}</title>
                        {renderSensorIcon(sensor)}
                        <text
                          x={sensor.x}
                          y={sensor.y + 6}
                          fill="#e8eaf0"
                          fontSize={2.2}
                          textAnchor="middle"
                        >
                          {sensor.deviceId || 'ID'}
                        </text>
                      </g>
                    ))}

                    <foreignObject x="2" y="2" width="72" height="12">
                      <div className="site-tool-row">
                        <button
                          type="button"
                          className={`site-tool-btn ${drawMode === 'pipe' ? 'active' : ''}`}
                          onClick={() => onSetDrawMode(drawMode === 'pipe' ? 'none' : 'pipe')}
                        >
                          ✏️ 画管道
                        </button>
                        <button
                          type="button"
                          className={`site-tool-btn ${drawMode === 'sprinkler' ? 'active' : ''}`}
                          onClick={() => onSetDrawMode(drawMode === 'sprinkler' ? 'none' : 'sprinkler')}
                        >
                          💧 画喷头
                        </button>
                        <button
                          type="button"
                          className="site-tool-btn"
                          onClick={onClearPipelines}
                        >
                          🗑️ 清除管道
                        </button>
                      </div>
                    </foreignObject>

                    <g>
                      <rect className="site-legend" x="67" y="66" width="31" height="31" rx="1.5" />
                      <text x="69" y="70" fill="#e8eaf0" fontSize={2.2}>图例</text>
                      <text x="69" y="74" fill="#e8eaf0" fontSize={2}>蓝点 土壤/设备</text>
                      <text x="69" y="78" fill="#e8eaf0" fontSize={2}>橙三角 气象站</text>
                      <text x="69" y="82" fill="#e8eaf0" fontSize={2}>绿环 植物监测</text>
                      <text x="69" y="86" fill="#e8eaf0" fontSize={2}>红方块 电磁阀</text>
                      <text x="69" y="90" fill="#e8eaf0" fontSize={2}>蓝六边形 水泵</text>
                      <text x="69" y="94" fill="#e8eaf0" fontSize={2}>黄菱形 流量计</text>
                    </g>
                  </svg>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <>
              <div className="site-mode-grid">
                {decisionModes.map((mode) => (
                  <div
                    key={mode.id}
                    className={`site-mode-card ${decisionMode === mode.id ? 'active' : ''}`}
                    onClick={() => onModeSelect(mode.id)}
                  >
                    <Tag color="#00d4aa" className="site-mode-tag">模式 {mode.id}</Tag>
                    <div className="site-mode-title">{mode.name}</div>
                    <div className="site-mode-desc">{mode.desc}</div>
                    {decisionMode === mode.id ? (
                      <Tag color="#00d4aa" className="site-mode-selected">已选</Tag>
                    ) : null}
                  </div>
                ))}
              </div>

              {decisionMode ? (
                <div className="site-mode-form">
                  {decisionMode === 1 ? (
                    <Row gutter={12}>
                      <Col span={8}>
                        <Form.Item label="开始时间">
                          <TimePicker
                            value={modeParams.startTime ? dayjs(modeParams.startTime, 'HH:mm') : null}
                            format="HH:mm"
                            onChange={(value) => updateModeParams({ startTime: value ? value.format('HH:mm') : undefined })}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="结束时间">
                          <TimePicker
                            value={modeParams.endTime ? dayjs(modeParams.endTime, 'HH:mm') : null}
                            format="HH:mm"
                            onChange={(value) => updateModeParams({ endTime: value ? value.format('HH:mm') : undefined })}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="灌溉水量">
                          <InputNumber
                            style={{ width: '100%' }}
                            value={modeParams.waterAmount}
                            addonAfter="m³/亩"
                            onChange={(value) => updateModeParams({ waterAmount: typeof value === 'number' ? value : undefined })}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  ) : null}

                  {decisionMode === 2 ? (
                    <>
                      <Row gutter={12}>
                        <Col span={8}>
                          <Form.Item label="Kc 值">
                            <InputNumber
                              min={0.1}
                              max={1.5}
                              step={0.01}
                              style={{ width: '100%' }}
                              value={modeParams.kc}
                              onChange={(value) => updateModeParams({ kc: typeof value === 'number' ? value : undefined })}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item label="ET₀来源">
                            <Radio.Group
                              value={modeParams.et0Source}
                              onChange={(evt) => updateModeParams({ et0Source: evt.target.value as 'auto' | 'manual' })}
                            >
                              <Radio value="auto">自动获取</Radio>
                              <Radio value="manual">手动输入</Radio>
                            </Radio.Group>
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item label="降雨折扣系数">
                            <InputNumber
                              style={{ width: '100%' }}
                              value={modeParams.rainDiscount}
                              onChange={(value) => updateModeParams({ rainDiscount: typeof value === 'number' ? value : undefined })}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Alert type="info" message="ETc - rainDiscount×降雨量 > 0时触发灌溉" showIcon />
                    </>
                  ) : null}

                  {decisionMode === 3 ? (
                    <Row gutter={12}>
                      <Col span={8}>
                        <Form.Item label="下限">
                          <InputNumber
                            style={{ width: '100%' }}
                            value={modeParams.lowerLimit}
                            addonAfter="%"
                            onChange={(value) => updateModeParams({ lowerLimit: typeof value === 'number' ? value : undefined })}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="上限">
                          <InputNumber
                            style={{ width: '100%' }}
                            value={modeParams.upperLimit}
                            addonAfter="%"
                            onChange={(value) => updateModeParams({ upperLimit: typeof value === 'number' ? value : undefined })}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="参考深度">
                          <Select
                            mode="multiple"
                            value={modeParams.referenceDepths}
                            options={referenceDepthOptions.map((item) => ({ value: item, label: item }))}
                            onChange={(value) => updateModeParams({ referenceDepths: value })}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  ) : null}

                  {decisionMode === 4 ? (
                    <Row gutter={12}>
                      <Col span={8}>
                        <Form.Item label="起始水势">
                          <InputNumber
                            style={{ width: '100%' }}
                            value={modeParams.startPressure}
                            addonAfter="kPa"
                            onChange={(value) => updateModeParams({ startPressure: typeof value === 'number' ? value : undefined })}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="停止水势">
                          <InputNumber
                            style={{ width: '100%' }}
                            value={modeParams.stopPressure}
                            addonAfter="kPa"
                            onChange={(value) => updateModeParams({ stopPressure: typeof value === 'number' ? value : undefined })}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="参考深度">
                          <Select
                            value={modeParams.referenceDepths ? modeParams.referenceDepths[0] : undefined}
                            options={referenceDepthOptions.map((item) => ({ value: item, label: item }))}
                            onChange={(value) => updateModeParams({ referenceDepths: [value] })}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  ) : null}

                  {decisionMode === 5 ? (
                    <>
                      <Row gutter={12}>
                        <Col span={8}>
                          <Form.Item label="液流下限">
                            <Tooltip title="低于此值触发灌溉">
                              <InputNumber
                                style={{ width: '100%' }}
                                value={modeParams.sapflowMin}
                                addonAfter="g/h"
                                onChange={(value) => updateModeParams({ sapflowMin: typeof value === 'number' ? value : undefined })}
                              />
                            </Tooltip>
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item label="茎径阈值">
                            <Tooltip title="日收缩量超过此值触发">
                              <InputNumber
                                style={{ width: '100%' }}
                                value={modeParams.stemDiameterThreshold}
                                addonAfter="mm"
                                onChange={(value) => updateModeParams({ stemDiameterThreshold: typeof value === 'number' ? value : undefined })}
                              />
                            </Tooltip>
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item label="膨压下限">
                            <InputNumber
                              style={{ width: '100%' }}
                              value={modeParams.turgorMin}
                              addonAfter="MPa"
                              onChange={(value) => updateModeParams({ turgorMin: typeof value === 'number' ? value : undefined })}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={12} align="middle" style={{ marginBottom: 8 }}>
                        <Col span={6}>液流权重</Col>
                        <Col span={14}>
                          <Slider value={weights.sapflow} onChange={(value) => onWeightChange('sapflow', Number(value))} />
                        </Col>
                        <Col span={4}>{weights.sapflow}%</Col>
                      </Row>

                      <Row gutter={12} align="middle" style={{ marginBottom: 8 }}>
                        <Col span={6}>茎径权重</Col>
                        <Col span={14}>
                          <Slider value={weights.stem} onChange={(value) => onWeightChange('stem', Number(value))} />
                        </Col>
                        <Col span={4}>{weights.stem}%</Col>
                      </Row>

                      <Row gutter={12} align="middle" style={{ marginBottom: 10 }}>
                        <Col span={6}>膨压权重</Col>
                        <Col span={14}>
                          <Slider value={weights.turgor} onChange={(value) => onWeightChange('turgor', Number(value))} />
                        </Col>
                        <Col span={4}>{weights.turgor}%</Col>
                      </Row>

                      <Alert type="info" showIcon message="加权综合评分 < 60分时触发灌溉" />
                    </>
                  ) : null}
                </div>
              ) : null}
            </>
          )}

          {step === 3 && (
            <div className="site-alert-grid">
              {renderAlarmBlock('系统报警', systemAlarmDefs)}
              {renderAlarmBlock('数据报警', dataAlarmDefs)}
            </div>
          )}
        </div>
      </div>

      <div className="site-modal-actions">
        <Button
          onClick={() => setStep((prev) => (prev > 0 ? prev - 1 : prev))}
          disabled={step === 0}
        >
          上一步
        </Button>

        <Space>
          {step < 3 ? (
            <Button
              type="primary"
              onClick={() => {
                if (canNext()) {
                  setStep((prev) => (prev < 3 ? prev + 1 : prev));
                } else {
                  message.warning('请先完善当前步骤必填项');
                }
              }}
            >
              下一步
            </Button>
          ) : (
            <Button type="primary" onClick={saveCurrentSite}>
              保存
            </Button>
          )}
        </Space>
      </div>
    </Modal>
  );
};

export default SiteModal;
