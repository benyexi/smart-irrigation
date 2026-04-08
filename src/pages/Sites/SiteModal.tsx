import React, { useEffect, useMemo, useState } from 'react';
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
import {
  generatePlantPositions,
  getDefaultPlantLayout,
  isWoodyPlant,
  type PlantLayoutSettings,
} from './fieldTemplates';

type DrawMode = 'none' | 'pipe' | 'sprinkler';
type QuickAddSensorType = Sensor['type'] | undefined;

type DragTarget =
  | { kind: 'sensor'; id: string }
  | { kind: 'sprinkler'; id: string }
  | { kind: 'pipe-start'; id: string }
  | { kind: 'pipe-end'; id: string }
  | null;

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

interface PlantPosition {
  id: string;
  x: number;
  y: number;
}

type ExtendedModeParams = ModeParams & { plantLayout?: PlantLayoutSettings };
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

const quickAddOptions = sensorTypeOptions.filter((item) => [
  'soil_moisture',
  'weather_station',
  'sapflow',
  'flow_meter',
  'valve',
  'pump',
].includes(item.value));

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

const clampPercent = (value: number | undefined | null) => {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    return null;
  }
  return clamp(value, 0, 100);
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

const sensorCategory = (type: Sensor['type']) => {
  if (type === 'soil_moisture' || type === 'soil_potential') return 'soil';
  if (type === 'weather_station') return 'atmosphere';
  if (type === 'sapflow' || type === 'stem_diameter' || type === 'leaf_turgor') return 'plant';
  return 'irrigation';
};

const sensorColor = (type: Sensor['type']) => {
  const category = sensorCategory(type);
  if (category === 'soil') return '#4f9cf9';
  if (category === 'atmosphere') return '#db7f2f';
  if (category === 'plant') return '#0f9d80';
  return '#cf4453';
};

const clampSpacing = (value: unknown, fallback: number) => {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    return fallback;
  }
  return clamp(value, 0.1, 20);
};

const getStoredPlantLayout = (params: ModeParams | null | undefined, plantType: string) => {
  const preset = getDefaultPlantLayout(plantType);
  const candidate = (params as ExtendedModeParams | null | undefined)?.plantLayout as
    | Partial<Record<'showPlants' | 'visible' | 'rowSpacing' | 'plantSpacing' | 'orientation' | 'direction', unknown>>
    | undefined;

  if (!candidate || typeof candidate !== 'object') {
    return undefined;
  }

  const orientationRaw = candidate.orientation ?? candidate.direction;
  const orientation = orientationRaw === 'horizontal' || orientationRaw === 'vertical'
    ? orientationRaw
    : preset.orientation;

  return {
    showPlants: typeof candidate.showPlants === 'boolean'
      ? candidate.showPlants
      : candidate.visible !== false,
    plantSpacing: clampSpacing(candidate.plantSpacing, preset.plantSpacing),
    rowSpacing: clampSpacing(candidate.rowSpacing, preset.rowSpacing),
    orientation,
  } satisfies PlantLayoutSettings;
};

const withPlantLayout = (params: ModeParams, plantLayout: PlantLayoutSettings): ModeParams => ({
  ...params,
  plantLayout,
} as ExtendedModeParams);

