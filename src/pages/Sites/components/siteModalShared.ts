import type { AlarmRule, ModeParams, Sensor, Site } from '../../../types/site';
import type { PlantLayoutSettings } from '../fieldTemplates';

export type DrawMode = 'none' | 'pipe' | 'sprinkler';
export type QuickAddSensorType = Sensor['type'] | undefined;

export type DragTarget =
  | { kind: 'sensor'; id: string }
  | { kind: 'sprinkler'; id: string }
  | { kind: 'pipe-start'; id: string }
  | { kind: 'pipe-end'; id: string }
  | null;

export interface BasicState {
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

export interface PlantPosition {
  id: string;
  x: number;
  y: number;
}

export type ExtendedModeParams = ModeParams & { plantLayout?: PlantLayoutSettings };

export const provinces = [
  '北京市', '天津市', '上海市', '重庆市', '河北省', '山西省', '辽宁省', '吉林省', '黑龙江省',
  '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省', '河南省', '湖北省', '湖南省',
  '广东省', '海南省', '四川省', '贵州省', '云南省', '陕西省', '甘肃省', '青海省', '台湾省',
  '内蒙古自治区', '广西壮族自治区', '西藏自治区', '宁夏回族自治区', '新疆维吾尔自治区',
  '香港特别行政区', '澳门特别行政区',
];

export const plantOptions = ['毛白杨', '苹果', '梨', '桃', '葡萄', '玉米', '小麦', '棉花', '其他'];
export const soilOptions = ['沙土', '沙壤土', '壤土', '粘壤土', '粘土'];
export const climateOptions = ['暖温带半湿润', '温带半干旱', '亚热带湿润', '其他'];
export const referenceDepthOptions = ['20cm', '40cm', '60cm', '80cm'];

export const sensorTypeOptions: Array<{ value: Sensor['type']; label: string }> = [
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

export const quickAddOptions = sensorTypeOptions.filter((item) => [
  'soil_moisture',
  'weather_station',
  'sapflow',
  'flow_meter',
  'valve',
  'pump',
].includes(item.value));

export const decisionModes: Array<{ id: 1 | 2 | 3 | 4 | 5; name: string; desc: string }> = [
  { id: 1, name: '定时灌溉', desc: '按时段和目标水量执行灌溉。' },
  { id: 2, name: 'ET₀计算法 FAO-56', desc: '按参考蒸散量和作物系数计算需水。' },
  { id: 3, name: '土壤含水率阈值', desc: '低于下限开灌，高于上限停灌。' },
  { id: 4, name: '土壤水势阈值', desc: '按水势阈值控制灌溉启停。' },
  { id: 5, name: '植物水分亏缺指标（推荐）', desc: '融合液流、茎径、膨压综合评分。' },
];

export const systemAlarmDefs = [
  { key: 'valveNotOpen', label: '电磁阀未开启' },
  { key: 'filterBlocked', label: '过滤器堵塞（压差>0.05MPa）' },
  { key: 'pipeBreak', label: '管道破裂（流量偏差>30%）' },
  { key: 'pumpError', label: '水泵/电机异常' },
  { key: 'sensorOffline', label: '传感器断联（>30min）' },
];

export const dataAlarmDefs = [
  { key: 'soilWaterHigh', label: '土壤含水率超上限' },
  { key: 'soilWaterLow', label: '土壤含水率低于下限' },
  { key: 'sapflowAbnormal', label: '液流速率异常（<50g/h）' },
  { key: 'stemShrink', label: '茎径收缩超阈值' },
  { key: 'et0High', label: 'ET₀连续3天>6mm' },
];

export const alarmDefs = [...systemAlarmDefs, ...dataAlarmDefs];

export const clamp = (value: number, min: number, max: number) => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

export const clampPercent = (value: number | undefined | null) => {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    return null;
  }
  return clamp(value, 0, 100);
};

export const defaultBasicState = (): BasicState => ({
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

export const defaultModeParams = (): ModeParams => ({
  rainDiscount: 0.75,
  referenceDepths: ['40cm'],
  weights: { sapflow: 40, stem: 35, turgor: 25 },
});

export const defaultAlarmRules = (): AlarmRule[] =>
  alarmDefs.map((item) => ({
    key: item.key,
    enabled: true,
    notify: ['wechat'],
  }));

export const mergeAlarmRules = (rules: AlarmRule[]): AlarmRule[] => {
  const ruleMap = new Map(rules.map((rule) => [rule.key, rule]));
  return alarmDefs.map((def) => {
    const existing = ruleMap.get(def.key);
    if (existing) return existing;
    return { key: def.key, enabled: true, notify: ['wechat'] };
  });
};

export const sensorTypeLabel = (type: Sensor['type']) => {
  const target = sensorTypeOptions.find((item) => item.value === type);
  return target ? target.label : type;
};

const sensorCategory = (type: Sensor['type']) => {
  if (type === 'soil_moisture' || type === 'soil_potential') return 'soil';
  if (type === 'weather_station') return 'atmosphere';
  if (type === 'sapflow' || type === 'stem_diameter' || type === 'leaf_turgor') return 'plant';
  return 'irrigation';
};

export const sensorColor = (type: Sensor['type']) => {
  const category = sensorCategory(type);
  if (category === 'soil') return '#4f9cf9';
  if (category === 'atmosphere') return '#db7f2f';
  if (category === 'plant') return '#0f9d80';
  return '#cf4453';
};

export const clampSpacing = (value: unknown, fallback: number) => {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    return fallback;
  }
  return clamp(value, 0.1, 20);
};

export const getStoredPlantLayout = (params: ModeParams | null | undefined, plantType: string, getDefaultPlantLayout: (value: string) => PlantLayoutSettings) => {
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

export const withPlantLayout = (params: ModeParams, plantLayout: PlantLayoutSettings): ModeParams => ({
  ...params,
  plantLayout,
} as ExtendedModeParams);
