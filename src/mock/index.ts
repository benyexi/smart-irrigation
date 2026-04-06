// Mock data for all pages — no backend required

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Site {
  id: string;
  name: string;
  plantType: string;
  soilType: string;
  climateZone: string;
  area: number;
  irrigationMethod: string;
  status: 'online' | 'offline' | 'warning';
  location: string;
  createdAt: string;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  radiation: number;
  rainfall: number;
  et0: number;
  updatedAt: string;
}

export interface PlantPhysiology {
  sapFlowRate: number;
  stemDiameterVariation: number;
  leafTurgorPressure: number;
  updatedAt: string;
}

export interface Sensor {
  id: string;
  type: string;
  deviceId: string;
  location: string;
  mqttTopic: string;
  status: 'online' | 'offline';
  latestValue: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  time: string;
  site: string;
  type: string;
  level: 'error' | 'warning' | 'info';
  content: string;
  status: '未处理' | '已处理';
}

export interface PlantInfo {
  id: number;
  name: string;
  moistureMin: number;
  moistureMax: number;
  irrigationPotential: number;
  kcReference: number;
  remark: string;
}

export interface SoilInfo {
  id: number;
  type: string;
  fieldCapacity: number;
  wiltingPoint: number;
  saturation: number;
  bulkDensity: number;
}

// ─── Sites ──────────────────────────────────────────────────────────────────

export const mockSites: Site[] = [
  {
    id: 'site001',
    name: '北京大兴苹果园 - A区',
    plantType: '苹果',
    soilType: '壤土',
    climateZone: '暖温带半湿润',
    area: 50,
    irrigationMethod: '滴灌',
    status: 'online',
    location: '北京市大兴区',
    createdAt: '2024-01-15',
  },
  {
    id: 'site002',
    name: '河北廊坊毛白杨林地',
    plantType: '毛白杨',
    soilType: '沙壤土',
    climateZone: '暖温带半湿润',
    area: 200,
    irrigationMethod: '喷灌',
    status: 'online',
    location: '河北省廊坊市',
    createdAt: '2024-02-20',
  },
  {
    id: 'site003',
    name: '山东聊城玉米试验田',
    plantType: '玉米',
    soilType: '粘土',
    climateZone: '暖温带半湿润',
    area: 30,
    irrigationMethod: '漫灌',
    status: 'warning',
    location: '山东省聊城市',
    createdAt: '2024-03-10',
  },
];

// ─── Weather ─────────────────────────────────────────────────────────────────

export const mockWeather: WeatherData = {
  temperature: 24.6,
  humidity: 62.3,
  windSpeed: 2.1,
  radiation: 524,
  rainfall: 0.0,
  et0: 3.8,
  updatedAt: '2024-04-07 10:30:00',
};

// ─── Plant Physiology ─────────────────────────────────────────────────────────

export const mockPhysiology: PlantPhysiology = {
  sapFlowRate: 138.5,
  stemDiameterVariation: -0.12,
  leafTurgorPressure: 0.68,
  updatedAt: '2024-04-07 10:30:00',
};

// ─── Soil Moisture Chart (24h, 5 depths) ─────────────────────────────────────

const hours24 = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

const genSoilSeries = (base: number) =>
  hours24.map((_, i) => +(base + Math.sin(i / 3) * 2 + (Math.random() - 0.5)).toFixed(1));

export const mockSoilMoisture = {
  xAxis: hours24,
  series: [
    { name: '20cm', data: genSoilSeries(32) },
    { name: '40cm', data: genSoilSeries(28) },
    { name: '60cm', data: genSoilSeries(25) },
    { name: '80cm', data: genSoilSeries(23) },
    { name: '100cm', data: genSoilSeries(21) },
  ],
};

// ─── Irrigation Plan vs Actual (7 days) ──────────────────────────────────────

export const mockIrrigationComparison = {
  xAxis: ['03-31', '04-01', '04-02', '04-03', '04-04', '04-05', '04-06'],
  plan: [45, 0, 52, 48, 0, 55, 50],
  actual: [43, 0, 50, 47, 0, 53, 48],
};

// ─── Sensors ─────────────────────────────────────────────────────────────────

