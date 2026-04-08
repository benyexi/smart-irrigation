export interface Sensor {
  id: string;
  type: 'soil_moisture' | 'soil_potential' | 'weather_station' |
        'sapflow' | 'stem_diameter' | 'leaf_turgor' |
        'flow_meter' | 'valve' | 'pump';
  deviceId: string;
  location: string;
  topic: string;
  x: number;
  y: number;
}

export interface Pipeline {
  id: string;
  type: 'pipe' | 'sprinkler';
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  x?: number;
  y?: number;
}

export interface AlarmRule {
  key: string;
  enabled: boolean;
  notify: ('wechat' | 'sms' | 'email')[];
}

export interface ModeParams {
  startTime?: string;
  endTime?: string;
  waterAmount?: number;
  kc?: number;
  et0Source?: 'auto' | 'manual';
  rainDiscount?: number;
  lowerLimit?: number;
  upperLimit?: number;
  referenceDepths?: string[];
  startPressure?: number;
  stopPressure?: number;
  sapflowMin?: number;
  stemDiameterThreshold?: number;
  turgorMin?: number;
  weights?: { sapflow: number; stem: number; turgor: number };
}

export interface Site {
  id: string;
  name: string;
  province: string;
  city: string;
  lat: number;
  lng: number;
  plantType: string;
  soilType: string;
  climateZone: string;
  area: number;
  irrigationType: 'drip' | 'spray' | 'flood';
  sensors: Sensor[];
  pipelines: Pipeline[];
  decisionMode: 1 | 2 | 3 | 4 | 5 | null;
  modeParams: ModeParams;
  alarmRules: AlarmRule[];
  status: 'running' | 'pending' | 'alarm';
  createdAt: string;
  updatedAt: string;
}
