import type { Site } from '../types/site';

const KEY = 'siz_sites';
const CURRENT_KEY = 'siz_current_site';

const DEMO_SITES: Site[] = [
  {
    id: 'site-001',
    name: '陕西苹果示范园',
    province: '陕西省', city: '延安市',
    lat: 36.59, lng: 109.49,
    plantType: '苹果', soilType: '壤土',
    climateZone: '暖温带半湿润',
    area: 200, irrigationType: 'drip',
    sensors: [
      { id: 's1', type: 'soil_moisture', deviceId: 'SN-001',
        location: '距树干30cm深40cm',
        topic: 'site/shaanxi/soil_moisture/001', x: 30, y: 40 },
      { id: 's2', type: 'sapflow', deviceId: 'SF-001',
        location: '树干1.3m处',
        topic: 'site/shaanxi/sapflow/001', x: 50, y: 50 },
      { id: 's3', type: 'valve', deviceId: 'VL-001',
        location: '主管道入口',
        topic: 'site/shaanxi/valve/001', x: 10, y: 10 },
    ],
    pipelines: [
      { id: 'p1', type: 'pipe', x1: 10, y1: 10, x2: 90, y2: 10 },
      { id: 'p2', type: 'pipe', x1: 90, y1: 10, x2: 90, y2: 90 },
      { id: 'sp1', type: 'sprinkler', x: 50, y: 30 },
      { id: 'sp2', type: 'sprinkler', x: 50, y: 70 },
    ],
    decisionMode: 5,
    modeParams: {
      sapflowMin: 80, stemDiameterThreshold: 0.3,
      turgorMin: 0.2,
      weights: { sapflow: 40, stem: 35, turgor: 25 }
    },
    alarmRules: [
      { key: 'valveNotOpen', enabled: true, notify: ['wechat'] },
      { key: 'sensorOffline', enabled: true, notify: ['wechat', 'sms'] },
    ],
    status: 'running',
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-04-01T08:00:00Z',
  },
  {
    id: 'site-002',
    name: '河北毛白杨林场',
    province: '河北省', city: '保定市',
    lat: 38.87, lng: 115.46,
    plantType: '毛白杨', soilType: '沙壤土',
    climateZone: '暖温带半湿润',
    area: 500, irrigationType: 'flood',
    sensors: [
      { id: 's4', type: 'soil_potential', deviceId: 'SP-001',
        location: '深60cm',
        topic: 'site/hebei/soil_potential/001', x: 40, y: 60 },
      { id: 's5', type: 'weather_station', deviceId: 'WS-001',
        location: '林场中央',
        topic: 'site/hebei/weather/001', x: 50, y: 20 },
    ],
    pipelines: [],
    decisionMode: 4,
    modeParams: { startPressure: -40, stopPressure: -10 },
    alarmRules: [],
    status: 'running',
    createdAt: '2026-02-15T08:00:00Z',
    updatedAt: '2026-03-20T08:00:00Z',
  },
  {
    id: 'site-003',
    name: '山东玉米试验田',
    province: '山东省', city: '济南市',
    lat: 36.65, lng: 117.12,
    plantType: '玉米', soilType: '粘壤土',
    climateZone: '暖温带半湿润',
    area: 100, irrigationType: 'spray',
    sensors: [], pipelines: [],
    decisionMode: null, modeParams: {},
    alarmRules: [], status: 'pending',
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-04-01T08:00:00Z',
  },
];

export function getSites(): Site[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    localStorage.setItem(KEY, JSON.stringify(DEMO_SITES));
    return DEMO_SITES;
  }
  return JSON.parse(raw);
}

export function saveSite(site: Site): void {
  const sites = getSites();
  const idx = sites.findIndex(s => s.id === site.id);
  if (idx >= 0) sites[idx] = site;
  else sites.push(site);
  localStorage.setItem(KEY, JSON.stringify(sites));
}

export function deleteSite(id: string): void {
  const sites = getSites().filter(s => s.id !== id);
  localStorage.setItem(KEY, JSON.stringify(sites));
}

export function getCurrentSiteId(): string {
  return localStorage.getItem(CURRENT_KEY) || 'site-001';
}

export function setCurrentSiteId(id: string): void {
  localStorage.setItem(CURRENT_KEY, id);
}