export const mockSensors: Sensor[] = [
  {
    id: 'SEN001',
    type: '土壤水分',
    deviceId: 'SM-40-001',
    location: '40cm深',
    mqttTopic: 'site001/sensor/soil_moisture_40cm',
    status: 'online',
    latestValue: '28.5 %',
    updatedAt: '2024-04-07 10:23:45',
  },
  {
    id: 'SEN002',
    type: '土壤水势',
    deviceId: 'SP-60-001',
    location: '60cm深',
    mqttTopic: 'site001/sensor/soil_potential_60cm',
    status: 'online',
    latestValue: '-45 kPa',
    updatedAt: '2024-04-07 10:23:45',
  },
  {
    id: 'SEN003',
    type: '气象站',
    deviceId: 'WS-001',
    location: '站点中央',
    mqttTopic: 'site001/sensor/weather',
    status: 'online',
    latestValue: '25.3°C / 62%RH',
    updatedAt: '2024-04-07 10:23:50',
  },
  {
    id: 'SEN004',
    type: '液流计',
    deviceId: 'SF-001',
    location: '树干1.3m处',
    mqttTopic: 'site001/sensor/sap_flow',
    status: 'online',
    latestValue: '125.6 g/h',
    updatedAt: '2024-04-07 10:22:30',
  },
  {
    id: 'SEN005',
    type: '茎径传感器',
    deviceId: 'SD-001',
    location: '树干1.0m处',
    mqttTopic: 'site001/sensor/stem_diameter',
    status: 'offline',
    latestValue: '—',
    updatedAt: '2024-04-07 08:15:00',
  },
  {
    id: 'SEN006',
    type: '流量计',
    deviceId: 'FM-001',
    location: '主管道',
    mqttTopic: 'site001/sensor/flow_meter',
    status: 'online',
    latestValue: '3.2 m³/h',
    updatedAt: '2024-04-07 10:23:55',
  },
  {
    id: 'SEN007',
    type: '电磁阀',
    deviceId: 'EV-001',
    location: '支管1',
    mqttTopic: 'site001/valve/zone1',
    status: 'online',
    latestValue: '关闭',
    updatedAt: '2024-04-07 10:20:00',
  },
];

// ─── Valves & Pumps ───────────────────────────────────────────────────────────

export const mockValves = [
  { id: 'V1', name: '阀门1 (A区东)', status: true },
  { id: 'V2', name: '阀门2 (A区西)', status: false },
  { id: 'V3', name: '阀门3 (B区北)', status: false },
  { id: 'V4', name: '阀门4 (B区南)', status: true },
];

export const mockPumps = [
  { id: 'P1', name: '主泵', status: true },
  { id: 'P2', name: '备用泵', status: false },
];

// ─── History (30 days × 24 h) ─────────────────────────────────────────────────

const genTimestamps = () => {
  const ts: string[] = [];
  const now = new Date('2024-04-07T00:00:00');
  for (let d = 29; d >= 0; d--) {
    for (let h = 0; h < 24; h++) {
      const t = new Date(now);
      t.setDate(t.getDate() - d);
      t.setHours(h, 0, 0, 0);
      ts.push(t.toISOString().slice(0, 16).replace('T', ' '));
    }
  }
  return ts;
};

export const mockHistoryTimestamps = genTimestamps();

const sine = (i: number, base: number, amp: number, period: number) =>
  +(base + amp * Math.sin((i / period) * Math.PI * 2) + (Math.random() - 0.5) * 1.5).toFixed(2);

export const mockHistorySeries = {
  soil_moisture_40cm: mockHistoryTimestamps.map((_, i) => sine(i, 26, 6, 48)),
  soil_moisture_60cm: mockHistoryTimestamps.map((_, i) => sine(i, 23, 5, 48)),
  soil_potential_40cm: mockHistoryTimestamps.map((_, i) => sine(i, -55, 25, 48)),
  sap_flow_rate: mockHistoryTimestamps.map((_, i) => Math.max(0, sine(i, 100, 80, 24))),
  stem_diameter_variation: mockHistoryTimestamps.map((_, i) => sine(i, 0, 0.4, 24)),
  temperature: mockHistoryTimestamps.map((_, i) => sine(i, 22, 8, 24)),
  rainfall: mockHistoryTimestamps.map(() => (Math.random() > 0.95 ? +(Math.random() * 8).toFixed(1) : 0)),
};

export const metricLabels: Record<string, string> = {
  soil_moisture_40cm: '土壤含水率 40cm (%)',
  soil_moisture_60cm: '土壤含水率 60cm (%)',
  soil_potential_40cm: '土壤水势 40cm (kPa)',
  sap_flow_rate: '液流速率 (g/h)',
  stem_diameter_variation: '茎径变化 (mm)',
  temperature: '温度 (°C)',
  rainfall: '降雨量 (mm)',
};

// ─── Alerts ───────────────────────────────────────────────────────────────────