const createSensor = (x = 50, y = 50, type: Sensor['type'] = 'soil_moisture'): Sensor => ({
  id: makeId('sensor'),
  type,
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

const renderSensorIcon = (sensor: Sensor) => {
  const fill = sensorColor(sensor.type);
  const commonStyle = { cursor: 'grab' };

  if (sensor.type === 'soil_moisture' || sensor.type === 'soil_potential') {
    return (
      <g>
        <circle cx={sensor.x} cy={sensor.y} r={1.9} fill={fill} style={commonStyle} />
        <line x1={sensor.x} y1={sensor.y + 1.9} x2={sensor.x} y2={sensor.y + 5.1} stroke={fill} strokeWidth={0.9} />
        <line x1={sensor.x - 1.2} y1={sensor.y + 4.2} x2={sensor.x} y2={sensor.y + 5.2} stroke={fill} strokeWidth={0.85} />
        <line x1={sensor.x + 1.2} y1={sensor.y + 4.2} x2={sensor.x} y2={sensor.y + 5.2} stroke={fill} strokeWidth={0.85} />
      </g>
    );
  }

  if (sensor.type === 'weather_station') {
    return (
      <g>
        <line x1={sensor.x} y1={sensor.y - 2.8} x2={sensor.x} y2={sensor.y + 3.6} stroke={fill} strokeWidth={0.7} />
        <polygon
          points={`${sensor.x},${sensor.y - 3.4} ${sensor.x - 2.6},${sensor.y - 0.4} ${sensor.x + 2.6},${sensor.y - 0.4}`}
          fill={fill}
          style={commonStyle}
        />
      </g>
    );
  }

  if (sensor.type === 'sapflow' || sensor.type === 'stem_diameter' || sensor.type === 'leaf_turgor') {
    return (
      <g>
        <circle cx={sensor.x} cy={sensor.y} r={2.1} fill="none" stroke={fill} strokeWidth={0.9} style={commonStyle} />
        <line x1={sensor.x - 1.3} y1={sensor.y} x2={sensor.x + 1.3} y2={sensor.y} stroke={fill} strokeWidth={0.9} />
        <line x1={sensor.x} y1={sensor.y - 1.3} x2={sensor.x} y2={sensor.y + 1.3} stroke={fill} strokeWidth={0.9} />
      </g>
    );
  }

  if (sensor.type === 'valve') {
    return <rect x={sensor.x - 1.8} y={sensor.y - 1.8} width={3.6} height={3.6} rx={0.7} fill={fill} style={commonStyle} />;
  }

  if (sensor.type === 'pump') {
    const points = Array.from({ length: 6 }).map((_, index) => {
      const angle = (Math.PI / 3) * index;
      return `${sensor.x + Math.cos(angle) * 2.2},${sensor.y + Math.sin(angle) * 2.2}`;
    });
    return <polygon points={points.join(' ')} fill={fill} style={commonStyle} />;
  }

  return (
    <polygon
      points={`${sensor.x},${sensor.y - 2.4} ${sensor.x - 2.4},${sensor.y} ${sensor.x},${sensor.y + 2.4} ${sensor.x + 2.4},${sensor.y}`}
      fill={fill}
      style={commonStyle}
    />
  );
};

const renderTreeSymbol = (position: PlantPosition) => (
  <g key={`tree-${position.id}`} opacity={0.82}>
    <circle cx={position.x} cy={position.y - 0.6} r={1.25} fill="#5f9eff" />
    <circle cx={position.x - 0.7} cy={position.y} r={1.05} fill="#0f9d80" />
    <circle cx={position.x + 0.75} cy={position.y} r={1.05} fill="#0f9d80" />
    <rect x={position.x - 0.24} y={position.y + 0.8} width={0.48} height={1.4} rx={0.24} fill="#c7962f" />
  </g>
);

const renderLeafSymbol = (position: PlantPosition) => (
  <g key={`leaf-${position.id}`} opacity={0.88}>
    <ellipse cx={position.x - 0.55} cy={position.y} rx={0.82} ry={1.45} transform={`rotate(-28 ${position.x - 0.55} ${position.y})`} fill="#0f9d80" />
    <ellipse cx={position.x + 0.55} cy={position.y} rx={0.82} ry={1.45} transform={`rotate(28 ${position.x + 0.55} ${position.y})`} fill="#5f9eff" />
    <line x1={position.x} y1={position.y + 0.25} x2={position.x} y2={position.y + 1.7} stroke="#c7962f" strokeWidth={0.28} />
  </g>
);

const SiteModal: React.FC<SiteModalProps> = ({ open, initialSite, onCancel, onSaved }) => {
  const [step, setStep] = useState(0);
  const [basic, setBasic] = useState<BasicState>(defaultBasicState);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [decisionMode, setDecisionMode] = useState<Site['decisionMode']>(null);
  const [modeParams, setModeParams] = useState<ModeParams>(defaultModeParams);
  const [alarmRules, setAlarmRules] = useState<AlarmRule[]>(defaultAlarmRules);
  const [plantLayout, setPlantLayout] = useState<PlantLayoutSettings>(getDefaultPlantLayout('苹果'));

  const [drawMode, setDrawMode] = useState<DrawMode>('none');
  const [pipeStart, setPipeStart] = useState<{ x: number; y: number } | null>(null);
  const [pipeHover, setPipeHover] = useState<{ x: number; y: number } | null>(null);
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
  const [addSensorAt, setAddSensorAt] = useState<{ x: number; y: number } | null>(null);
  const [quickAddType, setQuickAddType] = useState<QuickAddSensorType>();

  useEffect(() => {
    if (open === false) {
      return;
    }

    queueMicrotask(() => {
      setStep(0);
      setDrawMode('none');
      setPipeStart(null);
      setPipeHover(null);
      setDragTarget(null);
      setAddSensorAt(null);
      setQuickAddType(undefined);

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
        setSensors(initialSite.sensors.map((sensor) => ({
          ...sensor,
          x: clamp(sensor.x, 0, 100),
          y: clamp(sensor.y, 0, 100),
        })));
        setPipelines(initialSite.pipelines.map((pipeline) => ({
          ...pipeline,
          x1: clampPercent(pipeline.x1) ?? undefined,
          y1: clampPercent(pipeline.y1) ?? undefined,
          x2: clampPercent(pipeline.x2) ?? undefined,
          y2: clampPercent(pipeline.y2) ?? undefined,
          x: clampPercent(pipeline.x) ?? undefined,
          y: clampPercent(pipeline.y) ?? undefined,
        })));
        setDecisionMode(initialSite.decisionMode);
        setModeParams({ ...defaultModeParams(), ...initialSite.modeParams });
        setPlantLayout(
          getStoredPlantLayout(initialSite.modeParams, initialSite.plantType)
          ?? getDefaultPlantLayout(initialSite.plantType),
        );
        setAlarmRules(mergeAlarmRules(initialSite.alarmRules));
        return;
      }

      const nextBasic = defaultBasicState();
      setBasic(nextBasic);
      setSensors([]);
      setPipelines([]);
      setDecisionMode(null);
      setModeParams(defaultModeParams());
      setPlantLayout(getDefaultPlantLayout(nextBasic.plantType));
      setAlarmRules(defaultAlarmRules());
    });
  }, [open, initialSite]);

  const recommendation = useMemo(() => plantRecommendations[basic.plantType], [basic.plantType]);
  const isWoody = useMemo(() => isWoodyPlant(basic.plantType), [basic.plantType]);
  const plantPositions = useMemo(
    () => (
      plantLayout.showPlants
        ? generatePlantPositions({
          areaMu: basic.area ?? 0,
          rowSpacing: plantLayout.rowSpacing,
          plantSpacing: plantLayout.plantSpacing,
          orientation: plantLayout.orientation,
        })
        : []
    ),
    [basic.area, plantLayout],
  );
  const plantLayoutSummary = useMemo(() => {
    const directionLabel = plantLayout.orientation === 'horizontal' ? '横向排布' : '纵向排布';
    const areaLabel = typeof basic.area === 'number' && basic.area > 0 ? `${basic.area} 亩` : '未设置面积';
    return `${basic.plantType} · 行距 ${plantLayout.rowSpacing}m × 株距 ${plantLayout.plantSpacing}m · ${directionLabel} · 点位 ${plantPositions.length} 个 · ${areaLabel}`;
  }, [basic.area, basic.plantType, plantLayout.orientation, plantLayout.plantSpacing, plantLayout.rowSpacing, plantPositions.length]);

  const sensorTypeStats = useMemo(() => {
    const counts = new Map<Sensor['type'], number>();
    sensors.forEach((sensor) => {
      counts.set(sensor.type, (counts.get(sensor.type) ?? 0) + 1);
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
    setAlarmRules((prev) => prev.map((rule) => (rule.key === key ? { ...rule, ...patch } : rule)));
  };

  const generateTopic = (sensor: Sensor) => {
    const siteName = basic.siteName.trim() || 'site';
    const deviceId = sensor.deviceId.trim() || sensor.id;
    const topic = `site/${siteName}/${sensor.type}/${deviceId}`;
    updateSensor(sensor.id, { topic });
  };

  const onAddSensor = (type: Sensor['type'] = 'soil_moisture', x?: number, y?: number) => {
    const nextX = typeof x === 'number' ? clamp(x, 0, 100) : 50;
    const nextY = typeof y === 'number' ? clamp(y, 0, 100) : 50;
    setSensors((prev) => [...prev, createSensor(nextX, nextY, type)]);
    setAddSensorAt(null);
  };

  const onDeleteSensor = (id: string) => {
    setSensors((prev) => prev.filter((sensor) => sensor.id !== id));
  };

  const onDeletePipeline = (id: string) => {
    setPipelines((prev) => prev.filter((pipeline) => pipeline.id !== id));
  };

  const onSvgMouseMove = (evt: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const coords = getCoordsFromEvent(evt);

    if (drawMode === 'pipe' && pipeStart) {
      setPipeHover(coords);
    }

    if (!dragTarget) {
      return;
    }

    if (dragTarget.kind === 'sensor') {
      setSensors((prev) => prev.map((sensor) => (
        sensor.id === dragTarget.id ? { ...sensor, x: coords.x, y: coords.y } : sensor
      )));
      return;
    }

    setPipelines((prev) => prev.map((pipeline) => {
      if (pipeline.id !== dragTarget.id) {
        return pipeline;
      }

      if (dragTarget.kind === 'sprinkler') {
        return { ...pipeline, x: coords.x, y: coords.y };
      }

      if (dragTarget.kind === 'pipe-start') {
        return { ...pipeline, x1: coords.x, y1: coords.y };
      }

      return { ...pipeline, x2: coords.x, y2: coords.y };
    }));
  };

  const onSvgMouseUp = () => {
    setDragTarget(null);
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
      setAddSensorAt(null);
      return;
    }

    if (quickAddType) {
      onAddSensor(quickAddType, coords.x, coords.y);
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
    const next = { ...current, [key]: clamp(Math.round(value), 0, 100) };
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
          style={{ width: 124 }}
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
          style={{ width: 90 }}
          onChange={(evt) => updateSensor(sensor.id, { deviceId: evt.target.value })}
        />
      ),
    },
    {
      title: '安装位置',
      dataIndex: 'location',
      width: 150,
      render: (_, sensor) => (
        <Input
          value={sensor.location}
          style={{ width: 128 }}
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
            style={{ width: 146 }}
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
      width: 72,
      render: (_, sensor) => (
        <InputNumber
          min={0}
          max={100}
          value={sensor.x}
          style={{ width: 60 }}
          onChange={(value) => updateSensor(sensor.id, { x: typeof value === 'number' ? clamp(value, 0, 100) : sensor.x })}
        />
      ),
    },
    {
      title: 'Y',
      dataIndex: 'y',
      width: 72,
      render: (_, sensor) => (
        <InputNumber
          min={0}
          max={100}
          value={sensor.y}
          style={{ width: 60 }}
          onChange={(value) => updateSensor(sensor.id, { y: typeof value === 'number' ? clamp(value, 0, 100) : sensor.y })}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 72,
      render: (_, sensor) => (
        <Button danger size="small" onClick={() => onDeleteSensor(sensor.id)}>
          删除
        </Button>
      ),
    },
  ];

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
      modeParams: withPlantLayout(modeParams, plantLayout),
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
      width="96vw"
      style={{ top: 12 }}
      destroyOnClose
      className="site-modal"
      title={null}
    >
      <div className="site-modal-header">
        <Space direction="vertical" size={2}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            {initialSite ? '编辑站点配置' : '新建站点'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>站点管理 · Site Management</div>
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
                      onChange={(value) => {
                        setBasic((prev) => ({ ...prev, plantType: value }));
                        setPlantLayout((prev) => {
                          const nextDefault = getDefaultPlantLayout(value);
                          return {
                            ...nextDefault,
                            showPlants: prev.showPlants,
                          };
                        });
                      }}
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
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(480px, 0.95fr) minmax(0, 1.45fr)',
                gap: 18,
                alignItems: 'start',
                minHeight: 780,
              }}
            >
              <div style={{ display: 'grid', gap: 14, minWidth: 0, overflow: 'hidden', position: 'relative', zIndex: 3 }}>
                <div
                  style={{
                    border: '1px solid var(--border-base)',
                    borderRadius: 18,
                    background: 'var(--bg-card)',
                    padding: 14,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 10,
                    alignItems: 'center',
                  }}
                >
                  {sensorTypeStats.length > 0 ? sensorTypeStats.map((item) => (
                    <Badge key={item.type} count={item.count} style={{ backgroundColor: sensorColor(item.type) }} title={item.label} />
                  )) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>暂无已布设传感器</span>}
                </div>

                <Table<Sensor>
                  className="site-sensor-table"
                  size="small"
                  rowKey="id"
                  columns={sensorColumns}
                  dataSource={sensors}
                  pagination={false}
                  scroll={{ x: 760, y: 520 }}
                />

                <Button type="dashed" style={{ width: '100%' }} onClick={() => onAddSensor(quickAddType ?? 'soil_moisture')}>
                  ＋ 添加传感器
                </Button>
              </div>

              <div style={{ display: 'grid', gap: 14, minWidth: 0, position: 'relative', zIndex: 1 }}>
                <div
                  style={{
                    display: 'grid',
                    gap: 12,
                    padding: 16,
                    borderRadius: 22,
                    border: '1px solid var(--border-base)',
                    background: 'var(--bg-card)',
                    boxShadow: 'var(--shadow-card)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>田块编辑器</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>超大画布、设备拖拽、右键删除、植物点阵预览</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <Button type={drawMode === 'pipe' ? 'primary' : 'default'} onClick={() => onSetDrawMode(drawMode === 'pipe' ? 'none' : 'pipe')}>
                        {drawMode === 'pipe' ? '结束画管道' : '画管道'}
                      </Button>
                      <Button type={drawMode === 'sprinkler' ? 'primary' : 'default'} onClick={() => onSetDrawMode(drawMode === 'sprinkler' ? 'none' : 'sprinkler')}>
                        {drawMode === 'sprinkler' ? '结束画喷头' : '画喷头'}
                      </Button>
                      <Button onClick={onClearPipelines}>清除管道/喷头</Button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr) minmax(160px, 220px)', gap: 12 }}>
                    <div style={{ display: 'grid', gap: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>快速添加设备类型</span>
                      <Select
                        allowClear
                        placeholder="点击空白处时直接落点添加"
                        value={quickAddType}
                        options={quickAddOptions}
                        onChange={(value) => setQuickAddType(value)}
                      />
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'end',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                        lineHeight: 1.6,
                      }}
                    >
                      右键设备/管道/喷头可删除。未选择快速类型时，点击空白区会弹出“在此处添加传感器”。
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '140px 140px 140px 140px',
                      gap: 12,
                      alignItems: 'end',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'grid', gap: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>显示植物层</span>
                      <Switch checked={plantLayout.showPlants} onChange={(checked) => setPlantLayout((prev) => ({ ...prev, showPlants: checked }))} />
                    </div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>株距 (m)</span>
                      <InputNumber min={0.1} max={20} step={0.1} value={plantLayout.plantSpacing} onChange={(value) => setPlantLayout((prev) => ({ ...prev, plantSpacing: clamp(typeof value === 'number' ? value : prev.plantSpacing, 0.1, 20) }))} />
                    </div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>行距 (m)</span>
                      <InputNumber min={0.1} max={20} step={0.1} value={plantLayout.rowSpacing} onChange={(value) => setPlantLayout((prev) => ({ ...prev, rowSpacing: clamp(typeof value === 'number' ? value : prev.rowSpacing, 0.1, 20) }))} />
                    </div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>方向</span>
                      <Select
                        value={plantLayout.orientation}
                        options={[
                          { value: 'horizontal', label: '横向' },
                          { value: 'vertical', label: '纵向' },
                        ]}
                        onChange={(value) => setPlantLayout((prev) => ({ ...prev, orientation: value as 'horizontal' | 'vertical' }))}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.7,
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: '1px dashed color-mix(in srgb, var(--primary) 38%, var(--border-base))',
                      background: 'color-mix(in srgb, var(--bg-card) 86%, transparent)',
                    }}
                  >
                    {plantLayoutSummary}
                  </div>
                </div>

                <div
                  style={{
                    position: 'relative',
                    borderRadius: 28,
                    border: '1px solid var(--border-base)',
                    overflow: 'hidden',
                    background: 'linear-gradient(180deg, rgba(14, 24, 47, 0.98) 0%, rgba(9, 18, 36, 1) 100%)',
                    boxShadow: 'var(--shadow-elevated)',
                    minHeight: 720,
                  }}
                >
                  {addSensorAt ? (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${addSensorAt.x}%`,
                        top: `${addSensorAt.y}%`,
                        transform: 'translate(-50%, calc(-100% - 14px))',
                        zIndex: 4,
                        padding: '10px 12px',
                        borderRadius: 14,
                        border: '1px solid rgba(79, 156, 249, 0.25)',
                        background: 'rgba(12, 19, 34, 0.94)',
                        boxShadow: '0 12px 26px rgba(0, 0, 0, 0.35)',
                        display: 'grid',
                        gap: 8,
                        minWidth: 210,
                      }}
                    >
                      <div style={{ color: '#dce7ff', fontSize: 12 }}>在此处添加传感器</div>
                      <Space wrap>
                        <Button size="small" type="primary" onClick={() => onAddSensor('soil_moisture', addSensorAt.x, addSensorAt.y)}>
                          直接添加
                        </Button>
                        <Button size="small" onClick={() => setAddSensorAt(null)}>取消</Button>
                      </Space>
                    </div>
                  ) : null}

                  <svg
                    viewBox="0 0 100 100"
                    style={{ width: '100%', height: 720, display: 'block', cursor: drawMode === 'none' ? 'crosshair' : 'cell' }}
                    onMouseMove={onSvgMouseMove}
                    onMouseUp={onSvgMouseUp}
                    onMouseLeave={onSvgMouseUp}
                    onClick={onSvgClick}
                    onContextMenu={(evt) => {
                      evt.preventDefault();
                      setAddSensorAt(null);
                    }}
                  >
                    <defs>
                      <pattern id="field-grid" width="8" height="8" patternUnits="userSpaceOnUse">
                        <path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(151, 170, 204, 0.14)" strokeWidth="0.28" />
                      </pattern>
                      <linearGradient id="field-surface" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(19, 102, 255, 0.14)" />
                        <stop offset="100%" stopColor="rgba(15, 157, 128, 0.05)" />
                      </linearGradient>
                    </defs>

                    <rect x="0" y="0" width="100" height="100" fill="#08111f" />
                    <rect x="4" y="4" width="92" height="92" rx="8" fill="url(#field-surface)" stroke="rgba(19, 102, 255, 0.55)" strokeWidth="0.45" />
                    <rect x="4" y="4" width="92" height="92" rx="8" fill="url(#field-grid)" opacity="0.9" />

                    {Array.from({ length: 9 }).map((_, idx) => {
                      const pos = 10 + idx * 10;
                      return (
                        <g key={`grid-${pos}`}>
                          <line x1={pos} y1={4} x2={pos} y2={96} stroke="rgba(135, 153, 184, 0.12)" strokeWidth={0.2} />
                          <line x1={4} y1={pos} x2={96} y2={pos} stroke="rgba(135, 153, 184, 0.12)" strokeWidth={0.2} />
                        </g>
                      );
                    })}

                    {plantLayout.showPlants ? plantPositions.map((position) => (
                      isWoody ? renderTreeSymbol(position) : renderLeafSymbol(position)
                    )) : null}

                    {pipelines.map((pipeline) => {
                      if (pipeline.type === 'pipe') {
                        const x1 = clampPercent(pipeline.x1);
                        const y1 = clampPercent(pipeline.y1);
                        const x2 = clampPercent(pipeline.x2);
                        const y2 = clampPercent(pipeline.y2);
                        if (x1 === null || y1 === null || x2 === null || y2 === null) {
                          return null;
                        }

                        return (
                          <g key={pipeline.id}>
                            <line
                              x1={x1}
                              y1={y1}
                              x2={x2}
                              y2={y2}
                              stroke="#5f9eff"
                              strokeWidth={1.15}
                              strokeLinecap="round"
                              onMouseDown={(evt) => evt.stopPropagation()}
                              onContextMenu={(evt) => {
                                evt.preventDefault();
                                evt.stopPropagation();
                                onDeletePipeline(pipeline.id);
                              }}
                            />
                            <circle
                              cx={x1}
                              cy={y1}
                              r={1.35}
                              fill="#ffffff"
                              stroke="#5f9eff"
                              strokeWidth={0.4}
                              style={{ cursor: 'move' }}
                              onMouseDown={(evt) => {
                                evt.stopPropagation();
                                setDragTarget({ kind: 'pipe-start', id: pipeline.id });
                              }}
                              onContextMenu={(evt) => {
                                evt.preventDefault();
                                evt.stopPropagation();
                                onDeletePipeline(pipeline.id);
                              }}
                            />
                            <circle
                              cx={x2}
                              cy={y2}
                              r={1.35}
                              fill="#ffffff"
                              stroke="#5f9eff"
                              strokeWidth={0.4}
                              style={{ cursor: 'move' }}
                              onMouseDown={(evt) => {
                                evt.stopPropagation();
                                setDragTarget({ kind: 'pipe-end', id: pipeline.id });
                              }}
                              onContextMenu={(evt) => {
                                evt.preventDefault();
                                evt.stopPropagation();
                                onDeletePipeline(pipeline.id);
                              }}
                            />
                          </g>
                        );
                      }

                      const x = clampPercent(pipeline.x);
                      const y = clampPercent(pipeline.y);
                      if (x === null || y === null) {
                        return null;
                      }

                      return (
                        <g
                          key={pipeline.id}
                          style={{ cursor: 'move' }}
                          onMouseDown={(evt) => {
                            evt.stopPropagation();
                            setDragTarget({ kind: 'sprinkler', id: pipeline.id });
                          }}
                          onContextMenu={(evt) => {
                            evt.preventDefault();
                            evt.stopPropagation();
                            onDeletePipeline(pipeline.id);
                          }}
                        >
                          <circle cx={x} cy={y} r={3.2} fill="rgba(95, 158, 255, 0.12)" stroke="#5f9eff" strokeWidth={0.4} />
                          <circle cx={x} cy={y} r={1.2} fill="none" stroke="#5f9eff" strokeWidth={0.7} />
                          {Array.from({ length: 8 }).map((__, rayIdx) => {
                            const angle = (Math.PI * 2 * rayIdx) / 8;
                            const x2 = x + Math.cos(angle) * 2.5;
                            const y2 = y + Math.sin(angle) * 2.5;
                            return <line key={`${pipeline.id}-${rayIdx}`} x1={x} y1={y} x2={x2} y2={y2} stroke="#5f9eff" strokeWidth={0.55} />;
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
                        stroke="#5f9eff"
                        strokeWidth={0.9}
                        strokeDasharray="1.5 1.2"
                      />
                    ) : null}

                    {sensors.map((sensor, index) => {
                      const label = sensor.deviceId.trim() || `S${index + 1}`;
                      return (
                        <g
                          key={sensor.id}
                          onMouseDown={(evt) => {
                            evt.stopPropagation();
                            setDragTarget({ kind: 'sensor', id: sensor.id });
                          }}
                          onClick={(evt) => evt.stopPropagation()}
                          onContextMenu={(evt) => {
                            evt.preventDefault();
                            evt.stopPropagation();
                            onDeleteSensor(sensor.id);
                          }}
                        >
                          <title>{`${sensorTypeLabel(sensor.type)} / ${sensor.deviceId || '未填'} / ${sensor.location || '未填位置'}`}</title>
                          {renderSensorIcon(sensor)}
                          <rect
                            x={sensor.x - 3.1}
                            y={sensor.y + 4.1}
                            width={6.2}
                            height={2.9}
                            rx={1}
                            fill="rgba(11,18,35,0.84)"
                            stroke="rgba(220,231,255,0.38)"
                            strokeWidth={0.15}
                          />
                          <text x={sensor.x} y={sensor.y + 6.05} fill="#dce7ff" fontSize={1.9} textAnchor="middle">
                            {label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  <div
                    style={{
                      position: 'absolute',
                      left: 16,
                      right: 16,
                      bottom: 16,
                      display: 'flex',
                      gap: 12,
                      flexWrap: 'wrap',
                      padding: '12px 14px',
                      borderRadius: 16,
                      background: 'rgba(9, 16, 30, 0.78)',
                      border: '1px solid rgba(143, 179, 234, 0.14)',
                      color: '#dce7ff',
                      fontSize: 12,
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#0f9d80', display: 'inline-block' }} />植物</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#cf4453', display: 'inline-block' }} />灌溉设备</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#4f9cf9', display: 'inline-block' }} />土壤监测</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#0f9d80', display: 'inline-block' }} />植物监测</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#db7f2f', display: 'inline-block' }} />大气监测</span>
                  </div>
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
                    <Tag color="#1366ff" className="site-mode-tag">模式 {mode.id}</Tag>
                    <div className="site-mode-title">{mode.name}</div>
                    <div className="site-mode-desc">{mode.desc}</div>
                    {decisionMode === mode.id ? (
                      <Tag color="#1366ff" className="site-mode-selected">已选</Tag>
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