export const mockAlerts: Alert[] = [
  {
    id: 'ALT001',
    time: '2024-04-07 09:15:23',
    site: '北京大兴苹果园 - A区',
    type: '土壤水分',
    level: 'warning',
    content: '40cm深土壤含水率降至18.2%，低于灌溉下限阈值20%',
    status: '未处理',
  },
  {
    id: 'ALT002',
    time: '2024-04-07 08:30:10',
    site: '北京大兴苹果园 - A区',
    type: '传感器',
    level: 'error',
    content: '茎径传感器 SD-001 失联，最后通信时间 08:15:00',
    status: '未处理',
  },
  {
    id: 'ALT003',
    time: '2024-04-07 07:45:00',
    site: '河北廊坊毛白杨林地',
    type: '植物水分',
    level: 'warning',
    content: '液流速率连续2小时低于阈值50 g/h，疑似水分亏缺',
    status: '未处理',
  },
  {
    id: 'ALT004',
    time: '2024-04-06 16:20:00',
    site: '山东聊城玉米试验田',
    type: '设备',
    level: 'error',
    content: '电磁阀 EV-003 开启指令发送后未响应，请检查设备',
    status: '已处理',
  },
  {
    id: 'ALT005',
    time: '2024-04-06 14:10:00',
    site: '北京大兴苹果园 - A区',
    type: '土壤水分',
    level: 'info',
    content: '60cm深土壤含水率达到灌溉上限35%，已自动停止灌溉',
    status: '已处理',
  },
  {
    id: 'ALT006',
    time: '2024-04-06 11:30:00',
    site: '河北廊坊毛白杨林地',
    type: '设备',
    level: 'warning',
    content: '过滤器压差超过0.05MPa，建议清洗过滤器',
    status: '已处理',
  },
  {
    id: 'ALT007',
    time: '2024-04-06 09:00:00',
    site: '山东聊城玉米试验田',
    type: '土壤水势',
    level: 'warning',
    content: '土壤水势达到-80kPa，已触发灌溉决策',
    status: '已处理',
  },
  {
    id: 'ALT008',
    time: '2024-04-05 18:45:00',
    site: '北京大兴苹果园 - A区',
    type: '设备',
    level: 'error',
    content: '主泵运行电流异常，超过额定电流15%',
    status: '已处理',
  },
  {
    id: 'ALT009',
    time: '2024-04-05 15:20:00',
    site: '河北廊坊毛白杨林地',
    type: '传感器',
    level: 'warning',
    content: '气象站 WS-002 数据异常，辐射值持续为0',
    status: '已处理',
  },
  {
    id: 'ALT010',
    time: '2024-04-05 10:00:00',
    site: '山东聊城玉米试验田',
    type: '植物水分',
    level: 'info',
    content: '茎干直径变化量恢复正常范围，水分亏缺已解除',
    status: '已处理',
  },
];

// ─── Knowledge ────────────────────────────────────────────────────────────────

export const mockPlants: PlantInfo[] = [
  { id: 1, name: '毛白杨', moistureMin: 15, moistureMax: 35, irrigationPotential: -60, kcReference: 1.05, remark: '速生树种，生长季需水量大，对水分亏缺敏感' },
  { id: 2, name: '苹果', moistureMin: 18, moistureMax: 32, irrigationPotential: -50, kcReference: 1.10, remark: '果实膨大期和花芽分化期需保证充足水分' },
  { id: 3, name: '梨', moistureMin: 17, moistureMax: 30, irrigationPotential: -55, kcReference: 1.05, remark: '对涝害较敏感，注意排水' },
  { id: 4, name: '桃', moistureMin: 16, moistureMax: 28, irrigationPotential: -45, kcReference: 1.00, remark: '耐旱性较强，过度灌溉易导致根腐' },
  { id: 5, name: '玉米', moistureMin: 20, moistureMax: 38, irrigationPotential: -40, kcReference: 1.20, remark: '抽雄吐丝期为需水关键期，缺水减产明显' },
  { id: 6, name: '小麦', moistureMin: 18, moistureMax: 35, irrigationPotential: -50, kcReference: 1.15, remark: '拔节期和灌浆期为需水高峰' },
  { id: 7, name: '棉花', moistureMin: 14, moistureMax: 30, irrigationPotential: -65, kcReference: 1.05, remark: '耐旱性较强，花铃期需水量最大' },
  { id: 8, name: '大豆', moistureMin: 20, moistureMax: 36, irrigationPotential: -45, kcReference: 1.10, remark: '鼓粒期对水分最敏感，缺水影响粒重' },
];

export const mockSoils: SoilInfo[] = [
  { id: 1, type: '沙土', fieldCapacity: 12, wiltingPoint: 4, saturation: 38, bulkDensity: 1.65 },
  { id: 2, type: '沙壤土', fieldCapacity: 18, wiltingPoint: 7, saturation: 42, bulkDensity: 1.55 },
  { id: 3, type: '壤土', fieldCapacity: 25, wiltingPoint: 12, saturation: 46, bulkDensity: 1.40 },
  { id: 4, type: '粘壤土', fieldCapacity: 32, wiltingPoint: 18, saturation: 50, bulkDensity: 1.30 },
  { id: 5, type: '粘土', fieldCapacity: 40, wiltingPoint: 25, saturation: 55, bulkDensity: 1.20 },
];

// ─── Map Sites ────────────────────────────────────────────────────────────────

export interface MapSite {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'irrigating' | 'standby' | 'alarm' | 'offline';
  plantType: string;
  sapFlowRate: number;
  soilMoisture: number;
  area: number;
}

export const mockMapSites: MapSite[] = [
  { id: 'ms001', name: '北京大兴苹果园 A区', lat: 39.726, lng: 116.341, status: 'irrigating', plantType: '苹果', sapFlowRate: 138.5, soilMoisture: 28.4, area: 50 },
  { id: 'ms002', name: '河北廊坊毛白杨林地', lat: 39.538, lng: 116.683, status: 'standby', plantType: '毛白杨', sapFlowRate: 95.2, soilMoisture: 32.1, area: 200 },
  { id: 'ms003', name: '山东聊城玉米试验田', lat: 36.456, lng: 115.985, status: 'alarm', plantType: '玉米', sapFlowRate: 42.3, soilMoisture: 18.6, area: 30 },
  { id: 'ms004', name: '山西运城葡萄园', lat: 35.022, lng: 111.003, status: 'irrigating', plantType: '葡萄', sapFlowRate: 112.7, soilMoisture: 25.8, area: 80 },
  { id: 'ms005', name: '河北保定小麦示范区', lat: 38.873, lng: 115.464, status: 'standby', plantType: '小麦', sapFlowRate: 78.4, soilMoisture: 35.2, area: 120 },
  { id: 'ms006', name: '北京顺义梨园', lat: 40.128, lng: 116.654, status: 'offline', plantType: '梨', sapFlowRate: 0, soilMoisture: 22.1, area: 40 },
];

// ─── Extended history data (multi-depth) ─────────────────────────────────────
const sine2 = (i: number, base: number, amp: number, period: number) =>
  +(base + amp * Math.sin((i / period) * Math.PI * 2) + (Math.random() - 0.5) * 1.2).toFixed(2);
export const mockHistoryData = {
  soil_moisture_20cm: mockHistoryTimestamps.map((_: string, i: number) => sine2(i, 32, 5, 48)),
  soil_moisture_40cm: mockHistoryTimestamps.map((_: string, i: number) => sine2(i, 28, 5, 48)),
  soil_moisture_60cm: mockHistoryTimestamps.map((_: string, i: number) => sine2(i, 25, 4, 48)),
  soil_moisture_80cm: mockHistoryTimestamps.map((_: string, i: number) => sine2(i, 23, 3, 48)),
  soil_moisture_100cm: mockHistoryTimestamps.map((_: string, i: number) => sine2(i, 21, 3, 48)),
  soil_potential_40cm: mockHistoryTimestamps.map((_: string, i: number) => sine2(i, -55, 25, 48)),
  sap_flow_rate: mockHistoryTimestamps.map((_: string, i: number) => Math.max(0, sine2(i, 100, 80, 24))),
  stem_diameter_variation: mockHistoryTimestamps.map((_: string, i: number) => sine2(i, 0, 0.4, 24)),
  temperature: mockHistoryTimestamps.map((_: string, i: number) => sine2(i, 22, 8, 24)),
  rainfall: mockHistoryTimestamps.map(() => (Math.random() > 0.95 ? +(Math.random() * 8).toFixed(1) : 0)),
};

// ─── Dashboard aggregated data ────────────────────────────────────────────────
export const mockDashboard = {
  weather: { temperature: 24.6, humidity: 62.3, windSpeed: 2.1, radiation: 524, rainfall: 0.0, et0: 3.8 },
  plantPhysiology: { sapFlowRate: 138.5, stemDiameterVariation: -0.12, leafTurgorPressure: 0.68 },
  soilMoisture: { depth20: 32.1, depth40: 28.4, depth60: 25.2, depth80: 23.1, depth100: 21.5 },
  irrigationToday: { volume: 142.6, duration: 95, status: 'completed' },
};
